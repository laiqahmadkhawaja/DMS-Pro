<?php
/**
 * Role & Granular Permissions Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class RoleController {
    public function index(Request $request): void {
        Permissions::require('roles', 'view');
        $db = Database::getConnection();

        $roles = $db->query("
            SELECT r.*, 
                   COUNT(u.id) as user_count,
                   (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permission_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id AND u.active = 1
            GROUP BY r.id
            ORDER BY r.is_system DESC, r.id ASC
        ")->fetchAll();

        Response::json($roles);
    }

    public function matrix(Request $request): void {
        Permissions::require('roles', 'manage_permissions');
        $db = Database::getConnection();

        // 1. All roles
        $roles = $db->query("SELECT id, name, slug, description, is_system FROM roles ORDER BY id ASC")->fetchAll();

        // 2. All modules with actions
        $modules = $db->query("SELECT id, name, slug, icon, sort_order FROM modules ORDER BY sort_order ASC")->fetchAll();
        $actions = $db->query("SELECT id, module_id, action_slug, label, description FROM module_actions ORDER BY id ASC")->fetchAll();

        // Group actions by module_id
        $actionsByModule = [];
        foreach ($actions as $act) {
            $actionsByModule[$act['module_id']][] = $act;
        }

        foreach ($modules as &$mod) {
            $mod['actions'] = $actionsByModule[$mod['id']] ?? [];
        }
        unset($mod);

        // 3. Current active role_permissions mapping
        $rolePermRows = $db->query("SELECT role_id, module_action_id FROM role_permissions")->fetchAll();
        $rolePerms = [];
        foreach ($rolePermRows as $rp) {
            $rolePerms[$rp['role_id']][] = (int)$rp['module_action_id'];
        }

        Response::json([
            'roles'        => $roles,
            'modules'      => $modules,
            'role_perms'   => $rolePerms
        ]);
    }

    public function updateMatrix(Request $request): void {
        Permissions::require('roles', 'manage_permissions');
        $db = Database::getConnection();

        $roleId = (int)$request->input('role_id');
        $actionIds = $request->input('action_ids', []);

        if ($roleId <= 0) {
            Response::error('Invalid Role ID.', 422);
        }

        // Verify role exists and is not super_admin (super_admin always has all permissions)
        $role = $db->query("SELECT slug, is_system FROM roles WHERE id = {$roleId}")->fetch();
        if (!$role) {
            Response::error('Role not found.', 404);
        }
        if ($role['slug'] === 'super_admin') {
            Response::error('Super Administrator role permanently maintains full global permissions.', 422);
        }

        try {
            $db->beginTransaction();

            // Clear existing permissions for this role
            $delStmt = $db->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $delStmt->execute([$roleId]);

            // Insert newly selected permissions
            if (!empty($actionIds) && is_array($actionIds)) {
                $insStmt = $db->prepare("INSERT INTO role_permissions (role_id, module_action_id) VALUES (?, ?)");
                foreach ($actionIds as $actId) {
                    $insStmt->execute([$roleId, (int)$actId]);
                }
            }

            $db->commit();
            Permissions::clearCache();

            Response::json(['role_id' => $roleId, 'assigned_count' => count($actionIds)], 200, 'Role permissions updated successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update permissions: ' . $e->getMessage(), 500);
        }
    }

    public function store(Request $request): void {
        Permissions::require('roles', 'create');
        $name = trim($request->input('name', ''));
        $description = trim($request->input('description', ''));

        if (empty($name)) {
            Response::error('Role name is required.', 422);
        }

        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $name));

        $db = Database::getConnection();
        // Check uniqueness
        $check = $db->prepare("SELECT id FROM roles WHERE slug = ?");
        $check->execute([$slug]);
        if ($check->fetch()) {
            Response::error("A role with slug '{$slug}' already exists.", 422);
        }

        $stmt = $db->prepare("INSERT INTO roles (name, slug, description, is_system) VALUES (?, ?, ?, 0)");
        $stmt->execute([$name, $slug, $description]);

        Response::json(['id' => $db->lastInsertId(), 'name' => $name, 'slug' => $slug], 201, 'Role created successfully.');
    }

    public function destroy(Request $request, array $params): void {
        Permissions::require('roles', 'delete');
        $id = (int)($params['id'] ?? 0);

        $db = Database::getConnection();
        $role = $db->query("SELECT * FROM roles WHERE id = {$id}")->fetch();
        if (!$role) {
            Response::error('Role not found.', 404);
        }
        if ($role['is_system']) {
            Response::error('Built-in system roles cannot be deleted.', 403);
        }

        // Check if users exist in this role
        $check = $db->query("SELECT COUNT(*) FROM users WHERE role_id = {$id}")->fetchColumn();
        if ($check > 0) {
            Response::error("Cannot delete role: {$check} active staff members are assigned to it.", 422);
        }

        $db->exec("DELETE FROM roles WHERE id = {$id}");
        Permissions::clearCache();

        Response::json(null, 200, 'Role deleted successfully.');
    }
}
