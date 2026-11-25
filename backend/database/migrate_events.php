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
    'contact_person' => 'VARCHAR(150) NULL',
    'contact_phone' => 'VARCHAR(30) NULL',
    'is_featured' => 'TINYINT(1) NOT NULL DEFAULT 0',
    // Existing events remain visible on the home page, matching the old public query behavior.
    'show_on_homepage' => 'TINYINT(1) NOT NULL DEFAULT 1',
    'event_status' => "ENUM('upcoming','live','completed','cancelled') NOT NULL DEFAULT 'upcoming'",
    'registration_open' => 'TINYINT(1) NOT NULL DEFAULT 1',
    'registration_limit' => 'INT UNSIGNED DEFAULT NULL',
    'registration_opens_at' => 'DATETIME NULL',
    'registration_closes_at' => 'DATETIME NULL',
    'registration_open_mode' => "ENUM('auto','manual') NOT NULL DEFAULT 'auto'",
    'stream_platform' => "VARCHAR(30) NULL",
    'stream_embed_url' => 'VARCHAR(500) NULL',
    // Default ON so existing 'live' events keep streaming when the column is added.
    'enable_live_streaming' => 'TINYINT(1) NOT NULL DEFAULT 1',
    'show_live_badge' => 'TINYINT(1) NOT NULL DEFAULT 1',
    'show_viewer_count' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'contact_email' => 'VARCHAR(150) NULL',
    // Completed event fields
    'event_highlights' => 'TEXT NULL',
    'event_summary' => 'TEXT NULL',
    'event_achievements' => 'VARCHAR(500) NULL',
    'event_video_url' => 'VARCHAR(500) NULL',
    // Cancelled event fields
    'cancellation_date' => 'DATE NULL',
    'cancellation_reason' => "ENUM('organisational_decision','unavoidable_circumstances','weather_conditions','venue_unavailability','speaker_unavailability','insufficient_registrations','other') NULL",
    'cancellation_details' => 'TEXT NULL',
    'cancellation_announcement' => 'TEXT NULL',
    'cancellation_image' => 'VARCHAR(255) NULL',
    'organizer_name' => 'VARCHAR(255) NULL',
    'is_rescheduled' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'rescheduled_event_date' => 'DATE NULL',
    'refund_information' => 'TEXT NULL',
    'show_cancellation_on_homepage' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'send_cancellation_notification' => 'TINYINT(1) NOT NULL DEFAULT 0',
];
$check = $pdo->prepare('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
foreach ($columns as $name => $definition) {
    $check->execute([$dbName, 'events', $name]);
    if ($check->fetchColumn()) { echo "  = $name already exists\n"; continue; }
    $pdo->exec("ALTER TABLE events ADD COLUMN `$name` $definition");
    echo "  + added $name\n";
}
$table->execute([$dbName, 'event_translations']);
if ($table->fetchColumn()) {
    $check->execute([$dbName, 'event_translations', 'short_description']);
    if (!$check->fetchColumn()) {
        $pdo->exec('ALTER TABLE event_translations ADD COLUMN short_description VARCHAR(500) DEFAULT NULL AFTER slug');
        echo "  + added event_translations.short_description\n";
    } else echo "  = event_translations.short_description already exists\n";
}
echo "Event management migration complete.\n";
