<?php
// Policy categories API — public reads.
// GET /api/policy-categories/?lang=
require_once dirname(__DIR__) . '/bootstrap.php';

const PC_LANGS = ['en', 'ta', 'si'];

function pc_lang(): string {
    $l = $_GET['lang'] ?? 'en';
    return in_array($l, PC_LANGS, true) ? $l : 'en';
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed', 405);

$lang = pc_lang();
$s = db()->query("SELECT pc.id, pc.icon, pc.display_order,
    GROUP_CONCAT(DISTINCT pct.language_code) langs
    FROM policy_categories pc
    LEFT JOIN policy_category_translations pct ON pct.category_id = pc.id
    WHERE pc.status = 'active' OR pc.status IS NULL
    GROUP BY pc.id ORDER BY pc.display_order, pc.id");
$rows = $s->fetchAll();

$items = [];
foreach ($rows as $r) {
    $t = db()->prepare('SELECT name, slug, description FROM policy_category_translations WHERE category_id=? AND language_code=?');
    $t->execute([(int)$r['id'], $lang]);
    $tr = $t->fetch() ?: [];
    if (!$tr) {
        $t->execute([(int)$r['id'], 'en']);
        $tr = $t->fetch() ?: [];
    }
    $items[] = [
        'id' => (int)$r['id'],
        'name' => $tr['name'] ?? '',
        'slug' => $tr['slug'] ?? '',
        'description' => $tr['description'] ?? '',
        'icon' => $r['icon'],
        'displayOrder' => (int)$r['display_order'],
    ];
}
ok(['items' => $items, 'total' => count($items)]);
