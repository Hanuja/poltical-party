<?php
// Event registration, digital tickets and QR check-in — shared logic for backend/api/registrations/
// and backend/api/events/. Every query uses prepared statements; only validated integers are inlined.

const REG_STATUSES = ['registered', 'checked_in', 'cancelled'];
const REG_ACTIONS = ['REGISTERED', 'QR_SCANNED', 'DETAILS_UPDATED', 'TICKET_CANCELLED', 'REGISTRATION_DELETED'];
const REG_STAFF_ROLES = ['Super Admin', 'Admin', 'Content Manager', 'Event Manager',
    'super_admin', 'admin', 'content_manager', 'event_manager', 'editor'];
// Unambiguous characters only (no 0/O, 1/I/L) so codes are easy to read out and type at the door.
const REG_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const REG_CODE_RE = '/\bTKT-[2-9A-HJ-KMNP-Z]{4}-[2-9A-HJ-KMNP-Z]{4}-[2-9A-HJ-KMNP-Z]{4}\b/';

/** Random, unguessable ticket code: TKT-XXXX-XXXX-XXXX (~59 bits). */
function reg_make_code(): string {
    $g = function () {
        $s = '';
        for ($i = 0; $i < 4; $i++) $s .= REG_CODE_ALPHABET[random_int(0, strlen(REG_CODE_ALPHABET) - 1)];
        return $s;
    };
    return 'TKT-' . $g() . '-' . $g() . '-' . $g();
}

/** Pull a ticket code out of whatever a scanner or a person typed: a bare code, a ticket URL, lower case, spaces. */
function reg_extract_code(string $raw): ?string {
    $s = strtoupper(trim($raw));
    $s = preg_replace('/\s+/', '', $s);
    if (preg_match(REG_CODE_RE, $s, $m)) return $m[0];
    // typed without dashes: TKTABCD2345WXYZ or ABCD2345WXYZ
    $bare = preg_replace('/[^0-9A-Z]/', '', $s);
    if (str_starts_with($bare, 'TKT')) $bare = substr($bare, 3);
    if (strlen($bare) === 12 && strspn($bare, REG_CODE_ALPHABET) === 12) {
        return 'TKT-' . substr($bare, 0, 4) . '-' . substr($bare, 4, 4) . '-' . substr($bare, 8, 4);
    }
    return null;
}

function reg_is_staff(?array $u): bool {
    return $u && (bool)array_intersect($u['roles'] ?? [], REG_STAFF_ROLES);
}
function reg_require_staff(): array {
    $u = require_auth();
    if (!reg_is_staff($u)) fail('Forbidden', 403);
    return $u;
}
function reg_actor(?array $u): string {
    if (!$u) return 'Public website';
    return trim(($u['name'] ?? '') . ' <' . ($u['email'] ?? '') . '>') ?: 'admin';
}
function reg_client_ip(): string {
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

/** Public website base URL — used for the event-poster registration QR and ticket links. */
function reg_public_site_url(): string {
    $u = trim((string)env('PUBLIC_SITE_URL', ''));
    if ($u === '') { // first CORS origin is the public site in this project (http://localhost:5173 in dev)
        $origins = array_values(array_filter(array_map('trim', explode(',', (string)env('CORS_ORIGINS', '')))));
        $u = $origins[0] ?? (string)env('SITE_URL', '');
    }
    return rtrim($u, '/');
}
function reg_registration_path(int $eventId): string {
    return '/events/register?event_id=' . $eventId . '&register=true';
}

/** Human-readable registration ID derived from the database primary key: REG-000123. */
function reg_registration_ref(int $id): string {
    return 'REG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
}

/** Secure verification token for a ticket: HMAC of the ticket code with the server secret (nothing extra stored). */
function reg_verify_token(string $code): string {
    $secret = (string)env('JWT_SECRET');
    if ($secret === '') {
        throw new RuntimeException('JWT_SECRET is not configured');
    }
    return substr(hash_hmac('sha256', 'ticket:' . $code, $secret), 0, 20);
}

/**
 * Work out which event a scanned event-poster QR refers to. Accepts a full URL or a path:
 *   …?event_id=12 · …/events/12 · …/events/some-slug · …/events/some-slug?register=1
 * Returns ['id' => int] | ['slug' => string] | null.
 */
function reg_parse_event_ref(string $raw): ?array {
    $raw = trim($raw);
    if ($raw === '' || strlen($raw) > 500) return null;
    if (preg_match('/[?&]event_id=(\d{1,9})\b/i', $raw, $m)) return ['id' => (int)$m[1]];
    $path = (string)(parse_url($raw, PHP_URL_PATH) ?? '');
    if (preg_match('#/events/([^/?\#]+)#u', $path, $m)) {
        $seg = rawurldecode($m[1]);
        if (in_array(strtolower($seg), ['register', 'ticket', 'my-ticket'], true)) return null;
        if (ctype_digit($seg)) return ['id' => (int)$seg];
        if (mb_strlen($seg) <= 200) return ['slug' => $seg];
    }
    return null;
}

function reg_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, ['en', 'ta', 'si'], true) ? $l : 'en';
}

