<?php
/**
 * RESTful API Router with Dynamic Path Matching & Middleware
 */

namespace App\Core;

class Router {
    private array $routes = [];

    public function get(string $path, array|callable $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, array|callable $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, array|callable $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, array|callable $handler): void {
        $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, array|callable $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, array|callable $handler): void {
        $this->routes[] = [
            'method'  => $method,
            'path'    => $path,
            'handler' => $handler
        ];
    }

    public function dispatch(string $method, string $uri): void {
        // Strip query string
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';

        // 1. If path contains index.php, strip up to and including index.php
        if (strpos($path, 'index.php') !== false) {
            $path = preg_replace('#^.*?index\.php#', '', $path);
        }
        
        // 2. Remove dynamic base prefix if running in a subdirectory (e.g. /DMS)
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        if (str_ends_with($scriptDir, '/api')) {
            $scriptDir = substr($scriptDir, 0, -4);
        }
        if (!empty($scriptDir) && strpos($path, $scriptDir) === 0) {
            $path = substr($path, strlen($scriptDir));
        }

        // 3. Also check fallback /DMS prefix
        $basePrefix = '/DMS';
        if (strpos($path, $basePrefix) === 0) {
            $path = substr($path, strlen($basePrefix));
        }

        // 4. Ensure path starts with /
        if ($path === '' || $path === false) {
            $path = '/';
        }
        if ($path[0] !== '/') {
            $path = '/' . $path;
        }

        // 5. Normalize route to ensure it begins with /api if route wasn't prefixed
        if (!str_starts_with($path, '/api')) {
            $path = '/api' . $path;
        }
        $path = rtrim($path, '/');
        if ($path === '') {
            $path = '/api';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            // Convert route pattern {param} to regex
            $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route['path']);
            $pattern = "#^{$pattern}$#";

            if (preg_match($pattern, $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request = new Request();

                if (is_callable($route['handler'])) {
                    call_user_func($route['handler'], $request, $params);
                    return;
                }

                [$controllerClass, $actionMethod] = $route['handler'];

                if (!class_exists($controllerClass)) {
                    Response::error("Controller '{$controllerClass}' not found.", 500);
                }

                $controller = new $controllerClass();
                if (!method_exists($controller, $actionMethod)) {
                    Response::error("Action '{$actionMethod}' not found on controller.", 500);
                }

                // Call action with request and route parameters
                call_user_func([$controller, $actionMethod], $request, $params);
                return;
            }
        }

        Response::error("Endpoint '{$method} {$path}' not found.", 404);
    }
}
