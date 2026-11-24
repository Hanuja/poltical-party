<?php
// Leadership (Our People) API.
//
// Public:  GET    /api/leadership/?lang=xx              -> published leaders only
//          GET    /api/leadership/?slug=xx&lang=xx      -> one published leader
//          GET    /api/leadership/?meta=1               -> positions / provinces / districts (en, ta, si labels)
// Admin:   GET    /api/leadership/?all=1&q=&status=     -> every non-deleted profile + stats
//          GET    /api/leadership/?id=N | ?key=UUID     -> one profile incl. drafts and all translations
//          POST   /api/leadership/                      -> auto-save (upsert by profileKey, never duplicates)
//          PUT    /api/leadership/?id=N                 -> auto-save an existing profile
//          POST   /api/leadership/?action=status&id=N   {status: draft|published|inactive}
//          POST   /api/leadership/?action=upload        -> photo upload (multipart "file")
//          DELETE /api/leadership/?id=N                 -> soft delete (hidden everywhere)
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/upload.php';
require_once dirname(__DIR__) . '/../helpers/log.php';

const LEAD_LANGS = ['en', 'ta', 'si'];
const LEAD_STATUSES = ['draft', 'published', 'inactive'];

// Per-language content: API key => [DB column, max length]. One row per language per profile.
const LEAD_TR_FIELDS = [
    'name'                => ['name', 150],
    'position'            => ['position', 150],
    'shortBio'            => ['short_bio', 2000],
    'bio'                 => ['bio', 20000],
    'responsibilities'    => ['responsibilities', 5000],
    'politicalExperience' => ['political_experience', 10000],
    'previousPositions'   => ['previous_positions', 5000],
    'achievements'        => ['achievements', 10000],
    'officeBranch'        => ['office_branch', 255],
];

// Sections of the public Our People page (stored in position_key). Legacy keys
// (organizer, mp, provincial, district, member) still group under Executive Committee.
const LEAD_SECTIONS = ['leader', 'general_secretary', 'deputy', 'executive'];

const LEAD_PHONE_RE = '/^\+?[0-9][0-9\s\-()]{6,19}$/';

// Position categories. Order = default sort on the public site.
const LEAD_POSITIONS = [
    'leader'            => ['en' => 'Party Leader',               'ta' => 'கட்சித் தலைவர்',              'si' => 'පක්ෂ නායක'],
    'deputy'            => ['en' => 'Deputy Leader',              'ta' => 'பிரதித் தலைவர்',              'si' => 'නියෝජ්‍ය නායක'],
    'general_secretary' => ['en' => 'General Secretary',          'ta' => 'பொதுச் செயலாளர்',             'si' => 'මහ ලේකම්'],
    'organizer'         => ['en' => 'National Organizer',         'ta' => 'தேசிய அமைப்பாளர்',            'si' => 'ජාතික සංවිධායක'],
    'mp'                => ['en' => 'Member of Parliament',       'ta' => 'நாடாளுமன்ற உறுப்பினர்',        'si' => 'පාර්ලිමේන්තු මන්ත්‍රී'],
    'provincial'        => ['en' => 'Provincial Representative',  'ta' => 'மாகாண பிரதிநிதி',             'si' => 'පළාත් නියෝජිත'],
    'district'          => ['en' => 'District Representative',    'ta' => 'மாவட்ட பிரதிநிதி',            'si' => 'දිස්ත්‍රික් නියෝජිත'],
    'member'            => ['en' => 'Member',                     'ta' => 'உறுப்பினர்',                  'si' => 'සාමාජික'],
    'executive'         => ['en' => 'Executive Committee Member', 'ta' => 'நிர்வாகக் குழு உறுப்பினர்',     'si' => 'විධායක කමිටු සාමාජික'],
];

// Provinces offered in the admin dropdowns (the party's area). Labels for the other
// provinces/districts are kept so any older profile still displays correctly.
const LEAD_ACTIVE_PROVINCES = ['northern', 'eastern'];

