<?php
// proxy.php - Proxy simple para evitar CORS con Yahoo Finance en producción.
// Se coloca en la carpeta public/ de React y se compila automáticamente.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Manejo de peticiones preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (isset($_GET['url'])) {
    $url = $_GET['url'];
    
    // Seguridad básica: Solo permitir peticiones a yahoo finance
    if (strpos($url, "yahoo.com") !== false) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Evitar problemas de SSL en hostings compartidos
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            http_response_code(500);
            echo json_encode(array("error" => "CURL Error: " . $error_msg));
        } else {
            http_response_code($httpCode);
            echo $response;
        }
        curl_close($ch);
    } else {
        http_response_code(400);
        echo json_encode(array("error" => "Only Yahoo Finance URLs are allowed."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("error" => "No URL parameter provided."));
}
?>
