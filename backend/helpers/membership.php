<?php
// Shared logic for the Join Us membership workflow (api/members). See migration 009.
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/log.php';

// The DB runs on Sri Lanka time (SYSTEM = Asia/Colombo) and PHP defaults to UTC here; align them so
// PHP-written timestamps and DB CURRENT_TIMESTAMP columns agree. Per-request setting.
date_default_timezone_set((string)env('APP_TIMEZONE', 'Asia/Colombo'));

const MEM_LANGS = ['en', 'ta', 'si'];
const MEM_ADMIN_ROLES = ['Super Admin', 'Admin'];
const MEM_INTERESTS = ['youth_wing', 'womens_wing', 'community_outreach', 'social_welfare', 'education', 'policy_research', 'digital_media', 'volunteer'];
const MEM_GENDERS = ['male', 'female', 'other'];
const MEM_MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];
const MEM_CITIZENSHIP = ['sri_lankan', 'dual'];
const MEM_DECLARATIONS = ['rules', 'constitution', 'conduct', 'privacy', 'declaration', 'privacyConfirmed', 'finalConfirmed'];
const MEM_PLEDGES = ['homeland', 'law_democracy', 'constitution_conduct', 'confidentiality', 'equality', 'integrity', 'truthful_speech', 'safety_dignity', 'environment', 'public_service', 'accountability'];
const MEM_TEMPLATES = ['received', 'approved', 'declined'];
// Public status names (API) for the DB enum values.
const MEM_STATUS_PUBLIC = ['pending' => 'received', 'under_review' => 'under_review', 'verified' => 'approved', 'rejected' => 'declined', 'suspended' => 'suspended', 'expired' => 'expired'];

// Settings an admin may edit. Per-language keys get _en/_ta/_si.
const MEM_SETTING_LANG_KEYS = ['leader_name', 'leader_title', 'party_name', 'slogan', 'welcome', 'success'];
const MEM_SETTING_KEYS = ['leader_photo', 'why_img_1', 'why_img_2', 'why_img_3', 'why_img_4',
    'rules_url', 'constitution_url', 'conduct_url', 'contact_email', 'contact_phone', 'public_site_url',
    'require_photo', 'min_age', 'id_prefix'];

function mem_require_admin(): array {
    $user = require_auth();
    if (!array_intersect($user['roles'] ?? [], MEM_ADMIN_ROLES)) fail('Forbidden', 403);
    return $user;
}

function mem_lang(?string $l): string { return in_array($l, MEM_LANGS, true) ? $l : 'en'; }

function mem_settings(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $rows = db()->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'mem\\_%'")->fetchAll();
    $cache = [];
    foreach ($rows as $r) $cache[substr($r['setting_key'], 4)] = (string)$r['setting_value'];
    return $cache;
}

function mem_setting(string $key, string $default = ''): string {
    $s = mem_settings();
    return isset($s[$key]) && $s[$key] !== '' ? $s[$key] : $default;
}

/** Language value with English fallback (used for names; NOT for statements, which stay empty if unset). */
function mem_setting_lang(string $key, string $lang, bool $fallbackEn = true): string {
    $v = mem_setting($key . '_' . $lang);
    if ($v === '' && $fallbackEn) $v = mem_setting($key . '_en');
    return $v;
}

function mem_upload_url(?string $rel): string {
    if (!$rel) return '';
    if (preg_match('#^https?://#i', $rel)) return $rel;
    return rtrim((string)env('SITE_URL', ''), '/') . '/backend/' . ltrim($rel, '/');
}

function mem_public_site_url(): string {
    $u = mem_setting('public_site_url', (string)env('PUBLIC_SITE_URL', ''));
    return filter_var($u, FILTER_VALIDATE_URL) ? rtrim($u, '/') : '';
}

function mem_contact(): array {
    $email = mem_setting('contact_email');
    $phone = mem_setting('contact_phone');
    return ['email' => filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '', 'phone' => $phone];
}

