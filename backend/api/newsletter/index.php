<?php
// Newsletter API (table newsletter_subscribers).
// Public:
//   POST   /api/newsletter/?action=subscribe     {email, name?, language?, website?}
//          201 subscribed | 200 resubscribed (was unsubscribed) | 409 already subscribed | 422 invalid
//   POST   /api/newsletter/?action=unsubscribe   {token}
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/validator.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

function nl_find_by_email(string $email): ?array {
    $stmt = db()->prepare('SELECT * FROM newsletter_subscribers WHERE email = ?');
    $stmt->execute([$email]);
    return $stmt->fetch() ?: null;
}

// ---------------- Public ----------------
if ($method === 'POST' && $action === 'subscribe') {
    $b = request_body();
    // Honeypot: real visitors never fill the hidden "website" field.
    if (!empty($b['website'])) ok(['status' => 'subscribed'], 201);

    $email = mb_strtolower(trim((string)($b['email'] ?? '')));
    if ($email === '' || mb_strlen($email) > 150 || !v_email($email)) fail('Please enter a valid email address.', 422, ['code' => 'invalid_email']);
    $name = mb_substr(trim(strip_tags((string)($b['name'] ?? ''))), 0, 150) ?: null;
    $lang = in_array($b['language'] ?? '', ['en', 'ta', 'si'], true) ? $b['language'] : 'en';

    $existing = nl_find_by_email($email);
    if ($existing && $existing['status'] === 'active') fail('This email is already subscribed.', 409, ['code' => 'already_subscribed']);

    $token = bin2hex(random_bytes(32));
    if ($existing) {
        db()->prepare("UPDATE newsletter_subscribers SET status = 'active', language_code = ?, unsub_token = ?, subscribed_at = NOW(),
                       name = COALESCE(?, name) WHERE id = ?")
            ->execute([$lang, $token, $name, $existing['id']]);
        ok(['status' => 'resubscribed']);
    }
    try {
        db()->prepare('INSERT INTO newsletter_subscribers (email, name, language_code, status, unsub_token) VALUES (?, ?, ?, ?, ?)')
            ->execute([$email, $name, $lang, 'active', $token]);
    } catch (PDOException $e) {
        // Two requests raced on the UNIQUE(email) index.
        if ($e->getCode() === '23000') fail('This email is already subscribed.', 409, ['code' => 'already_subscribed']);
        throw $e;
    }
    ok(['status' => 'subscribed'], 201);
}

if ($method === 'POST' && $action === 'unsubscribe') {
    $token = (string)(request_body()['token'] ?? '');
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) fail('Invalid link', 422);
    $stmt = db()->prepare("UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE unsub_token = ?");
    $stmt->execute([$token]);
    if (!$stmt->rowCount()) fail('Invalid link', 404);
    ok(['status' => 'unsubscribed']);
}

fail('Not found', 404);
