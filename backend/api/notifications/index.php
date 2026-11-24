<?php
// Admin notifications (topbar bell). Staff only.
//   GET  /api/notifications/            → {items (latest 15), unread}
//   GET  /api/notifications/?count=1    → {unread}
//   POST /api/notifications/?action=read {id} | ?action=read-all
require_once dirname(__DIR__) . '/bootstrap.php';

$user = require_auth();
if (!array_intersect($user['roles'] ?? [], ['Super Admin', 'Admin'])) fail('Forbidden', 403);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$db = db();
$unread = fn() => (int)$db->query('SELECT COUNT(*) FROM admin_notifications WHERE is_read = 0')->fetchColumn();

if ($method === 'GET') {
    if (!empty($_GET['count'])) ok(['unread' => $unread()]);
    $items = $db->query('SELECT id, type, title, body, link, is_read, created_at FROM admin_notifications ORDER BY created_at DESC, id DESC LIMIT 15')->fetchAll();
    foreach ($items as &$i) { $i['id'] = (int)$i['id']; $i['is_read'] = (bool)$i['is_read']; }
    ok(['items' => $items, 'unread' => $unread()]);
}

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';
    if ($action === 'read') {
        $id = (int)(request_body()['id'] ?? 0);
        $db->prepare('UPDATE admin_notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND is_read = 0')->execute([$id]);
        ok(['unread' => $unread()]);
    }
    if ($action === 'read-all') {
        $db->exec('UPDATE admin_notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0');
        ok(['unread' => 0]);
    }
}
fail('Not found', 404);
