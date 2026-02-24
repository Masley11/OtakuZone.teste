
// ===== Supabase config (identique à app_old.js) =====
const SUPABASE_URL = "https://lrvwhewjudeiuwqcaeqz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TQG7By7w-HIQymSz37tTEQ_6UeF2ktN";

window.__OZ_SUPABASE__ = window.__OZ_SUPABASE__ || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var supabase = window.__OZ_SUPABASE__;

let genreAbort = null; // ✅ AJOUTE ÇA
let currentUser = null;
const OZ_VERSION = "2.0.0";


// <- incrémente à chaque update
// ===== Avatar avec Robohash =====
function getAvatarUrl(userId, username) {
  // Utilise l'ID utilisateur ou le pseudo comme seed pour l'avatar
  const seed = userId || username || "default";
  // Style "set1" = personnages, "set2" = robots, "set3" = têtes, "set4" = chats
  // On prend set1 pour des avatars style anime/robot
  return `https://robohash.org/${encodeURIComponent(seed)}?set=set1&size=200x200&bgset=bg2`;
}

// ===== Safe Fetch avec timeout et retry =====
async function safeFetch(url, options = {}, timeout = 10000) {
  // Crée un AbortController pour pouvoir annuler la requête
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Si la réponse est pas OK (404, 500, etc.)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Message user-friendly selon l'erreur
    if (error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps. Vérifie ta connexion.');
    }
    if (error.message.includes('fetch')) {
      throw new Error('Impossible de se connecter au serveur. Es-tu hors ligne ?');
    }
    
    throw error;
  }
}

// ===== Notifications Quiz =====
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications non supportées');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

function scheduleQuizNotification() {
  // Vérifie si on a déjà fait le quiz aujourd'hui
  const lastQuiz = localStorage.getItem(QUIZ_DAY_KEY);
  const today = todayISO();
  
  if (lastQuiz === today) {
    console.log(`Quiz déjà fait aujourd\'hui`);
    return;
  }
  
  // Programme une notification dans 1 heure
  setTimeout(() => {
    showQuizNotification();
  }, 60 * 60 * 1000); // 1 heure = 3600000 ms
}

function showQuizNotification() {
  if (Notification.permission !== 'granted') return;
  
  new Notification('🧠 Quiz OtakuZone', {
    body: 'Ton quiz quotidien t\'attend ! Gagne de l\'XP et monte en rang.',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    tag: 'quiz-daily',
    requireInteraction: false
  });
  
  // Au clic, ouvre l'app
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    window.focus();
    location.hash = '#/quiz';
  });
}

// ===== Quiz System =====
const QUIZ_DAY_KEY = "oz_quiz_day";
const QUIZ_XP_KEY = "oz_xp_local";
const QUIZ_BANKS = {
  "default": "js/quiz/default.json",
  "anime": "js/quiz/anime.json",
  "shonen": "js/quiz/shonen.json",
  "isekai": "js/quiz/isekai.json",
  "event": "js/quiz/event.json"
};

const QUIZ_EVENT = {
  title: "🌟 Quiz Spécial Anime",
  subtitle: "Édition limitée — disponible pendant une période définie",
  bank: "event",
  start: "2026-01-26",
  end: "2026-01-02"
};

// ===== Mood System =====
const MOODS = [
  { id: "sad_beautiful", emoji: "😭", title: "Triste mais beau", desc: "Émouvant, touchant, larmes…", genreId: 8, genreLabel: "Drama", tags: ["drama", "tragedy", "slice of life"] },
  { id: "chill", emoji: "😌", title: "Chill / apaisant", desc: "Détente, feel-good, calme…", genreId: 36, genreLabel: "Slice of Life", tags: ["slice of life", "iyashikei", "comedy"] },
  { id: "hype", emoji: "🔥", title: "Action / Hype", desc: "Frissons, énergie, motivation…", genreId: 1, genreLabel: "Action", tags: ["action", "shonen", "sports", "adventure"] },
  { id: "mind", emoji: "🧠", title: "Mind-blowing", desc: "Mystère, twists, psychologie…", genreId: 40, genreLabel: "Psychological", tags: ["mystery", "thriller", "psychological", "sci-fi"] },
  { id: "romance_soft", emoji: "❤️", title: "Romance douce", desc: "Amour, couple, mignon…", genreId: 22, genreLabel: "Romance", tags: ["romance", "slice of life"] }
];

// ===== Partners =====
const PARTNERS = [
  {
    name: "PremiumZone",
    tag: "Streaming & apps",
    url: "https://preniumzone.great-site.net",
    desc: "Abonnements & bons plans pour les otaku.",
    logo: "https://i.ibb.co/MDXv3kCV/icon-192.png"
  },
  {
    name: "M.H.C Seisen",
    tag: "communautés & page",
    url: "https://www.facebook.com/profile.php?id=100083153231226",
    desc: "Créateur de contenus sur les animés et mangas.",
    logo: "https://i.ibb.co/x8zvc6kp/1769957154205.jpg"
  }
];

// ===== Cache Variables =====
let favCache = [];
let favCacheFetchedAt = 0;
let watchedCache = null;
let watchedSet = null;
let animeAbort = null;
let currentQuizBank = "default";
let QUIZ_POOL = [];

// ===== NEW: Rating System =====
let ratingsCache = null;
const RATING_CACHE_KEY = "oz_ratings_v1";

// ===== NEW: Watch Calendar =====
let watchCalendarCache = null;
const CALENDAR_CACHE_KEY = "oz_calendar_v1";

// ===== NEW: Recommendations Cache =====
let recommendationsCache = null;
const RECOMMENDATIONS_CACHE_KEY = "oz_recommendations_v1";

// ===== NEW: Advanced Filters =====
let activeFilters = {
  genres: [],
  yearRange: { min: 1990, max: new Date().getFullYear() },
  ratingRange: { min: 0, max: 10 },
  status: [],
  sortBy: "date_desc"
};

const FALLBACK_QUIZ = [
  {
    q: "Shōnen, ça veut dire quoi ?",
    choices: ["Pour garçons/adolescents", "Pour adultes", "Pour enfants", "Pour filles"],
    a: 0,
    hint: "C'est une catégorie démographique."
  },
  {
    q: "Un OVA, c'est généralement…",
    choices: ["Un épisode spécial hors TV", "Un opening", "Un manga", "Une scène post-credit"],
    a: 0,
    hint: "Souvent un bonus."
  }
];

// ===== DOM Elements =====
const view = document.getElementById("view");
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// ===== Core Functions (identique à app_old.js) =====
async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      if (error.message.includes("Invalid Refresh Token")) {
        currentUser = null;
        window.__OZ_CURRENT_USER__ = null;  // 🔥 Synchroniser
        updateAuthUI();
        return null;
      }
      throw error;
    }
    
    currentUser = data?.session?.user || null;
    window.__OZ_CURRENT_USER__ = currentUser;  // 🔥 Exposer globalement
    updateAuthUI();
    return currentUser;
  } catch (error) {
    console.error("Erreur session:", error);
    currentUser = null;
    window.__OZ_CURRENT_USER__ = null;  // 🔥 Synchroniser
    updateAuthUI();
    return null;
  }
}

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

