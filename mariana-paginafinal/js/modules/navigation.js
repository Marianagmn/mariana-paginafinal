// Módulo de navegación
App.modules.navigation = {
    init() {
        this.initSmoothScroll();
        this.initBackToTop();
        this.initScrollSpy();
        this.initMobileNav();
        this.initProgressBar();
    },

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', e => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                    // Cerrar menú móvil si está abierto
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                }
            });
        });
    },

    initBackToTop() {
        const btnTop = document.getElementById('btnTop');
        if (!btnTop) return;

        const toggleBtnVisibility = () => {
            const scrolled = window.scrollY > 400;
            btnTop.classList.toggle('show', scrolled);
        };

        window.addEventListener('scroll', toggleBtnVisibility);
        btnTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    initScrollSpy() {
        try {
            const navEl = document.getElementById('navbarNav');
            if (navEl && typeof bootstrap !== 'undefined') {
                new bootstrap.ScrollSpy(document.body, {
                    target: '#navbarNav',
                    offset: 70,
                    smoothScroll: true
                });
            }
        } catch (err) {
            console.warn('ScrollSpy initialization failed:', err);
        }
    },

    initMobileNav() {
        const navbar = document.querySelector('.navbar');
        const navbarToggler = document.querySelector('.navbar-toggler');
        const searchForm = document.querySelector('.navbar form[role="search"]');

        // Manejar cambios de scroll
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Ajustar formulario de búsqueda en móvil
        if (searchForm && window.innerWidth < 992) {
            searchForm.classList.add('d-flex', 'w-100', 'mt-3');
        }

        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => {
            if (searchForm) {
                if (window.innerWidth < 992) {
                    searchForm.classList.add('d-flex', 'w-100', 'mt-3');
                } else {
                    searchForm.classList.remove('d-flex', 'w-100', 'mt-3');
                }
            }
        });
    },

    initProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = `${scrolled}%`;
        });
    }
};