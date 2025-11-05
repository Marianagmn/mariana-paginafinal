 (function () {
  'use strict';

  // Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Smooth scroll for internal anchors
  $$("a[href^='#']").forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = anchor.getAttribute('href');
      const destino = href && href.startsWith('#') ? $(href) : null;
      if (destino) {
        e.preventDefault();
        destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Elements reused by scroll handler
  const btnTop = document.getElementById('btnTop');
  const progressBar = document.getElementById('progressBar');
  const navbar = document.querySelector('.navbar');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  // Back to top button (click only). Visibility is handled by unified scroll handler below.
  if (btnTop) {
    btnTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Unified, performant scroll handler (rAF + passive listener)
  let _ticking = false;
  function _onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (btnTop) btnTop.classList.toggle('show', scrollY > 400);
    if (navbar) navbar.classList.toggle('scrolled', scrollY > 50);
    if (progressBar) {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
    // Highlight current section's nav link (sync with progress bar)
    try {
      const offset = 80; // match header height / scroll offset
      let currentId = null;
      for (const sec of sections) {
        const top = sec.offsetTop - offset;
        const bottom = top + sec.offsetHeight;
        if (scrollY >= top && scrollY < bottom) {
          currentId = sec.id;
          break;
        }
      }
      if (currentId) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${currentId}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    } catch (e) { /* no-op */ }
    _ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!_ticking) {
      window.requestAnimationFrame(_onScroll);
      _ticking = true;
    }
  }, { passive: true });

  // Animaciones al hacer scroll (productos, nosotros)
  const animatedItems = document.querySelectorAll('.product-card, #nosotros img');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  animatedItems.forEach(item => observer.observe(item));
} else {
  // fallback: add classes immediately
  animatedItems.forEach(item => item.classList.add('animate__animated', 'animate__fadeInUp'));
}

// Filtro de búsqueda de productos
// (Las variables ya están declaradas más abajo para la búsqueda avanzada)

// --- BÚSQUEDA AVANZADA CON MODAL Y FILTRO POR CATEGORÍA ---
const searchBtn = document.getElementById('searchBtn');
const productCards = document.querySelectorAll('.product-card');
const productosSection = document.getElementById('productos');

// Crear modal dinámico para resultados
let modal = document.getElementById('searchModal');
let searchInput; // Se inicializará cuando se cree el modal
if (!modal) {
  modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.7)';
  modal.style.zIndex = '99999';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div style="max-width:1100px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);padding:2rem;position:relative;">
      <button id="closeSearchModal" style="position:absolute;top:18px;right:18px;font-size:1.7rem;background:none;border:none;color:#0077cc;cursor:pointer;" aria-label="Cerrar">&times;</button>
      <h2 class="text-center mb-4 section-title">Resultados de búsqueda</h2>
      <div class="mb-4">
        <div class="row g-3 justify-content-center align-items-end">
          <div class="col-md-6">
            <input type="search" id="searchInput" class="form-control" placeholder="Buscar productos..." aria-label="Buscar productos">
          </div>
          <div class="col-md-4">
            <select id="categoryFilter" class="form-select">
              <option value="">Todas las categorías</option>
            </select>
          </div>
        </div>
      </div>
      <div id="modalResultsGrid" class="row g-4"></div>
      <div class="text-center mt-4">
        <button id="backToAllProducts" class="btn btn-secondary">Volver a todos los productos</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Clasificación de productos por categoría (sincronizado con titles en index.html)
const productCategories = {
  'Transfer Factor Plus': 'Inmunidad',
  'RioVida Stix': 'Antioxidantes',
  'Chewable': 'Infantil',
  'RioVida Burst': 'Antioxidantes',
  '4Life Collagen': 'Belleza',
  'TF-Boost': 'Inmunidad',
  'BelleVie': 'Bienestar',
  'Vistari': 'Inmunidad',
  'Glucoach': 'Metabolismo',
  'Reflexion': 'Bienestar',
  'BioEFA': 'Metabolismo',
  'Glutamine Prime': 'Inmunidad',
  'Renuvo': 'Bienestar',
  'NutraStart': 'Metabolismo',
  'Transfer Factor Tri-Factor®': 'Inmunidad',
  'BCV+': 'Bienestar',
  'Targeted Transfer Factor: Oral Spray': 'Inmunidad',
};

// Obtener categorías únicas
const uniqueCategories = Array.from(new Set(Object.values(productCategories)));
const categoryFilter = modal.querySelector('#categoryFilter');
uniqueCategories.forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categoryFilter.appendChild(opt);
});

