<?php
// Event Registrations API — registration, digital tickets, QR check-in, admin management, audit log, exports.
// Response envelope everywhere: { success, data?, error? }  (helpers/response.php)
//
// PUBLIC
//   POST /api/registrations/                         register  {eventId, fullName, email, phone, organization, designation}
//                                                    201 ticket · 409 DUPLICATE / CLOSED / FULL · 422 {errors} · 404 event
//   GET  /api/registrations/?ticket=TKT-…&lang=      the attendee's ticket (bearer code; phone never returned)
//   GET  /api/registrations/?action=event&code=…     resolve a scanned event QR → event + registrationStatus · 422 INVALID_QR / TICKET_QR · 404
//   POST /api/registrations/?action=find             {eventId?, email, phone} → the attendee's ticket codes
// STAFF (Bearer token, admin roles)
//   POST /api/registrations/?action=scan             {code, eventId?, source} → CHECKED_IN 200 · ALREADY_CHECKED_IN 409 ·
//                                                    CANCELLED 410 · WRONG_EVENT 409 · INVALID 404
//   GET  /api/registrations/?stats=1[&event_id=]     KPI counts
//   GET  /api/registrations/?admin=1&…filters&page&limit       paginated list (filters run in MySQL)
//   GET  /api/registrations/?admin=1&id=N            one registration + its activity history
//   PUT  /api/registrations/?id=N                    edit attendee details / status
//   POST /api/registrations/?action=cancel&id=N      cancel
//   GET  /api/registrations/?history=1&…             activity history (paginated, newest first)
//   GET  /api/registrations/?export=registrations|checkins&…filters   CSV
// Filters: q, status, event_id, from, to, checkin_date, organization, designation
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__, 2) . '/helpers/registration.php';
require_once dirname(__DIR__, 2) . '/middleware/rate_limit.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string)($_GET['action'] ?? '');