function getPath() {
  const hash = location.hash.replace("#", "");
  const clean = (hash || "/home").split("?")[0];
  return clean || "/home";
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

// ===== Partners Functions =====
function renderPartnersSpotlight(limit = 2) {
  const items = (PARTNERS || []).slice(0, limit);
  if (!items.length) return "";

  const cards = items.map(p => `
    <article class="partner-card-v2">
      <div class="partner-v2-header">
        <div class="partner-v2-logo">
          ${p.logo ? `<img src="${p.logo}" alt="${p.name}" loading="lazy">` : `<div class="partner-v2-fallback">🤝</div>`}
        </div>
        <div class="partner-v2-info">
          <div class="partner-v2-name-row">
            <span class="partner-v2-name">${p.name}</span>
            <span class="partner-v2-badge">✓ Partenaire</span>
          </div>
          <span class="partner-v2-tag">${p.tag || "Soutient OtakuZone"}</span>
        </div>
      </div>
      
      <p class="partner-v2-desc">${p.desc || ""}</p>
      
      <a class="partner-v2-cta" href="${p.url}" target="_blank" rel="noopener">
        <span>Visiter ${p.name}</span>
        <i class="fas fa-external-link-alt"></i>
      </a>
    </article>
  `).join("");

  return `
    <section class="partners-v2-section">
      <div class="partners-v2-header-row">
        <div>
          <div class="partners-v2-title">🤝 Partenaires officiels</div>
          <div class="partners-v2-subtitle">Ils soutiennent OtakuZone et aident la communauté</div>
        </div>
        <a class="partners-v2-viewall" href="#/partners">
          Voir tout <i class="fas fa-chevron-right"></i>
        </a>
      </div>
      
      <div class="partners-v2-grid">
        ${cards}
      </div>
    </section>
  `;
}


function renderPartnersPage() {
  const cards = PARTNERS.map(p => `
    <article class="partner-page-card">
      <div class="partner-page-logo">
        ${p.logo ? `<img src="${p.logo}" alt="${p.name}" loading="lazy">` : `<div class="partner-page-fallback">🤝</div>`}
      </div>
      <div class="partner-page-content">
        <div class="partner-page-header">
          <h3 class="partner-page-name">${p.name}</h3>
          <span class="partner-page-tag">${p.tag || "Partenaire"}</span>
        </div>
        <p class="partner-page-desc">${p.desc || ""}</p>
        <a class="partner-page-link" href="${p.url}" target="_blank" rel="noopener">
          Visiter le site <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </article>
  `).join("");

  return `
    <div class="page">
      <div class="page-head">
        <h1>🤝 Nos Partenaires</h1>
        <p class="small">Ils soutiennent OtakuZone et aident la communauté à grandir.</p>
      </div>
      
      <div class="partners-page-grid">
        ${cards || `<div class="small">Aucun partenaire pour le moment.</div>`}
      </div>
      
      <div class="partner-cta-box">
        <h3>🚀 Devenir partenaire</h3>
        <p class="small">Tu as une boutique, un service ou une communauté ? Collaborons ensemble.</p>
        <a class="btn primary" href="https://wa.me/22663494954?text=Salut%20!%20Je%20veux%20devenir%20partenaire%20sur%20OtakuZone%20🤝" target="_blank" rel="noopener">
          Me contacter
        </a>
      </div>
    </div>
  `;
}


function wirePartnersPage() {
  const btn = document.getElementById("partnerContactBtn");
  if (!btn) return;

  const phone = "22663494954";
  const text = encodeURIComponent("Salut ! Je veux devenir partenaire sur OtakuZone 🤝");
  const wa = `https://wa.me/${phone}?text=${text}`;

  btn.href = wa;
  btn.target = "_blank";
  btn.rel = "noopener";
}

// ===== Page Rendering =====
const routes = {
  "/home": () => `
    <div class="page">
      <div class="card hero-home">
        <h1>🎌 Bienvenue sur OtakuZone</h1>
        ${renderPartnersSpotlight(2)}
        <p class="hero-sub">
          Ton hub otaku intelligent.<br>
          Découvre des anime selon ton <b>mood</b>, gagne de l'XP et construis ton profil.
        </p>
        <div class="hero-actions">
          <a href="#/mood" class="btn primary">🎭 Trouver un anime selon mon mood</a>
          <a href="#/quiz" class="btn ghost">🧠 Daily Quiz (+XP)</a>
          <a href="#/collection" class="btn ghost">🎒 Ma Collection</a>
        </div>
        <button id="homeInstallBtn" class="btn ghost">📱 Installer</button>
        
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
        ` : ''}
        
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
  // Dans l'objet routes
"/cards": () => {
    window.location.href = '/cards/index.php';
    return `<div class="loading">Redirection vers le système de cartes...</div>`;
},
"/cards/request": () => {
    // Géré par PHP
    return `<div class="loading">Chargement...</div>`;
},

  "/user/:id": () => `
  <div class="page">
    <div class="page-head">
      <h1>🎒 Collection d'un Otaku</h1>
      <p class="small">Découvre les favoris de cet utilisateur</p>
    </div>
    <div id="publicProfileStatus" class="loading">Chargement...</div>
    <div id="publicProfileBox" style="display:none">
      <div class="card" style="padding:16px; margin-bottom:16px">
        <div class="profile-top">
          <div class="avatar" id="publicAvatar">
            <div id="publicAvatarFallback">🎌</div>
          </div>
          <div class="profile-meta">
            <div class="profile-name" id="publicUsername">—</div>
            <div class="profile-badges" id="publicBadges"></div>
          </div>
        </div>
      </div>
      <div id="publicCollectionGrid" class="collection-grid"></div>
    </div>
  </div>
`,

  "/partners": () => renderPartnersPage(),
  
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
 "/certificat": () => `
  <div class="page">
    <div class="page-head">
      <h1>📜 Mon Certificat</h1>
      <p class="small">Votre passeport officiel dans l'univers OtakuZone</p>
    </div>
    <div id="certificateContainer" class="certificate-container">
      <div class="cert-loading">
        <div class="cert-spinner"></div>
        <p style="color: rgba(255,255,255,0.6);">Chargement...</p>
      </div>
    </div>
  </div>
`,

"/certificat/create": () => `
  <div class="page">
    <div class="page-head">
      <h1>✨ Nouveau Certificat</h1>
      <p class="small">Personnalisez votre certificat officiel OtakuZone</p>
    </div>
    <div id="certificateFormContainer" class="certificate-container">
      <!-- Formulaire injecté ici -->
    </div>
  </div>
`,

"/certificat/view": () => `
  <div class="page">
    <div class="page-head">
      <h1>📜 Certificat Officiel</h1>
      <p class="small">Membre certifié OtakuZone</p>
    </div>
    <div id="certificateViewContainer" class="certificate-container">
      <!-- Certificat injecté ici -->
    </div>
  </div>
`,

"/verify": () => `
  <div class="page">
    <div class="page-head">
      <h1>🔍 Vérification Certificat</h1>
      <p class="small">Vérifiez l'authenticité d'un certificat OtakuZone</p>
    </div>
    <div id="verifyContainer" class="certificate-container">
      <!-- Résultat vérification -->
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
        📩 Après l'inscription, tu dois confirmer ton compte via l'email reçu (vérifie aussi "Spam").
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
      <p class="small">Ton parcours OtakuZone</p>
    </div>
    <div id="otaku-card-container" class="card-container">
      <div class="loading">Chargement de ta carte...</div>
    </div>
  
    <div id="profileLoading" class="loading">Chargement de ton profil...</div>
    
    <div id="profileContent" style="display:none">
      <!-- Carte principale profil -->
      <div class="profile-main-card">
        <div class="profile-avatar-section">
          <img id="profileAvatar" src="" alt="Avatar" class="profile-avatar-img">
          <div class="profile-rank-badge" id="profileRankBadge">🌱 Rookie</div>
        </div>
        
        <div class="profile-info-section">
          <h2 id="profileUsername" class="profile-username">Chargement...</h2>
          <p id="profileEmail" class="profile-email"></p>
          
          <div class="profile-stats-row">
            <div class="profile-stat">
              <span class="stat-value" id="statXP">0</span>
              <span class="stat-label">XP</span>
            </div>
            <div class="profile-stat">
              <span class="stat-value" id="statLevel">1</span>
              <span class="stat-label">Niveau</span>
            </div>
            <div class="profile-stat">
              <span class="stat-value" id="statStreak">0</span>
              <span class="stat-label">Streak</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Barre de progression XP -->
      <div class="xp-progress-card">
        <div class="xp-progress-header">
          <span>Progression vers le niveau suivant</span>
          <span id="xpProgressText">0 / 100 XP</span>
        </div>
        <div class="xp-progress-bar-bg">
          <div class="xp-progress-bar-fill" id="xpProgressBar" style="width:0%"></div>
        </div>
        <p class="xp-progress-next" id="xpNextLevel">Encore 100 XP pour niveau 2</p>
      </div>
      
      <!-- Bio -->
      <div class="profile-bio-card" id="profileBioSection" style="display:none">
        <h3>📝 Bio</h3>
        <p id="profileBioText" class="profile-bio-text">Aucune bio</p>
      </div>
      
      <!-- Actions rapides -->
      <div class="profile-actions-grid">
        <a href="#/collection" class="profile-action-btn">
          <i class="fas fa-heart"></i>
          <span>Ma Collection</span>
          <span class="action-count" id="actionFavs">0</span>
        </a>
        
        <a href="#/calendar" class="profile-action-btn">
          <i class="fas fa-calendar"></i>
          <span>Calendrier</span>
          <span class="action-count" id="actionCalendar">0</span>
        </a>
        
        <button class="profile-action-btn" id="btnEditProfile">
          <i class="fas fa-edit"></i>
          <span>Modifier Profil</span>
        </button>
        
        <button class="profile-action-btn" id="btnShareProfile">
          <i class="fas fa-share-alt"></i>
          <span>Partager</span>
        </button>
      </div>
      
      <!-- Succès -->
      <div class="profile-achievements-card">
        <h3>🏆 Succès débloqués</h3>
        <div id="achievementsList" class="achievements-grid">
          <p class="small">Chargement...</p>
        </div>
      </div>
    </div>
    
    <!-- Modal édition -->
    <div id="editProfileModal" class="oz-modal" style="display:none">
      <div class="oz-modal-overlay" data-close="1"></div>
      <div class="oz-modal-card">
        <div class="oz-modal-head">
          <h3>✏️ Modifier mon profil</h3>
          <button id="btnCloseEdit" class="btn ghost">✕</button>
        </div>
        <div class="oz-modal-body">
          <div class="form-group">
            <label>Pseudo</label>
            <input type="text" id="editUsername" class="input" placeholder="Ton pseudo">
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea id="editBio" class="input" placeholder="Parle-nous de toi..." rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>URL Avatar (optionnel)</label>
            <input type="url" id="editAvatar" class="input" placeholder="https://...">
            <p class="small" style="margin-top:4px">Laisse vide pour un avatar auto-généré</p>
          </div>
          <div class="form-actions">
            <button id="btnSaveProfile" class="btn primary">Enregistrer</button>
            <button id="btnLogout" class="btn ghost">Déconnexion</button>
          </div>
          <p id="editProfileMsg" class="small" style="margin-top:10px"></p>
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
      ` : ''}
      
      ${(isQuizEventActive()) ? `
        <div class="card" style="padding:12px; margin-top:12px">
          <div style="font-weight:800">${QUIZ_EVENT.title}</div>
          <div class="small" style="margin-top:4px">${QUIZ_EVENT.subtitle}</div>
          <div class="small" id="quizEventCount" style="margin-top:6px"></div>
        </div>
      ` : ''}
      
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
        <p class="small">Gère tes animes favoris, note-les et planifie tes visionnages</p>
      </div>
      
      <div class="collection-stats" id="collectionStats">
        <div class="stat-card">
          <i class="fas fa-heart"></i>
          <div class="stat-value" id="statFavs">0</div>
          <div class="stat-label">Favoris</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-eye"></i>
          <div class="stat-value" id="statWatched">0</div>
          <div class="stat-label">Vus</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-star"></i>
          <div class="stat-value" id="statAvgRating">0.0</div>
          <div class="stat-label">Note moyenne</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-calendar"></i>
          <div class="stat-value" id="statUpcoming">0</div>
          <div class="stat-label">Séances planifiées</div>
        </div>
      </div>
      
      <div class="collection-tabs" id="collectionTabs">
        <button class="tab active" data-tab="favoris">
          <i class="fas fa-heart"></i> Favoris
          <span id="favCount" class="tab-badge">0</span>
        </button>
        <button class="tab" data-tab="vus">
          <i class="fas fa-eye"></i> Vus
          <span id="watchedCount" class="tab-badge">0</span>
        </button>
        <button class="tab" data-tab="calendar">
          <i class="fas fa-calendar"></i> Calendrier
          <span id="calendarCount" class="tab-badge">0</span>
        </button>
        <button class="tab" data-tab="recommendations">
          <i class="fas fa-lightbulb"></i> Recommandations
        </button>
      </div>
      
      <div id="collectionContent">
        <div id="collectionGrid" class="collection-grid"></div>
        <div id="calendarView" class="calendar-view" style="display:none"></div>
        <div id="recommendationsView" class="recommendations-view" style="display:none"></div>
      </div>
      
      <div class="advanced-filters" id="advancedFilters" style="margin-top:16px; display:none">
        <div class="card" style="padding:12px">
          <div class="row" style="justify-content:space-between;margin:0">
            <div style="font-weight:800">🔍 Filtres avancés</div>
            <button class="btn ghost small" id="clearFilters">Effacer tout</button>
          </div>
          <div class="filter-section">
            <div class="filter-group">
              <label class="small">Trier par:</label>
              <select id="sortBy" class="input small">
                <option value="date_desc">Date ajout (récent)</option>
                <option value="date_asc">Date ajout (ancien)</option>
                <option value="rating_desc">Note (haut)</option>
                <option value="rating_asc">Note (bas)</option>
                <option value="title_asc">Titre (A-Z)</option>
                <option value="title_desc">Titre (Z-A)</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="small">Note minimale:</label>
              <input type="range" id="ratingFilter" min="0" max="10" step="0.5" value="0" class="slider">
              <span class="small" id="ratingValue">0+</span>
            </div>
            <div class="filter-group">
              <label class="small">Année:</label>
              <div class="range-inputs">
                <input type="number" id="yearMin" class="input small" placeholder="1990" min="1970" max="2024">
                <span class="small">à</span>
                <input type="number" id="yearMax" class="input small" placeholder="2024" min="1970" max="2024">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row" style="margin-top:12px; justify-content:space-between">
        <button class="btn ghost small" id="toggleFilters">
          <i class="fas fa-filter"></i> Filtres avancés
        </button>
        <button class="btn ghost small" id="changeView">
          <i class="fas fa-th"></i> Grille
        </button>
      </div>
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
  
  "/calendar": () => `
    <div class="page">
      <div class="page-head">
        <h1>📅 Calendrier de Visionnage</h1>
        <p class="small">Planifie tes séances et ne rate plus aucun épisode</p>
      </div>
      <div id="calendarContainer" class="calendar-container"></div>
    </div>
  `,
  
  "/recommendations": () => `
    <div class="page">
      <div class="page-head">
        <h1>💡 Recommandations Intelligentes</h1>
        <p class="small">Découvre des animes basés sur tes préférences</p>
      </div>
      <div id="recommendationsContainer" class="recommendations-container"></div>
    </div>
  `,
};

// ===== Initialisation du thème =====
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

async function render() {
  // 🔥 FORCE le rafraîchissement de la session AVANT toute vérification
  await refreshSession();
  
  const path = getPath();
  console.log("🔍 Render path:", path, "currentUser:", currentUser?.id || "null");
  
  // 🔥 Vérifie si on est sur une route protégée (incluant /certificat)
  const protectedRoutes = new Set([
    "/profil", 
    "/collection", 
    "/calendar", 
    "/recommendations",
    "/certificat",
    "/certificat/create", 
    "/certificat/view"
  ]);
  
  // 🔥 Pattern pour matcher /certificat/* 
  const isCertificatRoute = path.startsWith('/certificat');
  
  if ((protectedRoutes.has(path) || isCertificatRoute) && !currentUser) {
    showToast("Connecte-toi pour accéder à cette page 🔐");
    location.hash = "#/login";
    return;
  }

  // Version correcte - APRÈS
  const animeDetailMatch = path.match(/^\/anime\/(\d+)$/);
  const moodDetailMatch = path.match(/^\/mood\/([^\/]+)$/);
  const userProfileMatch = path.match(/^\/user\/([^\/]+)$/);

  if (userProfileMatch) {
    const userId = userProfileMatch[1];
    view.innerHTML = routes["/user/:id"]();
    await renderPublicProfile(userId);
    return;
  }

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
      checkQuizReminder();
    }

    if (path === "/login") wireLoginPage();
    if (path === "/auth/callback") handleAuthCallback();
    if (path === "/profil") await wireProfilePage();
    if (path === "/anime") wireAnimePage();
    if (path === "/favoris") await renderFavs();
    if (path === "/quiz") wireQuizPage();
    if (path === "/mood") wireMoodPage();
    if (path === "/collection") await wireCollectionPage();
    if (path === "/ranking") wireRankingPage();
    if (path === "/partners") wirePartnersPage();
    if (path === "/admin/mood") wireMoodTrainer();
    if (path === "/calendar") await renderCalendarPage();
    if (path === "/recommendations") await renderRecommendationsPage();
    
    // 🔥 AJOUTE CES LIGNES POUR LES CERTIFICATS
    if (path === "/certificat") await wireCertificatePage();
   // Dans render(), avant l'appel à wireCertificateCreatePage
if (path === "/certificat/create") {
  console.log("🎯 Avant wireCertificateCreatePage - currentUser:", currentUser?.id);
  await wireCertificateCreatePage();
  console.log("✅ Après wireCertificateCreatePage");
}

    if (path === "/certificat/view") await wireCertificateViewPage();
    if (path === "/verify") await wireVerifyPage();

    trackPageView(path);
  }
  
  updateActiveNav();
}


