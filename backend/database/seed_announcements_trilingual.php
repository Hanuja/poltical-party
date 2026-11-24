<?php
// Seed 3 trilingual sample Official Announcements (en/ta/si).
require_once dirname(__DIR__) . '/config/database.php';

$CAT = 1; // official-announcements
$rows = [
    [
        'announcement_type' => 'Government',
        'is_breaking' => 1, 'show_on_homepage' => 1, 'is_important' => 1, 'is_featured' => 0,
        'published_at' => '2026-11-18',
        'en' => [
            'title' => 'New Government Policy Announcement',
            'short_description' => 'The government has announced new policy measures to improve public services and strengthen development.',
            'content' => '<p>The government has officially announced a series of new policy measures aimed at improving public services, strengthening institutional transparency and supporting sustainable national development. Relevant authorities will provide further information regarding implementation and public access to these services.</p>',
        ],
        'ta' => [
            'title' => 'புதிய அரசாங்க கொள்கை அறிவிப்பு',
            'short_description' => 'பொதுச் சேவைகளை மேம்படுத்தவும் அபிவிருத்தியை வலுப்படுத்தவும் புதிய கொள்கை நடவடிக்கைகளை அரசாங்கம் அறிவித்துள்ளது.',
            'content' => '<p>பொதுச் சேவைகளை மேம்படுத்துதல், நிறுவனங்களின் வெளிப்படைத்தன்மையை வலுப்படுத்துதல் மற்றும் நிலையான தேசிய அபிவிருத்தியை ஆதரித்தல் ஆகிய நோக்கங்களுடன் புதிய கொள்கை நடவடிக்கைகளை அரசாங்கம் உத்தியோகபூர்வமாக அறிவித்துள்ளது. இத்திட்டங்களை நடைமுறைப்படுத்துவது மற்றும் பொதுமக்கள் சேவைகளைப் பெற்றுக்கொள்வது தொடர்பான மேலதிக தகவல்களை சம்பந்தப்பட்ட அதிகாரிகள் வெளியிடுவார்கள்.</p>',
        ],
        'si' => [
            'title' => 'නව රජයේ ප්‍රතිපත්ති නිවේදනය',
            'short_description' => 'රාජ්‍ය සේවාවන් වැඩිදියුණු කිරීම සහ සංවර්ධනය ශක්තිමත් කිරීම සඳහා නව ප්‍රතිපත්ති ක්‍රියාමාර්ග රජය විසින් ප්‍රකාශයට පත් කර ඇත.',
            'content' => '<p>රාජ්‍ය සේවාවන් වැඩිදියුණු කිරීම, ආයතනික විනිවිදභාවය ශක්තිමත් කිරීම සහ තිරසාර ජාතික සංවර්ධනයට සහාය වීම අරමුණු කරගත් නව ප්‍රතිපත්ති ක්‍රියාමාර්ග මාලාවක් රජය විසින් නිල වශයෙන් ප්‍රකාශයට පත් කර ඇත. මෙම ක්‍රියාමාර්ග ක්‍රියාත්මක කිරීම සහ මහජනතාවට සේවාවන් ලබාගැනීම පිළිබඳ වැඩිදුර තොරතුරු අදාළ බලධාරීන් විසින් නිකුත් කරනු ඇත.</p>',
        ],
    ],
    [
        'announcement_type' => 'General',
        'is_breaking' => 0, 'show_on_homepage' => 1, 'is_important' => 0, 'is_featured' => 0,
        'published_at' => '2026-11-17',
        'en' => [
            'title' => 'Announcement on Public Rights and Welfare',
            'short_description' => 'An official announcement regarding public rights, welfare services and access to essential information.',
            'content' => '<p>All citizens are encouraged to stay informed about their rights and available welfare services. Official information and guidance will be provided through the relevant public institutions. Citizens can contact the appropriate authorities for clarification and assistance.</p>',
        ],
        'ta' => [
            'title' => 'மக்கள் உரிமைகள் மற்றும் நலன்புரி தொடர்பான அறிவிப்பு',
            'short_description' => 'மக்களின் உரிமைகள், நலன்புரிச் சேவைகள் மற்றும் அத்தியாவசிய தகவல்களைப் பெற்றுக்கொள்வது தொடர்பான உத்தியோகபூர்வ அறிவிப்பு.',
            'content' => '<p>அனைத்து மக்களும் தங்களது உரிமைகள் மற்றும் கிடைக்கக்கூடிய நலன்புரிச் சேவைகள் தொடர்பான தகவல்களை அறிந்துகொள்ளுமாறு கேட்டுக்கொள்ளப்படுகின்றனர். உத்தியோகபூர்வ தகவல்கள் மற்றும் வழிகாட்டல்கள் சம்பந்தப்பட்ட பொது நிறுவனங்கள் மூலம் வழங்கப்படும். மேலதிக விளக்கங்கள் மற்றும் உதவிகளுக்கு உரிய அதிகாரிகளைத் தொடர்புகொள்ளலாம்.</p>',
        ],
        'si' => [
            'title' => 'මහජන අයිතිවාසිකම් සහ සුබසාධනය පිළිබඳ නිවේදනය',
            'short_description' => 'මහජන අයිතිවාසිකම්, සුබසාධන සේවා සහ අත්‍යවශ්‍ය තොරතුරු ලබාගැනීම පිළිබඳ නිල නිවේදනයකි.',
            'content' => '<p>සියලුම පුරවැසියන් තම අයිතිවාසිකම් සහ ලබාගත හැකි සුබසාධන සේවා පිළිබඳව දැනුවත්ව සිටින ලෙස දිරිමත් කරනු ලැබේ. නිල තොරතුරු සහ මාර්ගෝපදේශ අදාළ රාජ්‍ය ආයතන හරහා ලබා දෙනු ඇත. වැඩිදුර පැහැදිලි කිරීම් සහ සහාය සඳහා අදාළ බලධාරීන් සම්බන්ධ කරගත හැකිය.</p>',
        ],
    ],
    [
        'announcement_type' => 'Party',
        'is_breaking' => 0, 'show_on_homepage' => 1, 'is_important' => 0, 'is_featured' => 0,
        'published_at' => '2026-11-16',
        'en' => [
            'title' => 'Official Statement on Regional Development',
            'short_description' => 'The party has issued an official statement outlining its position on regional development and community priorities.',
            'content' => '<p>The party has issued this official statement highlighting the importance of regional development, education, healthcare, infrastructure and equal opportunities. The party emphasizes the need for transparent planning, public participation and responsible implementation of development initiatives.</p>',
        ],
        'ta' => [
            'title' => 'பிராந்திய அபிவிருத்தி தொடர்பான உத்தியோகபூர்வ அறிக்கை',
            'short_description' => 'பிராந்திய அபிவிருத்தி மற்றும் மக்களின் முன்னுரிமைகள் தொடர்பான கட்சியின் நிலைப்பாட்டை விளக்கும் உத்தியோகபூர்வ அறிக்கை வெளியிடப்பட்டுள்ளது.',
            'content' => '<p>பிராந்திய அபிவிருத்தி, கல்வி, சுகாதாரம், உட்கட்டமைப்பு மற்றும் சமமான வாய்ப்புகள் ஆகியவற்றின் முக்கியத்துவத்தை வலியுறுத்தி கட்சி இந்த உத்தியோகபூர்வ அறிக்கையை வெளியிட்டுள்ளது. வெளிப்படையான திட்டமிடல், மக்கள் பங்கேற்பு மற்றும் அபிவிருத்தித் திட்டங்களைப் பொறுப்புடன் நடைமுறைப்படுத்துதல் ஆகியவற்றின் அவசியத்தையும் கட்சி வலியுறுத்துகிறது.</p>',
        ],
        'si' => [
            'title' => 'ප්‍රාදේශීය සංවර්ධනය පිළිබඳ නිල ප්‍රකාශය',
            'short_description' => 'ප්‍රාදේශීය සංවර්ධනය සහ ප්‍රජා ප්‍රමුඛතා පිළිබඳ පක්ෂයේ ස්ථාවරය පැහැදිලි කරන නිල ප්‍රකාශයක් නිකුත් කර ඇත.',
            'content' => '<p>ප්‍රාදේශීය සංවර්ධනය, අධ්‍යාපනය, සෞඛ්‍යය, යටිතල පහසුකම් සහ සමාන අවස්ථා වල වැදගත්කම අවධාරණය කරමින් පක්ෂය මෙම නිල ප්‍රකාශය නිකුත් කර ඇත. විනිවිද පෙනෙන සැලසුම්කරණය, මහජන සහභාගීත්වය සහ සංවර්ධන වැඩසටහන් වගකීමෙන් ක්‍රියාත්මක කිරීමේ අවශ්‍යතාවය ද පක්ෂය අවධාරණය කරයි.</p>',
        ],
    ],
];

