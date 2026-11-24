<?php
// POST /api/auth/login  {email|username, password} -> {token, user}
require_once dirname(__DIR__) . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$b = request_body();
$login = trim((string)($b['email'] ?? $b['username'] ?? ''));
$password = (string)($b['password'] ?? '');
if ($login === '' || $password === '') fail('Email and password are required', 422);

$stmt = db()->prepare(
    'SELECT u.id, u.name, u.email, u.password_hash, u.status
     FROM users u WHERE u.email = ? OR u.name = ? LIMIT 1'
);
$stmt->execute([$login, $login]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    fail('Invalid username or password', 401);
}
if ($user['status'] !== 'active') fail('Account is not active', 403);

$r = db()->prepare(
    'SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?'
);
$r->execute([$user['id']]);
$roles = array_column($r->fetchAll(), 'name');

$now = time();
$token = jwt_encode([
    'sub' => (int)$user['id'],
    'email' => $user['email'],
    'roles' => $roles,
    'iat' => $now,
    'exp' => $now + 60 * 60 * 12,
]);

db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);

ok([
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'roles' => $roles,
    ],
]);
