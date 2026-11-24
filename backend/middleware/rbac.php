<?php
require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../helpers/validator.php';
require_once __DIR__ . '/../helpers/log.php';

$user = require_auth();
$body = request_body();

// Placeholder until Phase 6+: verify the requested action against
// role_permissions for the user's roles, then allow/deny.
fail('Not implemented', 501);