/** Event + its title/slug/description in $lang (falls back to English, then any language). */
function reg_event(int $id, string $lang = 'en', bool $forUpdate = false): ?array {
    $s = db()->prepare('SELECT * FROM events WHERE id=?' . ($forUpdate ? ' FOR UPDATE' : ''));
    $s->execute([$id]);
    $e = $s->fetch();
    if (!$e) return null;
    $t = db()->prepare('SELECT language_code, title, slug, description FROM event_translations WHERE event_id=?');
    $t->execute([$id]);
    $tr = [];
    foreach ($t->fetchAll() as $row) $tr[$row['language_code']] = $row;
    $pick = $tr[$lang] ?? $tr['en'] ?? (reset($tr) ?: []);
    $e['title'] = $pick['title'] ?? ('Event #' . $id);
    $e['slug'] = $pick['slug'] ?? null;
    $e['description'] = $pick['description'] ?? '';
    return $e;
}

/** Current time in the site's timezone (Asia/Colombo), 'Y-m-d H:i:s'. */
function reg_now(): string {
    return (new DateTime('now', new DateTimeZone('Asia/Colombo')))->format('Y-m-d H:i:s');
}

/**
 * Effective registration window for an event → [opensAt, closesAt] as 'Y-m-d H:i:s' (Asia/Colombo).
 * Auto mode: opens 10 calendar days before the event date at 00:00, closes when the event starts
 * (event_date + start_time; end of the event date when no start time is set).
 * Manual mode (registration_open_mode='manual'): admin-entered registration_opens_at /
 * registration_closes_at win; an empty side falls back to the auto rule.
 */
function reg_window(array $e): array {
    $date = substr((string)$e['event_date'], 0, 10);
    $auto = ($e['registration_open_mode'] ?? 'auto') !== 'manual';
    $opens = ($auto || empty($e['registration_opens_at']))
        ? (new DateTime($date . ' 00:00:00', new DateTimeZone('Asia/Colombo')))->modify('-10 days')->format('Y-m-d H:i:s')
        : $e['registration_opens_at'];
    $st = $e['start_time'] ?? null;
    $st = ($st && $st !== '00:00:00') ? substr((string)$st, 0, 8) : null;
    $closes = ($auto || empty($e['registration_closes_at']))
        ? $date . ' ' . ($st ?: '23:59:59')
        : $e['registration_closes_at'];
    return [$opens, $closes];
}

/** Event end moment → 'Y-m-d H:i:s' (end_time, or end of the event date when unset/midnight). */
function reg_event_end(array $e): string {
    $et = $e['end_time'] ?? null;
    $et = ($et && $et !== '00:00:00') ? substr((string)$et, 0, 8) : '23:59:59';
    return substr((string)$e['event_date'], 0, 10) . ' ' . $et;
}

/**
 * Lifecycle stage, computed from the event's own date/times (never stored):
 *   cancelled | completed | registration_closed | registration_open | upcoming
 * completed only after the event END time; registration closes at the event START time,
 * so "registration_closed" and "completed" are distinct stages.
 */