function checkQuizReminder() {
  const lastQuiz = localStorage.getItem(QUIZ_DAY_KEY);
  const today = todayISO();
  
  if (lastQuiz !== today) {
    // Affiche un petit badge "Quiz disponible"
    setTimeout(() => {
      showToast('🧠 Quiz quotidien disponible !');
    }, 2000);
  }
}

// ===== Utility Functions =====
function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function trackPageView(path) {
  if (typeof gtag !== "function") return;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title
  });
}

// ===== Anime Functions =====
function renderAnimeCard(a) {
  const id = Number(a?.id ?? a?.mal_id);
  const title = a?.title || "Sans titre";
  const score = a?.score ?? "—";
  const year = a?.year ?? "—";
  const img = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const genres = (a.genres || []).slice(0, 2).map((g) => g.name).join(" • ");

  return `
    <article class="card clickable anime-card" data-id="${id}">
      ${img ? `<img src="${img}" alt="${title}">` : `<div class="card-cover"></div>`}
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div class="card-title">${title}</div>
          <div class="card-actions-mini">
            <button class="fav-btn" data-fav-id="${id}" title="${isFav(id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
              ${isFav(id) ? "❤️" : "🤍"}
            </button>
            <button class="watch-btn" data-watch-id="${id}" title="${isWatched(id) ? 'Marquer comme non-vu' : 'Marquer comme vu'}">
              ${isWatched(id) ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        <div class="badges">
          <span class="badge">⭐ ${score}</span>
          <span class="badge">${year}</span>
          ${genres ? `<span class="badge">${genres}</span>` : ""}
        </div>
        <div class="user-rating" data-anime-id="${id}" style="margin-top:8px">
          ${renderRatingStars(id, getRating(id))}
        </div>
        <input class="input fav-reason" data-reason-id="${id}" placeholder="Pourquoi tu l'aimes ? (ex: OST incroyable)" style="margin-top:10px" ${isFav(id) ? "" : "disabled"} />
      </div>
    </article>
  `;
}

// ===== NEW: Rating System Functions =====
function loadRatings() {
  try {
    return JSON.parse(localStorage.getItem(RATING_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRatings(ratings) {
  localStorage.setItem(RATING_CACHE_KEY, JSON.stringify(ratings));
}

function getRating(animeId) {
  if (!ratingsCache) ratingsCache = loadRatings();
  return ratingsCache[animeId] || 0;
}

async function setRating(animeId, rating) {
  if (!ratingsCache) ratingsCache = loadRatings();
  ratingsCache[animeId] = rating;
  saveRatings(ratingsCache);
  
  if (currentUser) {
    // Sync with Supabase
    const { error } = await supabase
      .from("ratings")
      .upsert({
        user_id: currentUser.id,
        anime_id: animeId,
        rating: rating,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,anime_id" });
      
    if (error) console.warn("Error saving rating:", error);
  }
  
  return rating;
}

function renderRatingStars(animeId, currentRating = 0) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(`
      <span class="star ${currentRating >= i ? 'filled' : ''}" 
            data-rating="${i}" 
            data-anime-id="${animeId}"
            title="${i}/5">
        ${currentRating >= i ? '★' : '☆'}
      </span>
    `);
  }
  return `
    <div class="rating-stars">
      ${stars.join('')}
      <span class="rating-value">${currentRating > 0 ? currentRating.toFixed(1) : 'Non noté'}</span>
    </div>
  `;
}

function wireRatingStars() {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', async (e) => {
      const animeId = parseInt(star.dataset.animeId);
      const rating = parseInt(star.dataset.rating);
      
      await setRating(animeId, rating);
      
      // Update the display
      const ratingContainer = star.closest('.user-rating');
      if (ratingContainer) {
        ratingContainer.innerHTML = renderRatingStars(animeId, rating);
        wireRatingStars();
      }
      
      showToast(`Noté ${rating}/5 ⭐`);
    });
    
    // Hover effect
    star.addEventListener('mouseenter', (e) => {
      const animeId = parseInt(star.dataset.animeId);
      const rating = parseInt(star.dataset.rating);
      const container = star.closest('.rating-stars');
      const stars = container.querySelectorAll('.star');
      
      stars.forEach((s, i) => {
        if (i < rating) {
          s.style.color = '#ffd700';
        }
      });
    });
    
    star.addEventListener('mouseleave', (e) => {
      const container = star.closest('.rating-stars');
      const stars = container.querySelectorAll('.star');
      const animeId = parseInt(star.dataset.animeId);
      const currentRating = getRating(animeId);
      
      stars.forEach((s, i) => {
        const starRating = parseInt(s.dataset.rating);
        s.style.color = starRating <= currentRating ? '#ffd700' : '#666';
      });
    });
  });
}

// ===== NEW: Watch Calendar Functions =====
function loadCalendar() {
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCalendar(calendar) {
  localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(calendar));
}

function addToCalendar(animeId, date, episode = 1, note = "") {
  if (!watchCalendarCache) watchCalendarCache = loadCalendar();
  
  const session = {
    id: Date.now(),
    animeId,
    date: date.toISOString().split('T')[0],
    episode,
    note,
    completed: false,
    created_at: new Date().toISOString()
  };
  
  watchCalendarCache.push(session);
  saveCalendar(watchCalendarCache);
  
  if (currentUser) {
    // Sync with Supabase
    supabase.from("watch_calendar").upsert({
      user_id: currentUser.id,
      anime_id: animeId,
      session_date: session.date,
      episode: episode,
      note: note,
      completed: false
    }).catch(err => console.warn("Calendar sync error:", err));
  }
  
  return session;
}

function removeFromCalendar(sessionId) {
  if (!watchCalendarCache) watchCalendarCache = loadCalendar();
  watchCalendarCache = watchCalendarCache.filter(s => s.id !== sessionId);
  saveCalendar(watchCalendarCache);
  
  if (currentUser) {
    supabase.from("watch_calendar").delete().eq("id", sessionId).catch(console.warn);
  }
}

function getUpcomingSessions(days = 7) {
  if (!watchCalendarCache) watchCalendarCache = loadCalendar();
  const today = new Date();
  const limit = new Date();
  limit.setDate(today.getDate() + days);
  
  return watchCalendarCache
    .filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= today && sessionDate <= limit && !s.completed;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ===== NEW: Intelligent Recommendations Functions =====
function generateRecommendations() {
  const favs = favCache || [];
  const watched = Object.values(watchedCache || {});
  const ratings = ratingsCache || {};
  
  if (favs.length === 0 && watched.length === 0) {
    return [];
  }
  
  // Simple recommendation logic based on genres from favorites
  const favoriteGenres = {};
  favs.forEach(fav => {
    // Extract genres from title or use default
    const genres = detectGenresFromTitle(fav.title);
    genres.forEach(genre => {
      favoriteGenres[genre] = (favoriteGenres[genre] || 0) + 1;
    });
  });
  
  // Sort genres by frequency
  const topGenres = Object.entries(favoriteGenres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
  
  // Generate mock recommendations based on top genres
  const recommendations = [
    {
      id: 1001,
      title: "Attack on Titan",
      reason: "Similaire à tes favoris d'action",
      match: 92,
      img: "https://cdn.myanimelist.net/images/anime/10/47347.jpg"
    },
    {
      id: 1002,
      title: "Your Lie in April",
      reason: "Triste et émouvant comme tes préférences",
      match: 85,
      img: "https://cdn.myanimelist.net/images/anime/3/67177.jpg"
    },
    {
      id: 1003,
      title: "Demon Slayer",
      reason: "Action et visuels époustouflants",
      match: 88,
      img: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg"
    }
  ];
  
  return recommendations;
}

function detectGenresFromTitle(title) {
  const titleLower = title.toLowerCase();
  const genres = [];
  
  if (titleLower.includes("attack") || titleLower.includes("titan")) genres.push("Action", "Drama");
  if (titleLower.includes("lie") || titleLower.includes("april")) genres.push("Drama", "Romance");
  if (titleLower.includes("demon") || titleLower.includes("slayer")) genres.push("Action", "Fantasy");
  if (titleLower.includes("one piece")) genres.push("Adventure", "Action");
  if (titleLower.includes("naruto")) genres.push("Action", "Adventure");
  
  return genres.length > 0 ? genres : ["Action", "Adventure"];
}

// ===== NEW: Advanced Filtering Functions =====
function applyAdvancedFilters(items) {
  let filtered = [...items];
  
  // Apply rating filter
  if (activeFilters.ratingRange.min > 0) {
    filtered = filtered.filter(item => {
      const rating = getRating(item.id || item.anime_id);
      return rating >= activeFilters.ratingRange.min;
    });
  }
  
  // Apply year filter
  filtered = filtered.filter(item => {
    const year = parseInt(item.year) || 2000;
    return year >= activeFilters.yearRange.min && year <= activeFilters.yearRange.max;
  });
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (activeFilters.sortBy) {
      case 'date_desc':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'date_asc':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case 'rating_desc':
        return getRating(b.id || b.anime_id) - getRating(a.id || a.anime_id);
      case 'rating_asc':
        return getRating(a.id || a.anime_id) - getRating(b.id || b.anime_id);
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '');
      default:
        return 0;
    }
  });
  
  return filtered;
}

// ===== Watched (VU) =====
let watchedCacheFetchedAt = 0;

function isWatched(animeId) {
  return !!watchedCache?.[String(animeId)];
}

async function refreshWatchedCache(force = false) {
  if (!currentUser) { watchedCache = {}; return; }

  const now = Date.now();
  if (!force && watchedCache && (now - watchedCacheFetchedAt) < 30_000) return;

  const { data, error } = await supabase
    .from("watched")
    .select("anime_id, title, image_url, watched_at")
    .eq("user_id", currentUser.id);

  if (error) {
    console.warn("refreshWatchedCache:", error.message);
    watchedCache = watchedCache || {};
    return;
  }

  watchedCache = {};
  for (const row of (data || [])) watchedCache[String(row.anime_id)] = row;
  watchedCacheFetchedAt = now;
}

