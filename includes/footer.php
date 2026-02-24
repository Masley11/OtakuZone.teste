<footer class="footer">
    <div class="footer-content">
        <small>© <?= date('Y') ?> OtakuZone - Anime, Manga & Quiz</small>
        <div class="footer-links">
            <a href="/#/home">Accueil</a>
            <a href="/#/anime">Anime</a>
            <a href="/#/quiz">Quiz</a>
            <a href="/cards/">Cartes</a>
        </div>
    </div>
</footer>

<!-- Script pour le thème -->
<script>
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        const savedTheme = localStorage.getItem('otakuzone_theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light');
            const isLight = document.body.classList.contains('light');
            localStorage.setItem('otakuzone_theme', isLight ? 'light' : 'dark');
            themeBtn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
</script>
