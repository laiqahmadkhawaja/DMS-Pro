<?php
/**
 * Master Database Setup & Migration Engine
 * Initializes database, tables, modules, granular actions, role permissions, and realistic demo data.
 */

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Response.php';

use App\Core\Database;

try {
    $db = Database::getConnection();

    // 1. Run Schema DDL
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    $db->exec($schemaSql);

    // 2. Seed Modules
    $modules = [
        ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'bar-chart-2', 'sort_order' => 1],
        ['name' => 'Book Order', 'slug' => 'order_create', 'icon' => 'plus-circle', 'sort_order' => 2],
        ['name' => 'Order Tracking', 'slug' => 'orders', 'icon' => 'package', 'sort_order' => 3],
        ['name' => 'Deliveries', 'slug' => 'delivery', 'icon' => 'truck', 'sort_order' => 4],
        ['name' => 'Product Catalog', 'slug' => 'products', 'icon' => 'tag', 'sort_order' => 5],
        ['name' => 'Customers', 'slug' => 'customers', 'icon' => 'users', 'sort_order' => 6],
        ['name' => 'Customer Ledger', 'slug' => 'customer_ledger', 'icon' => 'file-text', 'sort_order' => 7],
        ['name' => 'Inventory & Stock', 'slug' => 'inventory', 'icon' => 'archive', 'sort_order' => 8],
        ['name' => 'Recovery & Payments', 'slug' => 'recovery', 'icon' => 'dollar-sign', 'sort_order' => 9],
        ['name' => 'Reports & Analytics', 'slug' => 'reports', 'icon' => 'trending-up', 'sort_order' => 10],
        ['name' => 'Roles & Permissions', 'slug' => 'roles', 'icon' => 'shield', 'sort_order' => 11],
        ['name' => 'Users & Staff', 'slug' => 'users', 'icon' => 'user-check', 'sort_order' => 12],
        ['name' => 'System Settings', 'slug' => 'settings', 'icon' => 'settings', 'sort_order' => 13],
    ];

    $moduleStmt = $db->prepare("INSERT INTO modules (name, slug, icon, sort_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), sort_order=VALUES(sort_order)");
    foreach ($modules as $m) {
        $moduleStmt->execute([$m['name'], $m['slug'], $m['icon'], $m['sort_order']]);
    }

    // Map module slugs to IDs
    $moduleMap = $db->query("SELECT slug, id FROM modules")->fetchAll(PDO::FETCH_KEY_PAIR);

    // 3. Seed Module Actions
    $actionsByModule = [
        'dashboard' => [
            ['action_slug' => 'view', 'label' => 'View Dashboard', 'description' => 'Access KPI dashboard overview'],
            ['action_slug' => 'export', 'label' => 'Export Analytics', 'description' => 'Export summary metrics and graphs']
        ],
        'order_create' => [
            ['action_slug' => 'view', 'label' => 'Access Catalog', 'description' => 'View book order screen & catalog'],
            ['action_slug' => 'create', 'label' => 'Submit Order', 'description' => 'Book and submit new orders'],
            ['action_slug' => 'apply_discount', 'label' => 'Apply Special Discount', 'description' => 'Apply custom line or order discounts']
        ],
        'orders' => [
            ['action_slug' => 'view', 'label' => 'View Orders', 'description' => 'View order list and details'],
            ['action_slug' => 'edit', 'label' => 'Edit Order', 'description' => 'Modify submitted order lines before approval'],
            ['action_slug' => 'delete', 'label' => 'Delete Order', 'description' => 'Delete draft or submitted orders'],
            ['action_slug' => 'approve', 'label' => 'Approve Order', 'description' => 'Approve order for warehouse dispatch'],
            ['action_slug' => 'dispatch', 'label' => 'Dispatch Order', 'description' => 'Handover order to delivery fleet'],
            ['action_slug' => 'deliver', 'label' => 'Mark Delivered', 'description' => 'Confirm customer delivery and invoice'],
            ['action_slug' => 'cancel', 'label' => 'Cancel Order', 'description' => 'Cancel order with reason notes'],
            ['action_slug' => 'print_invoice', 'label' => 'Print Tax Invoice', 'description' => 'Print sales invoice & delivery challan']
        ],
        'delivery' => [
            ['action_slug' => 'view', 'label' => 'View Deliveries', 'description' => 'View driver deliveries and route run-sheets'],
            ['action_slug' => 'assign_driver', 'label' => 'Assign Fleet Driver', 'description' => 'Assign vehicles and drivers to orders'],
            ['action_slug' => 'confirm_delivery', 'label' => 'Confirm Delivery', 'description' => 'Mark order delivery status on field'],
            ['action_slug' => 'collect_cash', 'label' => 'Collect Cash on Delivery', 'description' => 'Record COD payments from retail clients']
        ],
        'products' => [
            ['action_slug' => 'view', 'label' => 'View Catalog', 'description' => 'View product list, stock and rates'],
            ['action_slug' => 'create', 'label' => 'Add Product', 'description' => 'Create new product records and SKUs'],
            ['action_slug' => 'edit', 'label' => 'Edit Product', 'description' => 'Update product prices, categories, and pack sizes'],
            ['action_slug' => 'delete', 'label' => 'Deactivate Product', 'description' => 'Archive or delete products'],
            ['action_slug' => 'adjust_stock', 'label' => 'Stock Adjustment', 'description' => 'Perform manual inventory stock corrections'],
            ['action_slug' => 'export', 'label' => 'Export Products', 'description' => 'Export product catalog to CSV']
        ],
        'customers' => [
            ['action_slug' => 'view', 'label' => 'View Customers', 'description' => 'View retail shop accounts & contacts'],
            ['action_slug' => 'create', 'label' => 'Register Customer', 'description' => 'Onboard new retail accounts'],
            ['action_slug' => 'edit', 'label' => 'Edit Customer', 'description' => 'Update customer information & payment terms'],
            ['action_slug' => 'delete', 'label' => 'Deactivate Customer', 'description' => 'Archive or remove customer accounts'],
            ['action_slug' => 'override_credit', 'label' => 'Override Credit Limit', 'description' => 'Approve orders exceeding credit limit'],
            ['action_slug' => 'export', 'label' => 'Export Customers', 'description' => 'Export customer list and ledger balances']
        ],
        'customer_ledger' => [
            ['action_slug' => 'view', 'label' => 'View Ledger', 'description' => 'View debit/credit balance history'],
            ['action_slug' => 'export', 'label' => 'Export Ledger', 'description' => 'Export customer ledger entries to CSV'],
            ['action_slug' => 'print_statement', 'label' => 'Print Statement', 'description' => 'Print formal account statement']
        ],
        'inventory' => [
            ['action_slug' => 'view', 'label' => 'View Inventory', 'description' => 'Inspect stock on hand and reorder alerts'],
            ['action_slug' => 'receive_stock', 'label' => 'Receive GRN Stock', 'description' => 'Record goods received note from supplier'],
            ['action_slug' => 'adjust_stock', 'label' => 'Stock Audit Correction', 'description' => 'Audit and correct warehouse stock count'],
            ['action_slug' => 'export', 'label' => 'Export Movements', 'description' => 'Export stock movement history log']
        ],
        'recovery' => [
            ['action_slug' => 'view', 'label' => 'View Recovery', 'description' => 'View overdue balances & payment vouchers'],
            ['action_slug' => 'record_payment', 'label' => 'Record Payment', 'description' => 'Log customer collection by Cash/Cheque/Bank'],
            ['action_slug' => 'delete_payment', 'label' => 'Void Payment', 'description' => 'Cancel or void incorrect payment entries'],
            ['action_slug' => 'export', 'label' => 'Export Collections', 'description' => 'Export collection reports to CSV']
        ],
        'reports' => [
            ['action_slug' => 'view', 'label' => 'View Reports', 'description' => 'Access sales, profit, stock and tax reports'],
            ['action_slug' => 'export_csv', 'label' => 'Export CSV', 'description' => 'Export raw report tables to spreadsheet'],
            ['action_slug' => 'export_pdf', 'label' => 'Print Reports', 'description' => 'Format printable summary reports']
        ],
        'roles' => [
            ['action_slug' => 'view', 'label' => 'View Roles', 'description' => 'Inspect system roles and granted privileges'],
            ['action_slug' => 'create', 'label' => 'Create Role', 'description' => 'Create new custom role definitions'],
            ['action_slug' => 'edit', 'label' => 'Edit Role', 'description' => 'Update role metadata and descriptions'],
            ['action_slug' => 'delete', 'label' => 'Delete Role', 'description' => 'Remove non-system custom roles'],
            ['action_slug' => 'manage_permissions', 'label' => 'Manage Permissions Matrix', 'description' => 'Assign and toggle granular privileges']
        ],
        'users' => [
            ['action_slug' => 'view', 'label' => 'View Staff', 'description' => 'View system users and field personnel'],
            ['action_slug' => 'create', 'label' => 'Create User', 'description' => 'Add new employee account and assign role'],
            ['action_slug' => 'edit', 'label' => 'Edit User', 'description' => 'Update staff details, route and status'],
            ['action_slug' => 'delete', 'label' => 'Deactivate User', 'description' => 'Suspend employee access'],
            ['action_slug' => 'reset_password', 'label' => 'Reset Password', 'description' => 'Force reset user security credentials']
        ],
        'settings' => [
            ['action_slug' => 'view', 'label' => 'View Settings', 'description' => 'View distribution configuration'],
            ['action_slug' => 'edit_company', 'label' => 'Edit Company Profile', 'description' => 'Update company address, tax and invoice terms'],
            ['action_slug' => 'database_backup', 'label' => 'System Maintenance', 'description' => 'Trigger database backups and audit maintenance']
        ]
    ];

    $actionStmt = $db->prepare("INSERT INTO module_actions (module_id, action_slug, label, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description)");
    foreach ($actionsByModule as $modSlug => $actions) {
        $modId = $moduleMap[$modSlug];
        foreach ($actions as $act) {
            $actionStmt->execute([$modId, $act['action_slug'], $act['label'], $act['description']]);
        }
    }

    // 4. Seed Standard Roles
    $roles = [
        ['name' => 'Super Administrator', 'slug' => 'super_admin', 'description' => 'Unrestricted global system access', 'is_system' => 1],
        ['name' => 'Operations Admin', 'slug' => 'admin', 'description' => 'Distribution operations and entity management', 'is_system' => 1],
        ['name' => 'Distribution Manager', 'slug' => 'manager', 'description' => 'Order approval, territory dispatch, and oversight', 'is_system' => 1],
        ['name' => 'Order Taker / Sales Rep', 'slug' => 'order_taker', 'description' => 'Field sales representative booking client orders', 'is_system' => 1],
        ['name' => 'Delivery Driver', 'slug' => 'delivery_man', 'description' => 'Fleet logistics driver fulfilling dispatches', 'is_system' => 1],
        ['name' => 'Recovery Officer / Accountant', 'slug' => 'recovery_officer', 'description' => 'Receivables recovery and payment collections', 'is_system' => 1],
        ['name' => 'Warehouse Manager', 'slug' => 'warehouse_manager', 'description' => 'Stock receipts, inventory audits, and dispatch loading', 'is_system' => 1],
        ['name' => 'Read-Only Auditor', 'slug' => 'auditor', 'description' => 'Financial and inventory compliance oversight', 'is_system' => 1],
    ];

    $roleStmt = $db->prepare("INSERT INTO roles (name, slug, description, is_system) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)");
    foreach ($roles as $r) {
        $roleStmt->execute([$r['name'], $r['slug'], $r['description'], $r['is_system']]);
    }

    $roleMap = $db->query("SELECT slug, id FROM roles")->fetchAll(PDO::FETCH_KEY_PAIR);

    // Fetch all module_action records: 'module.action' => action_id
    $actionMapStmt = $db->query("
        SELECT CONCAT(m.slug, '.', ma.action_slug) as code, ma.id 
        FROM module_actions ma
        JOIN modules m ON ma.module_id = m.id
    ");
    $actionIdMap = $actionMapStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // 5. Seed Role Permissions for standard roles
    $permStmt = $db->prepare("INSERT IGNORE INTO role_permissions (role_id, module_action_id) VALUES (?, ?)");

    // Permissions configuration per role
    $rolePermConfig = [
        'admin' => array_keys($actionIdMap), // Admin gets all except role deletion
        'manager' => [
            'dashboard.view', 'dashboard.export',
            'order_create.view', 'order_create.create', 'order_create.apply_discount',
            'orders.view', 'orders.edit', 'orders.approve', 'orders.dispatch', 'orders.deliver', 'orders.cancel', 'orders.print_invoice',
            'delivery.view', 'delivery.assign_driver', 'delivery.confirm_delivery',
            'products.view', 'products.export',
            'customers.view', 'customers.create', 'customers.edit', 'customers.override_credit', 'customers.export',
            'customer_ledger.view', 'customer_ledger.export', 'customer_ledger.print_statement',
            'inventory.view', 'inventory.receive_stock', 'inventory.export',
            'recovery.view', 'recovery.record_payment', 'recovery.export',
            'reports.view', 'reports.export_csv', 'reports.export_pdf'
        ],
        'order_taker' => [
            'dashboard.view',
            'order_create.view', 'order_create.create',
            'orders.view', 'orders.print_invoice',
            'products.view',
            'customers.view', 'customers.create'
        ],
        'delivery_man' => [
            'dashboard.view',
            'delivery.view', 'delivery.confirm_delivery', 'delivery.collect_cash',
            'orders.view', 'orders.print_invoice'
        ],
        'recovery_officer' => [
            'dashboard.view',
            'recovery.view', 'recovery.record_payment', 'recovery.export',
            'customer_ledger.view', 'customer_ledger.export', 'customer_ledger.print_statement',
            'customers.view',
            'orders.view', 'orders.print_invoice',
            'reports.view', 'reports.export_csv'
        ],
        'warehouse_manager' => [
            'dashboard.view',
            'inventory.view', 'inventory.receive_stock', 'inventory.adjust_stock', 'inventory.export',
            'products.view', 'products.adjust_stock',
            'orders.view', 'orders.dispatch'
        ],
        'auditor' => [
            'dashboard.view', 'dashboard.export',
            'orders.view', 'orders.print_invoice',
            'products.view', 'products.export',
            'customers.view', 'customers.export',
            'customer_ledger.view', 'customer_ledger.export', 'customer_ledger.print_statement',
            'inventory.view', 'inventory.export',
            'recovery.view', 'recovery.export',
            'reports.view', 'reports.export_csv', 'reports.export_pdf'
        ]
    ];

    foreach ($rolePermConfig as $roleSlug => $grantedCodes) {
        if (!isset($roleMap[$roleSlug])) continue;
        $rId = $roleMap[$roleSlug];
        foreach ($grantedCodes as $code) {
            if (isset($actionIdMap[$code])) {
                $permStmt->execute([$rId, $actionIdMap[$code]]);
            }
        }
    }

    // 6. Company Settings
    $settings = [
        'company_name' => 'Apex Distribution Logistics Ltd',
        'tagline'      => 'Premier FMCG Wholesale & Logistics Network',
        'address'      => 'Plot 102-B, Industrial Estate Phase 2, Lahore',
        'phone'        => '+92 42 35551234',
        'email'        => 'info@apexdistribution.pk',
        'currency'     => 'Rs.',
        'tax_rate'     => '5.00',
        'default_credit_days' => '30',
        'default_credit_limit_paisa' => '50000000',
        'receipt_footer' => 'Thank you for your business! For inquiries call +92 42 35551234.'
    ];

    $setStmt = $db->prepare("INSERT INTO company_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)");
    foreach ($settings as $k => $v) {
        $setStmt->execute([$k, is_array($v) ? json_encode($v) : $v]);
    }

    // 7. Territories
    $territories = [
        ['name' => 'North Route (Commercial)', 'code' => 'NORTH-01', 'description' => 'Main commercial avenue and plaza retailers'],
        ['name' => 'South Bazaar (Wholesale)', 'code' => 'SOUTH-02', 'description' => 'Dense wholesale market and bulk buyers'],
        ['name' => 'East Suburb (Retail)', 'code' => 'EAST-03', 'description' => 'Residential neighborhood general stores'],
        ['name' => 'West Industrial Corridor', 'code' => 'WEST-04', 'description' => 'Factory canteens and industrial mini-marts']
    ];
    $terrStmt = $db->prepare("INSERT INTO territories (name, code, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description)");
    foreach ($territories as $t) {
        $terrStmt->execute([$t['name'], $t['code'], $t['description']]);
    }

    // 8. Seed Demo Users
    $passwordHash = password_hash('Password123!', PASSWORD_BCRYPT);
    $users = [
        ['uid' => 'usr_laiq_admin', 'email' => 'laiq@company.com', 'displayName' => 'Laiq Ahmad Khawaja', 'role' => 'super_admin', 'phone' => '+92 300 0000001', 'route' => 'All Territories'],
        ['uid' => 'usr_super_admin', 'email' => 'admin@dms.com', 'displayName' => 'Ahmad Khan (Super Admin)', 'role' => 'super_admin', 'phone' => '+92 300 1110001', 'route' => 'All Territories'],
        ['uid' => 'usr_admin', 'email' => 'operations@dms.com', 'displayName' => 'Sarah Jenkins (Ops Admin)', 'role' => 'admin', 'phone' => '+92 300 1110002', 'route' => 'All Territories'],
        ['uid' => 'usr_manager', 'email' => 'manager@dms.com', 'displayName' => 'Hamza Sheikh (Dist Manager)', 'role' => 'manager', 'phone' => '+92 300 1110003', 'route' => 'Regional HQ'],
        ['uid' => 'usr_sales_1', 'email' => 'sales1@dms.com', 'displayName' => 'Tariq Mahmood (North Rep)', 'role' => 'order_taker', 'phone' => '+92 300 1110004', 'route' => 'North Route (Commercial)'],
        ['uid' => 'usr_sales_2', 'email' => 'sales2@dms.com', 'displayName' => 'Bilal Aslam (South Rep)', 'role' => 'order_taker', 'phone' => '+92 300 1110005', 'route' => 'South Bazaar (Wholesale)'],
        ['uid' => 'usr_driver_1', 'email' => 'driver1@dms.com', 'displayName' => 'Kamran Akmal (Fleet Driver)', 'role' => 'delivery_man', 'phone' => '+92 300 1110006', 'route' => 'North Route (Commercial)'],
        ['uid' => 'usr_recovery_1', 'email' => 'recovery1@dms.com', 'displayName' => 'Zahid Qureshi (Recovery Officer)', 'role' => 'recovery_officer', 'phone' => '+92 300 1110007', 'route' => 'All Territories'],
        ['uid' => 'usr_warehouse_1', 'email' => 'warehouse1@dms.com', 'displayName' => 'Rashid Minhas (Warehouse Head)', 'role' => 'warehouse_manager', 'phone' => '+92 300 1110008', 'route' => 'Central Warehouse'],
        ['uid' => 'usr_auditor_1', 'email' => 'auditor1@dms.com', 'displayName' => 'Fatima Noor (Lead Auditor)', 'role' => 'auditor', 'phone' => '+92 300 1110009', 'route' => 'All Territories']
    ];

    $userStmt = $db->prepare("
        INSERT INTO users (uid, email, password_hash, display_name, role_id, phone, territory_route, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), role_id=VALUES(role_id), password_hash=VALUES(password_hash), phone=VALUES(phone)
    ");
    foreach ($users as $u) {
        $rId = $roleMap[$u['role']];
        $userStmt->execute([$u['uid'], $u['email'], $passwordHash, $u['displayName'], $rId, $u['phone'], $u['route']]);
    }

    // 9. Realistic FMCG Products
    $products = [
        ['id' => 'PRD-101', 'name' => 'Nestle Pure Life 1.5L (Case of 6)', 'sku' => 'BEV-WAT-001', 'category' => 'Beverages', 'unit' => 'case', 'cost' => 45000, 'price' => 54000, 'stock' => 120, 'min' => 20],
        ['id' => 'PRD-102', 'name' => 'Coca Cola 1.5L PET (Case of 6)', 'sku' => 'BEV-SOD-002', 'category' => 'Beverages', 'unit' => 'case', 'cost' => 60000, 'price' => 72000, 'stock' => 85, 'min' => 15],
        ['id' => 'PRD-103', 'name' => 'Red Bull Energy Drink 250ml (Tray 24)', 'sku' => 'BEV-ENG-003', 'category' => 'Beverages', 'unit' => 'tray', 'cost' => 580000, 'price' => 690000, 'stock' => 40, 'min' => 10],
        ['id' => 'PRD-104', 'name' => 'Lays Classic Salted 38g (Box 24)', 'sku' => 'SNK-CHIP-004', 'category' => 'Snacks', 'unit' => 'box', 'cost' => 144000, 'price' => 180000, 'stock' => 110, 'min' => 25],
        ['id' => 'PRD-105', 'name' => 'Kurkure Chutney Chaska 45g (Box 24)', 'sku' => 'SNK-CHIP-005', 'category' => 'Snacks', 'unit' => 'box', 'cost' => 140000, 'price' => 175000, 'stock' => 95, 'min' => 20],
        ['id' => 'PRD-106', 'name' => 'Cadbury Dairy Milk 36g (Box 24)', 'sku' => 'SNK-CHO-006', 'category' => 'Confectionery', 'unit' => 'box', 'cost' => 260000, 'price' => 320000, 'stock' => 65, 'min' => 15],
        ['id' => 'PRD-107', 'name' => 'Tapal Danedar Tea 400g Pouch', 'sku' => 'GRO-TEA-007', 'category' => 'Grocery', 'unit' => 'pack', 'cost' => 52000, 'price' => 62000, 'stock' => 140, 'min' => 30],
        ['id' => 'PRD-108', 'name' => 'Dalda Cooking Oil 1L Pouch (Ctn 12)', 'sku' => 'GRO-OIL-008', 'category' => 'Grocery', 'unit' => 'carton', 'cost' => 620000, 'price' => 710000, 'stock' => 50, 'min' => 10],
        ['id' => 'PRD-109', 'name' => 'Shan Biryani Masala 50g (Disp 12)', 'sku' => 'GRO-SPC-009', 'category' => 'Spices', 'unit' => 'display', 'cost' => 96000, 'price' => 120000, 'stock' => 180, 'min' => 40],
        ['id' => 'PRD-110', 'name' => 'Dettol Original Soap 135g (Bundle 4)', 'sku' => 'PC-SOAP-010', 'category' => 'Personal Care', 'unit' => 'bundle', 'cost' => 62000, 'price' => 76000, 'stock' => 90, 'min' => 20],
        ['id' => 'PRD-111', 'name' => 'Surf Excel Quick Wash 1kg Bag', 'sku' => 'HH-DET-011', 'category' => 'Household', 'unit' => 'bag', 'cost' => 48000, 'price' => 58000, 'stock' => 105, 'min' => 25],
        ['id' => 'PRD-112', 'name' => 'Colgate MaxFresh 100g Toothpaste', 'sku' => 'PC-ORAL-012', 'category' => 'Personal Care', 'unit' => 'box', 'cost' => 21000, 'price' => 27000, 'stock' => 130, 'min' => 25]
    ];

    $prodStmt = $db->prepare("
        INSERT INTO products (id, name, sku, category, unit, cost_price_paisa, selling_price_paisa, current_stock, min_stock_level, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE name=VALUES(name), cost_price_paisa=VALUES(cost_price_paisa), selling_price_paisa=VALUES(selling_price_paisa), current_stock=VALUES(current_stock)
    ");
    foreach ($products as $p) {
        $prodStmt->execute([$p['id'], $p['name'], $p['sku'], $p['category'], $p['unit'], $p['cost'], $p['price'], $p['stock'], $p['min']]);
    }

    // 10. Seed Realistic Retail Customers
    $customers = [
        ['id' => 'CUST-1001', 'code' => 'RET-N101', 'shop' => 'Al-Madina Super Store', 'owner' => 'Haji Muhammad Yaqoob', 'phone' => '+92 300 2345671', 'address' => 'Shop 12-14, Commercial Center, North Route', 'route' => 'North Route (Commercial)', 'limit' => 25000000, 'bal' => 4800000],
        ['id' => 'CUST-1002', 'code' => 'RET-N102', 'shop' => 'Bismillah General Store', 'owner' => 'Sheikh Rizwan', 'phone' => '+92 300 2345672', 'address' => 'Plot 45, Main Market, North Route', 'route' => 'North Route (Commercial)', 'limit' => 15000000, 'bal' => 2100000],
        ['id' => 'CUST-1003', 'code' => 'RET-S201', 'shop' => 'Khyber Wholesale Mart', 'owner' => 'Arbab Khan', 'phone' => '+92 300 2345673', 'address' => 'Gali 4, Akbari Mandi, South Bazaar', 'route' => 'South Bazaar (Wholesale)', 'limit' => 50000000, 'bal' => 12400000],
        ['id' => 'CUST-1004', 'code' => 'RET-S202', 'shop' => 'Ittihad Cash & Carry', 'owner' => 'Malik Zubair', 'phone' => '+92 300 2345674', 'address' => 'Circular Road, South Bazaar', 'route' => 'South Bazaar (Wholesale)', 'limit' => 40000000, 'bal' => 8900000],
        ['id' => 'CUST-1005', 'code' => 'RET-E301', 'shop' => 'Chaman Corner Store', 'owner' => 'Imran Butt', 'phone' => '+92 300 2345675', 'address' => 'Sector C Chowk, East Suburb', 'route' => 'East Suburb (Retail)', 'limit' => 10000000, 'bal' => 1250000],
        ['id' => 'CUST-1006', 'code' => 'RET-W401', 'shop' => 'Millat Industrial Canteen', 'owner' => 'Chaudhry Afzal', 'phone' => '+92 300 2345676', 'address' => 'Industrial Area Gate 3, West Corridor', 'route' => 'West Industrial Corridor', 'limit' => 20000000, 'bal' => 3100000]
    ];

    $custStmt = $db->prepare("
        INSERT INTO customers (id, code, shop_name, owner_name, phone, address, territory_route, assigned_sales_rep_id, credit_limit_paisa, current_balance_paisa, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'usr_sales_1', ?, ?, 1)
        ON DUPLICATE KEY UPDATE shop_name=VALUES(shop_name), credit_limit_paisa=VALUES(credit_limit_paisa), current_balance_paisa=VALUES(current_balance_paisa)
    ");
    foreach ($customers as $c) {
        $custStmt->execute([$c['id'], $c['code'], $c['shop'], $c['owner'], $c['phone'], $c['address'], $c['route'], $c['limit'], $c['bal']]);
    }

    // 11. Seed Realistic Orders, Items, Invoices, and Ledgers
    $orders = [
        [
            'id' => 'ORD-2026-1001',
            'order_number' => 'ORD-2026-1001',
            'customer_id' => 'CUST-1001',
            'customer_name' => 'Al-Madina Super Store',
            'customer_code' => 'RET-N101',
            'order_taker_id' => 'usr_sales_1',
            'order_taker_name' => 'Tariq Mahmood (North Rep)',
            'assigned_driver' => 'usr_driver_1',
            'route' => 'North Route (Commercial)',
            'status' => 'delivered',
            'subtotal' => 2400000,
            'tax' => 120000,
            'discount' => 0,
            'total' => 2520000,
            'items' => [
                ['product_id' => 'PRD-101', 'name' => 'Nestle Pure Life 1.5L (Case of 6)', 'qty' => 20, 'unit_price' => 54000, 'total' => 1080000],
                ['product_id' => 'PRD-102', 'name' => 'Coca Cola 1.5L PET (Case of 6)', 'qty' => 20, 'unit_price' => 72000, 'total' => 1440000]
            ]
        ],
        [
            'id' => 'ORD-2026-1002',
            'order_number' => 'ORD-2026-1002',
            'customer_id' => 'CUST-1002',
            'customer_name' => 'Bismillah General Store',
            'customer_code' => 'RET-N102',
            'order_taker_id' => 'usr_sales_1',
            'order_taker_name' => 'Tariq Mahmood (North Rep)',
            'assigned_driver' => 'usr_driver_1',
            'route' => 'North Route (Commercial)',
            'status' => 'dispatched',
            'subtotal' => 1570000,
            'tax' => 78500,
            'discount' => 0,
            'total' => 1648500,
            'items' => [
                ['product_id' => 'PRD-104', 'name' => 'Lays Classic Salted 38g (Box 24)', 'qty' => 5, 'unit_price' => 180000, 'total' => 900000],
                ['product_id' => 'PRD-107', 'name' => 'Tapal Danedar Tea 400g Pouch', 'qty' => 10, 'unit_price' => 62000, 'total' => 620000]
            ]
        ],
        [
            'id' => 'ORD-2026-1003',
            'order_number' => 'ORD-2026-1003',
            'customer_id' => 'CUST-1003',
            'customer_name' => 'Khyber Wholesale Mart',
            'customer_code' => 'RET-S201',
            'order_taker_id' => 'usr_sales_2',
            'order_taker_name' => 'Bilal Aslam (South Rep)',
            'assigned_driver' => null,
            'route' => 'South Bazaar (Wholesale)',
            'status' => 'approved',
            'subtotal' => 3550000,
            'tax' => 177500,
            'discount' => 50000,
            'total' => 3677500,
            'items' => [
                ['product_id' => 'PRD-108', 'name' => 'Dalda Cooking Oil 1L Pouch (Ctn 12)', 'qty' => 5, 'unit_price' => 710000, 'total' => 3550000]
            ]
        ],
        [
            'id' => 'ORD-2026-1004',
            'order_number' => 'ORD-2026-1004',
            'customer_id' => 'CUST-1004',
            'customer_name' => 'Ittihad Cash & Carry',
            'customer_code' => 'RET-S202',
            'order_taker_id' => 'usr_sales_2',
            'order_taker_name' => 'Bilal Aslam (South Rep)',
            'assigned_driver' => null,
            'route' => 'South Bazaar (Wholesale)',
            'status' => 'submitted',
            'subtotal' => 1370000,
            'tax' => 68500,
            'discount' => 0,
            'total' => 1438500,
            'items' => [
                ['product_id' => 'PRD-103', 'name' => 'Red Bull Energy Drink 250ml (Tray 24)', 'qty' => 2, 'unit_price' => 690000, 'total' => 1380000]
            ]
        ]
    ];

    $ordStmt = $db->prepare("
        INSERT INTO orders (id, order_number, customer_id, customer_name, customer_code, order_taker_id, order_taker_name, assigned_delivery_driver_id, route, status, subtotal_paisa, tax_paisa, discount_paisa, total_paisa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status=VALUES(status), total_paisa=VALUES(total_paisa)
    ");
    $itemStmt = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_paisa, line_total_paisa) VALUES (?, ?, ?, ?, ?, ?)");
    $eventStmt = $db->prepare("INSERT INTO order_events (order_id, action, from_status, to_status, note, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $invStmt = $db->prepare("
        INSERT INTO sales_invoices (id, invoice_number, order_id, customer_id, customer_name, total_amount_paisa, paid_amount_paisa, balance_due_paisa, payment_status, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY))
        ON DUPLICATE KEY UPDATE balance_due_paisa=VALUES(balance_due_paisa)
    ");

    foreach ($orders as $o) {
        $ordStmt->execute([
            $o['id'], $o['order_number'], $o['customer_id'], $o['customer_name'], $o['customer_code'],
            $o['order_taker_id'], $o['order_taker_name'], $o['assigned_driver'], $o['route'], $o['status'],
            $o['subtotal'], $o['tax'], $o['discount'], $o['total']
        ]);

        // Clean items and re-insert
        $db->exec("DELETE FROM order_items WHERE order_id = '{$o['id']}'");
        foreach ($o['items'] as $it) {
            $itemStmt->execute([$o['id'], $it['product_id'], $it['name'], $it['qty'], $it['unit_price'], $it['total']]);
        }

        // Add initial event
        $eventStmt->execute([$o['id'], 'SUBMIT_ORDER', null, 'submitted', 'Order placed via mobile catalog', $o['order_taker_id'], $o['order_taker_name']]);

        // For delivered order, create Invoice and Ledger Entry
        if ($o['status'] === 'delivered') {
            $invId = 'INV-' . substr($o['order_number'], 4);
            $invStmt->execute([$invId, 'INV-' . substr($o['order_number'], 4), $o['id'], $o['customer_id'], $o['customer_name'], $o['total'], 0, $o['total'], 'unpaid']);
            
            // Ledger entry
            $db->exec("
                INSERT INTO customer_ledger (customer_id, type, description, reference_id, debit_paisa, credit_paisa, balance_paisa, recorded_by)
                VALUES ('{$o['customer_id']}', 'INVOICE', 'Invoice {$invId} generated for order {$o['order_number']}', '{$invId}', {$o['total']}, 0, {$o['total']}, 'SYSTEM')
            ");
        }
    }

    echo "=== DMS Database & Seed Initialized Successfully! ===\n";
    echo "• Roles seeded: " . count($roles) . "\n";
    echo "• Modules seeded: " . count($modules) . "\n";
    echo "• Actions configured: " . count($actionIdMap) . "\n";
    echo "• Products seeded: " . count($products) . "\n";
    echo "• Customers seeded: " . count($customers) . "\n";
    echo "• Demo Users seeded: " . count($users) . "\n";

} catch (Exception $e) {
    echo "ERROR during setup: " . $e->getMessage() . "\n";
    exit(1);
}
