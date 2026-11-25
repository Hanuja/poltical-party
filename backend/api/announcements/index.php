<?php
// Announcements API.
// Public (Party announcements are filtered per viewer — see helpers/announcement_access.php):
//          GET /api/announcements/                 ?lang=&category=&type=&q=&from=&to=&sort=&homepage=&page=&limit=
//                                                   -> {items,total,page,limit,pages,counts,subTypes}
//          GET /api/announcements/?slug=title-12    -> single announcement (also ?slug=12)
//          GET /api/announcements/?related=12       -> related announcements
//          GET /api/announcements/?attachment=N | ?pdf=12 -> permission-checked file download
//          GET /api/announcements/?breaking=1       -> breaking items
//          GET /api/announcements/?categories=1     -> categories
// Admin:   GET    /api/announcements/?all=1         -> all incl. drafts (auth)
//          GET    /api/announcements/?id=N          -> single incl. draft (auth)
//          POST   /api/announcements/               -> create/update draft (auth)
//          PUT    /api/announcements/?id=N          -> update (auth)
//          POST   /api/announcements/?action=publish&id=N
//          POST   /api/announcements/?action=status&id=N  {status}
//          POST   /api/announcements/?action=upload  -> image upload (auth)
//          DELETE /api/announcements/?id=N          -> soft delete (auth)
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/upload.php';
require_once dirname(__DIR__) . '/../helpers/log.php';
require_once dirname(__DIR__) . '/../helpers/announcement_access.php';
require_once dirname(__DIR__) . '/../helpers/announcement_expiry.php';

const ANN_LANGS = ['ta', 'en', 'si'];

function ann_require_admin(): array {
    $user = require_auth();
    $roles = $user['roles'] ?? [];
    if (!array_intersect($roles, ['Super Admin', 'Admin', 'Content Manager'])) {
        fail('Forbidden', 403);
    }
    return $user;
}

function ann_slugify(string $text): string {
    $text = mb_strtolower(trim($text));
    $text = preg_replace('/[^\p{L}\p{N}\s-]/u', '', $text);
    $text = preg_replace('/[\s_]+/', '-', $text);
    return trim($text, '-');
}

function ann_fetch_translations(int $id): array {
    $stmt = db()->prepare('SELECT * FROM announcement_translations WHERE announcement_id = ?');
    $stmt->execute([$id]);
    $out = [];
    foreach ($stmt->fetchAll() as $t) {
        $out[$t['language_code']] = [
            'title' => $t['title'],
            'shortDescription' => $t['short_description'],
            'content' => $t['content'],
            'imageCaption' => $t['image_caption'],
        ];
    }
    return $out;
}

function ann_row_public(array $row, string $lang = 'en'): array {
    $tr = ann_fetch_translations((int)$row['id']);
    $pick = function ($code) use ($tr) {
        return $tr[$code] ?? null;
    };
    // fallback chain: requested -> en -> ta -> first available
    $t = $pick($lang) ?: $pick('en') ?: $pick('ta') ?: (reset($tr) ?: []);
    $cat = null;
    if ($row['category_id']) {
        $s = db()->prepare('SELECT name, slug FROM announcement_categories WHERE id = ?');
        $s->execute([$row['category_id']]);
        $cat = $s->fetch() ?: null;
    }
    return [
        'id' => (int)$row['id'],
        'slug' => ann_slug($row['id'], $t['title'] ?? ''),
        'category' => $cat,
        'coverImage' => ann_media_url($row['cover_image']),
        'image' => ann_media_url($row['cover_image']),
        'imageAlt' => $row['image_alt'] ?: null,
        'status' => $row['status'],
        'isFeatured' => (bool)$row['is_featured'],
        'isImportant' => (bool)$row['is_important'],
        'isBreaking' => (bool)($row['is_breaking'] ?? 0),
        'showOnHomepage' => (bool)$row['show_on_homepage'],
        'allowSocialSharing' => (bool)$row['allow_social_sharing'],
        'publishedAt' => $row['published_at'],
        'scheduledAt' => $row['scheduled_at'] ?? null,
        'pressMeetingDate' => $row['press_meeting_date'] ?? null,
        'noticeDate' => $row['notice_date'] ?? null,
        'eventDate' => $row['event_date'] ?? null,
        'expiresAt' => $row['expires_at'],
        'announcementCode' => $row['announcement_code'] ?? null,
        'referenceNumber' => $row['reference_number'] ?? null,
        'announcementType' => $row['announcement_type'] ?? null,
        'eventType' => $row['event_type'] ?? null,
        'spokesperson' => $row['spokesperson'] ?? null,
        'meetingLocation' => $row['meeting_location'] ?? null,
        'noticeCategory' => $row['notice_category'] ?? null,
        'district' => $row['district'] ?? null,
        'dsDivision' => $row['ds_division'] ?? null,
        'gnDivision' => $row['gn_division'] ?? null,
        'contactPerson' => $row['contact_person'] ?? null,
        'contactPhone' => $row['contact_phone'] ?? null,
        'contactEmail' => $row['contact_email'] ?? null,
        'videoUrl' => ann_media_url($row['video_url']),
        'media' => !empty($row['media_json']) ? json_decode($row['media_json'], true) : [],
        'pdfPath' => $row['pdf_path'] ?? null,
        'breakingPriority' => (int)($row['breaking_priority'] ?? 0),
        'autoSavedAt' => $row['auto_saved_at'] ?? null,
        'title' => $t['title'] ?? '',
        'shortDescription' => $t['shortDescription'] ?? '',
        'content' => $t['content'] ?? '',
        'imageCaption' => $t['imageCaption'] ?? '',
        'translations' => $tr,
        'updatedAt' => $row['updated_at'],
    ];
}