async function toggleWatched(anime) {
  if (!currentUser) {
    showToast("Connecte-toi pour marquer un animé comme vu 👀");
    location.hash = "#/login";
    return;
  }

  await refreshWatchedCache();

  const id = String(anime.id);
  const already = !!watchedCache[id];

  if (already) {
    const { error } = await supabase
      .from("watched")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("anime_id", Number(anime.id));

    if (error) return showToast("❌ " + error.message);
    delete watchedCache[id];
    showToast("Retiré des animés vus 👀");
  } else {
    const payload = {
      user_id: currentUser.id,
      anime_id: Number(anime.id),
      title: anime.title || "",
      image_url: anime.image || anime.image_url || "",
      watched_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("watched").upsert(payload);
    if (error) return showToast("❌ " + error.message);
    watchedCache[id] = payload;
    showToast("Marqué comme vu ✅");
  }

  // Update collection stats
  if (getPath() === "/collection") {
    await updateCollectionStats();
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
    const res = await safeFetch(url);

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

function showAnimeSkeleton(grid, count = 8) {
  if (!grid) return;
  grid.innerHTML = `
    <div class="skeleton-grid">
      ${Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
          <div class="skeleton-cover"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function wireAnimeCardEvents(grid) {
  grid.querySelectorAll(".anime-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest(".star")) return;
      const id = Number(card.dataset.id);
      location.hash = `#/anime/${id}`;
    });
  });

  grid.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.favId);
      const card = btn.closest(".anime-card");
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
      showToast(nowFav ? "️Ajouté à la collection ❤️" : "Retiré de la collection 🗑️");

      btn.textContent = nowFav ? "❤️" : "🤍";
      const reasonInput = card.querySelector(".fav-reason");
      if (reasonInput) {
        reasonInput.disabled = !nowFav;
        if (!nowFav) reasonInput.value = "";
      }
    });
  });

  grid.querySelectorAll(".watch-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.watchId);
      const card = btn.closest(".anime-card");
      const title = card.querySelector(".card-title").textContent;
      const img = card.querySelector("img")?.src || "";
      
      await toggleWatched({
        id,
        title,
        image_url: img
      });
      
      btn.textContent = isWatched(id) ? "👁️" : "👁️‍🗨️";
    });
  });

  grid.querySelectorAll(".fav-reason").forEach((input) => {
    const id = Number(input.dataset.reasonId);
    const fav = favCache.find((f) => f.id === id);
    if (fav?.reason) input.value = fav.reason;

    input.addEventListener("input", debounce(async (e) => {
      await setFavReason(id, e.target.value);
    }, 450));
  });
  
  // Wire rating stars
  wireRatingStars();
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
    const res = await safeFetch(`https://api.jikan.moe/v4/anime/${id}/full`);
    if (!res.ok) throw new Error(res.status);
    const data = (await res.json())?.data;

    const title = data?.title || "Sans titre";
    const img = data?.images?.jpg?.large_image_url || data?.images?.jpg?.image_url || "";
    const score = data?.score ?? "—";
    const year = data?.year ?? "—";
    const episodes = data?.episodes ?? "—";
    const statusTxt = data?.status || "—";
    const synopsis = data?.synopsis || "Synopsis indisponible.";

    status.className = "small";
    status.textContent = " ";

    wrap.innerHTML = `
      <div class="hero">
        ${img ? `<img class="hero-cover" src="${img}" alt="${escapeHtml(title)}">` : ""}
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
              <button id="detailWatchBtn" class="btn">
                ${isWatched(id) ? "👁️ Vu" : "👁️‍🗨️ Marquer comme vu"}
              </button>
              <a class="btn" href="#/anime">← Retour</a>
            </div>
          </div>
          
          <div class="section">
            <h2>Ta note</h2>
            <div id="detailRating" class="rating-container">
              ${renderRatingStars(id, getRating(id))}
            </div>
            <div class="small" style="margin-top:6px">Clique sur les étoiles pour noter</div>
          </div>
          
          <div class="section">
            <h2>Planifier un visionnage</h2>
            <div class="row">
              <input type="date" id="watchDate" class="input" value="${new Date().toISOString().split('T')[0]}" />
              <input type="number" id="watchEpisode" class="input" placeholder="Épisode" min="1" value="1" />
              <button id="scheduleWatch" class="btn">Planifier</button>
            </div>
            <div class="small" style="margin-top:6px">Ajoute à ton calendrier de visionnage</div>
          </div>
          
          <div class="section">
            <h2>Pourquoi tu l'aimes</h2>
            <input id="detailReason" class="input" placeholder="Ex: Les personnages, l'OST, l'ambiance..." ${isFav(id) ? "" : "disabled"} />
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
      showToast(nowFav ? "Ajouté à la collection ❤️" : "Retiré de la collection 🗑️");

      favBtn.innerHTML = `${nowFav ? "❤️" : "🤍"} Favori`;

      const input = document.getElementById("detailReason");
      if (input) {
        input.disabled = !nowFav;
        if (!nowFav) input.value = "";
      }
    });

    const watchBtn = document.getElementById("detailWatchBtn");
    watchBtn?.addEventListener("click", async () => {
      await toggleWatched({
        id,
        title,
        image_url: img
      });
      watchBtn.textContent = isWatched(id) ? "👁️ Vu" : "👁️‍🗨️ Marquer comme vu";
    });

    reasonInput?.addEventListener("input", debounce(async (e) => {
      await setFavReason(id, e.target.value);
    }, 450));

    // Wire rating stars
    wireRatingStars();
    
    // Schedule watch button
    document.getElementById("scheduleWatch")?.addEventListener("click", () => {
      const date = document.getElementById("watchDate").value;
      const episode = parseInt(document.getElementById("watchEpisode").value) || 1;
      
      if (!date) {
        showToast("Choisis une date");
        return;
      }
      
      addToCalendar(id, new Date(date), episode, `Visionnage de ${title}`);
      showToast("Ajouté au calendrier 📅");
    });

    const recoRes = await safeFetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`);

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

// ===== Favorites System =====
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
    .eq("user_id", currentUser.id) // ✅ IMPORTANT
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

// ===== NEW: Collection Page Functions =====
async function wireCollectionPage() {
  await refreshFavCache();
  await refreshWatchedCache();
  ratingsCache = loadRatings();
  watchCalendarCache = loadCalendar();
  
  await updateCollectionStats();
  await renderFavs();
  
  // Tab switching
  document.querySelectorAll("#collectionTabs .tab").forEach(tab => {
    tab.addEventListener("click", async () => {
      document.querySelectorAll("#collectionTabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      document.getElementById("collectionGrid").style.display = "none";
      document.getElementById("calendarView").style.display = "none";
      document.getElementById("recommendationsView").style.display = "none";
      
      const tabType = tab.dataset.tab;
      switch(tabType) {
        case "favoris":
          document.getElementById("collectionGrid").style.display = "grid";
          await renderFavs();
          break;
        case "vus":
          document.getElementById("collectionGrid").style.display = "grid";
          await renderWatched();
          break;
        case "calendar":
          document.getElementById("calendarView").style.display = "block";
          await renderCalendarView();
          break;
        case "recommendations":
          document.getElementById("recommendationsView").style.display = "block";
          await renderRecommendationsView();
          break;
      }
    });
  });
  
  // Advanced filters
  document.getElementById("toggleFilters")?.addEventListener("click", () => {
    const filters = document.getElementById("advancedFilters");
    filters.style.display = filters.style.display === "none" ? "block" : "none";
  });
  
  document.getElementById("clearFilters")?.addEventListener("click", () => {
    resetFilters();
    showToast("Filtres réinitialisés");
  });
  
  // View toggle
  let isGridView = true;
  document.getElementById("changeView")?.addEventListener("click", () => {
    isGridView = !isGridView;
    const grid = document.getElementById("collectionGrid");
    const btn = document.getElementById("changeView");
    
    if (isGridView) {
      grid.classList.remove("list-view");
      grid.classList.add("collection-grid");
      btn.innerHTML = '<i class="fas fa-th"></i> Grille';
    } else {
      grid.classList.remove("collection-grid");
      grid.classList.add("list-view");
      btn.innerHTML = '<i class="fas fa-list"></i> Liste';
    }
  });
  
  // Filter events
  document.getElementById("sortBy")?.addEventListener("change", (e) => {
    activeFilters.sortBy = e.target.value;
    applyCurrentFilters();
  });
  
  document.getElementById("ratingFilter")?.addEventListener("input", (e) => {
    activeFilters.ratingRange.min = parseFloat(e.target.value);
    document.getElementById("ratingValue").textContent = e.target.value + "+";
    applyCurrentFilters();
  });
  
  document.getElementById("yearMin")?.addEventListener("change", (e) => {
    activeFilters.yearRange.min = parseInt(e.target.value) || 1970;
    applyCurrentFilters();
  });
  
  document.getElementById("yearMax")?.addEventListener("change", (e) => {
    activeFilters.yearRange.max = parseInt(e.target.value) || new Date().getFullYear();
    applyCurrentFilters();
  });
}

async function updateCollectionStats() {
  const favCount = favCache.length;
  const watchedCount = Object.keys(watchedCache || {}).length;
  
  // Calculate average rating
  let totalRating = 0;
  let ratedCount = 0;
  Object.values(ratingsCache || {}).forEach(rating => {
    if (rating > 0) {
      totalRating += rating;
      ratedCount++;
    }
  });
  const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : "0.0";
  
  // Count upcoming sessions
  const upcoming = getUpcomingSessions().length;
  
  // Update UI
  document.getElementById("statFavs").textContent = favCount;
  document.getElementById("statWatched").textContent = watchedCount;
  document.getElementById("statAvgRating").textContent = avgRating;
  document.getElementById("statUpcoming").textContent = upcoming;
  
  // Update tab badges
  document.getElementById("favCount").textContent = favCount;
  document.getElementById("watchedCount").textContent = watchedCount;
  document.getElementById("calendarCount").textContent = upcoming;
}

async function renderFavs() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  await refreshFavCache(true);
  let favs = favCache;

  // Apply filters
  favs = applyAdvancedFilters(favs);

  if (!favs.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-emoji">❤️</div>
        <div class="empty-title">Aucun favori</div>
        <div class="empty-text">Ajoute des animes à tes favoris en cliquant sur le cœur</div>
        <a href="#/anime" class="btn primary" style="margin-top:12px">Découvrir des animes</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = favs.map((f) => `
    <article class="card collection-card fav-card" data-id="${f.id}">
      <div class="card-cover">
        ${f.img ? `<img src="${f.img}" alt="${escapeHtml(f.title)}" loading="lazy">` : ''}
        <div class="card-overlay">
          <button class="card-btn fav-btn" title="Retirer des favoris">
            <i class="fas fa-heart" style="color:#ff4081"></i>
          </button>
          <button class="card-btn watch-btn" title="Marquer comme vu">
            <i class="fas fa-eye"></i>
          </button>
          <button class="card-btn calendar-btn" title="Ajouter au calendrier">
            <i class="fas fa-calendar-plus"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(f.title)}</div>
        <div class="card-meta">
          ${f.score ? `<span class="card-score">⭐ ${escapeHtml(f.score)}</span>` : ''}
          ${f.year ? `<span class="card-year">📅 ${escapeHtml(f.year)}</span>` : ''}
          <span class="card-rating">${renderRatingStars(f.id, getRating(f.id))}</span>
        </div>
        ${f.reason ? `
          <div class="card-reason">
            <div class="reason-label">Pourquoi :</div>
            <div class="reason-text">${escapeHtml(f.reason)}</div>
          </div>
        ` : ''}
        <div class="card-actions">
          <button class="btn small edit-reason" data-id="${f.id}">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <a href="#/anime/${f.id}" class="btn small">
            <i class="fas fa-info-circle"></i> Détails
          </a>
        </div>
      </div>
    </article>
  `).join("");

  // Wire up events
  grid.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".fav-card");
      const animeId = Number(card.dataset.id);
      await toggleFav({ id: animeId });
      await updateCollectionStats();
      await renderFavs();
    });
  });

  grid.querySelectorAll(".watch-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".fav-card");
      const animeId = Number(card.dataset.id);
      const title = card.querySelector(".card-title").textContent;
      const img = card.querySelector("img")?.src || "";
      
      await toggleWatched({
        id: animeId,
        title,
        image_url: img
      });
      
      showToast("Marqué comme vu ✅");
      await updateCollectionStats();
    });
  });

  grid.querySelectorAll(".calendar-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".fav-card");
      const animeId = Number(card.dataset.id);
      const title = card.querySelector(".card-title").textContent;
      
      const date = prompt("Quand veux-tu regarder cet anime ? (YYYY-MM-DD)", 
        new Date().toISOString().split('T')[0]);
      
      if (date) {
        const episode = prompt("À partir de quel épisode ?", "1");
        addToCalendar(animeId, new Date(date), parseInt(episode) || 1, title);
        showToast("Ajouté au calendrier 📅");
        await updateCollectionStats();
      }
    });
  });

  grid.querySelectorAll(".edit-reason").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const animeId = Number(btn.dataset.id);
      const fav = favCache.find(f => f.id === animeId);
      
      const reason = prompt("Pourquoi aimes-tu cet anime ?", fav?.reason || "");
      if (reason !== null) {
        await setFavReason(animeId, reason);
        showToast("Raison mise à jour ✏️");
        await renderFavs();
      }
    });
  });

  grid.querySelectorAll(".collection-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest("button") && !e.target.closest("a") && !e.target.closest(".star")) {
        const id = Number(card.dataset.id);
        location.hash = `#/anime/${id}`;
      }
    });
  });
  
  // Wire rating stars
  wireRatingStars();
}

async function renderWatched() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  await refreshWatchedCache();
  let watchedItems = Object.values(watchedCache || {});

  // Apply filters
  watchedItems = applyAdvancedFilters(watchedItems);

  if (!watchedItems.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-emoji">👀</div>
        <div class="empty-title">Aucun anime vu</div>
        <div class="empty-text">Marque des animes comme "vus" depuis la page Anime</div>
        <a href="#/anime" class="btn primary" style="margin-top:12px">Explorer les animes</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = watchedItems.map(item => `
    <article class="card collection-card watched-card" data-id="${item.anime_id}">
      <div class="card-cover">
        ${item.image_url ? `<img src="${item.image_url}" alt="${escapeHtml(item.title)}" loading="lazy">` : ''}
        <div class="card-overlay">
          <button class="card-btn watched-btn" title="Marquer comme non-vu">
            <i class="fas fa-eye-slash"></i>
          </button>
          <button class="card-btn fav-btn" title="Ajouter aux favoris">
            <i class="fas fa-heart"></i>
          </button>
          <button class="card-btn rating-btn" title="Noter">
            <i class="fas fa-star"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-meta">
          <span class="card-date">Vu le ${new Date(item.watched_at).toLocaleDateString('fr-FR')}</span>
          <span class="card-rating">${renderRatingStars(item.anime_id, getRating(item.anime_id))}</span>
        </div>
        <div class="card-actions">
          <button class="btn ghost small add-to-favs" data-id="${item.anime_id}">
            <i class="fas fa-heart"></i> Favori
          </button>
          <a href="#/anime/${item.anime_id}" class="btn small">
            <i class="fas fa-info-circle"></i> Détails
          </a>
        </div>
      </div>
    </article>
  `).join("");

  // Wire up events
  grid.querySelectorAll(".watched-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".watched-card");
      const animeId = Number(card.dataset.id);
      const anime = {
        id: animeId,
        title: card.querySelector(".card-title").textContent,
        image_url: card.querySelector("img")?.src || ""
      };
      await toggleWatched(anime);
      await updateCollectionStats();
      await renderWatched();
    });
  });

  grid.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".watched-card");
      const animeId = Number(card.dataset.id);
      const title = card.querySelector(".card-title").textContent;
      const img = card.querySelector("img")?.src || "";
      
      const added = await toggleFav({
        id: animeId,
        title,
        img,
        score: "",
        year: ""
      });
      
      showToast(added ? "Ajouté aux favoris ❤️" : "Retiré des favoris");
      await updateCollectionStats();
    });
  });

  grid.querySelectorAll(".rating-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const card = btn.closest(".watched-card");
      const animeId = Number(card.dataset.id);
      
      const rating = prompt("Note cet anime de 1 à 5 :", getRating(animeId) || "3");
      if (rating !== null) {
        const numRating = Math.min(5, Math.max(1, parseInt(rating) || 3));
        await setRating(animeId, numRating);
        showToast(`Noté ${numRating}/5 ⭐`);
        await renderWatched();
      }
    });
  });

  grid.querySelectorAll(".collection-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest("button") && !e.target.closest("a")) {
        const id = Number(card.dataset.id);
        location.hash = `#/anime/${id}`;
      }
    });
  });
  
  // Wire rating stars
  wireRatingStars();
}

