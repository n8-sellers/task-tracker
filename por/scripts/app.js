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
            
            // Initialize file handler
            console.log('Initializing file handler...');
            FileHandler.init();
            
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
        // Create CSV sample button
        const sampleCsvButton = document.createElement('button');
        sampleCsvButton.className = 'btn secondary';
        sampleCsvButton.innerHTML = '<i class="fas fa-vial"></i> Load CSV Sample';
        sampleCsvButton.style.marginRight = '10px';
        
        // Add click handler for CSV
        sampleCsvButton.addEventListener('click', () => {
            FileHandler.loadSampleData();
        });
        
        // Create Excel sample button
        const sampleExcelButton = document.createElement('button');
        sampleExcelButton.className = 'btn secondary';
        sampleExcelButton.innerHTML = '<i class="fas fa-file-excel"></i> Load Excel Sample';
        sampleExcelButton.style.marginRight = '10px';
        
        // Add click handler for Excel
        sampleExcelButton.addEventListener('click', () => {
            loadSampleExcelData();
        });
        
        // Add to the upload container
        const uploadContainer = document.querySelector('.upload-container');
        uploadContainer.insertBefore(sampleExcelButton, uploadContainer.firstChild);
        uploadContainer.insertBefore(sampleCsvButton, uploadContainer.firstChild);
    }
    
    /**
     * Load sample Excel data for testing
     */
    async function loadSampleExcelData() {
        try {
            // Generate sample Excel blob with headers in the third row
            const excelBlob = FileHandler.generateSampleExcel();
            
            // Convert to File object
            const file = new File([excelBlob], 'sample_data.xlsx', { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            showToast('info', 'Parsing Excel file with headers in row 3...');
            
            // Parse the Excel file
            const parsedData = await FileHandler.parseExcelFile(file);
            
            // Normalize data 
            const normalizedData = parsedData.data.map(row => {
                // Create a normalized row object
                const normalizedRow = {};
                
                // Process each field in the row
                Object.entries(row).forEach(([key, value]) => {
                    // Skip empty or null values
                    if (value === null || value === undefined || value === '') {
                        normalizedRow[key] = null;
                        return;
                    }
                    
                    // For string values, trim whitespace
                    if (typeof value === 'string') {
                        normalizedRow[key] = value.trim();
                    } else {
                        normalizedRow[key] = value;
                    }
                });
                
                return normalizedRow;
            });
            
            // Build upload data object
            const uploadData = {
                filename: 'sample_data.xlsx',
                columns: parsedData.meta.fields,
                data: normalizedData
            };
            
            // Add info about header detection
            const headerRowIndex = parsedData.meta.headerRowIndex || 0;
            const headerInfo = `Found headers in row ${headerRowIndex + 1}`;
            
            // Save to data store
            await DataStore.saveUpload(uploadData);
            
            // Update UI
            if (typeof Dashboard !== 'undefined' && Dashboard.loadData) {
                await Dashboard.loadData();
            }
            
            if (typeof HistoryView !== 'undefined' && HistoryView.loadUploads) {
                await HistoryView.loadUploads();
            }
            
            showToast('success', `Sample Excel data loaded successfully! ${headerInfo}`);
        } catch (error) {
            console.error('Error loading sample Excel data:', error);
            showToast('error', `Error loading sample Excel data: ${error.message}`);
        }
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
