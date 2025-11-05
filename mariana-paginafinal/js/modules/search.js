// Módulo de búsqueda
App.modules.search = {
    init() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.productCards = document.querySelectorAll('.product-card');
        this.productosSection = document.getElementById('productos');
        this.searchResultsSection = document.getElementById('searchResults');
        this.resultsGrid = document.getElementById('resultsGrid');
        
        this.setupEventListeners();
    },

    setupEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => this.handleSearch(), 300));
            this.searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
        }

        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Cerrar búsqueda con ESC
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.resetSearch();
            }
        });
    },

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            this.resetSearch();
            return;
        }

        const results = Array.from(this.productCards).filter(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
            const normalizedSearchTerm = this.normalizeText(searchTerm);
            const normalizedTitle = this.normalizeText(title);
            const normalizedDescription = this.normalizeText(description);
            
            return normalizedTitle.includes(normalizedSearchTerm) || 
                   normalizedDescription.includes(normalizedSearchTerm);
        });

        this.displayResults(results, searchTerm);
    },

    displayResults(results, searchTerm) {
        if (!this.searchResultsSection || !this.resultsGrid) return;

        if (results.length === 0) {
            this.resultsGrid.innerHTML = `
                <div class="col-12 text-center">
                    <h3>No se encontraron resultados para "${searchTerm}"</h3>
                    <p class="mb-4">Intenta con otros términos de búsqueda</p>
                    <button class="btn btn-primary" onclick="App.modules.search.resetSearch()">
                        Ver todos los productos
                    </button>
                </div>`;
        } else {
            this.resultsGrid.innerHTML = '';
            results.forEach(card => {
                const col = document.createElement('div');
                col.className = 'col-sm-6 col-lg-4';
                col.appendChild(card.cloneNode(true));
                this.resultsGrid.appendChild(col);
            });
        }

        this.productosSection.style.display = 'none';
        this.searchResultsSection.style.display = 'block';
    },

    resetSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        if (this.productosSection && this.searchResultsSection) {
            this.productosSection.style.display = 'block';
            this.searchResultsSection.style.display = 'none';
        }
    },

    normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};