
// ===== Supabase config (anti double-load) =====
const SUPABASE_URL = "https://lrvwhewjudeiuwqcaeqz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TQG7By7w-HIQymSz37tTEQ_6UeF2ktN";

window.__OZ_SUPABASE__ = window.__OZ_SUPABASE__ || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var supabase = window.__OZ_SUPABASE__;

let currentUser = null;
const OZ_VERSION = "1.5.7"; // <- incrémente à chaque update
async function refreshSession() {
  try {
    const { data } = await supabase.auth.getSession();
    currentUser = data?.session?.user || null;
    updateAuthUI();
    return currentUser;
  } catch (error) {
    console.error("Erreur lors du rafraîchissement de la session:", error);
    currentUser = null;
    updateAuthUI();
    return null;
  }
}

const QUIZ_DAY_KEY = "oz_quiz_day";
const QUIZ_XP_KEY = "oz_xp_local";
// ===== QUIZ SYSTEM (modulaire) =====
const QUIZ_BANKS = {
  "default": "js/quiz/default.json",
  "anime": "js/quiz/anime.json",
  "shonen": "js/quiz/shonen.json",
  "isekai": "js/quiz/isekai.json",
  "event": "js/quiz/event.json"
};

// ===== Quiz Spécial (Event) — activation automatique par dates =====
const QUIZ_EVENT = {
  title: "🌟 Quiz Spécial Anime",
  subtitle: "Édition limitée — disponible pendant une période définie",
  bank: "event",
  start: "2026-01-26",
  end: "2026-01-02"
};

function updateAuthUI() {
  const navLogin = document.getElementById("navLogin");
  if (!navLogin) return;

  const originalHTML = navLogin.innerHTML;
  const originalClasses = navLogin.className;
  
  const newNavLogin = document.createElement('a');
  newNavLogin.id = 'navLogin';
  newNavLogin.className = originalClasses;
  
  if (currentUser) {
    newNavLogin.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Déconnexion</span>';
    newNavLogin.href = '#';
    newNavLogin.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleLogout();
    };
    newNavLogin.style.cursor = 'pointer';
  } else {
    newNavLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Connexion</span>';
    newNavLogin.href = '#/login';
    newNavLogin.onclick = null;
  }

  navLogin.parentNode.replaceChild(newNavLogin, navLogin);
  
  const isLoginPage = getPath() === "/login";
  newNavLogin.classList.toggle("active", isLoginPage);
}

async function updateAuthUIAndFavs() {
  const navLogin = document.getElementById("navLogin");
  if (!navLogin) return;

  const newNavLogin = document.createElement('a');
  newNavLogin.id = 'navLogin';
  newNavLogin.className = navLogin.className;
  
  if (currentUser) {
    newNavLogin.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Déconnexion</span>';
    newNavLogin.href = '#';
    newNavLogin.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleLogout();
    };
    newNavLogin.style.cursor = 'pointer';
  } else {
    newNavLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Connexion</span>';
    newNavLogin.href = '#/login';
    newNavLogin.onclick = null;
  }

  navLogin.parentNode.replaceChild(newNavLogin, navLogin);
  
  const isLoginPage = getPath() === "/login";
  newNavLogin.classList.toggle("active", isLoginPage);

  if (currentUser) {
    await refreshFavCache();
    await migrateLocalFavsToSupabaseOnce();
    await refreshFavCache();
  }
}

function syncUI() {
  updateAuthUI();
  render();
}

const view = document.getElementById("view");
const year = document.getElementById("year");
year.textContent = new Date().getFullYear();

