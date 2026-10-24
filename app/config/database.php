<?php
/**
 * Database Configuration
 * Auto-detects environment variables (.env file, server env, or local overrides).
 */

// Simple lightweight .env reader for server deployment
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $val] = explode('=', $line, 2);
        $key = trim($key);
        $val = trim($val, " \t\n\r\0\x0B\"'");
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $val;
            putenv("$key=$val");
        }
    }
}

// Local override config file if present (e.g. database.local.php)
$localConfig = __DIR__ . '/database.local.php';
if (file_exists($localConfig)) {
    return require $localConfig;
}

$host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? '127.0.0.1');
$port = (int)(getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 3306));
$db   = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? (getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'dms_db')));
$user = getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? (getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root')));
$pass = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : ($_ENV['DB_PASSWORD'] ?? (getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? '')));

return [
    'host'     => $host,
    'port'     => $port,
    'database' => $db,
    'username' => $user,
    'password' => $pass,
    'charset'  => 'utf8mb4',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]
];