async function renderCalendarView() {
  const container = document.getElementById("calendarView");
  if (!container) return;

  const upcoming = getUpcomingSessions(30);
  
  if (!upcoming.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">📅</div>
        <div class="empty-title">Aucune séance planifiée</div>
        <div class="empty-text">Planifie tes visionnages depuis la page d'un anime</div>
        <a href="#/anime" class="btn primary" style="margin-top:12px">Découvrir des animes</a>
      </div>
    `;
    return;
  }

  // Group by date
  const sessionsByDate = {};
  upcoming.forEach(session => {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  });

  const calendarHTML = Object.entries(sessionsByDate)
    .map(([date, sessions]) => {
      const dateObj = new Date(date);
      const today = new Date();
      const isToday = date === today.toISOString().split('T')[0];
      
      return `
        <div class="calendar-day ${isToday ? 'today' : ''}">
          <div class="calendar-date">
            <div class="date-day">${dateObj.getDate()}</div>
            <div class="date-month">${dateObj.toLocaleDateString('fr-FR', { month: 'short' })}</div>
            <div class="date-weekday">${dateObj.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
          </div>
          <div class="calendar-sessions">
            ${sessions.map(session => `
              <div class="calendar-session" data-session-id="${session.id}">
                <div class="session-title">${session.animeId ? `Anime #${session.animeId}` : 'Anime'}</div>
                <div class="session-details">
                  <span class="session-episode">Épisode ${session.episode}</span>
                  ${session.note ? `<span class="session-note">${escapeHtml(session.note)}</span>` : ''}
                </div>
                <div class="session-actions">
                  <button class="btn ghost small mark-completed" data-session-id="${session.id}">
                    <i class="fas fa-check"></i> Terminé
                  </button>
                  <button class="btn ghost small remove-session" data-session-id="${session.id}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="calendar-container">
      <div class="calendar-header">
        <h3>Prochaines séances (30 jours)</h3>
        <button class="btn ghost small" id="addCalendarSession">
          <i class="fas fa-plus"></i> Ajouter
        </button>
      </div>
      <div class="calendar-days">
        ${calendarHTML}
      </div>
    </div>
  `;

  // Wire up calendar events
  container.querySelectorAll(".mark-completed").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const sessionId = parseInt(btn.dataset.sessionId);
      const session = watchCalendarCache.find(s => s.id === sessionId);
      if (session) {
        session.completed = true;
        saveCalendar(watchCalendarCache);
        showToast("Séance terminée ✅");
        await renderCalendarView();
        await updateCollectionStats();
      }
    });
  });

  container.querySelectorAll(".remove-session").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const sessionId = parseInt(btn.dataset.sessionId);
      removeFromCalendar(sessionId);
      showToast("Séance supprimée");
      await renderCalendarView();
      await updateCollectionStats();
    });
  });

  document.getElementById("addCalendarSession")?.addEventListener("click", () => {
    const animeId = prompt("ID de l'anime :");
    const date = prompt("Date (YYYY-MM-DD) :", new Date().toISOString().split('T')[0]);
    const episode = prompt("Épisode :", "1");
    
    if (animeId && date) {
      addToCalendar(parseInt(animeId), new Date(date), parseInt(episode) || 1, "");
      showToast("Séance ajoutée 📅");
      setTimeout(() => renderCalendarView(), 500);
    }
  });
}

async function renderRecommendationsView() {
  const container = document.getElementById("recommendationsView");
  if (!container) return;

  const recommendations = generateRecommendations();
  
  if (!recommendations.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">💡</div>
        <div class="empty-title">Pas assez de données</div>
        <div class="empty-text">Ajoute des favoris pour recevoir des recommandations personnalisées</div>
        <a href="#/anime" class="btn primary" style="margin-top:12px">Découvrir des animes</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="recommendations-container">
      <div class="recommendations-header">
        <h3>Recommandations personnalisées</h3>
        <p class="small">Basé sur tes favoris et ton historique</p>
      </div>
      <div class="recommendations-grid">
        ${recommendations.map(rec => `
          <div class="recommendation-card">
            <div class="rec-match">
              <span class="match-badge">${rec.match}% match</span>
            </div>
            <div class="rec-image">
              ${rec.img ? `<img src="${rec.img}" alt="${escapeHtml(rec.title)}" loading="lazy">` : ''}
            </div>
            <div class="rec-body">
              <div class="rec-title">${escapeHtml(rec.title)}</div>
              <div class="rec-reason">${escapeHtml(rec.reason)}</div>
              <div class="rec-actions">
                <button class="btn small add-to-watchlist" data-anime-id="${rec.id}">
                  <i class="fas fa-plus"></i> Watchlist
                </button>
                <button class="btn ghost small view-details" data-anime-id="${rec.id}">
                  <i class="fas fa-info-circle"></i> Détails
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="recommendations-actions">
        <button class="btn" id="refreshRecommendations">
          <i class="fas fa-sync"></i> Actualiser
        </button>
        <button class="btn ghost" id="discoverMore">
          <i class="fas fa-compass"></i> Découvrir plus
        </button>
      </div>
    </div>
  `;

  // Wire up recommendation events
  container.querySelectorAll(".add-to-watchlist").forEach(btn => {
    btn.addEventListener("click", async () => {
      const animeId = parseInt(btn.dataset.animeId);
      // In a real app, this would add to watchlist
      showToast("Ajouté à ta watchlist 📋");
    });
  });

  container.querySelectorAll(".view-details").forEach(btn => {
    btn.addEventListener("click", () => {
      const animeId = parseInt(btn.dataset.animeId);
      // In a real app, this would show anime details
      location.hash = `#/anime/${animeId}`;
    });
  });

  document.getElementById("refreshRecommendations")?.addEventListener("click", async () => {
    showToast("Actualisation des recommandations...");
    setTimeout(() => renderRecommendationsView(), 1000);
  });

  document.getElementById("discoverMore")?.addEventListener("click", () => {
    location.hash = "#/anime";
  });
}

function applyCurrentFilters() {
  const activeTab = document.querySelector("#collectionTabs .tab.active")?.dataset.tab;
  if (activeTab === "favoris") {
    renderFavs();
  } else if (activeTab === "vus") {
    renderWatched();
  }
}

function resetFilters() {
  activeFilters = {
    genres: [],
    yearRange: { min: 1990, max: new Date().getFullYear() },
    ratingRange: { min: 0, max: 10 },
    status: [],
    sortBy: "date_desc"
  };
  
  document.getElementById("sortBy").value = "date_desc";
  document.getElementById("ratingFilter").value = "0";
  document.getElementById("ratingValue").textContent = "0+";
  document.getElementById("yearMin").value = "1990";
  document.getElementById("yearMax").value = new Date().getFullYear().toString();
  
  applyCurrentFilters();
}

// ===== Authentication Functions =====
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
    if (password.length < 6) return setMsg("⚠️ Mot de passe: 6 caractères minimum.");

    setMsg("Création du compte...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://otakuzone.infinityfree.me/#/auth/callback",
      },
    });

    if (error) return setMsg("❌ " + error.message);
    setMsg("📩 Compte créé ! Vérifie ton email pour confirmer ton compte.");
  });
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

// ===== Profile Functions =====
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

function computeAchievements({ xp = 0, streak = 0, quizCount = 0, favCount = 0, watchedCount = 0 }) {
  const a = [];
if (favCount >= 10) a.push({ t: "🎒 Collectionneur", d: "10 animés dans la collection" });
if (watchedCount >= 10) a.push({ t: "👁️ Otaku sérieux", d: "10 animés vus" });
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

  const [quizCount, favCount, watchedCount] = await Promise.all([
    getQuizCount(),
    getFavCount(),
    getWatchedCount()
  ]);

  const list = computeAchievements({ xp, streak, quizCount, favCount, watchedCount });

  const el = document.getElementById("achievementsList");
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<span class="small">Aucun succès pour l'instant.</span>`;
    return;
  }

  el.innerHTML = list
    .map(x => `<span class="badge" title="${String(x.d || "").replace(/"/g, "&quot;")}">${x.t}</span>`)
    .join("");
}

