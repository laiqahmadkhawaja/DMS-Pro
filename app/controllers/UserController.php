<?php
/**
 * User & Staff Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use App\Core\FileStorage;
use PDO;

class UserController {
    public function index(Request $request): void {
        Permissions::require('users', 'view');
        $db = Database::getConnection();

        $users = $db->query("
            SELECT u.id, u.uid, u.email, u.display_name, u.phone, u.territory_route, u.signature, u.active, u.created_at,
                   r.id as role_id, r.name as role_name, r.slug as role_slug
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC
        ")->fetchAll();

        Response::json($users);
    }

    public function store(Request $request): void {
        Permissions::require('users', 'create');
        $db = Database::getConnection();

        $email = trim($request->input('email', ''));
        $name = trim($request->input('display_name', ''));
        $password = $request->input('password', '');
        $roleId = (int)$request->input('role_id', 0);
        $phone = trim($request->input('phone', ''));
        $route = trim($request->input('territory_route', 'All Territories'));

        if (empty($email) || empty($name) || empty($password) || $roleId <= 0) {
            Response::error('Display name, email, password, and role are required.', 422);
        }

        // Check email uniqueness
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error('A user with this email address already exists.', 422);
        }

        $uid = 'usr_' . substr(md5(uniqid()), 0, 12);
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $signature = $request->input('signature');
        $sigPath = FileStorage::saveBase64Image($signature, 'signatures/users', 'user_' . $uid);

        $stmt = $db->prepare("
            INSERT INTO users (uid, email, password_hash, display_name, role_id, phone, territory_route, signature, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$uid, $email, $hash, $name, $roleId, $phone, $route, $sigPath]);

        Response::json(['uid' => $uid, 'email' => $email, 'display_name' => $name], 201, 'User registered successfully.');
    }

    public function update(Request $request, array $params): void {
        Permissions::require('users', 'edit');
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();

        $user = $db->query("SELECT * FROM users WHERE id = {$id}")->fetch();
        if (!$user) {
            Response::error('User not found.', 404);
        }

        $name = trim($request->input('display_name', $user['display_name']));
        $phone = trim($request->input('phone', $user['phone']));
        $roleId = (int)$request->input('role_id', $user['role_id']);
        $route = trim($request->input('territory_route', $user['territory_route']));
        $active = $request->input('active', $user['active']);

        $stmt = $db->prepare("
            UPDATE users SET display_name = ?, phone = ?, role_id = ?, territory_route = ?, active = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $phone, $roleId, $route, (int)$active, $id]);

        $signature = $request->input('signature');
        if ($signature !== null) {
            $sigPath = FileStorage::saveBase64Image($signature, 'signatures/users', 'user_' . $user['uid']);
            $db->prepare("UPDATE users SET signature = ? WHERE id = ?")->execute([$sigPath, $id]);
        }

        // Optional password reset
        $newPass = $request->input('password');
        if (!empty($newPass)) {
            Permissions::require('users', 'reset_password');
            $hash = password_hash($newPass, PASSWORD_BCRYPT);
            $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $id]);
        }

        Response::json(null, 200, 'User profile updated successfully.');
    }

    public function destroy(Request $request, array $params): void {
        Permissions::require('users', 'delete');
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();

        $user = $db->query("SELECT * FROM users WHERE id = {$id}")->fetch();
        if (!$user) {
            Response::error('User not found.', 404);
        }

        // Toggle active status
        $newStatus = $user['active'] ? 0 : 1;
        $db->prepare("UPDATE users SET active = ? WHERE id = ?")->execute([$newStatus, $id]);

        $msg = $newStatus ? 'User account activated.' : 'User account deactivated.';
        Response::json(['active' => $newStatus], 200, $msg);
    }
}
