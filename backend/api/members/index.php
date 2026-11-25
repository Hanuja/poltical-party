<?php
// Join Us — membership applications.
//
// Public (no auth, rate-limited):
//   GET  ?action=page&lang=xx      page content (admin-managed settings) + form metadata
//   POST ?action=apply             multipart: data=<JSON>, photo=<file, only when required> → reference
//   POST ?action=track             {reference, email} → status of that one application only
//   POST ?action=draft-save        {email, step, data, code?} → resume code (shown once)
//   POST ?action=draft-load        {code, email} → saved progress
// Admin (Super Admin / Admin):
//   GET  ?action=list | detail&id= | photo&id= | settings | email-preview | email-view&id=
//   POST ?action=decide {id, decision: review|approve|decline, reason}
//   POST ?action=resend-email {id, template}
//   POST ?action=settings {settings:{}} | templates {templates:[]} | upload-image (multipart: slot, file)
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__, 2) . '/helpers/membership.php';
require_once dirname(__DIR__, 2) . '/helpers/upload.php';
require_once dirname(__DIR__, 2) . '/helpers/validator.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    switch ("$method $action") {
        case 'GET page':          mem_public_page(); break;
        case 'GET count':         mem_public_count(); break;
        case 'GET download-form': mem_public_download_form(); break;
        case 'POST apply':        mem_apply(); break;
        case 'POST register':     mem_apply(); break; // legacy name used by older frontend code
        case 'POST apply-pdf':    mem_apply_pdf(); break;
        case 'POST track':        mem_track(); break;
        case 'POST draft-save':   mem_draft_save(); break;
        case 'POST draft-load':   mem_draft_load(); break;
        case 'GET list':          mem_admin_list(); break;
        case 'GET detail':        mem_admin_detail(); break;
        case 'GET photo':         mem_admin_photo(); break;
        case 'GET pdf':           mem_admin_pdf(); break;
        case 'GET supporting-pdf': mem_admin_supporting_pdf(); break;
        case 'POST decide':       mem_admin_decide(); break;
        case 'POST resend-email': mem_admin_resend(); break;
        case 'GET settings':      mem_admin_settings_get(); break;
        case 'POST settings':     mem_admin_settings_save(); break;
        case 'POST templates':    mem_admin_templates_save(); break;
        case 'POST upload-image': mem_admin_upload_image(); break;
        case 'GET email-preview': mem_admin_email_preview(); break;
        case 'POST email-preview': mem_admin_email_preview(); break;
        case 'GET email-view':    mem_admin_email_view(); break;
        default: fail('Not found', 404);
    }
} catch (Throwable $e) {
    error_log('members api: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (db()->inTransaction()) db()->rollBack();
    fail('Something went wrong. Please try again.', 500);
}

// =================================================================== public

function mem_public_page(): void {
    $lang = mem_lang($_GET['lang'] ?? 'en');
    $s = mem_settings();
    $img = fn($k) => mem_upload_url($s[$k] ?? '');
    $link = fn($k) => filter_var($s[$k] ?? '', FILTER_VALIDATE_URL) || str_starts_with($s[$k] ?? '', '/') ? $s[$k] : '';
    header('Cache-Control: no-store');
    ok([
        'hero' => [
            'leaderPhoto' => $img('leader_photo'),
            'leaderName'  => mem_setting_lang('leader_name', $lang),
            'leaderTitle' => mem_setting_lang('leader_title', $lang),
            'partyNameTa' => mem_setting('party_name_ta'),
            'partyNameEn' => mem_setting('party_name_en'),
            // Statements: shown only in the language they were written in, else English, else hidden.
            'slogan'      => mem_setting_lang('slogan', $lang),
            'welcome'     => mem_setting_lang('welcome', $lang),
        ],
        'whyImages' => [$img('why_img_1'), $img('why_img_2'), $img('why_img_3'), $img('why_img_4')],
        'successMessage' => mem_setting_lang('success', $lang),
        'links' => ['rules' => $link('rules_url'), 'constitution' => $link('constitution_url'), 'conduct' => $link('conduct_url')],
        'contact' => mem_contact(),
        'requirePhoto' => ($s['require_photo'] ?? '0') === '1',
        'minAge' => max(0, (int)($s['min_age'] ?? 18)),
        'meta' => mem_meta($lang),
    ]);
}

/** Public aggregate only; never expose applicant records through the counter. */
function mem_public_count(): void {
    header('Cache-Control: no-store');
    $count = (int)db()->query("SELECT COUNT(DISTINCT membership_id) FROM party_members WHERE status = 'verified' AND membership_id IS NOT NULL AND deleted_at IS NULL AND application_ref IS NOT NULL AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)")->fetchColumn();
    ok(['count' => $count]);
}

function mem_public_download_form(): void {
    $file = dirname(__DIR__, 2) . '/uploads/membership/templates/application_form.pdf';
    if (!is_file($file)) fail('Form not available', 404);
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Membership_Application_Form.pdf"');
    header('Content-Length: ' . filesize($file));
    header('Cache-Control: public, max-age=86400');
    readfile($file);
    exit;
}

function mem_clean(?string $v, int $max): string {
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$v));
    return mb_substr($v, 0, $max);
}

function mem_norm_phone(string $p): string { return preg_replace('/[\s\-().]/', '', $p); }

function mem_norm_nic(string $n): string { return strtoupper(preg_replace('/\s+/', '', $n)); }

