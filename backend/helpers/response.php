<?php
function json_response($data = null, int $status = 200, ?string $error = null): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $body = ['success' => $status < 400];
    if ($error !== null) $body['error'] = $error;
    if ($data !== null) $body['data'] = $data;
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok($data = null, int $status = 200): void { json_response($data, $status); }
function fail(string $error, int $status = 400, $data = null): void { json_response($data, $status, $error); }

function request_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function pagination_params(): array {
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 15)));
    return [$page, $limit, ($page - 1) * $limit];
}
