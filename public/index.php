<?php
// Fallback for servers that don't support .htaccess
// This will redirect all requests to index.html for React Router

// Get the requested path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// If it's a file that exists, serve it
if (file_exists(__DIR__ . $path) && !is_dir(__DIR__ . $path)) {
    // Set proper MIME type
    $extension = pathinfo($path, PATHINFO_EXTENSION);
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
        'json' => 'application/json'
    ];
    
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    readfile(__DIR__ . $path);
    exit;
}

// Otherwise, serve the React app
header('Content-Type: text/html');
readfile(__DIR__ . '/index.html');
?>
