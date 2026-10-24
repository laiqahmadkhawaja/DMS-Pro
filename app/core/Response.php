<?php
/**
 * Response Handler
 */

namespace App\Core;

class Response {
    public static function json($data, int $statusCode = 200, string $message = ''): void {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($statusCode);
        
        $payload = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'status'  => $statusCode,
            'message' => $message,
            'data'    => $data
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $statusCode = 400, $errors = null): void {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($statusCode);

        $payload = [
            'success' => false,
            'status'  => $statusCode,
            'message' => $message,
            'errors'  => $errors
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
