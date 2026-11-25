<?php
// Announcements scheduler worker.
// Run via cron every minute:
//   * * * * * php /path/to/backend/api/cron/announcements.php
// Or via HTTP (restrict by token): GET /api/cron/announcements.php?key=CRON_KEY
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/announcement_expiry.php';

// Optional HTTP key check — set CRON_KEY in backend/.env; CLI always allowed.
if (PHP_SAPI !== 'cli') {
    $key = $_GET['key'] ?? '';
    $expected = env('CRON_KEY', '');
    if ($expected === '' || !hash_equals($expected, $key)) {
        fail('Forbidden', 403);
    }
}

$transitions = ann_run_announcement_transitions();

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'published' => $transitions['published'],
    'deleted' => $transitions['deleted'],
    'archived' => 0,
    'time' => date('c'),
]);
