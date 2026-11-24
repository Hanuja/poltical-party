<?php
require_once __DIR__ . '/bootstrap.php';

$db_ok = true;
try {
    db()->query('SELECT 1');
} catch (Throwable $e) {
    $db_ok = false;
}

if (!$db_ok) fail('Database connection failed', 500);
ok([
    'service' => 'political-party-api',
    'status'  => 'ok',
    'database'=> 'connected',
    'time'    => date('c'),
]);
