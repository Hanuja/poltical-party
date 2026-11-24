<?php
// Dependency-free HMAC-SHA256 JWT (HS256) implementation.
function jwt_encode(array $payload): string {
    $secret = env('JWT_SECRET');
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $h = base64url_encode(json_encode($header));
    $p = base64url_encode(json_encode($payload));
    $sig = base64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    return "$h.$p.$sig";
}

function jwt_decode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$h.$p", env('JWT_SECRET'), true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64url_decode($p), true);
    if (!is_array($payload)) return null;
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;
    return $payload;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}
