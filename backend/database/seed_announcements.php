<?php
// Seed sample announcements (maps legacy column names -> current schema).
require_once dirname(__DIR__) . '/config/database.php';

$CAT = 1; // official-announcements
$rows = [
    [
        'cover_image' => 'uploads/announcements/committee-meeting.jpg',
        'image_alt' => 'மத்திய நிர்வாகக் குழுக் கூட்டம்',
        'published_at' => '2026-11-18',
        'event_date' => '2026-11-25',
        'notice_date' => '2026-11-18',
        'expires_at' => '2026-11-26',
        'status' => 'published',
        'is_breaking' => 1, 'show_on_homepage' => 1, 'is_important' => 1, 'is_featured' => 1, 'allow_social_sharing' => 1,
        'reference_number' => 'OA-2026-001',
        'announcement_code' => 'RISE-OA-001',
        'announcement_type' => 'Party',
        'pdf_path' => 'uploads/announcements/Meeting_Announcement.pdf',
        'en' => [
            'title' => 'Official Announcement Regarding the Central Executive Committee Meeting',
            'short_description' => 'The Central Executive Committee meeting will be held on 25 November 2026. All committee members are requested to attend.',
            'content' => '<p>The Central Executive Committee meeting will be held on 25 November 2026. All committee members are requested to attend.</p><p>Future activities of the party, administrative decisions and organisational developments will be discussed at this meeting.</p>',
            'image_caption' => 'Central Executive Committee Meeting – 2026',
        ],
        'ta' => [
            'title' => 'மத்திய நிர்வாகக் குழுக் கூட்டம் – அதிகாரப்பூர்வ அறிவிப்பு',
            'short_description' => 'கட்சியின் மத்திய நிர்வாகக் குழுக் கூட்டம் 2026 நவம்பர் 25 ஆம் திகதி நடைபெறவுள்ளது.',
            'content' => '<p>கட்சியின் மத்திய நிர்வாகக் குழுக் கூட்டம் 2026 நவம்பர் 25 ஆம் திகதி நடைபெறவுள்ளது.</p><p>கட்சியின் எதிர்கால செயற்பாடுகள், நிர்வாகத் தீர்மானங்கள் மற்றும் அமைப்பு ரீதியான முன்னேற்றங்கள் தொடர்பாக இக்கூட்டத்தில் கலந்துரையாடப்படவுள்ளது.</p><p>அனைத்து மத்திய நிர்வாகக் குழு உறுப்பினர்களும் உரிய நேரத்தில் கலந்துகொள்ளுமாறு கேட்டுக்கொள்ளப்படுகிறார்கள்.</p>',
            'image_caption' => 'Central Executive Committee Meeting – 2026',
        ],
    ],
    [
        'cover_image' => 'uploads/announcements/public-meeting.jpg',
        'image_alt' => 'யாழ்ப்பாணம் பொதுமக்கள் சந்திப்பு',
        'published_at' => '2026-11-18',
        'event_date' => '2026-11-25',
        'notice_date' => '2026-11-18',
        'expires_at' => '2026-11-25',
        'status' => 'published',
        'is_breaking' => 0, 'show_on_homepage' => 1, 'is_important' => 1, 'is_featured' => 0, 'allow_social_sharing' => 1,
        'reference_number' => 'OA-2026-002',
        'announcement_code' => 'RISE-OA-002',
        'announcement_type' => 'Party',
        'pdf_path' => 'uploads/announcements/Public_Meeting_Notice.pdf',
        'en' => [
            'title' => 'Public Consultation Meeting – Jaffna',
            'short_description' => 'A public consultation meeting will be organized to hear the views, concerns and suggestions of local residents.',
            'content' => '<p>A public consultation meeting will be organized to hear the views, concerns and suggestions of local residents.</p><p><strong>Venue:</strong> Jaffna &nbsp; <strong>District:</strong> Jaffna &nbsp; <strong>Date:</strong> 25 November 2026 &nbsp; <strong>Time:</strong> 10.00 AM</p><p>All local residents are invited to participate.</p>',
            'image_caption' => 'Public Consultation Meeting – Jaffna',
        ],
        'ta' => [
            'title' => 'பொதுமக்கள் ஆலோசனை கூட்டம் – யாழ்ப்பாணம்',
            'short_description' => 'பொதுமக்களின் கருத்துக்கள், கோரிக்கைகள் மற்றும் பிரச்சினைகளை நேரடியாகக் கேட்டறியும் நோக்கில் மக்கள் சந்திப்பு நிகழ்வு ஏற்பாடு செய்யப்பட்டுள்ளது.',
            'content' => '<p>பொதுமக்களின் கருத்துக்கள், கோரிக்கைகள் மற்றும் பிரச்சினைகளை நேரடியாகக் கேட்டறியும் நோக்கில் மக்கள் சந்திப்பு நிகழ்வு ஏற்பாடு செய்யப்பட்டுள்ளது.</p><p><strong>இடம்:</strong> யாழ்ப்பாணம் &nbsp; <strong>மாவட்டம்:</strong> யாழ்ப்பாணம் &nbsp; <strong>திகதி:</strong> 25 நவம்பர் 2026 &nbsp; <strong>நேரம்:</strong> காலை 10.00 மணி</p><p>பிரதேச மக்கள் அனைவரும் இச்சந்திப்பில் கலந்துகொள்ளுமாறு அழைக்கப்படுகிறார்கள்.</p>',
            'image_caption' => 'Public Consultation Meeting – Jaffna',
        ],
    ],
    [
        'cover_image' => 'uploads/announcements/development-programme.jpg',
        'image_alt' => 'சமூக அபிவிருத்தி திட்டங்கள்',
        'published_at' => '2026-11-18',
        'notice_date' => '2026-11-18',
        'status' => 'published',
        'is_breaking' => 0, 'show_on_homepage' => 1, 'is_important' => 1, 'is_featured' => 1, 'allow_social_sharing' => 1,
        'reference_number' => 'OA-2026-003',
        'announcement_code' => 'RISE-OA-003',
        'announcement_type' => 'Party',
        'pdf_path' => 'uploads/announcements/Development_Official_Report.pdf',
        'en' => [
            'title' => 'Official Statement on Community Development Initiatives',
            'short_description' => 'An official statement outlining proposed initiatives focused on education, community development and regional needs.',
            'content' => '<p>An official statement outlining proposed initiatives focused on education, community development and regional needs.</p><p>The objectives, operational priorities and future steps of these initiatives will be announced in due course.</p>',
            'image_caption' => 'Community Development Initiatives – Official Statement',
        ],
        'ta' => [
            'title' => 'சமூக அபிவிருத்தி திட்டங்கள் – அதிகாரப்பூர்வ அறிக்கை',
            'short_description' => 'கல்வி மேம்பாடு மற்றும் பிரதேச மக்களின் அடிப்படைத் தேவைகளை முன்னிறுத்தி பல்வேறு திட்டங்களை முன்னெடுப்பது தொடர்பான உத்தியோகபூர்வ தகவல்கள்.',
            'content' => '<p>சமூக அபிவிருத்தி, கல்வி மேம்பாடு மற்றும் பிரதேச மக்களின் அடிப்படைத் தேவைகளை முன்னிறுத்தி பல்வேறு திட்டங்களை முன்னெடுப்பது தொடர்பான உத்தியோகபூர்வ தகவல்கள் இவ்வறிக்கையின் மூலம் பொதுமக்களுக்கு அறிவிக்கப்படுகின்றன.</p><p>இத்திட்டங்களின் நோக்கங்கள், செயற்பாட்டு முன்னுரிமைகள் மற்றும் எதிர்கால நடவடிக்கைகள் தொடர்பான மேலதிக விபரங்கள் உரிய நேரத்தில் அறிவிக்கப்படும்.</p>',
            'image_caption' => 'Community Development Initiatives – Official Statement',
        ],
    ],
];

