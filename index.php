<?php
/**
 * DMS Enterprise — Distribution Logistics Management Application
 * Single Page Application (SPA) Master Shell
 */

require_once __DIR__ . '/app/config/app.php';
require_once __DIR__ . '/app/core/Session.php';
App\Core\Session::start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#2563eb">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>DMS Enterprise — Distribution Logistics</title>

  <!-- Auto-Detect Hosting Base Path (Localhost /DMS vs Live Root Domain) -->
  <script>
    (function() {
      var scriptDir = '<?= rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/') ?>';
      window.__DMS_CONFIG__ = {
        basePath: scriptDir,
        apiBase: (scriptDir ? scriptDir : '') + '/api',
        uploadsBase: (scriptDir ? scriptDir : '') + '/uploads'
      };
    })();
  </script>

  <!-- App Stylesheets -->
  <link rel="stylesheet" href="assets/css/tailwind.css">
  <link rel="stylesheet" href="assets/css/print.css" media="print">

  <!-- Tailwind CSS Engine (Local Standalone with Remote CDN Fallback) -->
  <script src="assets/js/tailwind.cdn.js"></script>
  <script>
    if (typeof window.tailwind === 'undefined') {
      document.write('<script src="https://cdn.tailwindcss.com"><\/script>');
    }
  </script>
  <script>
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#2563eb',
          }
        }
      }
    };
  </script>
</head>
<body class="bg-muted-custom text-main antialiased selection:bg-blue-500 selection:text-white">

  <!-- Main Dynamic Application Container -->
  <div id="app-root">
    <!-- Initial Loading State Skeleton -->
    <div class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-muted-custom">Loading DMS Enterprise...</p>
      </div>
    </div>
  </div>

  <!-- Global Toast Notifications Container -->
  <div id="toast-container"></div>

  <!-- Modular Vanilla ES6+ SPA Architecture -->
  <script type="module" src="assets/js/app.js"></script>
</body>
</html>
