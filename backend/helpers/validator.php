<?php
function v_required(array $data, array $fields): array {
    $errors = [];
    foreach ($fields as $f) {
        if (!isset($data[$f]) || trim((string)$data[$f]) === '') $errors[$f] = "$f is required";
    }
    return $errors;
}

function v_email(?string $email): bool {
    return $email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function v_string($val, int $max = 1000): bool {
    return is_string($val) && mb_strlen($val) <= $max;
}

function v_int($val): bool {
    return filter_var($val, FILTER_VALIDATE_INT) !== false;
}

function v_in($val, array $allowed): bool {
    return in_array($val, $allowed, true);
}

function v_date($val): bool {
    return is_string($val) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $val) && strtotime($val) !== false;
}

function v_url($val): bool {
    return $val === '' || $val === null || filter_var($val, FILTER_VALIDATE_URL) !== false;
}