function reg_event_stage(array $e): string {
    if (($e['status'] ?? '') === 'cancelled' || ($e['event_status'] ?? '') === 'cancelled') return 'cancelled';
    // completed is purely dynamic: only after the configured event END time — a stored
    // event_status='completed' flag is ignored so stale admin data can't end an event early
    if (reg_now() > reg_event_end($e)) return 'completed';
    [$opens, $closes] = reg_window($e);
    $now = reg_now();
    if ($now < $opens) return 'upcoming';
    if ($now > $closes) return 'registration_closed';
    if (empty($e['registration_open']) || ($e['status'] ?? '') !== 'published') return 'registration_closed';
    return 'registration_open';
}

/** Can people register for this event right now? → [bool, reasonCode] */
function reg_event_open(array $e): array {
    if (($e['status'] ?? '') === 'cancelled' || ($e['event_status'] ?? '') === 'cancelled') return [false, 'EVENT_CANCELLED'];
    if (($e['status'] ?? '') !== 'published') return [false, 'NOT_PUBLISHED'];
    if (empty($e['registration_open'])) return [false, 'REGISTRATION_CLOSED'];
    [$opens, $closes] = reg_window($e);
    $now = reg_now();
    if ($now < $opens) return [false, 'NOT_YET_OPEN'];
    if ($now > $closes) {
        // past the registration window: "closed" while the event runs, "completed" after it ends
        return [false, $now > reg_event_end($e) ? 'EVENT_COMPLETED' : 'REGISTRATION_CLOSED'];
    }
    if ($e['registration_limit'] !== null && (int)$e['registration_limit'] > 0) {
        $c = db()->prepare("SELECT COUNT(*) FROM event_registrations WHERE event_id=? AND status<>'cancelled'");
        $c->execute([(int)$e['id']]);
        if ((int)$c->fetchColumn() >= (int)$e['registration_limit']) return [false, 'FULL'];
    }
    return [true, 'OPEN'];
}

function reg_event_media_url(?string $p): ?string {
    $p = trim((string)$p);
    if ($p === '') return null;
    if (preg_match('#(?:^|/)(uploads/events/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp))$#i', rawurldecode((string)(parse_url($p, PHP_URL_PATH) ?? $p)), $m)) {
        $site = rtrim((string)env('SITE_URL', ''), '/');
        if ($site === '') {
            $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
            $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
            $pos = strpos($script, '/backend/');
            $prefix = implode('/', array_map('rawurlencode', explode('/', $pos !== false ? substr($script, 0, $pos) : '')));
            $site = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $prefix;
        }
        return $site . '/backend/' . $m[1];
    }
    return $p;
}

function reg_event_public(array $e): array {
    return [
        'id' => (int)$e['id'],
        'title' => $e['title'],
        'slug' => $e['slug'],
        'date' => substr((string)$e['event_date'], 0, 10),
        'startTime' => $e['start_time'] ? substr($e['start_time'], 0, 5) : null,
        'endTime' => $e['end_time'] ? substr($e['end_time'], 0, 5) : null,
        'venue' => $e['venue'],
        'address' => $e['address'],
        'city' => $e['city'] ?? null,
        'image' => reg_event_media_url($e['image'] ?? null),
        'stage' => reg_event_stage($e),
        'registrationWindow' => reg_window($e),
    ];
}

/** What the attendee's own ticket shows (phone is never returned publicly). */
function reg_public_row(array $r, array $e): array {
    $token = reg_verify_token($r['ticket_code']);
    return [
        'registrationId' => reg_registration_ref((int)$r['id']),
        'ticketCode' => $r['ticket_code'],
        'verificationToken' => $token,
        'fullName' => $r['name'],
        'email' => $r['email'],
        'organization' => $r['organization'],
        'designation' => $r['designation'],
        'nicNumber' => $r['nic_number'] ?? null,
        'specialRequirements' => $r['special_requirements'] ?? null,
        'status' => $r['status'],
        'checkedInAt' => $r['checked_in_at'],
        'registeredAt' => $r['created_at'],
        'event' => reg_event_public($e),
        'ticketUrl' => reg_public_site_url() . '/events/ticket/' . $r['ticket_code'] . '?v=' . $token,
    ];
}

