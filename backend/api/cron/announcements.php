<?php
// Announcements scheduler worker.
// Run via cron every minute:
//   * * * * * php /path/to/backend/api/cron/announcements.php
// Or via HTTP (restrict by token): GET /api/cron/announcements.php?key=CRON_KEY
require_once dirname(__DIR__) . '/bootstrap.php';

// Optional HTTP key check — set CRON_KEY in backend/.env; CLI always allowed.
if (PHP_SAPI !== 'cli') {
    $key = $_GET['key'] ?? '';
    $expected = env('CRON_KEY', '');
    if ($expected === '' || !hash_equals($expected, $key)) {
        fail('Forbidden', 403);
    }
}

$published = db()->exec(
    "UPDATE announcements SET status='published',
       published_at = COALESCE(published_at, COALESCE(scheduled_at, NOW()))
     WHERE status='scheduled'
       AND COALESCE(scheduled_at, published_at) IS NOT NULL
       AND COALESCE(scheduled_at, published_at) <= NOW()"
);

$archived = db()->exec(
    "UPDATE announcements a
     JOIN announcement_categories c ON c.id = a.category_id
     SET a.status='archived'
     WHERE a.status='published' AND c.slug='public-notices'
       AND a.expires_at IS NOT NULL AND a.expires_at <= NOW()"
);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'published' => $published,
    'archived' => $archived,
    'time' => date('c'),
]);
