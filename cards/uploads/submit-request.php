<?php
require_once '../../includes/db.php';
require_once '../../includes/auth.php';
require_once '../../includes/notifications.php';

// Vérifier méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = requireAuth();

// Récupérer et valider les données
$templateId = $_POST['template_id'] ?? '';
$cardType = $_POST['card_type'] ?? '';

if (!$templateId || !$cardType) {
    jsonResponse(['error' => 'Missing required fields'], 400);
}

// Vérifier que le template existe
$stmt = $pdo->prepare("SELECT * FROM card_templates WHERE id = ? AND is_active = TRUE");
$stmt->execute([$templateId]);
$template = $stmt->fetch();

if (!$template) {
    jsonResponse(['error' => 'Template not found'], 404);
}

// Construire les données du formulaire (tout sauf les champs système)
$formData = $_POST;
unset($formData['template_id'], $formData['card_type']);

// Validation des champs requis
$schema = json_decode($template['form_schema'], true);
$errors = [];

foreach ($schema['fields'] as $field) {
    if ($field['required'] && empty($formData[$field['name']])) {
        $errors[] = $field['label'] . ' est requis';
    }
    // Validation des URLs
    if ($field['type'] === 'url' && !empty($formData[$field['name']])) {
        if (!filter_var($formData[$field['name']], FILTER_VALIDATE_URL)) {
            $errors[] = $field['label'] . ' doit être une URL valide';
        }
    }
}

if (!empty($errors)) {
    jsonResponse(['error' => 'Validation failed', 'details' => $errors], 400);
}

// Insérer la demande
try {
    $stmt = $pdo->prepare("
        INSERT INTO card_requests 
        (user_id, card_type, template_id, form_data, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', NOW())
    ");
    
    $stmt->execute([
        $user['id'],
        $cardType,
        $templateId,
        json_encode($formData, JSON_UNESCAPED_UNICODE)
    ]);
    
    $requestId = $pdo->lastInsertId();
    
    // Notifier l'admin
    $notifier = getNotifier();
    $notifier->notifyAdminNewRequest(
        $requestId,
        ['username' => $user['email']], // Récupérer le vrai username si dispo
        $template['name']
    );
    
    // Créer notification pour l'utilisateur
    $notifier->createInApp(
        $user['id'],
        'request_submitted',
        '📨 Demande reçue',
        'Votre demande de ' . $template['name'] . ' est en cours d\'étude.',
        '#/cards'
    );
    
    jsonResponse([
        'success' => true,
        'request_id' => $requestId,
        'message' => 'Request submitted successfully'
    ]);
    
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    jsonResponse(['error' => 'Database error'], 500);
}
?>
