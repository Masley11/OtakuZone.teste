<?php
// Récupérer l'utilisateur courant si pas déjà fait
if (!function_exists('getCurrentUser')) {
    require_once __DIR__ . '/auth.php';
}
$user = getCurrentUser();
$isLoggedIn = !!$user;
?>
<header class="header">
    <div class="brand">
        <div class="brand-icon">🎌</div>
        <div class="brand-text">OtakuZone</div>
    </div>

    <div class="header-right">
        <div class="user-actions">
            <a href="/#/profil" class="user-btn" title="Profil">
                <i class="fas fa-user"></i>
            </a>
            <button id="themeBtn" class="theme-btn" title="Changer le thème">
                <i class="fas fa-moon"></i>
            </button>
        </div>

        <a href="/#/login" class="login-btn" id="navLogin">
            <i class="fas fa-sign-in-alt"></i>
            <span><?= $isLoggedIn ? 'Mon compte' : 'Connexion' ?></span>
        </a>
    </div>
</header>

<nav class="nav">
    <div class="nav-scroll">
        <a href="/#/home" class="nav-link">
            <i class="fas fa-home"></i>
            <span>Accueil</span>
        </a>
        <a href="/#/mood" class="nav-link">
            <i class="fas fa-masks-theater"></i>
            <span>Mood</span>
        </a>
        <a href="/#/anime" class="nav-link">
            <i class="fas fa-tv"></i>
            <span>Anime</span>
        </a>
        <a href="/#/quiz" class="nav-link">
            <i class="fas fa-brain"></i>
            <span>Quiz</span>
        </a>
        <a href="/cards/" class="nav-link active">
            <i class="fas fa-id-card"></i>
            <span>Cartes</span>
        </a>
        <a href="/#/ranking" class="nav-link">
            <i class="fas fa-trophy"></i>
            <span>Classement</span>
        </a>
    </div>
</nav>