$db = db();
$insA = $db->prepare(
    'INSERT INTO announcements
     (category_id, announcement_type, status, is_breaking, show_on_homepage, is_important, is_featured,
      allow_social_sharing, published_at, created_by)
     VALUES (?,?,?, ?,?,?,?,?,?,1)'
);
$insT = $db->prepare(
    'INSERT INTO announcement_translations (announcement_id, language_code, title, short_description, content, image_caption)
     VALUES (?,?,?,?,?,NULL)'
);

$done = 0;
foreach ($rows as $r) {
    // dedupe by EN title
    $chk = $db->prepare(
        'SELECT a.id FROM announcements a
         JOIN announcement_translations t ON t.announcement_id = a.id AND t.language_code = "en"
         WHERE t.title = ? AND a.deleted_at IS NULL'
    );
    $chk->execute([$r['en']['title']]);
    if ($chk->fetch()) { echo "skip {$r['en']['title']} (exists)\n"; continue; }

    $insA->execute([
        $CAT, $r['announcement_type'], 'published', $r['is_breaking'], $r['show_on_homepage'],
        $r['is_important'], $r['is_featured'], 1, $r['published_at'],
    ]);
    $id = (int)$db->lastInsertId();
    foreach (['en', 'ta', 'si'] as $lang) {
        $t = $r[$lang];
        $insT->execute([$id, $lang, $t['title'], $t['short_description'], $t['content']]);
    }
    echo "inserted id $id — {$r['en']['title']}\n";
    $done++;
}
echo "done: $done inserted\n";