const routes = {
  "/home": () => `
  <div class="page">

    <div class="card hero-home">
      <h1>🎌 Bienvenue sur OtakuZone</h1>
      <p class="hero-sub">
        Ton hub otaku intelligent.<br>
        Découvre des anime selon ton <b>mood</b>, gagne de l'XP et construis ton profil.
      </p><div class="hero-actions">
  <a href="#/mood" class="btn primary">🎭 Trouver un anime selon mon mood</a>
  <a href="#/quiz" class="btn ghost">🧠 Daily Quiz (+XP)</a>
</div><button id="homeInstallBtn" class="btn ghost">
  📱 Installer
</button>


    
      ${(isQuizEventActive()) ? `
      <div class="card" style="padding:12px; margin-top:12px">
        <div style="font-weight:800">${QUIZ_EVENT.title}</div>
        <div class="small" style="margin-top:4px">${QUIZ_EVENT.subtitle}</div>
        <div class="row" style="margin-top:10px; justify-content:space-between; align-items:center">
          <a href="#/quiz?bank=${QUIZ_EVENT.bank}" class="btn primary">Jouer le spécial</a>
          <span class="small" id="homeEventCount"></span>
        </div>
        <div class="small" style="margin-top:8px; opacity:.9">
          Astuce : <a href="#/login">connecte-toi</a> pour sauvegarder ton XP et apparaître dans les statistiques.
        </div>
      </div>
      ` : ``}
<section class="card seo-compact">
  <h2>OtakuZone, le hub des otaku</h2>
  <p class="small">
    Recommandations d'anime selon ton mood, quiz + XP, favoris et profil. Simple, rapide, fun.
  </p>

  <details class="seo-more">
    <summary class="btn ghost">En savoir plus</summary>
    <div class="seo-more-body small">
      <p><strong>OtakuZone</strong> réunit anime, manga, quiz et communauté. Tu peux découvrir des titres selon ton envie (chill, hype, triste, mind-blowing), jouer au Daily Quiz et progresser en XP.</p>
      <p><strong>FAQ</strong></p>
      <p><b>Comment gagner de l'XP ?</b> En jouant aux quiz et en participant au site.</p>
      <p><b>Est-ce une app ?</b> Oui, installable en PWA (Android/iOS selon navigateur).</p>
    </div>
  </details>
</section>
    </div>

  </div>
`,
"/ranking": () => `
  <div class="page">
    <div class="page-head">
      <h1>🏆 Classement</h1>
      <p class="small">Top otakus (XP + badges). Le rang suit ton total XP.</p>
    </div>

    <div class="card" style="padding:12px">
      <div class="row" style="justify-content:space-between;margin:0">
        <div style="font-weight:800">Top 50</div>
        <button id="btnReloadRanking" class="btn ghost">Actualiser</button>
      </div>

      <div id="rankingBox" style="margin-top:10px"></div>
    </div>
  </div>
`,
  "/auth/callback": () => `
    <div class="page">
      <div class="page-head">
        <h1>✅ Confirmation</h1>
        <p class="small">On finalise ta connexion...</p>
      </div>
      <div id="cbMsg" class="loading">Traitement…</div>
    </div>
  `,
  "/mood": () => `
  <div class="page">
    <div class="page-head">
      <h1>🎭 Mood Anime</h1>
      <p class="small">Décris ton envie, ou choisis un mood.</p>
    </div>

    <div class="card" style="padding:12px">
      <div style="font-weight:800">📝 Décris ton mood</div>
      <div class="small">Ex: "Je veux un anime chill, pas romance, un truc calme."</div>

      <div class="row" style="margin-top:10px">
        <input id="moodText" class="input" placeholder="Écris ici..." />
        <button id="moodGo" class="btn">Trouver</button>
      </div>

      <div id="moodExplain" class="small" style="margin-top:8px"></div>
    </div>

    <div class="grid" style="margin-top:12px">
      ${MOODS.map(m => `
        <div class="card mood-card" data-mood="${m.id}" style="padding:12px">
          <div style="font-size:32px">${m.emoji}</div>
          <div style="font-weight:800;margin-top:6px">${m.title}</div>
          <div class="small" style="margin-top:4px">${m.desc}</div>
        </div>
      `).join("")}
    </div>
  </div>
`,
  "/login": () => `
    <div class="page">
      <div class="page-head">
        <h1>🔐 Connexion</h1>
        <p class="small">Connecte-toi pour synchroniser ton profil, rangs, favoris et demandes de carte.</p>
      </div>
<div class="oz-alert oz-alert-warn" id="confirmHint" style="margin-bottom:10px">
  📩 Après l’inscription, tu dois confirmer ton compte via l’email reçu (vérifie aussi “Spam”).
</div>
      <div id="authBox" class="card" style="padding:12px">
        <div class="row">
          <input id="authEmail" class="input" placeholder="Email" />
          <input id="authPass" class="input" placeholder="Mot de passe" type="password" />
        </div>

        <div class="row" style="margin-top:10px">
          <button id="btnSignIn" class="btn">Se connecter</button>
          <button id="btnSignUp" class="btn">Créer un compte (Inscription)</button>
        </div>

        <div id="authMsg" class="small" style="margin-top:10px"></div>
      </div>

      <div class="small" style="margin-top:10px">
        Astuce : utilise un vrai email (tu pourras ajouter la vérification plus tard).
      </div>
    </div>
  `,
 "/profil": () => `
  <div class="page">
    <div class="page-head">
      <h1>👤 Mon Profil</h1>
      <p class="small">Ton identité OtakuZone (XP, rang, streak, favoris).</p>
    </div>

    <div id="profileStatus" class="loading">Chargement du profil...</div>

    <div id="profileBox" class="profile-wrap" style="display:none">

      <!-- Carte identité -->
      <div class="card profile-card" style="padding:12px">
        <div class="profile-top">
          <div class="avatar" id="pAvatarWrap" title="Avatar">
            <img id="pAvatarImg" alt="Avatar" />
            <div id="pAvatarFallback">🎌</div>
          </div>

          <div class="profile-meta">
            <div class="profile-name" id="pNameDisplay">—</div>
            <div class="small" id="pEmailDisplay"></div>

            <div class="profile-badges">
              <span class="rank-badge rank-senpai" id="pRankBadge">
                <span class="rank-dot"></span> —
              </span>

              <span class="badge-oz r-rare" id="pXpBadge"><i class="fas fa-star"></i> XP: —</span>
              <span class="badge-oz r-epic" id="pStreakBadge"><i class="fas fa-fire"></i> Streak: —</span>
              <span class="badge-oz r-common" id="pFavBadge"><i class="fas fa-heart"></i> Favoris: —</span>
            </div>
          </div>

          <button id="btnRefreshProfile" class="btn" title="Rafraîchir">↻</button>
        </div>

        <div class="xp" aria-label="Progression XP" style="margin-top:10px">
          <div class="xp-top">
            <div class="xp-title" id="pXpTitle">Niveau —</div>
            <div class="xp-meta" id="pXpMeta">— / — XP</div>
          </div>

          <div class="xp-bar">
            <div class="xp-fill" id="pXpFill" style="width:0%"></div>
          </div>

          <div class="xp-meta" id="pXpNext">—</div>
        </div>

        <div class="section" style="margin-top:10px">
          <div class="small">Bio</div>
          <div id="pBioPreview" class="bio-preview">—</div>
        </div>
      </div>

      <!-- 🎖️ Succès -->
      <div class="card" style="padding:12px">
        <div class="row" style="justify-content:space-between;margin:0">
          <div style="font-weight:800">🎖️ Succès</div>
          <div class="small">Débloqués automatiquement</div>
        </div>

        <div id="achievementsList" class="badges" style="margin-top:10px"></div>
        <div id="achievementsHint" class="small" style="margin-top:8px"></div>
      </div>

      <!-- Actions profil -->
      <div class="card" style="padding:12px">
        <div class="row" style="justify-content:space-between;margin:0">
          <div style="font-weight:800">⚙️ Paramètres</div>
          <button id="btnOpenEditProfile" class="btn ghost">Modifier mon profil</button>
        </div>
        <div class="small" style="margin-top:8px; opacity:.9">
          Astuce : garde ton profil propre, et ouvre l'édition seulement quand tu veux.
        </div>
      </div>

      <!-- MODAL ÉDITION PROFIL (caché par défaut) -->
      <div id="editProfileModal" class="oz-modal" aria-hidden="true">
        <div class="oz-modal-overlay" data-close="1"></div>

        <div class="oz-modal-card" role="dialog" aria-modal="true" aria-label="Modifier le profil">
          <div class="oz-modal-head">
            <div style="font-weight:900">✍️ Modifier le profil</div>
            <button id="btnCloseEditProfile" class="btn ghost" aria-label="Fermer">✕</button>
          </div>

          <div class="oz-modal-body">
            <div class="row">
              <input id="pUsername" class="input" placeholder="Pseudo" />
              <input id="pRank" class="input" placeholder="Rang" disabled />
              <input id="pXp" class="input" placeholder="XP" disabled />
            </div>

            <div class="row">
              <input id="pAvatarUrl" class="input" placeholder="Avatar (URL d'image, optionnel)" />
            </div>

            <div style="margin-top:10px">
              <textarea id="pBio" class="input" placeholder="Bio (optionnel)" style="min-height:90px"></textarea>
            </div>

            <div class="row" style="margin-top:10px">
              <button id="btnSaveProfile" class="btn primary">Enregistrer</button>
              <button id="btnLogout" class="btn">Déconnexion</button>
            </div>

            <div id="profileMsg" class="small" style="margin-top:10px"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
`,
  "/anime": () => `
    <div class="page">
      <div class="page-head">
        <h1>📺 Anime</h1>
        <p class="small">Recherche en temps réel (API publique). Évite de spammer trop vite.</p>
        <div class="row" id="collections">
          <button class="chip" data-type="genre" data-id="1">🔥 Shonen qui hype</button>
          <button class="chip" data-type="genre" data-id="36">🌙 Chill du soir</button>
          <button class="chip" data-type="genre" data-id="22">😭 Émotions</button>
          <button class="chip" data-type="genre" data-id="40">🧠 Mindblown</button>
        </div>
        <div class="row">
          <input id="animeSearch" class="input" placeholder="Ex: Naruto, One Piece..." />
          <button id="animeBtn" class="btn">Rechercher</button>
        </div>
      </div>
      <div id="animeStatus" class="loading">Tape un titre et lance la recherche.</div>
      <div id="animeGrid" class="grid" style="margin-top:12px"></div>
    </div>
  `,
  "/quiz": () => `
  <div class="page">
    <div class="page-head">
      <h1>🧠 Daily Quiz</h1>
      <p class="small">5 questions, 60–90 secondes. Choisis ta banque de questions !</p>
    </div>
    ${!currentUser ? `
    <div class="card" style="padding:10px; margin-top:10px">
      <div class="small">
        👀 Tu joues en invité : ton XP reste sur ce téléphone.
        <a href="#/login">Connecte-toi</a> pour sauvegarder ton XP, ton rang et tes succès.
      </div>
    </div>
    ` : ``}

    ${(isQuizEventActive()) ? `
    <div class="card" style="padding:12px; margin-top:12px">
      <div style="font-weight:800">${QUIZ_EVENT.title}</div>
      <div class="small" style="margin-top:4px">${QUIZ_EVENT.subtitle}</div>
      <div class="small" id="quizEventCount" style="margin-top:6px"></div>
    </div>
    ` : ``}

    
    <div class="section">
      <div class="row">
        <select id="quizBankSelect" class="input">
          <option value="default">🎲 Questions Générales</option>
          <option value="anime">📺 Anime & Manga</option>
          <option value="shonen">🔥 Shonen & Combats</option>
          <option value="isekai">🌀 Isekai & Fantaisie</option>
        </select>
        <button id="quizLoadBank" class="btn">Charger</button>
      </div>
      <div id="bankStatus" class="small" style="margin-top:5px"></div>
    </div>
    
    <div class="badge" id="quizTimer">⏱️ 90s</div>
    <div id="quizBox" class="section">
      <div id="quizIntro">
        <p>Banque actuelle: <span id="currentBankName">Générale</span></p>
        <p>Prêt ?</p>
        <button id="quizStartBtn" class="btn">Démarrer</button>
      </div>

      <div id="quizRun" style="display:none">
        <div class="row" style="justify-content:space-between; margin:0">
          <div class="badge" id="quizProgress">Question 1/5</div>
          <div class="badge" id="quizScore">Score: 0</div>
        </div>

        <h2 id="quizQ" style="margin-top:12px"></h2>
        <div id="quizChoices" class="grid" style="margin-top:10px"></div>

        <div class="small" id="quizHint" style="margin-top:10px"></div>
      </div>

      <div id="quizDone" style="display:none">
        <h2>✅ Terminé</h2>
        <p id="quizResult" class="small"></p>
        <div class="row">
          <button id="quizRestartBtn" class="btn">Rejouer</button>
          <a href="#/home" class="btn" style="text-decoration:none;display:inline-block">Retour</a>
        </div>
      </div>
    </div>
  </div>
`,
"/admin/mood": () => `
  <div class="page">
    <div class="page-head">
      <h1>🛠️ Admin — Mood Trainer</h1>
      <p class="small">Classe les phrases inconnues pour améliorer la détection.</p>
    </div>

    <div class="card" style="padding:12px">
      <div class="row" style="justify-content:space-between;margin:0">
        <div style="font-weight:800">📥 Phrases inconnues</div>
        <button id="btnClearUnknown" class="btn">Vider</button>
      </div>

      <div id="unknownList" style="margin-top:10px"></div>

      <div class="small" style="margin-top:12px;opacity:.9">
        Astuce : ouvre cette page en tapant <strong>#/admin/mood</strong> dans l'URL.
      </div>
    </div>
  </div>
`,
  "/manga": () => `
    <h1>📚 Manga</h1>
    <p>Recommandations, lectures, collections… bientôt.</p>
  `,
  "/communaute": () => `
    <h1>💬 Communauté</h1>
    <p>Forum, profils, badges… bientôt.</p>
  `,
 "/favoris": () => {
  location.hash = "#/collection";
  return `<div class="page"><div class="card" style="padding:12px">Redirection...</div></div>`;
},
  "/collection": () => `
  <div class="page">
    <div class="page-head">
      <h1>🎒 Ma Collection</h1>
      <p class="small">Tes animes sauvegardés + pourquoi tu les aimes.</p>
    </div>
    <div id="favGrid" class="grid"></div>
  </div>
`,
  "/anime-detail": () => `
    <div class="page">
      <div id="detailStatus" class="loading">Chargement de l'anime...</div>
      <div id="detailView"></div>
      <div class="section">
        <h2>✨ Recommandations</h2>
        <div id="recoGrid" class="grid"></div>
      </div>
    </div>
  `,
};

// Initialisation du thème
function initTheme() {
  const themeBtn = document.getElementById("themeBtn");
  const savedTheme = localStorage.getItem("otakuzone_theme");
  
  if (!themeBtn) return;
  
  if (savedTheme === "light") {
    document.body.classList.add("light");
    updateThemeIcon();
  }
  
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    updateThemeIcon();
    localStorage.setItem("otakuzone_theme", document.body.classList.contains("light") ? "light" : "dark");
  });
}

