<?php
/**
 * Auth Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Permissions;

class AuthController {
    public function login(Request $request): void {
        $email = $request->input('email', '');
        $password = $request->input('password', '');

        if (empty($email) || empty($password)) {
            Response::error('Email and password are required.', 422);
        }

        $user = Auth::attempt($email, $password);
        if (!$user) {
            Response::error('Invalid email or password credentials.', 401);
        }

        Response::json([
            'user'  => $user,
            'token' => $user['uid']
        ], 200, 'Login successful.');
    }

    public function me(Request $request): void {
        $user = Auth::user();
        if (!$user) {
            Response::error('Unauthenticated.', 401);
        }

        Response::json(['user' => $user], 200);
    }

    public function logout(Request $request): void {
        Auth::logout();
        Response::json(null, 200, 'Logged out successfully.');
    }
}