// slug stored nowhere; derive stable slug from id + title
function ann_slug(int $id, string $title): string {
    $s = ann_slugify($title);
    return $s !== '' ? $s . '-' . $id : 'announcement-' . $id;
}

function ann_slug_matches(array $row, string $slug): bool {
    // Accept "title-id", "id", or bare slug forms
    if ((string)$row['id'] === $slug) return true;
    $s = ann_slug((int)$row['id'], '');
    // need title for slug; fetch translations title cheaply via first tr
    $tr = db()->prepare('SELECT title FROM announcement_translations WHERE announcement_id = ? LIMIT 1');
    $tr->execute([$row['id']]);
    $title = (string)($tr->fetchColumn() ?: '');
    $expect = ann_slug((int)$row['id'], $title);
    return $expect === $slug || str_starts_with($expect, $slug) || str_starts_with($slug, ann_slugify($title) . '-');
}

$method = $_SERVER['REQUEST_METHOD'];

// ---------- Scheduled publishing and expired notice deletion ----------
function ann_run_transitions(): void {
    try {
        ann_run_announcement_transitions();
    } catch (Throwable $e) { /* ignore */ }
}
ann_run_transitions();

// ---------- Public endpoints ----------
// Every public read goes through ann_public_where(), which (a) limits to live, titled, published rows and
// (b) applies ann_access_sql(): Party announcements simply do not exist for viewers without access.

const ANN_SUBTYPES = ['Party', 'General', 'Government'];

function ann_public_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, ANN_LANGS, true) ? $l : 'en';
}

function ann_media_url(?string $path): ?string {
    if (!$path) return null;
    if (preg_match('#^(https?:)?//#', $path) || str_starts_with($path, '/')) return $path;
    return rtrim(env('SITE_URL', ''), '/') . '/backend/' . ltrim($path, '/');
}

function ann_iso(?string $dt): ?string {
    return $dt ? str_replace(' ', 'T', substr($dt, 0, 19)) : null;
}

function ann_like(string $q): string {
    return '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
}

function ann_public_where(array $viewer, array &$params): string {
    return "a.status = 'published' AND a.deleted_at IS NULL
        AND (a.published_at IS NULL OR a.published_at <= NOW())
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
        AND EXISTS (SELECT 1 FROM announcement_translations tt
                    WHERE tt.announcement_id = a.id AND tt.title IS NOT NULL AND tt.title <> '')
        AND " . ann_access_sql($viewer, $params, 'a');
}

function ann_bind_run(string $sql, array $params): PDOStatement {
    $s = db()->prepare($sql);
    $i = 1;
    foreach ($params as $p) $s->bindValue($i++, $p, is_int($p) ? PDO::PARAM_INT : PDO::PARAM_STR);
    $s->execute();
    return $s;
}

function ann_categories(): array {
    static $cats = null;
    if ($cats === null) {
        $cats = [];
        foreach (db()->query('SELECT id, name, slug FROM announcement_categories')->fetchAll() as $c) {
            $cats[(int)$c['id']] = ['id' => (int)$c['id'], 'name' => $c['name'], 'slug' => $c['slug']];
        }
    }
    return $cats;
}

