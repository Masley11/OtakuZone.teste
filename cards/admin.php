<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

// Gestion de la connexion admin
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (loginAdmin($username, $password)) {
        header('Location: admin.php');
        exit;
    } else {
        $error = "Identifiants incorrects";
    }
}

// Déconnexion
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Traitement de la mise à jour du statut
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status']) && isAdminLoggedIn()) {
    $requestId = intval($_POST['request_id']);
    $newStatus = $_POST['status'];
    $notes = $_POST['admin_notes'] ?? '';
    
    // Récupérer l'email de l'utilisateur
    $stmt = $pdo->prepare("SELECT user_email FROM card_requests WHERE id = ?");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch();
    
    $stmt = $pdo->prepare("UPDATE card_requests SET status = ?, admin_notes = ? WHERE id = ?");
    $stmt->execute([$newStatus, $notes, $requestId]);
    
    // Si le statut passe à "completed", envoyer un email
    if ($newStatus === 'completed' && $request) {
        notifyUserCardReady($request['user_email'], $requestId);
    }
    
    header('Location: admin.php?updated=' . $requestId);
    exit;
}

// Si pas connecté, afficher le formulaire de login
if (!isAdminLoggedIn()):
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Cartes Otaku</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="login-container">
        <h1>🔐 Administration</h1>
        <?php if (isset($error)): ?>
            <div class="toast show error"><?= h($error) ?></div>
        <?php endif; ?>
        <form method="post" class="login-form">
            <div class="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" name="username" required>
            </div>
            <div class="form-group">
                <label>Mot de passe</label>
                <input type="password" name="password" required>
            </div>
            <button type="submit" name="login" class="btn btn-primary btn-block">Se connecter</button>
        </form>
    </div>
</body>
</html>
<?php
exit;
endif;

// Récupérer toutes les demandes avec les templates
$requests = $pdo->query("
    SELECT r.*, t.name as template_name 
    FROM card_requests r
    LEFT JOIN card_templates t ON r.template_id = t.id
    ORDER BY r.created_at DESC
")->fetchAll();

// Compter les demandes par statut
$stats = $pdo->query("
    SELECT status, COUNT(*) as count 
    FROM card_requests 
    GROUP BY status
")->fetchAll();

$statsByStatus = [];
foreach ($stats as $stat) {
    $statsByStatus[$stat['status']] = $stat['count'];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Gestion des demandes de cartes</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <i class="fas fa-crown"></i>
                Admin Panel
            </div>
            <nav class="nav">
                <a href="?logout=1" class="nav-link">
                    <i class="fas fa-sign-out-alt"></i>
                    Déconnexion
                </a>
                <a href="<?= BASE_URL ?>" class="nav-link">
                    <i class="fas fa-home"></i>
                    Retour au site
                </a>
            </nav>
        </header>

        <?php if (isset($_GET['updated'])): ?>
            <div class="toast show success">
                Demande #<?= intval($_GET['updated']) ?> mise à jour avec succès
            </div>
        <?php endif; ?>

        <h1>📋 Gestion des demandes de cartes</h1>

        <!-- Statistiques -->
        <div class="features-grid" style="margin-bottom: 2rem;">
            <div class="feature-card">
                <div class="stat-number"><?= count($requests) ?></div>
                <div class="stat-label">Total demandes</div>
            </div>
            <div class="feature-card">
                <div class="stat-number"><?= $statsByStatus['pending'] ?? 0 ?></div>
                <div class="stat-label">En attente</div>
            </div>
            <div class="feature-card">
                <div class="stat-number"><?= $statsByStatus['completed'] ?? 0 ?></div>
                <div class="stat-label">Terminées</div>
            </div>
        </div>

        <!-- Tableau des demandes -->
        <div style="overflow-x: auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Template</th>
                        <th>Utilisateur</th>
                        <th>Données</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($requests as $r): 
                        $data = json_decode($r['data_json'], true);
                    ?>
                    <tr>
                        <td>#<?= $r['id'] ?></td>
                        <td><?= formatDate($r['created_at']) ?></td>
                        <td><?= h($r['template_name'] ?? 'N/A') ?></td>
                        <td>
                            <?= h($r['user_email']) ?><br>
                            <small><?= h($r['user_id']) ?></small>
                        </td>
                        <td>
                            <button onclick="toggleDetails(<?= $r['id'] ?>)" class="admin-btn">
                                <i class="fas fa-eye"></i> Voir
                            </button>
                        </td>
                        <td>
                            <span class="status-badge <?= getStatusClass($r['status']) ?>">
                                <?= getStatusLabel($r['status']) ?>
                            </span>
                        </td>
                        <td>
                            <form method="post" class="admin-actions">
                                <input type="hidden" name="request_id" value="<?= $r['id'] ?>">
                                
                                <select name="status">
                                    <option value="pending" <?= $r['status']=='pending'?'selected':'' ?>>En attente</option>
                                    <option value="in_progress" <?= $r['status']=='in_progress'?'selected':'' ?>>En cours</option>
                                    <option value="completed" <?= $r['status']=='completed'?'selected':'' ?>>Terminé</option>
                                    <option value="rejected" <?= $r['status']=='rejected'?'selected':'' ?>>Rejeté</option>
                                </select>
                                
                                <textarea name="admin_notes" placeholder="Notes admin..."><?= h($r['admin_notes']) ?></textarea>
                                
                                <button type="submit" name="update_status" class="admin-btn">
                                    <i class="fas fa-save"></i> Mettre à jour
                                </button>
                            </form>
                        </td>
                    </tr>
                    <tr id="details-<?= $r['id'] ?>" style="display: none;">
                        <td colspan="7">
                            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                                <h4>Données soumises :</h4>
                                <pre style="white-space: pre-wrap;"><?= print_r($data, true) ?></pre>
                                <?php if ($r['image_path']): ?>
                                    <h4 style="margin-top: 1rem;">Image :</h4>
                                    <img src="<?= h($r['image_path']) ?>" alt="Upload" style="max-width: 200px; border-radius: 8px;">
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function toggleDetails(id) {
            const row = document.getElementById('details-' + id);
            if (row) {
                row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
            }
        }
    </script>
</body>
</html>