function getProductData(card) {
  const title = card.querySelector('.card-title').textContent.trim();
  const text = card.querySelector('.card-text').textContent.trim();
  const normalizedTitle = normalizeText(title);
  const category = productCategories[title] || productCategories[normalizedTitle] || 'Otros';
  return { title, text, category, card };
}

// Normalizar texto para búsqueda y mapeo: quitar signos, ®, +, acentos y pasar a minúsculas
function normalizeText(str) {
  if (!str) return '';
  // pasar a minúsculas
  let s = str.toLowerCase();
  // reemplazar caracteres diacríticos (acentos)
  s = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  // quitar el símbolo de registro y marcas comunes
  s = s.replace(/®|™/g, '');
  // quitar signos + y otros símbolos no alfanuméricos (permitir espacios)
  s = s.replace(/[^a-z0-9\s]/g, '');
  // colapsar espacios múltiples
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function showSearchModal(results) {
  const grid = modal.querySelector('#modalResultsGrid');
  grid.innerHTML = '';
  if (results.length === 0) {
    grid.innerHTML = '<p class="text-center">No se encontraron productos que coincidan con tu búsqueda.</p>';
    return;
  }
  // Organizar en filas de 3
  for (let i = 0; i < results.length; i += 3) {
    const row = document.createElement('div');
    row.className = 'row g-4';
    for (let j = i; j < i + 3 && j < results.length; j++) {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      col.appendChild(results[j].card.cloneNode(true));
      row.appendChild(col);
    }
    grid.appendChild(row);
  }
}

function filterProductsAdvanced() {
  const query = normalizeText(searchInput.value || '');
  const selectedCategory = categoryFilter.value;
  let results = [];
  productCards.forEach(card => {
    const data = getProductData(card);
    // comparar usando texto normalizado para evitar problemas con acentos y símbolos
    const normalizedTitle = normalizeText(data.title);
    const normalizedText = normalizeText(data.text);
    const matchesQuery = query === '' || normalizedTitle.includes(query) || normalizedText.includes(query);
    const matchesCategory = !selectedCategory || data.category === selectedCategory;
    if ((query === '' || matchesQuery) && matchesCategory) {
      results.push(data);
    }
  });
  showSearchModal(results);
  modal.style.display = 'block';
  productosSection.style.display = 'none';
}

// Función para inicializar los event listeners del buscador
function initializeSearchListeners() {
  searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        filterProductsAdvanced();
      }
    });

    // Debounce helper (local, small and safe)
    function debounce(fn, wait = 300) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    // Live search (debounced) - only trigger search when term >= 2 chars
    const debouncedFilter = debounce(() => {
      if (searchInput.value.trim().length >= 2) filterProductsAdvanced();
    }, 300);
    searchInput.addEventListener('input', debouncedFilter);
  }
}

// Cuando el usuario hace clic en el botón de búsqueda, mostrar el modal
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    productosSection.style.display = 'none';
    // Inicializar listeners si no se ha hecho
    if (!searchInput) {
      initializeSearchListeners();
    }
    // Enfocar el input de búsqueda
    if (searchInput) {
      searchInput.focus();
    }
  });
}

categoryFilter.addEventListener('change', filterProductsAdvanced);

modal.querySelector('#closeSearchModal').addEventListener('click', () => {
  modal.style.display = 'none';
  productosSection.style.display = 'block';
});

modal.querySelector('#backToAllProducts').addEventListener('click', () => {
  searchInput.value = '';
  categoryFilter.value = '';
  modal.style.display = 'none';
  productosSection.style.display = 'block';
  window.scrollTo({ top: productosSection.offsetTop, behavior: 'smooth' });
});

// Barra de progreso: ahora manejada por el handler unificado (requestAnimationFrame)

// Inicializar ScrollSpy manualmente para asegurar que el enlace activo se actualice correctamente
window.addEventListener('load', () => {
  try {
    const navEl = document.getElementById('navbarNav');
    if (navEl && typeof bootstrap !== 'undefined') {
      // eslint-disable-next-line no-undef
      new bootstrap.ScrollSpy(document.body, { target: '#navbarNav', offset: 70 });
    }
  } catch (err) {
    // no bloquear si falla
    console.warn('ScrollSpy init falló:', err);
  }
});

