<?php
// Loads backend/.env into environment. No external dependencies.
function load_env(string $path): void {
    if (!is_file($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k); $v = trim($v);
        if ($v !== '' && ($v[0] === '"' || $v[0] === "'")) $v = substr($v, 1, -1);
        if (getenv($k) === false) putenv("$k=$v");
        $_ENV[$k] = $v;
        $GLOBALS['__ENV_FILE'][$k] = $v;
    }
}

load_env(dirname(__DIR__) . '/.env');

// getenv() is process-wide and not thread-safe under threaded Apache (WAMP on Windows):
// concurrent requests can see it empty, so fall back to this request's own copy of .env.
function env(string $key, $default = null) {
    $v = getenv($key);
    if ($v === false) $v = $GLOBALS['__ENV_FILE'][$key] ?? null;
    return $v ?? $default;
}
