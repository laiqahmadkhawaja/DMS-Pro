<?php
/**
 * Authentication & Session Guard
 */

namespace App\Core;

use PDO;

class Auth {
    private static ?array $user = null;

    public static function attempt(string $email, string $password): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT u.*, r.name as role_name, r.slug as role_slug 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ? AND u.active = 1
            LIMIT 1
        ");
        $stmt->execute([trim($email)]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            
            // Attach user permissions
            $user['permissions'] = Permissions::getRolePermissions($user['role_id']);
            
            Session::set('user', $user);
            self::$user = $user;
            return $user;
        }

        return null;
    }

    public static function user(): ?array {
        if (self::$user !== null) {
            return self::$user;
        }

        $sessionUser = Session::get('user');
        if ($sessionUser) {
            // Refresh permissions dynamically from DB in case permissions changed
            $sessionUser['permissions'] = Permissions::getRolePermissions($sessionUser['role_id']);
            self::$user = $sessionUser;
            return self::$user;
        }

        // Check Bearer Token (token = user uid)
        $request = new Request();
        $token = $request->bearerToken();
        if ($token) {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT u.*, r.name as role_name, r.slug as role_slug 
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.uid = ? AND u.active = 1
                LIMIT 1
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            if ($user) {
                unset($user['password_hash']);
                $user['permissions'] = Permissions::getRolePermissions($user['role_id']);
                self::$user = $user;
                return $user;
            }
        }

        return null;
    }

    public static function check(): bool {
        return self::user() !== null;
    }

    public static function logout(): void {
        self::$user = null;
        Session::destroy();
    }

    public static function requireUser(): array {
        $user = self::user();
        if (!$user) {
            Response::error('Unauthenticated: Please log in to continue.', 401);
        }
        return $user;
    }
}
