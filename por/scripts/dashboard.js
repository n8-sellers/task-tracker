/**
 * Dashboard Module
 * Handles the main dashboard view and data display
 */

const Dashboard = (function() {
    // Module state
    let currentData = {
        orders: [],
        upload: null
    };
    
    // Pagination state
    let pagination = {
        currentPage: 1,
        pageSize: 10,
        totalPages: 1
    };
    
    // Filters state
    let filters = {};
    
    // Search query
    let searchQuery = '';
    
    /**
     * Initialize dashboard functionality
     */
    function init() {
        // Set up view toggle
        const tableViewBtn = document.getElementById('table-view-btn');
        const chartViewBtn = document.getElementById('chart-view-btn');
        const tableView = document.getElementById('table-view');
        const chartView = document.getElementById('chart-view');
        
        tableViewBtn.addEventListener('click', () => {
            setActiveView('table');
        });
        
        chartViewBtn.addEventListener('click', () => {
            setActiveView('chart');
        });
        
        // Set up pagination controls
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        prevPageBtn.addEventListener('click', () => {
            if (pagination.currentPage > 1) {
                pagination.currentPage--;
                renderTable();
                updatePaginationControls();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            if (pagination.currentPage < pagination.totalPages) {
                pagination.currentPage++;
                renderTable();
                updatePaginationControls();
            }
        });
        
        // Set up search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            pagination.currentPage = 1;
            applyFiltersAndSearch();
        });
        
        // Set up filter button
        const filterBtn = document.getElementById('advanced-filters-btn');
        const filtersModal = document.getElementById('advanced-filters-modal');
        const closeFiltersBtn = document.getElementById('close-filters-modal');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const clearFiltersBtn = document.getElementById('clear-filters');
        
        filterBtn.addEventListener('click', () => {
            filtersModal.classList.add('active');
            populateFilterOptions();
        });
        
        closeFiltersBtn.addEventListener('click', () => {
            filtersModal.classList.remove('active');
        });
        
        applyFiltersBtn.addEventListener('click', () => {
            collectFilters();
            filtersModal.classList.remove('active');
            pagination.currentPage = 1;
            applyFiltersAndSearch();
        });
        
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
            populateFilterOptions();
        });
        
        // Set up chart controls
        const chartTypeSelect = document.getElementById('chart-type');
        const chartGroupSelect = document.getElementById('chart-group');
        
        chartTypeSelect.addEventListener('change', updateChart);
        chartGroupSelect.addEventListener('change', updateChart);
        
        // Load initial data
        loadData();
    }
    
    /**
     * Set active view (table or chart)
     * @param {string} viewType - 'table' or 'chart'
     */
    function setActiveView(viewType) {
        const tableViewBtn = document.getElementById('table-view-btn');
        const chartViewBtn = document.getElementById('chart-view-btn');
        const tableView = document.getElementById('table-view');
        const chartView = document.getElementById('chart-view');
        
        // Update button states
        tableViewBtn.classList.toggle('active', viewType === 'table');
        chartViewBtn.classList.toggle('active', viewType === 'chart');
        
        // Update view visibility
        tableView.classList.toggle('active', viewType === 'table');
        chartView.classList.toggle('active', viewType === 'chart');
        
        // If switching to chart view, update the chart
        if (viewType === 'chart') {
            updateChart();
        }
        
        // Save preference
        DataStore.saveSetting('defaultView', viewType);
    }
    
    /**
     * Load data from the data store
     */
    async function loadData() {
        try {
            // Get the latest data
            const { orders, upload } = await DataStore.getLatestData();
            
            // Update module state
            currentData = { orders, upload };
            
            // If data is empty, show empty state
            if (orders.length === 0) {
                showEmptyState();
                return;
            }
            
            // Update summary metrics
            updateSummaryMetrics();
            
            // Reset pagination
            resetPagination();
            
            // Render the table with the current data
            renderTable();
            
            // Update the chart (if in chart view)
            if (document.getElementById('chart-view').classList.contains('active')) {
                updateChart();
            }
            
            // Load saved view preference
            loadViewPreference();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('error', 'Failed to load data');
        }
    }
    
    /**
     * Load saved view preference (table or chart)
     */
    async function loadViewPreference() {
        const savedView = await DataStore.getSetting('defaultView', 'table');
        setActiveView(savedView);
    }
    
    /**
     * Update summary metrics
     */
    function updateSummaryMetrics() {
        // Get count elements
        const totalOrdersEl = document.getElementById('total-orders');
        const totalLocationsEl = document.getElementById('total-locations');
        const totalGpuModelsEl = document.getElementById('total-gpu-models');
        const totalFabricTypesEl = document.getElementById('total-fabric-types');
        
        // Count distinct values
        const locationCodes = new Set(currentData.orders.map(order => order['Location Code']));
        const gpuModels = new Set(currentData.orders.map(order => order['GPU Model']));
        const fabricTypes = new Set(currentData.orders.map(order => order['Fabric Type']));
        
        // Update the DOM
        totalOrdersEl.textContent = currentData.orders.length;
        totalLocationsEl.textContent = locationCodes.size;
        totalGpuModelsEl.textContent = gpuModels.size;
        totalFabricTypesEl.textContent = fabricTypes.size;
    }
    
    /**
     * Reset pagination state
     */
    function resetPagination() {
        pagination.currentPage = 1;
        pagination.totalPages = Math.ceil(currentData.orders.length / pagination.pageSize) || 1;
        updatePaginationControls();
    }
    
    /**
     * Update pagination controls
     */
    function updatePaginationControls() {
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        // Update buttons state
        prevPageBtn.disabled = pagination.currentPage <= 1;
        nextPageBtn.disabled = pagination.currentPage >= pagination.totalPages;
        
        // Update page info text
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    }
    
    /**
     * Render the data table
     */
    function renderTable() {
        const tableBody = document.getElementById('orders-tbody');
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // If no data, show empty state
        if (currentData.orders.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-state';
            emptyRow.innerHTML = `
                <td colspan="5">
                    <div class="empty-state-message">
                        <i class="fas fa-search fa-3x"></i>
                        <p>No orders found</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // Calculate slice indexes for pagination
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        
        // Get current page of data
        const pageData = currentData.orders.slice(startIndex, endIndex);
        
        // Create table rows
        pageData.forEach(order => {
            const row = document.createElement('tr');
            
            // Add data cells
            row.innerHTML = `
                <td data-label="Location Code">${order['Location Code'] || '-'}</td>
                <td data-label="Customer">${order['Customer'] || '-'}</td>
                <td data-label="Fabric Type">${order['Fabric Type'] || '-'}</td>
                <td data-label="GPU Model">${order['GPU Model'] || '-'}</td>
                <td data-label="Actions">
                    <button class="btn icon-btn view-details" data-id="${order.UniqueID}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            
            // Add row click handler for location details
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking the details button
                if (!e.target.closest('.view-details')) {
                    showLocationDetails(order['Location Code']);
                }
            });
            
            // Add details button click handler
            const detailsBtn = row.querySelector('.view-details');
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click
                showOrderDetails(order.UniqueID);
            });
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Update the chart visualization
     */
    function updateChart() {
        if (currentData.orders.length === 0) {
            return;
        }
        
        const chartTypeSelect = document.getElementById('chart-type');
        const chartGroupSelect = document.getElementById('chart-group');
        
        const chartType = chartTypeSelect.value;
        const groupBy = chartGroupSelect.value;
        
        // Get the canvas element
        const canvas = document.getElementById('main-chart');
        
        // Group data by the selected field
        const groupedData = groupDataByField(currentData.orders, getFieldByGroupOption(groupBy));
        
        // Prepare chart data
        const labels = Object.keys(groupedData);
        const data = Object.values(groupedData).map(items => items.length);
        
        // Destroy existing chart if it exists
        if (window.mainChart instanceof Chart) {
            window.mainChart.destroy();
        }
        
        // Create chart configuration
        const config = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: `Orders by ${getGroupLabel(groupBy)}`,
                    data: data,
                    backgroundColor: getChartColors(labels.length),
                    borderColor: chartType === 'line' ? '#3498db' : undefined,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartType === 'pie',
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const percentage = Math.round(value / data.reduce((a, b) => a + b, 0) * 100);
                                return `${label}: ${value} orders (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        display: chartType !== 'pie',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Orders'
                        }
                    }
                }
            }
        };
        
        // Create new chart
        window.mainChart = new Chart(canvas, config);
    }
    
    /**
     * Group data by a specific field
     * @param {Array<Object>} data - Data to group
     * @param {string} field - Field to group by
     * @returns {Object} - Grouped data object
     */
    function groupDataByField(data, field) {
        return data.reduce((groups, item) => {
            const value = item[field] || 'Unknown';
            if (!groups[value]) {
                groups[value] = [];
            }
            groups[value].push(item);
            return groups;
        }, {});
    }
    
    /**
     * Get field name based on group option
     * @param {string} groupOption - Group option value
     * @returns {string} - Field name
     */
    function getFieldByGroupOption(groupOption) {
        const fieldMap = {
            'location': 'Location Code',
            'fabric': 'Fabric Type',
            'gpu': 'GPU Model',
            'customer': 'Customer'
        };
        return fieldMap[groupOption] || 'Location Code';
    }
    
    /**
     * Get group label for display
     * @param {string} groupOption - Group option value
     * @returns {string} - Display label
     */
    function getGroupLabel(groupOption) {
        const labelMap = {
            'location': 'Location Code',
            'fabric': 'Fabric Type',
            'gpu': 'GPU Model',
            'customer': 'Customer'
        };
        return labelMap[groupOption] || 'Location';
    }
    
    /**
     * Generate chart colors
     * @param {number} count - Number of colors needed
     * @returns {Array<string>} - Array of color strings
     */
    function getChartColors(count) {
        const baseColors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
            '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
        ];
        
        // If we need more colors than are in the base array, generate them
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        // Generate additional colors
        const colors = [...baseColors];
        
        for (let i = baseColors.length; i < count; i++) {
            // Generate random color
            const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
            colors.push(color);
        }
        
        return colors;
    }
    
    /**
     * Show details for a specific location
     * @param {string} locationCode - Location code to show details for
     */
    function showLocationDetails(locationCode) {
        if (typeof DetailView !== 'undefined' && DetailView.showLocationDetails) {
            DetailView.showLocationDetails(locationCode, currentData.orders);
        } else {
            console.warn('DetailView is not available');
        }
    }
    
    /**
     * Show details for a specific order
     * @param {string|number} orderId - Order ID to show details for
     */
    async function showOrderDetails(orderId) {
        try {
            // Fetch the order from the data store
            const order = await DataStore.getOrder(orderId);
            
            if (!order) {
                showToast('error', 'Order not found');
                return;
            }
            
            // Get modal elements
            const modal = document.getElementById('order-detail-modal');
            const closeBtn = document.getElementById('close-order-modal');
            const detailsBody = document.getElementById('order-details-tbody');
            
            // Clear existing details
            detailsBody.innerHTML = '';
            
            // Add all order properties to the details table
            Object.entries(order).forEach(([key, value]) => {
                // Skip internal properties
                if (key.startsWith('_')) {
                    return;
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${key}</strong></td>
                    <td>${value !== null ? value : '-'}</td>
                `;
                detailsBody.appendChild(row);
            });
            
            // Add metadata section
            const metadataHeader = document.createElement('tr');
            metadataHeader.innerHTML = `
                <td colspan="2" style="background-color: #f8f9fa; text-align: center;">
                    <strong>Metadata</strong>
                </td>
            `;
            detailsBody.appendChild(metadataHeader);
            
            // Add metadata fields
            const metadata = [
                { label: 'First Seen', value: new Date(order._firstSeen).toLocaleString() },
                { label: 'Last Updated', value: new Date(order._lastSeen).toLocaleString() },
                { label: 'Status', value: order._status }
            ];
            
            metadata.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${item.label}</strong></td>
                    <td>${item.value}</td>
                `;
                detailsBody.appendChild(row);
            });
            
            // Show the modal
            modal.classList.add('active');
            
            // Set up close button
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
            
            // Close on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            showToast('error', 'Failed to load order details');
        }
    }
    
    /**
     * Show empty state when no data is available
     */
    function showEmptyState() {
        // Update summary metrics to show dashes
        const totalOrdersEl = document.getElementById('total-orders');
        const totalLocationsEl = document.getElementById('total-locations');
        const totalGpuModelsEl = document.getElementById('total-gpu-models');
        const totalFabricTypesEl = document.getElementById('total-fabric-types');
        
        totalOrdersEl.textContent = '-';
        totalLocationsEl.textContent = '-';
        totalGpuModelsEl.textContent = '-';
        totalFabricTypesEl.textContent = '-';
        
        // Show empty state in table
        const tableBody = document.getElementById('orders-tbody');
        tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-state-message">
                        <i class="fas fa-file-csv fa-3x"></i>
                        <p>Upload a CSV file to get started</p>
                    </div>
                </td>
            </tr>
        `;
        
        // Reset pagination
        pagination.currentPage = 1;
        pagination.totalPages = 1;
        updatePaginationControls();
        
        // Clear chart if it exists
        if (window.mainChart instanceof Chart) {
            window.mainChart.destroy();
            window.mainChart = null;
        }
    }
    
    /**
     * Populate filter options in the advanced filters modal
     */
    async function populateFilterOptions() {
        try {
            // Get distinct values for each filter category
            const locationCodes = await DataStore.getDistinctValues('Location Code');
            const fabricTypes = await DataStore.getDistinctValues('Fabric Type');
            const gpuModels = await DataStore.getDistinctValues('GPU Model');
            const customers = await DataStore.getDistinctValues('Customer');
            
            // Get filter containers
            const locationFilters = document.getElementById('location-filters');
            const fabricFilters = document.getElementById('fabric-filters');
            const gpuFilters = document.getElementById('gpu-filters');
            const customerFilters = document.getElementById('customer-filters');
            
            // Clear existing options
            locationFilters.innerHTML = '';
            fabricFilters.innerHTML = '';
            gpuFilters.innerHTML = '';
            customerFilters.innerHTML = '';
            
            // Create filter options for each category
            createFilterOptions(locationFilters, locationCodes, 'location', filters.location || []);
            createFilterOptions(fabricFilters, fabricTypes, 'fabric', filters.fabric || []);
            createFilterOptions(gpuFilters, gpuModels, 'gpu', filters.gpu || []);
            createFilterOptions(customerFilters, customers, 'customer', filters.customer || []);
        } catch (error) {
            console.error('Error populating filter options:', error);
            showToast('error', 'Failed to load filter options');
        }
    }
    
    /**
     * Create filter checkboxes for a category
     * @param {HTMLElement} container - Container element
     * @param {Array<string>} values - Array of filter values
     * @param {string} category - Filter category name
     * @param {Array<string>} selectedValues - Array of currently selected values
     */
    function createFilterOptions(container, values, category, selectedValues) {
        // If no values, show message
        if (!values || values.length === 0) {
            container.innerHTML = `<p class="filter-empty">No values available</p>`;
            return;
        }
        
        // Create checkboxes for each value
        values.forEach(value => {
            const optionId = `${category}-${value}`.replace(/\s+/g, '-').toLowerCase();
            
            const label = document.createElement('label');
            label.className = 'filter-option';
            label.htmlFor = optionId;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = optionId;
            checkbox.value = value;
            checkbox.checked = selectedValues.includes(value);
            checkbox.dataset.category = category;
            
            const span = document.createElement('span');
            span.textContent = value;
            
            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }
    
    /**
     * Collect selected filters from the modal
     */
    function collectFilters() {
        // Reset filters
        filters = {
            location: [],
            fabric: [],
            gpu: [],
            customer: []
        };
        
        // Get all checked checkboxes
        const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]:checked');
        
        // Collect checked values
        filterCheckboxes.forEach(checkbox => {
            const category = checkbox.dataset.category;
            const value = checkbox.value;
            
            if (category && filters[category]) {
                filters[category].push(value);
            }
        });
        
        // Return the filters
        return filters;
    }
    
    /**
     * Clear all filters
     */
    function clearFilters() {
        filters = {
            location: [],
            fabric: [],
            gpu: [],
            customer: []
        };
        
        // Uncheck all checkboxes
        const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    /**
     * Apply filters and search to the data
     */
    async function applyFiltersAndSearch() {
        try {
            // Get latest data first
            const { orders } = await DataStore.getLatestData();
            
            // Filter criteria to send to DataStore
            const filterCriteria = {};
            
            // Add category filters
            if (filters.location && filters.location.length > 0) {
                filterCriteria['Location Code'] = filters.location;
            }
            
            if (filters.fabric && filters.fabric.length > 0) {
                filterCriteria['Fabric Type'] = filters.fabric;
            }
            
            if (filters.gpu && filters.gpu.length > 0) {
                filterCriteria['GPU Model'] = filters.gpu;
            }
            
            if (filters.customer && filters.customer.length > 0) {
                filterCriteria['Customer'] = filters.customer;
            }
            
            // Get filtered data
            let filteredOrders;
            
            if (Object.keys(filterCriteria).length > 0) {
                // If we have filters, use getFilteredOrders
                filteredOrders = await DataStore.getFilteredOrders(filterCriteria);
            } else {
                // Otherwise, use all orders
                filteredOrders = orders;
            }
            
            // Apply search query if provided
            if (searchQuery && searchQuery.trim() !== '') {
                // If we have a search query, further filter the results
                const searchResults = await DataStore.searchOrders(searchQuery);
                
                // Find intersection of filtered orders and search results
                const filteredIds = new Set(filteredOrders.map(order => order.UniqueID));
                filteredOrders = searchResults.filter(order => filteredIds.has(order.UniqueID));
            }
            
            // Update current data
            currentData.orders = filteredOrders;
            
            // Update summary metrics based on filtered data
            updateSummaryMetrics();
            
            // Update pagination
            pagination.currentPage = 1;
            pagination.totalPages = Math.ceil(filteredOrders.length / pagination.pageSize) || 1;
            updatePaginationControls();
            
            // Render the table with filtered data
            renderTable();
            
            // Update chart if in chart view
            if (document.getElementById('chart-view').classList.contains('active')) {
                updateChart();
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            showToast('error', 'Failed to apply filters');
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
        init,
        loadData,
        showLocationDetails,
        showOrderDetails
    };
})();