async function wireProfilePage() {
  await refreshSession();

  if (!currentUser) {
    showToast("Connecte-toi d'abord 🔐");
    location.hash = "#/login";
    return;
  }
  // 🔥 NOUVEAU: Initialiser la carte OtakuID
  if (typeof OtakuIDCard !== 'undefined') {
    await OtakuIDCard.init(currentUser.id);
  }

  // Helper functions pour refreshProfileUI
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  
  const setSrc = (id, src) => {
    const el = document.getElementById(id);
    if (el) el.src = src;
  };
  
  // Fonction refreshProfileUI (corrigée)
  async function refreshProfileUI() {
    const status = document.getElementById("profileLoading");
    const content = document.getElementById("profileContent");
    
    if (status) status.style.display = "block";
    if (content) content.style.display = "none";

    // Charge les caches
    await refreshFavCache(true);
    await refreshWatchedCache(true);
    
    // Récupère le profil
    const profile = await fetchMyProfile();
    if (!profile) {
      if (status) {
        status.className = "error";
        status.textContent = "❌ Impossible de charger ton profil";
      }
      return;
    }

    // Cache le profil pour le modal
    window.__OZ_CURRENT_PROFILE__ = profile;

    // Récupère les counts
    const favCount = favCache.length;
    const watchedCount = Object.keys(watchedCache || {}).length;
    const upcoming = getUpcomingSessions ? getUpcomingSessions().length : 0;

    // Calculs XP et Niveau
    const xpVal = Number(profile.xp || 0);
    const currentLevel = Math.floor(xpVal / 100) + 1;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpInCurrentLevel = xpVal - xpForCurrentLevel;
    const xpNeededForNext = 100;
    const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;
    const xpRemaining = xpNeededForNext - xpInCurrentLevel;

    // Avatar
    const avatarUrl = profile.avatar_url || getAvatarUrl(currentUser.id, profile.username);
    setSrc("profileAvatar", avatarUrl);
    
    // Infos de base
    setText("profileUsername", profile.username || "Otaku");
    setText("profileEmail", currentUser.email || "");
    setText("profileRankBadge", profile.rank || "🌱 Rookie");
    
    // Stats
    setText("statXP", xpVal);
    setText("statLevel", currentLevel);
    setText("statStreak", profile.streak_count || 0);
    
    // Barre XP
    setText("xpProgressText", `${xpInCurrentLevel} / ${xpNeededForNext} XP`);
    const progressBar = document.getElementById("xpProgressBar");
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    setText("xpNextLevel", `Encore ${xpRemaining} XP pour niveau ${currentLevel + 1}`);
    
    // Bio
    if (profile.bio) {
      const bioSection = document.getElementById("profileBioSection");
      if (bioSection) bioSection.style.display = "block";
      setText("profileBioText", profile.bio);
    }
    
    // Compteurs actions
    setText("actionFavs", favCount);
    setText("actionCalendar", upcoming);

    // Succès
    await refreshAchievements(profile);

    // Affiche le contenu
    if (status) status.style.display = "none";
    if (content) content.style.display = "block";
  }

  // Charge le profil
  await refreshProfileUI();

  // 🔥 NOUVEAU: Ajouter le bouton certificat dans la grille d'actions
  const certBtn = document.createElement('a');
  certBtn.className = 'profile-action-btn';
  certBtn.href = '#/certificat';

  // Vérifie si certificat existe pour changer l'icône
  const hasCert = await CertificateManager.hasCertificate(currentUser.id);
  certBtn.innerHTML = `
    <i class="fas fa-certificate"></i>
    <span>${hasCert ? 'Mon Certificat' : 'Créer certificat'}</span>
    ${hasCert ? '<span class="action-count" style="background: #ffd700;">✓</span>' : ''}
  `;

  // Insère dans la grille d'actions
  document.querySelector('.profile-actions-grid')?.appendChild(certBtn);

  // Modal édition
  const modal = document.getElementById("editProfileModal");
  const btnEdit = document.getElementById("btnEditProfile");
  const btnClose = document.getElementById("btnCloseEdit");
  const btnSave = document.getElementById("btnSaveProfile");
  const btnLogout = document.getElementById("btnLogout");
  const btnShare = document.getElementById("btnShareProfile");

  // Ouvrir modal
  btnEdit?.addEventListener("click", () => {
    const profile = window.__OZ_CURRENT_PROFILE__;
    if (!profile) return;
    
    const usernameInput = document.getElementById("editUsername");
    const bioInput = document.getElementById("editBio");
    const avatarInput = document.getElementById("editAvatar");
    
    if (usernameInput) usernameInput.value = profile.username || "";
    if (bioInput) bioInput.value = profile.bio || "";
    if (avatarInput) avatarInput.value = profile.avatar_url || "";
    
    if (modal) modal.style.display = "block";
  });

  // Fermer modal
  const closeModal = () => {
    if (modal) modal.style.display = "none";
    const msg = document.getElementById("editProfileMsg");
    if (msg) msg.textContent = "";
  };

  btnClose?.addEventListener("click", closeModal);
  document.querySelector(".oz-modal-overlay")?.addEventListener("click", closeModal);

  // Sauvegarder
  btnSave?.addEventListener("click", async () => {
    const username = document.getElementById("editUsername")?.value.trim();
    const bio = document.getElementById("editBio")?.value.trim();
    const avatar_url = document.getElementById("editAvatar")?.value.trim();
    const msg = document.getElementById("editProfileMsg");

    if (!username) {
      if (msg) msg.textContent = "⚠️ Pseudo requis";
      return;
    }

    if (msg) msg.textContent = "Enregistrement...";

    const { error } = await supabase
      .from("profiles")
      .update({ 
        username, 
        bio, 
        avatar_url: avatar_url || null 
      })
      .eq("id", currentUser.id);

    if (error) {
      if (msg) msg.textContent = "❌ " + error.message;
      return;
    }

    if (msg) msg.textContent = "✅ Profil mis à jour !";
    
    // Met à jour le cache du profil
    if (window.__OZ_CURRENT_PROFILE__) {
      window.__OZ_CURRENT_PROFILE__.username = username;
      window.__OZ_CURRENT_PROFILE__.bio = bio;
      window.__OZ_CURRENT_PROFILE__.avatar_url = avatar_url;
    }
    
    setTimeout(() => {
      closeModal();
      refreshProfileUI();
    }, 800);
  });

  // Déconnexion
  btnLogout?.addEventListener("click", async () => {
    await handleLogout();
  });

  // Partager
  btnShare?.addEventListener("click", () => {
    const shareUrl = `${window.location.origin}/#/user/${currentUser.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("🔗 Lien copié !");
    });
  });
}


async function refreshProfileUI() {
  const status = document.getElementById("profileLoading");
  const content = document.getElementById("profileContent");
  
  // Helper pour set textContent safely
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  
  // Helper pour set src safely
  const setSrc = (id, src) => {
    const el = document.getElementById(id);
    if (el) el.src = src;
  };

  if (status) status.style.display = "block";
  if (content) content.style.display = "none";

  const profile = await fetchMyProfile();

  if (!profile) {
    if (status) {
      status.className = "error";
      status.textContent = "❌ Impossible de charger ton profil";
    }
    return;
  }

  // Cache le profil pour le modal
  window.__OZ_CURRENT_PROFILE__ = profile;

  // Récupère les stats
  const favCount = await getFavCount();
  const watchedCount = await getWatchedCount();
  
  // Calculs XP et Niveau
  const xpVal = Number(profile.xp || 0);
  const currentLevel = Math.floor(xpVal / 100) + 1;
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = xpVal - xpForCurrentLevel;
  const xpNeededForNext = 100;
  const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;
  const xpRemaining = xpNeededForNext - xpInCurrentLevel;

  // Avatar Robohash
  const avatarUrl = profile.avatar_url || getAvatarUrl(currentUser.id, profile.username);
  setSrc("profileAvatar", avatarUrl);
  
  // Infos de base
  setText("profileUsername", profile.username || "Otaku");
  setText("profileEmail", currentUser.email || "");
  setText("profileRankBadge", profile.rank || "🌱 Rookie");
  
  // Stats
  setText("statXP", xpVal);
  setText("statLevel", currentLevel);
  setText("statStreak", profile.streak_count || 0);
  
  // Barre XP
  setText("xpProgressText", `${xpInCurrentLevel} / ${xpNeededForNext} XP`);
  const progressBar = document.getElementById("xpProgressBar");
  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  setText("xpNextLevel", `Encore ${xpRemaining} XP pour niveau ${currentLevel + 1}`);
  
  // Bio
  if (profile.bio) {
    const bioSection = document.getElementById("profileBioSection");
    if (bioSection) bioSection.style.display = "block";
    setText("profileBioText", profile.bio);
  }
  
  // Compteurs actions
  setText("actionFavs", favCount);
  const upcoming = getUpcomingSessions().length;
  setText("actionCalendar", upcoming);

  // Succès
  await refreshAchievements(profile);

  // Affiche le contenu
  if (status) status.style.display = "none";
  if (content) content.style.display = "block";
}


// ===== XP & Ranking Functions =====
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

function rankClassFromRank(rankLabel) {
  const t = String(rankLabel || "").toLowerCase();
  if (t.includes("légende") || t.includes("legende") || t.includes("kage")) return "rank-kage";
  if (t.includes("elite") || t.includes("otaku confirmé") || t.includes("otaku confirme")) return "rank-otaku";
  if (t.includes("senpai") || t.includes("expérimenté") || t.includes("experimente")) return "rank-senpai";
  return "rank-genin"; // Rookie, débutant, etc.
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
  if (getPath() === "/profil") {
    wireProfilePage();
  }
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

  function medal(i) {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  }

  async function load() {
    renderLoading();

    // Utiliser directement la table profiles au lieu de la RPC
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, xp, rank, avatar_url")
      .order("xp", { ascending: false })
      .limit(50);

    if (error) {
      if (box) box.innerHTML = `<div class="small">❌ ${error.message}</div>`;
      return;
    }

    if (!data || !data.length) return renderEmpty();

    const myId = currentUser?.id || null;

    const rows = data.map((u, i) => {
      const me = myId && u.id === myId;
      const avatarUrl = u.avatar_url || getAvatarUrl(u.id, u.username);
      
      return `
        <div class="card ranking-card" style="padding:10px; margin-bottom:8px; ${me ? "border:1px solid rgba(255,64,129,.55)" : ""}" data-user-id="${u.id}">
          <div class="row" style="align-items:center;margin:0;gap:12px">
            <div style="font-weight:900;font-size:20px;width:40px;text-align:center">${medal(i)}</div>
            <img src="${avatarUrl}" alt="${escapeHtml(u.username)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">
            <div style="flex:1">
              <div style="font-weight:800">${escapeHtml(u.username || "Otaku")}${me ? " <span class='small'>(toi)</span>" : ""}</div>
              <div class="small" style="opacity:.9">
                <span class="badge-oz r-rare">${escapeHtml(u.rank || "Rookie")}</span>
                <span>⭐ ${u.xp ?? 0} XP</span>
              </div>
            </div>
            ${!me ? `<button class="btn ghost small view-profile-btn" data-user-id="${u.id}">Voir</button>` : ''}
          </div>
        </div>
      `;
    }).join("");

    if (box) box.innerHTML = rows;

    // Ajouter les événements pour voir les profils
    box.querySelectorAll(".ranking-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("view-profile-btn") && !e.target.closest(".view-profile-btn")) {
          const userId = card.dataset.userId;
          if (userId !== myId) {
            location.hash = `#/user/${userId}`;
          }
        }
      });
    });

    box.querySelectorAll(".view-profile-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.dataset.userId;
        location.hash = `#/user/${userId}`;
      });
    });
  }

  btn?.addEventListener("click", load);
  await refreshSession();
  load();
}

async function getWatchedCount() {
  try {
    if (watchedCache) return Object.keys(watchedCache).length;
    await refreshWatchedCache(true);
    return Object.keys(watchedCache || {}).length;
  } catch (e) {
    console.warn("getWatchedCount:", e?.message);
    return 0;
  }
}

// ===== Quiz Functions =====
function isQuizEventActive() {
  try {
    const today = new Date();
    const start = new Date(`${QUIZ_EVENT.start}T00:00:00`);
    const end = new Date(`${QUIZ_EVENT.end}T00:00:00`);
    return today >= start && today < end;
  } catch {
    return false;
  }
}

