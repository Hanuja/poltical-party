<?php
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/../helpers/upload.php';

const PV_CATEGORIES = [
    'roads' => 'Road & Transportation Problems', 'water' => 'Water Supply Problems',
    'electricity' => 'Electricity Problems', 'drainage' => 'Drainage & Sanitation',
    'waste' => 'Waste Management', 'education' => 'Education & School Facilities',
    'healthcare' => 'Healthcare & Hospital Facilities', 'agriculture' => 'Agricultural Problems',
    'employment' => 'Employment & Livelihood', 'housing' => 'Housing & Land Issues',
    'infrastructure' => 'Public Infrastructure', 'environment' => 'Environmental Problems',
    'public-service' => 'Public Service Issues', 'village-development' => 'Village Development',
    'safety' => "Women's & Children's Safety", 'other' => 'Other Community Problems',
];
const PV_STATUSES = ['pending_review', 'under_review', 'more_info_requested', 'approved', 'published', 'rejected'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    if ($method === 'POST' && $action === '') { pv_submit(); }
    if ($method === 'GET' && $action === 'media') { pv_serve_media(); }
    if ($method === 'GET' && $action === 'admin-list') { pv_admin_list(); }
    if ($method === 'GET' && $action === 'admin-detail') { pv_admin_detail(); }
    if ($method === 'POST' && $action === 'review') { pv_admin_review(); }
    if ($method === 'POST' && $action === 'update-public') { pv_admin_update_public(); }
    if ($method === 'POST' && $action === 'media-permissions') { pv_admin_media_permissions(); }
    if ($method === 'GET') {
        if (isset($_GET['id'])) pv_public_detail((int)$_GET['id']);
        pv_public_list();
    }
    fail('Not found', 404);
} catch (Throwable $e) {
    if (db()->inTransaction()) db()->rollBack();
    error_log('public voice api: ' . $e->getMessage());
    fail('Unable to process the request. Please try again.', 500);
}

function pv_admin_user(): array {
    $user = require_auth();
    if (!array_intersect($user['roles'] ?? [], ['Super Admin', 'Admin', 'Content Manager'])) fail('Forbidden', 403);
    return $user;
}

function pv_clean($value, int $max): string {
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string)$value));
    return mb_substr($value, 0, $max);
}

function pv_media_url(int $id): string { return '/api/public-voice/?action=media&id=' . $id; }

function pv_media_rows(int $submissionId, bool $publicOnly): array {
    $sql = 'SELECT id, media_type, original_filename, mime_type, file_size, duration_seconds, is_ai_generated, ai_description, is_approved_for_publication, display_order FROM public_voice_media WHERE submission_id = ?';
    if ($publicOnly) $sql .= ' AND is_approved_for_publication = 1';
    $sql .= ' ORDER BY media_type, display_order, id';
    $stmt = db()->prepare($sql);
    $stmt->execute([$submissionId]);
    return array_map(static function ($row) {
        $row['id'] = (int)$row['id'];
        $row['fileSize'] = (int)$row['file_size'];
        $row['duration'] = $row['duration_seconds'] !== null ? (float)$row['duration_seconds'] : null;
        $row['isAiGenerated'] = (bool)$row['is_ai_generated'];
        $row['isApproved'] = (bool)$row['is_approved_for_publication'];
        $row['url'] = pv_media_url((int)$row['id']);
        unset($row['file_size'], $row['duration_seconds'], $row['is_ai_generated'], $row['is_approved_for_publication']);
        return $row;
    }, $stmt->fetchAll());
}

