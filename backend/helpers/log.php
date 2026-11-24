<?php
require_once __DIR__ . '/../config/database.php';

function activity_log(?int $user_id, string $action, ?string $entity = null, ?int $entity_id = null, ?array $meta = null): void {
    try {
        $stmt = db()->prepare(
            'INSERT INTO activity_logs (user_id, action, entity, entity_id, meta, ip_address, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $user_id, $action, $entity, $entity_id,
            $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    } catch (Throwable $e) {
        error_log('activity_log failed: ' . $e->getMessage());
    }
}
