<?php
/**
 * Request Handler
 */

namespace App\Core;

class Request {
    private array $data;
    private array $queryParams;
    private string $method;
    private string $path;

    public function __construct() {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->queryParams = $_GET ?? [];
        $this->parseBody();
    }

    private function parseBody(): void {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        $raw = file_get_contents('php://input');

        if (!empty($raw) && (stripos($contentType, 'application/json') !== false || str_starts_with(trim($raw), '{') || str_starts_with(trim($raw), '['))) {
            $decoded = json_decode($raw, true);
            $this->data = is_array($decoded) ? $decoded : [];
        } else {
            $this->data = $_POST ?? [];
        }
    }

    public function getMethod(): string {
        return $this->method;
    }

    public function get(string $key, $default = null) {
        return $this->data[$key] ?? $this->queryParams[$key] ?? $default;
    }

    public function all(): array {
        return array_merge($this->queryParams, $this->data);
    }

    public function query(string $key, $default = null) {
        return $this->queryParams[$key] ?? $default;
    }

    public function input(string $key, $default = null) {
        return $this->data[$key] ?? $default;
    }

    public function header(string $name, $default = null) {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        if (isset($_SERVER['REDIRECT_' . $key])) {
            return $_SERVER['REDIRECT_' . $key];
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, $name) === 0) {
                    return $v;
                }
            }
        }
        return $default;
    }

    public function bearerToken(): ?string {
        $header = $this->header('Authorization') ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