function ann_translations_for(array $ids): array {
    if (!$ids) return [];
    $in = implode(',', array_fill(0, count($ids), '?'));
    $out = [];
    foreach (ann_bind_run("SELECT * FROM announcement_translations WHERE announcement_id IN ($in)", array_map('intval', $ids))->fetchAll() as $t) {
        $out[(int)$t['announcement_id']][$t['language_code']] = $t;
    }
    return $out;
}

// requested language → en → ta → si, skipping versions without a title.
function ann_pick_tr(array $trs, string $lang): array {
    foreach (array_unique([$lang, 'en', 'ta', 'si']) as $code) {
        if (!empty($trs[$code]['title'])) return $trs[$code];
    }
    return [];
}

function ann_card(array $row, array $trs, string $lang): array {
    $t = ann_pick_tr($trs, $lang);
    $cats = ann_categories();
    $type = in_array($row['announcement_type'] ?? null, ANN_SUBTYPES, true) ? $row['announcement_type'] : null;
    return [
        'id' => (int)$row['id'],
        'slug' => ann_slug((int)$row['id'], (string)($trs['en']['title'] ?? $t['title'] ?? '')),
        'category' => $cats[(int)$row['category_id']] ?? null,
        'type' => $type,
        'title' => (string)($t['title'] ?? ''),
        'shortDescription' => (string)($t['short_description'] ?? ''),
        'language' => $t['language_code'] ?? $lang,
        'image' => ann_media_url($row['cover_image']),
        'imageAlt' => $row['image_alt'] ?: null,
        'isFeatured' => (bool)$row['is_featured'],
        'isImportant' => (bool)$row['is_important'],
        'isBreaking' => (bool)($row['is_breaking'] ?? 0),
        'publishedAt' => ann_iso($row['published_at'] ?: $row['created_at']),
    ];
}

function ann_cards(array $rows, string $lang): array {
    $trs = ann_translations_for(array_column($rows, 'id'));
    return array_map(fn($r) => ann_card($r, $trs[(int)$r['id']] ?? [], $lang), $rows);
}

function ann_download_path(string $kind, int $id): string {
    return '/announcements/?' . $kind . '=' . $id;
}

