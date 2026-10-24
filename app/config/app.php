<?php
/**
 * Application Configuration
 */

$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
if (str_ends_with($scriptDir, '/api')) {
    $scriptDir = substr($scriptDir, 0, -4);
}

return [
    'name'        => 'DMS Enterprise',
    'version'     => '2.0.0',
    'env'         => $_ENV['APP_ENV'] ?? 'development',
    'base_url'    => $scriptDir ?: '/',
    'api_prefix'  => ($scriptDir ?: '') . '/api',
    'session_key' => 'dms_user_session',
    'currency'    => 'Rs.',
    'timezone'    => 'Asia/Karachi',
];
