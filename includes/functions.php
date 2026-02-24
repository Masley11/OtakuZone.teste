<?php
/**
 * Fonctions utilitaires pour le système de cartes
 */

/**
 * Envoie un email
 */
function sendEmail($to, $subject, $message) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: OtakuZone Cartes <noreply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
    $headers .= "Reply-To: " . ADMIN_EMAIL . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    return mail($to, $subject, $message, $headers);
}

/**
 * Notifie l'admin d'une nouvelle demande
 */
function notifyAdminNewRequest($requestId, $userEmail, $templateName) {
    $subject = "🎴 Nouvelle demande de carte #$requestId";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #ff4081, #3f51b5); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f5f5f5; }
            .button { background: #ff4081; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>Nouvelle Demande de Carte</h2>
        </div>
        <div class='content'>
            <p><strong>Demande #$requestId</strong></p>
            <p><strong>Template :</strong> $templateName</p>
            <p><strong>Utilisateur :</strong> $userEmail</p>
            <p><strong>Date :</strong> " . date('d/m/Y H:i') . "</p>
            <p>Connectez-vous au panneau d'administration pour traiter cette demande.</p>
            <a href='" . CARDS_URL . "/admin.php' class='button'>Gérer les demandes</a>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail(ADMIN_EMAIL, $subject, $message);
}

/**
 * Notifie l'utilisateur que sa carte est prête
 */
function notifyUserCardReady($userEmail, $requestId) {
    $subject = "🎉 Ta carte Otaku est prête !";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f5f5f5; }
            .button { background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🎴 Ta carte est prête !</h2>
        </div>
        <div class='content'>
            <p>Félicitations ! Ta demande de carte #$requestId a été traitée et ta carte est maintenant disponible.</p>
            <p>Connecte-toi sur OtakuZone pour la voir dans ton profil.</p>
            <a href='" . BASE_URL . "/#/profil' class='button'>Voir mon profil</a>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($userEmail, $subject, $message);
}

/**
 * Nettoie une chaîne pour l'affichage
 */
function h($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

/**
 * Génère un nom de fichier unique
 */
function generateUniqueFilename($originalName) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
}

/**
 * Vérifie si un fichier est une image valide
 */
function isValidImage($file) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }
    
    if ($file['size'] > $maxSize) {
        return false;
    }
    
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        return false;
    }
    
    return true;
}

/**
 * Récupère l'email de l'utilisateur depuis Supabase
 */
function getUserEmailFromSupabase($userId) {
    // Note: Dans un environnement réel, il faudrait appeler l'API Supabase
    // Pour l'instant, on retourne un email par défaut
    return $userId . '@otakuzone.user';
}

/**
 * Formate une date en français
 */
function formatDate($dateString) {
    $date = new DateTime($dateString);
    $formatter = new IntlDateFormatter(
        'fr_FR',
        IntlDateFormatter::MEDIUM,
        IntlDateFormatter::NONE
    );
    return $formatter->format($date);
}

/**
 * Récupère le libellé d'un statut
 */
function getStatusLabel($status) {
    $labels = [
        'pending' => 'En attente',
        'in_progress' => 'En cours',
        'completed' => 'Terminé',
        'rejected' => 'Rejeté'
    ];
    return $labels[$status] ?? $status;
}

/**
 * Récupère la classe CSS d'un statut
 */
function getStatusClass($status) {
    $classes = [
        'pending' => 'status-pending',
        'in_progress' => 'status-in_progress',
        'completed' => 'status-completed',
        'rejected' => 'status-rejected'
    ];
    return $classes[$status] ?? 'status-pending';
}
?>