/** Validates an application payload. Returns [clean, errors]. Field keys match the form. */
function mem_validate_application(array $d, bool $requirePhoto, ?array $photo): array {
    $e = [];
    $c = [];
    $minAge = max(0, (int)mem_setting('min_age', '18'));

    $c['fullName'] = mem_clean($d['fullName'] ?? '', 160);
    if (mb_strlen($c['fullName']) < 3) $e['fullName'] = 'required';
    elseif (!preg_match('/^[\p{L}\p{M}\s.\'\-]+$/u', $c['fullName'])) $e['fullName'] = 'invalid';

    $c['dateOfBirth'] = (string)($d['dateOfBirth'] ?? '');
    $age = null;
    if (!v_date($c['dateOfBirth'])) $e['dateOfBirth'] = 'required';
    else {
        $dob = DateTime::createFromFormat('!Y-m-d', $c['dateOfBirth']);
        $now = new DateTime('today');
        if (!$dob || $dob > $now) $e['dateOfBirth'] = 'invalid';
        else {
            $age = $dob->diff($now)->y;
            if ($age > 120) $e['dateOfBirth'] = 'invalid';
            elseif ($age < $minAge) $e['dateOfBirth'] = 'too_young';
        }
    }

    $c['gender'] = (string)($d['gender'] ?? '');
    if (!in_array($c['gender'], MEM_GENDERS, true)) $e['gender'] = 'required';
    $c['maritalStatus'] = (string)($d['maritalStatus'] ?? '');
    if (!in_array($c['maritalStatus'], MEM_MARITAL_STATUSES, true)) $e['maritalStatus'] = 'required';

    $c['residentialAddress'] = mem_clean($d['residentialAddress'] ?? '', 500);
    if (mb_strlen($c['residentialAddress']) < 5) $e['residentialAddress'] = 'required';
    $c['mailingSame'] = !empty($d['mailingSame']);
    $c['mailingAddress'] = $c['mailingSame'] ? '' : mem_clean($d['mailingAddress'] ?? '', 500);
    if (!$c['mailingSame'] && mb_strlen($c['mailingAddress']) < 5) $e['mailingAddress'] = 'required';

    // Province / district / division must exist and belong together.
    $db = db();
    $c['provinceId'] = (int)($d['provinceId'] ?? 0);
    $c['districtId'] = (int)($d['districtId'] ?? 0);
    $c['divisionId'] = (int)($d['divisionId'] ?? 0);
    $p = $db->prepare('SELECT id FROM provinces WHERE id = ?'); $p->execute([$c['provinceId']]);
    if (!$p->fetch()) $e['provinceId'] = 'required';
    $dd = $db->prepare('SELECT province_id FROM districts WHERE id = ?'); $dd->execute([$c['districtId']]);
    $dRow = $dd->fetch();
    if (!$dRow || (int)$dRow['province_id'] !== $c['provinceId']) $e['districtId'] = 'required';
    $dv = $db->prepare('SELECT district_id FROM electoral_divisions WHERE id = ?'); $dv->execute([$c['divisionId']]);
    $vRow = $dv->fetch();
    if (!$vRow || (int)$vRow['district_id'] !== $c['districtId']) $e['divisionId'] = 'required';

    $c['phone'] = mem_norm_phone((string)($d['phone'] ?? ''));
    if (!preg_match('/^\+?\d{9,15}$/', $c['phone'])) $e['phone'] = 'invalid';

    $c['email'] = strtolower(mem_clean($d['email'] ?? '', 160));
    if (!v_email($c['email'])) $e['email'] = 'invalid';

    // Sri Lankan NIC: old format 9 digits + V/X (birth year 19YY), new format 12 digits (YYYY…).
    $c['nic'] = mem_norm_nic((string)($d['nic'] ?? ''));
    if (preg_match('/^(\d{2})\d{7}[VX]$/', $c['nic'], $m)) $nicYear = 1900 + (int)$m[1];
    elseif (preg_match('/^(\d{4})\d{8}$/', $c['nic'], $m)) $nicYear = (int)$m[1];
    else { $nicYear = null; $e['nic'] = 'invalid'; }
    if ($nicYear && empty($e['dateOfBirth']) && $nicYear !== (int)substr($c['dateOfBirth'], 0, 4)) $e['nic'] = 'dob_mismatch';

    $c['citizenship'] = (string)($d['citizenship'] ?? '');
    if (!in_array($c['citizenship'], MEM_CITIZENSHIP, true)) $e['citizenship'] = 'required';
    if (empty($d['eligible'])) $e['eligible'] = 'required';

    $c['occupation'] = mem_clean($d['occupation'] ?? '', 120);
    if (mb_strlen($c['occupation']) < 2) $e['occupation'] = 'required';
    $c['interests'] = array_values(array_unique(array_filter((array)($d['interests'] ?? []), fn($i) => in_array($i, MEM_INTERESTS, true))));
    $c['previousMember'] = !empty($d['previousMember']);
    $c['previousOrganisation'] = $c['previousMember'] ? mem_clean($d['previousOrganisation'] ?? '', 160) : '';
    if ($c['previousMember'] && mb_strlen($c['previousOrganisation']) < 2) $e['previousOrganisation'] = 'required';

    foreach (MEM_DECLARATIONS as $k) if (empty($d['declarations'][$k])) $e['declarations.' . $k] = 'required';
    $c['pledges'] = [];
    foreach (MEM_PLEDGES as $k) {
        $c['pledges'][$k] = !empty($d['pledges'][$k]);
        if (!$c['pledges'][$k]) $e['pledges'] = 'pledges_incomplete';
    }
    $c['signature'] = mem_clean($d['signature'] ?? '', 160);
    $norm = fn($s) => mb_strtolower(preg_replace('/\s+/u', ' ', trim($s)));
    if ($c['signature'] === '') $e['signature'] = 'required';
    elseif ($norm($c['signature']) !== $norm($c['fullName'])) $e['signature'] = 'mismatch';

    $c['language'] = mem_lang($d['language'] ?? 'en');

    if ($requirePhoto && !$photo) $e['photo'] = 'required';
    return [$c, $e, $age];
}

/** Re-encodes the photo with GD (drops EXIF / any appended payload) into a private folder. */
function mem_store_photo(array $file): array {
    $max = (int)env('UPLOAD_MAX_IMAGE', 5242880);
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return ['error' => 'upload_failed'];
    if ($file['size'] > $max) return ['error' => 'too_large'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) return ['error' => 'type'];
    $info = @getimagesize($file['tmp_name']);
    if (!$info || $info[0] < 200 || $info[1] < 200 || $info[0] > 8000 || $info[1] > 8000) return ['error' => 'dimensions'];

    $dir = dirname(__DIR__, 2) . '/uploads/membership/private';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    if (!is_file($dir . '/.htaccess')) file_put_contents($dir . '/.htaccess', "# Applicant photos: served only through the admin API.\nRequire all denied\n");
    $name = bin2hex(random_bytes(16)) . '.jpg';
    if (function_exists('imagecreatefromstring')) {
        $img = @imagecreatefromstring(file_get_contents($file['tmp_name']));
        if (!$img) return ['error' => 'type'];
        $w = imagesx($img); $h = imagesy($img);
        $scale = min(1, 1200 / max($w, $h));
        $out = imagecreatetruecolor((int)round($w * $scale), (int)round($h * $scale));
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $img, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h);
        imagejpeg($out, $dir . '/' . $name, 86);
    } else {
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) return ['error' => 'upload_failed'];
    }
    return ['path' => 'uploads/membership/private/' . $name];
}