const LEAD_PROVINCES = [
    'northern'      => ['en' => 'Northern Province',      'ta' => 'வடக்கு மாகாணம்',     'si' => 'උතුරු පළාත'],
    'eastern'       => ['en' => 'Eastern Province',       'ta' => 'கிழக்கு மாகாணம்',    'si' => 'නැගෙනහිර පළාත'],
    'western'       => ['en' => 'Western Province',       'ta' => 'மேல் மாகாணம்',       'si' => 'බස්නාහිර පළාත'],
    'central'       => ['en' => 'Central Province',       'ta' => 'மத்திய மாகாணம்',     'si' => 'මධ්‍යම පළාත'],
    'southern'      => ['en' => 'Southern Province',      'ta' => 'தென் மாகாணம்',       'si' => 'දකුණු පළාත'],
    'north_western' => ['en' => 'North Western Province', 'ta' => 'வடமேல் மாகாணம்',     'si' => 'වයඹ පළාත'],
    'north_central' => ['en' => 'North Central Province', 'ta' => 'வடமத்திய மாகாணம்',   'si' => 'උතුරු මැද පළාත'],
    'uva'           => ['en' => 'Uva Province',           'ta' => 'ஊவா மாகாணம்',        'si' => 'ඌව පළාත'],
    'sabaragamuwa'  => ['en' => 'Sabaragamuwa Province',  'ta' => 'சப்ரகமுவ மாகாணம்',   'si' => 'සබරගමුව පළාත'],
];

// district key => [province key, labels]
const LEAD_DISTRICTS = [
    'colombo'      => ['western',       ['en' => 'Colombo',      'ta' => 'கொழும்பு',        'si' => 'කොළඹ']],
    'gampaha'      => ['western',       ['en' => 'Gampaha',      'ta' => 'கம்பஹா',          'si' => 'ගම්පහ']],
    'kalutara'     => ['western',       ['en' => 'Kalutara',     'ta' => 'களுத்துறை',       'si' => 'කළුතර']],
    'kandy'        => ['central',       ['en' => 'Kandy',        'ta' => 'கண்டி',           'si' => 'මහනුවර']],
    'matale'       => ['central',       ['en' => 'Matale',       'ta' => 'மாத்தளை',         'si' => 'මාතලේ']],
    'nuwara_eliya' => ['central',       ['en' => 'Nuwara Eliya', 'ta' => 'நுவரெலியா',       'si' => 'නුවරඑළිය']],
    'galle'        => ['southern',      ['en' => 'Galle',        'ta' => 'காலி',            'si' => 'ගාල්ල']],
    'matara'       => ['southern',      ['en' => 'Matara',       'ta' => 'மாத்தறை',         'si' => 'මාතර']],
    'hambantota'   => ['southern',      ['en' => 'Hambantota',   'ta' => 'அம்பாந்தோட்டை',   'si' => 'හම්බන්තොට']],
    'jaffna'       => ['northern',      ['en' => 'Jaffna',       'ta' => 'யாழ்ப்பாணம்',     'si' => 'යාපනය']],
    'kilinochchi'  => ['northern',      ['en' => 'Kilinochchi',  'ta' => 'கிளிநொச்சி',      'si' => 'කිලිනොච්චිය']],
    'mannar'       => ['northern',      ['en' => 'Mannar',       'ta' => 'மன்னார்',         'si' => 'මන්නාරම']],
    'vavuniya'     => ['northern',      ['en' => 'Vavuniya',     'ta' => 'வவுனியா',         'si' => 'වවුනියාව']],
    'mullaitivu'   => ['northern',      ['en' => 'Mullaitivu',   'ta' => 'முல்லைத்தீவு',    'si' => 'මුලතිව්']],
    'batticaloa'   => ['eastern',       ['en' => 'Batticaloa',   'ta' => 'மட்டக்களப்பு',    'si' => 'මඩකලපුව']],
    'ampara'       => ['eastern',       ['en' => 'Ampara',       'ta' => 'அம்பாறை',         'si' => 'අම්පාර']],
    'trincomalee'  => ['eastern',       ['en' => 'Trincomalee',  'ta' => 'திருகோணமலை',      'si' => 'ත්‍රිකුණාමලය']],
    'kurunegala'   => ['north_western', ['en' => 'Kurunegala',   'ta' => 'குருநாகல்',       'si' => 'කුරුණෑගල']],
    'puttalam'     => ['north_western', ['en' => 'Puttalam',     'ta' => 'புத்தளம்',        'si' => 'පුත්තලම']],
    'anuradhapura' => ['north_central', ['en' => 'Anuradhapura', 'ta' => 'அனுராதபுரம்',     'si' => 'අනුරාධපුරය']],
    'polonnaruwa'  => ['north_central', ['en' => 'Polonnaruwa',  'ta' => 'பொலன்னறுவை',      'si' => 'පොළොන්නරුව']],
    'badulla'      => ['uva',           ['en' => 'Badulla',      'ta' => 'பதுளை',           'si' => 'බදුල්ල']],
    'monaragala'   => ['uva',           ['en' => 'Monaragala',   'ta' => 'மொனராகலை',        'si' => 'මොණරාගල']],
    'ratnapura'    => ['sabaragamuwa',  ['en' => 'Ratnapura',    'ta' => 'இரத்தினபுரி',     'si' => 'රත්නපුර']],
    'kegalle'      => ['sabaragamuwa',  ['en' => 'Kegalle',      'ta' => 'கேகாலை',          'si' => 'කෑගල්ල']],
];