async function getTodayQuizParticipants() {
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
  const qs = location.hash.split("?")[1] || "";
  const bankFromUrl = new URLSearchParams(qs).get("bank");
  if (bankFromUrl && QUIZ_BANKS[bankFromUrl]) {
    currentQuizBank = bankFromUrl;
  }

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
      .map((c, i) => `<button class="chip" data-choice="${i}" style="text-align:left">${c}</button>`)
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

  loadQuizBank(currentQuizBank).then(async () => {
    const select = document.getElementById("quizBankSelect");
    if (select) select.value = currentQuizBank;

    const label = select?.options?.[select.selectedIndex]?.text || "Générale";
    const nameEl = document.getElementById("currentBankName");
    if (nameEl) nameEl.textContent = label;

    if (isQuizEventActive()) {
      const n = await getTodayQuizParticipants();
      const el = document.getElementById("quizEventCount");
      if (el) el.textContent = (n == null) ? "" : `👥 ${n} joueur(s) ont participé aujourd'hui`;
    }
  });
  
  document.getElementById("quizLoadBank")?.addEventListener("click", async () => {
    const select = document.getElementById("quizBankSelect");
    let bankName = select.value;

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

  if (getPath() === "/profil") {
    wireProfilePage();
  }

  return { ok:true, xp };
}

// ===== Mood System Functions =====
const MOOD_KEYWORDS = {
  sad_beautiful: [["triste", 3], ["pleurer", 3], ["larmes", 3], ["deprime", 2], ["déprime", 2], ["émouvant", 3], ["touchant", 3], ["mélancolie", 2], ["nostalgie", 2], ["drama", 2], ["tragique", 2]],
  chill: [["calme", 3], ["chill", 3], ["relax", 3], ["détente", 3], ["apaisant", 3], ["feelgood", 2], ["feel good", 2], ["cozy", 2], ["zen", 2], ["repos", 2], ["tranquille", 2], ["sliceoflife", 2], ["slice of life", 2]],
  hype: [["action", 3], ["combat", 3], ["baston", 2], ["hype", 3], ["motivation", 2], ["épique", 2], ["shonen", 2], ["intense", 2], ["adrénaline", 2], ["sport", 2], ["tournoi", 2]],
  mind: [["mystère", 3], ["mystere", 3], ["enquête", 2], ["enquete", 2], ["thriller", 3], ["psychologique", 3], ["twist", 2], ["plot", 1], ["mind", 2], ["cerveau", 1], ["sombre", 1], ["intelligent", 2], ["sci-fi", 2], ["science fiction", 2]],
  romance_soft: [["romance", 3], ["amour", 3], ["couple", 2], ["relation", 2], ["crush", 2], ["mignon", 2], ["cute", 2], ["shojo", 2], ["shoujo", 2], ["coeur", 2], ["cœur", 2]]
};

const NEGATIONS = ["pas", "sans", "évite", "evite", "non", "no"];
const MOOD_UNKNOWN_KEY = "oz_mood_unknown_v1";
const MOOD_CUSTOM_KEY = "oz_mood_custom_keywords_v1";

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOf(text) {
  const t = normalizeText(text);
  const clipped = t.slice(0, 220);
  return clipped.split(" ").filter(Boolean);
}

function softIncludes(hay, needle) {
  if (!needle) return false;
  if (hay.includes(needle)) return true;

  if (needle.length >= 6) {
    const nv = needle.replace(/[aeiouy]/g, "");
    const hv = hay.replace(/[aeiouy]/g, "");
    if (nv && hv.includes(nv)) return true;
  }
  return false;
}

function detectMoodsFromText(text) {
  const raw = String(text || "");
  const norm = normalizeText(raw);
  const toks = tokensOf(raw);

  function isNegated(keyword) {
    for (let i = 0; i < toks.length - 1; i++) {
      if (NEGATIONS.includes(toks[i]) && softIncludes(toks[i + 1], keyword.replace(/\s+/g, ""))) return true;
    }
    return false;
  }

  const scores = {};
  for (const moodId of Object.keys(MOOD_KEYWORDS)) scores[moodId] = 0;

  for (const moodId of Object.keys(MOOD_KEYWORDS)) {
    for (const [kw, w] of MOOD_KEYWORDS[moodId]) {
      const kwNorm = normalizeText(kw).replace(/\s+/g, " ");
      const kwCompact = kwNorm.replace(/\s+/g, "");

      const hit = softIncludes(norm.replace(/\s+/g, ""), kwCompact) || norm.includes(kwNorm);
      if (!hit) continue;

      if (isNegated(kwCompact)) {
        scores[moodId] -= (w + 2);
      } else {
        scores[moodId] += w;
      }
    }
  }

  const custom = loadMoodCustom();
  for (const moodId in custom) {
    const arr = custom[moodId] || [];
    for (const w of arr) {
      const ww = String(w || "").replace(/\s+/g, "");
      if (!ww) continue;
      if (softIncludes(norm.replace(/\s+/g, ""), ww)) {
        scores[moodId] = (scores[moodId] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, s]) => s > 0)
    .slice(0, 2)
    .map(([id, score]) => ({ id, score }));

  return { sorted, norm };
}

function loadMoodCustom() {
  try {
    return JSON.parse(localStorage.getItem(MOOD_CUSTOM_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMoodCustom(obj) {
  localStorage.setItem(MOOD_CUSTOM_KEY, JSON.stringify(obj || {}));
}

function learnKeywordFromText(moodId, text) {
  const custom = loadMoodCustom();
  custom[moodId] = custom[moodId] || [];

  const toks = tokensOf(text)
    .map(w => w.trim())
    .filter(w => w.length >= 4 && !NEGATIONS.includes(w));

  for (const w of toks) {
    if (!custom[moodId].includes(w)) custom[moodId].push(w);
  }

  custom[moodId] = custom[moodId].slice(-120);
  saveMoodCustom(custom);
}

function logUnknownMoodQuery(text) {
  const t = normalizeText(text);
  if (!t) return;
  try {
    const arr = JSON.parse(localStorage.getItem(MOOD_UNKNOWN_KEY) || "[]");
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

  function setExplain(t) {
    if (explain) explain.textContent = t;
  }

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
  try {
    unknown = JSON.parse(localStorage.getItem(MOOD_UNKNOWN_KEY) || "[]");
  } catch {}

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

      unknown.splice(idx, 1);
      localStorage.setItem(MOOD_UNKNOWN_KEY, JSON.stringify(unknown));

      showToast("✅ Appris !");
      wireMoodTrainer();
    });
  });
}

// ===== NEW: Calendar Page =====
async function renderCalendarPage() {
  const container = document.getElementById("calendarContainer");
  if (!container) return;

  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  
  const sessions = getUpcomingSessions(365); // All upcoming sessions
  
  container.innerHTML = `
    <div class="full-calendar">
      <div class="calendar-header">
        <h3>${today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
        <div class="calendar-nav">
          <button class="btn ghost small" id="prevMonth">←</button>
          <button class="btn ghost small" id="todayBtn">Aujourd'hui</button>
          <button class="btn ghost small" id="nextMonth">→</button>
        </div>
      </div>
      <div class="calendar-grid" id="calendarGrid"></div>
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-color today"></span>
          <span class="small">Aujourd'hui</span>
        </div>
        <div class="legend-item">
          <span class="legend-color has-session"></span>
          <span class="small">Séance planifiée</span>
        </div>
      </div>
    </div>
  `;
  
  renderCalendarGrid(today.getFullYear(), today.getMonth(), sessions);
  
  // Navigation
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    const currentDate = new Date(year, month - 1, 1);
    renderCalendarGrid(currentDate.getFullYear(), currentDate.getMonth(), sessions);
  });
  
  document.getElementById("nextMonth")?.addEventListener("click", () => {
    const currentDate = new Date(year, month + 1, 1);
    renderCalendarGrid(currentDate.getFullYear(), currentDate.getMonth(), sessions);
  });
  
  document.getElementById("todayBtn")?.addEventListener("click", () => {
    renderCalendarGrid(today.getFullYear(), today.getMonth(), sessions);
  });
}

function renderCalendarGrid(year, month, sessions) {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Week days header
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  let html = '<div class="calendar-weekdays">';
  weekDays.forEach(day => {
    html += `<div class="weekday">${day}</div>`;
  });
  html += '</div>';
  
  // Days grid
  html += '<div class="calendar-days-grid">';
  
  // Empty cells for days before the first day of the month
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday as first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Days of the month
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = isCurrentMonth && day === today.getDate();
    const hasSession = sessions.some(s => s.date === dateStr);
    
    const daySessions = sessions.filter(s => s.date === dateStr);
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${hasSession ? 'has-session' : ''}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        ${daySessions.length > 0 ? `
          <div class="day-sessions">
            ${daySessions.slice(0, 2).map(s => `
              <div class="day-session">${s.animeId ? `Anime #${s.animeId}` : 'Anime'}</div>
            `).join('')}
            ${daySessions.length > 2 ? `<div class="day-more">+${daySessions.length - 2}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  grid.innerHTML = html;
  
  // Add click events to days
  grid.querySelectorAll('.calendar-day[data-date]').forEach(day => {
    day.addEventListener('click', () => {
      const date = day.dataset.date;
      const daySessions = sessions.filter(s => s.date === date);
      
      if (daySessions.length > 0) {
        alert(`Séances pour le ${date}:\n${daySessions.map(s => `• ${s.note || 'Anime'} (Épisode ${s.episode})`).join('\n')}`);
      }
    });
  });
}

// ===== NEW: Recommendations Page =====
async function renderRecommendationsPage() {
  const container = document.getElementById("recommendationsContainer");
  if (!container) return;

  const recommendations = generateRecommendations();
  
  if (!recommendations.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">💡</div>
        <div class="empty-title">Pas encore de recommandations</div>
        <div class="empty-text">Ajoute des favoris et note des animes pour recevoir des suggestions personnalisées</div>
        <a href="#/anime" class="btn primary" style="margin-top:12px">Découvrir des animes</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="recommendations-page">
      <div class="recommendations-header">
        <h3>Nos suggestions pour toi</h3>
        <p class="small">Basé sur tes préférences et ton historique</p>
      </div>
      
      <div class="recommendation-filters">
        <button class="chip active" data-filter="all">Tout</button>
        <button class="chip" data-filter="similar">Similaires à tes favoris</button>
        <button class="chip" data-filter="trending">Tendances</button>
        <button class="chip" data-filter="hidden-gems">Pépites cachées</button>
      </div>
      
      <div class="recommendations-grid" id="recommendationsGrid">
        ${recommendations.map(rec => `
          <div class="recommendation-card large">
            <div class="rec-match">
              <span class="match-badge">${rec.match}% match</span>
            </div>
            <div class="rec-image">
              ${rec.img ? `<img src="${rec.img}" alt="${escapeHtml(rec.title)}" loading="lazy">` : ''}
            </div>
            <div class="rec-body">
              <div class="rec-title">${escapeHtml(rec.title)}</div>
              <div class="rec-reason">${escapeHtml(rec.reason)}</div>
              <div class="rec-stats">
                <span class="rec-stat"><i class="fas fa-star"></i> 8.5/10</span>
                <span class="rec-stat"><i class="fas fa-calendar"></i> 2019</span>
                <span class="rec-stat"><i class="fas fa-play-circle"></i> 24 épisodes</span>
              </div>
              <div class="rec-actions">
                <button class="btn primary" data-anime-id="${rec.id}">
                  <i class="fas fa-plus"></i> Ajouter à ma watchlist
                </button>
                <button class="btn ghost" data-anime-id="${rec.id}">
                  <i class="fas fa-info-circle"></i> Plus d'infos
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="recommendations-actions">
        <button class="btn" id="loadMoreRecs">
          <i class="fas fa-sync"></i> Voir plus de suggestions
        </button>
        <button class="btn ghost" id="customizeRecs">
          <i class="fas fa-sliders-h"></i> Personnaliser les recommandations
        </button>
      </div>
    </div>
  `;

  // Filter recommendations
  document.querySelectorAll('.recommendation-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.recommendation-filters .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      // In a real app, this would filter recommendations
      showToast(`Filtre: ${chip.textContent}`);
    });
  });

  // Recommendation actions
  document.querySelectorAll('.rec-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const animeId = btn.dataset.animeId;
      if (btn.classList.contains('primary')) {
        showToast("Ajouté à ta watchlist 📋");
      } else {
        location.hash = `#/anime/${animeId}`;
      }
    });
  });

  document.getElementById("loadMoreRecs")?.addEventListener('click', () => {
    showToast("Chargement de plus de suggestions...");
    // In a real app, this would load more recommendations
  });

  document.getElementById("customizeRecs")?.addEventListener('click', () => {
    alert("Personnalisation des recommandations - Fonctionnalité à venir!");
  });
}

