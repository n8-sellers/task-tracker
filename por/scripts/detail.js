/**
 * Detail View Module
 * Handles detailed views for locations and orders
 */

const DetailView = (function() {
    // Current location code being displayed
    let currentLocationCode = null;
    
    // Current location orders
    let locationOrders = [];
    
    /**
     * Initialize detail view functionality
     */
    function init() {
        // Set up back button
        const backButton = document.getElementById('back-to-dashboard');
        backButton.addEventListener('click', hideLocationDetails);
    }
    
    /**
     * Show detailed view for a specific location
     * @param {string} locationCode - Location code to show details for
     * @param {Array<Object>} allOrders - All orders data (filtered from dashboard)
     */
    function showLocationDetails(locationCode, allOrders) {
        try {
            // Set current location
            currentLocationCode = locationCode;
            
            // Filter orders for this location
            locationOrders = allOrders.filter(order => order['Location Code'] === locationCode);
            
            if (locationOrders.length === 0) {
                showToast('error', `No orders found for location ${locationCode}`);
                return;
            }
            
            // Update view title
            const detailTitleEl = document.getElementById('detail-title');
            detailTitleEl.textContent = `Location: ${locationCode}`;
            
            // Populate info card
            populateLocationInfo();
            
            // Populate metrics
            populateLocationMetrics();
            
            // Populate orders table
            populateOrdersTable();
            
            // Show the detail view, hide dashboard
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('detail-view').classList.remove('hidden');
            document.getElementById('history-view').classList.add('hidden');
        } catch (error) {
            console.error('Error showing location details:', error);
            showToast('error', 'Failed to load location details');
        }
    }
    
    /**
     * Hide location details and go back to dashboard
     */
    function hideLocationDetails() {
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('detail-view').classList.add('hidden');
        
        // Reset state
        currentLocationCode = null;
        locationOrders = [];
    }
    
    /**
     * Populate location info card
     */
    function populateLocationInfo() {
        const infoContentEl = document.getElementById('detail-info-content');
        
        if (!locationOrders || locationOrders.length === 0) {
            infoContentEl.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Find all unique customers at this location
        const customers = [...new Set(locationOrders.map(order => order['Customer']))];
        
        // Get first order for some basic info
        const firstOrder = locationOrders[0];
        
        // Create info HTML
        const infoHTML = `
            <div class="detail-info-item">
                <strong>Location Code:</strong> ${currentLocationCode}
            </div>
            <div class="detail-info-item">
                <strong>Total Orders:</strong> ${locationOrders.length}
            </div>
            <div class="detail-info-item">
                <strong>Customers:</strong> ${customers.join(', ')}
            </div>
        `;
        
        infoContentEl.innerHTML = infoHTML;
    }
    
    /**
     * Populate location metrics card
     */
    function populateLocationMetrics() {
        const metricsContentEl = document.getElementById('detail-metrics-content');
        
        if (!locationOrders || locationOrders.length === 0) {
            metricsContentEl.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Count orders by Fabric Type
        const fabricTypeCounts = groupAndCount(locationOrders, 'Fabric Type');
        const fabricTypeHTML = createMetricHTML('Fabric Types', fabricTypeCounts);
        
        // Count orders by GPU Model
        const gpuModelCounts = groupAndCount(locationOrders, 'GPU Model');
        const gpuModelHTML = createMetricHTML('GPU Models', gpuModelCounts);
        
        // Create metrics HTML
        const metricsHTML = `
            ${fabricTypeHTML}
            ${gpuModelHTML}
        `;
        
        metricsContentEl.innerHTML = metricsHTML;
    }
    
    /**
     * Group items by a field and count occurrences
     * @param {Array<Object>} items - Items to group
     * @param {string} field - Field to group by
     * @returns {Object} - Object with counts by field value
     */
    function groupAndCount(items, field) {
        return items.reduce((counts, item) => {
            const value = item[field] || 'Unknown';
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
    }
    
    /**
     * Create HTML for a metric section
     * @param {string} title - Section title
     * @param {Object} counts - Counts object
     * @returns {string} - HTML for the metric section
     */
    function createMetricHTML(title, counts) {
        const countEntries = Object.entries(counts);
        
        // Sort by count (descending)
        countEntries.sort((a, b) => b[1] - a[1]);
        
        // Create HTML for each item
        const itemsHTML = countEntries.map(([name, count]) => {
            const percentage = Math.round((count / locationOrders.length) * 100);
            
            return `
                <div class="metric-item">
                    <div class="metric-item-label">${name}</div>
                    <div class="metric-item-bar-container">
                        <div class="metric-item-bar" style="width: ${percentage}%"></div>
                        <div class="metric-item-count">${count} (${percentage}%)</div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="metric-section">
                <h4>${title}</h4>
                <div class="metric-items">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Populate orders table in the detail view
     */
    function populateOrdersTable() {
        const tableBody = document.getElementById('detail-orders-tbody');
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // If no orders, show message
        if (!locationOrders || locationOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No orders available for this location</td>
                </tr>
            `;
            return;
        }
        
        // Sort orders by UniqueID
        const sortedOrders = [...locationOrders].sort((a, b) => {
            return a.UniqueID - b.UniqueID;
        });
        
        // Create rows for each order
        sortedOrders.forEach(order => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td data-label="UniqueID">${order.UniqueID || '-'}</td>
                <td data-label="Customer">${order.Customer || '-'}</td>
                <td data-label="Fabric Type">${order['Fabric Type'] || '-'}</td>
                <td data-label="GPU Model">${order['GPU Model'] || '-'}</td>
                <td data-label="More">
                    <button class="btn icon-btn order-details-btn" data-id="${order.UniqueID}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to detail buttons
        const detailButtons = tableBody.querySelectorAll('.order-details-btn');
        detailButtons.forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-id');
                if (typeof Dashboard !== 'undefined' && Dashboard.showOrderDetails) {
                    Dashboard.showOrderDetails(orderId);
                }
            });
        });
        
        // Add styles for the bars
        addMetricStyles();
    }
    
    /**
     * Add styles for metric bars
     */
    function addMetricStyles() {
        // Check if styles already exist
        if (document.getElementById('detail-metric-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'detail-metric-styles';
        styleEl.textContent = `
            .metric-section {
                margin-bottom: 1.5rem;
            }
            .metric-items {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .metric-item {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .metric-item-label {
                width: 100px;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .metric-item-bar-container {
                flex: 1;
                height: 24px;
                background-color: #ecf0f1;
                border-radius: 4px;
                position: relative;
                overflow: hidden;
            }
            .metric-item-bar {
                height: 100%;
                background-color: #3498db;
                border-radius: 4px;
            }
            .metric-item-count {
                position: absolute;
                top: 0;
                right: 8px;
                height: 100%;
                display: flex;
                align-items: center;
                font-size: 0.85rem;
                color: #2c3e50;
                font-weight: 500;
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
        showLocationDetails,
        hideLocationDetails
    };
})();
