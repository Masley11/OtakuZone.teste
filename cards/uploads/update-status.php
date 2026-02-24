<?php
session_start();
require_once '../../../includes/db.php';
require_once '../../../includes/notifications.php';

// Vérifier auth admin (simplifié)
if (!isset($_SESSION['admin_auth']) || $_SESSION['admin_auth'] !== true) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

$requestId = $_POST['request_id'] ?? '';
$newStatus = $_POST['status'] ?? '';
$adminNotes = $_POST['admin_notes'] ?? '';
$finalCardUrl = $_POST['final_card_url'] ?? '';

if (!$requestId || !$newStatus) {
    jsonResponse(['error' => 'Missing parameters'], 400);
}

try {
    // Récupérer la demande actuelle
    $stmt = $pdo->prepare("SELECT * FROM card_requests WHERE id = ?");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    if (!$request) {
        jsonResponse(['error' => 'Request not found'], 404);
    }
    
    // Mettre à jour
    $stmt = $pdo->prepare("
        UPDATE card_requests 
        SET status = ?, 
            admin_notes = ?, 
            final_card_url = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$newStatus, $adminNotes, $finalCardUrl, $requestId]);
    
    // Si terminé, notifier l'utilisateur
    if ($newStatus === 'completed' && $request['status'] !== 'completed') {
        $notifier = getNotifier();
        
        // Récupérer email utilisateur depuis Supabase ou session
        $userEmail = getUserEmailFromSupabase($request['user_id']);
        
        $notifier->notifyUserCardReady(
            $request['user_id'],
            $userEmail,
            $requestId,
            $finalCardUrl
        );
    }
    
    // Redirection ou JSON selon contexte
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
        jsonResponse(['success' => true]);
    } else {
        header('Location: ../requests.php?updated=1');
        exit;
    }
    
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}

function getUserEmailFromSupabase($userId) {
    // À implémenter : appel API Supabase pour récupérer l'email
    // Pour l'instant, retourne un placeholder
    return 'user@example.com';
}
?>
