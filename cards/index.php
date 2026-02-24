<?php
require_once 'includes/config.php';
require_once 'includes/functions.php';

// Récupérer tous les templates actifs
$stmt = $pdo->query("SELECT * FROM card_templates WHERE is_active = 1 ORDER BY id ASC");
$templates = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cartes Otaku - OtakuZone</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="logo">
                <i class="fas fa-id-card"></i>
                OtakuZone <span class="logo-accent">Cards</span>
            </div>
            <nav class="nav">
                <a href="<?= BASE_URL ?>" class="nav-link">
                    <i class="fas fa-home"></i>
                    <span>Accueil</span>
                </a>
                <a href="#templates" class="nav-link">
                    <i class="fas fa-layer-group"></i>
                    <span>Templates</span>
                </a>
                <a href="<?= BASE_URL ?>/#/profil" class="nav-link">
                    <i class="fas fa-user"></i>
                    <span>Mon Profil</span>
                </a>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-content">
                <h1>Crée ta carte <span class="gradient-text">Otaku</span> personnalisée</h1>
                <p>Choisis parmi nos templates exclusifs et deviens une légende de l'univers OtakuZone</p>
                <a href="#templates" class="btn btn-primary btn-large">
                    <i class="fas fa-magic"></i>
                    Commencer
                </a>
            </div>
            <div class="hero-stats">
                <div class="stat-item">
                    <div class="stat-number">2</div>
                    <div class="stat-label">Templates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">∞</div>
                    <div class="stat-label">Possibilités</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">✨</div>
                    <div class="stat-label">Exclusif</div>
                </div>
            </div>
        </section>

        <!-- Templates Grid -->
        <section id="templates" class="templates-section">
            <h2 class="section-title">Choisis ton <span class="gradient-text">template</span></h2>
            <p class="section-subtitle">Chaque carte est unique, comme toi</p>

            <div class="template-grid">
                <?php foreach ($templates as $template): 
                    $fields = json_decode($template['fields_json'], true);
                ?>
                <div class="template-card" data-id="<?= $template['id'] ?>">
                    <div class="template-image">
                        <?php if ($template['image']): ?>
                            <img src="<?= h($template['image']) ?>" alt="<?= h($template['name']) ?>">
                        <?php else: ?>
                            <div class="template-image-placeholder">
                                <i class="fas fa-id-card"></i>
                            </div>
                        <?php endif; ?>
                    </div>
                    <div class="template-content">
                        <h3 class="template-title"><?= h($template['name']) ?></h3>
                        <p class="template-desc"><?= h($template['description']) ?></p>
                        <div class="template-features">
                            <?php foreach (array_slice($fields, 0, 3) as $field): ?>
                                <span class="feature-tag">
                                    <i class="fas fa-check-circle"></i>
                                    <?= h($field['label']) ?>
                                </span>
                            <?php endforeach; ?>
                        </div>
                        <button class="btn btn-primary choose-template" data-id="<?= $template['id'] ?>">
                            <i class="fas fa-pen-fancy"></i>
                            Choisir ce modèle
                        </button>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- Features -->
        <section class="features-section">
            <h2 class="section-title">Pourquoi créer ta carte ?</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <i class="fas fa-crown feature-icon"></i>
                    <h3>Statut exclusif</h3>
                    <p>Montre ton niveau et ton appartenance à la communauté</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-paint-brush feature-icon"></i>
                    <h3>Personnalisable</h3>
                    <p>Chaque carte est unique et reflète ta personnalité</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-share-alt feature-icon"></i>
                    <h3>Partageable</h3>
                    <p>Montre ta carte à tes amis et sur les réseaux</p>
                </div>
            </div>
        </section>
    </div>

    <!-- Modal pour le formulaire -->
    <div id="templateModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2 id="modalTitle">Créer ta carte</h2>
            <form id="requestForm" enctype="multipart/form-data">
                <div id="dynamicForm"></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-large">
                        <i class="fas fa-paper-plane"></i>
                        Envoyer la demande
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Loading spinner -->
    <div id="loadingSpinner" class="loading-spinner" style="display: none;">
        <div class="spinner"></div>
    </div>

    <!-- Toast notifications -->
    <div id="toast" class="toast"></div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/script.js"></script>
</body>
</html>