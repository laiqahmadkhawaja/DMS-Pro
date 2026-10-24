# 🚚 DMS Enterprise — Distribution Logistics & Management System

> **Architecture:** Single Page Application (SPA) Shell + RESTful Core PHP API  
> **Tech Stack:** HTML5, Modern Tailwind CSS (Dark/Light Theming), Vanilla ES6+ JavaScript, Core PHP 8.2 (PDO), MySQL (InnoDB)  
> **Location:** `http://localhost/DMS/` (Directory: `c:\wamp64\www\DMS`)  

---

## 🌟 Key Highlights & Architectural Improvements over `DMS_Pro`

1. **Zero Dual-File Duplication (SPA Front-Controller)**:
   - Completely resolved the duplicate `.html` and `.php` confusion in `DMS_Pro`.
   - Single authenticated entry point at [`index.php`](file:///c:/wamp64/www/DMS/index.php). Naked `.html` views cannot be accessed directly or bypass security.
2. **Zero Cloud / Firebase Dependencies**:
   - 100% clean, local PHP/MySQL and native ES6 modular JavaScript.
3. **Dynamic Database-Driven Granular RBAC Engine**:
   - Replaced static/hardcoded role checks with dynamic **module-wise**, **page-wise**, and **action-wise** permissions (`view`, `create`, `edit`, `delete`, `export`, `print`, `approve`, `dispatch`, `deliver`).
   - Interactive matrix editor grid in UI with 1-click AJAX saving.
4. **Mobile-First Experience**:
   - Fixed mobile bottom navigation app bar for smartphones.
   - Slide-over touch drawer for auxiliary menus.
   - High-density responsive tables that comfortably adapt to mobile screens.
5. **Modal-First AJAX Operations**:
   - 100% in-place CRUD without page reloads (Add/Edit Product, Add/Edit Customer, Book Order, Receive GRN Stock, Record Payment, Inspect Order).
6. **Native Dark & Light Theme**:
   - OLED-friendly dark mode and crisp high-contrast light mode with automatic OS detection and persistent `localStorage` preference.

---

## 🔐 Pre-Seeded Demo User Accounts

All accounts use the universal default password: **`Password123!`**

| Name | Role | Email | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Laiq Ahmad Khawaja** | Super Admin | `laiq@company.com` | Global Unrestricted Access (`*.*`) |
| **Ahmad Khan** | Super Admin | `admin@dms.com` | Global Unrestricted Access (`*.*`) |
| **Sarah Jenkins** | Operations Admin | `operations@dms.com` | All Operations, Catalog, Finance, Users |
| **Hamza Sheikh** | Dist. Manager | `manager@dms.com` | Order Approvals, Route Dispatch, Inventory, Reports |
| **Tariq Mahmood** | Sales Rep (North) | `sales1@dms.com` | Mobile POS Catalog, Book Orders, Customer Directory |
| **Bilal Aslam** | Sales Rep (South) | `sales2@dms.com` | Mobile POS Catalog, Book Orders, Customer Directory |
| **Kamran Akmal** | Fleet Driver | `driver1@dms.com` | Fleet Run-Sheet, Mark Deliveries, Cash Collection |
| **Zahid Qureshi** | Recovery Officer | `recovery1@dms.com` | Overdue Balances, Payment Vouchers, Ledgers |
| **Rashid Minhas** | Warehouse Manager | `warehouse1@dms.com` | Stock Holdings, Receive GRN Stock, Audit Movements |
| **Fatima Noor** | Compliance Auditor | `auditor1@dms.com` | Read-Only Audit Oversight & Reports |

---

## 📁 Directory Structure

```
c:\wamp64\www\DMS\
├── api\
│   └── index.php                  # RESTful API Front-Controller & Router
├── app\
│   ├── config\                    # Database & App environment configuration
│   ├── core\                      # Database PDO, Request, Response, Router, Auth, Permissions
│   ├── controllers\               # Auth, Roles, Users, Products, Customers, Orders, Inventory, Recovery, Reports, Settings
│   └── database\
│       ├── schema.sql             # Complete MySQL DDL schema
│       └── setup.php              # Automated schema migrator & master seeder
├── assets\
│   ├── css\
│   │   ├── tailwind.css           # Utility styling, modern card design, light/dark themes
│   │   └── print.css              # Print stylesheet for tax invoices & statements
│   └── js\
│       ├── app.js                 # SPA Router & Orchestrator
│       ├── api.js                 # Central AJAX fetch client
│       ├── auth.js                # Session keeper & authentication
│       ├── permissions.js         # Client-side permission enforcer (can)
│       ├── theme.js               # Dark/Light theme manager
│       ├── components\            # Animated Modal, Toast notifications, Confirm dialogs
│       └── views\                 # Dynamic SPA Views (Dashboard, Orders, Catalog, Ledgers, Matrix)
├── index.php                      # Application Entry Point & Single Page App Shell
└── .htaccess                      # Apache rewrite & authorization header pass-through
```

---

## 🚀 Database Re-Initialization (if ever needed)

```powershell
php c:\wamp64\www\DMS\app\database\setup.php
```
