<?php
/**
 * File Storage & Uploads Handler
 * Safely decodes and writes binary media files to the server filesystem,
 * persisting clean relative URLs/paths into the database instead of Base64 blobs.
 */

namespace App\Core;

class FileStorage {
    private static string $baseDir = __DIR__ . '/../../uploads';

    public static function getBaseUrl(): string {
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        if (str_ends_with($scriptDir, '/api')) {
            $scriptDir = substr($scriptDir, 0, -4);
        }
        return ($scriptDir ? $scriptDir : '') . '/uploads';
    }

    /**
     * Converts a base64 data URL (e.g. data:image/png;base64,...) to a physical file on disk.
     * If the input is already a file path or URL, returns it unchanged.
     *
     * @param string|null $dataUrl Base64 data URL or existing path
     * @param string $subfolder Directory within uploads/ (e.g. 'signatures/users')
     * @param string $prefix Filename prefix (e.g. 'user_USR-001')
     * @return string|null Web-accessible relative file path (e.g. '/DMS/uploads/signatures/users/...') or null
     */
    public static function saveBase64Image(?string $dataUrl, string $subfolder = 'signatures', string $prefix = 'sig'): ?string {
        if (empty($dataUrl)) {
            return null;
        }

        $trimmed = trim($dataUrl);

        // If it's already a saved path/URL, preserve it
        if (!str_starts_with($trimmed, 'data:image/')) {
            return $trimmed;
        }

        // Parse MIME type and extract Base64 data
        if (!preg_match('/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.+)$/s', $trimmed, $matches)) {
            return null;
        }

        $mimeSubtype = strtolower($matches[1]);
        $base64Data = $matches[2];

        // Map extension
        $extension = match ($mimeSubtype) {
            'jpeg', 'jpg' => 'jpg',
            'png'         => 'png',
            'webp'        => 'webp',
            'svg+xml'     => 'svg',
            default       => 'png'
        };

        $binary = base64_decode($base64Data, true);
        if ($binary === false || strlen($binary) === 0) {
            return null;
        }

        // Clean subfolder path
        $cleanSubfolder = trim(str_replace(['..', '\\'], ['', '/'], $subfolder), '/');
        $targetDir = self::$baseDir . ($cleanSubfolder !== '' ? '/' . $cleanSubfolder : '');

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        // Generate sanitized unique filename
        $sanitizedPrefix = preg_replace('/[^a-zA-Z0-9_-]/', '_', $prefix);
        $filename = $sanitizedPrefix . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $extension;
        $fullPath = $targetDir . '/' . $filename;

        if (file_put_contents($fullPath, $binary) === false) {
            return null;
        }

        // Return web-accessible URL path
        return self::getBaseUrl() . ($cleanSubfolder !== '' ? '/' . $cleanSubfolder : '') . '/' . $filename;
    }

    /**
     * Delete an existing file from disk given its web path.
     */
    public static function deleteFile(?string $webPath): bool {
        if (empty($webPath)) {
            return false;
        }

        // Clean relative path regardless of whether it starts with /DMS/uploads/ or /uploads/
        $cleanRel = preg_replace('#^.*?/uploads/#', '', $webPath);
        $fullPath = self::$baseDir . '/' . ltrim(str_replace(['\\', '..'], ['/', ''], $cleanRel), '/');

        if (file_exists($fullPath) && is_file($fullPath)) {
            return @unlink($fullPath);
        }

        return false;
    }
}