function updateThemeIcon() {
  const themeBtn = document.getElementById("themeBtn");
  if (!themeBtn) return;
  
  const isLight = document.body.classList.contains("light");
  const themeIcon = themeBtn.querySelector("i");
  if (themeIcon) {
    themeIcon.className = isLight ? "fas fa-sun" : "fas fa-moon";
  } else {
    themeBtn.textContent = isLight ? "☀️" : "🌙";
  }
}

function getPath() {
  const hash = location.hash.replace("#", "");
  const clean = (hash || "/home").split("?")[0];
  return clean || "/home";
}

async function render() {
  const path = getPath();

  const protectedRoutes = new Set(["/profil", "/collection"]);
  if (protectedRoutes.has(path) && !currentUser) {
    showToast("Connecte-toi pour accéder à cette page 🔐");
    location.hash = "#/login";
    return;
  }

  const animeDetailMatch = path.match(/^\/anime\/(\d+)$/);
  const moodDetailMatch = path.match(/^\/mood\/([^\/]+)$/);

  if (animeDetailMatch) {
    const id = Number(animeDetailMatch[1]);
    view.innerHTML = routes["/anime-detail"]
      ? routes["/anime-detail"]()
      : `<div class="loading">Chargement...</div>`;
    await renderAnimeDetail(id);
  } else if (moodDetailMatch) {
    const moodId = String(moodDetailMatch[1] || "");
    view.innerHTML = renderMoodDetailPage(moodId);
    await wireMoodDetailPage(moodId);
  } else {
    const page = routes[path]
      ? routes[path]()
      : `<div class="page"><h1>404</h1><p>Page introuvable.</p></div>`;
    view.innerHTML = page;

    if (path === "/home") {
      wireHomePage();
      wireHomeInstallButton();
    }
    if (path === "/login") wireLoginPage();
    if (path === "/auth/callback") handleAuthCallback();
    if (path === "/profil") await wireProfilePage();
    if (path === "/anime") wireAnimePage();
    if (path === "/favoris") await renderFavs();
    if (path === "/quiz") wireQuizPage();
    if (path === "/mood") wireMoodPage();
    if (path === "/collection") await renderFavs();
    if (path === "/ranking")
    wireRankingPage();
    if (path === "/admin/mood") wireMoodTrainer();
    trackPageView(path);
  }
  
  updateActiveNav();
}

function updateActiveNav() {
  const path = getPath();
  
  document.querySelectorAll(".nav-link").forEach((a) => {
    const href = a.getAttribute("href");
    const isActive = href === `#${path}`;
    a.classList.toggle("active", isActive);
  });

  const navLogin = document.getElementById("navLogin");
  if (navLogin) {
    const isLoginPage = path === "/login";
    navLogin.classList.toggle("active", isLoginPage);
  }
}

window.addEventListener("hashchange", () => render());

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  render();
});

renderVersionBadge();
let animeAbort = null;

function trackPageView(path) {
  if (typeof gtag !== "function") return;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title
  });
}
function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function renderAnimeCard(a) {
  const title = a.title || "Sans titre";
  const score = a.score ?? "—";
  const year = a.year ?? "—";
  const img =
    a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const genres = (a.genres || []).slice(0, 2).map((g) => g.name).join(" • ");

  return `
    <article class="card clickable" data-id="${a.mal_id}">
      ${
        img
          ? `<img src="${img}" alt="${title}">`
          : `<div class="card-cover"></div>`
      }
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div class="card-title">${title}</div>
          <button class="fav-btn" data-fav-id="${a.mal_id}">
            ${isFav(a.mal_id) ? "❤️" : "🤍"}
          </button>
        </div>

        <div class="badges">
          <span class="badge">⭐ ${score}</span>
          <span class="badge">${year}</span>
          ${genres ? `<span class="badge">${genres}</span>` : ""}
        </div>
        <input class="input fav-reason"
          data-reason-id="${a.mal_id}"
          placeholder="Pourquoi tu l'aimes ? (ex: OST incroyable)"
          style="margin-top:10px"
          ${isFav(a.mal_id) ? "" : "disabled"}
        />
      </div>
    </article>
  `;
}

async function searchAnimeJikan(query) {
  const status = document.getElementById("animeStatus");
  const grid = document.getElementById("animeGrid");
  if (!status || !grid) return;

  const q = (query || "").trim();
  if (!q) {
    status.className = "loading";
    status.textContent = "Tape un titre et lance la recherche.";
    showAnimeSkeleton(grid, 8);
    return;
  }

  if (animeAbort) animeAbort.abort();
  animeAbort = new AbortController();

  status.className = "loading";
  status.textContent = `Recherche: "${q}"...`;
  grid.innerHTML = "";

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
        q
      )}&limit=12&sfw=true`,
      { signal: animeAbort.signal }
    );
    if (!res.ok) throw new Error(res.status);

    const json = await res.json();
    const items = json?.data || [];

    if (!items.length) {
      status.textContent = "Aucun résultat.";
      return;
    }

    status.className = "small";
    status.textContent = `${items.length} résultat(s)`;

    grid.innerHTML = items.map(renderAnimeCard).join("");
    wireAnimeCardEvents(grid);
  } catch (err) {
    if (err.name === "AbortError") return;
    status.className = "error";
    status.textContent = "Erreur API. Réessaie plus tard.";
  }
}

function wireAnimePage() {
  const input = document.getElementById("animeSearch");
  const btn = document.getElementById("animeBtn");
  if (!input || !btn) return;

  const run = () => searchAnimeJikan(input.value);

  btn.addEventListener("click", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  input.addEventListener("input", debounce(run, 500));

  document.querySelectorAll("#collections .chip").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = btn.getAttribute("data-type");

      if (type === "genre") {
        const genreId = Number(btn.getAttribute("data-id"));
        fetchAnimeByGenre(genreId);
        return;
      }

      const q = btn.getAttribute("data-q") || "";
      document.getElementById("animeSearch").value = q;
      searchAnimeJikan(q);
    });
  });
}

async function fetchAnimeByGenreInto(genreId, status, grid) {
  if (!status || !grid) return;

  status.className = "loading";
  status.textContent = "Chargement...";
  showAnimeSkeleton(grid, 8);

  try {
    const url = `https://api.jikan.moe/v4/anime?genres=${Number(genreId)}&order_by=score&sort=desc&limit=12&sfw=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    const items = json?.data || [];

    status.className = "small";
    status.textContent = `${items.length} résultat(s)`;

    grid.innerHTML = items.map(renderAnimeCard).join("");
    wireAnimeCardEvents(grid);
  } catch (err) {
    status.className = "error";
    status.textContent = "Erreur de chargement.";
  }
}

async function fetchAnimeByGenre(genreId) {
  const status = document.getElementById("animeStatus");
  const grid = document.getElementById("animeGrid");
  return fetchAnimeByGenreInto(genreId, status, grid);
}

// =========================
// ❤️ Favoris
// =========================
let favCache = [];
let favCacheFetchedAt = 0;

function favLocalKey() {
  return "otakuzone_favs_v1";
}

function loadFavsLocal() {
  try {
    return JSON.parse(localStorage.getItem(favLocalKey()) || "[]");
  } catch {
    return [];
  }
}

function saveFavsLocal(list) {
  localStorage.setItem(favLocalKey(), JSON.stringify(list));
}

async function loadFavs() {
  if (!currentUser) return loadFavsLocal();

  const { data, error } = await supabase
    .from("favorites")
    .select("anime_id, title, image_url, score, year, reason, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("loadFavs supabase:", error.message);
    return loadFavsLocal();
  }

  return (data || []).map((r) => ({
    id: Number(r.anime_id),
    title: r.title,
    img: r.image_url,
    score: r.score,
    year: r.year,
    reason: r.reason || "",
    created_at: r.created_at,
  }));
}

async function upsertFavRemote(item) {
  if (!currentUser) return;
  const payload = {
    user_id: currentUser.id,
    anime_id: Number(item.id),
    title: item.title || "",
    image_url: item.img || "",
    score: item.score || "",
    year: item.year || "",
    reason: item.reason || "",
  };

  const { error } = await supabase
    .from("favorites")
    .upsert(payload, { onConflict: "user_id,anime_id" });

  if (error) console.warn("upsertFavRemote:", error.message);
}

async function deleteFavRemote(animeId) {
  if (!currentUser) return;
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("anime_id", Number(animeId));

  if (error) console.warn("deleteFavRemote:", error.message);
}

async function refreshFavCache(force = false) {
  const now = Date.now();
  if (!force && now - favCacheFetchedAt < 8000) return favCache;

  favCache = await loadFavs();
  favCacheFetchedAt = now;

  saveFavsLocal(favCache);
  return favCache;
}

function isFav(id) {
  return favCache.some((f) => f.id === Number(id));
}

async function toggleFav(anime) {
  const id = Number(anime.id);
  const exists = favCache.some((f) => f.id === id);

  if (exists) {
    favCache = favCache.filter((f) => f.id !== id);
    saveFavsLocal(favCache);
    await deleteFavRemote(id);
    return false;
  }

  const item = {
    id,
    title: anime.title || "Sans titre",
    img: anime.img || "",
    score: anime.score || "",
    year: anime.year || "",
    reason: anime.reason || "",
  };

  favCache = [item, ...favCache];
  saveFavsLocal(favCache);
  await upsertFavRemote(item);
  return true;
}