// Loader
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
});

// Manejo del banner de cookies
const cookieBanner = document.getElementById('cookieBanner');
const acceptCookiesBtn = document.getElementById('acceptCookies');
const openCookieSettingsBtn = document.getElementById('openCookieSettings');
const saveCookiePreferencesBtn = document.getElementById('saveCookiePreferences');
const cookieSettingsModal = document.getElementById('cookieSettingsModal');
const playVideoBtn = document.getElementById('playVideoBtn');
const videoContainer = document.getElementById('videoContainer');
function hideCookieBanner() {
  if (cookieBanner) cookieBanner.style.display = 'none';
}
// Mostrar banner si no hay consentimiento en localStorage
if (cookieBanner) {
  const consent = localStorage.getItem('cookies_accepted');
  if (consent === 'yes') {
    hideCookieBanner();
  } else {
    cookieBanner.style.display = 'block';
  }
}
if (acceptCookiesBtn) {
  acceptCookiesBtn.addEventListener('click', () => {
    // Aceptar todo: marcar todas las categorías como 'yes'
    localStorage.setItem('cookies_necessary', 'yes');
    localStorage.setItem('cookies_preferences', 'yes');
    localStorage.setItem('cookies_analytics', 'yes');
    localStorage.setItem('cookies_marketing', 'yes');
    localStorage.setItem('cookies_media', 'yes');
    localStorage.setItem('cookies_accepted', 'yes');
    hideCookieBanner();
    // Si se aceptan medios, cargar el iframe automáticamente si el usuario abrió el modal de video
    loadVideoIfAllowed();
  });
}
// Abrir modal de configuración
if (openCookieSettingsBtn) {
  openCookieSettingsBtn.addEventListener('click', () => {
    // uso de bootstrap modal
    const modal = new bootstrap.Modal(document.getElementById('cookieSettingsModal'));
    // inicializar checkboxes según localStorage
    document.getElementById('cookiePreferences').checked = localStorage.getItem('cookies_preferences') === 'yes';
    document.getElementById('cookieAnalytics').checked = localStorage.getItem('cookies_analytics') === 'yes';
    document.getElementById('cookieMarketing').checked = localStorage.getItem('cookies_marketing') === 'yes';
    document.getElementById('cookieMedia').checked = localStorage.getItem('cookies_media') === 'yes';
    modal.show();
  });
}

if (saveCookiePreferencesBtn) {
  saveCookiePreferencesBtn.addEventListener('click', () => {
    localStorage.setItem('cookies_preferences', document.getElementById('cookiePreferences').checked ? 'yes' : 'no');
    localStorage.setItem('cookies_analytics', document.getElementById('cookieAnalytics').checked ? 'yes' : 'no');
    localStorage.setItem('cookies_marketing', document.getElementById('cookieMarketing').checked ? 'yes' : 'no');
    localStorage.setItem('cookies_media', document.getElementById('cookieMedia').checked ? 'yes' : 'no');
    localStorage.setItem('cookies_accepted', 'yes');
    hideCookieBanner();
    // cerrar modal
    const modalEl = document.getElementById('cookieSettingsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    loadVideoIfAllowed();
  });
}

function loadVideoIfAllowed() {
  // Si el contenedor no tiene data-video-id (p. ej. usamos un video local en el modal), no cargar iframe de YouTube
  if (!videoContainer || !videoContainer.dataset || !videoContainer.dataset.videoId) return;
  const mediaAllowed = localStorage.getItem('cookies_media') === 'yes';
  if (mediaAllowed && !videoContainer.querySelector('iframe')) {
    const id = videoContainer.dataset.videoId;
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '400';
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    iframe.title = 'Video de presentación de 4Life';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);
  }
}

// --- CARGA CONDICIONAL DE GOOGLE ANALYTICS (requiere Measurement ID) ---
function loadGoogleAnalytics(measurementId) {
  if (!measurementId) return;
  // evitar carga múltiple
  if (window.gtagLoaded) return;
  // insertar etiqueta gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}    
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, { 'anonymize_ip': true });
  window.gtagLoaded = true;
}