function ann_detail(array $row, string $lang): array {
    $trs = ann_translations_for([(int)$row['id']]);
    $trs = $trs[(int)$row['id']] ?? [];
    $t = ann_pick_tr($trs, $lang);
    $out = ann_card($row, $trs, $lang);

    $attachments = [];
    $s = db()->prepare('SELECT id, file_name, title, description, mime_type, file_type, file_size, file_path
                        FROM announcement_attachments WHERE announcement_id = ? ORDER BY id');
    $s->execute([(int)$row['id']]);
    foreach ($s->fetchAll() as $f) {
        $attachments[] = [
            'id' => (int)$f['id'],
            'name' => $f['title'] ?: ($f['file_name'] ?: basename((string)$f['file_path'])),
            'description' => $f['description'] ?: null,
            'mime' => $f['mime_type'] ?: $f['file_type'] ?: null,
            'size' => $f['file_size'] !== null ? (int)$f['file_size'] : null,
            'download' => ann_download_path('attachment', (int)$f['id']),
        ];
    }
    if (!empty($row['pdf_path'])) {
        $external = (bool)preg_match('#^https?://#i', $row['pdf_path']);
        $attachments[] = [
            'id' => 0,
            'name' => basename(parse_url($row['pdf_path'], PHP_URL_PATH) ?: 'document.pdf'),
            'description' => null,
            'mime' => 'application/pdf',
            'size' => null,
            'download' => $external ? null : ann_download_path('pdf', (int)$row['id']),
            'url' => $external ? $row['pdf_path'] : null,
        ];
    }

    return $out + [
        'content' => (string)($t['content'] ?? ''),
        'imageCaption' => $t['image_caption'] ?? null,
        'referenceNumber' => $row['reference_number'] ?: null,
        'spokesperson' => $row['spokesperson'] ?: null,
        'meetingLocation' => $row['meeting_location'] ?: null,
        'district' => $row['district'] ?: null,
        'eventDate' => $row['event_date'] ?: null,
        'noticeDate' => $row['notice_date'] ?: null,
        'pressMeetingDate' => $row['press_meeting_date'] ?: null,
        'expiresAt' => ann_iso($row['expires_at']),
        'videoUrl' => ann_media_url($row['video_url']),
        'media' => !empty($row['media_json']) ? json_decode($row['media_json'], true) : [],
        'contactPerson' => $row['contact_person'] ?: null,
        'contactPhone' => $row['contact_phone'] ?: null,
        'contactEmail' => $row['contact_email'] ?: null,
        'allowSocialSharing' => (bool)$row['allow_social_sharing'],
        'attachments' => $attachments,
        'updatedAt' => ann_iso($row['updated_at']),
    ];
}

// Streams a stored file after the caller has checked access. Only files under backend/uploads are served.
function ann_send_file(string $relPath, ?string $downloadName, ?string $mime): void {
    $root = realpath(dirname(__DIR__, 2) . '/uploads');
    $real = realpath(dirname(__DIR__, 2) . '/' . ltrim(preg_replace('#^/?backend/#', '', $relPath), '/'));
    if (!$root || !$real || !str_starts_with($real, $root . DIRECTORY_SEPARATOR) || !is_file($real)) {
        fail('File not found', 404);
    }
    $name = preg_replace('/[^\p{L}\p{N}._ -]+/u', '_', $downloadName ?: basename($real));
    if (!preg_match('/\.[A-Za-z0-9]{2,5}$/', $name)) $name .= '.' . pathinfo($real, PATHINFO_EXTENSION);
    ann_private_cache_headers();
    header('Content-Type: ' . ($mime ?: (new finfo(FILEINFO_MIME_TYPE))->file($real) ?: 'application/octet-stream'));
    header('Content-Length: ' . filesize($real));
    header("Content-Disposition: attachment; filename=\"" . addcslashes($name, '"\\') . "\"; filename*=UTF-8''" . rawurlencode($name));
    header('X-Content-Type-Options: nosniff');
    readfile($real);
    exit;
}

if ($method === 'GET' && !isset($_GET['all']) && !isset($_GET['id'])) {
    $lang = ann_public_lang();
    $viewer = ann_viewer();
    if ($viewer['user']) ann_private_cache_headers();

    if (isset($_GET['categories'])) {
        ok(array_values(ann_categories()));
    }

    // GET ?attachment=N  /  ?pdf=ANNOUNCEMENT_ID — permission-checked downloads.
    if (isset($_GET['attachment']) || isset($_GET['pdf'])) {
        $params = [];
        $where = ann_public_where($viewer, $params);
        if (isset($_GET['attachment'])) {
            $params[] = (int)$_GET['attachment'];
            $f = ann_bind_run(
                "SELECT f.file_path, f.file_name, f.title, f.mime_type FROM announcement_attachments f
                 JOIN announcements a ON a.id = f.announcement_id WHERE $where AND f.id = ?", $params
            )->fetch();
            if (!$f) fail('File not found', 404);
            ann_send_file($f['file_path'], $f['file_name'] ?: $f['title'], $f['mime_type']);
        }
        $params[] = (int)$_GET['pdf'];
        $r = ann_bind_run("SELECT a.pdf_path FROM announcements a WHERE $where AND a.id = ?", $params)->fetch();
        if (!$r || !$r['pdf_path'] || preg_match('#^https?://#i', $r['pdf_path'])) fail('File not found', 404);
        ann_send_file($r['pdf_path'], null, 'application/pdf');
    }

    // GET ?slug=title-12 (or ?slug=12) — single announcement. Missing and not-permitted look identical.
    if (isset($_GET['slug'])) {
        $slug = trim((string)$_GET['slug']);
        $id = ctype_digit($slug) ? (int)$slug : (preg_match('/-(\d+)$/', $slug, $m) ? (int)$m[1] : 0);
        $row = null;
        if ($id > 0) {
            $params = [];
            $where = ann_public_where($viewer, $params);
            $params[] = $id;
            $row = ann_bind_run("SELECT a.* FROM announcements a WHERE $where AND a.id = ?", $params)->fetch();
        }
        if (!$row) fail('Announcement not found', 404);
        ok(ann_detail($row, $lang));
    }

    // GET ?related=ID&limit=3 — same category first, newest first.
    if (isset($_GET['related'])) {
        $id = (int)$_GET['related'];
        $limit = min(6, max(1, (int)($_GET['limit'] ?? 3)));
        $params = [];
        $where = ann_public_where($viewer, $params);
        $base = ann_bind_run("SELECT a.category_id FROM announcements a WHERE $where AND a.id = ?", array_merge($params, [$id]))->fetch();
        if (!$base) ok([]);
        $params[] = $id;
        $params[] = (int)$base['category_id'];
        $params[] = $limit;
        $rows = ann_bind_run(
            "SELECT a.* FROM announcements a WHERE $where AND a.id <> ?
             ORDER BY (a.category_id = ?) DESC, COALESCE(a.published_at, a.created_at) DESC, a.id DESC LIMIT ?",
            $params
        )->fetchAll();
        ok(ann_cards($rows, $lang));
    }

    if (isset($_GET['breaking'])) {
        $limit = min(10, max(1, (int)($_GET['limit'] ?? 5)));
        $params = [];
        $where = ann_public_where($viewer, $params);
        $params[] = $limit;
        $rows = ann_bind_run(
            "SELECT a.* FROM announcements a WHERE $where AND a.is_breaking = 1 AND a.show_on_homepage = 1
             ORDER BY a.breaking_priority DESC, a.published_at DESC, a.id DESC LIMIT ?", $params
        )->fetchAll();
        ok(ann_cards($rows, $lang));
    }

    // Listing / search:
    //   ?category=<id|slug> &type=Party|General|Government &q= &from=YYYY-MM-DD &to=YYYY-MM-DD
    //   &sort=newest|oldest|featured &homepage=1 &page= &limit= (max 24)
    $params = [];
    $where = ann_public_where($viewer, $params);

    // Filters that also scope the counts (search text + dates).
    $scope = '';
    $scopeParams = [];
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $scope .= " AND a.id IN (SELECT s.announcement_id FROM announcement_translations s
                                 WHERE s.title LIKE ? OR s.short_description LIKE ?)";
        $scopeParams[] = ann_like($q); $scopeParams[] = ann_like($q);
    }
    foreach (['from' => '>=', 'to' => '<='] as $key => $op) {
        $d = (string)($_GET[$key] ?? '');
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
            $scope .= " AND DATE(COALESCE(a.published_at, a.created_at)) $op ?";
            $scopeParams[] = $d;
        }
    }
    // Filters that narrow the list. Homepage counts must use the same checkbox filter so
    // the homepage can hide its section when no eligible announcements are published.
    $narrow = '';
    $narrowParams = [];
    if (!empty($_GET['homepage'])) $narrow .= ' AND a.show_on_homepage = 1';
    $cat = trim((string)($_GET['category'] ?? ''));
    if ($cat !== '') {
        $catId = 0;
        foreach (ann_categories() as $c) {
            if ((string)$c['id'] === $cat || $c['slug'] === $cat) $catId = $c['id'];
        }
        $narrow .= ' AND a.category_id = ?';
        $narrowParams[] = $catId;
    }
    $type = trim((string)($_GET['type'] ?? ''));
    if ($type !== '') {
        $narrow .= ' AND a.announcement_type = ?';
        $narrowParams[] = $type;
    }

    $sort = $_GET['sort'] ?? 'newest';
    $order = match ($sort) {
        'oldest' => 'COALESCE(a.published_at, a.created_at) ASC, a.id ASC',
        'featured' => 'a.is_featured DESC, COALESCE(a.published_at, a.created_at) DESC, a.id DESC',
        default => 'COALESCE(a.published_at, a.created_at) DESC, a.id DESC',
    };

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(24, max(1, (int)($_GET['limit'] ?? 9)));
    $offset = ($page - 1) * $limit;

    $listParams = array_merge($params, $scopeParams, $narrowParams);
    $total = (int)ann_bind_run("SELECT COUNT(*) FROM announcements a WHERE $where $scope $narrow", $listParams)->fetchColumn();
    $rows = ann_bind_run(
        "SELECT a.* FROM announcements a WHERE $where $scope $narrow ORDER BY $order LIMIT ? OFFSET ?",
        array_merge($listParams, [$limit, $offset])
    )->fetchAll();

    // Counts of what this viewer may see (search/date scoped), per category and — only for viewers with
    // Party access — per Official Announcement sub-type.
    $countParams = array_merge($params, $scopeParams);
    $countNarrow = !empty($_GET['homepage']) ? ' AND a.show_on_homepage = 1' : '';
    $byCat = [];
    foreach (ann_bind_run(
        "SELECT a.category_id, COUNT(*) n FROM announcements a WHERE $where $scope $countNarrow GROUP BY a.category_id", $countParams
    )->fetchAll() as $c) {
        $slug = ann_categories()[(int)$c['category_id']]['slug'] ?? null;
        if ($slug) $byCat[$slug] = (int)$c['n'];
    }
    $counts = [
        'all' => (int)ann_bind_run("SELECT COUNT(*) FROM announcements a WHERE $where $scope $countNarrow", $countParams)->fetchColumn(),
        'categories' => (object)$byCat,
    ];

    $subTypes = [];
    if (ann_can_view_party($viewer)) {
        $subTypes = ANN_SUBTYPES;
        $byType = array_fill_keys(ANN_SUBTYPES, 0);
        foreach (ann_bind_run(
            "SELECT a.announcement_type t, COUNT(*) n FROM announcements a
             JOIN announcement_categories c ON c.id = a.category_id AND c.slug = 'official-announcements'
             WHERE $where $scope GROUP BY a.announcement_type", $countParams
        )->fetchAll() as $c) {
            if (isset($byType[$c['t']])) $byType[$c['t']] = (int)$c['n'];
        }
        $counts['types'] = $byType;
    }

    ok([
        'items' => ann_cards($rows, $lang),
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'pages' => (int)max(1, ceil($total / $limit)),
        'counts' => $counts,
        'subTypes' => $subTypes,
    ]);
}

