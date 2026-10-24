-- MySQL dump 10.13  Distrib 8.4.7, for Win64 (x86_64)
--
-- Host: localhost    Database: dms_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `dms_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `dms_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `dms_db`;

--
-- Table structure for table `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(64) NOT NULL,
  `setting_value` longtext NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_settings`
--

LOCK TABLES `company_settings` WRITE;
/*!40000 ALTER TABLE `company_settings` DISABLE KEYS */;
INSERT INTO `company_settings` VALUES (1,'company_name','Apex Distribution Logistics Ltd','2026-10-23 23:40:23'),(2,'tagline','Premier FMCG Wholesale & Logistics Network','2026-10-23 23:40:23'),(3,'address','Plot 102-B, Industrial Estate Phase 2, Lahore','2026-10-23 23:40:23'),(4,'phone','+92 42 35551234','2026-10-23 23:40:23'),(5,'email','info@apexdistribution.pk','2026-10-23 23:40:23'),(6,'currency','Rs.','2026-10-23 23:40:23'),(7,'tax_rate','0','2026-10-24 08:04:05'),(8,'default_credit_days','30','2026-10-23 23:40:23'),(9,'default_credit_limit_paisa','50000000','2026-10-23 23:40:23'),(10,'receipt_footer','Thank you for your business! For inquiries call +92 42 35551234.','2026-10-23 23:40:23');
/*!40000 ALTER TABLE `company_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_ledger`
--

DROP TABLE IF EXISTS `customer_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(64) NOT NULL,
  `type` varchar(32) NOT NULL,
  `description` text DEFAULT NULL,
  `reference_id` varchar(64) DEFAULT NULL,
  `debit_paisa` bigint(20) NOT NULL DEFAULT 0,
  `credit_paisa` bigint(20) NOT NULL DEFAULT 0,
  `balance_paisa` bigint(20) NOT NULL DEFAULT 0,
  `recorded_by` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`,`created_at`),
  KEY `reference_id` (`reference_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_ledger`
--

LOCK TABLES `customer_ledger` WRITE;
/*!40000 ALTER TABLE `customer_ledger` DISABLE KEYS */;
INSERT INTO `customer_ledger` VALUES (1,'CUST-1001','INVOICE','Invoice INV-2026-1001 generated for order ORD-2026-1001','INV-2026-1001',2520000,0,2520000,'SYSTEM','2026-10-23 23:40:23'),(2,'CUST-1002','INVOICE','Invoice INV-2026-1002 for delivered order ORD-2026-1002','INV-2026-1002',1648500,0,3748500,'Laiq Ahmad Khawaja','2026-10-24 07:25:06'),(3,'CUST-1001','INVOICE','Invoice INV-20261023-3265 for delivered order ORD-20261023-3265 (Received by: Haji Muhammad Yaqoob)','INV-20261023-3265',336000,0,4800000,'Laiq Ahmad Khawaja','2026-10-24 07:39:44'),(4,'CUST-1001','PAYMENT','Cash on Delivery for order ORD-20261023-3265','PAY-20261024-4309',0,336000,4800000,'Laiq Ahmad Khawaja','2026-10-24 07:39:44'),(5,'CUST-1001','INVOICE','Invoice INV-20261023-1887 for delivered order ORD-20261023-1887','INV-20261023-1887',336000,0,5136000,'Laiq Ahmad Khawaja','2026-10-24 07:41:39'),(6,'CUST-1004','INVOICE','Invoice INV-20261024-8947 for delivered order ORD-20261024-8947','INV-20261024-8947',536550,0,9436550,'Laiq Ahmad Khawaja','2026-10-24 08:03:50'),(7,'CUST-1001','PAYMENT','Payment Received (Cash)','PAY-20261024-6931',0,250000,4886000,'Laiq Ahmad Khawaja','2026-10-24 08:06:22'),(8,'CUST-1004','INVOICE','Invoice INV-20261024-1049 for delivered order ORD-20261024-1049','INV-20261024-1049',56700,0,9493250,'Laiq Ahmad Khawaja','2026-10-24 08:09:50'),(9,'CUST-1003','INVOICE','Invoice INV-2026-1003 for delivered order ORD-2026-1003 (Received by: Haji Muhammad Yaqoob)','INV-2026-1003',3677500,0,15827500,'Laiq Ahmad Khawaja','2026-10-24 08:13:10'),(10,'CUST-1003','PAYMENT','Payment (Cash) for order ORD-2026-1003','PAY-20261024-1430',0,250000,15827500,'Laiq Ahmad Khawaja','2026-10-24 08:13:11'),(11,'CUST-1004','INVOICE','Invoice INV-2026-1004 for delivered order ORD-2026-1004 (Received by: Ali Shair)','INV-2026-1004',1438500,0,10931750,'Laiq Ahmad Khawaja','2026-10-24 08:16:00'),(12,'CUST-1001','INVOICE','Invoice INV-20261024-5040 for delivered order ORD-20261024-5040 (Received by: aa)','INV-20261024-5040',320000,0,4886000,'Laiq Ahmad Khawaja','2026-10-24 10:22:57'),(13,'CUST-1001','PAYMENT','Payment (Cash) for order ORD-20261024-5040','PAY-20261024-9238',0,320000,4886000,'Laiq Ahmad Khawaja','2026-10-24 10:22:57');
/*!40000 ALTER TABLE `customer_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(64) NOT NULL,
  `code` varchar(32) NOT NULL,
  `shop_name` varchar(191) NOT NULL,
  `owner_name` varchar(128) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `territory_route` varchar(64) NOT NULL,
  `assigned_sales_rep_id` varchar(64) DEFAULT NULL,
  `credit_limit_paisa` bigint(20) NOT NULL DEFAULT 0,
  `current_balance_paisa` bigint(20) NOT NULL DEFAULT 0,
  `payment_terms_days` int(11) DEFAULT 15,
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `territory_route` (`territory_route`),
  KEY `active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('CUST-1001','RET-N101','Al-Madina Super Store','Haji Muhammad Yaqoob','+92 300 2345671','Shop 12-14, Commercial Center, North Route','North Route (Commercial)','usr_sales_1',25000000,4886000,15,1,'2026-10-23 23:40:23','2026-10-24 08:06:22'),('CUST-1002','RET-N102','Bismillah General Store','Sheikh Rizwan','+92 300 2345672','Plot 45, Main Market, North Route','North Route (Commercial)','usr_sales_1',15000000,3748500,15,1,'2026-10-23 23:40:23','2026-10-24 07:25:06'),('CUST-1003','RET-S201','Khyber Wholesale Mart','Arbab Khan','+92 300 2345673','Gali 4, Akbari Mandi, South Bazaar','South Bazaar (Wholesale)','usr_sales_1',50000000,15827500,15,1,'2026-10-23 23:40:23','2026-10-24 08:13:10'),('CUST-1004','RET-S202','Ittihad Cash & Carry','Malik Zubair','+92 300 2345674','Circular Road, South Bazaar','South Bazaar (Wholesale)','usr_sales_1',40000000,10931750,15,1,'2026-10-23 23:40:23','2026-10-24 08:16:00'),('CUST-1005','RET-E301','Chaman Corner Store','Imran Butt','+92 300 2345675','Sector C Chowk, East Suburb','East Suburb (Retail)','usr_sales_1',10000000,1250000,15,1,'2026-10-23 23:40:23','2026-10-23 23:40:23'),('CUST-1006','RET-W401','Millat Industrial Canteen','Chaudhry Afzal','+92 300 2345676','Industrial Area Gate 3, West Corridor','West Industrial Corridor','usr_sales_1',20000000,3100000,15,1,'2026-10-23 23:40:23','2026-10-23 23:40:23');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_collections`
--

DROP TABLE IF EXISTS `delivery_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_collections` (
  `id` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `driver_id` varchar(64) NOT NULL,
  `customer_id` varchar(64) NOT NULL,
  `amount_paisa` bigint(20) NOT NULL,
  `payment_method` varchar(32) NOT NULL,
  `reference_number` varchar(64) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `driver_id` (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_collections`
--

LOCK TABLES `delivery_collections` WRITE;
/*!40000 ALTER TABLE `delivery_collections` DISABLE KEYS */;
INSERT INTO `delivery_collections` VALUES ('COL-6adc224702b34','ORD-2026-1003','usr_laiq_admin','CUST-1003',250000,'Cash','CASH-REC-991','Delivery finalized as DELIVERED. Received by: Haji Muhammad Yaqoob (Shop Owner)','2026-10-24 08:13:11'),('COL-6adc40b1d8d0b','ORD-20261024-5040','usr_laiq_admin','CUST-1001',320000,'Cash','','Delivery finalized as DELIVERED. Received by: aa (Authorized)','2026-10-24 10:22:57');
/*!40000 ALTER TABLE `delivery_collections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_actions`
--

DROP TABLE IF EXISTS `module_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `action_slug` varchar(32) NOT NULL,
  `label` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_module_action` (`module_id`,`action_slug`),
  CONSTRAINT `module_actions_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_actions`
--

LOCK TABLES `module_actions` WRITE;
/*!40000 ALTER TABLE `module_actions` DISABLE KEYS */;
INSERT INTO `module_actions` VALUES (1,1,'view','View Dashboard','Access KPI dashboard overview'),(2,1,'export','Export Analytics','Export summary metrics and graphs'),(3,2,'view','Access Catalog','View book order screen & catalog'),(4,2,'create','Submit Order','Book and submit new orders'),(5,2,'apply_discount','Apply Special Discount','Apply custom line or order discounts'),(6,3,'view','View Orders','View order list and details'),(7,3,'edit','Edit Order','Modify submitted order lines before approval'),(8,3,'delete','Delete Order','Delete draft or submitted orders'),(9,3,'approve','Approve Order','Approve order for warehouse dispatch'),(10,3,'dispatch','Dispatch Order','Handover order to delivery fleet'),(11,3,'deliver','Mark Delivered','Confirm customer delivery and invoice'),(12,3,'cancel','Cancel Order','Cancel order with reason notes'),(13,3,'print_invoice','Print Tax Invoice','Print sales invoice & delivery challan'),(14,4,'view','View Deliveries','View driver deliveries and route run-sheets'),(15,4,'assign_driver','Assign Fleet Driver','Assign vehicles and drivers to orders'),(16,4,'confirm_delivery','Confirm Delivery','Mark order delivery status on field'),(17,4,'collect_cash','Collect Cash on Delivery','Record COD payments from retail clients'),(18,5,'view','View Catalog','View product list, stock and rates'),(19,5,'create','Add Product','Create new product records and SKUs'),(20,5,'edit','Edit Product','Update product prices, categories, and pack sizes'),(21,5,'delete','Deactivate Product','Archive or delete products'),(22,5,'adjust_stock','Stock Adjustment','Perform manual inventory stock corrections'),(23,5,'export','Export Products','Export product catalog to CSV'),(24,6,'view','View Customers','View retail shop accounts & contacts'),(25,6,'create','Register Customer','Onboard new retail accounts'),(26,6,'edit','Edit Customer','Update customer information & payment terms'),(27,6,'delete','Deactivate Customer','Archive or remove customer accounts'),(28,6,'override_credit','Override Credit Limit','Approve orders exceeding credit limit'),(29,6,'export','Export Customers','Export customer list and ledger balances'),(30,7,'view','View Ledger','View debit/credit balance history'),(31,7,'export','Export Ledger','Export customer ledger entries to CSV'),(32,7,'print_statement','Print Statement','Print formal account statement'),(33,8,'view','View Inventory','Inspect stock on hand and reorder alerts'),(34,8,'receive_stock','Receive GRN Stock','Record goods received note from supplier'),(35,8,'adjust_stock','Stock Audit Correction','Audit and correct warehouse stock count'),(36,8,'export','Export Movements','Export stock movement history log'),(37,9,'view','View Recovery','View overdue balances & payment vouchers'),(38,9,'record_payment','Record Payment','Log customer collection by Cash/Cheque/Bank'),(39,9,'delete_payment','Void Payment','Cancel or void incorrect payment entries'),(40,9,'export','Export Collections','Export collection reports to CSV'),(41,10,'view','View Reports','Access sales, profit, stock and tax reports'),(42,10,'export_csv','Export CSV','Export raw report tables to spreadsheet'),(43,10,'export_pdf','Print Reports','Format printable summary reports'),(44,11,'view','View Roles','Inspect system roles and granted privileges'),(45,11,'create','Create Role','Create new custom role definitions'),(46,11,'edit','Edit Role','Update role metadata and descriptions'),(47,11,'delete','Delete Role','Remove non-system custom roles'),(48,11,'manage_permissions','Manage Permissions Matrix','Assign and toggle granular privileges'),(49,12,'view','View Staff','View system users and field personnel'),(50,12,'create','Create User','Add new employee account and assign role'),(51,12,'edit','Edit User','Update staff details, route and status'),(52,12,'delete','Deactivate User','Suspend employee access'),(53,12,'reset_password','Reset Password','Force reset user security credentials'),(54,13,'view','View Settings','View distribution configuration'),(55,13,'edit_company','Edit Company Profile','Update company address, tax and invoice terms'),(56,13,'database_backup','System Maintenance','Trigger database backups and audit maintenance');
/*!40000 ALTER TABLE `module_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `icon` varchar(32) DEFAULT 'folder',
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES (1,'Dashboard','dashboard','bar-chart-2',1),(2,'Book Order','order_create','plus-circle',2),(3,'Order Tracking','orders','package',3),(4,'Deliveries','delivery','truck',4),(5,'Product Catalog','products','tag',5),(6,'Customers','customers','users',6),(7,'Customer Ledger','customer_ledger','file-text',7),(8,'Inventory & Stock','inventory','archive',8),(9,'Recovery & Payments','recovery','dollar-sign',9),(10,'Reports & Analytics','reports','trending-up',10),(11,'Roles & Permissions','roles','shield',11),(12,'Users & Staff','users','user-check',12),(13,'System Settings','settings','settings',13);
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_events`
--

DROP TABLE IF EXISTS `order_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(64) NOT NULL,
  `action` varchar(64) NOT NULL,
  `from_status` varchar(32) DEFAULT NULL,
  `to_status` varchar(32) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `user_name` varchar(128) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_events`
--

LOCK TABLES `order_events` WRITE;
/*!40000 ALTER TABLE `order_events` DISABLE KEYS */;
INSERT INTO `order_events` VALUES (1,'ORD-2026-1001','SUBMIT_ORDER',NULL,'submitted','Order placed via mobile catalog','usr_sales_1','Tariq Mahmood (North Rep)','2026-10-23 23:40:23'),(2,'ORD-2026-1002','SUBMIT_ORDER',NULL,'submitted','Order placed via mobile catalog','usr_sales_1','Tariq Mahmood (North Rep)','2026-10-23 23:40:23'),(3,'ORD-2026-1003','SUBMIT_ORDER',NULL,'submitted','Order placed via mobile catalog','usr_sales_2','Bilal Aslam (South Rep)','2026-10-23 23:40:23'),(4,'ORD-2026-1004','SUBMIT_ORDER',NULL,'submitted','Order placed via mobile catalog','usr_sales_2','Bilal Aslam (South Rep)','2026-10-23 23:40:23'),(5,'ORD-20261023-1887','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-23 23:56:15'),(6,'ORD-20261023-3265','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-23 23:57:34'),(7,'ORD-20261024-1049','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:22:34'),(8,'ORD-20261024-3027','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:22:42'),(9,'ORD-2026-1002','STATUS_DELIVERED','dispatched','delivered','Delivered by fleet driver','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:25:06'),(10,'ORD-20261023-3265','STATUS_APPROVED','submitted','approved','Approved for warehouse picking','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:25:25'),(11,'ORD-20261023-3265','STATUS_DISPATCHED','approved','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:25:48'),(12,'ORD-20261023-3265','STATUS_DELIVERED','dispatched','delivered','Delivered to Haji Muhammad Yaqoob (Shop Owner)','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:39:44'),(13,'ORD-20261024-4954','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:39:54'),(14,'ORD-20261023-1887','STATUS_APPROVED','submitted','approved','Approved for warehouse picking','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:40:39'),(15,'ORD-20261023-1887','STATUS_DISPATCHED','approved','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:40:47'),(16,'ORD-20261023-1887','STATUS_DELIVERED','dispatched','delivered','Delivered by fleet driver','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 07:41:39'),(17,'ORD-20261024-8947','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:01:13'),(18,'ORD-20261024-8947','STATUS_APPROVED','submitted','approved','Approved for warehouse picking','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:02:04'),(19,'ORD-20261024-8947','STATUS_DISPATCHED','approved','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:02:33'),(20,'ORD-20261024-8947','STATUS_DELIVERED','dispatched','delivered','Delivery confirmed and receipt verified','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:03:50'),(21,'ORD-20261024-1049','STATUS_DISPATCHED','submitted','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:09:07'),(22,'ORD-20261024-1049','STATUS_DELIVERED','dispatched','delivered','Delivered by fleet driver','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:09:50'),(23,'ORD-2026-1003','STATUS_DISPATCHED','approved','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:10:46'),(24,'ORD-2026-1003','STATUS_OUT_FOR_DELIVERY','dispatched','out_for_delivery','Driver acknowledged and started route','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:13:09'),(25,'ORD-2026-1003','STATUS_DELIVERED','out_for_delivery','delivered','Delivery finalized as DELIVERED. Received by: Haji Muhammad Yaqoob (Shop Owner)','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:13:11'),(26,'ORD-20261024-9906','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:13:47'),(27,'ORD-2026-1004','STATUS_DISPATCHED','submitted','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:15:08'),(28,'ORD-2026-1004','STATUS_DELIVERED','dispatched','delivered','Delivered to Ali Shair (Owner)','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:16:00'),(29,'ORD-20261024-5040','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:22:14'),(30,'ORD-20261024-5040','STATUS_DISPATCHED','submitted','dispatched','Dispatched','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:31:42'),(31,'ORD-20261024-5786','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:38:21'),(32,'ORD-20261024-6677','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 08:48:30'),(33,'ORD-20261024-3513','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:04:25'),(34,'ORD-20261024-4729','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:19:03'),(35,'ORD-20261024-1589','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:19:47'),(36,'ORD-20261024-2833','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:20:25'),(37,'ORD-20261024-9364','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:21:06'),(38,'ORD-20261024-9410','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:21:38'),(39,'ORD-20261024-9519','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:22:44'),(40,'ORD-20261024-2200','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 09:41:10'),(41,'ORD-20261024-2880','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:06:46'),(42,'ORD-20261024-6369','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:07:26'),(43,'ORD-20261024-9352','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:15:06'),(44,'ORD-20261024-3092','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:18:00'),(45,'ORD-20261024-5040','STATUS_DELIVERED','dispatched','delivered','Delivery finalized as DELIVERED. Received by: aa (Authorized)','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:22:57'),(46,'ORD-20261024-7881','ORDER_SUBMITTED',NULL,'submitted','Order placed via digital catalog','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24 10:28:05');
/*!40000 ALTER TABLE `order_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `product_name` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price_paisa` bigint(20) NOT NULL,
  `line_total_paisa` bigint(20) NOT NULL,
  `delivered_quantity` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,'ORD-2026-1001','PRD-101','Nestle Pure Life 1.5L (Case of 6)',20,54000,1080000,NULL),(2,'ORD-2026-1001','PRD-102','Coca Cola 1.5L PET (Case of 6)',20,72000,1440000,NULL),(3,'ORD-2026-1002','PRD-104','Lays Classic Salted 38g (Box 24)',5,180000,900000,NULL),(4,'ORD-2026-1002','PRD-107','Tapal Danedar Tea 400g Pouch',10,62000,620000,NULL),(5,'ORD-2026-1003','PRD-108','Dalda Cooking Oil 1L Pouch (Ctn 12)',5,710000,3550000,5),(6,'ORD-2026-1004','PRD-103','Red Bull Energy Drink 250ml (Tray 24)',2,690000,1380000,NULL),(7,'ORD-20261023-1887','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(8,'ORD-20261023-3265','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(9,'ORD-20261024-1049','PRD-112','Colgate MaxFresh 100g Toothpaste',2,27000,54000,NULL),(10,'ORD-20261024-3027','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(11,'ORD-20261024-4954','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(12,'ORD-20261024-8947','PRD-112','Colgate MaxFresh 100g Toothpaste',1,27000,27000,NULL),(13,'ORD-20261024-8947','PRD-110','Dettol Original Soap 135g (Bundle 4)',1,76000,76000,NULL),(14,'ORD-20261024-8947','PRD-105','Kurkure Chutney Chaska 45g (Box 24)',2,175000,350000,NULL),(15,'ORD-20261024-8947','PRD-111','Surf Excel Quick Wash 1kg Bag',1,58000,58000,NULL),(16,'ORD-20261024-9906','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(17,'ORD-20261024-5040','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,1),(18,'ORD-20261024-5786','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(19,'ORD-20261024-6677','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(20,'ORD-20261024-3513','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(21,'ORD-20261024-4729','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(22,'ORD-20261024-1589','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(23,'ORD-20261024-2833','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(24,'ORD-20261024-9364','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(25,'ORD-20261024-9410','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(26,'ORD-20261024-9519','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(27,'ORD-20261024-2200','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(28,'ORD-20261024-2880','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(29,'ORD-20261024-6369','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(30,'ORD-20261024-9352','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(31,'ORD-20261024-3092','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL),(32,'ORD-20261024-7881','PRD-106','Cadbury Dairy Milk 36g (Box 24)',1,320000,320000,NULL);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(64) NOT NULL,
  `order_number` varchar(64) NOT NULL,
  `customer_id` varchar(64) NOT NULL,
  `customer_name` varchar(191) NOT NULL,
  `customer_code` varchar(64) DEFAULT NULL,
  `customer_phone` varchar(32) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `order_taker_id` varchar(64) NOT NULL,
  `order_taker_name` varchar(128) NOT NULL,
  `order_taker_signature` longtext DEFAULT NULL,
  `assigned_delivery_driver_id` varchar(64) DEFAULT NULL,
  `dispatcher_id` varchar(64) DEFAULT NULL,
  `dispatcher_name` varchar(128) DEFAULT NULL,
  `dispatcher_signature` longtext DEFAULT NULL,
  `driver_name` varchar(128) DEFAULT NULL,
  `driver_signature` longtext DEFAULT NULL,
  `route` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'submitted',
  `subtotal_paisa` bigint(20) NOT NULL DEFAULT 0,
  `tax_paisa` bigint(20) NOT NULL DEFAULT 0,
  `discount_paisa` bigint(20) NOT NULL DEFAULT 0,
  `total_paisa` bigint(20) NOT NULL DEFAULT 0,
  `payment_terms` varchar(64) DEFAULT 'Cash on Delivery',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dispatched_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `received_by_name` varchar(128) DEFAULT NULL,
  `received_by_relation` varchar(64) DEFAULT NULL,
  `pod_signature` longtext DEFAULT NULL,
  `pod_notes` text DEFAULT NULL,
  `undelivered_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `customer_id` (`customer_id`),
  KEY `order_taker_id` (`order_taker_id`),
  KEY `assigned_delivery_driver_id` (`assigned_delivery_driver_id`),
  KEY `status` (`status`),
  KEY `route` (`route`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('ORD-2026-1001','ORD-2026-1001','CUST-1001','Al-Madina Super Store','RET-N101',NULL,NULL,'usr_sales_1','Tariq Mahmood (North Rep)',NULL,'usr_driver_1','usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-2026-1001_20261024_065830_99dbba.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-2026-1001_20261024_065830_ee9928.svg','North Route (Commercial)','delivered',2400000,120000,0,2520000,'Cash on Delivery',NULL,'2026-10-23 23:40:23','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-2026-1002','ORD-2026-1002','CUST-1002','Bismillah General Store','RET-N102',NULL,NULL,'usr_sales_1','Tariq Mahmood (North Rep)',NULL,'usr_driver_1','usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-2026-1002_20261024_065830_c3493a.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-2026-1002_20261024_065830_0d90dd.svg','North Route (Commercial)','delivered',1570000,78500,0,1648500,'Cash on Delivery',NULL,'2026-10-23 23:40:23','2026-10-24 09:58:30',NULL,'2026-10-24 07:25:06',NULL,NULL,NULL,NULL,NULL),('ORD-2026-1003','ORD-2026-1003','CUST-1003','Khyber Wholesale Mart','RET-S201',NULL,NULL,'usr_sales_2','Bilal Aslam (South Rep)',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-2026-1003_20261024_065830_1671b2.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-2026-1003_20261024_065830_e93815.svg','South Bazaar (Wholesale)','delivered',3550000,177500,50000,3677500,'Cash on Delivery',NULL,'2026-10-23 23:40:23','2026-10-24 09:58:30','2026-10-24 08:10:46','2026-10-24 08:13:11','Haji Muhammad Yaqoob','Shop Owner','/DMS/uploads/signatures/pod/pod_ORD-2026-1003_20261024_065830_e7bd03.png','Delivered in mint factory condition',NULL),('ORD-2026-1004','ORD-2026-1004','CUST-1004','Ittihad Cash & Carry','RET-S202',NULL,NULL,'usr_sales_2','Bilal Aslam (South Rep)',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-2026-1004_20261024_065830_1763f8.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-2026-1004_20261024_065830_04f7c7.svg','South Bazaar (Wholesale)','delivered',1370000,68500,0,1438500,'Cash on Delivery',NULL,'2026-10-23 23:40:23','2026-10-24 09:58:30','2026-10-24 08:15:08','2026-10-24 08:16:00','Ali Shair','Owner','/DMS/uploads/signatures/pod/pod_ORD-2026-1004_20261024_065830_77d63a.png',NULL,NULL),('ORD-20261023-1887','ORD-20261023-1887','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-20261023-1887_20261024_065830_1d9f17.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261023-1887_20261024_065830_873e1b.svg','North Route (Commercial)','delivered',320000,16000,0,336000,'Cash on Delivery','','2026-10-23 23:56:15','2026-10-24 09:58:30','2026-10-24 07:40:47','2026-10-24 07:41:39',NULL,NULL,NULL,NULL,NULL),('ORD-20261023-3265','ORD-20261023-3265','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-20261023-3265_20261024_065830_3d07c6.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261023-3265_20261024_065830_3151a6.svg','North Route (Commercial)','delivered',320000,16000,0,336000,'Cash on Delivery','','2026-10-23 23:57:34','2026-10-24 09:58:30','2026-10-24 07:25:48','2026-10-24 07:39:44','Haji Muhammad Yaqoob','Shop Owner','/DMS/uploads/signatures/pod/pod_ORD-20261023-3265_20261024_065830_e7c817.png',NULL,NULL),('ORD-20261024-1049','ORD-20261024-1049','CUST-1004','Ittihad Cash & Carry','RET-S202','+92 300 2345674','Circular Road, South Bazaar','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-1049_20261024_065830_1f5906.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-1049_20261024_065830_ea6d59.svg','South Bazaar (Wholesale)','delivered',54000,2700,0,56700,'Cash on Delivery','','2026-10-24 07:22:34','2026-10-24 09:58:30','2026-10-24 08:09:07','2026-10-24 08:09:50',NULL,NULL,NULL,NULL,NULL),('ORD-20261024-1589','ORD-20261024-1589','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-1589_20261024_065830_e64c3a.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:19:47','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-2200','ORD-20261024-2200','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-2200_20261024_065830_5fd5f1.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:41:10','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-2833','ORD-20261024-2833','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-2833_20261024_065830_b7c62b.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:20:25','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-2880','ORD-20261024-2880','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-2880_20261024_050646_e0b931.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 10:06:46','2026-10-24 10:06:46',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-3027','ORD-20261024-3027','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,'usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-3027_20261024_065830_1a3536.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-3027_20261024_065830_5fb1ae.svg','North Route (Commercial)','submitted',320000,16000,0,336000,'Cash on Delivery','','2026-10-24 07:22:42','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-3092','ORD-20261024-3092','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-3092_20261024_051800_8c5c3c.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 10:18:00','2026-10-24 10:18:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-3513','ORD-20261024-3513','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:04:25','2026-10-24 09:04:25',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-4729','ORD-20261024-4729','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-4729_20261024_065830_176b94.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:19:03','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-4954','ORD-20261024-4954','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,'usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-4954_20261024_065830_7a1006.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-4954_20261024_065830_c5e6e3.svg','North Route (Commercial)','submitted',320000,16000,0,336000,'Cash on Delivery','','2026-10-24 07:39:54','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-5040','ORD-20261024-5040','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-5040_20261024_065830_779465.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-5040_20261024_065830_963fdf.svg','North Route (Commercial)','delivered',320000,0,0,320000,'Cash on Delivery','','2026-10-24 08:22:14','2026-10-24 10:22:57','2026-10-24 08:31:42','2026-10-24 10:22:57','aa',NULL,'/DMS/uploads/signatures/pod/pod_ORD-20261024-5040_20261024_052257_4fbe65.png',NULL,NULL),('ORD-20261024-5786','ORD-20261024-5786','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,'usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-5786_20261024_065830_5ad801.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-5786_20261024_065830_33a644.svg','North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 08:38:21','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-6369','ORD-20261024-6369','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-6369_20261024_050726_2ce1cd.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 10:07:26','2026-10-24 10:07:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-6677','ORD-20261024-6677','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,'usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-6677_20261024_065830_d9bc1e.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-6677_20261024_065830_70b4a4.svg','North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 08:48:30','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-7881','ORD-20261024-7881','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-7881_20261024_052805_52d53a.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 10:28:05','2026-10-24 10:28:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-8947','ORD-20261024-8947','CUST-1004','Ittihad Cash & Carry','RET-S202','+92 300 2345674','Circular Road, South Bazaar','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,'usr_driver_1','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-8947_20261024_065830_83fc67.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-8947_20261024_065830_e4b668.svg','South Bazaar (Wholesale)','delivered',511000,25550,0,536550,'Cash on Delivery','','2026-10-24 08:01:13','2026-10-24 09:58:30','2026-10-24 08:02:33','2026-10-24 08:03:50',NULL,NULL,NULL,NULL,NULL),('ORD-20261024-9352','ORD-20261024-9352','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-9352_20261024_051506_ebaccc.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 10:15:06','2026-10-24 10:15:06',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-9364','ORD-20261024-9364','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-9364_20261024_065830_08f543.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:21:06','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-9410','ORD-20261024-9410','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-9410_20261024_065830_91e1c5.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:21:38','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-9519','ORD-20261024-9519','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja','/DMS/uploads/signatures/bookers/booker_ORD-20261024-9519_20261024_065830_981b4a.png',NULL,NULL,NULL,NULL,NULL,NULL,'North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 09:22:44','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('ORD-20261024-9906','ORD-20261024-9906','CUST-1001','Al-Madina Super Store','RET-N101','+92 300 2345671','Shop 12-14, Commercial Center, North Route','usr_laiq_admin','Laiq Ahmad Khawaja',NULL,NULL,'usr_warehouse_1','Rashid Minhas (Warehouse Head)','/DMS/uploads/signatures/dispatchers/disp_ORD-20261024-9906_20261024_065830_aba5ca.svg','Kamran Akmal (Fleet Driver)','/DMS/uploads/signatures/drivers/driver_ORD-20261024-9906_20261024_065830_e57eb9.svg','North Route (Commercial)','submitted',320000,0,0,320000,'Cash on Delivery','','2026-10-24 08:13:47','2026-10-24 09:58:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_allocations`
--

DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(64) NOT NULL,
  `invoice_id` varchar(64) NOT NULL,
  `invoice_number` varchar(64) NOT NULL,
  `allocated_amount_paisa` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  KEY `invoice_id` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_allocations`
--

LOCK TABLES `payment_allocations` WRITE;
/*!40000 ALTER TABLE `payment_allocations` DISABLE KEYS */;
INSERT INTO `payment_allocations` VALUES (1,'PAY-20261024-4309','INV-20261023-3265','INV-20261023-3265',336000),(2,'PAY-20261024-6931','INV-2026-1001','INV-2026-1001',250000),(3,'PAY-20261024-1430','INV-2026-1003','INV-2026-1003',250000),(4,'PAY-20261024-9238','INV-20261024-5040','INV-20261024-5040',320000);
/*!40000 ALTER TABLE `payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(64) NOT NULL,
  `payment_number` varchar(64) NOT NULL,
  `customer_id` varchar(64) NOT NULL,
  `customer_name` varchar(191) NOT NULL,
  `amount_paisa` bigint(20) NOT NULL,
  `payment_method` varchar(32) NOT NULL,
  `reference_number` varchar(64) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `collected_by` varchar(64) DEFAULT NULL,
  `collected_by_name` varchar(128) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_number` (`payment_number`),
  KEY `customer_id` (`customer_id`),
  KEY `payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('PAY-20261024-1430','PAY-20261024-1430','CUST-1003','Khyber Wholesale Mart',250000,'Cash','CASH-REC-991','COD received by Laiq Ahmad Khawaja','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24','2026-10-24 08:13:11'),('PAY-20261024-4309','PAY-20261024-4309','CUST-1001','Al-Madina Super Store',336000,'Cash on Delivery','COD-ORD-20261023-3265','COD received by driver Laiq Ahmad Khawaja','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24','2026-10-24 07:39:44'),('PAY-20261024-6931','PAY-20261024-6931','CUST-1001','Al-Madina Super Store',250000,'Cash','','','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24','2026-10-24 08:06:22'),('PAY-20261024-9238','PAY-20261024-9238','CUST-1001','Al-Madina Super Store',320000,'Cash','COD-ORD-20261024-5040','COD received by Laiq Ahmad Khawaja','usr_laiq_admin','Laiq Ahmad Khawaja','2026-10-24','2026-10-24 10:22:57');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(64) NOT NULL,
  `name` varchar(191) NOT NULL,
  `sku` varchar(64) NOT NULL,
  `barcode` varchar(64) DEFAULT NULL,
  `category` varchar(64) NOT NULL,
  `unit` varchar(32) DEFAULT 'unit',
  `pack_size` int(11) DEFAULT 1,
  `cost_price_paisa` bigint(20) NOT NULL DEFAULT 0,
  `selling_price_paisa` bigint(20) NOT NULL DEFAULT 0,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `reserved_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock_level` int(11) NOT NULL DEFAULT 10,
  `expiry_date` date DEFAULT NULL,
  `batch_number` varchar(64) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `category` (`category`),
  KEY `active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('PRD-101','Nestle Pure Life 1.5L (Case of 6)','BEV-WAT-001','896001000003','Beverages','case',1,45000,54000,140,0,20,'2026-11-05','BATCH-756B1E-1126',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-102','Coca Cola 1.5L PET (Case of 6)','BEV-SOD-002','896001000002','Beverages','case',1,60000,72000,85,0,15,'2026-10-29','BATCH-4D554F-1026',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-103','Red Bull Energy Drink 250ml (Tray 24)','BEV-ENG-003','896001000001','Beverages','tray',1,580000,690000,40,0,10,'2026-10-20','BATCH-0D5420-1026',1,'2026-10-23 23:40:23','2026-10-24 09:38:56'),('PRD-104','Lays Classic Salted 38g (Box 24)','SNK-CHIP-004','896001000010','Snacks','box',1,144000,180000,110,0,25,'2026-10-12','BATCH-60E37E-1126',1,'2026-10-23 23:40:23','2026-10-24 09:38:56'),('PRD-105','Kurkure Chutney Chaska 45g (Box 24)','SNK-CHIP-005','896001000011','Snacks','box',1,140000,175000,93,0,20,'2026-11-15','BATCH-08B5B0-1126',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-106','Cadbury Dairy Milk 36g (Box 24)','SNK-CHO-006','896001000012','Confectionery','box',1,260000,320000,44,0,15,'2026-11-22','BATCH-0AECF3-1126',1,'2026-10-23 23:40:23','2026-10-24 10:28:05'),('PRD-107','Tapal Danedar Tea 400g Pouch','GRO-TEA-007','896001000006','Grocery','pack',1,52000,62000,140,0,30,'2026-12-08','BATCH-39623A-1226',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-108','Dalda Cooking Oil 1L Pouch (Ctn 12)','GRO-OIL-008','896001000004','Grocery','carton',1,620000,710000,50,0,10,'2026-12-23','BATCH-20BF4A-1226',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-109','Shan Biryani Masala 50g (Disp 12)','GRO-SPC-009','896001000005','Spices','display',1,96000,120000,180,0,40,'2027-01-22','BATCH-227EEB-0127',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-110','Dettol Original Soap 135g (Bundle 4)','PC-SOAP-010','896001000009','Personal Care','bundle',1,62000,76000,89,0,20,'2027-02-21','BATCH-2466E9-0227',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-111','Surf Excel Quick Wash 1kg Bag','HH-DET-011','896001000007','Household','bag',1,48000,58000,104,0,25,'2027-04-22','BATCH-B6A3C6-0427',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-112','Colgate MaxFresh 100g Toothpaste','PC-ORAL-012','896001000008','Personal Care','box',1,21000,27000,127,0,25,'2027-06-21','BATCH-CFBABE-0627',1,'2026-10-23 23:40:23','2026-10-24 09:29:33'),('PRD-1703','Dairy Milk Chocolate 100g','TEST-EXP-2885','896337847138','ConfectioneryBeverages','unit',1,120000,150000,500,0,10,'0000-00-00','LOT-CHO-2026',1,'2026-10-24 09:40:53','2026-10-24 09:40:53'),('PRD-3308','Verification Test Energy Drink 250ml','TEST-9270','896765328782','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2027-10-24','BATCH-B74E9B-1027',1,'2026-10-24 08:48:33','2026-10-24 09:29:33'),('PRD-4001','Verification Test Energy Drink 250ml','TEST-1058','896400692564','BeveragesBeverages','unit',1,140000,195000,0,0,10,NULL,NULL,1,'2026-10-24 10:15:10','2026-10-24 10:15:10'),('PRD-4102','Verification Test Energy Drink 250ml','TEST-3117','896461112400','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2027-12-18','BATCH-3AD60C-1227',1,'2026-10-24 09:22:47','2026-10-24 09:29:33'),('PRD-4368','Verification Test Energy Drink 250ml','TEST-1471','896735661179','BeveragesBeverages','unit',1,140000,195000,0,0,10,NULL,NULL,1,'2026-10-24 10:28:08','2026-10-24 10:28:08'),('PRD-5019','Verification Test Energy Drink 250ml','TEST-9762','896754687868','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2028-03-07','BATCH-942797-0328',1,'2026-10-24 09:04:29','2026-10-24 09:29:33'),('PRD-6142','Verification Test Energy Drink 250ml','TEST-9316','896001000017','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2026-11-05','BATCH-ECB2A3-1126',1,'2026-10-24 08:13:51','2026-10-24 09:29:33'),('PRD-6200','Verification Test Energy Drink 250ml','TEST-3197','896001000015','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2026-10-29','BATCH-5E490E-1026',1,'2026-10-24 07:22:45','2026-10-24 09:29:33'),('PRD-6498','Verification Test Energy Drink 250ml','TEST-5843','896212632337','BeveragesBeverages','unit',1,140000,195000,0,0,10,NULL,NULL,1,'2026-10-24 10:18:03','2026-10-24 10:18:03'),('PRD-6546','Verification Test Energy Drink 250ml','TEST-1372','896001000013','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2026-10-30','BATCH-677199-1026',1,'2026-10-23 23:57:37','2026-10-24 09:29:33'),('PRD-7890','Verification Test Energy Drink 250ml','TEST-8273','896664289525','BeveragesBeverages','unit',1,140000,195000,0,0,10,NULL,NULL,1,'2026-10-24 09:41:13','2026-10-24 09:41:13'),('PRD-8135','Verification Test Energy Drink 250ml','TEST-8612','896533799287','BeveragesBeverages','unit',1,140000,195000,0,0,10,NULL,NULL,1,'2026-10-24 10:06:50','2026-10-24 10:06:50'),('PRD-8186','Verification Test Energy Drink 250ml','TEST-7878','896001000016','BeveragesBeverages','unit',1,140000,195000,50,0,10,'2026-11-07','BATCH-85E45B-1126',1,'2026-10-24 08:22:17','2026-10-24 09:29:33'),('PRD-9526','Verification Test Energy Drink 250ml','TEST-1556','896001000014','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2026-11-15','BATCH-D8C4E7-1126',1,'2026-10-24 07:39:58','2026-10-24 09:29:33'),('PRD-9974','Verification Test Energy Drink 250ml','TEST-9752','896572511361','BeveragesBeverages','unit',1,140000,195000,0,0,10,'2026-11-22','BATCH-FDF48C-1126',1,'2026-10-24 08:38:24','2026-10-24 09:29:33');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `module_action_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_perm` (`role_id`,`module_action_id`),
  KEY `module_action_id` (`module_action_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`module_action_id`) REFERENCES `module_actions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=928 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (872,2,1),(873,2,2),(874,2,3),(875,2,4),(876,2,5),(877,2,6),(878,2,7),(879,2,8),(880,2,9),(881,2,10),(882,2,11),(883,2,12),(884,2,13),(885,2,14),(886,2,15),(887,2,16),(888,2,17),(889,2,18),(890,2,19),(891,2,20),(892,2,21),(893,2,22),(894,2,23),(895,2,24),(896,2,25),(897,2,26),(898,2,27),(899,2,28),(900,2,29),(901,2,30),(902,2,31),(903,2,32),(904,2,33),(905,2,34),(906,2,35),(907,2,36),(908,2,37),(909,2,38),(910,2,39),(911,2,40),(912,2,41),(913,2,42),(914,2,43),(915,2,44),(916,2,45),(917,2,46),(918,2,47),(919,2,48),(920,2,49),(921,2,50),(922,2,51),(923,2,52),(924,2,53),(925,2,54),(926,2,55),(927,2,56),(57,3,1),(58,3,2),(59,3,3),(60,3,4),(61,3,5),(62,3,6),(63,3,7),(64,3,9),(65,3,10),(66,3,11),(67,3,12),(68,3,13),(69,3,14),(70,3,15),(71,3,16),(72,3,18),(73,3,23),(74,3,24),(75,3,25),(76,3,26),(77,3,28),(78,3,29),(79,3,30),(80,3,31),(81,3,32),(82,3,33),(83,3,34),(84,3,36),(85,3,37),(86,3,38),(87,3,40),(88,3,41),(89,3,42),(90,3,43),(91,4,1),(92,4,3),(93,4,4),(94,4,6),(95,4,13),(96,4,18),(97,4,24),(98,4,25),(99,5,1),(103,5,6),(104,5,13),(100,5,14),(101,5,16),(102,5,17),(105,6,1),(113,6,6),(114,6,13),(112,6,24),(109,6,30),(110,6,31),(111,6,32),(106,6,37),(107,6,38),(108,6,40),(115,6,41),(116,6,42),(117,7,1),(124,7,6),(125,7,10),(122,7,18),(123,7,22),(118,7,33),(119,7,34),(120,7,35),(121,7,36),(126,8,1),(127,8,2),(128,8,6),(129,8,13),(130,8,18),(131,8,23),(132,8,24),(133,8,29),(134,8,30),(135,8,31),(136,8,32),(137,8,33),(138,8,36),(139,8,37),(140,8,40),(141,8,41),(142,8,42),(143,8,43);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Administrator','super_admin','Unrestricted global system access',1,'2026-10-23 23:40:22'),(2,'Operations Admin','admin','Distribution operations and entity management',1,'2026-10-23 23:40:22'),(3,'Distribution Manager','manager','Order approval, territory dispatch, and oversight',1,'2026-10-23 23:40:22'),(4,'Order Taker / Sales Rep','order_taker','Field sales representative booking client orders',1,'2026-10-23 23:40:22'),(5,'Delivery Driver','delivery_man','Fleet logistics driver fulfilling dispatches',1,'2026-10-23 23:40:22'),(6,'Recovery Officer / Accountant','recovery_officer','Receivables recovery and payment collections',1,'2026-10-23 23:40:22'),(7,'Warehouse Manager','warehouse_manager','Stock receipts, inventory audits, and dispatch loading',1,'2026-10-23 23:40:22'),(8,'Read-Only Auditor','auditor','Financial and inventory compliance oversight',1,'2026-10-23 23:40:22');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_invoices`
--

DROP TABLE IF EXISTS `sales_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_invoices` (
  `id` varchar(64) NOT NULL,
  `invoice_number` varchar(64) NOT NULL,
  `order_id` varchar(64) NOT NULL,
  `customer_id` varchar(64) NOT NULL,
  `customer_name` varchar(191) NOT NULL,
  `total_amount_paisa` bigint(20) NOT NULL,
  `paid_amount_paisa` bigint(20) NOT NULL DEFAULT 0,
  `balance_due_paisa` bigint(20) NOT NULL,
  `payment_status` varchar(32) NOT NULL DEFAULT 'unpaid',
  `due_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `customer_id` (`customer_id`),
  KEY `order_id` (`order_id`),
  KEY `payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_invoices`
--

LOCK TABLES `sales_invoices` WRITE;
/*!40000 ALTER TABLE `sales_invoices` DISABLE KEYS */;
INSERT INTO `sales_invoices` VALUES ('INV-2026-1001','INV-2026-1001','ORD-2026-1001','CUST-1001','Al-Madina Super Store',2520000,250000,2270000,'partial','2026-11-07','2026-10-23 23:40:23','2026-10-24 08:06:22'),('INV-2026-1002','INV-2026-1002','ORD-2026-1002','CUST-1002','Bismillah General Store',1648500,0,1648500,'unpaid','2026-11-08','2026-10-24 07:25:06','2026-10-24 07:25:06'),('INV-2026-1003','INV-2026-1003','ORD-2026-1003','CUST-1003','Khyber Wholesale Mart',3677500,250000,3427500,'partial','2026-11-08','2026-10-24 08:13:10','2026-10-24 08:13:10'),('INV-2026-1004','INV-2026-1004','ORD-2026-1004','CUST-1004','Ittihad Cash & Carry',1438500,0,1438500,'unpaid','2026-11-08','2026-10-24 08:16:00','2026-10-24 08:16:00'),('INV-20261023-1887','INV-20261023-1887','ORD-20261023-1887','CUST-1001','Al-Madina Super Store',336000,0,336000,'unpaid','2026-11-08','2026-10-24 07:41:39','2026-10-24 07:41:39'),('INV-20261023-3265','INV-20261023-3265','ORD-20261023-3265','CUST-1001','Al-Madina Super Store',336000,336000,0,'paid','2026-11-08','2026-10-24 07:39:44','2026-10-24 07:39:44'),('INV-20261024-1049','INV-20261024-1049','ORD-20261024-1049','CUST-1004','Ittihad Cash & Carry',56700,0,56700,'unpaid','2026-11-08','2026-10-24 08:09:50','2026-10-24 08:09:50'),('INV-20261024-5040','INV-20261024-5040','ORD-20261024-5040','CUST-1001','Al-Madina Super Store',320000,320000,0,'paid','2026-11-08','2026-10-24 10:22:57','2026-10-24 10:22:57'),('INV-20261024-8947','INV-20261024-8947','ORD-20261024-8947','CUST-1004','Ittihad Cash & Carry',536550,0,536550,'unpaid','2026-11-08','2026-10-24 08:03:50','2026-10-24 08:03:50');
/*!40000 ALTER TABLE `sales_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` varchar(64) NOT NULL,
  `movement_id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `product_name` varchar(191) NOT NULL,
  `movement_type` varchar(32) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reference_id` varchar(64) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` varchar(64) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `movement_id` (`movement_id`),
  KEY `product_id` (`product_id`),
  KEY `movement_type` (`movement_type`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES ('MOV-6adbadcfcbe04','M-55290','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,65,64,'ORD-20261023-1887',NULL,'Laiq Ahmad Khawaja','2026-10-23 23:56:15'),('MOV-6adbae1e1bd20','M-14610','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,64,63,'ORD-20261023-3265',NULL,'Laiq Ahmad Khawaja','2026-10-23 23:57:34'),('MOV-6adc166a2759a','M-19530','PRD-112','Colgate MaxFresh 100g Toothpaste','DISPATCH_ALLOC',-2,130,128,'ORD-20261024-1049',NULL,'Laiq Ahmad Khawaja','2026-10-24 07:22:34'),('MOV-6adc16726b389','M-11602','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,63,62,'ORD-20261024-3027',NULL,'Laiq Ahmad Khawaja','2026-10-24 07:22:42'),('MOV-6adc1a7ad9f80','M-47234','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,62,61,'ORD-20261024-4954',NULL,'Laiq Ahmad Khawaja','2026-10-24 07:39:54'),('MOV-6adc1f79e86f6','M-74408','PRD-112','Colgate MaxFresh 100g Toothpaste','DISPATCH_ALLOC',-1,128,127,'ORD-20261024-8947',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:01:13'),('MOV-6adc1f79eaed5','M-52099','PRD-110','Dettol Original Soap 135g (Bundle 4)','DISPATCH_ALLOC',-1,90,89,'ORD-20261024-8947',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:01:13'),('MOV-6adc1f79ec29c','M-60634','PRD-105','Kurkure Chutney Chaska 45g (Box 24)','DISPATCH_ALLOC',-2,95,93,'ORD-20261024-8947',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:01:13'),('MOV-6adc1f79ec54b','M-78511','PRD-111','Surf Excel Quick Wash 1kg Bag','DISPATCH_ALLOC',-1,105,104,'ORD-20261024-8947',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:01:13'),('MOV-6adc226b5ea40','M-26609','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,61,60,'ORD-20261024-9906',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:13:47'),('MOV-6adc246627c12','M-89427','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,60,59,'ORD-20261024-5040',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:22:14'),('MOV-6adc282d71542','M-41433','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,59,58,'ORD-20261024-5786',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:38:21'),('MOV-6adc2a8e16c54','M-90500','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,58,57,'ORD-20261024-6677',NULL,'Laiq Ahmad Khawaja','2026-10-24 08:48:30'),('MOV-6adc2bfb7dfb2','M-11604','PRD-101','Nestle Pure Life 1.5L (Case of 6)','GRN_RECEIPT',20,120,140,'GRN-75166','GRN from dd (Ref: 123)','Laiq Ahmad Khawaja','2026-10-24 08:54:35'),('MOV-6adc2bfb845ce','M-38950','PRD-8186','Verification Test Energy Drink 250ml','GRN_RECEIPT',50,0,50,'GRN-75166','GRN from dd (Ref: 123)','Laiq Ahmad Khawaja','2026-10-24 08:54:35'),('MOV-6adc2e499ca3c','M-33864','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,57,56,'ORD-20261024-3513',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:04:25'),('MOV-6adc31b7f146c','M-91058','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,56,55,'ORD-20261024-4729',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:19:03'),('MOV-6adc31e377397','M-29211','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,55,54,'ORD-20261024-1589',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:19:47'),('MOV-6adc32095c62d','M-17656','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,54,53,'ORD-20261024-2833',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:20:25'),('MOV-6adc323248d23','M-66700','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,53,52,'ORD-20261024-9364',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:21:06'),('MOV-6adc3252a5f2f','M-80800','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,52,51,'ORD-20261024-9410',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:21:38'),('MOV-6adc329472475','M-48774','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,51,50,'ORD-20261024-9519',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:22:44'),('MOV-6adc36d5ac766','M-62069','PRD-1703','Dairy Milk Chocolate 100g','INITIAL',500,0,500,NULL,'Initial inventory stock balance','Laiq Ahmad Khawaja','2026-10-24 09:40:53'),('MOV-6adc36e6103e3','M-32882','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,50,49,'ORD-20261024-2200',NULL,'Laiq Ahmad Khawaja','2026-10-24 09:41:10'),('MOV-6adc3ce660a2b','M-25405','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,49,48,'ORD-20261024-2880',NULL,'Laiq Ahmad Khawaja','2026-10-24 10:06:46'),('MOV-6adc3d0ee1f8b','M-86877','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,48,47,'ORD-20261024-6369',NULL,'Laiq Ahmad Khawaja','2026-10-24 10:07:26'),('MOV-6adc3edad91a3','M-98008','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,47,46,'ORD-20261024-9352',NULL,'Laiq Ahmad Khawaja','2026-10-24 10:15:06'),('MOV-6adc3f882d287','M-60975','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,46,45,'ORD-20261024-3092',NULL,'Laiq Ahmad Khawaja','2026-10-24 10:18:00'),('MOV-6adc41e5486b7','M-87323','PRD-106','Cadbury Dairy Milk 36g (Box 24)','DISPATCH_ALLOC',-1,45,44,'ORD-20261024-7881',NULL,'Laiq Ahmad Khawaja','2026-10-24 10:28:05');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_receipt_items`
--

DROP TABLE IF EXISTS `stock_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_receipt_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` varchar(64) NOT NULL,
  `product_id` varchar(64) NOT NULL,
  `product_name` varchar(191) NOT NULL,
  `quantity_received` int(11) NOT NULL,
  `unit_cost_paisa` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_receipt_items`
--

LOCK TABLES `stock_receipt_items` WRITE;
/*!40000 ALTER TABLE `stock_receipt_items` DISABLE KEYS */;
INSERT INTO `stock_receipt_items` VALUES (1,'GRN-75166','PRD-101','Nestle Pure Life 1.5L (Case of 6)',20,45000),(2,'GRN-75166','PRD-8186','Verification Test Energy Drink 250ml',50,140000);
/*!40000 ALTER TABLE `stock_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_receipts`
--

DROP TABLE IF EXISTS `stock_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_receipts` (
  `id` varchar(64) NOT NULL,
  `receipt_number` varchar(64) NOT NULL,
  `supplier_name` varchar(191) NOT NULL,
  `reference_no` varchar(64) DEFAULT NULL,
  `received_by` varchar(64) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `receipt_number_2` (`receipt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_receipts`
--

LOCK TABLES `stock_receipts` WRITE;
/*!40000 ALTER TABLE `stock_receipts` DISABLE KEYS */;
INSERT INTO `stock_receipts` VALUES ('GRN-75166','GRN-75166','dd','123','Laiq Ahmad Khawaja','','2026-10-24 08:54:35');
/*!40000 ALTER TABLE `stock_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `territories`
--

DROP TABLE IF EXISTS `territories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `territories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `code` varchar(32) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `territories`
--

LOCK TABLES `territories` WRITE;
/*!40000 ALTER TABLE `territories` DISABLE KEYS */;
INSERT INTO `territories` VALUES (1,'North Route (Commercial)','NORTH-01','Main commercial avenue and plaza retailers'),(2,'South Bazaar (Wholesale)','SOUTH-02','Dense wholesale market and bulk buyers'),(3,'East Suburb (Retail)','EAST-03','Residential neighborhood general stores'),(4,'West Industrial Corridor','WEST-04','Factory canteens and industrial mini-marts');
/*!40000 ALTER TABLE `territories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` varchar(64) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `role_id` int(11) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `territory_route` varchar(64) DEFAULT 'All Territories',
  `active` tinyint(1) DEFAULT 1,
  `signature` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `active` (`active`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'usr_laiq_admin','laiq@company.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Laiq Ahmad Khawaja',1,'+92 300 0000001','All Territories',1,'/DMS/uploads/signatures/users/user_usr_laiq_admin_20261024_065830_4e80f0.png','2026-10-23 23:40:23','2026-10-24 09:58:30'),(2,'usr_super_admin','admin@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Ahmad Khan (Super Admin)',1,'+92 300 1110001','All Territories',1,'/DMS/uploads/signatures/users/user_usr_super_admin_20261024_065830_b98aab.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(3,'usr_admin','operations@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Sarah Jenkins (Ops Admin)',2,'+92 300 1110002','All Territories',1,'/DMS/uploads/signatures/users/user_usr_admin_20261024_065830_f3bae9.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(4,'usr_manager','manager@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Hamza Sheikh (Dist Manager)',3,'+92 300 1110003','Regional HQ',1,'/DMS/uploads/signatures/users/user_usr_manager_20261024_065830_f87094.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(5,'usr_sales_1','sales1@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Tariq Mahmood (North Rep)',4,'+92 300 1110004','North Route (Commercial)',1,'/DMS/uploads/signatures/users/user_usr_sales_1_20261024_065830_5a8aba.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(6,'usr_sales_2','sales2@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Bilal Aslam (South Rep)',4,'+92 300 1110005','South Bazaar (Wholesale)',1,'/DMS/uploads/signatures/users/user_usr_sales_2_20261024_065830_476187.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(7,'usr_driver_1','driver1@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Kamran Akmal (Fleet Driver)',5,'+92 300 1110006','North Route (Commercial)',1,'/DMS/uploads/signatures/users/user_usr_driver_1_20261024_065830_48f677.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(8,'usr_recovery_1','recovery1@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Zahid Qureshi (Recovery Officer)',6,'+92 300 1110007','All Territories',1,'/DMS/uploads/signatures/users/user_usr_recovery_1_20261024_065830_0aec82.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(9,'usr_warehouse_1','warehouse1@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Rashid Minhas (Warehouse Head)',7,'+92 300 1110008','Central Warehouse',1,'/DMS/uploads/signatures/users/user_usr_warehouse_1_20261024_065830_5bf4e3.svg','2026-10-23 23:40:23','2026-10-24 09:58:30'),(10,'usr_auditor_1','auditor1@dms.com','$2y$10$fKoVV77SoLkWJmBNkgBIluDqBAgvILnbcCdT.V/fMPw7PELcHly8e','Fatima Noor (Lead Auditor)',8,'+92 300 1110009','All Territories',1,'/DMS/uploads/signatures/users/user_usr_auditor_1_20261024_065830_27daea.svg','2026-10-23 23:40:23','2026-10-24 09:58:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24 10:35:15