async function setFavReason(id, reason) {
  id = Number(id);
  const it = favCache.find((f) => f.id === id);
  if (!it) return;

  it.reason = String(reason || "").slice(0, 120);
  saveFavsLocal(favCache);
  await upsertFavRemote(it);
}

async function renderFavs() {
  const grid = document.getElementById("favGrid");
  if (!grid) return;

  await refreshFavCache(true);
  const favs = favCache;

  if (!favs.length) {
    grid.innerHTML = `<div class="loading">Aucun favori pour l'instant. Va dans Anime et ajoute ❤️</div>`;
    return;
  }

  grid.innerHTML = favs
    .map(
      (f) => `
    <article class="card" data-fav-card="${f.id}">
      ${
        f.img
          ? `<img src="${f.img}" alt="${escapeHtml(f.title)}">`
          : `<div class="card-cover"></div>`
      }
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div class="card-title">${escapeHtml(f.title)}</div>
          <button class="fav-remove btn" data-remove-id="${f.id}" title="Retirer des favoris">🗑️</button>
        </div>

        <div class="badges">
          <span class="badge">⭐ ${escapeHtml(f.score || "—")}</span>
          <span class="badge">${escapeHtml(f.year || "—")}</span>
        </div>

        <div class="small" style="margin-top:10px">
          <strong>Pourquoi :</strong> ${
            f.reason ? escapeHtml(f.reason) : "<em>(pas encore noté)</em>"
          }
        </div>
      </div>
    </article>
  `
    )
    .join("");

  grid.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.removeId);
      await toggleFav({ id });
      showToast("Retiré des favoris 🗑️");
      renderFavs();
    });
  });
}

function showAnimeSkeleton(grid, count = 8) {
  if (!grid) return;
  grid.innerHTML = `
    <div class="skeleton-grid">
      ${Array.from({ length: count })
        .map(
          () => `
        <div class="skeleton-card">
          <div class="skeleton-cover"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function wireAnimeCardEvents(grid) {
  grid.querySelectorAll(".card.clickable").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      const id = Number(card.dataset.id);
      location.hash = `#/anime/${id}`;
    });
  });

  grid.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.favId);
      const card = btn.closest(".card");
      const title = card.querySelector(".card-title").textContent;
      const img = card.querySelector("img")?.src || "";
      const badges = card.querySelectorAll(".badge");

      const nowFav = await toggleFav({
        id,
        title,
        img,
        score: badges[0]?.textContent.replace("⭐", "").trim(),
        year: badges[1]?.textContent.trim(),
      });
      showToast(
        nowFav ? "️Ajouté à la collection ❤️" : "Retiré de la collection 🗑️"
      );

      btn.textContent = nowFav ? "❤️" : "🤍";
      const reasonInput = card.querySelector(".fav-reason");
      if (reasonInput) {
        reasonInput.disabled = !nowFav;
        if (!nowFav) reasonInput.value = "";
      }
    });
  });

  grid.querySelectorAll(".fav-reason").forEach((input) => {
    const id = Number(input.dataset.reasonId);
    const fav = favCache.find((f) => f.id === id);
    if (fav?.reason) input.value = fav.reason;

    input.addEventListener(
      "input",
      debounce(async (e) => {
        await setFavReason(id, e.target.value);
      }, 450)
    );
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderAnimeDetail(id) {
  const status = document.getElementById("detailStatus");
  const wrap = document.getElementById("detailView");
  const recoGrid = document.getElementById("recoGrid");
  if (!status || !wrap || !recoGrid) return;

  status.className = "loading";
  status.textContent = "Chargement de l'anime...";
  wrap.innerHTML = "";
  showAnimeSkeleton(recoGrid, 6);

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
    if (!res.ok) throw new Error(res.status);
    const data = (await res.json())?.data;

    const title = data?.title || "Sans titre";
    const img =
      data?.images?.jpg?.large_image_url || data?.images?.jpg?.image_url || "";
    const score = data?.score ?? "—";
    const year = data?.year ?? "—";
    const episodes = data?.episodes ?? "—";
    const statusTxt = data?.status || "—";
    const synopsis = data?.synopsis || "Synopsis indisponible.";

    status.className = "small";
    status.textContent = " ";

    wrap.innerHTML = `
      <div class="hero">
        ${
          img
            ? `<img class="hero-cover" src="${img}" alt="${escapeHtml(
                title
              )}">`
            : ""
        }
        <div class="hero-body">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div>
              <h1 style="margin:0">${escapeHtml(title)}</h1>
              <div class="kpis" style="margin-top:8px">
                <span class="kpi">⭐ ${score}</span>
                <span class="kpi">${year}</span>
                <span class="kpi">Épisodes: ${episodes}</span>
                <span class="kpi">${escapeHtml(statusTxt)}</span>
            </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;min-width:120px">
              <button id="detailFavBtn" class="fav-btn" data-id="${id}">
                ${isFav(id) ? "❤️" : "🤍"} Favori
              </button>
              <a class="btn" href="#/anime">← Retour</a>
            </div>
          </div>

          <div class="section">
            <h2>Pourquoi tu l'aimes</h2>
            <input id="detailReason" class="input" placeholder="Ex: Les personnages, l'OST, l'ambiance..."
              ${isFav(id) ? "" : "disabled"}
            />
            <div class="small" style="margin-top:6px">Astuce : ajoute en favori pour activer le champ.</div>
          </div>

          <div class="section">
            <h2>Synopsis</h2>
            <p class="synopsis">${escapeHtml(synopsis)}</p>
          </div>
        </div>
      </div>
    `;

    const existing = favCache.find((f) => f.id === Number(id));
    const reasonInput = document.getElementById("detailReason");
    if (reasonInput && existing?.reason) reasonInput.value = existing.reason;

    const favBtn = document.getElementById("detailFavBtn");
    favBtn?.addEventListener("click", async () => {
      const nowFav = await toggleFav({
        id,
        title,
        img,
        score: String(score),
        year: String(year),
      });
      showToast(
        nowFav ? "Ajouté à la collection ❤️" : "Retiré de la collection 🗑️"
      );

      favBtn.innerHTML = `${nowFav ? "❤️" : "🤍"} Favori`;

      const input = document.getElementById("detailReason");
      if (input) {
        input.disabled = !nowFav;
        if (!nowFav) input.value = "";
      }
    });

    reasonInput?.addEventListener(
      "input",
      debounce(async (e) => {
        await setFavReason(id, e.target.value);
      }, 450)
    );

    const recoRes = await fetch(
      `https://api.jikan.moe/v4/anime/${id}/recommendations`
    );
    if (recoRes.ok) {
      const recoJson = await recoRes.json();
      const recos = recoJson?.data || [];
      const entries = recos.map((r) => r.entry).filter(Boolean).slice(0, 12);

      if (!entries.length) {
        recoGrid.innerHTML = `<div class="loading">Pas de recommandations pour cet anime.</div>`;
      } else {
        const fake = entries.map((e) => ({
          mal_id: e.mal_id,
          title: e.title,
          score: "—",
          year: "—",
          genres: [],
          images: e.images,
        }));
        recoGrid.innerHTML = fake.map(renderAnimeCard).join("");
        wireAnimeCardEvents(recoGrid);
      }
    } else {
      recoGrid.innerHTML = `<div class="loading">Recommandations indisponibles.</div>`;
    }
  } catch (err) {
    status.className = "error";
    status.textContent = "Erreur: impossible de charger cet anime.";
  }
}

let toastTimer = null;

function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 1600);
}

async function wireLoginPage() {
  await refreshSession();

  const msg = document.getElementById("authMsg");
  const emailEl = document.getElementById("authEmail");
  const passEl = document.getElementById("authPass");
  const btnIn = document.getElementById("btnSignIn");
  const btnUp = document.getElementById("btnSignUp");

  const setMsg = (t) => {
    if (msg) msg.textContent = t;
  };

  const m = localStorage.getItem("oz_login_msg");
  if (m) {
    setMsg(m);
    localStorage.removeItem("oz_login_msg");
  }

  if (currentUser) {
    setMsg("✅ Déjà connecté. Va dans Profil.");
    return;
  }

  btnIn?.addEventListener("click", async () => {
    const email = (emailEl?.value || "").trim();
    const password = (passEl?.value || "").trim();
    if (!email || !password) return setMsg("⚠️ Email et mot de passe requis.");

    setMsg("Connexion...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setMsg("❌ " + error.message);

    currentUser = data?.user || data?.session?.user || null;
    syncUI();
    location.hash = "#/profil";
  });

  btnUp?.addEventListener("click", async () => {
    const email = (emailEl?.value || "").trim();
    const password = (passEl?.value || "").trim();
    if (!email || !password) return setMsg("⚠️ Email et mot de passe requis.");
    if (password.length < 6)
      return setMsg("⚠️ Mot de passe: 6 caractères minimum.");

    setMsg("Création du compte...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          "https://otakuzone.infinityfree.me/#/auth/callback",
      },
    });

    if (error) return setMsg("❌ " + error.message);
    setMsg("📩 Compte créé ! Vérifie ton email pour confirmer ton compte.");
  });
}

async function fetchMyProfile() {
  if (!currentUser) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, xp, rank, role, streak_count, last_daily_at")
    .eq("id", currentUser.id)
    .single();

  if (error) console.warn("fetchMyProfile:", error.message);
  return data || null;
}