function mem_store_pdf(array $file): array {
    $max = (int)env('UPLOAD_MAX_PDF', 10485760); // 10MB
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return ['error' => 'upload_failed'];
    if ($file['size'] > $max) return ['error' => 'too_large'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $handle = fopen($file['tmp_name'], 'rb');
    $signature = $handle ? fread($handle, 5) : '';
    if ($handle) fclose($handle);
    if ($mime !== 'application/pdf' || $signature !== '%PDF-'
        || strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION)) !== 'pdf') return ['error' => 'type'];

    $dir = dirname(__DIR__, 2) . '/uploads/membership/pdf';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    if (!is_file($dir . '/.htaccess')) file_put_contents($dir . '/.htaccess', "# PDF applications: served only through the admin API.\nRequire all denied\n");
    $name = bin2hex(random_bytes(16)) . '.pdf';
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) return ['error' => 'upload_failed'];
    return ['path' => 'uploads/membership/pdf/' . $name];
}

function mem_apply(): void {
    mem_rate_limit('apply', 5, 3600);
    $raw = $_POST['data'] ?? null;
    $d = $raw !== null ? json_decode((string)$raw, true) : request_body();
    if (!is_array($d)) fail('Invalid request', 422);

    $requirePhoto = mem_setting('require_photo', '0') === '1';
    $photo = ($requirePhoto && isset($_FILES['photo']) && ($_FILES['photo']['error'] ?? 4) !== UPLOAD_ERR_NO_FILE) ? $_FILES['photo'] : null;
    [$c, $errors] = mem_validate_application($d, $requirePhoto, $photo);
    if ($errors) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => $errors]);

    $db = db();
    // One active application per NIC and per email (pending / under review / approved).
    $dup = $db->prepare("SELECT nic_number, email FROM party_members
        WHERE deleted_at IS NULL AND status IN ('pending','under_review','verified') AND (nic_number = ? OR email = ?) LIMIT 1");
    $dup->execute([$c['nic'], $c['email']]);
    if ($row = $dup->fetch()) {
        $field = $row['nic_number'] === $c['nic'] ? 'nic' : 'email';
        fail('An application with these details already exists.', 409, ['code' => 'duplicate', 'field' => $field]);
    }

    $photoPath = null;
    if ($photo) {
        $st = mem_store_photo($photo);
        if (isset($st['error'])) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => ['photo' => $st['error']]]);
        $photoPath = $st['path'];
    }

    $ref = mem_new_reference();
    $now = date('Y-m-d H:i:s');
    $decl = array_fill_keys(MEM_DECLARATIONS, true) + [
        'pledges' => $c['pledges'],
        'acceptedAt' => $now,
    ];
    $db->beginTransaction();
    $ins = $db->prepare('INSERT INTO party_members (application_ref, full_name, date_of_birth, gender, marital_status, phone, email,
        residential_address, mailing_address, province_id, district_id, electoral_division_id, nic_number, citizenship,
        occupation, interests, previous_member, previous_organisation, preferred_language, declarations, declaration_name,
        declared_at, photo_path, status, registered_at, submitted_ip, application_method, application_language)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? ,\'pending\',?,?,?,?)');
    $ins->execute([$ref, $c['fullName'], $c['dateOfBirth'], $c['gender'], $c['maritalStatus'], $c['phone'], $c['email'],
        $c['residentialAddress'], $c['mailingSame'] ? null : $c['mailingAddress'], $c['provinceId'], $c['districtId'], $c['divisionId'],
        $c['nic'], $c['citizenship'], $c['occupation'], json_encode($c['interests']), $c['previousMember'] ? 1 : 0,
        $c['previousOrganisation'] ?: null, $c['language'], json_encode($decl), $c['signature'], $now, $photoPath, $now,
        $_SERVER['REMOTE_ADDR'] ?? null, 'online', $c['language']]);
    $id = (int)$db->lastInsertId();
    $db->prepare("INSERT INTO membership_verification_logs (member_id, reviewer_id, reviewer_role, previous_status, new_status, notes, decision_at)
        VALUES (?, NULL, 'applicant', NULL, 'pending', 'Application submitted online', ?)")->execute([$id, $now]);
    $dn = $db->prepare('SELECT name FROM districts WHERE id = ?'); $dn->execute([$c['districtId']]);
    $db->commit();

    activity_log(null, 'membership.registered', 'party_member', $id, ['name' => $c['fullName'], 'reference' => $ref]);

    // Any saved progress for this email is no longer needed.
    if (!empty($d['draftCode'])) {
        $db->prepare('DELETE FROM membership_drafts WHERE code_hash = ? AND email = ?')->execute([hash('sha256', mem_draft_code_norm((string)$d['draftCode'])), $c['email']]);
    }

    mem_notify_admins('membership_application', 'New membership application',
        $c['fullName'] . ' · ' . ($dn->fetchColumn() ?: '') . ' · ' . $ref, '/membership/' . $id, 'party_member', $id);
    $emailStatus = mem_send_event_email($id, 'received');

    ok(['reference' => $ref, 'submittedAt' => date('c', strtotime($now)), 'status' => 'received',
        'email' => $c['email'], 'emailStatus' => $emailStatus], 201);
}

