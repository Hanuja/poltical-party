<?php
// Event registration & QR ticket system — database migration (safe to run any number of times).
//
// Run ONE of these on the server itself:
//   php backend/database/migrate_registrations.php
//   http://localhost/poltical%20party/backend/database/migrate_registrations.php   (only answers 127.0.0.1 / ::1)
//
// It inspects the live schema and only adds what is missing — no column, row or table is ever dropped:
//   event_registrations  + ticket_code (UNIQUE), organization, designation, status, checked_in_at,
//                        checked_in_by, updated_at, indexes; keeps UNIQUE (event_id, email)
//   activity_history     new audit table (FK → event_registrations / events, ON DELETE SET NULL)
// Existing registrations without a ticket code get a random, unguessable one.
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

$cli = PHP_SAPI === 'cli';
if (!$cli) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($ip, ['127.0.0.1', '::1'], true)) { http_response_code(403); exit('Run this migration on the server itself.'); }
    header('Content-Type: text/plain; charset=utf-8');
}

$pdo = db();
$dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
$log = [];
$problems = 0;

function q1(PDO $pdo, string $sql, array $p): bool { $s = $pdo->prepare($sql); $s->execute($p); return (bool)$s->fetchColumn(); }
function has_table(PDO $pdo, string $db, string $t): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [$db, $t]);
}
function has_col(PDO $pdo, string $db, string $t, string $c): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [$db, $t, $c]);
}
function has_index(PDO $pdo, string $db, string $t, string $i): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?', [$db, $t, $i]);
}
function has_unique_on(PDO $pdo, string $db, string $t, string $cols): bool {
    // true if some UNIQUE index covers exactly these columns (in order), whatever it is called
    $s = $pdo->prepare("SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) c FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND NON_UNIQUE=0 GROUP BY INDEX_NAME");
    $s->execute([$db, $t]);
    foreach ($s->fetchAll() as $r) if (strcasecmp($r['c'], $cols) === 0) return true;
    return false;
}
function has_fk(PDO $pdo, string $db, string $t, string $col): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL', [$db, $t, $col]);
}
$step = function (string $label, string $sql) use ($pdo, &$log, &$problems) {
    try { $pdo->exec($sql); $log[] = "  + $label"; }
    catch (Throwable $e) { $problems++; $log[] = "  ! $label — " . $e->getMessage(); }
};

if (!has_table($pdo, $dbName, 'events') || !has_table($pdo, $dbName, 'event_registrations')) {
    exit("The events / event_registrations tables are missing. Import backend/database/political_party_db.sql first.\n");
}

// ---------- event_registrations ----------
$log[] = 'event_registrations';
$T = 'event_registrations';
$cols = [
    'ticket_code'   => 'ADD COLUMN ticket_code VARCHAR(32) NULL AFTER event_id',
    'organization'  => 'ADD COLUMN organization VARCHAR(255) NULL AFTER phone',
    'designation'   => 'ADD COLUMN designation VARCHAR(150) NULL AFTER organization',
    'status'        => "ADD COLUMN status ENUM('registered','checked_in','cancelled') NOT NULL DEFAULT 'registered' AFTER designation",
    'checked_in_at' => 'ADD COLUMN checked_in_at DATETIME NULL AFTER status',
    'checked_in_by' => 'ADD COLUMN checked_in_by VARCHAR(150) NULL AFTER checked_in_at',
    'updated_at'    => 'ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
];
foreach ($cols as $c => $ddl) {
    if (!has_col($pdo, $dbName, $T, $c)) $step("column $c", "ALTER TABLE $T $ddl");
}
// widen columns the original schema made too short for real names / addresses
$step('name / email / phone sizes', "ALTER TABLE $T MODIFY name VARCHAR(150) NOT NULL, MODIFY email VARCHAR(150) NOT NULL, MODIFY phone VARCHAR(30) NULL");

// every registration needs a ticket code before the UNIQUE index goes on
$alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
$code = function () use ($alphabet) {
    $g = fn() => implode('', array_map(fn() => $alphabet[random_int(0, strlen($alphabet) - 1)], range(1, 4)));
    return 'TKT-' . $g() . '-' . $g() . '-' . $g();
};
$missing = $pdo->query("SELECT id FROM $T WHERE ticket_code IS NULL OR ticket_code=''")->fetchAll(PDO::FETCH_COLUMN);
foreach ($missing as $id) {
    $pdo->prepare("UPDATE $T SET ticket_code=? WHERE id=?")->execute([$code(), $id]);
}
if ($missing) $log[] = '  + ticket codes generated for ' . count($missing) . ' existing registration(s)';
// legacy sequential codes (TKT-000001…) are guessable: replace them, keeping a note in the audit log below
$legacy = $pdo->query("SELECT id, ticket_code FROM $T WHERE ticket_code REGEXP '^TKT-[0-9]+$'")->fetchAll();

if (!has_unique_on($pdo, $dbName, $T, 'ticket_code')) $step('UNIQUE ticket_code', "ALTER TABLE $T ADD UNIQUE KEY uq_reg_ticket (ticket_code)");
if (!has_unique_on($pdo, $dbName, $T, 'event_id,email')) $step('UNIQUE (event_id, email)', "ALTER TABLE $T ADD UNIQUE KEY uq_reg_event_email (event_id, email)");
foreach ([
    'idx_reg_status'    => '(status)',
    'idx_reg_event_st'  => '(event_id, status)',
    'idx_reg_created'   => '(created_at)',
    'idx_reg_checkin'   => '(checked_in_at)',
] as $ix => $def) {
    if (!has_index($pdo, $dbName, $T, $ix)) $step("index $ix", "ALTER TABLE $T ADD INDEX $ix $def");
}
$step('table engine InnoDB', "ALTER TABLE $T ENGINE=InnoDB");

