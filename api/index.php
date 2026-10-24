<?php
/**
 * RESTful JSON API Front Controller
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Require Core Files
require_once __DIR__ . '/../app/config/database.php';
require_once __DIR__ . '/../app/core/Database.php';
require_once __DIR__ . '/../app/core/Request.php';
require_once __DIR__ . '/../app/core/Response.php';
require_once __DIR__ . '/../app/core/Session.php';
require_once __DIR__ . '/../app/core/Permissions.php';
require_once __DIR__ . '/../app/core/Auth.php';
require_once __DIR__ . '/../app/core/Router.php';
require_once __DIR__ . '/../app/core/FileStorage.php';

// Fallback PSR-4 autoloader for App namespace
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Require Controllers
require_once __DIR__ . '/../app/controllers/AuthController.php';
require_once __DIR__ . '/../app/controllers/RoleController.php';
require_once __DIR__ . '/../app/controllers/UserController.php';
require_once __DIR__ . '/../app/controllers/ProductController.php';
require_once __DIR__ . '/../app/controllers/CustomerController.php';
require_once __DIR__ . '/../app/controllers/OrderController.php';
require_once __DIR__ . '/../app/controllers/InventoryController.php';
require_once __DIR__ . '/../app/controllers/RecoveryController.php';
require_once __DIR__ . '/../app/controllers/ReportController.php';
require_once __DIR__ . '/../app/controllers/SettingController.php';

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\RoleController;
use App\Controllers\UserController;
use App\Controllers\ProductController;
use App\Controllers\CustomerController;
use App\Controllers\OrderController;
use App\Controllers\InventoryController;
use App\Controllers\RecoveryController;
use App\Controllers\ReportController;
use App\Controllers\SettingController;

$router = new Router();

// --- Health Check Route ---
$router->get('/api', function() {
    App\Core\Response::json(['status' => 'online', 'app' => 'DMS Enterprise API', 'version' => '2.0.0']);
});

// --- Auth Routes ---
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);

// --- Roles & Dynamic Permission Matrix ---
$router->get('/api/roles', [RoleController::class, 'index']);
$router->post('/api/roles', [RoleController::class, 'store']);
$router->delete('/api/roles/{id}', [RoleController::class, 'destroy']);
$router->get('/api/roles/matrix', [RoleController::class, 'matrix']);
$router->post('/api/roles/matrix', [RoleController::class, 'updateMatrix']);

// --- Users & Staff ---
$router->get('/api/users', [UserController::class, 'index']);
$router->post('/api/users', [UserController::class, 'store']);
$router->put('/api/users/{id}', [UserController::class, 'update']);
$router->delete('/api/users/{id}', [UserController::class, 'destroy']);

// --- Products Catalog ---
$router->get('/api/products', [ProductController::class, 'index']);
$router->post('/api/products', [ProductController::class, 'store']);
$router->get('/api/products/expiry-alerts', [ProductController::class, 'expiryAlerts']);
$router->get('/api/products/barcode/{code}', [ProductController::class, 'scanBarcode']);
$router->put('/api/products/{id}', [ProductController::class, 'update']);
$router->delete('/api/products/{id}', [ProductController::class, 'destroy']);
$router->post('/api/products/{id}/adjust-stock', [ProductController::class, 'adjustStock']);

// --- Customers & Accounts ---
$router->get('/api/customers', [CustomerController::class, 'index']);
$router->post('/api/customers', [CustomerController::class, 'store']);
$router->put('/api/customers/{id}', [CustomerController::class, 'update']);
$router->delete('/api/customers/{id}', [CustomerController::class, 'destroy']);
$router->get('/api/customers/{id}/ledger', [CustomerController::class, 'ledger']);

// --- Orders & Dispatches ---
$router->get('/api/orders', [OrderController::class, 'index']);
$router->post('/api/orders', [OrderController::class, 'store']);
$router->get('/api/orders/{id}', [OrderController::class, 'show']);
$router->post('/api/orders/{id}/status', [OrderController::class, 'updateStatus']);
$router->get('/api/orders/{id}/invoice', [OrderController::class, 'invoice']);

// --- Inventory & Movements ---
$router->get('/api/inventory', [InventoryController::class, 'index']);
$router->post('/api/inventory/receive', [InventoryController::class, 'receiveStock']);
$router->get('/api/inventory/movements', [InventoryController::class, 'movements']);

// --- Recovery & Finance ---
$router->get('/api/recovery', [RecoveryController::class, 'index']);
$router->post('/api/recovery/payments', [RecoveryController::class, 'recordPayment']);

// --- Reports & Dashboard Analytics ---
$router->get('/api/reports/dashboard', [ReportController::class, 'dashboard']);
$router->get('/api/reports/sales', [ReportController::class, 'sales']);
$router->get('/api/reports/suite', [ReportController::class, 'suite']);

// --- Settings ---
$router->get('/api/settings', [SettingController::class, 'index']);
$router->post('/api/settings', [SettingController::class, 'update']);

// Dispatch Request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';

$router->dispatch($method, $uri);