// ---------- Admin endpoints ----------
$user = ann_require_admin();

if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = db()->prepare('SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([(int)$_GET['id']]);
    $row = $stmt->fetch();
    if (!$row) fail('Not found', 404);
    ok(ann_row_public($row, $_GET['lang'] ?? 'en'));
}

if ($method === 'GET') { // ?all=1 admin list
    $where = 'deleted_at IS NULL';
    $params = [];
    if (!empty($_GET['status'])) {
        $statuses = array_filter(array_map('trim', explode(',', $_GET['status'])));
        $statuses = array_values(array_intersect($statuses, ['auto_draft','draft','published','scheduled','archived']));
        if ($statuses) {
            $in = implode(',', array_fill(0, count($statuses), '?'));
            $where .= " AND status IN ($in)";
            foreach ($statuses as $s) $params[] = $s;
        }
    }
    if (!empty($_GET['category'])) { $where .= ' AND category_id = ?'; $params[] = (int)$_GET['category']; }
    if (!empty($_GET['breakingOnly'])) { $where .= ' AND is_breaking = 1'; }
    if (!empty($_GET['notBreaking'])) { $where .= ' AND (is_breaking = 0 OR is_breaking IS NULL)'; }
    if (!empty($_GET['district'])) { $where .= ' AND district = ?'; $params[] = $_GET['district']; }
    if (!empty($_GET['q'])) {
        $where .= " AND id IN (SELECT announcement_id FROM announcement_translations WHERE title LIKE ?)";
        $params[] = '%' . $_GET['q'] . '%';
    }
    [$page, $limit, $offset] = pagination_params();
    $total = (int)(function () use ($where, $params) {
        $s = db()->prepare("SELECT COUNT(*) FROM announcements WHERE $where");
        $s->execute($params); return $s->fetchColumn();
    })();
    $stmt = db()->prepare("SELECT * FROM announcements WHERE $where ORDER BY updated_at DESC LIMIT ? OFFSET ?");
    $i = 1; foreach ($params as $p) $stmt->bindValue($i++, $p);
    $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $stats = db()->query(
        "SELECT status, COUNT(*) c FROM announcements WHERE deleted_at IS NULL GROUP BY status"
    )->fetchAll(PDO::FETCH_KEY_PAIR);
    ok([
        'items' => array_map(fn($r) => ann_row_public($r), $stmt->fetchAll()),
        'total' => $total, 'page' => $page, 'limit' => $limit,
        'stats' => [
            'total' => array_sum($stats),
            'published' => $stats['published'] ?? 0,
            'draft' => $stats['draft'] ?? 0,
            'auto_draft' => $stats['auto_draft'] ?? 0,
            'scheduled' => $stats['scheduled'] ?? 0,
            'archived' => $stats['archived'] ?? 0,
        ],
    ]);
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    // multipart upload: images → uploads/announcements (public), PDFs → uploads/announcements/private
    // (web access denied by .htaccess; served only through the permission-checked ?pdf= / ?attachment= routes).
    if (empty($_FILES['file'])) fail('No file uploaded', 422);
    $f = $_FILES['file'];
    $isPdf = strtolower(pathinfo((string)($f['name'] ?? ''), PATHINFO_EXTENSION)) === 'pdf';
    $ext = strtolower(pathinfo((string)($f['name'] ?? ''), PATHINFO_EXTENSION));
    $isVideo = in_array($ext, ['mp4', 'webm', 'mov'], true);
    if ($isPdf) {
        $res = upload_file($f, 'announcements/private', DOC_EXTS, DOC_MIMES, 10 * 1024 * 1024);
    } elseif ($isVideo) {
        $res = upload_file($f, 'announcements', ['mp4', 'webm', 'mov'], ['video/mp4', 'video/webm', 'video/quicktime'], 100 * 1024 * 1024);
    } else {
        $res = upload_file($f, 'announcements', ['jpg', 'jpeg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    }
    if (!$res || isset($res['error'])) fail($res['error'] ?? 'Upload failed', 422);
    ok(['path' => $res['path'], 'size' => $res['size'], 'mime' => $res['mime']]);
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'publish') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) fail('id required', 422);
    db()->prepare("UPDATE announcements SET status='published', published_at=COALESCE(published_at, NOW()) WHERE id=?")->execute([$id]);
    activity_log($user['id'], 'announcement.publish', 'announcements', $id);
    ok(['id' => $id, 'status' => 'published']);
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'status') {
    $id = (int)($_GET['id'] ?? 0);
    $b = request_body();
    $status = $b['status'] ?? '';
    if (!$id || !in_array($status, ['auto_draft', 'draft', 'published', 'scheduled', 'archived'], true)) {
        fail('Invalid request', 422);
    }
    $pub = in_array($status, ['published', 'scheduled'], true) ? ', published_at=COALESCE(published_at, NOW())' : '';
    db()->prepare("UPDATE announcements SET status=? $pub WHERE id=?")->execute([$status, $id]);
    ok(['id' => $id, 'status' => $status]);
}

if ($method === 'POST' || $method === 'PUT') {
    $b = request_body();
    $id = (int)($_GET['id'] ?? $b['id'] ?? 0);

    // Validate + collect translations
    $translations = $b['translations'] ?? [];
    $cleanTr = [];
    foreach (ANN_LANGS as $lang) {
        $t = $translations[$lang] ?? null;
        if (!is_array($t)) continue;
        $cleanTr[$lang] = [
            'title' => mb_substr(trim((string)($t['title'] ?? '')), 0, 255) ?: null,
            'short_description' => mb_substr(trim((string)($t['shortDescription'] ?? $t['short_description'] ?? '')), 0, 500) ?: null,
            'content' => (string)($t['content'] ?? '') ?: null,
            'image_caption' => mb_substr(trim((string)($t['imageCaption'] ?? $t['image_caption'] ?? '')), 0, 255) ?: null,
        ];
    }

    $existingAnnouncement = null;
    if ($id) {
        $existingQuery = db()->prepare('SELECT category_id, status FROM announcements WHERE id = ? AND deleted_at IS NULL');
        $existingQuery->execute([$id]);
        $existingAnnouncement = $existingQuery->fetch() ?: null;
    }
    $categoryId = isset($b['categoryId']) ? (int)$b['categoryId'] : (int)($b['category_id'] ?? $existingAnnouncement['category_id'] ?? 0);
    $status = in_array($b['status'] ?? '', ['auto_draft','draft','published','scheduled','archived'], true) ? $b['status'] : 'auto_draft';
    if ((ann_categories()[$categoryId]['slug'] ?? '') === 'press-releases') {
        // Press releases are drafts by default; an existing published item stays published
        // while editing, and publication itself is handled by the publish action endpoint.
        $status = ($existingAnnouncement['status'] ?? '') === 'published' ? 'published' : 'draft';
    }

    $fields = [
        'category_id' => $categoryId ?: null,
        'cover_image' => $b['coverImage'] ?? $b['cover_image'] ?? null,
        'image_alt' => $b['imageAlt'] ?? $b['image_alt'] ?? null,
        'status' => $status,
        'is_featured' => !empty($b['isFeatured']) ? 1 : 0,
        'is_important' => !empty($b['isImportant']) ? 1 : 0,
        'is_breaking' => !empty($b['isBreaking']) ? 1 : 0,
        'breaking_priority' => (int)($b['breakingPriority'] ?? 0),
        'announcement_code' => $b['announcementCode'] ?? $b['announcement_code'] ?? null,
        'reference_number' => $b['referenceNumber'] ?? $b['reference_number'] ?? null,
        'announcement_type' => $b['announcementType'] ?? $b['announcement_type'] ?? null,
        'event_type' => $b['eventType'] ?? $b['event_type'] ?? null,
        'spokesperson' => $b['spokesperson'] ?? null,
        'meeting_location' => $b['meetingLocation'] ?? $b['meeting_location'] ?? null,
        'notice_category' => $b['noticeCategory'] ?? $b['notice_category'] ?? null,
        'district' => $b['district'] ?? null,
        'ds_division' => $b['dsDivision'] ?? $b['ds_division'] ?? null,
        'gn_division' => $b['gnDivision'] ?? $b['gn_division'] ?? null,
        'contact_person' => $b['contactPerson'] ?? $b['contact_person'] ?? null,
        'contact_phone' => $b['contactPhone'] ?? $b['contact_phone'] ?? null,
        'contact_email' => $b['contactEmail'] ?? $b['contact_email'] ?? null,
        'video_url' => $b['videoUrl'] ?? $b['video_url'] ?? null,
        'media_json' => isset($b['media']) ? json_encode($b['media'], JSON_UNESCAPED_UNICODE) : ($b['media_json'] ?? null),
        'pdf_path' => $b['pdfPath'] ?? $b['pdf_path'] ?? null,
        'auto_saved_at' => date('Y-m-d H:i:s'),
        'show_on_homepage' => !empty($b['showOnHomepage']) ? 1 : 0,
        'allow_social_sharing' => isset($b['allowSocialSharing']) ? (!empty($b['allowSocialSharing']) ? 1 : 0) : 1,
        'published_at' => $b['publishedAt'] ?? $b['published_at'] ?? null,
        'scheduled_at' => $b['scheduledAt'] ?? $b['scheduled_at'] ?? null,
        'press_meeting_date' => $b['pressMeetingDate'] ?? $b['press_meeting_date'] ?? null,
        'notice_date' => $b['noticeDate'] ?? $b['notice_date'] ?? null,
        'event_date' => $b['eventDate'] ?? $b['event_date'] ?? null,
        'expires_at' => $b['expiresAt'] ?? $b['expires_at'] ?? null,
    ];

    try {
        db()->beginTransaction();
        if ($id) {
            $sets = []; $vals = [];
            foreach ($fields as $k => $v) { $sets[] = "$k=?"; $vals[] = $v; }
            $vals[] = $id;
            db()->prepare('UPDATE announcements SET ' . implode(',', $sets) . ' WHERE id=? AND deleted_at IS NULL')->execute($vals);
            if (db()->prepare('SELECT id FROM announcements WHERE id=?')->execute([$id]) === false) fail('Not found', 404);
        } else {
            $cols = implode(',', array_keys($fields)) . ',created_by';
            $ph = implode(',', array_fill(0, count($fields) + 1, '?'));
            db()->prepare("INSERT INTO announcements ($cols) VALUES ($ph)")
               ->execute(array_merge(array_values($fields), [$user['id']]));
            $id = (int)db()->lastInsertId();
        }
        // upsert translations
        foreach ($cleanTr as $lang => $tr) {
            db()->prepare(
                'INSERT INTO announcement_translations (announcement_id, language_code, title, short_description, content, image_caption)
                 VALUES (?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE title=VALUES(title), short_description=VALUES(short_description),
                   content=VALUES(content), image_caption=VALUES(image_caption)'
            )->execute([$id, $lang, $tr['title'], $tr['short_description'], $tr['content'], $tr['image_caption']]);
        }
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        error_log('announcement save: ' . $e->getMessage());
        fail('Failed to save announcement', 500);
    }
    activity_log($user['id'], $method === 'POST' ? 'announcement.create' : 'announcement.update', 'announcements', $id);
    $row = db()->query("SELECT * FROM announcements WHERE id=$id")->fetch();
    ok(ann_row_public($row));
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) fail('id required', 422);
    db()->prepare('UPDATE announcements SET deleted_at=NOW() WHERE id=?')->execute([$id]);
    activity_log($user['id'], 'announcement.delete', 'announcements', $id);
    ok(['deleted' => $id]);
}

fail('Method not allowed', 405);
