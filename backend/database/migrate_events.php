<?php
// Safe, additive event-management migration for installations created from an older schema.
// Run on the server: php backend/database/migrate_events.php
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

$cli = PHP_SAPI === 'cli';
if (!$cli) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($ip, ['127.0.0.1', '::1'], true)) { http_response_code(403); exit('Run this migration on the server itself.'); }
    header('Content-Type: text/plain; charset=utf-8');
}

$pdo = db();
$dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
$table = $pdo->prepare('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?');
$table->execute([$dbName, 'events']);
if (!$table->fetchColumn()) exit("The events table is missing. Import backend/database/political_party_db.sql first.\n");

$columns = [
    'stream_url' => 'VARCHAR(500) NULL',
    'external_url' => 'VARCHAR(500) NULL',
    'registration_url' => 'VARCHAR(500) NULL',
    'gallery_json' => 'LONGTEXT NULL',
    'city' => 'VARCHAR(150) NULL',
    'is_featured' => 'TINYINT(1) NOT NULL DEFAULT 0',
    // Existing events remain visible on the home page, matching the old public query behavior.
    'show_on_homepage' => 'TINYINT(1) NOT NULL DEFAULT 1',
    'event_status' => "ENUM('upcoming','live','completed','cancelled') NOT NULL DEFAULT 'upcoming'",
    'registration_opens_at' => 'DATETIME NULL',
    'registration_closes_at' => 'DATETIME NULL',
    'registration_open_mode' => "ENUM('auto','manual') NOT NULL DEFAULT 'auto'",
];
$check = $pdo->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
foreach ($columns as $name => $definition) {
    $check->execute([$dbName, 'events', $name]);
    if ($check->fetchColumn()) { echo "  = $name already exists\n"; continue; }
    $pdo->exec("ALTER TABLE events ADD COLUMN `$name` $definition");
    echo "  + added $name\n";
}
echo "Event management migration complete.\n";
