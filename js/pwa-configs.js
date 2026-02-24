// =====================
// OtakuZone PWA CONFIG
// Production • Discret • Non intrusif
// =====================

(() => {
  let deferredPrompt = null;
  
  // Déclarer PWAConfig dans window
  window.PWAConfig = window.PWAConfig || {};

  const $ = (id) => document.getElementById(id);

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  /* ---------- Utils ---------- */
  function hide(el) {
    if (el) el.style.display = "none";
  }
  
  function show(el, display = "inline-flex") {
    if (el) el.style.display = display;
  }

  function toast(msg, ms = 2600) {
    if (typeof window.showToast === "function") {
      return window.showToast(msg);
    }

    let t = document.getElementById("ozToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ozToast";
      t.style.cssText = `
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 16px;
        z-index: 99999;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(20, 20, 28, 0.95);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        font: 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        text-align: center;
        backdrop-filter: blur(10px);
      `;
      document.body.appendChild(t);
    }

    t.textContent = msg;
    show(t, "block");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => hide(t), ms);
  }

  /* ---------- Banner (1 fois / jour max) ---------- */
  function dismissedToday() {
    const d = new Date().toISOString().slice(0, 10);
    return localStorage.getItem("oz_install_dismissed") === d;
  }

  function markDismissed() {
    const d = new Date().toISOString().slice(0, 10);
    localStorage.setItem("oz_install_dismissed", d);
  }

  function ensureBannerStyles() {
    if (document.getElementById("ozPwaStyles")) return;

    const st = document.createElement("style");
    st.id = "ozPwaStyles";
    st.textContent = `
      .oz-pwa-banner {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 99998;
        padding: 12px;
        border-radius: 18px;
        background: rgba(20, 20, 28, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.14);
        backdrop-filter: blur(10px);
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .oz-pwa-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      
      .oz-pwa-title {
        font: 600 14px system-ui;
        color: #fff;
        margin: 0;
      }
      
      .oz-pwa-desc {
        font: 12px system-ui;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 4px;
        margin-bottom: 0;
      }
      
      .oz-pwa-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      
      .oz-pwa-actions button {
        border: 0;
        border-radius: 14px;
        padding: 9px 12px;
        font: 600 12px system-ui;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      
      .oz-pwa-actions button:hover {
        transform: translateY(-1px);
      }
      
      .oz-pwa-actions button:active {
        transform: translateY(0);
      }
      
      .oz-pwa-primary {
        background: linear-gradient(135deg, #ff4081, #8f00ff);
        color: #fff;
      }
      
      .oz-pwa-ghost {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
    `;
    document.head.appendChild(st);
  }

  function removeBanner() {
    const banner = document.getElementById("ozPwaBanner");
    if (banner) {
      banner.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => banner.remove(), 300);
    }
  }

  function showBanner(canPrompt) {
    if (isStandalone() || dismissedToday()) return;

    ensureBannerStyles();
    removeBanner();

    const b = document.createElement("div");
    b.id = "ozPwaBanner";
    b.className = "oz-pwa-banner";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Suggestion d'installation");

    b.innerHTML = `
      <div class="oz-pwa-row">
        <div>
          <div class="oz-pwa-title">📱 Installer OtakuZone</div>
          <div class="oz-pwa-desc">
            ${canPrompt
              ? "Ajoute l'app à ton écran d'accueil pour un accès rapide."
              : "Pour installer : menu ⋮ → Ajouter à l'écran d'accueil"
            }
          </div>
        </div>
        <div class="oz-pwa-actions">
          <button id="ozInstallNow" class="oz-pwa-primary" aria-label="Installer maintenant">
            Installer
          </button>
          <button id="ozInstallLater" class="oz-pwa-ghost" aria-label="Fermer et rappeler plus tard">
            Plus tard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(b);

    // Gestionnaire pour "Plus tard"
    $("ozInstallLater")?.addEventListener("click", () => {
      markDismissed();
      removeBanner();
      toast("Rappel dans 24h 👍");
    });

    // Gestionnaire pour "Installer"
    $("ozInstallNow")?.addEventListener("click", async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const res = await deferredPrompt.userChoice;
          deferredPrompt = null;

          if (res?.outcome === "accepted") {
            toast("✅ Installation lancée !");
          } else {
            toast("ℹ️ Installation annulée");
          }
        } catch (error) {
          console.warn("[PWA] Erreur d'installation:", error);
          toast("📌 Menu ⋮ → Ajouter à l'écran d'accueil");
        }
      } else {
        toast("📌 Ouvrez le menu ⋮ → Ajouter à l'écran d'accueil");
      }

      markDismissed();
      removeBanner();
    });

    // Fermer automatiquement après 15 secondes
    setTimeout(() => {
      if (document.getElementById("ozPwaBanner")) {
        markDismissed();
        removeBanner();
      }
    }, 15000);
  }

  /* ---------- Service Worker ---------- */
  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("[PWA] Service Worker non supporté");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none"
      });

      console.log("[PWA] Service Worker enregistré:", registration.scope);

      // Écouter les mises à jour
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast("Mise à jour disponible! Recharger pour appliquer 🔄");
            }
          });
        }
      });

      // Forcer la mise à jour au chargement
      await registration.update();

      return registration;
    } catch (error) {
      console.error("[PWA] Erreur d'enregistrement SW:", error);
      return null;
    }
  }

  /* ---------- Installation aide ---------- */
  function installOrHelp() {
    if (isStandalone()) {
      toast("✅ App déjà installée");
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      showBanner(false);
    }
  }

  /* ---------- Buttons ---------- */
  function bindButtons() {
    ["homeInstallBtn", "install-pwa"].forEach((id) => {
      const btn = $(id);
      if (!btn || btn.dataset.bound) return;

      btn.dataset.bound = "1";
      btn.addEventListener("click", installOrHelp);
    });
  }

  function updateUI() {
    const isAppInstalled = isStandalone();
    
    // Cacher les boutons d'installation si déjà installé
    if (isAppInstalled) {
      hide($("homeInstallBtn"));
      hide($("install-pwa"));
      removeBanner();
    } else {
      // Afficher conditionnellement sur mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        show($("homeInstallBtn"));
        show($("install-pwa"));
      } else {
        hide($("homeInstallBtn"));
        hide($("install-pwa"));
      }
    }
  }

  /* ---------- Export des fonctions ---------- */
  window.PWAConfig.registerServiceWorker = registerServiceWorker;
  window.PWAConfig.installOrHelp = installOrHelp;
  window.PWAConfig.isStandalone = isStandalone;
  window.PWAConfig.showToast = toast;

  /* ---------- Events ---------- */
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("[PWA] Installation disponible");
    updateUI();
    
    // Afficher la bannière automatiquement après 3 secondes
    setTimeout(() => showBanner(true), 3000);
  });

  window.addEventListener("appinstalled", () => {
    console.log("[PWA] App installée avec succès");
    deferredPrompt = null;
    toast("🎉 OtakuZone installée !");
    updateUI();
    
    // Track installation
    if (typeof gtag === "function") {
      gtag("event", "pwa_installed");
    }
  });

  // Détection de mode standalone
  window.matchMedia("(display-mode: standalone)").addEventListener("change", (e) => {
    console.log("[PWA] Display mode changed:", e.matches);
    updateUI();
  });

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[PWA] Initialisation...");
    bindButtons();
    updateUI();
    
    // Vérifier si c'est une première visite
    const firstVisit = !localStorage.getItem("oz_first_visit");
    if (firstVisit) {
      localStorage.setItem("oz_first_visit", "1");
      // Afficher la bannière après 5 secondes sur première visite
      setTimeout(() => showBanner(true), 5000);
    }
  });

  // Vérification périodique des mises à jour
  setInterval(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CHECK_UPDATE" });
    }
  }, 3600000); // Toutes les heures
})();