async function getQuizCount() {
  if (!currentUser) return 0;
  const { count, error } = await supabase
    .from("daily_quiz_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id);

  if (error) {
    console.warn("getQuizCount:", error.message);
    return 0;
  }
  return Number(count || 0);
}

async function getFavCount() {
  try {
    if (typeof favCache !== "undefined" && Array.isArray(favCache)) return favCache.length;

    if (typeof loadFavs === "function") {
      const favs = await loadFavs();
      return Array.isArray(favs) ? favs.length : 0;
    }

    if (typeof loadFavsLocal === "function") {
      const favs = loadFavsLocal();
      return Array.isArray(favs) ? favs.length : 0;
    }
  } catch (e) {
    console.warn("getFavCount:", e?.message);
  }
  return 0;
}

function computeAchievements({ xp = 0, streak = 0, quizCount = 0, favCount = 0 }) {
  const a = [];

  if (quizCount >= 1) a.push({ t: "🧠 Premier Quiz", d: "Tu as fait ton 1er quiz" });
  if (quizCount >= 3) a.push({ t: "🧠 Quiz Master", d: "3 quiz complétés" });
  if (quizCount >= 10) a.push({ t: "🧠 Quiz Pro", d: "10 quiz complétés" });
  if (quizCount >= 25) a.push({ t: "🧠 Quiz Légende", d: "25 quiz complétés" });

  if (streak >= 3) a.push({ t: "🔥 Streak x3", d: "3 jours d'affilée" });
  if (streak >= 7) a.push({ t: "🗓️ Streak x7", d: "7 jours d'affilée" });
  if (streak >= 14) a.push({ t: "⚡ Streak x14", d: "14 jours d'affilée" });

  if (favCount >= 5) a.push({ t: "❤️ Collectionneur", d: "5 favoris" });
  if (favCount >= 20) a.push({ t: "💎 Curateur", d: "20 favoris" });

  if (xp >= 100) a.push({ t: "📘 Niveau 100", d: "100 XP atteints" });
  if (xp >= 300) a.push({ t: "🔥 Niveau 300", d: "300 XP atteints" });
  if (xp >= 700) a.push({ t: "👑 Niveau 700", d: "700 XP atteints" });

  return a.slice(0, 10);
}

function renderAchievements(list) {
  const el = document.getElementById("achievementsList");
  const hint = document.getElementById("achievementsHint");
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<span class="small">Aucun succès pour l'instant.</span>`;
    if (hint) hint.textContent = "Fais un quiz et ajoute des favoris pour débloquer tes 1ers succès 😉";
    return;
  }

  el.innerHTML = list
    .map(x => `<span class="badge" title="${String(x.d || "").replace(/"/g, "&quot;")}">${x.t}</span>`)
    .join("");

  if (hint) hint.textContent = `✅ ${list.length} succès débloqué(s)`;
}

async function refreshAchievements(profile) {
  if (!currentUser) return;

  const xp = Number(profile?.xp || 0);
  const streak = Number(profile?.streak_count || 0);

  const [quizCount, favCount] = await Promise.all([
    getQuizCount(),
    getFavCount(),
  ]);

  const list = computeAchievements({ xp, streak, quizCount, favCount });
  renderAchievements(list);
}

async function wireProfilePage() {
  await refreshSession();

  const status = document.getElementById("profileStatus");
  const box = document.getElementById("profileBox");

  if (!currentUser) {
    if (status) {
      status.className = "error";
      status.textContent = "⚠️ Tu n'es pas connecté. Va sur Connexion.";
    }
    if (box) box.style.display = "none";
    return;
  }

  // Initialisation UI
  await refreshProfileUI();

  // ===== MODAL ÉDITION PROFIL =====
  const modal = document.getElementById("editProfileModal");
  const openBtn = document.getElementById("btnOpenEditProfile");
  const closeBtn = document.getElementById("btnCloseEditProfile");

  function openEditModal() {
    if (!modal) return;
    
    // Pré-remplir les champs
    const profile = window.__OZ_CURRENT_PROFILE__;
    if (profile) {
      document.getElementById("pUsername").value = profile.username || "";
      document.getElementById("pRank").value = profile.rank || "🌱 Rookie";
      document.getElementById("pXp").value = profile.xp || "0";
      document.getElementById("pAvatarUrl").value = profile.avatar_url || "";
      document.getElementById("pBio").value = profile.bio || "";
    }
    
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("oz-modal-lock");
  }

  function closeEditModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("oz-modal-lock");
    
    // Réinitialiser le message
    const msg = document.getElementById("profileMsg");
    if (msg) msg.textContent = "";
  }

  // Événements
  if (openBtn) {
    openBtn.addEventListener("click", openEditModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeEditModal);
  }

  // Fermer avec overlay
  modal?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "1") closeEditModal();
  });

  // Fermer avec ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("open")) {
      closeEditModal();
    }
  });

  // Bouton de sauvegarde
  const btnSave = document.getElementById("btnSaveProfile");
  if (btnSave) {
    btnSave.onclick = async () => {
      const username = document.getElementById("pUsername")?.value.trim() || "";
      const bio = document.getElementById("pBio")?.value.trim() || "";
      const avatar_url = document.getElementById("pAvatarUrl")?.value.trim() || "";
      const msg = document.getElementById("profileMsg");

      if (!username) {
        if (msg) msg.textContent = "⚠️ Choisis un pseudo.";
        return;
      }

      if (msg) msg.textContent = "Enregistrement...";

      const { error } = await supabase
        .from("profiles")
        .update({ username, bio, avatar_url })
        .eq("id", currentUser.id);

      if (error) {
        if (msg) msg.textContent = "❌ " + error.message;
        return;
      }

      if (msg) msg.textContent = "✅ Profil enregistré.";
      
      // Rafraîchir et fermer
      setTimeout(async () => {
        await refreshProfileUI();
        closeEditModal();
      }, 800);
    };
  }

  // Bouton rafraîchir
  const btnRefresh = document.getElementById("btnRefreshProfile");
  if (btnRefresh) {
    btnRefresh.onclick = async () => {
      await refreshProfileUI();
      showToast("Profil rafraîchi 🔄");
    };
  }

  // Bouton déconnexion
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.onclick = async () => {
      await handleLogout();
    };
  }
}

async function refreshProfileUI() {
  const status = document.getElementById("profileStatus");
  const box = document.getElementById("profileBox");
  const setStatus = (t, cls = "loading") => {
    if (status) {
      status.className = cls;
      status.textContent = t;
    }
  };

  setStatus("Chargement du profil...");
  const profile = await fetchMyProfile();

  if (!profile) {
    setStatus("❌ Profil introuvable.", "error");
    if (box) box.style.display = "none";
    return;
  }

  await refreshAchievements(profile);
  setStatus("");
  if (box) box.style.display = "block";

  const xpVal = Number(profile.xp || 0);
  const rankVal = profile.rank || calcRankFromXP(xpVal);
  const streakVal = Number(profile.streak_count || 0);
  const favCount = await getFavCount();

  document.getElementById("pNameDisplay").textContent = profile.username || "otaku";
  document.getElementById("pEmailDisplay").textContent = currentUser.email || "";
  document.getElementById("pBioPreview").textContent = profile.bio || "—";

  const rankBadge = document.getElementById("pRankBadge");
  if (rankBadge) {
    rankBadge.className = "rank-badge " + rankClassFromRank(rankVal);
    rankBadge.innerHTML = `<span class="rank-dot"></span> ${rankVal}`;
  }

  document.getElementById("pXpTitle").textContent = `Niveau ${Math.floor(xpVal / 100) + 1}`;
  document.getElementById("pXpMeta").textContent = `${xpVal} XP`;
  document.getElementById("pStreakBadge").innerHTML = `🔥 Streak: ${streakVal}`;
  document.getElementById("pFavBadge").innerHTML = `❤️ Favoris: ${favCount}`;
}

function isQuizEventActive() {
  try {
    const today = new Date();
    const start = new Date(`${QUIZ_EVENT.start}T00:00:00`);
    const end   = new Date(`${QUIZ_EVENT.end}T00:00:00`);
    return today >= start && today < end;
  } catch {
    return false;
  }
}

async function getTodayQuizParticipants() {
  // Option "C": compteur global (si la fonction RPC existe sur Supabase)
  // Si non dispo → on retourne null et on cache l'info.
  try {
    const today = todayISO();
    const { data, error } = await supabase.rpc("oz_today_quiz_participants", { qdate: today });
    if (error) return null;
    const n = typeof data === "number" ? data : (data?.count ?? null);
    return (n == null) ? null : Number(n);
  } catch {
    return null;
  }
}

function wireHomePage() {
  // Option A + C: bannière event + compteur participants
  if (!isQuizEventActive()) return;

  getTodayQuizParticipants().then((n) => {
    const el = document.getElementById("homeEventCount");
    if (!el) return;
    el.textContent = (n == null) ? "" : `👥 ${n} joueur(s) aujourd'hui`;
  });
}

let currentQuizBank = "default";
let QUIZ_POOL = [];

// Banque de secours minimaliste
const FALLBACK_QUIZ = [
  {
    q: "Shōnen, ça veut dire quoi ?",
    choices: [
      "Pour garçons/adolescents",
      "Pour adultes",
      "Pour enfants",
      "Pour filles",
    ],
    a: 0,
    hint: "C'est une catégorie démographique.",
  },
  {
    q: "Un OVA, c'est généralement…",
    choices: [
      "Un épisode spécial hors TV",
      "Un opening",
      "Un manga",
      "Une scène post-credit",
    ],
    a: 0,
    hint: "Souvent un bonus.",
  }
];