// ===== Home Page Functions =====
function wireHomePage() {
  if (!isQuizEventActive()) return;

  getTodayQuizParticipants().then((n) => {
    const el = document.getElementById("homeEventCount");
    if (!el) return;
    el.textContent = (n == null) ? "" : `👥 ${n} joueur(s) aujourd'hui`;
  });
  // 🔥 Demande la permission notification (une seule fois)
  if (Notification.permission === 'default') {
    // Attendre 3 secondes pour pas spammer direct
    setTimeout(() => {
      requestNotificationPermission();
    }, 3000);
  }
  
  // Programme le rappel quiz
  scheduleQuizNotification();
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

function renderVersionBadge() {
  const el = document.getElementById("versionBadge");
  if (!el) return;
  el.textContent = "v" + OZ_VERSION;
}

async function renderPublicProfile(userId) {
  const status = document.getElementById("publicProfileStatus");
  const box = document.getElementById("publicProfileBox");
  const avatarEl = document.getElementById("publicAvatar");
  const usernameEl = document.getElementById("publicUsername");
  const badgesEl = document.getElementById("publicBadges");
  const grid = document.getElementById("publicCollectionGrid");
  // Ajouter la carte après le header du profil
  const cardContainer = document.createElement('div');
  cardContainer.id = 'otaku-card-container';
  cardContainer.style.marginBottom = '20px';
  
  // Insérer après le header du profil
  const profileBox = document.getElementById('publicProfileBox');
  if (profileBox && typeof OtakuIDCard !== 'undefined') {
    profileBox.insertBefore(cardContainer, profileBox.firstChild);
    await OtakuIDCard.init(userId);
  }
  try {
    // Récupère le profil public
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rank, xp, bio, created_at")
      .eq("id", userId)
      .single();
    
    if (profileError || !profile) {
      status.className = "error";
      status.textContent = "Profil non trouvé 😕";
      return;
    }
    
    // Récupère les statistiques
    const { data: stats } = await supabase
      .from("user_stats")
      .select("favorite_count, watched_count, quiz_count")
      .eq("user_id", userId)
      .single();
    
    // Récupère les favoris publics
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("anime_id, title, image_url, score, year, reason")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    // Affiche les infos
    usernameEl.textContent = profile.username || "Otaku mystère";
    
    // Avatar
    const avatarUrl = profile.avatar_url || getAvatarUrl(profile.id, profile.username);
    if (avatarEl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${profile.username}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`;
    }
    
    // Badges
    badgesEl.innerHTML = `
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <span class="rank-badge ${rankClassFromRank(profile.rank)}">
          <span class="rank-dot"></span> ${profile.rank || "🌱 Rookie"}
        </span>
        <span class="badge-oz r-rare">⭐ ${profile.xp || 0} XP</span>
        ${stats?.favorite_count ? `<span class="badge-oz r-common">❤️ ${stats.favorite_count} favoris</span>` : ''}
        ${stats?.watched_count ? `<span class="badge-oz r-common">👁️ ${stats.watched_count} vus</span>` : ''}
        ${stats?.quiz_count ? `<span class="badge-oz r-common">🧠 ${stats.quiz_count} quiz</span>` : ''}
      </div>
    `;
    
    // Affiche la collection
    if (!favorites || favorites.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1">
          <div class="empty-emoji">📭</div>
          <div class="empty-title">Collection vide</div>
          <div class="empty-text">Cet utilisateur n'a pas encore de favoris</div>
        </div>
      `;
    } else {
      grid.innerHTML = favorites.map(f => `
        <article class="card collection-card" data-id="${f.anime_id}">
          <div class="card-cover">
            ${f.image_url ? `<img src="${f.image_url}" alt="${escapeHtml(f.title)}" loading="lazy">` : ''}
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(f.title)}</div>
            <div class="card-meta">
              ${f.score ? `<span class="card-score">⭐ ${escapeHtml(f.score)}</span>` : ''}
              ${f.year ? `<span class="card-year">📅 ${escapeHtml(f.year)}</span>` : ''}
            </div>
            ${f.reason ? `
              <div class="card-reason">
                <div class="reason-label">Pourquoi :</div>
                <div class="reason-text">${escapeHtml(f.reason)}</div>
              </div>
            ` : ''}
          </div>
        </article>
      `).join("");
      
      // Rend les cartes cliquables
      grid.querySelectorAll(".collection-card").forEach(card => {
        card.addEventListener("click", () => {
          location.hash = `#/anime/${card.dataset.id}`;
        });
      });
    }
    
    // Affiche la bio si elle existe
    if (profile.bio) {
      badgesEl.innerHTML += `
        <div class="card" style="margin-top:12px;padding:12px">
          <div class="small" style="opacity:.8;margin-bottom:4px">📝 Bio</div>
          <div>${escapeHtml(profile.bio)}</div>
        </div>
      `;
    }
    
    // Affiche la date d'inscription
    if (profile.created_at) {
      const joinDate = new Date(profile.created_at).toLocaleDateString('fr-FR');
      badgesEl.innerHTML += `
        <div class="small" style="margin-top:8px;opacity:.7">
          Membre depuis ${joinDate}
        </div>
      `;
    }
    
    status.style.display = "none";
    box.style.display = "block";
    
  } catch (error) {
    console.error("Erreur profil public:", error);
    status.className = "error";
    status.textContent = "Erreur de chargement 😓";
  }
}

// ===== Public Profile Functions =====
async function renderPublicProfile(userId) {
  const status = document.getElementById("publicProfileStatus");
  const box = document.getElementById("publicProfileBox");
  const avatarEl = document.getElementById("publicAvatar");
  const usernameEl = document.getElementById("publicUsername");
  const badgesEl = document.getElementById("publicBadges");
  const grid = document.getElementById("publicCollectionGrid");
  
  try {
    // Récupère le profil public
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rank, xp, bio, created_at")
      .eq("id", userId)
      .single();
    
    if (profileError || !profile) {
      status.className = "error";
      status.textContent = "Profil non trouvé 😕";
      return;
    }
    
    // Récupère les statistiques (nombre de favoris, vus, quiz)
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", userId);
    
    const { data: watched, error: watchedError } = await supabase
      .from("watched")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", userId);
    
    const { data: quizLogs, error: quizError } = await supabase
      .from("daily_quiz_logs")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", userId);
    
    // Affiche les infos
    usernameEl.textContent = profile.username || "Otaku mystère";
    
    // Avatar
    const avatarUrl = profile.avatar_url || getAvatarUrl(profile.id, profile.username);
    if (avatarEl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${profile.username}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`;
    }
    
    // Badges
    badgesEl.innerHTML = `
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <span class="rank-badge ${rankClassFromRank(profile.rank)}">
          <span class="rank-dot"></span> ${profile.rank || "🌱 Rookie"}
        </span>
        <span class="badge-oz r-rare">⭐ ${profile.xp || 0} XP</span>
        ${favorites ? `<span class="badge-oz r-common">❤️ ${favorites.count || 0} favoris</span>` : ''}
        ${watched ? `<span class="badge-oz r-common">👁️ ${watched.count || 0} vus</span>` : ''}
        ${quizLogs ? `<span class="badge-oz r-common">🧠 ${quizLogs.count || 0} quiz</span>` : ''}
      </div>
    `;
    
    // Récupère les favoris pour la collection
    const { data: favoriteItems, error: favItemsError } = await supabase
      .from("favorites")
      .select("anime_id, title, image_url, score, year, reason")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    // Affiche la collection
    if (!favoriteItems || favoriteItems.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1">
          <div class="empty-emoji">📭</div>
          <div class="empty-title">Collection vide</div>
          <div class="empty-text">Cet utilisateur n'a pas encore de favoris</div>
        </div>
      `;
    } else {
      grid.innerHTML = favoriteItems.map(f => `
        <article class="card collection-card" data-id="${f.anime_id}">
          <div class="card-cover">
            ${f.image_url ? `<img src="${f.image_url}" alt="${escapeHtml(f.title)}" loading="lazy">` : ''}
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(f.title)}</div>
            <div class="card-meta">
              ${f.score ? `<span class="card-score">⭐ ${escapeHtml(f.score)}</span>` : ''}
              ${f.year ? `<span class="card-year">📅 ${escapeHtml(f.year)}</span>` : ''}
            </div>
            ${f.reason ? `
              <div class="card-reason">
                <div class="reason-label">Pourquoi :</div>
                <div class="reason-text">${escapeHtml(f.reason)}</div>
              </div>
            ` : ''}
          </div>
        </article>
      `).join("");
      
      // Rend les cartes cliquables
      grid.querySelectorAll(".collection-card").forEach(card => {
        card.addEventListener("click", () => {
          location.hash = `#/anime/${card.dataset.id}`;
        });
      });
    }
    
    // Affiche la bio si elle existe
    if (profile.bio) {
      badgesEl.innerHTML += `
        <div class="card" style="margin-top:12px;padding:12px">
          <div class="small" style="opacity:.8;margin-bottom:4px">📝 Bio</div>
          <div>${escapeHtml(profile.bio)}</div>
        </div>
      `;
    }
    
    // Affiche la date d'inscription
    if (profile.created_at) {
      const joinDate = new Date(profile.created_at).toLocaleDateString('fr-FR');
      badgesEl.innerHTML += `
        <div class="small" style="margin-top:8px;opacity:.7">
          Membre depuis ${joinDate}
        </div>
      `;
    }
    
    status.style.display = "none";
    box.style.display = "block";
    
  } catch (error) {
    console.error("Erreur profil public:", error);
    status.className = "error";
    status.textContent = "Erreur de chargement 😓";
  }
}
// ===== Initialization =====
async function init() {
  await refreshSession();
  
  // 🔥 Récupération du chemin une seule fois
  const path = getPath();

  // Routes protégées (redirection vers login si non connecté)
  const protectedPaths = ['/profil', '/collection', '/certificat', '/certificat/create', '/certificat/view'];
  if (protectedPaths.some(p => path.startsWith(p)) && !currentUser) {
    location.hash = '#/login';
    return;
  }

  // Redirection vers home si pas de hash
  if (!location.hash || location.hash === '#') {
    location.hash = '#/home';
  }

  // Chargement des caches (synchrones)
  ratingsCache = loadRatings();
  watchCalendarCache = loadCalendar();
  recommendationsCache = null;

  // Chargement de la banque de quiz (asynchrone)
  await loadQuizBank();

  // Écoute des changements d'authentification
  supabase.auth.onAuthStateChange(async (event) => {
    await refreshSession();
    await awardDailyXPIfNeeded();
    await refreshFavCache();
    await migrateLocalFavsToSupabaseOnce();
    await refreshFavCache();
    await updateAuthUIAndFavs();
    syncUI();
  });

  // 🔥 Vérification supplémentaire pour /favoris (non inclus dans protectedPaths)
  if (!currentUser && (path === "/profil" || path === "/favoris")) {
    showToast("Connecte-toi pour accéder à cette page 🔐");
    location.hash = "#/login";
    return; // ← important pour arrêter l'exécution
  }

  render();
}

// ===== Event Listeners =====
window.addEventListener("hashchange", () => render());

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  init();
});

renderVersionBadge();

// ===== AniList migration layer (kept as is) =====
/* ... (keep your existing AniList code here, it's already in your file) ... */
// ===== CERTIFICATE PAGES =====

async function wireCertificatePage() {
  console.log("🔍 Debug currentUser:", {
    global: currentUser?.id || "null",
    window: window.currentUser?.id || "null"
  });
  
  const container = document.getElementById('certificateContainer');
  
  if (!currentUser) {  // ← Utilise la variable globale directement
    showToast('🔐 Connecte-toi pour voir ton certificat');
    location.hash = '#/login';
    return;
  }
  // Vérifie si certificat existe
  const hasCert = await CertificateManager.hasCertificate(currentUser.id);
  
  if (hasCert) {
    location.hash = '#/certificat/view';
  } else {
    container.innerHTML = CertificateCard.renderEmpty();
  }
}


async function wireCertificateCreatePage() {
  const container = document.getElementById('certificateFormContainer');
  
  // 🔥 FORCER le rafraîchissement de la session ici aussi
  await refreshSession();
  
  console.log("🔍 wireCertificateCreatePage - currentUser:", currentUser?.id);
  
  if (!currentUser) {
    showToast('🔐 Session expirée, reconnecte-toi');
    location.hash = '#/login';
    return;
  }

  // Vérifie si existe déjà
  const hasCert = await CertificateManager.hasCertificate(currentUser.id);
  if (hasCert) {
    showToast('Tu as déjà un certificat !');
    location.hash = '#/certificat/view';
    return;
  }

  // Récupère données profil pour pré-remplir
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', currentUser.id)
    .single();

  container.innerHTML = CertificateCard.renderForm({
    username: profile?.username || currentUser.email?.split('@')[0] || 'Otaku'
  });
}


async function wireCertificateViewPage() {
  const container = document.getElementById('certificateViewContainer');

  if (!currentUser) {
    location.hash = '#/login';
    return;
  }

  // Récupère le certificat
  const cert = await CertificateManager.getCertificate(currentUser.id);
  
  if (!cert) {
    container.innerHTML = CertificateCard.renderEmpty();
    return;
  }

  // Met à jour les stats en temps réel
  const stats = await CertificateManager.getUserStats(currentUser.id);
  const updatedCert = { ...cert, ...stats };

  container.innerHTML = CertificateCard.render(updatedCert);
}

async function wireVerifyPage() {
  const container = document.getElementById('verifyContainer');
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const serial = params.get('id');

  if (!serial) {
    container.innerHTML = `
      <div class="cert-form-container">
        <h3>Vérifier un certificat</h3>
        <div class="form-group">
          <label>Numéro de série</label>
          <input type="text" id="verifyInput" placeholder="OTK-2024-XXXX-XXXX">
        </div>
        <button class="cert-btn cert-btn-primary" onclick="verifyCertificate()" style="width: 100%;">
          Vérifier
        </button>
        <div id="verifyResult" style="margin-top: 20px;"></div>
      </div>
    `;
    return;
  }

  // Vérification directe par URL
  const result = await CertificateManager.verifyCertificate(serial);
  
  if (result.valid) {
    const cert = result.certificate;
    container.innerHTML = `
      <div class="cert-form-container" style="border-color: #2ecc71;">
        <div style="text-align: center; font-size: 48px; margin-bottom: 16px;">✅</div>
        <h3 style="text-align: center; color: #2ecc71;">Certificat Vérifié</h3>
        <p style="text-align: center; color: rgba(255,255,255,0.7);">
          Ce certificat est authentique et a été émis par OtakuZone
        </p>
        <div style="margin-top: 20px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px;">
          <p><strong>Numéro:</strong> ${cert.serial_number}</p>
          <p><strong>Membre:</strong> ${cert.username}</p>
          <p><strong>Rang:</strong> ${cert.rank}</p>
          <p><strong>Émis le:</strong> ${new Date(cert.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="cert-form-container" style="border-color: #e74c3c;">
        <div style="text-align: center; font-size: 48px; margin-bottom: 16px;">❌</div>
        <h3 style="text-align: center; color: #e74c3c;">Certificat Invalide</h3>
        <p style="text-align: center; color: rgba(255,255,255,0.7);">
          Ce numéro de série ne correspond à aucun certificat enregistré
        </p>
      </div>
    `;
  }
}

// Fonction globale pour vérification manuelle
window.verifyCertificate = async () => {
  const input = document.getElementById('verifyInput')?.value?.trim();
  if (!input) return;
  
  const result = await CertificateManager.verifyCertificate(input);
  const resultDiv = document.getElementById('verifyResult');
  
  if (result.valid) {
    resultDiv.innerHTML = `<p style="color: #2ecc71; text-align: center;">✅ Certificat valide - ${result.certificate.username}</p>`;
  } else {
    resultDiv.innerHTML = `<p style="color: #e74c3c; text-align: center;">❌ ${result.message}</p>`;
  }
};

console.log("✅ OtakuZone v" + OZ_VERSION + " chargé avec succès !");