$db = db();
$insA = $db->prepare(
    'INSERT INTO announcements
     (category_id, cover_image, image_alt, published_at, event_date, notice_date, expires_at,
      status, is_breaking, show_on_homepage, is_important, is_featured, allow_social_sharing,
      reference_number, announcement_code, announcement_type, pdf_path, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)'
);
$insT = $db->prepare(
    'INSERT INTO announcement_translations (announcement_id, language_code, title, short_description, content, image_caption)
     VALUES (?,?,?,?,?,?)'
);

$done = 0;
foreach ($rows as $r) {
    // skip if announcement_code already exists
    $chk = $db->prepare('SELECT id FROM announcements WHERE announcement_code = ? AND deleted_at IS NULL');
    $chk->execute([$r['announcement_code']]);
    if ($chk->fetch()) { echo "skip {$r['announcement_code']} (exists)\n"; continue; }

    $insA->execute([
        $CAT, $r['cover_image'], $r['image_alt'], $r['published_at'], $r['event_date'] ?? null,
        $r['notice_date'] ?? null, $r['expires_at'] ?? null,
        $r['status'], $r['is_breaking'], $r['show_on_homepage'], $r['is_important'], $r['is_featured'],
        $r['allow_social_sharing'], $r['reference_number'], $r['announcement_code'], $r['announcement_type'],
        $r['pdf_path'],
    ]);
    $id = (int)$db->lastInsertId();
    foreach (['en', 'ta'] as $lang) {
        $t = $r[$lang];
        $insT->execute([$id, $lang, $t['title'], $t['short_description'], $t['content'], $t['image_caption']]);
    }
    echo "inserted {$r['announcement_code']} -> id $id\n";
    $done++;
}
echo "done: $done inserted\n";