async function loadQuizBank(bankName = "default") {
  try {
    const bankPath = QUIZ_BANKS[bankName];
    if (!bankPath) {
      console.warn(`Banque ${bankName} non trouvée, utilisation de la banque par défaut`);
      bankName = "default";
    }
    
    const response = await fetch(QUIZ_BANKS[bankName]);
    if (!response.ok) throw new Error(`Erreur de chargement: ${response.status}`);
    
    const questions = await response.json();
    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error("Format de banque invalide");
    }
    
    QUIZ_POOL = questions;
    currentQuizBank = bankName;
    console.log(`✅ Banque "${bankName}" chargée (${questions.length} questions)`);
    return questions;
  } catch (error) {
    console.error("Erreur de chargement de la banque:", error);
    QUIZ_POOL = FALLBACK_QUIZ;
    return QUIZ_POOL;
  }
}

function pick5Questions() {
  if (!QUIZ_POOL.length || QUIZ_POOL.length < 5) {
    QUIZ_POOL = FALLBACK_QUIZ;
  }
  
  const copy = [...QUIZ_POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 5);
}

function wireQuizPage() {
  // ✅ Support lien direct: #/quiz?bank=event (ou autre)
  const qs = location.hash.split("?")[1] || "";
  const bankFromUrl = new URLSearchParams(qs).get("bank");
  if (bankFromUrl && QUIZ_BANKS[bankFromUrl]) {
    currentQuizBank = bankFromUrl;
  }

  // ✅ Si quelqu'un force "event" alors que l'event est OFF → fallback
  if (currentQuizBank === "event" && !isQuizEventActive()) {
    currentQuizBank = "default";
  }
  const intro = document.getElementById("quizIntro");
  const run = document.getElementById("quizRun");
  const done = document.getElementById("quizDone");

  const startBtn = document.getElementById("quizStartBtn");
  const restartBtn = document.getElementById("quizRestartBtn");

  const progress = document.getElementById("quizProgress");
  const scoreEl = document.getElementById("quizScore");
  const qEl = document.getElementById("quizQ");
  const choicesEl = document.getElementById("quizChoices");
  const hintEl = document.getElementById("quizHint");
  const resultEl = document.getElementById("quizResult");
  let timeLeft = 90;
  let timerId = null;
  let questions = [];
  let idx = 0;
  let score = 0;

  function showState(which) {
    intro.style.display = which === "intro" ? "block" : "none";
    run.style.display = which === "run" ? "block" : "none";
    done.style.display = which === "done" ? "block" : "none";
  }

  function startTimer() {
    timeLeft = 90;
    updateTimer();
    timerId = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        clearInterval(timerId);
        finishQuiz();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
  }

  function updateTimer() {
    const t = document.getElementById("quizTimer");
    if (t) t.textContent = `⏱️ ${timeLeft}s`;
  }

  function renderQuestion() {
    const total = questions.length;
    const item = questions[idx];

    progress.textContent = `Question ${idx + 1}/${total}`;
    scoreEl.textContent = `Score: ${score}`;
    qEl.textContent = item.q;
    hintEl.textContent = item.hint ? `Indice: ${item.hint}` : "";

    choicesEl.innerHTML = item.choices
      .map(
        (c, i) => `
      <button class="chip" data-choice="${i}" style="text-align:left">${c}</button>
    `
      )
      .join("");

    choicesEl.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const choice = Number(btn.getAttribute("data-choice"));
        const ok = choice === item.a;

        if (ok) {
          score++;
          showToast("✅ Bonne réponse");
        } else {
          showToast("❌ Faux");
        }

        idx++;
        if (idx >= total) finishQuiz();
        else renderQuestion();
      });
    });
  }

  async function finishQuiz() {
    stopTimer();
    showState("done");

    if (currentUser) {
      const already = await hasDoneQuizTodayOnline();
      if (already) {
        resultEl.textContent = `Tu as fait ${score}/5. (Quiz déjà fait aujourd'hui)`;
        return;
      }

      const res = await applyQuizXPOnline(score);
      if (!res.ok) {
        resultEl.textContent = `Tu as fait ${score}/5. (Erreur: XP non attribuée)`;
        return;
      }

      resultEl.textContent = `Tu as fait ${score}/5 → +${res.xp} XP 🎉 (Quiz du jour)`;
      showToast(`+${res.xp} XP 🧠 (Daily Quiz)`);
      return;
    }

    const today = todayISO();
    const lastDay = localStorage.getItem(QUIZ_DAY_KEY);

    if (lastDay === today) {
      resultEl.textContent = `Tu as fait ${score}/5. (Quiz déjà fait aujourd'hui)`;
      return;
    }

    let xp = 15;
    if (score >= 2) xp = 25;
    if (score >= 4) xp = 35;

    addLocalXP(xp);
    localStorage.setItem(QUIZ_DAY_KEY, today);

    resultEl.textContent = `Tu as fait ${score}/5 → +${xp} XP 🎉 (Quiz du jour)`;
    showToast(`+${xp} XP 🧠 (Daily Quiz)`);
  }

  function getLocalXP() {
    return Number(localStorage.getItem(QUIZ_XP_KEY) || 0);
  }

  function addLocalXP(x) {
    const v = getLocalXP() + x;
    localStorage.setItem(QUIZ_XP_KEY, String(v));
    return v;
  }

  function startQuiz() {
    questions = pick5Questions();
    idx = 0;
    score = 0;
    showState("run");
    startTimer();
    renderQuestion();
  }

  // Charger la banque au démarrage (support event / lien direct)
  loadQuizBank(currentQuizBank).then(async () => {
    const select = document.getElementById("quizBankSelect");
    if (select) select.value = currentQuizBank;

    const label = select?.options?.[select.selectedIndex]?.text || "Générale";
    const nameEl = document.getElementById("currentBankName");
    if (nameEl) nameEl.textContent = label;

    // compteur participants (Option C) — seulement si event actif
    if (isQuizEventActive()) {
      const n = await getTodayQuizParticipants();
      const el = document.getElementById("quizEventCount");
      if (el) el.textContent = (n == null) ? "" : `👥 ${n} joueur(s) ont participé aujourd'hui`;
    }
  });
  
  // Gérer le changement de banque
  document.getElementById("quizLoadBank")?.addEventListener("click", async () => {
    const select = document.getElementById("quizBankSelect");
    let bankName = select.value;

    // Empêche l'accès à la banque event si l'événement est OFF
    if (bankName === "event" && !isQuizEventActive()) {
      bankName = "default";
      if (select) select.value = "default";
      showToast("⏳ Le quiz spécial n'est pas disponible pour le moment.");
    }

    currentQuizBank = bankName;
    const status = document.getElementById("bankStatus");
    
    status.textContent = "Chargement...";
    status.className = "loading";
    
    const questions = await loadQuizBank(bankName);
    
    if (questions.length >= 5) {
      status.textContent = `✅ ${questions.length} questions chargées`;
      status.className = "small";
      document.getElementById("currentBankName").textContent = 
        select.options[select.selectedIndex].text;

      // compteur participants (Option C)
      const el = document.getElementById("quizEventCount");
      if (el) {
        if (isQuizEventActive() && bankName === "event") {
          const n = await getTodayQuizParticipants();
          el.textContent = (n == null) ? "" : `👥 ${n} joueur(s) ont participé aujourd'hui`;
        } else {
          el.textContent = "";
        }
      }
    } else {
      status.textContent = "❌ Banque incomplète (< 5 questions)";
      status.className = "error";
    }
  });

  startBtn?.addEventListener("click", startQuiz);
  restartBtn?.addEventListener("click", startQuiz);

  showState("intro");
}

function wireHomeInstallButton() {
  const btn = document.getElementById("homeInstallBtn");
  if (!btn) return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  btn.style.display = (isMobile && !isStandalone) ? "inline-flex" : "none";

  btn.addEventListener("click", () => {
    if (window.PWAConfig && typeof window.PWAConfig.installOrHelp === "function") {
      window.PWAConfig.installOrHelp();
    } else {
      showToast("L'installation PWA n'est pas disponible sur ce navigateur");
    }
  });

  window.addEventListener("appinstalled", () => {
    btn.style.display = "none";
  });
}

async function init() {
  await refreshSession();
  
  // Charger la banque de quiz par défaut
  await loadQuizBank();
  
  supabase.auth.onAuthStateChange(async (event) => {
    await refreshSession();
    await awardDailyXPIfNeeded();
    await refreshFavCache();
    await migrateLocalFavsToSupabaseOnce();
    await refreshFavCache();
    await updateAuthUIAndFavs();
    syncUI();
  });

  const path = getPath();
  if (!currentUser && (path === "/profil" || path === "/favoris")) {
    showToast("Connecte-toi pour accéder à cette page 🔐");
    location.hash = "#/login";
  }

  // Initial render
  render();
}

async function handleLogout() {
  try {
    await supabase.auth.signOut();
    currentUser = null;
    favCache = [];
    favCacheFetchedAt = 0;
    
    showToast("✅ Déconnecté avec succès");
    
    setTimeout(() => {
      location.hash = "#/home";
      updateAuthUI();
      render();
    }, 300);
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    showToast("❌ Erreur lors de la déconnexion");
  }
}