function mem_meta(string $lang): array {
    $pick = fn($r) => ($lang === 'ta' && $r['name_ta']) ? $r['name_ta'] : (($lang === 'si' && $r['name_si']) ? $r['name_si'] : $r['name']);
    $provinces = array_map(fn($r) => ['id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $pick($r), 'nameEn' => $r['name']],
        db()->query('SELECT id, slug, name, name_ta, name_si FROM provinces ORDER BY id')->fetchAll());
    $districts = array_map(fn($r) => ['id' => (int)$r['id'], 'provinceId' => (int)$r['province_id'], 'slug' => $r['slug'], 'name' => $pick($r), 'nameEn' => $r['name']],
        db()->query('SELECT id, province_id, slug, name, name_ta, name_si FROM districts ORDER BY name')->fetchAll());
    $divisions = array_map(fn($r) => ['id' => (int)$r['id'], 'districtId' => (int)$r['district_id'], 'electoralDistrict' => $r['electoral_district'], 'name' => $pick($r), 'nameEn' => $r['name']],
        db()->query('SELECT id, district_id, electoral_district, name, name_ta, name_si FROM electoral_divisions ORDER BY district_id, sort_order, name')->fetchAll());
    return ['provinces' => $provinces, 'districts' => $districts, 'divisions' => $divisions,
        'interests' => MEM_INTERESTS, 'genders' => MEM_GENDERS, 'citizenship' => MEM_CITIZENSHIP];
}

// ---------------------------------------------------------------- rate limiting
function mem_rate_limit(string $bucket, int $max, int $windowSeconds): void {
    $ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '0') . '|' . env('JWT_SECRET', ''));
    $db = db();
    $row = $db->prepare('SELECT window_start, hits FROM membership_rate_limits WHERE bucket = ? AND ip_hash = ?');
    $row->execute([$bucket, $ip]);
    $r = $row->fetch();
    $now = time();
    if (!$r || strtotime($r['window_start']) + $windowSeconds < $now) {
        $db->prepare('REPLACE INTO membership_rate_limits (bucket, ip_hash, window_start, hits) VALUES (?, ?, NOW(), 1)')->execute([$bucket, $ip]);
        return;
    }
    if ((int)$r['hits'] >= $max) {
        $retry = strtotime($r['window_start']) + $windowSeconds - $now;
        header('Retry-After: ' . max(1, $retry));
        fail('Too many attempts. Please wait a few minutes and try again.', 429, ['code' => 'rate_limited', 'retryAfter' => max(1, $retry)]);
    }
    $db->prepare('UPDATE membership_rate_limits SET hits = hits + 1 WHERE bucket = ? AND ip_hash = ?')->execute([$bucket, $ip]);
}

// ---------------------------------------------------------------- references / IDs
function mem_random_code(int $len): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
    $out = '';
    for ($i = 0; $i < $len; $i++) $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    return $out;
}

function mem_new_reference(): string {
    // e.g. JU-7KQ4-M2XP (32^8 ≈ 1.1e12 combinations; not sequential, so not guessable)
    for ($i = 0; $i < 5; $i++) {
        $c = mem_random_code(8);
        $ref = 'JU-' . substr($c, 0, 4) . '-' . substr($c, 4);
        $s = db()->prepare('SELECT 1 FROM party_members WHERE application_ref = ?');
        $s->execute([$ref]);
        if (!$s->fetch()) return $ref;
    }
    throw new RuntimeException('Could not allocate a reference');
}

function mem_normalize_ref(string $ref): string {
    $c = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $ref));
    if (str_starts_with($c, 'JU')) $c = substr($c, 2);
    return strlen($c) === 8 ? 'JU-' . substr($c, 0, 4) . '-' . substr($c, 4) : '';
}

/** Must be called inside a transaction. */
function mem_next_membership_id(): string {
    $db = db();
    $year = (int)date('Y');
    $db->prepare('INSERT IGNORE INTO membership_sequences (seq_year, last_value) VALUES (?, 0)')->execute([$year]);
    $s = $db->prepare('SELECT last_value FROM membership_sequences WHERE seq_year = ? FOR UPDATE');
    $s->execute([$year]);
    $next = (int)$s->fetchColumn() + 1;
    $db->prepare('UPDATE membership_sequences SET last_value = ? WHERE seq_year = ?')->execute([$next, $year]);
    $prefix = preg_replace('/[^A-Z0-9]/', '', strtoupper(mem_setting('id_prefix', 'TMK'))) ?: 'TMK';
    return sprintf('%s-%d-%06d', $prefix, $year, $next);
}

