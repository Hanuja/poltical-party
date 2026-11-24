<?php
// Policies API — public reads.
// GET /api/policies/?lang=&category=&featured=1&id|slug=
require_once dirname(__DIR__) . '/bootstrap.php';

const POL_LANGS = ['en', 'ta', 'si'];

function pol_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, POL_LANGS, true) ? $l : 'en';
}
function pol_media_url(?string $p): ?string {
    if (!$p) return null;
    if (preg_match('#^(https?:)?//#', $p) || str_starts_with($p, '/')) return $p;
    return rtrim(env('SITE_URL', ''), '/') . '/backend/' . ltrim($p, '/');
}
function pol_tr(int $id): array {
    $s = db()->prepare('SELECT * FROM policy_translations WHERE policy_id=?');
    $s->execute([$id]);
    $out = [];
    foreach ($s->fetchAll() as $t) {
        $out[$t['language_code']] = [
            'title' => $t['title'], 'slug' => $t['slug'],
            'summary' => $t['summary'], 'content' => $t['content'],
        ];
    }
    return $out;
}
function pol_row(array $r, string $lang = 'en'): array {
    $tr = pol_tr((int)$r['id']);
    $pick = fn($c) => $tr[$c] ?? null;
    $t = $pick($lang) ?: $pick('en') ?: (reset($tr) ?: []);
    return [
        'id' => (int)$r['id'],
        'slug' => $t['slug'] ?? null,
        'title' => $t['title'] ?? '',
        'summary' => $t['summary'] ?? '',
        'content' => $t['content'] ?? '',
        'image' => pol_media_url($r['image']),
        'isFeatured' => (bool)$r['is_featured'],
        'displayOrder' => (int)$r['display_order'],
        'status' => $r['status'],
        'categoryId' => $r['category_id'] ? (int)$r['category_id'] : null,
        'category' => $r['category_id'] ? (db()->query("SELECT pc.id, pct.name, pct.slug FROM policy_categories pc LEFT JOIN policy_category_translations pct ON pct.category_id=pc.id AND pct.language_code='en' WHERE pc.id=".(int)$r['category_id'])->fetch() ?: null) : null,
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$seg = trim(substr($path, strpos($path, '/policies') + 9), '/');
$idOrSlug = $seg !== '' ? urldecode($seg) : ($_GET['slug'] ?? $_GET['id'] ?? '');
$lang = pol_lang();

// ---------- single ----------
if ($method === 'GET' && $idOrSlug !== '') {
    $row = null;
    if (ctype_digit($idOrSlug)) {
        $s = db()->prepare("SELECT * FROM policies WHERE id=? AND status='published'");
        $s->execute([(int)$idOrSlug]);
        $row = $s->fetch();
    } else {
        $s = db()->query("SELECT * FROM policies WHERE status='published'");
        foreach ($s->fetchAll() as $cand) {
            foreach (pol_tr((int)$cand['id']) as $tt) {
                if (($tt['slug'] ?? '') === $idOrSlug) { $row = $cand; break 2; }
            }
        }
    }
    if (!$row) fail('Policy not found', 404);
    ok(pol_row($row, $lang));
}

// ---------- list ----------
if ($method === 'GET') {
    $where = "p.status='published'";
    $params = [];
    $cat = trim((string)($_GET['category'] ?? ''));
    if ($cat !== '') {
        $catId = 0;
        $s = db()->query('SELECT pc.id, pct.slug FROM policy_categories pc LEFT JOIN policy_category_translations pct ON pct.category_id=pc.id');
        foreach ($s->fetchAll() as $c) {
            if ((string)$c['id'] === $cat || ($c['slug'] ?? '') === $cat) $catId = (int)$c['id'];
        }
        $where .= ' AND p.category_id = ?';
        $params[] = $catId;
    }
    if (!empty($_GET['featured'])) $where .= ' AND p.is_featured=1';
    $stmt = db()->prepare("SELECT p.* FROM policies p WHERE $where ORDER BY p.is_featured DESC, p.display_order ASC, p.id DESC");
    $stmt->execute($params);
    $items = array_map(fn($r) => pol_row($r, $lang), $stmt->fetchAll());
    ok(['items' => $items, 'total' => count($items)]);
}

fail('Method not allowed', 405);