function mem_apply_pdf(): void {
    mem_rate_limit('apply-pdf', 5, 3600);

    // Required fields for PDF application
    $fullName = mem_clean($_POST['fullName'] ?? '', 160);
    $nic = mem_norm_nic($_POST['nic'] ?? '');
    $phone = mem_norm_phone($_POST['phone'] ?? '');
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $districtId = (int)($_POST['districtId'] ?? 0);
    $language = mem_lang($_POST['language'] ?? 'en');

    // Validate required fields
    $errors = [];
    if (mb_strlen($fullName) < 3) $errors['fullName'] = 'required';
    if (!preg_match('/^(\d{2})\d{7}[VX]$/', $nic) && !preg_match('/^(\d{4})\d{8}$/', $nic)) $errors['nic'] = 'invalid';
    if (!preg_match('/^\+?\d{9,15}$/', $phone)) $errors['phone'] = 'invalid';
    if ($email !== '' && !v_email($email)) $errors['email'] = 'invalid';
    if (!$districtId) $errors['districtId'] = 'required';
    else { $district = db()->prepare('SELECT id FROM districts WHERE id = ?'); $district->execute([$districtId]); if (!$district->fetchColumn()) $errors['districtId'] = 'invalid'; }

    if ($errors) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => $errors]);

    // Validate PDF file
    if (!isset($_FILES['pdf']) || ($_FILES['pdf']['error'] ?? 4) === UPLOAD_ERR_NO_FILE) {
        fail('Please upload the completed application PDF.', 422, ['code' => 'validation', 'fields' => ['pdf' => 'required']]);
    }

    $pdfValidation = mem_validate_pdf_upload($_FILES['pdf']);
    if ($pdfValidation) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => ['pdf' => $pdfValidation]]);

    $supportingFiles = [];
    $supportingTotal = 0;
    if (isset($_FILES['supporting'])) {
        $batch = $_FILES['supporting'];
        $count = is_array($batch['name'] ?? null) ? count($batch['name']) : 0;
        if ($count > 5) fail('You can add up to five supporting documents.', 422, ['code' => 'validation', 'fields' => ['supporting' => 'too_many']]);
        for ($i = 0; $i < $count; $i++) {
            $item = ['name' => $batch['name'][$i], 'type' => $batch['type'][$i], 'tmp_name' => $batch['tmp_name'][$i], 'error' => $batch['error'][$i], 'size' => $batch['size'][$i]];
            if (($item['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
            $validation = mem_validate_pdf_upload($item);
            if ($validation) fail('Please check the supporting documents.', 422, ['code' => 'validation', 'fields' => ['supporting' => $validation]]);
            $supportingTotal += (int)$item['size'];
            if ($supportingTotal > 25 * 1024 * 1024) fail('Supporting documents must total 25 MB or less.', 422, ['code' => 'validation', 'fields' => ['supporting' => 'too_large']]);
            $supportingFiles[] = $item;
        }
    }

    // Optional photo upload
    $db = db();
    // Check for duplicate NIC
    $dup = $db->prepare("SELECT id FROM party_members WHERE nic_number = ? AND deleted_at IS NULL AND status IN ('pending','under_review','verified') LIMIT 1");
    $dup->execute([$nic]);
    if ($dup->fetch()) {
        fail('An application with this NIC number already exists.', 409, ['code' => 'duplicate', 'field' => 'nic']);
    }

    // Allocate/store files only after validation and duplicate checks to avoid orphan files.
    $pdfResult = mem_store_pdf($_FILES['pdf']);
    if (isset($pdfResult['error'])) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => ['pdf' => $pdfResult['error']]]);
    $supportingPaths = [];
    foreach ($supportingFiles as $supportingFile) {
        $stored = mem_store_pdf($supportingFile);
        if (isset($stored['error'])) {
            foreach ($supportingPaths as $path) delete_upload($path);
            delete_upload($pdfResult['path']);
            fail('Please check the supporting documents.', 422, ['code' => 'validation', 'fields' => ['supporting' => $stored['error']]]);
        }
        $supportingPaths[] = $stored['path'];
    }

    $ref = mem_new_reference();
    $now = date('Y-m-d H:i:s');
    $db->beginTransaction();
    $ins = $db->prepare('INSERT INTO party_members (application_ref, application_method, application_language, full_name, phone, email,
        nic_number, district_id, pdf_path, supporting_documents, photo_path, status, registered_at, submitted_ip)
        VALUES (?,?,?,?,?,?,?,?,?,?,NULL,\'pending\',?,?)');
    $ins->execute([$ref, 'pdf', $language, $fullName, $phone, $email,
        $nic, $districtId, $pdfResult['path'], json_encode($supportingPaths, JSON_UNESCAPED_SLASHES), $now,
        $_SERVER['REMOTE_ADDR'] ?? null]);
    $id = (int)$db->lastInsertId();
    $db->commit();

    activity_log(null, 'membership.pdf_applied', 'party_member', $id, ['name' => $fullName, 'reference' => $ref]);
    mem_notify_admins('membership_application', 'New PDF membership application',
        $fullName . ' · ' . $ref, '/membership/' . $id, 'party_member', $id);

    ok(['reference' => $ref, 'submittedAt' => date('c', strtotime($now)), 'status' => 'received', 'email' => $email,
        'emailStatus' => $email !== '' ? mem_send_event_email($id, 'received') : null], 201);
}

function mem_validate_pdf_upload(array $file): ?string {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return 'upload_failed';
    if ((int)($file['size'] ?? 0) <= 0 || (int)$file['size'] > (int)env('UPLOAD_MAX_PDF', 10485760)) return 'too_large';
    if (strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION)) !== 'pdf') return 'type';
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $handle = fopen($file['tmp_name'], 'rb');
    $signature = $handle ? fread($handle, 5) : '';
    if ($handle) fclose($handle);
    return $mime === 'application/pdf' && $signature === '%PDF-' ? null : 'type';
}

