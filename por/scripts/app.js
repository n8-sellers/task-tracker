/**
 * Main Application Module
 * Initializes all modules and handles application startup
 */

const App = (function() {
    /**
     * Initialize the application
     */
    function init() {
        console.log('Task Tracker Application Initializing...');
        
        // Initialize modules in the correct order
        try {
            // First initialize data store (no dependencies)
            console.log('Initializing data storage...');
            // DataStore is automatically initialized
            
            // Initialize CSV handler
            console.log('Initializing CSV handler...');
            CSVHandler.init();
            
            // Initialize dashboard
            console.log('Initializing dashboard...');
            Dashboard.init();
            
            // Initialize detail view
            console.log('Initializing detail view...');
            DetailView.init();
            
            // Initialize history view
            console.log('Initializing history view...');
            HistoryView.init();
            
            // Initialize search module
            console.log('Initializing search module...');
            SearchModule.init();
            
            // Add sample data button for testing
            addSampleDataButton();
            
            console.log('Application initialized successfully!');
            
            // Show welcome toast
            showToast('info', 'Welcome to Task Tracker! Upload a CSV file to get started.');
        } catch (error) {
            console.error('Error initializing application:', error);
            showToast('error', 'Failed to initialize application. Check console for details.');
        }
    }
    
    /**
     * Add a sample data button for testing
     */
    function addSampleDataButton() {
        // Create button
        const sampleButton = document.createElement('button');
        sampleButton.className = 'btn secondary';
        sampleButton.innerHTML = '<i class="fas fa-vial"></i> Load Sample Data';
        sampleButton.style.marginRight = '10px';
        
        // Add click handler
        sampleButton.addEventListener('click', () => {
            CSVHandler.loadSampleData();
        });
        
        // Add to the upload container
        const uploadContainer = document.querySelector('.upload-container');
        uploadContainer.insertBefore(sampleButton, uploadContainer.firstChild);
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
        init
    };
})();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);