function lead_require_admin(): array {
    $user = require_auth();
    if (!array_intersect($user['roles'] ?? [], ['Super Admin', 'Admin', 'Content Manager'])) {
        fail('Forbidden', 403);
    }
    return $user;
}

function lead_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, LEAD_LANGS, true) ? $l : 'en';
}

function lead_image_url(?string $path): ?string {
    if (!$path) return null;
    if (preg_match('#^(https?:)?//#', $path) || str_starts_with($path, '/')) return $path;
    return rtrim(env('SITE_URL', ''), '/') . '/backend/' . ltrim($path, '/');
}

// DB timestamps -> ISO 8601 UTC, independent of MySQL/PHP timezone settings.
function lead_iso($unixTs): ?string {
    return $unixTs ? gmdate('Y-m-d\TH:i:s\Z', (int)$unixTs) : null;
}

function lead_clean(?string $v, int $max): ?string {
    $v = trim((string)$v);
    return $v === '' ? null : mb_substr($v, 0, $max);
}

function lead_slug(int $id, ?string $enName): string {
    $s = mb_strtolower(trim((string)$enName));
    $s = preg_replace('/[^a-z0-9\s-]/', '', $s);
    $s = trim(preg_replace('/[\s-]+/', '-', $s), '-');
    return ($s !== '' ? $s : 'leader') . '-' . $id;
}

function lead_translations(int $id): array {
    $cols = implode(', ', array_map(fn($f) => $f[0], LEAD_TR_FIELDS));
    $stmt = db()->prepare("SELECT language_code, $cols FROM leadership_translations WHERE leadership_id = ?");
    $stmt->execute([$id]);
    $empty = array_fill_keys(array_keys(LEAD_TR_FIELDS), '');
    $out = array_fill_keys(LEAD_LANGS, $empty);
    foreach ($stmt->fetchAll() as $t) {
        foreach (LEAD_TR_FIELDS as $k => [$col]) $out[$t['language_code']][$k] = (string)$t[$col];
    }
    return $out;
}

function lead_valid_email(?string $v): bool { return !$v || (bool)filter_var($v, FILTER_VALIDATE_EMAIL); }
function lead_valid_phone(?string $v): bool { return !$v || (bool)preg_match(LEAD_PHONE_RE, $v); }

function lead_lang_complete(array $t): bool {
    return trim($t['name'] ?? '') !== '' && trim($t['position'] ?? '') !== '';
}

