-- Distribution Management System (DMS) Master Schema
-- Character set utf8mb4 with full Unicode 5.20 support

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Roles
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) NOT NULL,
    `slug` VARCHAR(64) UNIQUE NOT NULL,
    `description` VARCHAR(255),
    `is_system` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Modules
CREATE TABLE IF NOT EXISTS `modules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) NOT NULL,
    `slug` VARCHAR(64) UNIQUE NOT NULL,
    `icon` VARCHAR(32) DEFAULT 'folder',
    `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Module Actions (Granular action permissions)
CREATE TABLE IF NOT EXISTS `module_actions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `module_id` INT NOT NULL,
    `action_slug` VARCHAR(32) NOT NULL,
    `label` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255),
    UNIQUE KEY `unique_module_action` (`module_id`, `action_slug`),
    FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `module_action_id` INT NOT NULL,
    UNIQUE KEY `unique_role_perm` (`role_id`, `module_action_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`module_action_id`) REFERENCES `module_actions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Users
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(64) UNIQUE NOT NULL,
    `email` VARCHAR(191) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(128) NOT NULL,
    `role_id` INT NOT NULL,
    `phone` VARCHAR(32),
    `territory_route` VARCHAR(64) DEFAULT 'All Territories',
    `active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
    INDEX (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Company Settings
CREATE TABLE IF NOT EXISTS `company_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(64) UNIQUE NOT NULL,
    `setting_value` LONGTEXT NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Territories / Routes
CREATE TABLE IF NOT EXISTS `territories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(64) UNIQUE NOT NULL,
    `code` VARCHAR(32) UNIQUE NOT NULL,
    `description` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Products
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(64) UNIQUE NOT NULL,
    `barcode` VARCHAR(64),
    `category` VARCHAR(64) NOT NULL,
    `unit` VARCHAR(32) DEFAULT 'unit',
    `pack_size` INT DEFAULT 1,
    `cost_price_paisa` BIGINT NOT NULL DEFAULT 0,
    `selling_price_paisa` BIGINT NOT NULL DEFAULT 0,
    `current_stock` INT NOT NULL DEFAULT 0,
    `reserved_stock` INT NOT NULL DEFAULT 0,
    `min_stock_level` INT NOT NULL DEFAULT 10,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (`category`),
    INDEX (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Customers
CREATE TABLE IF NOT EXISTS `customers` (
    `id` VARCHAR(64) PRIMARY KEY,
    `code` VARCHAR(32) UNIQUE NOT NULL,
    `shop_name` VARCHAR(191) NOT NULL,
    `owner_name` VARCHAR(128) NOT NULL,
    `phone` VARCHAR(32),
    `address` TEXT,
    `territory_route` VARCHAR(64) NOT NULL,
    `assigned_sales_rep_id` VARCHAR(64),
    `credit_limit_paisa` BIGINT NOT NULL DEFAULT 0,
    `current_balance_paisa` BIGINT NOT NULL DEFAULT 0,
    `payment_terms_days` INT DEFAULT 15,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (`territory_route`),
    INDEX (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Orders
CREATE TABLE IF NOT EXISTS `orders` (
    `id` VARCHAR(64) PRIMARY KEY,
    `order_number` VARCHAR(64) UNIQUE NOT NULL,
    `customer_id` VARCHAR(64) NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_code` VARCHAR(64) DEFAULT NULL,
    `customer_phone` VARCHAR(32) DEFAULT NULL,
    `customer_address` TEXT DEFAULT NULL,
    `order_taker_id` VARCHAR(64) NOT NULL,
    `order_taker_name` VARCHAR(128) NOT NULL,
    `assigned_delivery_driver_id` VARCHAR(64) DEFAULT NULL,
    `route` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'submitted',
    `subtotal_paisa` BIGINT NOT NULL DEFAULT 0,
    `tax_paisa` BIGINT NOT NULL DEFAULT 0,
    `discount_paisa` BIGINT NOT NULL DEFAULT 0,
    `total_paisa` BIGINT NOT NULL DEFAULT 0,
    `payment_terms` VARCHAR(64) DEFAULT 'Cash on Delivery',
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `dispatched_at` DATETIME DEFAULT NULL,
    `delivered_at` DATETIME DEFAULT NULL,
    `received_by_name` VARCHAR(128) DEFAULT NULL,
    `received_by_relation` VARCHAR(64) DEFAULT NULL,
    `pod_signature` LONGTEXT DEFAULT NULL,
    `pod_notes` TEXT DEFAULT NULL,
    `undelivered_reason` VARCHAR(255) DEFAULT NULL,
    INDEX (`customer_id`),
    INDEX (`order_taker_id`),
    INDEX (`assigned_delivery_driver_id`),
    INDEX (`status`),
    INDEX (`route`),
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Order Items
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `product_id` VARCHAR(64) NOT NULL,
    `product_name` VARCHAR(191) NOT NULL,
    `quantity` INT NOT NULL,
    `delivered_quantity` INT DEFAULT NULL,
    `unit_price_paisa` BIGINT NOT NULL,
    `line_total_paisa` BIGINT NOT NULL,
    INDEX (`order_id`),
    INDEX (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Order Events (Audit trail)
CREATE TABLE IF NOT EXISTS `order_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `from_status` VARCHAR(32),
    `to_status` VARCHAR(32),
    `note` TEXT,
    `user_id` VARCHAR(64),
    `user_name` VARCHAR(128),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Sales Invoices
CREATE TABLE IF NOT EXISTS `sales_invoices` (
    `id` VARCHAR(64) PRIMARY KEY,
    `invoice_number` VARCHAR(64) UNIQUE NOT NULL,
    `order_id` VARCHAR(64) NOT NULL,
    `customer_id` VARCHAR(64) NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `total_amount_paisa` BIGINT NOT NULL,
    `paid_amount_paisa` BIGINT NOT NULL DEFAULT 0,
    `balance_due_paisa` BIGINT NOT NULL,
    `payment_status` VARCHAR(32) NOT NULL DEFAULT 'unpaid',
    `due_date` DATE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (`customer_id`),
    INDEX (`order_id`),
    INDEX (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payments
CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(64) PRIMARY KEY,
    `payment_number` VARCHAR(64) UNIQUE NOT NULL,
    `customer_id` VARCHAR(64) NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `amount_paisa` BIGINT NOT NULL,
    `payment_method` VARCHAR(32) NOT NULL,
    `reference_number` VARCHAR(64),
    `notes` TEXT,
    `collected_by` VARCHAR(64),
    `collected_by_name` VARCHAR(128),
    `payment_date` DATE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`customer_id`),
    INDEX (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Payment Allocations
CREATE TABLE IF NOT EXISTS `payment_allocations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_id` VARCHAR(64) NOT NULL,
    `invoice_id` VARCHAR(64) NOT NULL,
    `invoice_number` VARCHAR(64) NOT NULL,
    `allocated_amount_paisa` BIGINT NOT NULL,
    INDEX (`payment_id`),
    INDEX (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Customer Ledger
CREATE TABLE IF NOT EXISTS `customer_ledger` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `description` TEXT,
    `reference_id` VARCHAR(64),
    `debit_paisa` BIGINT NOT NULL DEFAULT 0,
    `credit_paisa` BIGINT NOT NULL DEFAULT 0,
    `balance_paisa` BIGINT NOT NULL DEFAULT 0,
    `recorded_by` VARCHAR(64),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`customer_id`, `created_at`),
    INDEX (`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Stock Receipts (GRN)
CREATE TABLE IF NOT EXISTS `stock_receipts` (
    `id` VARCHAR(64) PRIMARY KEY,
    `receipt_number` VARCHAR(64) UNIQUE NOT NULL,
    `supplier_name` VARCHAR(191) NOT NULL,
    `reference_no` VARCHAR(64),
    `received_by` VARCHAR(64) NOT NULL,
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`receipt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Stock Receipt Items
CREATE TABLE IF NOT EXISTS `stock_receipt_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `receipt_id` VARCHAR(64) NOT NULL,
    `product_id` VARCHAR(64) NOT NULL,
    `product_name` VARCHAR(191) NOT NULL,
    `quantity_received` INT NOT NULL,
    `unit_cost_paisa` BIGINT NOT NULL,
    INDEX (`receipt_id`),
    INDEX (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Stock Movements
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` VARCHAR(64) PRIMARY KEY,
    `movement_id` VARCHAR(64) UNIQUE NOT NULL,
    `product_id` VARCHAR(64) NOT NULL,
    `product_name` VARCHAR(191) NOT NULL,
    `movement_type` VARCHAR(32) NOT NULL,
    `quantity_change` INT NOT NULL,
    `previous_stock` INT NOT NULL,
    `new_stock` INT NOT NULL,
    `reference_id` VARCHAR(64),
    `notes` TEXT,
    `recorded_by` VARCHAR(64),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`product_id`),
    INDEX (`movement_type`),
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Delivery Collections
CREATE TABLE IF NOT EXISTS `delivery_collections` (
    `id` VARCHAR(64) PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `driver_id` VARCHAR(64) NOT NULL,
    `customer_id` VARCHAR(64) NOT NULL,
    `amount_paisa` BIGINT NOT NULL,
    `payment_method` VARCHAR(32) NOT NULL,
    `reference_number` VARCHAR(64),
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (`order_id`),
    INDEX (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
