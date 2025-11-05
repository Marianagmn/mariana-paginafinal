// Aplicación principal
const App = {
    modules: {},
    
    init() {
        this.initModules();
        this.registerServiceWorker();
    },

    initModules() {
        // Inicializar todos los módulos
        Object.values(this.modules).forEach(module => {
            if (typeof module.init === 'function') {
                module.init();
            }
        });
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.warn('ServiceWorker registration failed:', err);
                });
            });
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());