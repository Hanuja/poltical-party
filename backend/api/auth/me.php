<?php
// GET /api/auth/me -> current authenticated user
require_once dirname(__DIR__) . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed', 405);

$user = require_auth();
ok([
    'id' => (int)$user['id'],
    'name' => $user['name'],
    'email' => $user['email'],
    'roles' => $user['roles'] ?? [],
]);
