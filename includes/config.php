<?php
// Détection automatique de l'environnement
$isLocal = (php_uname('s') === 'Linux' && is_dir('/data/data/com.termux'));

if ($isLocal) {
    // Configuration pour Termux (local)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'cards_db');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    
    // Trouver automatiquement le socket MySQL
    $possibleSockets = [
        '/data/data/com.termux/files/usr/var/run/mysqld/mysqld.sock',
        '/data/data/com.termux/files/usr/tmp/mysql.sock',
        '/data/data/com.termux/files/usr/var/lib/mysql/mysql.sock'
    ];
    
    $socket = null;
    foreach ($possibleSockets as $s) {
        if (file_exists($s)) {
            $socket = $s;
            break;
        }
    }
    
} else {
  

try {
    // Construire le DSN
    if ($socket) {
        $dsn = "mysql:unix_socket=$socket;dbname=" . DB_NAME . ";charset=utf8mb4";
    } else {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    }
    
    $pdo = new PDO(
        $dsn,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
} catch (PDOException $e) {
    error_log("DB Error: " . $e->getMessage());
    
    if ($isLocal) {
        http_response_code(500);
        die(json_encode([
            'error' => 'Database connection failed',
            'details' => $e->getMessage(),
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'socket_tried' => $socket ?? 'none',
            'possible_sockets' => $possibleSockets ?? []
        ]));
    } else {
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed']));
    }
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>



<?php
  // Configuration pour InfinityFree (production)
    define('DB_HOST', 'sql212.infinityfree.com');
    define('DB_NAME', 'if0_40977018_OtakuZone');
    define('DB_USER', 'if0_40977018');
    define('DB_PASS', 'ajo71aZr8A3');
    $socket = null;

// URL de base du site
define('BASE_URL', 'https://otakuzone.infinityfree.me');
define('CARDS_URL', BASE_URL . '/cards');

// Email de l'administrateur
define('ADMIN_EMAIL', 'fatawlamoukiri11@gamil.com');

// Configuration Supabase (pour l'auth)
define('SUPABASE_URL', 'https://lrvwhewjudeiuwqcaeqz.supabase.co');
define('SUPABASE_ANON_KEY', 'sb_publishable_TQG7By7w-HIQymSz37tTEQ_6UeF2ktN');

// Connexion PDO
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}

// Démarrer la session pour l'admin
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>