// Full admin representation (all languages).
function lead_admin_row(array $row): array {
    $tr = lead_translations((int)$row['id']);
    return [
        'id'            => (int)$row['id'],
        'profileKey'    => $row['profile_key'],
        'slug'          => lead_slug((int)$row['id'], $tr['en']['name'] ?: null),
        'status'        => $row['status'],
        'positionKey'   => $row['position_key'],
        'image'         => $row['image'],
        'imageUrl'      => lead_image_url($row['image']),
        'district'      => $row['district'],
        'province'      => $row['province'],
        'appointmentDate' => $row['appointment_date'],
        'email'         => $row['email'],
        'phone'         => $row['phone'],
        'facebook'      => $row['facebook'],
        'twitter'       => $row['twitter'],
        'instagram'     => $row['instagram'],
        'youtube'       => $row['youtube'],
        'displayOrder'  => (int)$row['display_order'],
        'translations'  => $tr,
        'languages'     => array_values(array_filter(LEAD_LANGS, fn($l) => lead_lang_complete($tr[$l]))),
        'publishedAt'   => lead_iso($row['published_ts'] ?? null),
        'updatedAt'     => lead_iso($row['updated_ts'] ?? null),
        'autoSavedAt'   => lead_iso($row['auto_saved_ts'] ?? null),
    ];
}

// Public representation: flat strings in the requested language.
// Fallback per field: requested language -> English -> Tamil -> Sinhala; empty fields stay ''.
function lead_public_row(array $row, string $lang): array {
    $tr = lead_translations((int)$row['id']);
    $order = array_unique(array_merge([$lang], LEAD_LANGS));
    $pick = function (string $field) use ($tr, $order) {
        foreach ($order as $l) if (trim($tr[$l][$field] ?? '') !== '') return $tr[$l][$field];
        return '';
    };
    $district = $row['district'] && isset(LEAD_DISTRICTS[$row['district']]) ? LEAD_DISTRICTS[$row['district']][1][$lang] : $row['district'];
    $province = $row['province'] && isset(LEAD_PROVINCES[$row['province']]) ? LEAD_PROVINCES[$row['province']][$lang] : $row['province'];
    return [
        'id'          => (int)$row['id'],
        'slug'        => lead_slug((int)$row['id'], $tr['en']['name'] ?: null),
        'positionKey' => $row['position_key'],
        'positionOrder' => (int)$row['position_order'],
        'image'       => lead_image_url($row['image']),
        'district'    => $district,
        'province'    => $province,
        'districtKey' => $row['district'],
        'provinceKey' => $row['province'],
        'section'     => in_array($row['position_key'], LEAD_SECTIONS, true) ? $row['position_key'] : ($row['position_key'] ? 'executive' : null),
        'appointmentDate' => $row['appointment_date'],
        'email'       => lead_valid_email($row['email']) ? $row['email'] : null,
        'phone'       => lead_valid_phone($row['phone']) ? $row['phone'] : null,
        'facebook'    => $row['facebook'],
        'twitter'     => $row['twitter'],
        'instagram'   => $row['instagram'],
        'youtube'     => $row['youtube'],
    ] + array_combine(array_keys(LEAD_TR_FIELDS), array_map($pick, array_keys(LEAD_TR_FIELDS)));
}

function lead_find(int $id): ?array {
    $s = db()->prepare('SELECT *, UNIX_TIMESTAMP(updated_at) AS updated_ts, UNIX_TIMESTAMP(auto_saved_at) AS auto_saved_ts, UNIX_TIMESTAMP(published_at) AS published_ts FROM leadership WHERE id = ? AND deleted_at IS NULL');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];

// ---------- Public ----------
if ($method === 'GET' && isset($_GET['meta'])) {
    $districts = [];
    // ?scope=all (public website filters) lists all nine provinces; the admin form gets the active ones.
    $scope = ($_GET['scope'] ?? '') === 'all' ? array_keys(LEAD_PROVINCES) : LEAD_ACTIVE_PROVINCES;
    foreach (LEAD_DISTRICTS as $k => [$prov, $labels]) {
        if (in_array($prov, $scope, true)) $districts[] = ['key' => $k, 'province' => $prov, 'labels' => $labels];
    }
    $provinces = [];
    foreach ($scope as $k) $provinces[] = ['key' => $k, 'labels' => LEAD_PROVINCES[$k]];
    $positions = [];
    foreach (LEAD_POSITIONS as $k => $labels) $positions[] = ['key' => $k, 'labels' => $labels];
    $sections = array_map(fn($k) => ['key' => $k, 'labels' => LEAD_POSITIONS[$k]], LEAD_SECTIONS);
    ok(['positions' => $positions, 'sections' => $sections, 'provinces' => $provinces, 'districts' => $districts]);
}

