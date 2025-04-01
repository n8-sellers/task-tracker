/**
 * History View Module
 * Handles historical data tracking and visualization
 */

const HistoryView = (function() {
    // Module state
    let uploads = [];
    let selectedUploadId = null;
    
    /**
     * Initialize history view functionality
     */
    function init() {
        // Set up view history button
        const viewHistoryBtn = document.getElementById('view-history-btn');
        viewHistoryBtn.addEventListener('click', showHistoryView);
        
        // Set up back button
        const backButton = document.getElementById('back-from-history');
        backButton.addEventListener('click', hideHistoryView);
        
        // Set up view toggle
        const tableViewBtn = document.getElementById('history-table-btn');
        const chartViewBtn = document.getElementById('history-chart-btn');
        
        tableViewBtn.addEventListener('click', () => {
            setActiveHistoryView('table');
        });
        
        chartViewBtn.addEventListener('click', () => {
            setActiveHistoryView('chart');
        });
        
        // Set up chart controls
        const historyMetricSelect = document.getElementById('history-metric');
        historyMetricSelect.addEventListener('change', updateHistoryChart);
    }
    
    /**
     * Set active history view (table or chart)
     * @param {string} viewType - 'table' or 'chart'
     */
    function setActiveHistoryView(viewType) {
        const tableViewBtn = document.getElementById('history-table-btn');
        const chartViewBtn = document.getElementById('history-chart-btn');
        const tableView = document.getElementById('history-table-view');
        const chartView = document.getElementById('history-chart-view');
        
        // Update button states
        tableViewBtn.classList.toggle('active', viewType === 'table');
        chartViewBtn.classList.toggle('active', viewType === 'chart');
        
        // Update view visibility
        tableView.classList.toggle('active', viewType === 'table');
        chartView.classList.toggle('active', viewType === 'chart');
        
        // If switching to chart view, update the chart
        if (viewType === 'chart') {
            updateHistoryChart();
        }
        
        // Save preference
        DataStore.saveSetting('historyDefaultView', viewType);
    }
    
    /**
     * Show history view
     */
    async function showHistoryView() {
        try {
            // Load uploads if needed
            if (uploads.length === 0) {
                await loadUploads();
            }
            
            // If no uploads, show message and return
            if (uploads.length === 0) {
                showToast('info', 'No upload history available yet.');
                return;
            }
            
            // Show history view, hide other views
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('detail-view').classList.add('hidden');
            document.getElementById('history-view').classList.remove('hidden');
            
            // Load saved view preference
            loadViewPreference();
        } catch (error) {
            console.error('Error showing history view:', error);
            showToast('error', 'Failed to load history view');
        }
    }
    
    /**
     * Hide history view and go back to dashboard
     */
    function hideHistoryView() {
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('history-view').classList.add('hidden');
    }
    
    /**
     * Load saved view preference (table or chart)
     */
    async function loadViewPreference() {
        const savedView = await DataStore.getSetting('historyDefaultView', 'table');
        setActiveHistoryView(savedView);
    }
    
    /**
     * Load all uploads from the data store
     */
    async function loadUploads() {
        try {
            // Get all uploads
            uploads = await DataStore.getUploads();
            
            // Render timeline
            renderTimeline();
            
            // Render uploads table
            renderUploadsTable();
            
            // Update chart if in chart view
            if (document.getElementById('history-chart-view').classList.contains('active')) {
                updateHistoryChart();
            }
            
            return uploads;
        } catch (error) {
            console.error('Error loading uploads:', error);
            showToast('error', 'Failed to load upload history');
            return [];
        }
    }
    
    /**
     * Render timeline of uploads
     */
    function renderTimeline() {
        const timelineContainer = document.getElementById('timeline-container');
        
        // Clear existing entries
        timelineContainer.innerHTML = '';
        
        // If no uploads, show message
        if (uploads.length === 0) {
            timelineContainer.innerHTML = `
                <div class="empty-timeline-message">No historical data available yet</div>
            `;
            return;
        }
        
        // Create timeline entries
        uploads.forEach((upload, index) => {
            const timelineEntry = document.createElement('div');
            timelineEntry.className = 'timeline-entry';
            
            // Format date
            const uploadDate = new Date(upload.timestamp);
            const dateStr = uploadDate.toLocaleDateString();
            const timeStr = uploadDate.toLocaleTimeString();
            
            timelineEntry.innerHTML = `
                <div class="timeline-point ${index === 0 ? 'latest' : ''}"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${dateStr}</div>
                    <div class="timeline-time">${timeStr}</div>
                    <div class="timeline-info">
                        ${upload.rowCount} orders
                    </div>
                </div>
            `;
            
            // Add click event to select this upload
            timelineEntry.addEventListener('click', () => {
                selectUpload(upload.id);
            });
            
            timelineContainer.appendChild(timelineEntry);
        });
        
        // Add styles for timeline
        addTimelineStyles();
    }
    
    /**
     * Add styles for the timeline
     */
    function addTimelineStyles() {
        // Check if styles already exist
        if (document.getElementById('timeline-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'timeline-styles';
        styleEl.textContent = `
            #timeline-container {
                display: flex;
                overflow-x: auto;
                padding: 1rem 0;
                gap: 2rem;
            }
            
            .timeline-entry {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 150px;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 8px;
                transition: background-color 0.2s ease;
            }
            
            .timeline-entry:hover {
                background-color: rgba(236, 240, 241, 0.5);
            }
            
            .timeline-entry.selected {
                background-color: rgba(52, 152, 219, 0.1);
            }
            
            .timeline-point {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: #95a5a6;
                margin-bottom: 0.5rem;
            }
            
            .timeline-point.latest {
                background-color: #3498db;
                width: 20px;
                height: 20px;
            }
            
            .timeline-content {
                text-align: center;
            }
            
            .timeline-date {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .timeline-time {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-bottom: 0.25rem;
            }
            
            .timeline-info {
                font-size: 0.9rem;
                color: var(--text-muted);
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Render uploads table
     */
    function renderUploadsTable() {
        const tableBody = document.getElementById('history-tbody');
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // If no uploads, show message
        if (uploads.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No upload history available</td>
                </tr>
            `;
            return;
        }
        
        // Create rows for each upload
        uploads.forEach((upload, index) => {
            const row = document.createElement('tr');
            
            // Format date
            const uploadDate = new Date(upload.timestamp);
            const dateStr = uploadDate.toLocaleString();
            
            // Get comparison data if not the first upload
            let newCount = '-';
            let removedCount = '-';
            
            if (index < uploads.length - 1) {
                // Compare with next older upload
                const olderUploadId = uploads[index + 1].id;
                
                // Add a data attribute for comparison
                row.setAttribute('data-compare-with', olderUploadId);
            }
            
            row.innerHTML = `
                <td data-label="Upload Date">${dateStr}</td>
                <td data-label="Total Orders">${upload.rowCount}</td>
                <td data-label="New Orders" class="new-count">${newCount}</td>
                <td data-label="Removed Orders" class="removed-count">${removedCount}</td>
                <td data-label="Actions">
                    <button class="btn icon-btn view-upload-btn" data-id="${upload.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${index < uploads.length - 1 ? `
                        <button class="btn icon-btn compare-btn" data-current="${upload.id}" data-compare="${uploads[index + 1].id}">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        const viewButtons = tableBody.querySelectorAll('.view-upload-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const uploadId = button.getAttribute('data-id');
                viewUpload(uploadId);
            });
        });
        
        const compareButtons = tableBody.querySelectorAll('.compare-btn');
        compareButtons.forEach(button => {
            button.addEventListener('click', () => {
                const currentId = button.getAttribute('data-current');
                const compareId = button.getAttribute('data-compare');
                compareUploads(currentId, compareId);
            });
        });
        
        // Load comparison data for rows that need it
        loadComparisonData();
    }
    
    /**
     * Load comparison data for uploads
     */
    async function loadComparisonData() {
        const rows = document.querySelectorAll('#history-tbody tr[data-compare-with]');
        
        for (const row of rows) {
            try {
                const currentId = row.querySelector('.view-upload-btn').getAttribute('data-id');
                const compareId = row.getAttribute('data-compare-with');
                
                // Get comparison data
                const comparison = await DataStore.compareUploads(compareId, currentId);
                
                // Update cells with comparison data
                const newCountCell = row.querySelector('.new-count');
                const removedCountCell = row.querySelector('.removed-count');
                
                if (newCountCell) {
                    newCountCell.textContent = comparison.newCount;
                    if (comparison.newCount > 0) {
                        newCountCell.classList.add('positive-change');
                    }
                }
                
                if (removedCountCell) {
                    removedCountCell.textContent = comparison.removedCount;
                    if (comparison.removedCount > 0) {
                        removedCountCell.classList.add('negative-change');
                    }
                }
            } catch (error) {
                console.error('Error loading comparison data:', error);
            }
        }
    }
    
    /**
     * Select an upload in the timeline
     * @param {string} uploadId - Upload ID to select
     */
    function selectUpload(uploadId) {
        // Update selected upload
        selectedUploadId = uploadId;
        
        // Update timeline UI
        const timelineEntries = document.querySelectorAll('.timeline-entry');
        timelineEntries.forEach(entry => {
            const entryUploadId = entry.querySelector('.view-upload-btn')?.getAttribute('data-id');
            entry.classList.toggle('selected', entryUploadId === uploadId);
        });
        
        // Update chart if in chart view
        if (document.getElementById('history-chart-view').classList.contains('active')) {
            updateHistoryChart();
        }
    }
    
    /**
     * View a specific upload in the dashboard
     * @param {string} uploadId - Upload ID to view
     */
    async function viewUpload(uploadId) {
        try {
            // Get orders for this upload
            const orders = await DataStore.getOrdersByUpload(uploadId);
            
            // Get upload metadata
            const upload = await DataStore.getUpload(uploadId);
            
            if (!orders || !upload) {
                showToast('error', 'Upload data not found');
                return;
            }
            
            // Update dashboard with this data
            if (typeof Dashboard !== 'undefined' && Dashboard.loadData) {
                // We'll switch back to dashboard view
                hideHistoryView();
                
                // TODO: Implement a way to view specific upload in dashboard
                showToast('info', `Viewing upload from ${new Date(upload.timestamp).toLocaleString()}`);
            }
        } catch (error) {
            console.error('Error viewing upload:', error);
            showToast('error', 'Failed to load upload data');
        }
    }
    
    /**
     * Compare two uploads and show changes
     * @param {string} currentId - Current upload ID
     * @param {string} compareId - Upload ID to compare with
     */
    async function compareUploads(currentId, compareId) {
        try {
            // Get comparison data
            const comparison = await DataStore.compareUploads(compareId, currentId);
            
            // Get upload metadata
            const currentUpload = await DataStore.getUpload(currentId);
            const compareUpload = await DataStore.getUpload(compareId);
            
            if (!comparison || !currentUpload || !compareUpload) {
                showToast('error', 'Comparison data not found');
                return;
            }
            
            // Format dates
            const currentDate = new Date(currentUpload.timestamp).toLocaleString();
            const compareDate = new Date(compareUpload.timestamp).toLocaleString();
            
            // Create comparison modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Upload Comparison</h2>
                        <button class="btn icon-btn close-comparison-modal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="comparison-info">
                            <p>Comparing upload from <strong>${currentDate}</strong> with <strong>${compareDate}</strong>.</p>
                        </div>
                        <div class="comparison-summary">
                            <div class="comparison-card">
                                <h3>New Orders</h3>
                                <p class="comparison-count">${comparison.newCount}</p>
                            </div>
                            <div class="comparison-card">
                                <h3>Removed Orders</h3>
                                <p class="comparison-count">${comparison.removedCount}</p>
                            </div>
                            <div class="comparison-card">
                                <h3>Modified Orders</h3>
                                <p class="comparison-count">${comparison.modifiedCount}</p>
                            </div>
                        </div>
                        <div class="comparison-details">
                            ${comparison.newCount > 0 ? `
                                <div class="comparison-section">
                                    <h3>New Orders (${comparison.newCount})</h3>
                                    <div class="comparison-table-container">
                                        <table class="comparison-table">
                                            <thead>
                                                <tr>
                                                    <th>UniqueID</th>
                                                    <th>Location Code</th>
                                                    <th>Customer</th>
                                                    <th>Fabric Type</th>
                                                    <th>GPU Model</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${comparison.new.map(order => `
                                                    <tr>
                                                        <td>${order.UniqueID || '-'}</td>
                                                        <td>${order['Location Code'] || '-'}</td>
                                                        <td>${order.Customer || '-'}</td>
                                                        <td>${order['Fabric Type'] || '-'}</td>
                                                        <td>${order['GPU Model'] || '-'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ` : ''}
                            ${comparison.removedCount > 0 ? `
                                <div class="comparison-section">
                                    <h3>Removed Orders (${comparison.removedCount})</h3>
                                    <div class="comparison-table-container">
                                        <table class="comparison-table">
                                            <thead>
                                                <tr>
                                                    <th>UniqueID</th>
                                                    <th>Location Code</th>
                                                    <th>Customer</th>
                                                    <th>Fabric Type</th>
                                                    <th>GPU Model</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${comparison.removed.map(order => `
                                                    <tr>
                                                        <td>${order.UniqueID || '-'}</td>
                                                        <td>${order['Location Code'] || '-'}</td>
                                                        <td>${order.Customer || '-'}</td>
                                                        <td>${order['Fabric Type'] || '-'}</td>
                                                        <td>${order['GPU Model'] || '-'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            const closeButton = modal.querySelector('.close-comparison-modal');
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Add click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            // Show the modal
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            
            // Add comparison styles
            addComparisonStyles();
        } catch (error) {
            console.error('Error comparing uploads:', error);
            showToast('error', 'Failed to compare uploads');
        }
    }
    
    /**
     * Add styles for comparison modal
     */
    function addComparisonStyles() {
        // Check if styles already exist
        if (document.getElementById('comparison-styles')) {
            return;
        }
        
        const styleEl = document.createElement('style');
        styleEl.id = 'comparison-styles';
        styleEl.textContent = `
            .comparison-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin: 1.5rem 0;
            }
            
            .comparison-card {
                background-color: var(--card-bg);
                border-radius: var(--card-border-radius);
                box-shadow: var(--shadow-sm);
                padding: 1rem;
                text-align: center;
            }
            
            .comparison-card h3 {
                font-size: 1rem;
                color: var(--text-secondary);
                margin-bottom: 0.5rem;
            }
            
            .comparison-count {
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary-color);
            }
            
            .comparison-section {
                margin-top: 2rem;
            }
            
            .comparison-table-container {
                overflow-x: auto;
                margin-top: 0.5rem;
            }
            
            .comparison-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .comparison-table th, .comparison-table td {
                padding: 8px 12px;
                text-align: left;
            }
            
            .comparison-table th {
                background-color: var(--secondary-color);
                color: white;
            }
            
            .comparison-table tr:nth-child(even) {
                background-color: rgba(236, 240, 241, 0.5);
            }
            
            .positive-change {
                color: var(--success-color);
                font-weight: 600;
            }
            
            .negative-change {
                color: var(--accent-color);
                font-weight: 600;
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    /**
     * Update history chart
     */
    function updateHistoryChart() {
        // Get the canvas element
        const canvas = document.getElementById('history-chart');
        
        // Get selected metric
        const metricSelect = document.getElementById('history-metric');
        const metric = metricSelect.value;
        
        // Prepare chart data
        const labels = uploads.map(upload => {
            const date = new Date(upload.timestamp);
            return date.toLocaleDateString();
        }).reverse(); // Show oldest first
        
        const data = [];
        switch (metric) {
            case 'orders':
                data.push({
                    label: 'Total Orders',
                    data: uploads.map(upload => upload.rowCount).reverse(),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    tension: 0.1
                });
                break;
                
            case 'locations':
                // Would need to calculate this from actual data
                // This is a placeholder - in a real app, we would calculate this value
                data.push({
                    label: 'Locations',
                    data: uploads.map((_, index) => Math.round(Math.random() * 5) + 2).reverse(),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    tension: 0.1
                });
                break;
                
            case 'changes':
                // Add placeholder data for changes - in a real app, we would calculate these
                const newOrders = [];
                const removedOrders = [];
                
                for (let i = 0; i < uploads.length; i++) {
                    if (i < uploads.length - 1) {
                        newOrders.push(Math.round(Math.random() * 3));
                        removedOrders.push(Math.round(Math.random() * 2));
                    } else {
                        newOrders.push(0);
                        removedOrders.push(0);
                    }
                }
                
                data.push({
                    label: 'New Orders',
                    data: newOrders.reverse(),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    tension: 0.1
                });
                
                data.push({
                    label: 'Removed Orders',
                    data: removedOrders.reverse(),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    tension: 0.1
                });
                break;
        }
        
        // Destroy existing chart if it exists
        if (window.historyChart instanceof Chart) {
            window.historyChart.destroy();
        }
        
        // Create chart configuration
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: data
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: getYAxisTitle(metric)
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Upload Date'
                        }
                    }
                }
            }
        };
        
        // Create new chart
        window.historyChart = new Chart(canvas, config);
    }
    
    /**
     * Get Y-axis title based on selected metric
     * @param {string} metric - Selected metric
     * @returns {string} - Y-axis title
     */
    function getYAxisTitle(metric) {
        switch (metric) {
            case 'orders':
                return 'Total Orders';
            case 'locations':
                return 'Location Count';
            case 'changes':
                return 'Order Changes';
            default:
                return 'Count';
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
        loadUploads,
        showHistoryView,
        hideHistoryView
    };
})();
