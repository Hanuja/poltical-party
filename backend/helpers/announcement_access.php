<?php
// Who may read which announcements.
//
// "Party" announcements (announcements.announcement_type = 'Party') are internal. They are returned
// only to:
//   - staff: users holding an admin role (roles table: Super Admin, Admin, Editor, Content Manager);
//   - verified party members: a users row linked from party_members.user_id with status 'verified',
//     not deleted and not expired — and, when the announcement has rows in announcement_targets,
//     only if the member's province / district / branch is targeted (or the target is all_members).
//     A Party announcement with no targets is visible to every verified member.
// Everyone else gets responses in which Party announcements do not exist at all: they are excluded
// in SQL from lists, searches, counts, related lists, single reads and attachment downloads.
//
// The viewer is resolved from the existing JWT (Authorization: Bearer … or the pp_token cookie) by
// current_user() in api/bootstrap.php.

const ANN_STAFF_ROLES = ['Super Admin', 'Admin', 'Editor', 'Content Manager'];
const ANN_RESTRICTED_TYPE = 'Party';

function ann_viewer(): array {
    static $viewer = null;
    if ($viewer !== null) return $viewer;
    $viewer = ['user' => null, 'staff' => false, 'member' => null];

    $user = current_user();
    if (!$user) return $viewer;
    $viewer['user'] = $user;
    if (array_intersect($user['roles'] ?? [], ANN_STAFF_ROLES)) {
        $viewer['staff'] = true;
        return $viewer;
    }
    try {
        $s = db()->prepare(
            "SELECT id, province_id, district_id, branch_id FROM party_members
             WHERE user_id = ? AND status = 'verified' AND deleted_at IS NULL
               AND (expires_at IS NULL OR expires_at >= CURDATE())
             ORDER BY verified_at DESC, id DESC LIMIT 1"
        );
        $s->execute([$user['id']]);
        $m = $s->fetch();
        if ($m) $viewer['member'] = array_map('intval', $m);
    } catch (Throwable $e) {
        // Membership tables missing → treat as a non-member.
    }
    return $viewer;
}

function ann_can_view_party(array $viewer): bool {
    return $viewer['staff'] || $viewer['member'] !== null;
}

// SQL predicate (for table alias $a) limiting rows to what $viewer may read. Appends its bind values to $params.
function ann_access_sql(array $viewer, array &$params, string $a = 'a'): string {
    if ($viewer['staff']) return '1=1';
    $notParty = "($a.announcement_type IS NULL OR $a.announcement_type <> '" . ANN_RESTRICTED_TYPE . "')";
    $m = $viewer['member'];
    if (!$m) return $notParty;

    $params[] = $m['province_id'];
    $params[] = $m['district_id'];
    $params[] = $m['branch_id'] ?: 0;
    return "($notParty
        OR NOT EXISTS (SELECT 1 FROM announcement_targets t0 WHERE t0.announcement_id = $a.id)
        OR EXISTS (
            SELECT 1 FROM announcement_targets t WHERE t.announcement_id = $a.id AND (
                t.target_type = 'all_members'
                OR (t.target_type = 'province' AND t.province_id = ?)
                OR (t.target_type = 'districts' AND EXISTS (
                    SELECT 1 FROM announcement_target_districts td WHERE td.target_id = t.id AND td.district_id = ?))
                OR (t.target_type = 'branches' AND EXISTS (
                    SELECT 1 FROM announcement_target_branches tb WHERE tb.target_id = t.id AND tb.branch_id = ?))
            )
        ))";
}

// Responses differ per viewer: never let a shared cache hand one viewer's list to another.
function ann_private_cache_headers(): void {
    header('Cache-Control: private, no-store');
    header('Vary: Authorization, Cookie');
}