function pv_submit(): void {
    if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 650 * 1024 * 1024) fail('The total upload is too large. Please choose smaller files and try again.', 413);
    $payload = json_decode($_POST['payload'] ?? '', true);
    if (!is_array($payload)) fail('Submission details are missing or invalid.', 422);
    if (!empty($payload['website'])) fail('Unable to accept this submission.', 422); // honeypot

    $category = (string)($payload['category'] ?? '');
    $province = pv_clean($payload['province'] ?? '', 120);
    $district = pv_clean($payload['district'] ?? '', 120);
    $ds = pv_clean($payload['dsDivision'] ?? '', 160);
    $gn = pv_clean($payload['gnDivision'] ?? '', 160);
    $village = pv_clean($payload['village'] ?? '', 180);
    $location = pv_clean($payload['specificLocation'] ?? '', 255);
    $title = pv_clean($payload['title'] ?? '', 120);
    $description = pv_clean($payload['description'] ?? '', 3000);
    $name = pv_clean($payload['name'] ?? '', 160);
    $phone = pv_clean($payload['phone'] ?? '', 40);
    $email = trim((string)($payload['email'] ?? ''));
    $contactMethod = in_array(($payload['contactMethod'] ?? ''), ['phone', 'email', 'either'], true) ? $payload['contactMethod'] : null;
    if (!isset(PV_CATEGORIES[$category])) fail('Choose a valid problem category.', 422);
    if (!$province || !$district || !$ds || !$village) fail('Province, district, divisional secretariat, and village or town are required.', 422);
    if (mb_strlen($title) < 4 || mb_strlen($title) > 120) fail('The title must be between 4 and 120 characters.', 422);
    if (mb_strlen($description) < 30 || mb_strlen($description) > 3000) fail('The description must be between 30 and 3,000 characters.', 422);
    if (!$name || !$phone || !preg_match('/^[0-9+().\s-]{7,40}$/', $phone)) fail('Enter your name and a valid contact number.', 422);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address.', 422);
    if (empty($payload['consent'])) fail('Consent to review and possible publication is required.', 422);

    $photos = pv_files('photos');
    $videos = pv_files('videos');
    $voice = pv_single_file('voice');
    $illustration = pv_single_file('illustration');
    if (count($photos) < 3 || count($photos) > 30) fail('Please attach between 3 and 30 real photographs.', 422);
    if (count($videos) > 3) fail('A maximum of 3 video clips is allowed.', 422);
    if ($illustration && empty($payload['aiConfirmation'])) fail('Confirm that the optional illustration is AI-generated and is not a real photograph.', 422);
    if (!empty($payload['voiceDuration']) && (float)$payload['voiceDuration'] > 120) fail('Voice recordings may be up to 2 minutes long.', 422);

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ipHash = $ip ? hash_hmac('sha256', $ip, (string)env('APP_KEY', 'public-voice-rate-limit')) : null;
    if ($ipHash) {
        $rate = db()->prepare('SELECT COUNT(*) FROM public_voice_submissions WHERE ip_hash = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
        $rate->execute([$ipHash]);
        if ((int)$rate->fetchColumn() >= 10) fail('Too many submissions from this connection. Please try again later.', 429);
    }

    $stored = [];
    $save = static function (array $file, string $type, int $order = 0, ?float $duration = null, bool $ai = false, string $aiDescription = '') use (&$stored): array {
        $limits = [
            'PHOTO' => [10 * 1024 * 1024, ['jpg','jpeg','png','webp'], ['image/jpeg','image/png','image/webp']],
            'AI_IMAGE' => [10 * 1024 * 1024, ['jpg','jpeg','png','webp'], ['image/jpeg','image/png','image/webp']],
            'AUDIO' => [12 * 1024 * 1024, ['webm','mp3','wav','m4a','ogg','mp4'], ['audio/webm','audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/ogg','video/mp4']],
            'VIDEO' => [100 * 1024 * 1024, ['mp4','mov','m4v','webm'], ['video/mp4','video/quicktime','video/webm','application/octet-stream']],
        ];
        [$max, $extensions, $mimes] = $limits[$type];
        if ($duration !== null && (($type === 'AUDIO' && $duration > 120) || ($type === 'VIDEO' && $duration > 180))) fail('A selected media file exceeds the allowed duration.', 422);
        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!in_array($ext, $extensions, true) || !in_array($mime, $mimes, true) || (int)$file['size'] > $max) fail('A selected media file has an unsupported type or exceeds the size limit.', 422);
        if (in_array($type, ['PHOTO','AI_IMAGE'], true) && !@getimagesize($file['tmp_name'])) fail('One of the selected images is invalid.', 422);
        if ($type === 'VIDEO' && $ext === 'mov' && $mime === 'application/octet-stream') {
            $head = file_get_contents($file['tmp_name'], false, null, 0, 32);
            if (!$head || substr($head, 4, 4) !== 'ftyp') fail('This MOV file could not be verified. Please choose another video.', 422);
            $mime = 'video/quicktime';
        }
        $saved = upload_file($file, 'public-voice/private', $extensions, $mimes, $max);
        if (!$saved || isset($saved['error'])) fail('A media file could not be safely stored.', 422);
        $stored[] = $saved['path'];
        return [
            'type' => $type, 'original' => pv_clean(basename($file['name']), 255), 'stored' => $saved['name'],
            'path' => $saved['path'], 'mime' => $mime, 'size' => (int)$saved['size'],
            'duration' => $duration, 'ai' => $ai, 'aiDescription' => pv_clean($aiDescription, 500), 'order' => $order,
        ];
    };

    try {
        $media = [];
        foreach ($photos as $i => $file) $media[] = $save($file, 'PHOTO', $i);
        foreach ($videos as $i => $file) {
            $duration = isset($payload['videoDurations'][$i]) ? (float)$payload['videoDurations'][$i] : null;
            $media[] = $save($file, 'VIDEO', $i, $duration);
        }
        if ($voice) $media[] = $save($voice, 'AUDIO', 0, isset($payload['voiceDuration']) ? (float)$payload['voiceDuration'] : null);
        if ($illustration) $media[] = $save($illustration, 'AI_IMAGE', 0, null, true, (string)($payload['aiDescription'] ?? ''));

        db()->beginTransaction();
        $reference = 'PV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
        $stmt = db()->prepare('INSERT INTO public_voice_submissions
            (reference_number, category, province, district, ds_division, gn_division, village, specific_location, title, description, submitter_name, contact_number, email, preferred_contact_method, consent_publication, ip_hash, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, \'pending_review\', NOW(), NOW())');
        $stmt->execute([$reference, $category, $province, $district, $ds, $gn ?: null, $village, $location ?: null, $title, $description, $name, $phone, $email ?: null, $contactMethod, $ipHash]);
        $id = (int)db()->lastInsertId();
        $insert = db()->prepare('INSERT INTO public_voice_media (submission_id, media_type, original_filename, stored_filename, file_path, mime_type, file_size, duration_seconds, is_ai_generated, ai_description, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($media as $m) $insert->execute([$id, $m['type'], $m['original'], $m['stored'], $m['path'], $m['mime'], $m['size'], $m['duration'], $m['ai'] ? 1 : 0, $m['aiDescription'] ?: null, $m['order']]);
        db()->commit();
        ok(['id' => $id, 'referenceNumber' => $reference, 'status' => 'pending_review', 'submittedAt' => date('c')], 201);
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        foreach ($stored as $path) delete_upload($path);
        throw $e;
    }
}

function pv_files(string $key): array {
    if (!isset($_FILES[$key]) || !is_array($_FILES[$key]['name'] ?? null)) return [];
    $files = [];
    foreach ($_FILES[$key]['name'] as $i => $name) {
        if (($_FILES[$key]['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
        if ($_FILES[$key]['error'][$i] !== UPLOAD_ERR_OK) fail('One of the selected files failed to upload.', 422);
        $files[] = ['name'=>$name, 'type'=>$_FILES[$key]['type'][$i] ?? '', 'tmp_name'=>$_FILES[$key]['tmp_name'][$i], 'error'=>$_FILES[$key]['error'][$i], 'size'=>$_FILES[$key]['size'][$i]];
    }
    return $files;
}

function pv_single_file(string $key): ?array {
    if (!isset($_FILES[$key]) || ($_FILES[$key]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    if ($_FILES[$key]['error'] !== UPLOAD_ERR_OK) fail('A selected file failed to upload.', 422);
    return $_FILES[$key];
}

function pv_public_list(): void {
    $where = ["s.status = 'published'", 's.published_at IS NOT NULL', 's.consent_publication = 1'];
    $params = [];
    foreach (['category', 'province', 'district'] as $field) {
        if (!empty($_GET[$field])) { $where[] = "s.$field = ?"; $params[] = pv_clean($_GET[$field], 180); }
    }
    if (!empty($_GET['village'])) { $where[] = 's.village LIKE ?'; $params[] = '%' . pv_clean($_GET['village'], 180) . '%'; }
    if (!empty($_GET['q'])) { $where[] = '(COALESCE(s.public_title,s.title) LIKE ? OR s.village LIKE ? OR s.district LIKE ?)'; $q = '%' . pv_clean($_GET['q'], 120) . '%'; array_push($params, $q, $q, $q); }
    $page = max(1, (int)($_GET['page'] ?? 1)); $limit = min(30, max(1, (int)($_GET['limit'] ?? 12)));
    $sqlWhere = implode(' AND ', $where);
    $count = db()->prepare("SELECT COUNT(*) FROM public_voice_submissions s WHERE $sqlWhere"); $count->execute($params); $total = (int)$count->fetchColumn();
    $stmt = db()->prepare("SELECT s.id,s.reference_number,s.category,s.province,s.district,s.ds_division,s.village,COALESCE(s.public_title,s.title) title,COALESCE(s.public_description,s.description) description,s.created_at,s.published_at,s.public_response,
        (SELECT COUNT(*) FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='PHOTO' AND m.is_approved_for_publication=1) photo_count,
        EXISTS(SELECT 1 FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='VIDEO' AND m.is_approved_for_publication=1) has_video,
        EXISTS(SELECT 1 FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='AUDIO' AND m.is_approved_for_publication=1) has_audio
        FROM public_voice_submissions s WHERE $sqlWhere ORDER BY s.published_at DESC,s.id DESC LIMIT $limit OFFSET " . (($page-1)*$limit));
    $stmt->execute($params);
    $items = array_map(static function ($r) { $r['id']=(int)$r['id']; $r['photoCount']=(int)$r['photo_count']; $r['hasVideo']=(bool)$r['has_video']; $r['hasAudio']=(bool)$r['has_audio']; unset($r['photo_count'],$r['has_video'],$r['has_audio']); return $r; }, $stmt->fetchAll());
    ok(['items'=>$items,'total'=>$total,'page'=>$page,'limit'=>$limit,'pages'=>(int)ceil($total/$limit)]);
}

function pv_public_detail(int $id): void {
    if ($id < 1) fail('Not found', 404);
    $stmt = db()->prepare("SELECT id,reference_number,category,province,district,ds_division,gn_division,village,specific_location,COALESCE(public_title,title) title,COALESCE(public_description,description) description,public_response,published_at FROM public_voice_submissions WHERE id=? AND status='published' AND consent_publication=1 AND published_at IS NOT NULL");
    $stmt->execute([$id]); $row=$stmt->fetch(); if (!$row) fail('Not found', 404);
    $row['media'] = pv_media_rows($id, true);
    ok($row);
}

function pv_serve_media(): void {
    $id = max(0, (int)($_GET['id'] ?? 0));
    if (!$id) fail('Not found', 404);
    $admin = false; $user = current_user();
    if ($user && array_intersect($user['roles'] ?? [], ['Super Admin','Admin','Content Manager'])) $admin = true;
    $sql = 'SELECT m.*,s.status FROM public_voice_media m JOIN public_voice_submissions s ON s.id=m.submission_id WHERE m.id=?';
    $stmt = db()->prepare($sql); $stmt->execute([$id]); $media = $stmt->fetch();
    if (!$media || (!$admin && ($media['status'] !== 'published' || !$media['is_approved_for_publication'] || $media['media_type'] === 'AI_IMAGE'))) fail('Not found', 404);
    $root = realpath(dirname(__DIR__, 2) . '/uploads/public-voice/private');
    $path = realpath(dirname(__DIR__, 2) . '/' . $media['file_path']);
    if (!$path || !$root || !str_starts_with($path, $root) || !is_file($path)) fail('Not found', 404);
    header('Content-Type: ' . $media['mime_type']); header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($path)); header('Cache-Control: ' . ($admin ? 'private, no-store' : 'public, max-age=3600'));
    header('Content-Disposition: inline; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', $media['original_filename']) . '"');
    readfile($path); exit;
}

function pv_admin_list(): void {
    pv_admin_user();
    $where=['1=1']; $params=[];
    if (!empty($_GET['status']) && in_array($_GET['status'], PV_STATUSES, true)) { $where[]='s.status=?'; $params[]=$_GET['status']; }
    foreach (['category','province','district'] as $field) if (!empty($_GET[$field])) { $where[]="s.$field=?"; $params[]=pv_clean($_GET[$field], 180); }
    if (!empty($_GET['q'])) { $where[]='(s.reference_number LIKE ? OR s.title LIKE ? OR s.village LIKE ? OR s.district LIKE ?)'; $q='%'.pv_clean($_GET['q'],150).'%'; array_push($params,$q,$q,$q,$q); }
    $page=max(1,(int)($_GET['page']??1)); $limit=min(50,max(1,(int)($_GET['limit']??20))); $w=implode(' AND ',$where);
    $count=db()->prepare("SELECT COUNT(*) FROM public_voice_submissions s WHERE $w"); $count->execute($params); $total=(int)$count->fetchColumn();
    $stmt=db()->prepare("SELECT s.id,s.reference_number,s.title,s.category,s.province,s.district,s.village,s.status,s.created_at,
        (SELECT COUNT(*) FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='PHOTO') photo_count,
        (SELECT COUNT(*) FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='VIDEO') video_count,
        EXISTS(SELECT 1 FROM public_voice_media m WHERE m.submission_id=s.id AND m.media_type='AUDIO') has_audio
        FROM public_voice_submissions s WHERE $w ORDER BY s.created_at DESC,s.id DESC LIMIT $limit OFFSET ".(($page-1)*$limit));
    $stmt->execute($params); $items=array_map(static function($r){$r['id']=(int)$r['id'];$r['photoCount']=(int)$r['photo_count'];$r['videoCount']=(int)$r['video_count'];$r['hasAudio']=(bool)$r['has_audio'];unset($r['photo_count'],$r['video_count'],$r['has_audio']);return $r;},$stmt->fetchAll());
    $stats=[]; foreach(PV_STATUSES as $status) $stats[$status]=0;
    foreach(db()->query('SELECT status,COUNT(*) n FROM public_voice_submissions GROUP BY status')->fetchAll() as $r) $stats[$r['status']]=(int)$r['n'];
    $stats['total']=array_sum($stats); $stats['this_month']=(int)db()->query("SELECT COUNT(*) FROM public_voice_submissions WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')")->fetchColumn();
    ok(['items'=>$items,'stats'=>$stats,'total'=>$total,'page'=>$page,'limit'=>$limit,'pages'=>(int)ceil($total/$limit)]);
}

function pv_admin_detail(): void {
    pv_admin_user(); $id=max(0,(int)($_GET['id']??0)); if(!$id) fail('Not found',404);
    $stmt=db()->prepare('SELECT * FROM public_voice_submissions WHERE id=?');$stmt->execute([$id]);$row=$stmt->fetch();if(!$row)fail('Not found',404);
    $row['media']=pv_media_rows($id,false);
    $r=db()->prepare('SELECT action,previous_status,new_status,internal_note,public_response,created_at FROM public_voice_reviews WHERE submission_id=? ORDER BY created_at DESC,id DESC');$r->execute([$id]);$row['history']=$r->fetchAll();
    ok($row);
}

function pv_admin_review(): void {
    $user=pv_admin_user();$id=max(0,(int)($_GET['id']??0));$body=request_body();$next=(string)($body['status']??'');
    if(!$id||!in_array($next,PV_STATUSES,true))fail('Invalid review update.',422);
    $note=pv_clean($body['note']??'',3000);$response=pv_clean($body['publicResponse']??'',3000);
    if(in_array($next,['rejected','more_info_requested'],true)&&mb_strlen($note)<5)fail('Add a reason before requesting information or rejecting a submission.',422);
    db()->beginTransaction();$s=db()->prepare('SELECT status FROM public_voice_submissions WHERE id=? FOR UPDATE');$s->execute([$id]);$old=$s->fetchColumn();if(!$old){db()->rollBack();fail('Not found',404);}
    $allowed=[
      'pending_review'=>['under_review','approved','rejected','more_info_requested'],
      'under_review'=>['approved','rejected','more_info_requested'],
      'more_info_requested'=>['under_review','approved','rejected'],
      'approved'=>['published','rejected'], 'published'=>['approved'], 'rejected'=>['under_review'],
    ];
    if(!in_array($next,$allowed[$old]??[],true)){db()->rollBack();fail('This status transition is not allowed.',422);}
    $publishedAt=$next==='published'?'NOW()':'NULL';
    $u=db()->prepare("UPDATE public_voice_submissions SET status=?, public_response=COALESCE(NULLIF(?,''),public_response), published_at=$publishedAt, updated_at=NOW() WHERE id=?");$u->execute([$next,$response,$id]);
    $log=db()->prepare('INSERT INTO public_voice_reviews (submission_id,admin_id,action,previous_status,new_status,internal_note,public_response,created_at) VALUES (?,?,?,?,?,?,?,NOW())');$log->execute([$id,$user['id'],'status_change',$old,$next,$note?:null,$response?:null]);
    db()->commit();ok(['id'=>$id,'status'=>$next]);
}

function pv_admin_update_public(): void {
    $user=pv_admin_user();$id=max(0,(int)($_GET['id']??0));$body=request_body();
    $title=pv_clean($body['title']??'',120);$description=pv_clean($body['description']??'',3000);$response=pv_clean($body['publicResponse']??'',3000);
    if(!$id||mb_strlen($title)<4||mb_strlen($description)<30)fail('Add a public title and description before saving.',422);
    $u=db()->prepare("UPDATE public_voice_submissions SET public_title=?,public_description=?,public_response=?,updated_at=NOW() WHERE id=?");$u->execute([$title,$description,$response?:null,$id]);if(!$u->rowCount()){ $c=db()->prepare('SELECT id FROM public_voice_submissions WHERE id=?');$c->execute([$id]);if(!$c->fetchColumn())fail('Not found',404); }
    $log=db()->prepare("INSERT INTO public_voice_reviews (submission_id,admin_id,action,internal_note,public_response,created_at) VALUES (?,?, 'public_edit', ?, ?, NOW())");$log->execute([$id,$user['id'],pv_clean($body['note']??'',3000)?:null,$response?:null]);
    ok(['id'=>$id]);
}

function pv_admin_media_permissions(): void {
    $user=pv_admin_user();$id=max(0,(int)($_GET['id']??0));$body=request_body();$media=$body['media']??[];if(!$id||!is_array($media))fail('Invalid media selection.',422);
    db()->beginTransaction();$exists=db()->prepare('SELECT id FROM public_voice_submissions WHERE id=? FOR UPDATE');$exists->execute([$id]);if(!$exists->fetchColumn()){db()->rollBack();fail('Not found',404);}
    $update=db()->prepare('UPDATE public_voice_media SET is_approved_for_publication=? WHERE id=? AND submission_id=?');
    foreach($media as $item){$mid=(int)($item['id']??0);$update->execute([!empty($item['approved'])?1:0,$mid,$id]);}
    $log=db()->prepare("INSERT INTO public_voice_reviews (submission_id,admin_id,action,internal_note,created_at) VALUES (?,?, 'media_permissions', ?, NOW())");$log->execute([$id,$user['id'],'Updated public media selections']);db()->commit();ok(['id'=>$id]);
}