function reg_admin_row(array $r): array {
    return [
        'id' => (int)$r['id'],
        'ticketCode' => $r['ticket_code'],
        'fullName' => $r['name'],
        'email' => $r['email'],
        'phone' => $r['phone'],
        'organization' => $r['organization'],
        'designation' => $r['designation'],
        'nicNumber' => $r['nic_number'] ?? null,
        'specialRequirements' => $r['special_requirements'] ?? null,
        'regMethod' => $r['reg_method'] ?? 'website',
        'registrationId' => reg_registration_ref((int)$r['id']),
        'status' => $r['status'],
        'checkedInAt' => $r['checked_in_at'],
        'checkedInBy' => $r['checked_in_by'] ?? null,
        'registeredAt' => $r['created_at'],
        'updatedAt' => $r['updated_at'] ?? null,
        'eventId' => (int)$r['event_id'],
        'eventTitle' => $r['event_title'] ?? null,
        'eventDate' => isset($r['event_date']) ? substr((string)$r['event_date'], 0, 10) : null,
        'eventStart' => isset($r['start_time']) && $r['start_time'] ? substr($r['start_time'], 0, 5) : null,
        'eventEnd' => isset($r['end_time']) && $r['end_time'] ? substr($r['end_time'], 0, 5) : null,
        'venue' => $r['venue'] ?? null,
        'address' => $r['address'] ?? null,
        'ticketUrl' => reg_public_site_url() . '/events/ticket/' . $r['ticket_code'],
    ];
}

/** SELECT list + joins shared by admin list, detail and exports (English event title). */
const REG_ADMIN_FROM = "FROM event_registrations r
    JOIN events e ON e.id = r.event_id
    LEFT JOIN event_translations t ON t.event_id = r.event_id AND t.language_code = 'en'";
const REG_ADMIN_COLS = "r.*, e.event_date, e.start_time, e.end_time, e.venue, e.address,
    COALESCE(t.title, CONCAT('Event #', r.event_id)) AS event_title";

