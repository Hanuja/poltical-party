<?php
// Hero banner API.
// Public:  GET /api/hero/             -> active banner (translations as {en,si,ta} maps)
// Admin:   GET /api/hero/?all=1       -> all banners (auth)
//          POST /api/hero/            -> create banner (auth)
//          PUT  /api/hero/?id=N       -> update banner (auth)
//          DELETE /api/hero/?id=N     -> delete banner (auth)
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/validator.php';
require_once dirname(__DIR__) . '/../helpers/log.php';

const HERO_LANGS = ['en', 'si', 'ta'];
const HERO_TEXT_FIELDS = ['badge', 'heading', 'heading_highlight', 'description', 'cta1_label', 'cta2_label'];

function hero_camel(string $field): string {
    // heading_highlight -> headingHighlight, cta1_label -> cta1Label
    return preg_replace_callback('/_([a-zA-Z])/', fn($m) => strtoupper($m[1]), $field);
}

function hero_row_to_public(array $row): array {
    $stmt = db()->prepare('SELECT * FROM hero_banner_translations WHERE banner_id = ?');
    $stmt->execute([$row['id']]);
    $tr = [];
    foreach ($stmt->fetchAll() as $t) {
        foreach (HERO_TEXT_FIELDS as $f) {
            $tr[$f][$t['language_code']] = $t[$f];
        }
    }
    $out = [
        'id'           => (int)$row['id'],
        'isActive'     => (bool)$row['is_active'],
        'sortOrder'    => (int)$row['sort_order'],
        'imageDesktop' => $row['image_desktop'],
        'imageMobile'  => $row['image_mobile'],
        'logo'         => $row['logo'],
        'cta1Url'      => $row['cta1_url'],
        'cta2Url'      => $row['cta2_url'],
    ];
    foreach (HERO_TEXT_FIELDS as $f) {
        $langs = $tr[$f] ?? [];
        $out[hero_camel($f)] = [
            'en' => $langs['en'] ?? '',
            'si' => $langs['si'] ?? '',
            'ta' => $langs['ta'] ?? '',
        ];
    }
    return $out;
}

function hero_fetch_all(): array {
    return db()->query('SELECT * FROM hero_banners ORDER BY sort_order ASC, id ASC')->fetchAll();
}

function hero_save_translations(int $bannerId, array $translations): void {
    foreach (HERO_LANGS as $lang) {
        $t = $translations[$lang] ?? null;
        if (!is_array($t)) continue;
        $params = [];
        foreach (HERO_TEXT_FIELDS as $f) {
            $params[] = $t[$f] ?? null;
        }
        db()->prepare(
            'INSERT INTO hero_banner_translations (banner_id, language_code, badge, heading, heading_highlight, description, cta1_label, cta2_label)
             VALUES (?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               badge = VALUES(badge), heading = VALUES(heading), heading_highlight = VALUES(heading_highlight),
               description = VALUES(description), cta1_label = VALUES(cta1_label), cta2_label = VALUES(cta2_label)'
        )->execute(array_merge([$bannerId, $lang], $params));
    }
}

function hero_deactivate_others(int $keepId): void {
    db()->prepare('UPDATE hero_banners SET is_active = 0 WHERE id != ?')->execute([$keepId]);
}

$method = $_SERVER['REQUEST_METHOD'];

// ---------- Admin operations ----------
if ($method !== 'GET' || isset($_GET['all'])) {
    $user = require_auth();
    $roles = $user['roles'] ?? [];
    if (!array_intersect($roles, ['Super Admin', 'Admin', 'Content Manager'])) {
        fail('Forbidden', 403);
    }

    if ($method === 'GET') { // ?all=1
        ok(array_map('hero_row_to_public', hero_fetch_all()));
    }

    if ($method === 'POST') {
        $b = request_body();
        if (empty($b['image_desktop'])) fail('image_desktop is required', 422);
        db()->beginTransaction();
        try {
            db()->prepare(
                'INSERT INTO hero_banners (is_active, sort_order, image_desktop, image_mobile, logo, cta1_url, cta2_url, created_by)
                 VALUES (?,?,?,?,?,?,?,?)'
            )->execute([
                !empty($b['is_active']) ? 1 : 0,
                (int)($b['sort_order'] ?? 0),
                $b['image_desktop'],
                $b['image_mobile'] ?? null,
                $b['logo'] ?? null,
                $b['cta1_url'] ?? null,
                $b['cta2_url'] ?? null,
                $user['id'],
            ]);
            $id = (int)db()->lastInsertId();
            hero_save_translations($id, $b['translations'] ?? []);
            if (!empty($b['is_active'])) hero_deactivate_others($id);
            db()->commit();
        } catch (Throwable $e) {
            db()->rollBack();
            error_log('hero create: ' . $e->getMessage());
            fail('Failed to create banner', 500);
        }
        activity_log($user['id'], 'hero_banner.create', 'hero_banners', $id);
        $row = db()->query("SELECT * FROM hero_banners WHERE id = $id")->fetch();
        ok(hero_row_to_public($row));
    }

    if ($method === 'PUT') {
        $id = (int)($_GET['id'] ?? 0);
        $b = request_body();
        if (!$id) fail('id is required', 422);
        $stmt = db()->prepare('SELECT * FROM hero_banners WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) fail('Banner not found', 404);
        db()->beginTransaction();
        try {
            db()->prepare(
                'UPDATE hero_banners SET is_active=?, sort_order=?, image_desktop=?, image_mobile=?, logo=?, cta1_url=?, cta2_url=? WHERE id=?'
            )->execute([
                array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : (int)$existing['is_active'],
                (int)($b['sort_order'] ?? $existing['sort_order']),
                $b['image_desktop'] ?? $existing['image_desktop'],
                array_key_exists('image_mobile', $b) ? $b['image_mobile'] : $existing['image_mobile'],
                array_key_exists('logo', $b) ? $b['logo'] : $existing['logo'],
                array_key_exists('cta1_url', $b) ? $b['cta1_url'] : $existing['cta1_url'],
                array_key_exists('cta2_url', $b) ? $b['cta2_url'] : $existing['cta2_url'],
                $id,
            ]);
            hero_save_translations($id, $b['translations'] ?? []);
            if (!empty($b['is_active'])) hero_deactivate_others($id);
            db()->commit();
        } catch (Throwable $e) {
            db()->rollBack();
            error_log('hero update: ' . $e->getMessage());
            fail('Failed to update banner', 500);
        }
        activity_log($user['id'], 'hero_banner.update', 'hero_banners', $id);
        $row = db()->query("SELECT * FROM hero_banners WHERE id = $id")->fetch();
        ok(hero_row_to_public($row));
    }

    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) fail('id is required', 422);
        $stmt = db()->prepare('DELETE FROM hero_banners WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->rowCount()) fail('Banner not found', 404);
        activity_log($user['id'], 'hero_banner.delete', 'hero_banners', $id);
        ok(['deleted' => $id]);
    }

    fail('Method not allowed', 405);
}

// ---------- Public: active banner ----------
$rows = hero_fetch_all();
$active = null;
foreach ($rows as $r) {
    if ($r['is_active']) { $active = $r; break; }
}
if (!$active && $rows) $active = $rows[0]; // fallback to first banner
if (!$active) ok(null);
ok(hero_row_to_public($active));