// Comprobar consentimiento analítico y cargar GA si procede
function initAnalyticsIfConsented() {
  const analyticsConsent = localStorage.getItem('cookies_analytics') === 'yes';
  // Pega aquí tu Measurement ID cuando quieras activarlo (ej: 'G-XXXXXXXX')
  const MEASUREMENT_ID = null; // <-- reemplaza null por 'G-XXXXXXXX' para activar
  if (analyticsConsent && MEASUREMENT_ID) {
    loadGoogleAnalytics(MEASUREMENT_ID);
  }
}

// Ejecutar al inicio y cuando se guardan preferencias
initAnalyticsIfConsented();

// Play button (si usuario da play, cargamos el iframe aunque no haya aceptado media)
if (playVideoBtn) {
  playVideoBtn.addEventListener('click', () => {
    // Si no hay data-video-id (p. ej. usamos un video local), no intentar cargar iframe
    if (!videoContainer || !videoContainer.dataset || !videoContainer.dataset.videoId) return;
    // cargar iframe por interacción del usuario
    const id = videoContainer.dataset.videoId;
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '400';
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    iframe.title = 'Video de presentación de 4Life';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);
  });
}

// Cerrar modal de búsqueda con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalEl = document.getElementById('searchModal');
    if (modalEl && modalEl.style.display === 'block') {
      modalEl.style.display = 'none';
      const productos = document.getElementById('productos');
      if (productos) productos.style.display = 'block';
    }
  }
});

// Pausar video anterior al cambiar de slide en el carrusel de testimonios
(function() {
  const carouselEl = document.getElementById('testimoniosCarousel');
  if (!carouselEl) return;

  // Lazy-load videos: don't preload until the slide is active
  const carouselVideos = carouselEl.querySelectorAll('video');
  carouselVideos.forEach(v => {
    try { v.preload = 'none'; } catch (e) { /* ignore */ }
  });

  // Add accessible play overlay for each video to improve UX (keyboard + click)
  const carouselItems = carouselEl.querySelectorAll('.carousel-item');
  carouselItems.forEach(item => {
    const video = item.querySelector('video');
    if (!video) return;
    // ensure wrapper is positioned for absolute overlay
    const wrapper = video.closest('.ratio') || video.parentElement;
    if (wrapper) wrapper.style.position = wrapper.style.position || 'relative';

    const overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'video-overlay';
    overlay.setAttribute('aria-label', 'Reproducir video');
    overlay.tabIndex = 0;
    overlay.innerHTML = '<i class="fa-solid fa-circle-play fa-3x" aria-hidden="true"></i>';

    // click or keyboard -> load and play
    const playHandler = (ev) => {
      try { if (video.preload !== 'auto') video.load(); } catch (e) { /* ignore */ }
      try { video.play(); } catch (e) { /* ignore */ }
      overlay.style.display = 'none';
      ev && ev.preventDefault();
    };

    overlay.addEventListener('click', playHandler);
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') playHandler(e);
    });

    // hide overlay when video plays, show when paused
    video.addEventListener('play', () => overlay.style.display = 'none');
    video.addEventListener('pause', () => overlay.style.display = 'flex');

    // append overlay
    wrapper.appendChild(overlay);
  });

  // Al iniciar el cambio de slide, pausamos cualquier <video> dentro del slide que está activo (el que se va)
  carouselEl.addEventListener('slide.bs.carousel', function () {
    const activeItem = carouselEl.querySelector('.carousel-item.active');
    if (!activeItem) return;
    const vid = activeItem.querySelector('video');
    if (vid && !vid.paused) {
      try { vid.pause(); } catch (err) { /* no bloquear si falla */ }
    }
  });

  // Como medida extra, después de que el slide haya cambiado, asegurarnos de pausar cualquier video que no esté en el slide activo
  carouselEl.addEventListener('slid.bs.carousel', function () {
    const videos = carouselEl.querySelectorAll('video');
    videos.forEach(v => {
      const item = v.closest('.carousel-item');
      if (!item.classList.contains('active')) {
        try { v.pause(); } catch (err) { /* ignore */ }
      } else {
        // load metadata for active video so the user can play without delay
        try { v.load(); } catch (err) { /* ignore */ }
      }
    });
  });
})();

})();
