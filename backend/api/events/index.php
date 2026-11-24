<?php
// Events API — public reads + admin CRUD.
// GET  /api/events/?lang=&upcoming=1&past=1&featured=1&status=live|upcoming|completed&id|slug=
// GET  /api/events/{idOrSlug}?lang=  (route rewrite) or ?slug=
// POST /api/events/?action=upload           -> image upload (auth)
// POST /api/events/                          -> create (auth)
// PUT  /api/events/?id=                      -> update (auth)
// DELETE /api/events/?id=                    -> delete (auth)
// Registration, tickets and check-in live in /api/registrations/ (see helpers/registration.php).
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/upload.php';
require_once dirname(__DIR__) . '/../helpers/registration.php';
require_once dirname(__DIR__) . '/../helpers/log.php';

// live registration numbers, read with every event row
const EV_COLS = "e.*,
    (SELECT COUNT(*) FROM event_registrations rr WHERE rr.event_id=e.id AND rr.status<>'cancelled') AS reg_live,
    (SELECT COUNT(*) FROM event_registrations rr WHERE rr.event_id=e.id AND rr.status='checked_in') AS reg_checked";

const EV_LANGS = ['en', 'ta', 'si'];
const EV_IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const EV_IMG_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function ev_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, EV_LANGS, true) ? $l : 'en';
}
// ---------- Cover / gallery image paths ----------
// The DB `image` column stores ONE canonical relative path: uploads/events/<file>.
// The API always returns a full absolute URL built from it, so Admin Edit, Admin View
// and the public website all resolve the same file no matter which port/host they run on.
function ev_backend_base(): string {
    $site = rtrim((string)env('SITE_URL', ''), '/');
    if ($site !== '') return $site . '/backend/';
    // SITE_URL not set: derive http(s)://host/<project>/backend/ from this request.
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $pos = strpos($script, '/backend/');
    $prefix = $pos !== false ? substr($script, 0, $pos) : '';
    $prefix = implode('/', array_map('rawurlencode', explode('/', $prefix)));
    return ($https ? 'https' : 'http') . '://' . $host . $prefix . '/backend/';
}
// Extract "uploads/events/<file>" from a relative path or from any absolute/root-relative URL.
function ev_upload_rel(?string $p): ?string {
    $p = trim((string)$p);
    if ($p === '') return null;
    $path = parse_url($p, PHP_URL_PATH);
    $path = rawurldecode(is_string($path) ? $path : $p);
    if (preg_match('#(?:^|/)(uploads/events/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp))$#i', $path, $m)) return $m[1];
    return null;
}
function ev_media_url(?string $p): ?string {
    $p = trim((string)$p);
    if ($p === '') return null;
    $rel = ev_upload_rel($p);
    if ($rel !== null) return ev_backend_base() . $rel;
    return $p; // legacy external URL — returned untouched
}
// Value written to events.image: canonical relative path, or NULL when the cover was removed.
function ev_store_image($v): ?string {
    if ($v === null || trim((string)$v) === '') return null;
    $rel = ev_upload_rel((string)$v);
    if ($rel === null) fail('Invalid cover image. Please upload the cover image again.', 422);
    if (!is_file(dirname(__DIR__, 2) . '/' . $rel)) fail('Cover image file not found. Please upload it again.', 422);
    return $rel;
}
// Gallery: same normalisation per item; unknown legacy URLs are kept so nothing is lost.
function ev_store_gallery($g): ?string {
    if (!is_array($g)) return null;
    $out = [];
    foreach ($g as $item) {
        if (!is_string($item) || trim($item) === '') continue;
        $out[] = ev_upload_rel($item) ?? trim($item);
    }
    return json_encode(array_values(array_unique($out)), JSON_UNESCAPED_SLASHES);
}
function ev_tr(int $id): array {
    $s = db()->prepare('SELECT * FROM event_translations WHERE event_id=?');
    $s->execute([$id]);
    $out = [];
    foreach ($s->fetchAll() as $t) {
        $out[$t['language_code']] = [
            'title' => $t['title'], 'slug' => $t['slug'],
            'description' => $t['description'],
        ];
    }
    return $out;
}
/** Public event lifecycle, independent of the registration window. */
function ev_public_status(array $event): string {
    if (($event['status'] ?? '') === 'cancelled' || ($event['event_status'] ?? '') === 'cancelled') return 'cancelled';
    $zone = new DateTimeZone('Asia/Colombo');
    $date = substr((string)($event['event_date'] ?? ''), 0, 10);
    if ($date === '') return 'upcoming';
    $start = new DateTimeImmutable($date . ' ' . (!empty($event['start_time']) ? $event['start_time'] : '00:00:00'), $zone);
    $end = new DateTimeImmutable($date . ' ' . (!empty($event['end_time']) ? $event['end_time'] : '23:59:59'), $zone);
    $now = new DateTimeImmutable(reg_now(), $zone);
    if ($now > $end) return 'completed';
    if (($event['event_status'] ?? '') === 'live' && $now >= $start && $now <= $end) return 'live';
    return 'upcoming';
}
function ev_slugify(string $t): string {
    $t = strtolower(trim($t));
    $t = preg_replace('/[^a-z0-9]+/', '-', $t);
    return trim($t, '-');
}
function ev_row(array $r, string $lang = 'en'): array {
    $tr = ev_tr((int)$r['id']);
    $pick = fn($c) => $tr[$c] ?? null;
    $t = $pick($lang) ?: $pick('en') ?: (reset($tr) ?: []);
    $stage = reg_event_stage($r);
    $date = substr((string)$r['event_date'], 0, 10);
    // The public LIVE badge follows the scheduled event window, never its registration window.
    $life = ev_public_status($r);
    return [
        'id' => (int)$r['id'],
        'slug' => $t['slug'] ?? null,
        'title' => $t['title'] ?? '',
        'description' => $t['description'] ?? '',
        'excerpt' => mb_substr((string)($t['description'] ?? ''), 0, 180),
        'date' => $date,
        'eventDate' => $r['event_date'],
        'startTime' => $r['start_time'],
        'endTime' => $r['end_time'],
        'venue' => $r['venue'],
        'address' => $r['address'],
        'mapUrl' => $r['map_url'],
        'image' => ev_media_url($r['image']),
        'categoryId' => $r['category_id'] ? (int)$r['category_id'] : null,
        'status' => $life,
        'stage' => $stage,
        'publishStatus' => $r['status'],
        'isFeatured' => (bool)$r['is_featured'],
        'showOnHomepage' => (bool)$r['show_on_homepage'],
        'eventStatus' => $r['event_status'] ?? 'upcoming',
        'isLiveEnabled' => ($r['event_status'] ?? '') === 'live',
        'city' => $r['city'] ?? null,
        'externalUrl' => $r['external_url'] ?? null,
        'registrationUrl' => $r['registration_url'] ?? null,
        'gallery' => array_values(array_filter(array_map('ev_media_url', !empty($r['gallery_json']) ? (array)json_decode($r['gallery_json'], true) : []))),
        'streamUrl' => $r['stream_url'] ?: null,
        'registrationOpen' => (bool)$r['registration_open'],
        'registrationOpensAt' => $r['registration_opens_at'] ?? null,
        'registrationOpenMode' => $r['registration_open_mode'] ?? 'auto',
        'registrationClosesAt' => $r['registration_closes_at'] ?? null,
        // effective window actually enforced (auto = 10 days before → event start), 'Y-m-d H:i:s' [opens, closes]
        'registrationWindow' => reg_window($r),
        'registrationLimit' => $r['registration_limit'] !== null ? (int)$r['registration_limit'] : null,
        'registrationCount' => isset($r['reg_live']) ? (int)$r['reg_live'] : (int)$r['registration_count'],
        'checkedInCount' => isset($r['reg_checked']) ? (int)$r['reg_checked'] : null,
        // open | FULL | REGISTRATION_CLOSED | EVENT_PAST | EVENT_COMPLETED | EVENT_CANCELLED | NOT_PUBLISHED
        'registrationStatus' => (function () use ($r) { [$o, $why] = reg_event_open($r); return $o ? 'open' : $why; })(),
        'registrationPath' => reg_registration_path((int)$r['id']),
        'publicRegistrationUrl' => reg_public_site_url() . reg_registration_path((int)$r['id']),
        'displayOrder' => (int)$r['display_order'],
        'createdAt' => $r['created_at'],
        'updatedAt' => $r['updated_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$seg = trim(substr($path, strpos($path, '/events') + 7), '/');
$idOrSlug = $seg !== '' ? urldecode($seg) : ($_GET['slug'] ?? $_GET['id'] ?? '');

// ---------- PUBLIC: single event ----------
if ($method === 'GET' && $idOrSlug !== '') {
    $row = null;
    if (ctype_digit($idOrSlug)) {
        $staff = current_user() && array_intersect(current_user()['roles'] ?? [], ['Super Admin','Admin','Content Manager','Event Manager','super_admin','admin','editor']);
        $s = db()->prepare('SELECT ' . EV_COLS . ' FROM events e WHERE e.id=?' . ($staff ? '' : " AND e.status='published'"));
        $s->execute([(int)$idOrSlug]);
        $row = $s->fetch();
    } else {
        // match by translation slug
        $s = db()->prepare('SELECT ' . EV_COLS . ' FROM events e JOIN event_translations t ON t.event_id=e.id WHERE t.slug=? AND e.status="published" LIMIT 1');
        $s->execute([$idOrSlug]);
        $row = $s->fetch();
        if (!$row) {
            $s = db()->prepare('SELECT * FROM events WHERE status="published"');
            foreach ($s->fetchAll() as $cand) {
                foreach (ev_tr((int)$cand['id']) as $tt) {
                    if (($tt['slug'] ?? '') === $idOrSlug) { $row = $cand; break 2; }
                }
            }
        }
    }
    if (!$row) fail('Event not found', 404);
    ok(ev_row($row, ev_lang()));
}

// ---------- PUBLIC: list ----------
if ($method === 'GET') {
    $lang = ev_lang();
    $where = "1=1";
    $params = [];
    // admin listing sees every status
    $viewer = current_user();
    $isStaff = $viewer && array_intersect($viewer['roles'] ?? [], ['Super Admin','Admin','Content Manager','Event Manager','super_admin','admin','content_manager','event_manager','editor']);
    if (!($isStaff && !empty($_GET['admin']))) $where = "e.status='published'";
    $mode = $_GET['upcoming'] ?? '';
    $today = substr(reg_now(), 0, 10);
    $nowTime = substr(reg_now(), 11, 8);
    if ($mode === '1' || $mode === 'upcoming') $where .= " AND (e.event_date > '$today' OR (e.event_date = '$today' AND (e.end_time IS NULL OR e.end_time >= '$nowTime')))";
    elseif ($mode === '0' || $mode === 'past') $where .= " AND (e.event_date < '$today' OR (e.event_date = '$today' AND e.end_time IS NOT NULL AND e.end_time < '$nowTime'))";
    if (!empty($_GET['featured'])) $where .= ' AND e.is_featured=1';
    if (!empty($_GET['live'])) $where .= " AND e.event_date='$today'";
    if (!empty($_GET['homepage'])) $where .= ' AND e.show_on_homepage=1';
    $ord = "e.event_date ASC, e.start_time ASC, e.is_featured DESC, e.display_order ASC, e.id ASC";
    if ($mode === '0' || $mode === 'past') $ord = "e.event_date DESC, e.start_time DESC, e.id DESC";
    $s = db()->query('SELECT ' . EV_COLS . " FROM events e WHERE $where ORDER BY $ord");
    $items = array_map(fn($r) => ev_row($r, $lang), $s->fetchAll());
    // lifecycle filter (stage is computed server-side from the event's own date/times)
    $stage = (string)($_GET['stage'] ?? '');
    if (in_array($stage, ['upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled'], true)) {
        $items = array_values(array_filter($items, fn($i) => $i['stage'] === $stage));
    }
    ok(['items' => $items, 'total' => count($items)]);
}

// ---------- AUTH check for writes ----------
$user = require_auth();
$roles = $user['roles'] ?? [];
if (!array_intersect($roles, ['Super Admin', 'Admin', 'Content Manager', 'Event Manager'])) fail('Forbidden', 403);

// ---------- upload ----------
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    if (empty($_FILES['file'])) fail('No file uploaded', 422);
    $res = upload_file($_FILES['file'], 'events', EV_IMG_EXT, EV_IMG_MIME, 8 * 1024 * 1024);
    if (!$res || isset($res['error'])) fail($res['error'] ?? 'Upload failed', 422);
    // path = canonical value stored in events.image; url = absolute URL for previews.
    ok(['path' => $res['path'], 'url' => ev_media_url($res['path']), 'size' => $res['size'], 'mime' => $res['mime']]);
}

// ---------- create ----------
if ($method === 'POST') {
    $b = request_body();
    $image = ev_store_image($b['image'] ?? null);
    $gallery = isset($b['gallery']) ? ev_store_gallery($b['gallery']) : null;
    db()->beginTransaction();
    try {
        // 20 columns -> 20 placeholders (was 17, so every create failed with a 500).
        db()->prepare('INSERT INTO events (category_id,image,event_date,start_time,end_time,venue,address,map_url,stream_url,is_featured,status,event_status,city,external_url,registration_url,gallery_json,show_on_homepage,registration_open,registration_limit,registration_opens_at,registration_closes_at,registration_open_mode,display_order)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([
            ($b['categoryId'] ?? null) !== '' && ($b['categoryId'] ?? null) !== null ? (int)$b['categoryId'] : null, $image, ($b['eventDate'] ?? null) ?: null,
            ($b['startTime'] ?? null) ?: null, ($b['endTime'] ?? null) ?: null, $b['venue'] ?? null,
            $b['address'] ?? null, $b['mapUrl'] ?? null, $b['streamUrl'] ?? null,
            !empty($b['isFeatured']) ? 1 : 0, in_array($b['status'] ?? '', ['published','unpublished','draft','cancelled'], true) ? $b['status'] : 'draft',
            in_array($b['eventStatus'] ?? '', ['upcoming','live','completed','cancelled'], true) ? $b['eventStatus'] : 'upcoming',
            $b['city'] ?? null, $b['externalUrl'] ?? null, $b['registrationUrl'] ?? null,
            $gallery,
            !empty($b['showOnHomepage']) ? 1 : 0,
            isset($b['registrationOpen']) ? (!empty($b['registrationOpen']) ? 1 : 0) : 1,
            ($b['registrationLimit'] ?? null) !== '' && ($b['registrationLimit'] ?? null) !== null ? (int)$b['registrationLimit'] : null, (int)($b['displayOrder'] ?? 0) ?: 0,
        ]);
        $id = (int)db()->lastInsertId();
        foreach (($b['translations'] ?? []) as $lang => $t) {
            if (!in_array($lang, EV_LANGS, true) || !is_array($t)) continue;
            $title = trim((string)($t['title'] ?? ''));
            if ($title === '') continue;
            $slug = ev_slugify($title) ?: ('event-' . $id);
            db()->prepare('INSERT INTO event_translations (event_id,language_code,title,slug,description) VALUES (?,?,?,?,?)
                ON DUPLICATE KEY UPDATE title=VALUES(title),slug=VALUES(slug),description=VALUES(description)')
                ->execute([$id, $lang, mb_substr($title, 0, 255), $slug, (string)($t['description'] ?? '')]);
        }
        db()->commit();
    } catch (Throwable $e) { db()->rollBack(); error_log('event create: ' . $e->getMessage()); fail('Failed to create event', 500); }
    $eventTitle = trim((string)($b['translations']['en']['title'] ?? ''));
    activity_log((int)$user['id'], 'event.created', 'events', $id, ['title' => $eventTitle]);
    ok(ev_row(db()->query("SELECT * FROM events WHERE id=$id")->fetch()));
}

// ---------- update ----------
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) fail('id required', 422);
    $b = request_body();
    $cur = db()->prepare('SELECT image, gallery_json FROM events WHERE id=?');
    $cur->execute([$id]);
    $cur = $cur->fetch();
    if (!$cur) fail('Event not found', 404);
    // Cover image: keep the saved one unless the form explicitly sent a new value ('' / null = removed).
    $image = array_key_exists('image', $b) ? ev_store_image($b['image']) : $cur['image'];
    $gallery = array_key_exists('gallery', $b) ? ev_store_gallery($b['gallery']) : $cur['gallery_json'];
    db()->beginTransaction();
    try {
        db()->prepare('UPDATE events SET category_id=?,image=?,event_date=?,start_time=?,end_time=?,venue=?,address=?,map_url=?,stream_url=?,is_featured=?,status=?,event_status=?,city=?,external_url=?,registration_url=?,gallery_json=?,show_on_homepage=?,registration_open=?,registration_limit=?,registration_opens_at=?,registration_closes_at=?,registration_open_mode=?,display_order=? WHERE id=?')->execute([
            ($b['categoryId'] ?? null) !== '' && ($b['categoryId'] ?? null) !== null ? (int)$b['categoryId'] : null, $image, ($b['eventDate'] ?? null) ?: null,
            ($b['startTime'] ?? null) ?: null, ($b['endTime'] ?? null) ?: null, $b['venue'] ?? null,
            $b['address'] ?? null, $b['mapUrl'] ?? null, $b['streamUrl'] ?? null,
            !empty($b['isFeatured']) ? 1 : 0, in_array($b['status'] ?? '', ['published','unpublished','draft','cancelled'], true) ? $b['status'] : 'draft',
            in_array($b['eventStatus'] ?? '', ['upcoming','live','completed','cancelled'], true) ? $b['eventStatus'] : 'upcoming',
            $b['city'] ?? null, $b['externalUrl'] ?? null, $b['registrationUrl'] ?? null,
            $gallery,
            !empty($b['showOnHomepage']) ? 1 : 0,
            isset($b['registrationOpen']) ? (!empty($b['registrationOpen']) ? 1 : 0) : 1,
            ($b['registrationLimit'] ?? null) !== '' && ($b['registrationLimit'] ?? null) !== null ? (int)$b['registrationLimit'] : null, (int)($b['displayOrder'] ?? 0) ?: 0, $id,
        ]);
        foreach (($b['translations'] ?? []) as $lang => $t) {
            if (!in_array($lang, EV_LANGS, true) || !is_array($t)) continue;
            $title = trim((string)($t['title'] ?? ''));
            if ($title === '') continue;
            $slug = ev_slugify($title) ?: ('event-' . $id);
            db()->prepare('INSERT INTO event_translations (event_id,language_code,title,slug,description) VALUES (?,?,?,?,?)
                ON DUPLICATE KEY UPDATE title=VALUES(title),slug=VALUES(slug),description=VALUES(description)')
                ->execute([$id, $lang, mb_substr($title, 0, 255), $slug, (string)($t['description'] ?? '')]);
        }
        db()->commit();
    } catch (Throwable $e) { db()->rollBack(); error_log('event update: ' . $e->getMessage()); fail('Failed to update event', 500); }
    $eventTitle = trim((string)($b['translations']['en']['title'] ?? ''));
    activity_log((int)$user['id'], 'event.updated', 'events', $id, ['title' => $eventTitle]);
    ok(ev_row(db()->query("SELECT * FROM events WHERE id=$id")->fetch()));
}

// ---------- delete ----------
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) fail('id required', 422);
    // registration protection: never silently delete people's tickets
    $c = db()->prepare("SELECT COUNT(*) FROM event_registrations WHERE event_id=? AND status<>'cancelled'");
    $c->execute([$id]);
    $active = (int)$c->fetchColumn();
    if ($active > 0) {
        fail("This event has $active active registration" . ($active === 1 ? '' : 's') . '. Cancel them first, or unpublish the event instead of deleting it.', 409, ['activeRegistrations' => $active]);
    }
    db()->beginTransaction();
    try {
        db()->prepare('DELETE FROM event_translations WHERE event_id=?')->execute([$id]);
        db()->prepare('DELETE FROM event_registrations WHERE event_id=?')->execute([$id]); // cancelled ones only; audit rows keep their copy
        db()->prepare('DELETE FROM events WHERE id=?')->execute([$id]);
        db()->commit();
    } catch (Throwable $e) { db()->rollBack(); error_log('event delete: ' . $e->getMessage()); fail('Failed to delete event', 500); }
    activity_log((int)$user['id'], 'event.deleted', 'events', $id);
    ok(['deleted' => $id]);
}

fail('Method not allowed', 405);