// ---------- activity_history ----------
$log[] = 'activity_history';
$H = 'activity_history';
if (!has_table($pdo, $dbName, $H)) {
    $step('create table', "CREATE TABLE $H (
        id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        registration_id INT UNSIGNED NULL,
        event_id        INT UNSIGNED NULL,
        ticket_code     VARCHAR(32)  NULL,
        attendee_name   VARCHAR(150) NULL,
        action_type     VARCHAR(40)  NOT NULL,
        details         VARCHAR(500) NULL,
        performed_by    VARCHAR(150) NULL,
        ip_address      VARCHAR(45)  NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ah_created (created_at),
        INDEX idx_ah_action (action_type, created_at),
        INDEX idx_ah_ticket (ticket_code),
        INDEX idx_ah_reg (registration_id),
        INDEX idx_ah_event (event_id),
        CONSTRAINT fk_ah_reg   FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE SET NULL,
        CONSTRAINT fk_ah_event FOREIGN KEY (event_id)        REFERENCES events(id)              ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} else {
    // table already existed (earlier draft): bring it up to the same shape
    foreach ([
        'registration_id' => 'ADD COLUMN registration_id INT UNSIGNED NULL',
        'event_id'        => 'ADD COLUMN event_id INT UNSIGNED NULL AFTER registration_id',
        'ticket_code'     => 'ADD COLUMN ticket_code VARCHAR(32) NULL',
        'attendee_name'   => 'ADD COLUMN attendee_name VARCHAR(150) NULL AFTER ticket_code',
        'action_type'     => "ADD COLUMN action_type VARCHAR(40) NOT NULL DEFAULT 'NOTE'",
        'details'         => 'ADD COLUMN details VARCHAR(500) NULL',
        'performed_by'    => 'ADD COLUMN performed_by VARCHAR(150) NULL',
        'ip_address'      => 'ADD COLUMN ip_address VARCHAR(45) NULL',
        'created_at'      => 'ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ] as $c => $ddl) {
        if (!has_col($pdo, $dbName, $H, $c)) $step("column $c", "ALTER TABLE $H $ddl");
    }
    $step('column types', "ALTER TABLE $H MODIFY registration_id INT UNSIGNED NULL, MODIFY event_id INT UNSIGNED NULL, MODIFY ticket_code VARCHAR(32) NULL");
    foreach ([
        'idx_ah_created' => '(created_at)', 'idx_ah_action' => '(action_type, created_at)',
        'idx_ah_ticket' => '(ticket_code)', 'idx_ah_reg' => '(registration_id)', 'idx_ah_event' => '(event_id)',
    ] as $ix => $def) {
        if (!has_index($pdo, $dbName, $H, $ix)) $step("index $ix", "ALTER TABLE $H ADD INDEX $ix $def");
    }
    $step('table engine InnoDB', "ALTER TABLE $H ENGINE=InnoDB");
    // fill in event / attendee for rows written by the earlier draft, and drop links to deleted registrations
    $step('backfill event & attendee', "UPDATE $H h JOIN event_registrations r ON r.id=h.registration_id
        SET h.event_id=COALESCE(h.event_id, r.event_id), h.attendee_name=COALESCE(h.attendee_name, r.name)");
    $step('detach orphaned rows', "UPDATE $H h LEFT JOIN event_registrations r ON r.id=h.registration_id SET h.registration_id=NULL WHERE h.registration_id IS NOT NULL AND r.id IS NULL");
    $step('detach rows of deleted events', "UPDATE $H h LEFT JOIN events e ON e.id=h.event_id SET h.event_id=NULL WHERE h.event_id IS NOT NULL AND e.id IS NULL");
    if (!has_fk($pdo, $dbName, $H, 'registration_id')) $step('foreign key → event_registrations', "ALTER TABLE $H ADD CONSTRAINT fk_ah_reg FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE SET NULL");
    if (!has_fk($pdo, $dbName, $H, 'event_id')) $step('foreign key → events', "ALTER TABLE $H ADD CONSTRAINT fk_ah_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL");
}

// replace guessable legacy ticket codes now that the audit table exists
foreach ($legacy as $r) {
    $new = $code();
    $pdo->prepare("UPDATE $T SET ticket_code=? WHERE id=?")->execute([$new, $r['id']]);
    $pdo->prepare("UPDATE $H SET ticket_code=? WHERE ticket_code=?")->execute([$new, $r['ticket_code']]);
    $pdo->prepare("INSERT INTO $H (registration_id, event_id, ticket_code, attendee_name, action_type, details, performed_by)
        SELECT id, event_id, ticket_code, name, 'DETAILS_UPDATED', ?, 'system' FROM $T WHERE id=?")
        ->execute(["Ticket code {$r['ticket_code']} replaced with a secure code", $r['id']]);
}
if ($legacy) $log[] = '  + replaced ' . count($legacy) . ' sequential ticket code(s) with secure codes';

$log[] = $problems ? "Finished with $problems problem(s) — see lines marked '!'." : 'Done. The schema is up to date.';
echo implode("\n", $log), "\n";
