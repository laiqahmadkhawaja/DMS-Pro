<?php
/**
 * Database Singleton Wrapper (PDO)
 */

namespace App\Core;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void {
        self::$config = $config;
    }

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if (empty(self::$config)) {
            self::$config = require __DIR__ . '/../config/database.php';
        }

        $cfg = self::$config;
        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['database']};charset={$cfg['charset']}";

        try {
            self::$instance = new PDO($dsn, $cfg['username'], $cfg['password'], $cfg['options']);
        } catch (PDOException $e) {
            // If database not found (error code 1049), auto-create it
            if ($e->getCode() == 1049) {
                self::createDatabaseIfNotExists($cfg);
                self::$instance = new PDO($dsn, $cfg['username'], $cfg['password'], $cfg['options']);
            } else {
                Response::error('Database Connection Error: ' . $e->getMessage(), 500);
            }
        }

        return self::$instance;
    }

    private static function createDatabaseIfNotExists(array $cfg): void {
        try {
            $rootDsn = "mysql:host={$cfg['host']};port={$cfg['port']};charset={$cfg['charset']}";
            $rootPdo = new PDO($rootDsn, $cfg['username'], $cfg['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$cfg['database']}` CHARACTER SET {$cfg['charset']} COLLATE utf8mb4_unicode_ci");
        } catch (PDOException $ex) {
            Response::error('Database Auto-Creation Failed: ' . $ex->getMessage(), 500);
        }
    }
}
