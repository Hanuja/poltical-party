<?php
// Minimal SMTP sender (no Composer dependency). Configure in backend/.env:
//   MAIL_HOST=smtp.example.org
//   MAIL_PORT=587                 (587 = STARTTLS, 465 = implicit SSL, 25 = plain)
//   MAIL_ENCRYPTION=tls           (tls | ssl | none)
//   MAIL_USERNAME=...             (optional; AUTH LOGIN when set)
//   MAIL_PASSWORD=...
//   MAIL_FROM=membership@example.org
//   MAIL_FROM_NAME="Thayaga Makkal Kazhagam (TMK)"
// Without MAIL_HOST + MAIL_FROM, mail_send() returns status 'not_configured' and sends nothing.
require_once __DIR__ . '/../config/env.php';

function mail_configured(): bool {
    return trim((string)env('MAIL_HOST', '')) !== '' && filter_var(env('MAIL_FROM', ''), FILTER_VALIDATE_EMAIL);
}

function mail_config_summary(): array {
    return [
        'configured' => (bool)mail_configured(),
        'host'       => (string)env('MAIL_HOST', ''),
        'port'       => (int)env('MAIL_PORT', 587),
        'encryption' => (string)env('MAIL_ENCRYPTION', 'tls'),
        'from'       => (string)env('MAIL_FROM', ''),
    ];
}

/** @return array{status:string,error:?string} status: sent | failed | not_configured */
function mail_send(string $to, string $subject, string $html, string $text): array {
    if (!mail_configured()) return ['status' => 'not_configured', 'error' => 'No mail transport configured (MAIL_HOST / MAIL_FROM in backend/.env)'];
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return ['status' => 'failed', 'error' => 'Invalid recipient'];

    $host = env('MAIL_HOST');
    $port = (int)env('MAIL_PORT', 587);
    $enc  = strtolower((string)env('MAIL_ENCRYPTION', 'tls'));
    $user = (string)env('MAIL_USERNAME', '');
    $pass = (string)env('MAIL_PASSWORD', '');
    $from = (string)env('MAIL_FROM');
    $fromName = (string)env('MAIL_FROM_NAME', '');

    $remote = ($enc === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true]]);
    $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) return ['status' => 'failed', 'error' => "Connect failed: $errstr ($errno)"];
    stream_set_timeout($fp, 20);

    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $data;
    };
    $cmd = function (string $c, array $okCodes) use ($fp, $read): string {
        fwrite($fp, $c . "\r\n");
        $r = $read();
        if (!in_array((int)substr($r, 0, 3), $okCodes, true)) {
            throw new RuntimeException(trim(preg_replace('/\s+/', ' ', $r)) ?: 'No response');
        }
        return $r;
    };

    try {
        $greet = $read();
        if ((int)substr($greet, 0, 3) !== 220) throw new RuntimeException('Bad greeting: ' . trim($greet));
        $ehloHost = preg_replace('/[^a-z0-9.\-]/i', '', parse_url((string)env('SITE_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost');
        $cmd("EHLO $ehloHost", [250]);
        if ($enc === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            $cmd("EHLO $ehloHost", [250]);
        }
        if ($user !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode($user), [334]);
            $cmd(base64_encode($pass), [235]);
        }
        $cmd('MAIL FROM:<' . $from . '>', [250]);
        $cmd('RCPT TO:<' . $to . '>', [250, 251]);
        $cmd('DATA', [354]);

        $enc64 = fn($s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
        $boundary = 'b_' . bin2hex(random_bytes(12));
        $domain = substr(strrchr($from, '@'), 1);
        $headers = [
            'Date: ' . date('r'),
            'From: ' . ($fromName !== '' ? $enc64($fromName) . ' ' : '') . '<' . $from . '>',
            'To: <' . $to . '>',
            'Subject: ' . $enc64($subject),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
            'MIME-Version: 1.0',
            'Auto-Submitted: auto-generated',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];
        $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($text))
            . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($html))
            . "--$boundary--\r\n";
        // base64 lines never start with '.', so no dot-stuffing is needed.
        $cmd(implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.", [250]);
        @fwrite($fp, "QUIT\r\n");
        fclose($fp);
        return ['status' => 'sent', 'error' => null];
    } catch (Throwable $e) {
        @fclose($fp);
        return ['status' => 'failed', 'error' => mb_substr($e->getMessage(), 0, 480)];
    }
}
