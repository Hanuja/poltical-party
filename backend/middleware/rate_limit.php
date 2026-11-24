<?php
require_once __DIR__ . '/../config/database.php';

// Simple DB-backed fixed-window rate limiter.
// Usage: rate_limit('login:127.0.0.1', 10, 60); // 10 req / 60s
function rate_limit(string $key, int $max, int $window_seconds): void {
    $pdo = db();
    $pdo->exec('CREATE TABLE IF NOT EXISTS rate_limits (
        rl_key VARCHAR(191) PRIMARY KEY,
        hits INT UNSIGNED NOT NULL DEFAULT 0,
        reset_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');

    $stmt = $pdo->prepare('SELECT hits, reset_at FROM rate_limits WHERE rl_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    $now = time();

    if (!$row || strtotime($row['reset_at']) <= $now) {
        $pdo->prepare('REPLACE INTO rate_limits (rl_key, hits, reset_at) VALUES (?, 1, ?)')
            ->execute([$key, date('Y-m-d H:i:s', $now + $window_seconds)]);
        return;
    }
    if ((int)$row['hits'] >= $max) {
        header('Retry-After: ' . (strtotime($row['reset_at']) - $now));
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Too many requests']);
        exit;
    }
    $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE rl_key = ?')->execute([$key]);
}