function reg_log(?int $regId, ?int $eventId, ?string $ticket, ?string $name, string $action, string $details, string $by): void {
    db()->prepare('INSERT INTO activity_history (registration_id, event_id, ticket_code, attendee_name, action_type, details, performed_by, ip_address)
        VALUES (?,?,?,?,?,?,?,?)')
        ->execute([$regId, $eventId, $ticket, $name !== null ? mb_substr($name, 0, 150) : null, $action,
            mb_substr($details, 0, 500), mb_substr($by, 0, 150), reg_client_ip()]);
}

/** Keep the legacy events.registration_count column in step with real registrations. */
function reg_sync_event_count(int $eventId): void {
    db()->prepare("UPDATE events SET registration_count =
        (SELECT COUNT(*) FROM event_registrations WHERE event_id=? AND status<>'cancelled') WHERE id=?")
        ->execute([$eventId, $eventId]);
}

/** Sri Lankan NIC: old format 9 digits + V/X checksum, or new 12-digit birth-register number. */
function reg_nic_valid(string $nic): bool {
    return (bool)preg_match('/^(\d{9}[VX]|\d{12})$/', $nic);
}
/** Normalise a NIC for storage/comparison: uppercase, no spaces or dashes. */
function reg_nic_clean(string $nic): string {
    return strtoupper(preg_replace('/[\s\-]/', '', trim($nic)));
}

/**
 * Validate attendee fields. $partial = only validate keys that are present (admin edit).
 * Returns [cleanValues, fieldErrors].
 */
function reg_validate(array $b, bool $partial = false): array {
    $map = ['fullName' => 'name', 'email' => 'email', 'phone' => 'phone', 'nicNumber' => 'nic_number',
        'organization' => 'organization', 'designation' => 'designation', 'specialRequirements' => 'special_requirements'];
    $clean = []; $err = [];
    foreach ($map as $in => $col) {
        if ($partial && !array_key_exists($in, $b)) continue;
        $v = trim(preg_replace('/\s+/u', ' ', (string)($b[$in] ?? '')));
        switch ($in) {
            case 'fullName':
                if (mb_strlen($v) < 2) $err[$in] = 'Enter your full name.';
                elseif (mb_strlen($v) > 150) $err[$in] = 'Name is too long (150 characters max).';
                break;
            case 'email':
                $v = mb_strtolower($v);
                if ($v === '') $err[$in] = 'Enter your email address.';
                elseif (!filter_var($v, FILTER_VALIDATE_EMAIL) || mb_strlen($v) > 150) $err[$in] = 'Enter a valid email address.';
                break;
            case 'phone':
                $digits = preg_replace('/\D/', '', $v);
                if ($v === '') $err[$in] = 'Enter your mobile number.';
                elseif (!preg_match('/^\+?[\d\s\-().]+$/', $v) || strlen($digits) < 9 || strlen($digits) > 15) $err[$in] = 'Enter a valid mobile number (e.g. 077 123 4567 or +94 77 123 4567).';
                break;
            case 'nicNumber':
                $v = reg_nic_clean($v);
                if ($v === '') $err[$in] = 'Enter your NIC number.';
                elseif (!reg_nic_valid($v)) $err[$in] = 'Enter a valid NIC number (e.g. 199812345678 or 123456789V).';
                break;
            case 'organization':
                if (mb_strlen($v) < 2) $err[$in] = 'Enter your organization or institution.';
                elseif (mb_strlen($v) > 255) $err[$in] = 'Organization is too long (255 characters max).';
                break;
            case 'designation':
                // optional legacy field — kept for older clients, never required by the current form
                if (mb_strlen($v) > 150) $err[$in] = 'Designation is too long (150 characters max).';
                break;
            case 'specialRequirements':
                if (mb_strlen($v) > 1000) $err[$in] = 'Special requirements are too long (1000 characters max).';
                break;
        }
        $clean[$col] = $v;
    }
    return [$clean, $err];
}

function reg_valid_date(?string $d): ?string {
    $d = trim((string)$d);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && checkdate((int)substr($d, 5, 2), (int)substr($d, 8, 2), (int)substr($d, 0, 4)) ? $d : null;
}
function reg_like(string $s): string {
    return '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $s) . '%';
}

/** Database-level filters for the admin list, exports and print list. → [whereSql, params] */
function reg_filters(array $g): array {
    $w = ['1=1']; $p = [];
    $q = trim((string)($g['q'] ?? ''));
    if ($q !== '') {
        $like = reg_like($q);
        $regId = null;
        if (preg_match('/^REG-?0*(\d+)$/i', $q, $match) || ctype_digit($q)) $regId = (int)(ctype_digit($q) ? $q : $match[1]);
        $w[] = '(r.name LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR r.nic_number LIKE ? OR r.ticket_code LIKE ? OR r.organization LIKE ? OR r.designation LIKE ?' . ($regId !== null ? ' OR r.id = ?' : '') . ')';
        array_push($p, $like, $like, $like, $like, $like, $like, $like);
        if ($regId !== null) $p[] = $regId;
    }
    $st = (string)($g['status'] ?? '');
    if (in_array($st, REG_STATUSES, true)) { $w[] = 'r.status = ?'; $p[] = $st; }
    if (!empty($g['event_id']) && ctype_digit((string)$g['event_id'])) { $w[] = 'r.event_id = ?'; $p[] = (int)$g['event_id']; }
    if ($d = reg_valid_date($g['from'] ?? null)) { $w[] = 'r.created_at >= ?'; $p[] = "$d 00:00:00"; }
    if ($d = reg_valid_date($g['to'] ?? null)) { $w[] = 'r.created_at <= ?'; $p[] = "$d 23:59:59"; }
    if ($d = reg_valid_date($g['checkin_date'] ?? null)) { $w[] = 'r.checked_in_at BETWEEN ? AND ?'; $p[] = "$d 00:00:00"; $p[] = "$d 23:59:59"; }
    if (($o = trim((string)($g['organization'] ?? ''))) !== '') { $w[] = 'r.organization LIKE ?'; $p[] = reg_like($o); }
    if (($o = trim((string)($g['designation'] ?? ''))) !== '') { $w[] = 'r.designation LIKE ?'; $p[] = reg_like($o); }
    return [implode(' AND ', $w), $p];
}

/**
 * Registration confirmation email — sent after the database commit.
 * Never throws: a mail failure must not lose or fail the registration.
 * The email links to the attendee's ticket page (which renders the QR code);
 * the QR itself encodes only the ticket URL + HMAC token, never personal data.
 */
function reg_send_confirmation_email(array $r, array $e): void {
    require_once __DIR__ . '/mailer.php';
    if (!mail_configured()) return;
    $to = trim((string)($r['email'] ?? ''));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return;

    $ticket = reg_public_row($r, $e);
    $site = reg_public_site_url();
    $name = (string)($r['name'] ?? '');
    $title = (string)($e['title'] ?? ('Event #' . ($e['id'] ?? '')));
    $when = trim(substr((string)($e['event_date'] ?? ''), 0, 10) . ' ' . substr((string)($e['start_time'] ?? ''), 0, 5));
    $venue = trim(implode(', ', array_filter([$e['venue'] ?? '', $e['address'] ?? '', $e['city'] ?? ''])));
    $regId = reg_registration_ref((int)$r['id']);
    $url = $ticket['ticketUrl'] ?? ($site . '/events/ticket/' . $r['ticket_code']);

    $subject = 'Registration Confirmed — ' . $title;
    $text = "Dear {$name},\n\nYour registration for \"{$title}\" has been confirmed.\n\n"
        . "Registration ID: {$regId}\n"
        . "Event: {$title}\n"
        . "Date & Time: {$when}\n"
        . ($venue !== '' ? "Venue: {$venue}\n" : '')
        . "\nView your ticket and QR code here:\n{$url}\n\n"
        . "Please bring this ticket (or show the QR code) at the entrance.\n\n"
        . "— " . (string)env('MAIL_FROM_NAME', 'Event Team');

    $esc = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
    $html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">'
        . '<h2 style="color:#4A1024;margin:0 0 12px">Registration Confirmed</h2>'
        . '<p>Dear ' . $esc($name) . ',</p>'
        . '<p>Your registration for <strong>' . $esc($title) . '</strong> has been confirmed.</p>'
        . '<table style="border-collapse:collapse;margin:14px 0">'
        . '<tr><td style="padding:4px 14px 4px 0;color:#666">Registration ID</td><td><strong>' . $esc($regId) . '</strong></td></tr>'
        . '<tr><td style="padding:4px 14px 4px 0;color:#666">Event</td><td>' . $esc($title) . '</td></tr>'
        . '<tr><td style="padding:4px 14px 4px 0;color:#666">Date &amp; Time</td><td>' . $esc($when) . '</td></tr>'
        . ($venue !== '' ? '<tr><td style="padding:4px 14px 4px 0;color:#666">Venue</td><td>' . $esc($venue) . '</td></tr>' : '')
        . '</table>'
        . '<p><a href="' . $esc($url) . '" style="display:inline-block;background:#7A0019;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">View Your Ticket &amp; QR Code</a></p>'
        . '<p style="font-size:0.85rem;color:#666">Please bring this ticket (or show the QR code) at the entrance.</p>'
        . '<p style="font-size:0.85rem;color:#666">— ' . $esc((string)env('MAIL_FROM_NAME', 'Event Team')) . '</p></div>';

    $res = mail_send($to, $subject, $html, $text);
    if ($res['status'] !== 'sent') {
        error_log('reg confirmation email failed for ' . $to . ': ' . ($res['error'] ?? $res['status']));
    }
}

/** Stream rows as an Excel-friendly UTF-8 CSV (BOM so Tamil / Sinhala names open correctly). */
function reg_send_csv(string $filename, array $header, iterable $rows): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $header);
    foreach ($rows as $row) {
        // neutralise spreadsheet formulas in user-supplied text (CSV injection)
        fputcsv($out, array_map(fn($v) => is_string($v) && $v !== '' && strpbrk($v[0], '=+-@') !== false ? "'" . $v : $v, $row));
    }
    fclose($out);
    exit;
}