function mem_track(): void {
    mem_rate_limit('track', 20, 900);
    $b = request_body();
    $ref = mem_normalize_ref((string)($b['reference'] ?? ''));
    $email = strtolower(trim((string)($b['email'] ?? '')));
    if ($ref === '' || !v_email($email)) fail('Enter your reference and the email address you applied with.', 422, ['code' => 'validation']);

    $s = db()->prepare('SELECT id, application_ref, full_name, email, status, membership_id, decision_reason, created_at, updated_at, reviewed_at, verified_at
        FROM party_members WHERE application_ref = ? AND deleted_at IS NULL');
    $s->execute([$ref]);
    $m = $s->fetch();
    // Same response whether the reference or the email is wrong, so neither can be probed.
    if (!$m || !hash_equals(strtolower((string)$m['email']), $email)) {
        fail('We could not find an application with that reference and email address.', 404, ['code' => 'not_found']);
    }
    $first = preg_split('/\s+/', trim($m['full_name']))[0] ?? '';
    $status = MEM_STATUS_PUBLIC[$m['status']] ?? 'received';
    ok([
        'reference' => $m['application_ref'],
        'firstName' => $first,
        'status' => $status,
        'submittedAt' => date('c', strtotime($m['created_at'])),
        'updatedAt' => $m['reviewed_at'] ? date('c', strtotime($m['reviewed_at'])) : null,
        'membershipId' => $status === 'approved' ? $m['membership_id'] : null,
        'reason' => $status === 'declined' ? ($m['decision_reason'] ?: null) : null,
    ]);
}

function mem_draft_code_norm(string $c): string { return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $c)); }