async function handleAuthCallback() {
  const el = document.getElementById("cbMsg");
  const set = (t, cls = "loading") => {
    if (el) {
      el.className = cls;
      el.textContent = t;
    }
  };

  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      set("Validation du lien...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      await refreshSession();
      set("✅ Email confirmé. Redirection...", "small");

      url.searchParams.delete("code");
      history.replaceState({}, "", url.pathname + url.hash.split("?")[0]);

      location.hash = "#/profil";
      return;
    }

    await refreshSession();
    if (currentUser) {
      set("✅ Confirmé. Redirection...", "small");
      location.hash = "#/profil";
    } else {
      set("⚠️ Lien invalide ou expiré. Recommence l'inscription.", "error");
    }
  } catch (e) {
    set("❌ " + (e?.message || "Erreur pendant la confirmation"), "error");
  }
}

async function migrateLocalFavsToSupabaseOnce() {
  if (!currentUser) return;

  const key = `oz_migrated_${currentUser.id}`;
  if (localStorage.getItem(key) === "1") return;

  const local = loadFavsLocal();
  if (!local.length) {
    localStorage.setItem(key, "1");
    return;
  }

  for (const f of local) {
    await upsertFavRemote({
      id: Number(f.id),
      title: f.title || "",
      img: f.img || "",
      score: f.score || "",
      year: f.year || "",
      reason: f.reason || "",
    });
  }

  localStorage.setItem(key, "1");
  showToast("✅ Favoris synchronisés en ligne");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcRankFromXP(xp) {
  if (xp >= 1500) return "🌀 Légende";
  if (xp >= 700) return "👑 Elite";
  if (xp >= 300) return "🔥 Otaku Confirmé";
  if (xp >= 100) return "📘 Senpai";
  return "🌱 Rookie";
}

function rankClassFromRank(rankLabel){
  const t = String(rankLabel || "").toLowerCase();
  if (t.includes("legende") || t.includes("légende")) return "rank-kage";
  if (t.includes("elite")) return "rank-otaku";
  if (t.includes("confirm")) return "rank-otaku";
  if (t.includes("senpai")) return "rank-senpai";
  return "rank-genin";
}

async function awardDailyXPIfNeeded() {
  if (!currentUser) return;

  const today = todayISO();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("xp, rank, streak_count, last_daily_at")
    .eq("id", currentUser.id)
    .single();

  if (pErr || !profile) {
    console.warn("awardDailyXPIfNeeded profile:", pErr?.message);
    return;
  }

  const last = profile.last_daily_at;
  if (last === today) return;

  const yesterday = addDaysISO(today, -1);

  let streak = Number(profile.streak_count || 0);
  streak = last === yesterday ? streak + 1 : 1;

  const baseXP = 5;
  const streakBonus = Math.min(streak * 5, 25);
  const gain = baseXP + streakBonus;

  const newXP = Number(profile.xp || 0) + gain;
  const newRank = calcRankFromXP(newXP);

  const { error: uErr } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      rank: newRank,
      streak_count: streak,
      last_daily_at: today,
    })
    .eq("id", currentUser.id);

  if (uErr) {
    console.warn("awardDailyXPIfNeeded update:", uErr.message);
    return;
  }

  showToast(`+${gain} XP ✅ (Connexion + Streak x${streak})`);
  if (getPath() === "/profil") { wireProfilePage(); }
}

async function hasDoneQuizTodayOnline() {
  if (!currentUser) return false;
  const today = todayISO();

  const { data, error } = await supabase
    .from("daily_quiz_logs")
    .select("quiz_date")
    .eq("user_id", currentUser.id)
    .eq("quiz_date", today)
    .maybeSingle();

  if (error) {
    console.warn("hasDoneQuizTodayOnline:", error.message);
    return false;
  }
  return !!data;
}

async function applyQuizXPOnline(score) {
  let xp = 15;
  if (score >= 2) xp = 25;
  if (score >= 4) xp = 35;

  const today = todayISO();

  const { error: logErr } = await supabase
    .from("daily_quiz_logs")
    .insert({
      user_id: currentUser.id,
      quiz_date: today,
      score,
      xp_gained: xp
    });

  if (logErr) {
    if (String(logErr.message || "").toLowerCase().includes("duplicate")) return { ok:false, xp:0 };
    console.warn("applyQuizXPOnline log:", logErr.message);
    return { ok:false, xp:0 };
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", currentUser.id)
    .single();

  if (pErr || !profile) return { ok:false, xp:0 };

  const newXP = Number(profile.xp || 0) + xp;
  const newRank = calcRankFromXP(newXP);

  const { error: uErr } = await supabase
    .from("profiles")
    .update({ xp: newXP, rank: newRank })
    .eq("id", currentUser.id);

  if (uErr) {
    console.warn("applyQuizXPOnline update:", uErr.message);
    return { ok:false, xp:0 };
  }

  if (getPath() === "/profil") { wireProfilePage(); }

  return { ok:true, xp };
}

// ===== Mood Anime (robuste, sans IA) =====

// 1) Moods (tu peux en ajouter)
const MOODS = [
  { id: "sad_beautiful", emoji: "😭", title: "Triste mais beau", desc: "Émouvant, touchant, larmes…", genreId: 8, genreLabel: "Drama", tags: ["drama", "tragedy", "slice of life"] },
  { id: "chill",         emoji: "😌", title: "Chill / apaisant",    desc: "Détente, feel-good, calme…", genreId: 36, genreLabel: "Slice of Life", tags: ["slice of life", "iyashikei", "comedy"] },
  { id: "hype",          emoji: "🔥", title: "Action / Hype",       desc: "Frissons, énergie, motivation…", genreId: 1, genreLabel: "Action", tags: ["action", "shonen", "sports", "adventure"] },
  { id: "mind",          emoji: "🧠", title: "Mind-blowing",        desc: "Mystère, twists, psychologie…", genreId: 40, genreLabel: "Psychological", tags: ["mystery", "thriller", "psychological", "sci-fi"] },
  { id: "romance_soft",  emoji: "❤️", title: "Romance douce",       desc: "Amour, couple, mignon…", genreId: 22, genreLabel: "Romance", tags: ["romance", "slice of life"] },
];

// 2) Dico keywords (avec poids)
const MOOD_KEYWORDS = {
  sad_beautiful: [
    ["triste", 3], ["pleurer", 3], ["larmes", 3], ["deprime", 2], ["déprime", 2],
    ["émouvant", 3], ["touchant", 3], ["mélancolie", 2], ["nostalgie", 2], ["drama", 2], ["tragique", 2]
  ],
  chill: [
    ["calme", 3], ["chill", 3], ["relax", 3], ["détente", 3], ["apaisant", 3], ["feelgood", 2], ["feel good", 2],
    ["cozy", 2], ["zen", 2], ["repos", 2], ["tranquille", 2], ["sliceoflife", 2], ["slice of life", 2]
  ],
  hype: [
    ["action", 3], ["combat", 3], ["baston", 2], ["hype", 3], ["motivation", 2], ["épique", 2], ["shonen", 2],
    ["intense", 2], ["adrénaline", 2], ["sport", 2], ["tournoi", 2]
  ],
  mind: [
    ["mystère", 3], ["mystere", 3], ["enquête", 2], ["enquete", 2], ["thriller", 3], ["psychologique", 3],
    ["twist", 2], ["plot", 1], ["mind", 2], ["cerveau", 1], ["sombre", 1], ["intelligent", 2], ["sci-fi", 2], ["science fiction", 2]
  ],
  romance_soft: [
    ["romance", 3], ["amour", 3], ["couple", 2], ["relation", 2], ["crush", 2], ["mignon", 2], ["cute", 2],
    ["shojo", 2], ["shoujo", 2], ["coeur", 2], ["cœur", 2]
  ]
};

// 3) "Négations" (si l'utilisateur dit "pas romance", on enlève)
const NEGATIONS = ["pas", "sans", "évite", "evite", "non", "no"];

// 4) Normalisation (gère accents, ponctuation, espaces)
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // enlève accents
    .replace(/[^a-z0-9\s-]/g, " ")                      // enlève ponctuation
    .replace(/\s+/g, " ")
    .trim();
}

// 5) Tokenization simple
function tokensOf(text) {
  const t = normalizeText(text);
  // limite longueur (évite pavés)
  const clipped = t.slice(0, 220);
  return clipped.split(" ").filter(Boolean);
}

// 6) mini fuzzy: "includes" + tolérance de fautes courantes
function softIncludes(hay, needle) {
  if (!needle) return false;
  if (hay.includes(needle)) return true;

  // tolérance légère: si le mot est long, on compare sans voyelles (ex: "deprime" / "dprm")
  if (needle.length >= 6) {
    const nv = needle.replace(/[aeiouy]/g, "");
    const hv = hay.replace(/[aeiouy]/g, "");
    if (nv && hv.includes(nv)) return true;
  }
  return false;
}

