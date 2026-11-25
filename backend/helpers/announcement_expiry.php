<?php
// Shared announcement scheduler and Public Notice expiry processing.
require_once __DIR__ . '/upload.php';

function ann_expiry_local_upload_path($value): ?string {
    if (!is_string($value) || trim($value) === '') return null;

    $path = trim($value);
    if (preg_match('#^https?://#i', $path)) {
        $path = (string)(parse_url($path, PHP_URL_PATH) ?? '');
    }
    $path = rawurldecode(str_replace('\\', '/', $path));
    $path = preg_replace('#^/?backend/#', '', $path);
    $path = ltrim($path, '/');

    // Only clean files written by the announcement upload handler. delete_upload()
    // performs a second realpath check to prevent escaping the uploads directory.
    if (!preg_match('#^uploads/announcements/(?!private/)[A-Za-z0-9._/-]+$#', $path)) return null;
    if (str_contains($path, '/../') || str_ends_with($path, '/..')) return null;
    return $path;
}

function ann_expiry_collect_paths($value, array &$paths): void {
    if (is_string($value)) {
        $path = ann_expiry_local_upload_path($value);
        if ($path) $paths[$path] = true;
        return;
    }
    if (is_array($value)) {
        foreach ($value as $item) ann_expiry_collect_paths($item, $paths);
    }
}

function ann_expiry_delete_unreferenced_media(int $deletedId, array $candidates): void {
    if (!$candidates) return;

    $refs = [];
    $stmt = db()->prepare('SELECT cover_image, video_url, media_json FROM announcements WHERE id <> ?');
    $stmt->execute([$deletedId]);
    foreach ($stmt->fetchAll() as $row) {
        ann_expiry_collect_paths($row['cover_image'] ?? null, $refs);
        ann_expiry_collect_paths($row['video_url'] ?? null, $refs);
        if (!empty($row['media_json'])) {
            $media = json_decode((string)$row['media_json'], true);
            if (is_array($media)) ann_expiry_collect_paths($media, $refs);
        }
    }

    try {
        foreach (db()->query('SELECT file_path FROM announcement_attachments')->fetchAll(PDO::FETCH_COLUMN) as $path) {
            ann_expiry_collect_paths($path, $refs);
        }
    } catch (Throwable $e) {
        // Attachments may not exist in older installations; announcement references
        // above are still checked before removing any file.
    }

    foreach (array_keys($candidates) as $path) {
        if (!isset($refs[$path])) delete_upload($path);
    }
}

function ann_run_announcement_transitions(): array {
    $db = db();
    $published = $db->exec(
        "UPDATE announcements SET status='published',
           published_at = COALESCE(published_at, COALESCE(scheduled_at, NOW()))
         WHERE status='scheduled'
           AND COALESCE(scheduled_at, published_at) IS NOT NULL
           AND COALESCE(scheduled_at, published_at) <= NOW()"
    );

    $db->beginTransaction();
    try {
        $expiredStmt = $db->query(
            "SELECT a.id, a.cover_image, a.video_url, a.media_json
             FROM announcements a
             JOIN announcement_categories c ON c.id = a.category_id
             WHERE c.slug = 'public-notices' AND a.expires_at IS NOT NULL
               AND a.expires_at <= NOW()
             FOR UPDATE"
        );
        $expired = $expiredStmt->fetchAll(PDO::FETCH_ASSOC);
        $delete = $db->prepare('DELETE FROM announcements WHERE id = ?');
        foreach ($expired as $row) $delete->execute([(int)$row['id']]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        throw $e;
    }

    foreach ($expired as $row) {
        $paths = [];
        ann_expiry_collect_paths($row['cover_image'] ?? null, $paths);
        ann_expiry_collect_paths($row['video_url'] ?? null, $paths);
        if (!empty($row['media_json'])) {
            $media = json_decode((string)$row['media_json'], true);
            if (is_array($media)) ann_expiry_collect_paths($media, $paths);
        }
        ann_expiry_delete_unreferenced_media((int)$row['id'], $paths);
    }

    return ['published' => $published, 'deleted' => count($expired)];
}
