<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$user = require_auth();
if (!array_intersect($user['roles'] ?? [], ['Super Admin', 'Admin', 'Content Manager'])) fail('Forbidden', 403);

try {
    $db = db();
    $today = date('Y-m-d');
    $now = date('H:i:s');
    $monthStart = date('Y-m-01');

    // Date range controls the analytic series; headline values remain all-time counts.
    $range = (string)($_GET['range'] ?? '6m');
    $validRanges = ['7d' => '-7 days', '30d' => '-30 days', '3m' => '-3 months', '6m' => '-6 months', 'year' => 'first day of January'];
    if (isset($_GET['from'], $_GET['to']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$_GET['from']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$_GET['to'])) {
        $rangeStart = $_GET['from'];
        $rangeEnd = $_GET['to'];
    } else {
        $rangeStart = $range === 'year' ? date('Y-01-01') : date('Y-m-d', strtotime($validRanges[$range] ?? '-6 months'));
        $rangeEnd = $today;
    }

    $lead = $db->query("SELECT COUNT(*) total,
        SUM(status='published') published,
        SUM(status='draft') draft,
        SUM(status='inactive') inactive
        FROM leadership WHERE deleted_at IS NULL")->fetch() ?: [];
    $leadByProvince = $db->query("SELECT COALESCE(NULLIF(province,''),'Unassigned') province, COUNT(*) count
        FROM leadership WHERE deleted_at IS NULL GROUP BY province ORDER BY count DESC")->fetchAll();
    $leadRecent = $db->query("SELECT l.id,l.province,l.district,l.status,l.created_at,
        (SELECT t.name FROM leadership_translations t WHERE t.leadership_id=l.id AND t.language_code='en' LIMIT 1) name
        FROM leadership l WHERE l.deleted_at IS NULL ORDER BY l.created_at DESC,l.id DESC LIMIT 6")->fetchAll();
    $leadByDistrict = $db->query("SELECT COALESCE(NULLIF(district,''),'Unassigned') district, COUNT(*) count
        FROM leadership WHERE deleted_at IS NULL GROUP BY district ORDER BY count DESC LIMIT 8")->fetchAll();

    // Applications are stored in party_members. Only committed, non-deleted applications count.
    $mem = $db->query("SELECT COUNT(*) total,
        SUM(status='verified') active,
        SUM(status IN ('pending','under_review')) pending,
        SUM(status IN ('rejected','suspended','expired')) inactive,
        SUM(created_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')) thisMonth
        FROM party_members WHERE deleted_at IS NULL AND application_ref IS NOT NULL")->fetch() ?: [];
    $memByProvince = $db->query("SELECT COALESCE(p.name,'Unassigned') province, COUNT(*) count
        FROM party_members m LEFT JOIN provinces p ON p.id=m.province_id
        WHERE m.deleted_at IS NULL AND m.application_ref IS NOT NULL
        GROUP BY p.id,p.name ORDER BY count DESC")->fetchAll();
    $memMonthlyStmt = $db->prepare("SELECT DATE_FORMAT(created_at,'%Y-%m') month,COUNT(*) count
        FROM party_members WHERE deleted_at IS NULL AND application_ref IS NOT NULL AND created_at BETWEEN ? AND CONCAT(?,' 23:59:59')
        GROUP BY month ORDER BY month");
    $memMonthlyStmt->execute([$rangeStart, $rangeEnd]);
    $memMonthly = $memMonthlyStmt->fetchAll();
    $memRecent = $db->query("SELECT m.id,m.membership_id,m.full_name,m.status,m.created_at,
        COALESCE(d.name,'—') district, COALESCE(p.name,'—') province
        FROM party_members m
        LEFT JOIN districts d ON d.id=m.district_id
        LEFT JOIN provinces p ON p.id=m.province_id
        WHERE m.deleted_at IS NULL AND m.application_ref IS NOT NULL
        ORDER BY m.created_at DESC,m.id DESC LIMIT 8")->fetchAll();

    // Event lifecycle is calculated from publication status, date and times in Asia/Colombo.
    $ev = $db->prepare("SELECT COUNT(*) total,
        SUM(status='published' AND event_status<>'cancelled' AND (event_date>? OR (event_date=? AND (start_time IS NULL OR start_time>?)))) upcoming,
        SUM(status='published' AND event_status<>'cancelled' AND event_date=? AND (start_time IS NULL OR start_time<=?) AND (end_time IS NULL OR end_time>=?)) ongoing,
        SUM(status='published' AND (event_status='completed' OR event_date<? OR (event_date=? AND end_time IS NOT NULL AND end_time<?))) completed,
        SUM(status IN ('draft','unpublished')) draft
        FROM events");
    $ev->execute([$today,$today,$now,$today,$now,$now,$today,$today,$now]);
    $events = $ev->fetch() ?: [];
    $evMonthlyStmt = $db->prepare("SELECT DATE_FORMAT(event_date,'%Y-%m') month,COUNT(*) count FROM events
        WHERE event_date BETWEEN ? AND ? GROUP BY month ORDER BY month");
    $evMonthlyStmt->execute([$rangeStart,$rangeEnd]);
    $evMonthly = $evMonthlyStmt->fetchAll();
    $evRecent = $db->query("SELECT e.id,e.event_date,e.start_time,e.venue,e.event_status,e.status publication_status,
        COALESCE((SELECT t.title FROM event_translations t WHERE t.event_id=e.id AND t.language_code='en' LIMIT 1),CONCAT('Event #',e.id)) title,
        (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status<>'cancelled') registrations
        FROM events e ORDER BY e.created_at DESC,e.id DESC LIMIT 8")->fetchAll();
    $eventsUpcoming = $db->query("SELECT e.id,e.image,e.event_date,e.start_time,e.end_time,e.venue,e.event_status,e.status publication_status,
        COALESCE((SELECT t.title FROM event_translations t WHERE t.event_id=e.id AND t.language_code='en' LIMIT 1),CONCAT('Event #',e.id)) title,
        (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.id AND r.status<>'cancelled') registrations
        FROM events e
        WHERE e.status='published' AND e.event_status<>'cancelled' AND (e.event_date>=CURDATE() OR (e.event_date=CURDATE() AND (e.end_time IS NULL OR e.end_time>=CURTIME())))
        ORDER BY e.event_date ASC,e.start_time ASC LIMIT 6")->fetchAll();

    $reg = $db->query("SELECT COUNT(*) total,
        SUM(status IN ('registered','checked_in')) confirmed,
        SUM(status='pending') pending,
        SUM(status='checked_in') checkedIn,
        SUM(status='cancelled') cancelled,
        SUM(created_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')) thisMonth
        FROM event_registrations")->fetch() ?: [];
    $regMonthlyStmt = $db->prepare("SELECT DATE_FORMAT(created_at,'%Y-%m') month,COUNT(*) count FROM event_registrations
        WHERE created_at BETWEEN ? AND CONCAT(?,' 23:59:59') GROUP BY month ORDER BY month");
    $regMonthlyStmt->execute([$rangeStart,$rangeEnd]);
    $regMonthly = $regMonthlyStmt->fetchAll();
    $regByEvent = $db->query("SELECT e.id eventId,
        COALESCE((SELECT t.title FROM event_translations t WHERE t.event_id=e.id AND t.language_code='en' LIMIT 1),CONCAT('Event #',e.id)) title,
        e.event_date,e.venue,
        COUNT(r.id) total,
        COALESCE(SUM(r.status IN ('registered','checked_in')),0) confirmed,
        COALESCE(SUM(r.status='pending'),0) pending,
        COALESCE(SUM(r.status='cancelled'),0) cancelled
        FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id
        GROUP BY e.id ORDER BY total DESC,e.event_date DESC LIMIT 30")->fetchAll();

    $activity = [];
    foreach ($db->query("SELECT l.id,l.action,l.entity,l.entity_id,l.created_at,u.name actor
        FROM activity_logs l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC,l.id DESC LIMIT 12")->fetchAll() as $r) {
        $activity[] = ['id'=>'audit-'.$r['id'],'type'=>$r['entity'] ?: 'admin','action'=>$r['action'],'entityId'=>(int)($r['entity_id'] ?? 0),'actor'=>$r['actor'] ?: 'System','at'=>$r['created_at']];
    }
    foreach ($db->query("SELECT id,'event_registration' type,action_type action,registration_id entity_id,attendee_name actor,created_at at
        FROM activity_history ORDER BY created_at DESC,id DESC LIMIT 12")->fetchAll() as $r) {
        $activity[] = ['id'=>'registration-'.$r['id'],'type'=>$r['type'],'action'=>$r['action'],'entityId'=>(int)($r['entity_id'] ?? 0),'actor'=>$r['actor'] ?: 'Participant','at'=>$r['at']];
    }
    usort($activity, fn($a,$b) => strcmp($b['at'],$a['at']));
    $activity = array_slice($activity,0,15);

    ok([
        'generatedAt'=>date('c'),
        'range'=>['from'=>$rangeStart,'to'=>$rangeEnd,'key'=>$range],
        'leadership'=>array_map('intval',$lead) + ['byProvince'=>$leadByProvince,'byDistrict'=>$leadByDistrict,'recent'=>$leadRecent],
        'members'=>array_map('intval',$mem) + ['byProvince'=>$memByProvince,'monthly'=>$memMonthly,'recent'=>$memRecent],
        'events'=>array_map('intval',$events) + ['monthly'=>$evMonthly,'recent'=>$evRecent,'upcomingList'=>$eventsUpcoming],
        'registrations'=>array_map('intval',$reg) + ['monthly'=>$regMonthly,'byEvent'=>$regByEvent],
        'activity'=>$activity,
    ]);
} catch (Throwable $e) {
    error_log('dashboard api: '.$e->getMessage());
    fail('Unable to load dashboard statistics.',500);
}