// =====================================================================================
// PUBLIC: register
// =====================================================================================
if ($method === 'POST' && $action === '') {
    rate_limit('reg:' . reg_client_ip(), 20, 600);
    $b = request_body();
    $eventId = (int)($b['eventId'] ?? 0);
    if ($eventId <= 0) fail('Choose an event to register for.', 422);
    if (empty($b['acceptTerms'])) fail('Please accept the Terms & Conditions to register.', 422, ['errors' => ['acceptTerms' => 'You must accept the Terms & Conditions.']]);
    [$v, $errors] = reg_validate($b);
    if ($errors) fail('Please correct the highlighted fields.', 422, ['errors' => $errors]);
    $regMethod = in_array($b['regMethod'] ?? '', ['website', 'qr', 'admin'], true) ? $b['regMethod'] : 'website';

    $pdo = db();
    $pdo->beginTransaction();
    try {
        // lock the event row: capacity check + insert happen atomically
        $ev = reg_event($eventId, 'en', true);
        if (!$ev || $ev['status'] !== 'published') { $pdo->rollBack(); fail('This event could not be found.', 404); }
        [$open, $why] = reg_event_open($ev);
        if (!$open) {
            $pdo->rollBack();
            $msg = $why === 'FULL' ? 'Sorry — this event has reached its registration limit.'
                : ($why === 'NOT_YET_OPEN' ? 'Registration for this event has not opened yet.' : 'Registration for this event is closed.');
            $codeOut = in_array($why, ['FULL', 'NOT_YET_OPEN'], true) ? $why : 'CLOSED';
            fail($msg, 409, ['code' => $codeOut, 'reason' => $why]);
        }

        $s = $pdo->prepare('SELECT * FROM event_registrations WHERE event_id=? AND email=? FOR UPDATE');
        $s->execute([$eventId, $v['email']]);
        $existing = $s->fetch();
        if ($existing && $existing['status'] !== 'cancelled') {
            $pdo->rollBack();
            fail('This email address is already registered for this event.', 409, ['code' => 'DUPLICATE', 'errors' => ['email' => 'Already registered for this event.']]);
        }
        // NIC is the primary dedupe key: one active registration per NIC per event
        $n = $pdo->prepare("SELECT * FROM event_registrations WHERE event_id=? AND nic_number=? FOR UPDATE");
        $n->execute([$eventId, $v['nic_number']]);
        $byNic = $n->fetch();
        if ($byNic && $byNic['status'] !== 'cancelled' && (!$existing || (int)$byNic['id'] !== (int)$existing['id'])) {
            $pdo->rollBack();
            fail('This NIC number is already registered for this event.', 409, ['code' => 'DUPLICATE_NIC', 'errors' => ['nicNumber' => 'Already registered for this event.']]);
        }
        if (!$existing && $byNic && $byNic['status'] === 'cancelled') $existing = $byNic; // re-activate a cancelled NIC registration

        $code = null;
        for ($try = 0; $try < 5 && $code === null; $try++) {
            $candidate = reg_make_code();
            $c = $pdo->prepare('SELECT 1 FROM event_registrations WHERE ticket_code=?');
            $c->execute([$candidate]);
            if (!$c->fetchColumn()) $code = $candidate;
        }
        if ($code === null) throw new RuntimeException('could not allocate a ticket code');

        if ($existing) { // a cancelled registration for the same email/NIC: re-activate it with a fresh ticket
            $pdo->prepare("UPDATE event_registrations SET ticket_code=?, name=?, email=?, phone=?, nic_number=?, organization=?, designation=?,
                special_requirements=?, reg_method=?, status='registered', checked_in_at=NULL, checked_in_by=NULL, created_at=NOW() WHERE id=?")
                ->execute([$code, $v['name'], $v['email'], $v['phone'], $v['nic_number'], $v['organization'], $v['designation'],
                    $v['special_requirements'] !== '' ? $v['special_requirements'] : null, $regMethod, $existing['id']]);
            $id = (int)$existing['id'];
            $detail = "Re-registered for “{$ev['title']}” (previous ticket {$existing['ticket_code']} had been cancelled)";
        } else {
            $pdo->prepare("INSERT INTO event_registrations (event_id, ticket_code, name, email, phone, nic_number, organization, designation, special_requirements, reg_method, status, created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,'registered',NOW())")
                ->execute([$eventId, $code, $v['name'], $v['email'], $v['phone'], $v['nic_number'], $v['organization'], $v['designation'],
                    $v['special_requirements'] !== '' ? $v['special_requirements'] : null, $regMethod]);
            $id = (int)$pdo->lastInsertId();
            $detail = "Registered for “{$ev['title']}” via the website";
        }
        reg_log($id, $eventId, $code, $v['name'], 'REGISTERED', $detail, 'Public website (' . $v['email'] . ')');
        reg_sync_event_count($eventId);
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($e->getCode() === '23000') fail('This email address or NIC number is already registered for this event.', 409, ['code' => 'DUPLICATE']);
        error_log('register: ' . $e->getMessage());
        fail('Registration could not be saved. Please try again.', 500);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('register: ' . $e->getMessage());
        fail('Registration could not be saved. Please try again.', 500);
    }

    $r = $pdo->prepare('SELECT * FROM event_registrations WHERE id=?');
    $r->execute([$id]);
    $saved = $r->fetch();
    $evOut = reg_event($eventId, reg_lang());
    reg_send_confirmation_email($saved, $evOut); // never throws; failure is only logged
    ok(reg_public_row($saved, $evOut), 201);
}

// =====================================================================================
// PUBLIC: view my ticket (the ticket code itself is the secret — it is random and only on the ticket)
// =====================================================================================
if ($method === 'GET' && isset($_GET['ticket']) && !isset($_GET['admin'])) {
    rate_limit('tkt:' . reg_client_ip(), 60, 60);
    $code = reg_extract_code((string)$_GET['ticket']);
    if (!$code) fail('Ticket not found', 404);
    $s = db()->prepare('SELECT * FROM event_registrations WHERE ticket_code=?');
    $s->execute([$code]);
    $r = $s->fetch();
    if (!$r) fail('Ticket not found', 404);
    if (isset($_GET['v']) && !hash_equals(reg_verify_token($r['ticket_code']), (string)$_GET['v'])) fail('Ticket not found', 404);
    $ev = reg_event((int)$r['event_id'], reg_lang());
    if (!$ev) fail('Ticket not found', 404);
    ok(reg_public_row($r, $ev));
}

// =====================================================================================
// PUBLIC: resolve a scanned event-poster QR → the event + whether registration is open
// =====================================================================================
if ($method === 'GET' && $action === 'event') {
    rate_limit('evq:' . reg_client_ip(), 40, 300);
    $raw = trim((string)($_GET['code'] ?? ''));
    $ref = reg_parse_event_ref($raw);
    if (!$ref) {
        if ($raw !== '' && reg_extract_code($raw)) fail('This is a ticket QR code, not an event registration QR code.', 422, ['code' => 'TICKET_QR']);
        fail('This QR code is not a valid event registration code.', 422, ['code' => 'INVALID_QR']);
    }
    $id = $ref['id'] ?? 0;
    if (!$id) {
        $s = db()->prepare("SELECT t.event_id FROM event_translations t JOIN events e ON e.id = t.event_id WHERE t.slug=? AND e.status='published' LIMIT 1");
        $s->execute([$ref['slug']]);
        $id = (int)$s->fetchColumn();
    }
    $ev = $id > 0 ? reg_event($id, reg_lang()) : null;
    if (!$ev || ($ev['status'] ?? '') !== 'published') fail('This QR code does not match any event.', 404, ['code' => 'EVENT_NOT_FOUND']);
    [$open, $why] = reg_event_open($ev);
    ok(array_merge(reg_event_public($ev), [
        'registrationStatus' => $open ? 'open' : $why,
        'registrationOpensAt' => $ev['registration_opens_at'] ?? null,
        'registrationClosesAt' => $ev['registration_closes_at'] ?? null,
    ]));
}

// =====================================================================================
// PUBLIC: find my ticket — email AND mobile number must both match
// =====================================================================================
if ($method === 'POST' && $action === 'find') {
    rate_limit('find:' . reg_client_ip(), 8, 600);
    $b = request_body();
    $email = mb_strtolower(trim((string)($b['email'] ?? '')));
    $digits = preg_replace('/\D/', '', (string)($b['phone'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($digits) < 9) fail('Enter the email address and mobile number you registered with.', 422);
    $sql = "SELECT ticket_code, phone, event_id, status FROM event_registrations WHERE email=? AND status<>'cancelled'";
    $params = [$email];
    if (!empty($b['eventId'])) { $sql .= ' AND event_id=?'; $params[] = (int)$b['eventId']; }
    $s = db()->prepare($sql . ' ORDER BY created_at DESC');
    $s->execute($params);
    $matches = [];
    foreach ($s->fetchAll() as $r) {
        // compare the last 9 digits so 0771234567 and +94771234567 are the same number
        if (substr(preg_replace('/\D/', '', (string)$r['phone']), -9) === substr($digits, -9)) {
            $ev = reg_event((int)$r['event_id'], reg_lang());
            $matches[] = ['ticketCode' => $r['ticket_code'], 'status' => $r['status'], 'event' => $ev ? reg_event_public($ev) : null];
        }
    }
    if (!$matches) fail('No registration matches that email address and mobile number.', 404);
    ok(['tickets' => $matches]);
}

// =====================================================================================
// Everything below is for staff only
// =====================================================================================
$user = reg_require_staff();
$by = reg_actor($user);
$pdo = db();

// ---------- permanently delete a registration while retaining its audit snapshot ----------
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('Registration not found', 404);
    $pdo->beginTransaction();
    try {
        $s = $pdo->prepare('SELECT * FROM event_registrations WHERE id=? FOR UPDATE');
        $s->execute([$id]);
        $r = $s->fetch();
        if (!$r) { $pdo->rollBack(); fail('Registration not found', 404); }
        reg_log($id, (int)$r['event_id'], $r['ticket_code'], $r['name'], 'REGISTRATION_DELETED', 'Registration record permanently deleted by an administrator', $by);
        $pdo->prepare('DELETE FROM event_registrations WHERE id=?')->execute([$id]);
        reg_sync_event_count((int)$r['event_id']);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('registration delete: ' . $e->getMessage());
        fail('Could not delete the registration.', 500);
    }
    ok(['deleted' => $id]);
}

// ---------- QR / manual check-in ----------
if ($method === 'POST' && $action === 'scan') {
    $b = request_body();
    $code = reg_extract_code((string)($b['code'] ?? ''));
    $source = ($b['source'] ?? '') === 'manual' ? 'manual entry' : 'QR scanner';
    if (!$code) fail('INVALID OR UNREGISTERED TICKET', 404, ['result' => 'INVALID']);
    $pdo->beginTransaction();
    try {
        // row lock: two scanners reading the same ticket at the same moment cannot both check it in
        $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . ' WHERE r.ticket_code=? FOR UPDATE');
        $s->execute([$code]);
        $r = $s->fetch();
        if (!$r) { $pdo->rollBack(); fail('INVALID OR UNREGISTERED TICKET', 404, ['result' => 'INVALID', 'ticketCode' => $code]); }
        $row = reg_admin_row($r);
        if (!empty($b['eventId']) && (int)$b['eventId'] !== (int)$r['event_id']) {
            $pdo->rollBack();
            fail('TICKET IS FOR A DIFFERENT EVENT', 409, ['result' => 'WRONG_EVENT', 'registration' => $row]);
        }
        if ($r['status'] === 'cancelled') {
            reg_log((int)$r['id'], (int)$r['event_id'], $code, $r['name'], 'QR_SCANNED', "Entry refused: ticket is cancelled ($source)", $by);
            $pdo->commit();
            fail('TICKET CANCELLED', 410, ['result' => 'CANCELLED', 'registration' => $row]);
        }
        if ($r['status'] === 'checked_in') {
            reg_log((int)$r['id'], (int)$r['event_id'], $code, $r['name'], 'QR_SCANNED',
                'Entry refused: already checked in at ' . $r['checked_in_at'] . " ($source)", $by);
            $pdo->commit();
            fail('ALREADY CHECKED IN', 409, ['result' => 'ALREADY_CHECKED_IN', 'registration' => $row]);
        }
        $pdo->prepare("UPDATE event_registrations SET status='checked_in', checked_in_at=NOW(), checked_in_by=? WHERE id=? AND status='registered'")
            ->execute([mb_substr($by, 0, 150), $r['id']]);
        reg_log((int)$r['id'], (int)$r['event_id'], $code, $r['name'], 'QR_SCANNED', "Checked in at the entrance ($source)", $by);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('scan: ' . $e->getMessage());
        fail('Check-in failed. Please scan again.', 500);
    }
    $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . ' WHERE r.ticket_code=?');
    $s->execute([$code]);
    ok(['result' => 'CHECKED_IN', 'registration' => reg_admin_row($s->fetch())]);
}

