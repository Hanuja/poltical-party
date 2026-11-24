<?php
// Secure file upload handling: MIME + extension whitelist, random names, size limits.
function upload_file(array $file, string $subdir, array $allowed_ext, array $allowed_mime, int $max_bytes): ?array {
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['error' => 'Upload failed or no file provided'];
    }
    if ($file['size'] > $max_bytes) return ['error' => 'File exceeds size limit'];

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext, true)) return ['error' => 'File type not allowed'];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!in_array($mime, $allowed_mime, true)) return ['error' => 'MIME type not allowed'];

    $base = dirname(__DIR__, 2);
    $dir = $base . '/backend/uploads/' . trim($subdir, '/');
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) return ['error' => 'Could not save file'];

    return ['path' => 'uploads/' . trim($subdir, '/') . '/' . $name, 'name' => $name, 'size' => $file['size'], 'mime' => $mime];
}

function delete_upload(?string $rel_path): void {
    if (!$rel_path) return;
    $abs = dirname(__DIR__, 2) . '/backend/' . $rel_path;
    $root = realpath(dirname(__DIR__, 2) . '/backend/uploads');
    $real = realpath($abs);
    if ($real && $root && str_starts_with($real, $root) && is_file($real)) unlink($real);
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_EXTS  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const DOC_MIMES   = ['application/pdf'];
const DOC_EXTS    = ['pdf'];
