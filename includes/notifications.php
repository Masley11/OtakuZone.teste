<?php
require_once 'db.php';

class NotificationSystem {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Créer une notification dans l'app
    public function createInApp($userId, $type, $title, $message, $link = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO user_notifications (user_id, type, title, message, link)
            VALUES (?, ?, ?, ?, ?)
        ");
        return $stmt->execute([$userId, $type, $title, $message, $link]);
    }
    
    // Envoyer un email (via mail() ou service externe)
    public function sendEmail($to, $subject, $template, $data) {
        // Pour InfinityFree : utiliser mail() ou PHPMailer avec SMTP externe
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: OtakuZone <noreply@otakuzone.infinityfree.me>\r\n";
        
        $body = $this->renderEmailTemplate($template, $data);
        
        // Log pour debug sur hébergement gratuit
        error_log("EMAIL TO: $to | Subject: $subject");
        
        return mail($to, $subject, $body, $headers);
    }
    
    // Notifier admin d'une nouvelle demande
    public function notifyAdminNewRequest($requestId, $userData, $cardType) {
        // Email à l'admin
        $adminEmail = 'admin@otakuzone.infinityfree.me'; // Remplacer
        
        $this->sendEmail(
            $adminEmail,
            "Nouvelle demande de carte #$requestId",
            'admin_new_request',
            [
                'request_id' => $requestId,
                'username' => $userData['username'],
                'card_type' => $cardType,
                'date' => date('d/m/Y H:i')
            ]
        );
        
        // Notification in-app admin (si système admin existe)
        // $this->createInApp('admin', 'new_request', ...);
    }
    
    // Notifier utilisateur que sa carte est prête
    public function notifyUserCardReady($userId, $userEmail, $requestId, $cardUrl) {
        // Notification dans l'app
        $this->createInApp(
            $userId,
            'card_ready',
            '🎉 Votre carte est prête !',
            'Votre demande de carte a été traitée. Cliquez pour la voir.',
            "#/cards/view/$requestId"
        );
        
        // Email
        $this->sendEmail(
            $userEmail,
            "Votre carte OtakuZone est prête ! 🎴",
            'user_card_ready',
            [
                'card_url' => $cardUrl,
                'request_id' => $requestId,
                'download_link' => $cardUrl . '?download=1'
            ]
        );
        
        // Marquer comme notifié
        $stmt = $this->pdo->prepare("
            UPDATE card_requests 
            SET user_notified = TRUE, email_sent = TRUE 
            WHERE id = ?
        ");
        $stmt->execute([$requestId]);
    }
    
    private function renderEmailTemplate($template, $data) {
        // Templates simples inline
        $templates = [
            'admin_new_request' => "
                <h2>Nouvelle demande de carte</h2>
                <p><strong>Demande #{{request_id}}</strong></p>
                <p>Utilisateur: {{username}}</p>
                <p>Type: {{card_type}}</p>
                <p>Date: {{date}}</p>
                <p><a href='https://otakuzone.infinityfree.me/cards/admin/requests.php?id={{request_id}}'>
                    Voir la demande
                </a></p>
            ",
            'user_card_ready' => "
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h1 style='color: #ff4081;'>🎴 Votre carte est prête !</h1>
                    <p>Bonjour Otaku,</p>
                    <p>Votre demande de carte personnalisée a été traitée avec succès.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{{card_url}}' style='
                            background: linear-gradient(135deg, #ff4081, #3f51b5);
                            color: white;
                            padding: 15px 30px;
                            text-decoration: none;
                            border-radius: 12px;
                            display: inline-block;
                            font-weight: bold;
                        '>Voir ma carte</a>
                    </div>
                    <p>Ou téléchargez directement : <a href='{{download_link}}'>Télécharger</a></p>
                    <hr>
                    <p style='color: #666; font-size: 12px;'>
                        OtakuZone - Le hub des Otaku<br>
                        <a href='https://otakuzone.infinityfree.me'>otakuzone.infinityfree.me</a>
                    </p>
                </div>
            "
        ];
        
        $html = $templates[$template] ?? 'Notification OtakuZone';
        
        // Remplacer les variables
        foreach ($data as $key => $value) {
            $html = str_replace('{{' . $key . '}}', htmlspecialchars($value), $html);
        }
        
        return $html;
    }
}

// Helper global
function getNotifier() {
    global $pdo;
    return new NotificationSystem($pdo);
}
?>