// ---------- KPI statistics (live from MySQL) ----------
if ($method === 'GET' && isset($_GET['stats'])) {
    $eventId = !empty($_GET['event_id']) && ctype_digit((string)$_GET['event_id']) ? (int)$_GET['event_id'] : null;
    $s = $pdo->prepare("SELECT COUNT(*) total,
            COALESCE(SUM(status='checked_in'),0) checked_in,
            COALESCE(SUM(status='registered'),0) pending,
            COALESCE(SUM(status='cancelled'),0) cancelled,
            COALESCE(SUM(created_at >= CURDATE()),0) today,
            COALESCE(SUM(created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')),0) month_total
        FROM event_registrations" . ($eventId ? ' WHERE event_id=?' : ''));
    $s->execute($eventId ? [$eventId] : []);
    $c = $s->fetch();
    $events = $pdo->query('SELECT COUNT(*) total, COALESCE(SUM(status=\'published\'),0) published FROM events')->fetch();
    $eventsWithRegistrations = $pdo->query('SELECT COUNT(DISTINCT event_id) FROM event_registrations')->fetchColumn();
    ok([
        'totalEvents' => (int)$events['total'],
        'publishedEvents' => (int)$events['published'],
        'totalRegistrations' => (int)$c['total'],
        'checkedIn' => (int)$c['checked_in'],
        'pendingArrivals' => (int)$c['pending'],
        'cancelled' => (int)$c['cancelled'],
        'todayRegistrations' => (int)$c['today'],
        'monthRegistrations' => (int)$c['month_total'],
        'eventsWithRegistrations' => (int)$eventsWithRegistrations,
        'generatedAt' => date('c'),
    ]);
}

// ---------- activity history ----------
if ($method === 'GET' && isset($_GET['history'])) {
    $w = ['1=1']; $p = [];
    $act = strtoupper((string)($_GET['action_type'] ?? ''));
    if (in_array($act, REG_ACTIONS, true)) { $w[] = 'h.action_type=?'; $p[] = $act; }
    if (!empty($_GET['event_id']) && ctype_digit((string)$_GET['event_id'])) { $w[] = 'h.event_id=?'; $p[] = (int)$_GET['event_id']; }
    if (!empty($_GET['registration_id']) && ctype_digit((string)$_GET['registration_id'])) { $w[] = 'h.registration_id=?'; $p[] = (int)$_GET['registration_id']; }
    if (($q = trim((string)($_GET['q'] ?? ''))) !== '') {
        $like = reg_like($q);
        $search = '(h.ticket_code LIKE ? OR h.attendee_name LIKE ? OR h.details LIKE ? OR h.performed_by LIKE ?)';
        array_push($p, $like, $like, $like, $like);
        if (preg_match('/^REG-?0*(\d+)$/i', $q, $match) || ctype_digit($q)) {
            $w[] = '(' . $search . ' OR h.registration_id=?)';
            $p[] = (int)(ctype_digit($q) ? $q : $match[1]);
        } else {
            $w[] = $search;
        }
    }
    if ($d = reg_valid_date($_GET['from'] ?? null)) { $w[] = 'h.created_at >= ?'; $p[] = "$d 00:00:00"; }
    if ($d = reg_valid_date($_GET['to'] ?? null)) { $w[] = 'h.created_at <= ?'; $p[] = "$d 23:59:59"; }
    $where = implode(' AND ', $w);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $want = (int)($_GET['limit'] ?? 25);
    $limit = in_array($want, [10, 25, 50, 100], true) ? $want : 25;
    $off = ($page - 1) * $limit;
    $c = $pdo->prepare("SELECT COUNT(*) FROM activity_history h WHERE $where");
    $c->execute($p);
    $total = (int)$c->fetchColumn();
    $s = $pdo->prepare("SELECT h.*, COALESCE(r.name, h.attendee_name) AS attendee, COALESCE(t.title, CONCAT('Event #', h.event_id)) AS event_title
        FROM activity_history h
        LEFT JOIN event_registrations r ON r.id = h.registration_id
        LEFT JOIN event_translations t ON t.event_id = h.event_id AND t.language_code='en'
        WHERE $where ORDER BY h.created_at DESC, h.id DESC LIMIT $limit OFFSET $off");
    $s->execute($p);
    $items = array_map(fn($h) => [
        'id' => (int)$h['id'],
        'registrationId' => $h['registration_id'] !== null ? (int)$h['registration_id'] : null,
        'eventId' => $h['event_id'] !== null ? (int)$h['event_id'] : null,
        'eventTitle' => $h['event_id'] !== null ? $h['event_title'] : null,
        'ticketCode' => $h['ticket_code'],
        'attendeeName' => $h['attendee'],
        'action' => $h['action_type'],
        'details' => $h['details'],
        'performedBy' => $h['performed_by'],
        'createdAt' => $h['created_at'],
    ], $s->fetchAll());
    ok(['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit, 'pages' => max(1, (int)ceil($total / $limit))]);
}

// ---------- CSV exports (respect the current filters) ----------
if ($method === 'GET' && isset($_GET['export'])) {
    $type = $_GET['export'] === 'checkins' ? 'checkins' : 'registrations';
    $g = $_GET;
    if ($type === 'checkins') $g['status'] = 'checked_in';
    [$where, $params] = reg_filters($g);
    $order = $type === 'checkins' ? 'r.checked_in_at ASC, r.id ASC' : 'r.id DESC';
    $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . " WHERE $where ORDER BY $order");
    $s->execute($params);
    $label = ['registered' => 'Registered', 'checked_in' => 'Checked-In', 'cancelled' => 'Cancelled'];
    if ($type === 'checkins') {
        reg_send_csv('check-in-report-' . date('Y-m-d') . '.csv',
            ['Ticket Code', 'Full Name', 'Organization', 'Designation', 'Email', 'Phone', 'Event', 'Event Date', 'Checked In At', 'Checked In By'],
            (function () use ($s) { while ($r = $s->fetch()) yield [$r['ticket_code'], $r['name'], $r['organization'], $r['designation'], $r['email'], $r['phone'], $r['event_title'], substr((string)$r['event_date'], 0, 10), $r['checked_in_at'], $r['checked_in_by']]; })());
    }
    reg_send_csv('registrations-' . date('Y-m-d') . '.csv',
        ['ID', 'Registration ID', 'Ticket Code', 'Full Name', 'Email', 'Phone', 'NIC', 'Organization', 'Designation', 'Special Requirements', 'Event', 'Event Date', 'Venue', 'Registration Date', 'Status', 'Checked In At'],
        (function () use ($s, $label) { while ($r = $s->fetch()) yield [$r['id'], reg_registration_ref((int)$r['id']), $r['ticket_code'], $r['name'], $r['email'], $r['phone'], $r['nic_number'] ?? '', $r['organization'], $r['designation'], $r['special_requirements'] ?? '', $r['event_title'], substr((string)$r['event_date'], 0, 10), $r['venue'], $r['created_at'], $label[$r['status']] ?? $r['status'], $r['checked_in_at']]; })());
}

// ---------- one registration + history ----------
if ($method === 'GET' && isset($_GET['admin']) && !empty($_GET['id'])) {
    $id = (int)$_GET['id'];
    $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . ' WHERE r.id=?');
    $s->execute([$id]);
    $r = $s->fetch();
    if (!$r) fail('Registration not found', 404);
    $h = $pdo->prepare('SELECT * FROM activity_history WHERE registration_id=? OR (registration_id IS NULL AND ticket_code=?) ORDER BY created_at DESC, id DESC');
    $h->execute([$id, $r['ticket_code']]);
    $row = reg_admin_row($r);
    $row['history'] = array_map(fn($x) => [
        'id' => (int)$x['id'], 'action' => $x['action_type'], 'details' => $x['details'],
        'performedBy' => $x['performed_by'], 'createdAt' => $x['created_at'], 'ticketCode' => $x['ticket_code'],
    ], $h->fetchAll());
    ok($row);
}

// ---------- list (search, filters, pagination — all in MySQL) ----------
if ($method === 'GET' && isset($_GET['admin'])) {
    [$where, $params] = reg_filters($_GET);
    $all = ($_GET['limit'] ?? '') === 'all'; // printable attendee list
    $want = (int)($_GET['limit'] ?? 20);
    $limit = $all ? 5000 : (in_array($want, [10, 20, 50, 100], true) ? $want : 20);
    $page = $all ? 1 : max(1, (int)($_GET['page'] ?? 1));
    $off = ($page - 1) * $limit;
    $sortable = ['id' => 'r.id', 'name' => 'r.name', 'created' => 'r.created_at', 'checkin' => 'r.checked_in_at', 'organization' => 'r.organization'];
    $sort = $sortable[$_GET['sort'] ?? 'id'] ?? 'r.id';
    $dir = strtolower((string)($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
    $c = $pdo->prepare('SELECT COUNT(*) ' . REG_ADMIN_FROM . " WHERE $where");
    $c->execute($params);
    $total = (int)$c->fetchColumn();
    $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . " WHERE $where ORDER BY $sort $dir, r.id DESC LIMIT $limit OFFSET $off");
    $s->execute($params);
    ok([
        'items' => array_map('reg_admin_row', $s->fetchAll()),
        'total' => $total, 'page' => $page, 'limit' => $limit, 'pages' => max(1, (int)ceil($total / $limit)),
    ]);
}

// ---------- edit ----------
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    $b = request_body();
    [$v, $errors] = reg_validate($b, true);
    if ($errors) fail('Please correct the highlighted fields.', 422, ['errors' => $errors]);
    $newStatus = array_key_exists('status', $b) ? (string)$b['status'] : null;
    if ($newStatus !== null && !in_array($newStatus, REG_STATUSES, true)) fail('Unknown status', 422);

    $pdo->beginTransaction();
    try {
        $s = $pdo->prepare('SELECT * FROM event_registrations WHERE id=? FOR UPDATE');
        $s->execute([$id]);
        $r = $s->fetch();
        if (!$r) { $pdo->rollBack(); fail('Registration not found', 404); }
        if (isset($v['email']) && $v['email'] !== $r['email']) {
            $d = $pdo->prepare('SELECT 1 FROM event_registrations WHERE event_id=? AND email=? AND id<>?');
            $d->execute([$r['event_id'], $v['email'], $id]);
            if ($d->fetchColumn()) { $pdo->rollBack(); fail('Another registration for this event already uses that email.', 409, ['errors' => ['email' => 'Already registered for this event.']]); }
        }
        if (isset($v['nic_number']) && $v['nic_number'] !== '' && $v['nic_number'] !== ($r['nic_number'] ?? '')) {
            $d = $pdo->prepare("SELECT 1 FROM event_registrations WHERE event_id=? AND nic_number=? AND id<>? AND status<>'cancelled'");
            $d->execute([$r['event_id'], $v['nic_number'], $id]);
            if ($d->fetchColumn()) { $pdo->rollBack(); fail('Another registration for this event already uses that NIC number.', 409, ['errors' => ['nicNumber' => 'Already registered for this event.']]); }
        }
        $labels = ['name' => 'Full name', 'email' => 'Email', 'phone' => 'Phone', 'nic_number' => 'NIC', 'organization' => 'Organization', 'designation' => 'Designation', 'special_requirements' => 'Special requirements'];
        $set = []; $vals = []; $changes = [];
        foreach ($v as $col => $val) {
            if ((string)$r[$col] !== $val) { $set[] = "$col=?"; $vals[] = $val; $changes[] = "{$labels[$col]}: “{$r[$col]}” → “{$val}”"; }
        }
        $statusChanged = $newStatus !== null && $newStatus !== $r['status'];
        if ($statusChanged) {
            $set[] = 'status=?'; $vals[] = $newStatus;
            if ($newStatus === 'checked_in') { $set[] = 'checked_in_at=COALESCE(checked_in_at, NOW())'; $set[] = 'checked_in_by=?'; $vals[] = mb_substr($by, 0, 150); }
            if ($newStatus === 'registered') { $set[] = 'checked_in_at=NULL'; $set[] = 'checked_in_by=NULL'; }
            $changes[] = "Status: {$r['status']} → {$newStatus}";
        }
        if (!$set) { $pdo->rollBack(); ok(['unchanged' => true]); }
        $vals[] = $id;
        $pdo->prepare('UPDATE event_registrations SET ' . implode(',', $set) . ' WHERE id=?')->execute($vals);
        $name = $v['name'] ?? $r['name'];
        reg_log($id, (int)$r['event_id'], $r['ticket_code'], $name, 'DETAILS_UPDATED', implode('; ', $changes), $by);
        if ($statusChanged && $newStatus === 'cancelled') reg_log($id, (int)$r['event_id'], $r['ticket_code'], $name, 'TICKET_CANCELLED', 'Cancelled while editing the registration', $by);
        if ($statusChanged) reg_sync_event_count((int)$r['event_id']);
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($e->getCode() === '23000') fail('Another registration for this event already uses that email.', 409);
        error_log('reg update: ' . $e->getMessage());
        fail('Could not save the changes.', 500);
    }
    $s = $pdo->prepare('SELECT ' . REG_ADMIN_COLS . ' ' . REG_ADMIN_FROM . ' WHERE r.id=?');
    $s->execute([$id]);
    ok(reg_admin_row($s->fetch()));
}

// ---------- cancel ----------
if ($method === 'POST' && $action === 'cancel') {
    $id = (int)($_GET['id'] ?? 0);
    $reason = trim((string)(request_body()['reason'] ?? ''));
    $pdo->beginTransaction();
    try {
        $s = $pdo->prepare('SELECT * FROM event_registrations WHERE id=? FOR UPDATE');
        $s->execute([$id]);
        $r = $s->fetch();
        if (!$r) { $pdo->rollBack(); fail('Registration not found', 404); }
        if ($r['status'] === 'cancelled') { $pdo->rollBack(); fail('This registration is already cancelled.', 409); }
        $pdo->prepare("UPDATE event_registrations SET status='cancelled' WHERE id=?")->execute([$id]);
        reg_log($id, (int)$r['event_id'], $r['ticket_code'], $r['name'], 'TICKET_CANCELLED',
            'Ticket cancelled' . ($r['status'] === 'checked_in' ? ' (attendee had already checked in)' : '') . ($reason !== '' ? ' — ' . mb_substr($reason, 0, 300) : ''), $by);
        reg_sync_event_count((int)$r['event_id']);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('reg cancel: ' . $e->getMessage());
        fail('Could not cancel the registration.', 500);
    }
    ok(['cancelled' => $id]);
}

fail('Method not allowed', 405);