if ($method === 'GET' && !isset($_GET['all']) && !isset($_GET['id']) && !isset($_GET['key'])) {
    $lang = lead_lang();
    $order = 'display_order, id'; // admin Display Order; the first profile is the featured leader

    if (isset($_GET['slug'])) {
        $slug = trim((string)$_GET['slug']);
        if (!preg_match('/(?:^|-)(\d+)$/', $slug, $m)) fail('Leader not found', 404);
        $s = db()->prepare("SELECT *, UNIX_TIMESTAMP(updated_at) AS updated_ts, UNIX_TIMESTAMP(auto_saved_at) AS auto_saved_ts, UNIX_TIMESTAMP(published_at) AS published_ts FROM leadership WHERE id = ? AND status = 'published' AND deleted_at IS NULL");
        $s->execute([(int)$m[1]]);
        $row = $s->fetch();
        if (!$row) fail('Leader not found', 404);
        ok(lead_public_row($row, $lang));
    }

    $rows = db()->query("SELECT *, UNIX_TIMESTAMP(updated_at) AS updated_ts, UNIX_TIMESTAMP(auto_saved_at) AS auto_saved_ts, UNIX_TIMESTAMP(published_at) AS published_ts FROM leadership WHERE status = 'published' AND deleted_at IS NULL ORDER BY $order")->fetchAll();
    $items = array_values(array_filter(
        array_map(fn($r) => lead_public_row($r, $lang), $rows),
        fn($l) => $l['name'] !== ''
    ));
    ok(['items' => $items, 'total' => count($items)]);
}

// ---------- Admin ----------
$user = lead_require_admin();

if ($method === 'GET' && (isset($_GET['id']) || isset($_GET['key']))) {
    if (isset($_GET['key'])) {
        $s = db()->prepare('SELECT *, UNIX_TIMESTAMP(updated_at) AS updated_ts, UNIX_TIMESTAMP(auto_saved_at) AS auto_saved_ts, UNIX_TIMESTAMP(published_at) AS published_ts FROM leadership WHERE profile_key = ? AND deleted_at IS NULL');
        $s->execute([(string)$_GET['key']]);
        $row = $s->fetch() ?: null;
    } else {
        $row = lead_find((int)$_GET['id']);
    }
    if (!$row) fail('Not found', 404);
    ok(lead_admin_row($row));
}

if ($method === 'GET') {
    $where = 'deleted_at IS NULL';
    $params = [];
    if (!empty($_GET['status']) && in_array($_GET['status'], LEAD_STATUSES, true)) {
        $where .= ' AND status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['district']) && isset(LEAD_DISTRICTS[$_GET['district']])) { $where .= ' AND district = ?'; $params[] = $_GET['district']; }
    if (!empty($_GET['province']) && isset(LEAD_PROVINCES[$_GET['province']])) { $where .= ' AND province = ?'; $params[] = $_GET['province']; }
    if (!empty($_GET['q'])) {
        $where .= ' AND id IN (SELECT leadership_id FROM leadership_translations WHERE name LIKE ? OR position LIKE ?)';
        $like = '%' . $_GET['q'] . '%';
        $params[] = $like; $params[] = $like;
    }
    $s = db()->prepare("SELECT *, UNIX_TIMESTAMP(updated_at) AS updated_ts, UNIX_TIMESTAMP(auto_saved_at) AS auto_saved_ts, UNIX_TIMESTAMP(published_at) AS published_ts FROM leadership WHERE $where ORDER BY updated_at DESC, id DESC");
    $s->execute($params);
    $stats = db()->query('SELECT status, COUNT(*) c FROM leadership WHERE deleted_at IS NULL GROUP BY status')->fetchAll(PDO::FETCH_KEY_PAIR);
    ok([
        'items' => array_map('lead_admin_row', $s->fetchAll()),
        'stats' => [
            'total'     => array_sum($stats),
            'draft'     => (int)($stats['draft'] ?? 0),
            'published' => (int)($stats['published'] ?? 0),
            'inactive'  => (int)($stats['inactive'] ?? 0),
        ],
    ]);
}

$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'upload') {
    if (empty($_FILES['file'])) fail('No file uploaded', 422);
    $res = upload_file($_FILES['file'], 'leadership', ['jpg', 'jpeg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp'], (int)env('UPLOAD_MAX_IMAGE', 5242880));
    if (!$res || isset($res['error'])) fail($res['error'] ?? 'Upload failed', 422);
    ok(['path' => $res['path'], 'url' => lead_image_url($res['path'])]);
}

