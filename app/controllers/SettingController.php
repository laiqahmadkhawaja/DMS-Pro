<?php
/**
 * Company & System Settings Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class SettingController {
    public function index(Request $request): void {
        Permissions::require('settings', 'view');
        $db = Database::getConnection();

        $settings = $db->query("SELECT setting_key, setting_value FROM company_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
        $territories = $db->query("SELECT * FROM territories ORDER BY name ASC")->fetchAll();

        Response::json([
            'settings'    => $settings,
            'territories' => $territories
        ]);
    }

    public function update(Request $request): void {
        Permissions::require('settings', 'edit_company');
        $db = Database::getConnection();

        $keys = [
            'company_name', 'tagline', 'address', 'phone', 'email',
            'currency', 'tax_rate', 'default_credit_days', 'default_credit_limit_paisa', 'receipt_footer'
        ];

        $stmt = $db->prepare("
            INSERT INTO company_settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        ");

        foreach ($keys as $k) {
            $val = $request->input($k);
            if ($val !== null) {
                $stmt->execute([$k, is_array($val) ? json_encode($val) : (string)$val]);
            }
        }

        Response::json(null, 200, 'Company settings saved successfully.');
    }

    public function companyInfo(Request $request): void {
        Auth::require();
        $db = Database::getConnection();
        $settings = $db->query("SELECT setting_key, setting_value FROM company_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
        Response::json([
            'tax_rate'     => isset($settings['tax_rate']) ? (float)$settings['tax_rate'] : 5.0,
            'currency'     => $settings['currency'] ?? 'PKR',
            'company_name' => $settings['company_name'] ?? 'DMS Logistics',
            'phone'        => $settings['phone'] ?? '',
            'address'      => $settings['address'] ?? ''
        ]);
    }
}
