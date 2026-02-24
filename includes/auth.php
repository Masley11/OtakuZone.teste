<?php
function getCurrentUserId() {
    // Le token est envoyé par le JavaScript dans l'en-tête Authorization
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        // Vérification du token avec Supabase (optionnel mais recommandé)
        // Pour l'exemple, on retourne simplement l'ID envoyé par le client
        // Idéalement, il faudrait appeler l'API Supabase pour valider le JWT
        return $_POST['user_id'] ?? null; // À améliorer en production
    }
    return null;
}
?>