function mem_draft_save(): void {
    mem_rate_limit('draft-save', 30, 3600);
    $b = request_body();
    $email = strtolower(trim((string)($b['email'] ?? '')));
    if (!v_email($email)) fail('Enter a valid email address to save your progress.', 422, ['code' => 'validation', 'fields' => ['email' => 'invalid']]);
    $data = $b['data'] ?? null;
    if (!is_array($data)) fail('Invalid request', 422);
    unset($data['photo'], $data['draftCode']);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if (strlen($json) > 20000) fail('Invalid request', 422);
    $step = max(1, min(5, (int)($b['step'] ?? 1)));
    $expires = date('Y-m-d H:i:s', time() + 7 * 86400);
    $db = db();
    $db->exec('DELETE FROM membership_drafts WHERE expires_at < NOW()');

    $code = isset($b['code']) ? mem_draft_code_norm((string)$b['code']) : '';
    if ($code !== '') {
        $chk = $db->prepare('SELECT id FROM membership_drafts WHERE code_hash = ? AND email = ?');
        $chk->execute([hash('sha256', $code), $email]);
        if ($draftId = $chk->fetchColumn()) {
            $db->prepare('UPDATE membership_drafts SET data = ?, step = ?, expires_at = ? WHERE id = ?')->execute([$json, $step, $expires, $draftId]);
            ok(['code' => mem_format_draft_code($code), 'expiresAt' => date('c', strtotime($expires)), 'updated' => true]);
        }
    }
    $code = mem_random_code(12);
    $db->prepare('INSERT INTO membership_drafts (code_hash, email, data, step, expires_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([hash('sha256', $code), $email, $json, $step, $expires]);
    ok(['code' => mem_format_draft_code($code), 'expiresAt' => date('c', strtotime($expires)), 'updated' => false], 201);
}

function mem_format_draft_code(string $c): string { return implode('-', str_split($c, 4)); }

function mem_draft_load(): void {
    mem_rate_limit('draft-load', 10, 900);
    $b = request_body();
    $code = mem_draft_code_norm((string)($b['code'] ?? ''));
    $email = strtolower(trim((string)($b['email'] ?? '')));
    if (strlen($code) !== 12 || !v_email($email)) fail('Enter your resume code and email address.', 422, ['code' => 'validation']);
    $s = db()->prepare('SELECT data, step, expires_at FROM membership_drafts WHERE code_hash = ? AND email = ? AND expires_at >= NOW()');
    $s->execute([hash('sha256', $code), $email]);
    $r = $s->fetch();
    if (!$r) fail('No saved application matches that code and email, or it has expired.', 404, ['code' => 'not_found']);
    ok(['data' => json_decode($r['data'], true) ?: [], 'step' => (int)$r['step'], 'code' => mem_format_draft_code($code), 'expiresAt' => date('c', strtotime($r['expires_at']))]);
}

// =================================================================== admin

function mem_row_summary(array $r): array {
    return [
        'id' => (int)$r['id'], 'reference' => $r['application_ref'], 'membershipId' => $r['membership_id'],
        'applicationMethod' => $r['application_method'] ?? 'online', 'applicationLanguage' => $r['application_language'] ?? 'en',
        'fullName' => $r['full_name'], 'email' => $r['email'], 'phone' => $r['phone'],
        'district' => $r['district_name'] ?? null, 'province' => $r['province_name'] ?? null,
        'hasPhoto' => !empty($r['photo_path']), 'hasPdf' => !empty($r['pdf_path']),
        'supportingDocumentCount' => count(json_decode($r['supporting_documents'] ?? '[]', true) ?: []),
        'status' => $r['status'], 'publicStatus' => MEM_STATUS_PUBLIC[$r['status']] ?? $r['status'],
        'submittedAt' => $r['created_at'], 'reviewedAt' => $r['reviewed_at'],
    ];
}

function mem_admin_list(): void {
    mem_require_admin();
    [$page, $limit, $offset] = pagination_params();
    $where = ['pm.deleted_at IS NULL', 'pm.application_ref IS NOT NULL'];
    $params = [];
    $status = $_GET['status'] ?? '';
    if (in_array($status, ['pending', 'under_review', 'verified', 'rejected'], true)) { $where[] = 'pm.status = ?'; $params[] = $status; }
    if (!empty($_GET['district'])) { $where[] = 'pm.district_id = ?'; $params[] = (int)$_GET['district']; }
    if (!empty($_GET['method'])) { $where[] = 'pm.application_method = ?'; $params[] = $_GET['method']; }
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(pm.full_name LIKE ? OR pm.email LIKE ? OR pm.application_ref LIKE ? OR pm.membership_id LIKE ? OR pm.nic_number LIKE ? OR pm.phone LIKE ?)';
        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
        array_push($params, $like, $like, $like, $like, $like, $like);
    }
    $w = implode(' AND ', $where);
    $db = db();
    $cnt = $db->prepare("SELECT COUNT(*) FROM party_members pm WHERE $w");
    $cnt->execute($params);
    $total = (int)$cnt->fetchColumn();
    $sql = "SELECT pm.*, d.name district_name, p.name province_name FROM party_members pm
        LEFT JOIN districts d ON d.id = pm.district_id LEFT JOIN provinces p ON p.id = pm.province_id
        WHERE $w ORDER BY FIELD(pm.status,'pending','under_review','verified','rejected'), pm.created_at DESC LIMIT $limit OFFSET $offset";
    $s = $db->prepare($sql);
    $s->execute($params);
    $items = array_map('mem_row_summary', $s->fetchAll());

    $stats = ['total' => 0, 'pending' => 0, 'under_review' => 0, 'verified' => 0, 'rejected' => 0];
    foreach ($db->query("SELECT status, COUNT(*) c FROM party_members WHERE deleted_at IS NULL AND application_ref IS NOT NULL GROUP BY status")->fetchAll() as $r) {
        if (isset($stats[$r['status']])) $stats[$r['status']] = (int)$r['c'];
        $stats['total'] += (int)$r['c'];
    }
    $districts = $db->query('SELECT id, name FROM districts ORDER BY name')->fetchAll();
    ok(['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit, 'pages' => (int)ceil($total / $limit), 'stats' => $stats, 'districts' => $districts]);
}

function mem_load_member(int $id): array {
    $s = db()->prepare('SELECT pm.*, d.name district_name, p.name province_name, ed.name division_name, ed.electoral_district
        FROM party_members pm LEFT JOIN districts d ON d.id = pm.district_id LEFT JOIN provinces p ON p.id = pm.province_id
        LEFT JOIN electoral_divisions ed ON ed.id = pm.electoral_division_id WHERE pm.id = ? AND pm.deleted_at IS NULL');
    $s->execute([$id]);
    $m = $s->fetch();
    if (!$m) fail('Application not found', 404);
    return $m;
}

function mem_admin_detail(): void {
    mem_require_admin();
    $id = (int)($_GET['id'] ?? 0);
    $m = mem_load_member($id);
    $db = db();
    $h = $db->prepare('SELECT l.id, l.previous_status, l.new_status, l.notes, l.decision_at, l.reviewer_role, u.name reviewer
        FROM membership_verification_logs l LEFT JOIN users u ON u.id = l.reviewer_id WHERE l.member_id = ? ORDER BY l.decision_at, l.id');
    $h->execute([$id]);
    $em = $db->prepare('SELECT id, template_key, recipient, subject, status, error, attempts, sent_at, created_at, updated_at FROM membership_emails WHERE member_id = ? ORDER BY id');
    $em->execute([$id]);
    $dob = $m['date_of_birth'] ? new DateTime($m['date_of_birth']) : null;
    ok(mem_row_summary($m) + [
        'dateOfBirth' => $m['date_of_birth'], 'age' => $dob ? $dob->diff(new DateTime('today'))->y : null,
        'gender' => $m['gender'], 'residentialAddress' => $m['residential_address'], 'mailingAddress' => $m['mailing_address'],
        'division' => $m['division_name'], 'electoralDistrict' => $m['electoral_district'],
        'nic' => $m['nic_number'], 'citizenship' => $m['citizenship'], 'occupation' => $m['occupation'],
        'interests' => json_decode($m['interests'] ?? '[]', true) ?: [], 'previousMember' => (bool)$m['previous_member'],
        'previousOrganisation' => $m['previous_organisation'], 'language' => $m['preferred_language'],
        'declarations' => json_decode($m['declarations'] ?? '{}', true) ?: [], 'signature' => $m['declaration_name'], 'declaredAt' => $m['declared_at'],
        'hasPhoto' => (bool)$m['photo_path'], 'decisionReason' => $m['decision_reason'], 'verifiedAt' => $m['verified_at'],
        'history' => $h->fetchAll(), 'emails' => $em->fetchAll(), 'mail' => mail_config_summary(),
    ]);
}

function mem_admin_photo(): void {
    mem_require_admin();
    $m = mem_load_member((int)($_GET['id'] ?? 0));
    if (!$m['photo_path']) fail('No photo', 404);
    $root = realpath(dirname(__DIR__, 2) . '/uploads/membership/private');
    $abs = realpath(dirname(__DIR__, 2) . '/' . $m['photo_path']);
    if (!$abs || !$root || !str_starts_with($abs, $root) || !is_file($abs)) fail('No photo', 404);
    header('Content-Type: image/jpeg');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($abs));
    readfile($abs);
    exit;
}

function mem_admin_pdf(): void {
    mem_require_admin();
    $m = mem_load_member((int)($_GET['id'] ?? 0));
    if (!$m['pdf_path']) fail('No PDF', 404);
    $root = realpath(dirname(__DIR__, 2) . '/uploads/membership/pdf');
    $abs = realpath(dirname(__DIR__, 2) . '/' . $m['pdf_path']);
    if (!$abs || !$root || !str_starts_with($abs, $root) || !is_file($abs)) fail('No PDF', 404);
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="application.pdf"');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($abs));
    readfile($abs);
    exit;
}

function mem_admin_supporting_pdf(): void {
    mem_require_admin();
    $m = mem_load_member((int)($_GET['id'] ?? 0));
    $files = json_decode($m['supporting_documents'] ?? '[]', true) ?: [];
    $index = (int)($_GET['file'] ?? -1);
    if (!isset($files[$index])) fail('No supporting document', 404);
    $root = realpath(dirname(__DIR__, 2) . '/uploads/membership/pdf');
    $abs = realpath(dirname(__DIR__, 2) . '/' . $files[$index]);
    if (!$abs || !$root || !str_starts_with($abs, $root) || !is_file($abs)) fail('No supporting document', 404);
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="supporting-document-' . ($index + 1) . '.pdf"');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($abs));
    readfile($abs);
    exit;
}

function mem_admin_decide(): void {
    $user = mem_require_admin();
    $b = request_body();
    $id = (int)($b['id'] ?? 0);
    $decision = (string)($b['decision'] ?? '');
    $reason = mem_clean($b['reason'] ?? '', 1000);
    $map = ['review' => 'under_review', 'approve' => 'verified', 'decline' => 'rejected'];
    if (!isset($map[$decision])) fail('Unknown decision', 422);
    if ($decision === 'decline' && mb_strlen($reason) < 5) fail('Please give a reason for declining (it is included in the email to the applicant).', 422, ['code' => 'validation', 'fields' => ['reason' => 'required']]);
    $allowed = ['pending' => ['under_review', 'verified', 'rejected'], 'under_review' => ['verified', 'rejected']];

    $db = db();
    $db->beginTransaction();
    $s = $db->prepare('SELECT id, status, membership_id FROM party_members WHERE id = ? AND deleted_at IS NULL FOR UPDATE');
    $s->execute([$id]);
    $m = $s->fetch();
    if (!$m) { $db->rollBack(); fail('Application not found', 404); }
    $to = $map[$decision];
    if (!in_array($to, $allowed[$m['status']] ?? [], true)) {
        $db->rollBack();
        $msg = $m['status'] === 'verified' ? 'This application has already been approved.' : ($m['status'] === 'rejected' ? 'This application has already been declined.' : 'This change is not allowed.');
        fail($msg, 409, ['code' => 'invalid_transition', 'status' => $m['status']]);
    }
    $now = date('Y-m-d H:i:s');
    $role = implode(', ', array_intersect($user['roles'] ?? [], MEM_ADMIN_ROLES));
    $membershipId = $m['membership_id'];
    if ($to === 'verified') {
        $membershipId = $membershipId ?: mem_next_membership_id();
        $db->prepare('UPDATE party_members SET status = ?, membership_id = ?, verified_at = ?, reviewed_by = ?, reviewed_at = ?, decision_reason = NULL WHERE id = ?')
            ->execute([$to, $membershipId, $now, $user['id'], $now, $id]);
    } elseif ($to === 'rejected') {
        $db->prepare('UPDATE party_members SET status = ?, decision_reason = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?')
            ->execute([$to, $reason, $user['id'], $now, $id]);
    } else {
        $db->prepare('UPDATE party_members SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?')->execute([$to, $user['id'], $now, $id]);
    }
    $note = $to === 'verified' ? 'Approved · membership ID ' . $membershipId . ($reason ? ' · ' . $reason : '') : ($to === 'rejected' ? $reason : ($reason ?: 'Marked as under review'));
    $db->prepare('INSERT INTO membership_verification_logs (member_id, reviewer_id, reviewer_role, previous_status, new_status, notes, decision_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$id, $user['id'], $role ?: null, $m['status'], $to, $note, $now]);
    $db->commit();
    activity_log((int)$user['id'], 'membership.' . $decision, 'party_member', $id, ['membershipId' => $membershipId]);

    $emailStatus = null;
    if ($to === 'verified') $emailStatus = mem_send_event_email($id, 'approved');
    if ($to === 'rejected') $emailStatus = mem_send_event_email($id, 'declined');
    ok(['status' => $to, 'membershipId' => $to === 'verified' ? $membershipId : null, 'emailStatus' => $emailStatus]);
}

function mem_admin_resend(): void {
    $user = mem_require_admin();
    $b = request_body();
    $id = (int)($b['id'] ?? 0);
    $tpl = (string)($b['template'] ?? '');
    if (!in_array($tpl, MEM_TEMPLATES, true)) fail('Unknown template', 422);
    $m = mem_load_member($id);
    $need = ['received' => null, 'approved' => 'verified', 'declined' => 'rejected'][$tpl];
    if ($need && $m['status'] !== $need) fail('This email does not match the application status.', 409);
    $s = db()->prepare('SELECT status FROM membership_emails WHERE member_id = ? AND template_key = ?');
    $s->execute([$id, $tpl]);
    if ($s->fetchColumn() === 'sent') fail('This email was already sent.', 409, ['code' => 'already_sent']);
    $status = mem_send_event_email($id, $tpl, true);
    activity_log((int)$user['id'], 'membership.email_retry', 'party_member', $id, ['template' => $tpl, 'status' => $status]);
    ok(['emailStatus' => $status]);
}

function mem_admin_settings_get(): void {
    mem_require_admin();
    $s = mem_settings();
    $out = [];
    foreach (MEM_SETTING_KEYS as $k) $out[$k] = $s[$k] ?? '';
    foreach (MEM_SETTING_LANG_KEYS as $k) foreach (MEM_LANGS as $l) $out[$k . '_' . $l] = $s[$k . '_' . $l] ?? '';
    $urls = [];
    foreach (['leader_photo', 'why_img_1', 'why_img_2', 'why_img_3', 'why_img_4'] as $k) $urls[$k] = mem_upload_url($out[$k]);
    ok(['settings' => $out, 'imageUrls' => $urls, 'mail' => mail_config_summary(), 'publicSiteUrl' => mem_public_site_url()] + mem_templates_all());
}

function mem_admin_settings_save(): void {
    $user = mem_require_admin();
    $in = request_body()['settings'] ?? null;
    if (!is_array($in)) fail('Invalid request', 422);
    $allowed = [];
    foreach (['rules_url', 'constitution_url', 'conduct_url', 'contact_email', 'contact_phone', 'public_site_url', 'require_photo', 'min_age', 'id_prefix'] as $k) $allowed[] = $k;
    foreach (MEM_SETTING_LANG_KEYS as $k) foreach (MEM_LANGS as $l) $allowed[] = $k . '_' . $l;
    // Images can be cleared here (set to ''); new images go through upload-image.
    foreach (['leader_photo', 'why_img_1', 'why_img_2', 'why_img_3', 'why_img_4'] as $k) if (array_key_exists($k, $in) && $in[$k] === '') $allowed[] = $k;

    $errors = [];
    $clean = [];
    foreach ($in as $k => $v) {
        if (!in_array($k, $allowed, true)) continue;
        $v = mem_clean(is_scalar($v) ? (string)$v : '', str_starts_with($k, 'welcome') || str_starts_with($k, 'success') ? 2000 : 300);
        if (str_ends_with($k, '_url') && $v !== '' && !filter_var($v, FILTER_VALIDATE_URL) && !preg_match('#^/[^\s]*$#', $v)) $errors[$k] = 'invalid_url';
        if ($k === 'public_site_url' && $v !== '' && !filter_var($v, FILTER_VALIDATE_URL)) $errors[$k] = 'invalid_url';
        if ($k === 'contact_email' && $v !== '' && !v_email($v)) $errors[$k] = 'invalid_email';
        if ($k === 'require_photo') $v = $v === '1' ? '1' : '0';
        if ($k === 'min_age') { if (!ctype_digit($v) || (int)$v > 100) $errors[$k] = 'invalid'; }
        if ($k === 'id_prefix') { $v = strtoupper($v); if (!preg_match('/^[A-Z0-9]{2,8}$/', $v)) $errors[$k] = 'invalid'; }
        $clean[$k] = $v;
    }
    if ($errors) fail('Please check the highlighted fields.', 422, ['code' => 'validation', 'fields' => $errors]);
    $st = db()->prepare("INSERT INTO settings (setting_key, setting_value, `group`) VALUES (?, ?, 'membership')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    foreach ($clean as $k => $v) $st->execute(['mem_' . $k, $v]);
    activity_log((int)$user['id'], 'membership.settings', 'settings', null, ['keys' => array_keys($clean)]);
    ok(['saved' => array_keys($clean)]);
}

function mem_admin_templates_save(): void {
    $user = mem_require_admin();
    $list = request_body()['templates'] ?? null;
    if (!is_array($list)) fail('Invalid request', 422);
    $db = db();
    $up = $db->prepare('INSERT INTO membership_email_templates (template_key, lang, subject, heading, body, updated_by) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE subject = VALUES(subject), heading = VALUES(heading), body = VALUES(body), updated_by = VALUES(updated_by)');
    $del = $db->prepare('DELETE FROM membership_email_templates WHERE template_key = ? AND lang = ?');
    $errors = [];
    foreach ($list as $i => $t) {
        $key = (string)($t['key'] ?? ''); $lang = (string)($t['lang'] ?? '');
        if (!in_array($key, MEM_TEMPLATES, true) || !in_array($lang, MEM_LANGS, true)) continue;
        $subject = mem_clean($t['subject'] ?? '', 200);
        $heading = mem_clean($t['heading'] ?? '', 200);
        $body = trim(str_replace("\r\n", "\n", (string)($t['body'] ?? '')));
        $body = mb_substr(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $body), 0, 6000);
        if ($subject === '' && $heading === '' && $body === '') { $del->execute([$key, $lang]); continue; } // back to default / fallback
        if ($subject === '' || $heading === '' || $body === '') { $errors["$key.$lang"] = 'incomplete'; continue; }
        if ($key === 'approved' && !str_contains($body, '{membership_id}')) $errors["$key.$lang"] = 'missing_membership_id';
        if ($key === 'declined' && !str_contains($body, '{reason}')) $errors["$key.$lang"] = 'missing_reason';
        if (!str_contains($body . $subject, '{reference}')) $errors["$key.$lang"] = 'missing_reference';
        if (isset($errors["$key.$lang"])) continue;
        $up->execute([$key, $lang, $subject, $heading, $body, $user['id']]);
    }
    if ($errors) fail('Some templates were not saved.', 422, ['code' => 'validation', 'fields' => $errors]);
    activity_log((int)$user['id'], 'membership.templates', 'settings', null, null);
    ok(mem_templates_all());
}

function mem_admin_upload_image(): void {
    $user = mem_require_admin();
    $slot = (string)($_POST['slot'] ?? '');
    if (!in_array($slot, ['leader_photo', 'why_img_1', 'why_img_2', 'why_img_3', 'why_img_4'], true)) fail('Unknown image slot', 422);
    if (empty($_FILES['file'])) fail('Choose an image to upload.', 422);
    $r = upload_file($_FILES['file'], 'membership/public', ['jpg', 'jpeg', 'png', 'webp'], ['image/jpeg', 'image/png', 'image/webp'], (int)env('UPLOAD_MAX_IMAGE', 5242880));
    if (isset($r['error'])) fail($r['error'], 422);
    $old = mem_setting($slot);
    db()->prepare("INSERT INTO settings (setting_key, setting_value, `group`) VALUES (?, ?, 'membership') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")
        ->execute(['mem_' . $slot, $r['path']]);
    if ($old && str_starts_with($old, 'uploads/membership/public/')) delete_upload($old);
    activity_log((int)$user['id'], 'membership.image', 'settings', null, ['slot' => $slot]);
    ok(['slot' => $slot, 'path' => $r['path'], 'url' => mem_upload_url($r['path'])]);
}

function mem_admin_email_preview(): void {
    mem_require_admin();
    $b = ($_SERVER['REQUEST_METHOD'] === 'POST') ? request_body() : $_GET;
    $key = (string)($b['template'] ?? 'received');
    $lang = mem_lang($b['lang'] ?? 'en');
    if (!in_array($key, MEM_TEMPLATES, true)) fail('Unknown template', 422);
    $vars = ['name' => '[Applicant name]', 'reference' => 'JU-XXXX-XXXX', 'membership_id' => '[Membership ID]',
        'reason' => '[Reason entered by the reviewer]', 'date' => date('j F Y'), 'email' => '[applicant email]'];
    if (!empty($b['subject']) || !empty($b['body'])) {
        $vars['__template'] = ['subject' => (string)($b['subject'] ?? ''), 'heading' => (string)($b['heading'] ?? ''), 'body' => (string)($b['body'] ?? ''), 'lang' => $lang];
    }
    $mail = mem_render_email($key, $lang, $vars);
    ok(['subject' => $mail['subject'], 'html' => $mail['html']]);
}

function mem_admin_email_view(): void {
    mem_require_admin();
    $s = db()->prepare('SELECT subject, body_html, status, recipient FROM membership_emails WHERE id = ?');
    $s->execute([(int)($_GET['id'] ?? 0)]);
    $r = $s->fetch();
    if (!$r) fail('Not found', 404);
    ok(['subject' => $r['subject'], 'html' => $r['body_html'], 'status' => $r['status'], 'recipient' => $r['recipient']]);
}
