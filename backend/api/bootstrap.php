<?php
date_default_timezone_set('Asia/Colombo');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../config/database.php';

handle_preflight();
cors_headers();

// Bootstraps an API endpoint file. Call at top of each endpoint:
//   require __DIR__ . '/../../bootstrap.php';

function current_user(): ?array {
    static $user = null;
    static $resolved = false;
    if ($resolved) return $user;
    $resolved = true;

    $token = null;
    $auth = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $auth, $m)) $token = $m[1];
    if (!$token && !empty($_COOKIE['pp_token'])) $token = $_COOKIE['pp_token'];
    if (!$token) return null;

    $payload = jwt_decode($token);
    if (!$payload || empty($payload['sub'])) return null;

    $stmt = db()->prepare('SELECT id, name, email, status FROM users WHERE id = ?');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch() ?: null;
    if ($user && $user['status'] !== 'active') $user = null;

    if ($user) {
        $r = db()->prepare(
            'SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?'
        );
        $r->execute([$user['id']]);
        $user['roles'] = array_column($r->fetchAll(), 'name');
    }
    return $user;
}

function require_auth(): array {
    $user = current_user();
    if (!$user) fail('Unauthorized', 401);
    return $user;
}
