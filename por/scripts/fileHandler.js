/**
 * File Handler Module
 * Handles CSV and Excel file uploads, parsing, and data normalization
 */

const FileHandler = (function() {
    // Key columns we expect to find in the CSV
    const EXPECTED_COLUMNS = ['UniqueID', 'Location Code', 'Customer', 'Fabric Type', 'GPU Model'];
    
    // CSV parsing configuration
    const parseConfig = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim()
    };
    
    /**
     * Initialize CSV upload functionality
     */
    function init() {
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('csv-upload');
        
        // Trigger file input when upload button is clicked
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    /**
     * Handle file upload event
     * @param {Event} event - File input change event
     */
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        try {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const isExcel = fileExt === 'xlsx' || fileExt === 'xls';
            
            showToast('info', `Uploading ${isExcel ? 'Excel' : 'CSV'} file...`);
            
            // Parse file based on type
            const parsedData = isExcel ? 
                await parseExcelFile(file) : 
                await parseCSVFile(file);
            
            // Validate CSV structure
            validateCSVStructure(parsedData);
            
            // Normalize data
            const normalizedData = normalizeData(parsedData.data);
            
            // Build upload data object
            const uploadData = {
                filename: file.name,
                columns: parsedData.meta.fields,
                data: normalizedData
            };
            
            // Save to data store
            const uploadId = await DataStore.saveUpload(uploadData);
            
            // Update the UI with new data
            await updateUI();
            
            showToast('success', `Successfully uploaded ${normalizedData.length} records.`);
            
            // Reset file input for future uploads
            event.target.value = '';
        } catch (error) {
            console.error('CSV upload error:', error);
            showToast('error', `Error uploading CSV: ${error.message}`);
            
            // Reset file input
            event.target.value = '';
        }
    }
    
    /**
     * Parse CSV file using PapaParse
     * @param {File} file - CSV file to parse
     * @returns {Promise<Object>} - Promise resolving to parsed data
     */
    function parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                ...parseConfig,
                complete: (results) => {
                    if (results.errors && results.errors.length > 0) {
                        reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                        return;
                    }
                    resolve(results);
                },
                error: (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                }
            });
        });
    }
    
    /**
     * Validate CSV structure to ensure it has required columns
     * @param {Object} parsedData - Parsed CSV data from PapaParse
     * @throws {Error} - If validation fails
     */
    function validateCSVStructure(parsedData) {
        // Check if CSV has any data
        if (!parsedData.data || parsedData.data.length === 0) {
            throw new Error('The CSV file is empty.');
        }
        
        // Get CSV headers
        const headers = parsedData.meta.fields || [];
        
        // Check if CSV has all expected columns
        const missingColumns = EXPECTED_COLUMNS.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
    }
    
    /**
     * Normalize CSV data for consistent processing
     * @param {Array<Object>} data - Raw parsed CSV data
     * @returns {Array<Object>} - Normalized data
     */
    function normalizeData(data) {
        return data.map(row => {
            // Create a new object with normalized values
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
    }
    
    /**
     * Update UI after successful CSV upload
     * Reload dashboard with latest data
     */
    async function updateUI() {
        // If these functions are defined in other modules, they'll be called here
        if (typeof Dashboard !== 'undefined' && Dashboard.loadData) {
            await Dashboard.loadData();
        }
        
        // Update history view if available
        if (typeof HistoryView !== 'undefined' && HistoryView.loadUploads) {
            await HistoryView.loadUploads();
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
    
    /**
     * Generate a sample CSV for testing
     * @returns {string} - CSV content as string
     */
    function generateSampleCSV() {
        const headers = ['UniqueID', 'Location Code', 'Customer', 'Fabric Type', 'GPU Model', 'Quantity', 'Order Date'];
        
        // Sample data
        const sampleData = [
            [1001, 'LOC001', 'Acme Corp', 'Cotton', 'RTX 3080', 5, '2025-01-15'],
            [1002, 'LOC002', 'TechGiant', 'Polyester', 'RTX 4090', 2, '2025-01-17'],
            [1003, 'LOC001', 'Acme Corp', 'Wool', 'RTX 3070', 3, '2025-01-20'],
            [1004, 'LOC003', 'DataSystems', 'Nylon', 'RTX 4080', 1, '2025-01-22'],
            [1005, 'LOC002', 'TechGiant', 'Cotton', 'RTX 3090', 4, '2025-01-25'],
            [1006, 'LOC004', 'CloudHost', 'Silk', 'RTX 3080', 2, '2025-01-27'],
            [1007, 'LOC003', 'DataSystems', 'Polyester', 'RTX 4070', 6, '2025-01-30']
        ];
        
        // Convert to CSV format
        const csvLines = [
            headers.join(','),
            ...sampleData.map(row => row.join(','))
        ];
        
        return csvLines.join('\n');
    }
    
    /**
     * Load sample data for testing
     */
    async function loadSampleData() {
        try {
            // Generate sample CSV content
            const csvContent = generateSampleCSV();
            
            // Convert to Blob and then to File
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const file = new File([blob], 'sample_data.csv', { type: 'text/csv' });
            
            // Parse the file
            const parsedData = await parseCSVFile(file);
            
            // Normalize data
            const normalizedData = normalizeData(parsedData.data);
            
            // Build upload data object
            const uploadData = {
                filename: 'sample_data.csv',
                columns: parsedData.meta.fields,
                data: normalizedData
            };
            
            // Save to data store
            await DataStore.saveUpload(uploadData);
            
            // Update the UI
            await updateUI();
            
            showToast('success', 'Sample data loaded successfully!');
        } catch (error) {
            console.error('Error loading sample data:', error);
            showToast('error', `Error loading sample data: ${error.message}`);
        }
    }
    
    /**
     * Parse Excel file using SheetJS
     * @param {File} file - Excel file to parse
     * @returns {Promise<Object>} - Promise resolving to parsed data (in same format as PapaParse output)
     */
    function parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // Parse the Excel file
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Use the first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON (header: true makes it use the first row as header)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                    
                    // Create a PapaParse-like result object
                    const result = {
                        data: jsonData,
                        meta: {
                            fields: Object.keys(jsonData[0] || {})
                        },
                        errors: []
                    };
                    
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Excel parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Error reading Excel file'));
            };
            
            // Read the file as an array buffer
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Generate a sample Excel file (XLSX) for testing
     * @returns {Blob} - Excel file as Blob
     */
    function generateSampleExcel() {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        
        // Sample data (same as CSV)
        const headers = ['UniqueID', 'Location Code', 'Customer', 'Fabric Type', 'GPU Model', 'Quantity', 'Order Date'];
        const sampleData = [
            [1001, 'LOC001', 'Acme Corp', 'Cotton', 'RTX 3080', 5, '2025-01-15'],
            [1002, 'LOC002', 'TechGiant', 'Polyester', 'RTX 4090', 2, '2025-01-17'],
            [1003, 'LOC001', 'Acme Corp', 'Wool', 'RTX 3070', 3, '2025-01-20'],
            [1004, 'LOC003', 'DataSystems', 'Nylon', 'RTX 4080', 1, '2025-01-22'],
            [1005, 'LOC002', 'TechGiant', 'Cotton', 'RTX 3090', 4, '2025-01-25'],
            [1006, 'LOC004', 'CloudHost', 'Silk', 'RTX 3080', 2, '2025-01-27'],
            [1007, 'LOC003', 'DataSystems', 'Polyester', 'RTX 4070', 6, '2025-01-30']
        ];
        
        // Add headers to the data
        const sheetData = [headers, ...sampleData];
        
        // Create worksheet and add to workbook
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
        
        // Generate Excel file as array buffer
        const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        
        // Convert to Blob
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    
    // Public API
    return {
        init,
        parseCSVFile,
        parseExcelFile,
        generateSampleCSV,
        generateSampleExcel,
        loadSampleData
    };
})();