if ($method === 'POST' && $action === 'status') {
    $id = (int)($_GET['id'] ?? 0);
    $status = request_body()['status'] ?? '';
    if (!$id || !in_array($status, LEAD_STATUSES, true)) fail('Invalid request', 422);
    $row = lead_find($id);
    if (!$row) fail('Not found', 404);
    if ($status === 'published') {
        $tr = lead_translations($id);
        $complete = array_filter(LEAD_LANGS, fn($l) => lead_lang_complete($tr[$l]));
        if (!$complete) fail('Add a full name and position in at least one language before publishing.', 422, ['field' => 'name']);
        if (!$row['position_key']) fail('Choose a profile section before publishing.', 422, ['field' => 'section']);
        if (!lead_valid_email($row['email'])) fail('Enter a valid official email before publishing.', 422, ['field' => 'email']);
        if (!lead_valid_phone($row['phone'])) fail('Enter a valid official phone number before publishing.', 422, ['field' => 'phone']);
    }
    db()->prepare(
        'UPDATE leadership SET status = ?, updated_by = ?, published_at = ' .
        ($status === 'published' ? 'COALESCE(published_at, NOW())' : 'published_at') . ' WHERE id = ?'
    )->execute([$status, $user['id'], $id]);
    activity_log($user['id'], 'leadership.status.' . $status, 'leadership', $id);
    ok(lead_admin_row(lead_find($id)));
}

