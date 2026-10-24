<?php
/**
 * Dynamic Granular Role-Based Access Control (RBAC) Engine
 * Module-wise, Page-wise, and Action-wise (view, create, edit, delete, export, print, approve)
 */

namespace App\Core;

use PDO;

class Permissions {
    private static array $cache = [];

    /**
     * Get all granted permissions for a role in format: ['module.action']
     */
    public static function getRolePermissions(int $roleId): array {
        if (isset(self::$cache[$roleId])) {
            return self::$cache[$roleId];
        }

        $db = Database::getConnection();

        // Check if role is super_admin
        $roleStmt = $db->prepare("SELECT slug FROM roles WHERE id = ?");
        $roleStmt->execute([$roleId]);
        $role = $roleStmt->fetch();

        if ($role && $role['slug'] === 'super_admin') {
            // Super Admin has all possible actions
            $stmt = $db->query("
                SELECT CONCAT(m.slug, '.', ma.action_slug) as perm
                FROM module_actions ma
                JOIN modules m ON ma.module_id = m.id
            ");
            $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $perms[] = '*.*';
            self::$cache[$roleId] = $perms;
            return $perms;
        }

        $stmt = $db->prepare("
            SELECT CONCAT(m.slug, '.', ma.action_slug) as perm
            FROM role_permissions rp
            JOIN module_actions ma ON rp.module_action_id = ma.id
            JOIN modules m ON ma.module_id = m.id
            WHERE rp.role_id = ?
        ");
        $stmt->execute([$roleId]);
        $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);

        self::$cache[$roleId] = $perms;
        return $perms;
    }

    /**
     * Check if the currently authenticated user can perform an action on a module
     */
    public static function can(string $moduleSlug, string $actionSlug): bool {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if (($user['role_slug'] ?? '') === 'super_admin') {
            return true;
        }

        $key = "{$moduleSlug}.{$actionSlug}";
        $perms = $user['permissions'] ?? self::getRolePermissions($user['role_id']);

        return in_array($key, $perms, true) || in_array('*.*', $perms, true);
    }

    /**
     * Enforce permission or throw HTTP 403 Forbidden
     */
    public static function require(string $moduleSlug, string $actionSlug): void {
        Auth::requireUser();
        if (!self::can($moduleSlug, $actionSlug)) {
            Response::error("Access Denied: You do not have permission to '{$actionSlug}' on module '{$moduleSlug}'.", 403);
        }
    }

    /**
     * Clear permission cache (called after permissions are updated)
     */
    public static function clearCache(): void {
        self::$cache = [];
    }
}
