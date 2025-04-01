/**
 * Search Module
 * Handles search functionality across orders
 */

const SearchModule = (function() {
    // Current search query
    let currentQuery = '';
    
    /**
     * Initialize search functionality
     */
    function init() {
        const searchInput = document.getElementById('search-input');
        
        // Set up input event for real-time search
        searchInput.addEventListener('input', handleSearchInput);
        
        // Set up keydown event for Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                executeSearch();
            }
        });
        
        // Clear button for search input
        const searchContainer = document.querySelector('.search-input-wrapper');
        addClearButton(searchContainer, searchInput);
    }
    
    /**
     * Handle search input changes
     * @param {Event} event - Input event
     */
    function handleSearchInput(event) {
        currentQuery = event.target.value.trim();
        
        // If query is empty, reset search
        if (currentQuery === '') {
            resetSearch();
            return;
        }
        
        // Debounce search for performance
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            executeSearch();
        }, 300);
    }
    
    /**
     * Execute search with current query
     */
    async function executeSearch() {
        try {
            if (currentQuery === '') {
                resetSearch();
                return;
            }
            
            // If Dashboard module exists, let it handle the search UI update
            if (typeof Dashboard !== 'undefined' && Dashboard.loadData) {
                // The Dashboard module will call DataStore.searchOrders
                return;
            }
            
            // If we don't have Dashboard module, perform search directly
            const results = await DataStore.searchOrders(currentQuery);
            
            // Show toast with result count
            showToast('info', `Found ${results.length} matching orders`);
        } catch (error) {
            console.error('Search error:', error);
            showToast('error', 'Search failed');
        }
    }
    
    /**
     * Reset search and show all data
     */
    function resetSearch() {
        // If Dashboard module exists, let it handle the UI update
        if (typeof Dashboard !== 'undefined' && Dashboard.loadData) {
            // The Dashboard module will reset to show all data
            return;
        }
    }
    
    /**
     * Add clear button to search input
     * @param {HTMLElement} container - Container element
     * @param {HTMLInputElement} input - Input element
     */
    function addClearButton(container, input) {
        // Check if clear button already exists
        if (container.querySelector('.search-clear-btn')) {
            return;
        }
        
        // Create clear button
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'search-clear-btn';
        clearButton.innerHTML = '<i class="fas fa-times"></i>';
        clearButton.style.display = 'none';
        
        // Add clear button to container
        container.appendChild(clearButton);
        
        // Show/hide clear button based on input value
        input.addEventListener('input', () => {
            clearButton.style.display = input.value ? 'block' : 'none';
        });
        
        // Clear input on button click
        clearButton.addEventListener('click', () => {
            input.value = '';
            clearButton.style.display = 'none';
            resetSearch();
            input.focus();
        });
        
        // Add styles for clear button
        addClearButtonStyles();
    }
    
    /**
     * Add styles for clear button
     */
    function addClearButtonStyles() {
        // Check if styles already exist
        if (document.getElementById('search-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'search-styles';
        styleEl.textContent = `
            .search-input-wrapper {
                position: relative;
                flex-grow: 1;
            }
            
            .search-clear-btn {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }
            
            .search-clear-btn:hover {
                background-color: rgba(0, 0, 0, 0.1);
                color: var(--accent-color);
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Display a toast notification
     * @param {string} type - Toast type (success, error, info, warning)
     * @param {string} message - Message to display
     */
    function showToast(type, message) {
        const toastContainer = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Public API
    return {
        init,
        executeSearch,
        resetSearch
    };
})();