if ($method === 'POST' || $method === 'PUT') {
    $b = request_body();
    $id = (int)($_GET['id'] ?? $b['id'] ?? 0);
    $key = (string)($b['profileKey'] ?? '');
    if (!$id && !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $key)) {
        fail('profileKey (UUID) is required for a new profile', 422);
    }

    $district = $b['district'] ?? null;
    // New selections must be in an active province; a value already stored on this profile is kept as-is.
    $current = $id ? lead_find($id) : null;
    if ($district !== null && $district !== '' && $district !== ($current['district'] ?? null)
        && !(isset(LEAD_DISTRICTS[$district]) && in_array(LEAD_DISTRICTS[$district][0], LEAD_ACTIVE_PROVINCES, true))) {
        fail('Unknown district', 422);
    }
    $province = $b['province'] ?? null;
    if ($province !== null && $province !== '' && $province !== ($current['province'] ?? null)
        && !in_array($province, LEAD_ACTIVE_PROVINCES, true)) {
        fail('Unknown province', 422);
    }
    if ($district && $province && isset(LEAD_DISTRICTS[$district]) && LEAD_DISTRICTS[$district][0] !== $province) {
        fail('District does not belong to the selected province', 422);
    }
    $positionKey = $b['positionKey'] ?? null;
    if ($positionKey !== null && $positionKey !== '' && !isset(LEAD_POSITIONS[$positionKey])) fail('Unknown position', 422);
    $email = lead_clean($b['email'] ?? null, 150);
    $appointment = lead_clean($b['appointmentDate'] ?? null, 10);
    if ($appointment && !DateTime::createFromFormat('!Y-m-d', $appointment)) fail('Invalid appointment date', 422);
    $image = lead_clean($b['image'] ?? null, 255);
    if ($image && !preg_match('#^uploads/leadership/[a-f0-9]{32}\.(jpe?g|png|webp|gif)$#', $image)) fail('Invalid image path', 422);

    $positionOrder = $positionKey ? array_search($positionKey, array_keys(LEAD_POSITIONS), true) + 1 : 99;
    $fields = [
        'position_key'   => $positionKey ?: null,
        'position_order' => $positionOrder,
        'image'          => $image,
        'district'       => $district ?: null,
        'province'       => $province ?: null,
        'appointment_date' => $appointment,
        'email'          => $email,
        'phone'          => lead_clean($b['phone'] ?? null, 30),
        'facebook'       => lead_clean($b['facebook'] ?? null, 255),
        'twitter'        => lead_clean($b['twitter'] ?? null, 255),
        'instagram'      => lead_clean($b['instagram'] ?? null, 255),
        'youtube'        => lead_clean($b['youtube'] ?? null, 255),
        'display_order'  => (int)($b['displayOrder'] ?? 0),
        'updated_by'     => $user['id'],
    ];

    $tr = [];
    foreach (LEAD_LANGS as $l) {
        $t = $b['translations'][$l] ?? null;
        if (!is_array($t)) continue;
        foreach (LEAD_TR_FIELDS as $k => [, $max]) $tr[$l][] = lead_clean($t[$k] ?? null, $max);
    }

    $wasNewProfile = !$id;
    if ($wasNewProfile) {
        $existingKey = db()->prepare('SELECT id FROM leadership WHERE profile_key=? AND deleted_at IS NULL LIMIT 1');
        $existingKey->execute([strtolower($key)]);
        $wasNewProfile = !$existingKey->fetchColumn();
    }

    try {
        db()->beginTransaction();
        if ($id) {
            if (!lead_find($id)) { db()->rollBack(); fail('Not found', 404); }
            $sets = implode(',', array_map(fn($k) => "$k = ?", array_keys($fields)));
            db()->prepare("UPDATE leadership SET $sets, auto_saved_at = NOW() WHERE id = ?")->execute([...array_values($fields), $id]);
        } else {
            // Upsert by client profile key: repeated auto-saves of a new form never create duplicates.
            $cols = array_keys($fields);
            $sql = 'INSERT INTO leadership (profile_key, status, created_by, auto_saved_at, ' . implode(',', $cols) . ') VALUES (?, \'draft\', ?, NOW(), '
                . implode(',', array_fill(0, count($cols), '?')) . ') ON DUPLICATE KEY UPDATE '
                . implode(',', array_map(fn($k) => "$k = VALUES($k)", $cols)) . ', auto_saved_at = NOW(), id = LAST_INSERT_ID(id)';
            db()->prepare($sql)->execute([strtolower($key), $user['id'], ...array_values($fields)]);
            $id = (int)db()->lastInsertId();
            $existing = lead_find($id);
            if (!$existing) { db()->rollBack(); fail('This profile was deleted.', 410); }
        }
        $cols = array_map(fn($f) => $f[0], array_values(LEAD_TR_FIELDS));
        $up = db()->prepare(
            'INSERT INTO leadership_translations (leadership_id, language_code, ' . implode(', ', $cols) . ') VALUES (?, ?, '
            . implode(', ', array_fill(0, count($cols), '?')) . ') ON DUPLICATE KEY UPDATE '
            . implode(', ', array_map(fn($c) => "$c = VALUES($c)", $cols))
        );
        foreach ($tr as $l => $vals) $up->execute([$id, $l, ...$vals]);
        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        error_log('leadership save: ' . $e->getMessage());
        fail('Failed to save leader profile', 500);
    }
    $leadName = trim((string)($b['translations']['en']['name'] ?? $b['translations']['ta']['name'] ?? $b['translations']['si']['name'] ?? ''));
    if ($wasNewProfile) activity_log((int)$user['id'], 'leadership.created', 'leadership', $id, ['name' => $leadName]);
    else activity_log((int)$user['id'], 'leadership.updated', 'leadership', $id, ['name' => $leadName]);
    ok(lead_admin_row(lead_find($id)));
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id || !lead_find($id)) fail('Not found', 404);
    db()->prepare('UPDATE leadership SET deleted_at = NOW(), updated_by = ? WHERE id = ?')->execute([$user['id'], $id]);
    activity_log($user['id'], 'leadership.delete', 'leadership', $id);
    ok(['deleted' => $id]);
}

fail('Method not allowed', 405);