// 7) Détection principale
function detectMoodsFromText(text) {
  const raw = String(text || "");
  const norm = normalizeText(raw);
  const toks = tokensOf(raw);

  // détecte si phrase contient une negation juste avant un mot-clé
  function isNegated(keyword) {
    // ex: "pas romance"
    for (let i = 0; i < toks.length - 1; i++) {
      if (NEGATIONS.includes(toks[i]) && softIncludes(toks[i + 1], keyword.replace(/\s+/g, ""))) return true;
    }
    return false;
  }

  const scores = {};
  for (const moodId of Object.keys(MOOD_KEYWORDS)) scores[moodId] = 0;

  // score selon keywords
  for (const moodId of Object.keys(MOOD_KEYWORDS)) {
    for (const [kw, w] of MOOD_KEYWORDS[moodId]) {
      const kwNorm = normalizeText(kw).replace(/\s+/g, " ");
      const kwCompact = kwNorm.replace(/\s+/g, "");

      // match sur phrase complète
      const hit = softIncludes(norm.replace(/\s+/g, ""), kwCompact) || norm.includes(kwNorm);
      if (!hit) continue;

      // si negation => on retire
      if (isNegated(kwCompact)) {
        scores[moodId] -= (w + 2);
      } else {
        scores[moodId] += w;
      }
    }
  }


// +++ Ajout des keywords custom appris (Niveau 2) +++
const custom = loadMoodCustom ? loadMoodCustom() : {};
for (const moodId in custom) {
  const arr = custom[moodId] || [];
  for (const w of arr) {
    const ww = String(w || "").replace(/\s+/g, "");
    if (!ww) continue;
    if (softIncludes(norm.replace(/\s+/g, ""), ww)) {
      scores[moodId] = (scores[moodId] || 0) + 1; // petit poids (safe)
    }
  }
}

  // Tri + keep top 2
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, s]) => s > 0)
    .slice(0, 2)
    .map(([id, score]) => ({ id, score }));

  // Explication simple (mots reconnus)
  return { sorted, norm };
}

// 8) Log local des requêtes inconnues (pour améliorer plus tard)
const MOOD_UNKNOWN_KEY = "oz_mood_unknown_v1";
// ===== Niveau 2: apprentissage validé par toi =====
const MOOD_CUSTOM_KEY = "oz_mood_custom_keywords_v1";

function loadMoodCustom() {
  try { return JSON.parse(localStorage.getItem(MOOD_CUSTOM_KEY) || "{}"); }
  catch { return {}; }
}

function saveMoodCustom(obj) {
  localStorage.setItem(MOOD_CUSTOM_KEY, JSON.stringify(obj || {}));
}

// Apprend des mots utiles à partir d'une phrase classée
function learnKeywordFromText(moodId, text) {
  const custom = loadMoodCustom();
  custom[moodId] = custom[moodId] || [];

  const toks = tokensOf(text)
    .map(w => w.trim())
    .filter(w => w.length >= 4 && !NEGATIONS.includes(w)); // ignore petits mots + négations

  for (const w of toks) {
    if (!custom[moodId].includes(w)) custom[moodId].push(w);
  }

  // limite pour éviter explosion
  custom[moodId] = custom[moodId].slice(-120);
  saveMoodCustom(custom);
}

function logUnknownMoodQuery(text) {
  const t = normalizeText(text);
  if (!t) return;
  try {
    const arr = JSON.parse(localStorage.getItem(MOOD_UNKNOWN_KEY) || "[]");
    // évite spam
    if (!arr.includes(t)) arr.unshift(t);
    localStorage.setItem(MOOD_UNKNOWN_KEY, JSON.stringify(arr.slice(0, 30)));
  } catch {}
}

function wireMoodPage() {
  document.querySelectorAll(".mood-card").forEach(card => {
    card.addEventListener("click", () => {
      location.hash = `#/mood/${card.dataset.mood}`;
    });
  });

  const input = document.getElementById("moodText");
  const explain = document.getElementById("moodExplain");

  function setExplain(t) { if (explain) explain.textContent = t; }

  document.getElementById("moodGo")?.addEventListener("click", () => {
    const text = (input?.value || "").trim();
    if (!text) {
      setExplain("Écris une phrase ou choisis un mood juste en dessous 🙂");
      return;
    }
    const { sorted } = detectMoodsFromText(text);

    if (!sorted.length) {
      logUnknownMoodQuery(text);
      setExplain("Je ne suis pas sûr 😅 Choisis un mood ci-dessous (ou essaie : triste / chill / action / mystère / romance).");
      return;
    }

    const bestId = sorted[0].id;
    const best = MOODS.find(m => m.id === bestId);
    if (best) setExplain(`Je te propose : ${best.emoji} ${best.title} ✅`);

    location.hash = `#/mood/${bestId}`;
  });

  // enter = trouver
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("moodGo")?.click();
  });
}

function renderMoodDetailPage(moodId) {
  const mood = MOODS.find(m => m.id === moodId);
  if (!mood) {
    return `<div class="page"><h1>404</h1><p>Ce mood n'existe pas.</p></div>`;
  }

  return `
    <div class="page">
      <div class="page-head">
        <h1>${mood.emoji} ${mood.title}</h1>
        <p class="small">${mood.desc}</p>
        <div class="row" style="margin-top:10px">
          <a class="btn" href="#/mood" style="text-decoration:none;display:inline-block">← Choisir un autre mood</a>
        </div>
      </div>

      <div id="moodStatus" class="loading">Chargement...</div>
      <div id="moodGrid" class="grid" style="margin-top:12px"></div>

      <div class="small" style="margin-top:12px;opacity:.9">
        Sélection basée sur genre: <strong>${mood.genreLabel || "—"}</strong>
      </div>
    </div>
  `;
}

async function wireMoodDetailPage(moodId) {
  const mood = MOODS.find(m => m.id === moodId);
  const status = document.getElementById("moodStatus");
  const grid = document.getElementById("moodGrid");
  if (!mood || !status || !grid) return;

  // fallback si pas de genreId
  if (!mood.genreId) {
    status.className = "error";
    status.textContent = "Mood non configuré (genreId manquant).";
    return;
  }

  await fetchAnimeByGenreInto(mood.genreId, status, grid);
}

function wireMoodTrainer() {
  const box = document.getElementById("unknownList");
  if (!box) return;

  let unknown = [];
  try { unknown = JSON.parse(localStorage.getItem(MOOD_UNKNOWN_KEY) || "[]"); } catch {}

  const btnClear = document.getElementById("btnClearUnknown");
  if (btnClear) {
    btnClear.onclick = () => {
      localStorage.setItem(MOOD_UNKNOWN_KEY, "[]");
      showToast("🧹 Liste vidée");
      wireMoodTrainer();
    };
  }

  if (!unknown.length) {
    box.innerHTML = `<div class="small">Aucune phrase inconnue 🎉</div>`;
    return;
  }

  box.innerHTML = unknown.map((t, i) => `
    <div class="card" style="padding:12px; margin-bottom:10px">
      <div style="font-weight:800">"${escapeHtml(t)}"</div>
      <div class="small" style="margin-top:6px">Choisis le mood :</div>

      <div class="badges" style="margin-top:8px">
        ${MOODS.map(m => `
          <button class="badge" data-i="${i}" data-m="${m.id}">
            ${m.emoji} ${escapeHtml(m.title)}
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");

  box.querySelectorAll("button[data-i][data-m]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.i);
      const moodId = btn.dataset.m;
      const text = unknown[idx];

      learnKeywordFromText(moodId, text);

      // retire la phrase de la liste unknown
      unknown.splice(idx, 1);
      localStorage.setItem(MOOD_UNKNOWN_KEY, JSON.stringify(unknown));

      showToast("✅ Appris !");
      wireMoodTrainer(); // re-render
    });
  });
}
async function wireRankingPage() {
  const box = document.getElementById("rankingBox");
  const btn = document.getElementById("btnReloadRanking");

  const renderLoading = () => {
    if (box) box.innerHTML = `<div class="small">Chargement du classement...</div>`;
  };

  const renderEmpty = () => {
    if (box) box.innerHTML = `<div class="small">Aucun joueur pour l'instant.</div>`;
  };

  function medal(i){
    if (i===0) return "🥇";
    if (i===1) return "🥈";
    if (i===2) return "🥉";
    return `#${i+1}`;
  }

  async function load() {
    renderLoading();

    const { data, error } = await supabase.rpc("oz_leaderboard", { limit_count: 50 });
    if (error) {
      if (box) box.innerHTML = `<div class="small">❌ ${error.message}</div>`;
      return;
    }

    if (!data || !data.length) return renderEmpty();

    const myId = currentUser?.id || null;

    const rows = data.map((u, i) => {
      const me = myId && u.id === myId;
      return `
        <div class="card" style="padding:10px; margin-bottom:8px; ${me ? "border:1px solid rgba(255,64,129,.55)" : ""}">
          <div class="row" style="justify-content:space-between;margin:0">
            <div style="font-weight:900">${medal(i)} ${escapeHtml(u.username || "Otaku")}${me ? " <span class='small'>(toi)</span>" : ""}</div>
            <div class="small">⭐ ${u.xp ?? 0} XP</div>
          </div>
          <div class="small" style="opacity:.9;margin-top:4px">
            Rang: <b>${escapeHtml(u.rank || "Rookie")}</b> • Badges: <b>${u.badge_count ?? 0}</b>
          </div>
        </div>
      `;
    }).join("");

    if (box) box.innerHTML = rows;
  }

  btn?.addEventListener("click", load);
  await refreshSession();
  load();
}
function renderVersionBadge() {
  const el = document.getElementById("versionBadge");
  if (!el) return;
  el.textContent = "v" + OZ_VERSION;
}

// Initialisation de l'application
init();