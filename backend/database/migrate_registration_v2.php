<?php
// Registration v2 migration — NIC number, special requirements, registration method.
// Idempotent: safe to run any number of times. Same pattern as migrate_registrations.php.
//
//   php backend/database/migrate_registration_v2.php
//   http://localhost/poltical%20party/backend/database/migrate_registration_v2.php (127.0.0.1 only)
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
function has_col(PDO $pdo, string $db, string $t, string $c): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [$db, $t, $c]);
}
function has_index(PDO $pdo, string $db, string $t, string $i): bool {
    return q1($pdo, 'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?', [$db, $t, $i]);
}
$step = function (string $label, string $sql) use ($pdo, &$log, &$problems) {
    try { $pdo->exec($sql); $log[] = "  + $label"; }
    catch (Throwable $e) { $problems++; $log[] = "  ! $label — " . $e->getMessage(); }
};

if (!q1($pdo, 'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [$dbName, 'event_registrations'])) {
    exit("The event_registrations table is missing. Import backend/database/political_party_db.sql and run migrate_registrations.php first.\n");
}

$T = 'event_registrations';
$log[] = $T;

if (!has_col($pdo, $dbName, $T, 'nic_number'))           $step('column nic_number', "ALTER TABLE $T ADD COLUMN nic_number VARCHAR(30) NULL AFTER phone");
if (!has_col($pdo, $dbName, $T, 'special_requirements')) $step('column special_requirements', "ALTER TABLE $T ADD COLUMN special_requirements TEXT NULL AFTER designation");
if (!has_col($pdo, $dbName, $T, 'reg_method'))           $step("column reg_method", "ALTER TABLE $T ADD COLUMN reg_method ENUM('website','qr','admin') NOT NULL DEFAULT 'website' AFTER special_requirements");

if (!has_index($pdo, $dbName, $T, 'idx_reg_nic')) $step('index idx_reg_nic', "ALTER TABLE $T ADD INDEX idx_reg_nic (event_id, nic_number)");

// UNIQUE (event_id, nic_number): only safe once no duplicate NICs exist within an event.
// Rows with NULL NIC never conflict. Duplicates are reported, not silently merged.
if (!has_index($pdo, $dbName, $T, 'uq_reg_event_nic')) {
    $dupes = $pdo->query("SELECT event_id, nic_number, COUNT(*) c FROM $T
        WHERE nic_number IS NOT NULL AND nic_number<>''
        GROUP BY event_id, nic_number HAVING c>1 LIMIT 5")->fetchAll();
    if ($dupes) {
        $log[] = '  ! skipped UNIQUE (event_id, nic_number) — duplicate NICs exist:';
        foreach ($dupes as $d) $log[] = "      event {$d['event_id']} NIC {$d['nic_number']} x{$d['c']}";
        $problems++;
    } else {
        $step('UNIQUE (event_id, nic_number)', "ALTER TABLE $T ADD UNIQUE KEY uq_reg_event_nic (event_id, nic_number)");
    }
}

$log[] = $problems ? "Finished with $problems problem(s) — see lines marked '!'." : 'Done. The schema is up to date.';
echo implode("\n", $log), "\n";
