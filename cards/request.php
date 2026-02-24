<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

// Récupération d'un template
if ($action === 'get_template' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $pdo->prepare("SELECT * FROM card_templates WHERE id = ? AND is_active = 1");
    $stmt->execute([$id]);
    $template = $stmt->fetch();
    
    if ($template) {
        $template['fields'] = json_decode($template['fields_json'], true);
        echo json_encode($template);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Template introuvable']);
    }
    exit;
}

// Vérification du statut d'une demande
if ($action === 'check_status' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $pdo->prepare("SELECT status, updated_at FROM card_requests WHERE id = ?");
    $stmt->execute([$id]);
    $request = $stmt->fetch();
    
    if ($request) {
        echo json_encode([
            'status' => $request['status'],
            'status_label' => getStatusLabel($request['status']),
            'updated_at' => $request['updated_at']
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Demande introuvable']);
    }
    exit;
}

// Soumission d'une demande
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? '';
    $userEmail = $_POST['user_email'] ?? '';
    $templateId = intval($_POST['template_id'] ?? 0);
    $accessToken = $_POST['access_token'] ?? '';
    
    // Validations
    if (!$userId || !$templateId) {
        echo json_encode(['success' => false, 'error' => 'Utilisateur ou template manquant']);
        exit;
    }
    
    // Récupérer le template
    $stmt = $pdo->prepare("SELECT * FROM card_templates WHERE id = ? AND is_active = 1");
    $stmt->execute([$templateId]);
    $template = $stmt->fetch();
    
    if (!$template) {
        echo json_encode(['success' => false, 'error' => 'Template invalide']);
        exit;
    }
    
    $fields = json_decode($template['fields_json'], true);
    $data = [];
    $uploadedFile = null;
    
    // Traiter les champs
    foreach ($fields as $field) {
        $name = $field['name'];
        
        if ($field['type'] === 'file') {
            if (isset($_FILES[$name]) && $_FILES[$name]['error'] === UPLOAD_ERR_OK) {
                if (!isValidImage($_FILES[$name])) {
                    echo json_encode(['success' => false, 'error' => "Fichier image invalide pour {$field['label']}"]);
                    exit;
                }
                
                $uploadDir = __DIR__ . '/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $filename = generateUniqueFilename($_FILES[$name]['name']);
                $destination = $uploadDir . $filename;
                
                if (move_uploaded_file($_FILES[$name]['tmp_name'], $destination)) {
                    $uploadedFile = '/cards/uploads/' . $filename;
                    $data[$name] = $uploadedFile;
                } else {
                    echo json_encode(['success' => false, 'error' => "Erreur lors de l'upload du fichier {$field['label']}"]);
                    exit;
                }
            } elseif ($field['required']) {
                echo json_encode(['success' => false, 'error' => "Le champ {$field['label']} est requis"]);
                exit;
            }
        } else {
            $value = trim($_POST[$name] ?? '');
            if ($field['required'] && empty($value)) {
                echo json_encode(['success' => false, 'error' => "Le champ {$field['label']} est requis"]);
                exit;
            }
            
            // Validation spécifique
            if ($field['type'] === 'number' && !empty($value)) {
                if (isset($field['min']) && $value < $field['min']) {
                    echo json_encode(['success' => false, 'error' => "{$field['label']} doit être au moins {$field['min']}"]);
                    exit;
                }
                if (isset($field['max']) && $value > $field['max']) {
                    echo json_encode(['success' => false, 'error' => "{$field['label']} doit être au maximum {$field['max']}"]);
                    exit;
                }
            }
            
            $data[$name] = $value;
        }
    }
    
    // Récupérer l'email si non fourni
    if (empty($userEmail)) {
        $userEmail = getUserEmailFromSupabase($userId);
    }
    
    // Insérer la demande
    $stmt = $pdo->prepare("
        INSERT INTO card_requests (user_id, user_email, template_id, data_json, image_path) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $success = $stmt->execute([
        $userId,
        $userEmail,
        $templateId,
        json_encode($data, JSON_UNESCAPED_UNICODE),
        $uploadedFile
    ]);
    
    if ($success) {
        $requestId = $pdo->lastInsertId();
        
        // Notifier l'admin
        notifyAdminNewRequest($requestId, $userEmail, $template['name']);
        
        echo json_encode([
            'success' => true,
            'request_id' => $requestId,
            'message' => 'Demande envoyée avec succès'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de l\'enregistrement en base de données']);
    }
    exit;
}

// Requête invalide
http_response_code(400);
echo json_encode(['error' => 'Action non valide']);
?>