// ---------------------------------------------------------------- admin notifications
function mem_notify_admins(string $type, string $title, string $body, string $link, string $entity, int $entityId): void {
    try {
        db()->prepare('INSERT INTO admin_notifications (type, title, body, link, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$type, $title, $body, $link, $entity, $entityId]);
    } catch (Throwable $e) {
        error_log('admin notification failed: ' . $e->getMessage());
    }
}

// ---------------------------------------------------------------- email templates
function mem_default_templates(): array {
    return [
        'received' => [
            'subject' => 'We have received your membership application ({reference})',
            'heading' => 'Application received',
            'body' => "Dear {name},\n\nThank you for applying for membership of {party_name}. Your application has been received and is waiting for review by the party office.\n\nReference: {reference}\nSubmitted on: {date}\nStatus: Pending review\n\nYou can check the progress of your application on our website with your reference and this email address: {track_url}\n\nIf you did not submit this application, please contact us so that we can remove it.",
        ],
        'approved' => [
            'subject' => 'Your membership has been approved',
            'heading' => 'Welcome to {party_name}',
            'body' => "Dear {name},\n\nWe are pleased to let you know that your membership application ({reference}) has been approved.\n\nYour membership ID: {membership_id}\nApproved on: {date}\n\nPlease keep your membership ID for your records. The party office will contact you about local activities in your area.",
        ],
        'declined' => [
            'subject' => 'Update on your membership application ({reference})',
            'heading' => 'Application update',
            'body' => "Dear {name},\n\nThank you for your interest in {party_name}. After review, we are unable to approve your membership application ({reference}) at this time.\n\nReason: {reason}\n\nIf you have any questions about this decision, please contact the party office.",
        ],
    ];
}

function mem_templates_all(): array {
    $defaults = mem_default_templates();
    $out = [];
    foreach (MEM_TEMPLATES as $k) foreach (MEM_LANGS as $l) {
        $out[$k][$l] = ['subject' => '', 'heading' => '', 'body' => '', 'custom' => false];
    }
    foreach (db()->query('SELECT template_key, lang, subject, heading, body FROM membership_email_templates')->fetchAll() as $r) {
        if (!isset($out[$r['template_key']][$r['lang']])) continue;
        $out[$r['template_key']][$r['lang']] = ['subject' => $r['subject'], 'heading' => $r['heading'], 'body' => $r['body'], 'custom' => true];
    }
    return ['templates' => $out, 'defaults' => $defaults];
}

/** Template for a language: saved translation → saved English → built-in English default. */
function mem_template(string $key, string $lang): array {
    $all = mem_templates_all()['templates'];
    foreach ([$lang, 'en'] as $l) {
        $t = $all[$key][$l] ?? null;
        if ($t && $t['custom'] && trim($t['body']) !== '') return $t + ['lang' => $l];
    }
    return mem_default_templates()[$key] + ['lang' => 'en'];
}

function mem_fill(string $tpl, array $vars): string {
    return preg_replace_callback('/\{([a-z_]+)\}/', fn($m) => array_key_exists($m[1], $vars) ? (string)$vars[$m[1]] : $m[0], $tpl);
}

/** Branded email. Template text is plain text (escaped here), so admin edits can't inject markup. */
function mem_render_email(string $key, string $lang, array $vars): array {
    $t = $vars['__template'] ?? mem_template($key, $lang);
    $site = mem_public_site_url();
    $nameTa = mem_setting('party_name_ta', 'தாயக மக்கள் கழகம்');
    $nameEn = mem_setting('party_name_en', 'Thayaga Makkal Kazhagam (TMK)');
    $nameSi = mem_setting('party_name_si', 'තායක ජනතා සංවිධානය');
    $slogan = mem_setting_lang('slogan', $t['lang'] ?? $lang, true);
    $contact = mem_contact();
    $vars += ['party_name' => $nameEn, 'track_url' => $site ? $site . '/membership?track=1' : '(tracking page link not configured)'];
    if (($t['lang'] ?? $lang) === 'ta') $vars['party_name'] = $nameTa;
    if (($t['lang'] ?? $lang) === 'si') $vars['party_name'] = $nameSi;
    $nameLocal = $vars['party_name']; // official name in the email's language
    $isEn = ($t['lang'] ?? $lang) === 'en';

    $subject = mem_fill($t['subject'], $vars);
    $heading = mem_fill($t['heading'], $vars);
    $bodyText = mem_fill($t['body'], $vars);
    $e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

    $paras = '';
    foreach (preg_split("/\n{2,}/", trim($bodyText)) as $p) {
        $p = $e($p);
        $p = preg_replace('#(https?://[^\s<]+)#', '<a href="$1" style="color:#800020;font-weight:600">$1</a>', $p);
        $paras .= '<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#171717">' . nl2br($p) . '</p>';
    }
    $logo = $site ? '<img src="' . $e($site . '/images/logo.png') . '" width="88" height="88" alt="" style="display:block;width:88px;height:88px;max-width:100%;object-fit:contain;object-position:center;margin:0 auto 12px;border:0">' : '';
    $sloganHtml = $slogan !== '' ? '<p style="margin:10px 0 0;font-size:13px;letter-spacing:.04em;color:#FDB913;font-style:italic">' . $e($slogan) . '</p>' : '';
    $links = [];
    if ($site) $links[] = '<a href="' . $e($site) . '" style="color:#F2C230;text-decoration:none">' . $e(preg_replace('#^https?://#', '', $site)) . '</a>';
    if ($contact['email']) $links[] = '<a href="mailto:' . $e($contact['email']) . '" style="color:#F2C230;text-decoration:none">' . $e($contact['email']) . '</a>';
    if ($contact['phone']) $links[] = '<span style="color:#e5e5e5">' . $e($contact['phone']) . '</span>';
    $linksHtml = $links ? '<p style="margin:0 0 10px;font-size:13px">' . implode(' &nbsp;·&nbsp; ', $links) . '</p>' : '';

    $html = '<!doctype html><html lang="' . $e($t['lang'] ?? 'en') . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $e($subject) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,Helvetica,\'Noto Sans Tamil\',sans-serif">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:24px 12px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #E9E2DA">'
        . '<tr><td style="background:#800020;padding:28px 24px 24px;text-align:center;border-bottom:4px solid #F2C230">' . $logo
        . '<p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4">' . $e($nameLocal) . '</p>'
        . ($isEn ? '' : '<p style="margin:4px 0 0;font-size:12px;font-weight:700;letter-spacing:.18em;color:#ffffff;opacity:.9">' . $e(mb_strtoupper($nameEn)) . '</p>')
        . $sloganHtml . '</td></tr>'
        . '<tr><td style="padding:32px 28px 12px"><h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#800020;font-family:Georgia,\'Times New Roman\',serif">' . $e($heading) . '</h1>' . $paras . '</td></tr>'
        . '<tr><td style="background:#171717;padding:22px 24px;text-align:center;color:#bdbdbd;font-size:12px;line-height:1.6">' . $linksHtml
        . '<p style="margin:0">' . $e($nameLocal) . '</p>'
        . '<p style="margin:6px 0 0;color:#8a8a8a">This is an automated message about your membership application. Please do not share your reference with anyone.</p>'
        . '</td></tr></table></td></tr></table></body></html>';

    $text = $nameTa . "\n" . mb_strtoupper($nameEn) . ($slogan !== '' ? "\n" . $slogan : '') . "\n\n" . $heading . "\n\n" . $bodyText . "\n\n--\n" . $nameEn
        . ($site ? "\n" . $site : '') . ($contact['email'] ? "\n" . $contact['email'] : '') . ($contact['phone'] ? "\n" . $contact['phone'] : '');
    return ['subject' => $subject, 'html' => $html, 'text' => $text];
}

function mem_email_vars(array $m): array {
    $lang = mem_lang($m['preferred_language'] ?? 'en');
    $date = $m['__date'] ?? date('j F Y');
    return [
        'name' => $m['full_name'], 'reference' => $m['application_ref'], 'membership_id' => $m['membership_id'] ?? '',
        'reason' => trim((string)($m['decision_reason'] ?? '')), 'date' => $date, 'email' => $m['email'],
    ];
}

/**
 * Sends the event email once per applicant + template (uq_mem_email). Returns the log status.
 * A previously failed / not_configured send is retried only when $retry is true.
 */
function mem_send_event_email(int $memberId, string $key, bool $retry = false): string {
    $db = db();
    $s = $db->prepare('SELECT * FROM party_members WHERE id = ?');
    $s->execute([$memberId]);
    $m = $s->fetch();
    if (!$m || !$m['email']) return 'skipped';

    $existing = $db->prepare('SELECT id, status FROM membership_emails WHERE member_id = ? AND template_key = ?');
    $existing->execute([$memberId, $key]);
    $row = $existing->fetch();
    if ($row && ($row['status'] === 'sent' || !$retry)) return $row['status'];

    $mail = mem_render_email($key, mem_lang($m['preferred_language']), mem_email_vars($m));
    if (!$row) {
        $ins = $db->prepare("INSERT IGNORE INTO membership_emails (member_id, template_key, recipient, subject, body_html, status) VALUES (?, ?, ?, ?, ?, 'queued')");
        $ins->execute([$memberId, $key, $m['email'], $mail['subject'], $mail['html']]);
        if ($ins->rowCount() === 0) return 'duplicate'; // a concurrent request already claimed it
        $logId = (int)$db->lastInsertId();
    } else {
        $logId = (int)$row['id'];
        $db->prepare("UPDATE membership_emails SET subject = ?, body_html = ?, recipient = ?, status = 'queued' WHERE id = ?")
            ->execute([$mail['subject'], $mail['html'], $m['email'], $logId]);
    }

    $res = mail_send($m['email'], $mail['subject'], $mail['html'], $mail['text']);
    $db->prepare('UPDATE membership_emails SET status = ?, error = ?, attempts = attempts + 1, sent_at = ? WHERE id = ?')
        ->execute([$res['status'], $res['error'], $res['status'] === 'sent' ? date('Y-m-d H:i:s') : null, $logId]);
    return $res['status'];
}
