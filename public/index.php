<?php
// Complete PHP solution for React SPA routing
// This handles all requests and serves the React app

// Get the requested path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove query string for file checking
$clean_path = strtok($path, '?');

// Define the document root
$doc_root = __DIR__;
$requested_file = $doc_root . $clean_path;

// If it's a file that exists and is not a directory, serve it
if (file_exists($requested_file) && !is_dir($requested_file)) {
    // Set proper MIME type based on file extension
    $extension = strtolower(pathinfo($clean_path, PATHINFO_EXTENSION));
    
    $mime_types = [
        'js' => 'application/javascript',
        'css' => 'text/css',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
        'ico' => 'image/x-icon',
        'json' => 'application/json',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    // Set cache headers for static assets
    if (in_array($extension, ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot'])) {
        header('Cache-Control: public, max-age=31536000'); // 1 year
    }
    
    // Serve the file
    readfile($requested_file);
    exit;
}

// For all other requests (including React Router routes), serve the React app
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Serve the main React app
readfile($doc_root . '/index.html');
?>