/**
 * Visualizations Module
 * Handles chart creation and visualization helpers
 */

const Visualizations = (function() {
    // Default chart colors
    const chartColors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
        '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b',
        '#2980b9', '#27ae60', '#c0392b', '#f1c40f', '#8e44ad'
    ];
    
    /**
     * Create a bar chart
     * @param {HTMLCanvasElement} canvas - Canvas element to draw on
     * @param {Array<string>} labels - Chart labels
     * @param {Array<number>} data - Chart data
     * @param {string} label - Dataset label
     * @param {Object} options - Additional chart options
     * @returns {Chart} - Chart.js instance
     */
    function createBarChart(canvas, labels, data, label, options = {}) {
        // Destroy existing chart if it exists
        if (canvas.chart instanceof Chart) {
            canvas.chart.destroy();
        }
        
        const colors = options.colors || generateColors(data.length);
        
        // Create chart configuration
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => adjustColor(color, -20)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend !== undefined ? options.showLegend : true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: options.yTitle ? true : false,
                            text: options.yTitle || ''
                        }
                    },
                    x: {
                        title: {
                            display: options.xTitle ? true : false,
                            text: options.xTitle || ''
                        }
                    }
                }
            }
        };
        
        // Apply additional options
        if (options.onClick) {
            config.options.onClick = options.onClick;
        }
        
        // Create and return the chart
        canvas.chart = new Chart(canvas, config);
        return canvas.chart;
    }
    
    /**
     * Create a pie chart
     * @param {HTMLCanvasElement} canvas - Canvas element to draw on
     * @param {Array<string>} labels - Chart labels
     * @param {Array<number>} data - Chart data
     * @param {string} label - Dataset label
     * @param {Object} options - Additional chart options
     * @returns {Chart} - Chart.js instance
     */
    function createPieChart(canvas, labels, data, label, options = {}) {
        // Destroy existing chart if it exists
        if (canvas.chart instanceof Chart) {
            canvas.chart.destroy();
        }
        
        const colors = options.colors || generateColors(data.length);
        
        // Create chart configuration
        const config = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => adjustColor(color, -20)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
        
        // Apply additional options
        if (options.onClick) {
            config.options.onClick = options.onClick;
        }
        
        // Create and return the chart
        canvas.chart = new Chart(canvas, config);
        return canvas.chart;
    }
    
    /**
     * Create a line chart
     * @param {HTMLCanvasElement} canvas - Canvas element to draw on
     * @param {Array<string>} labels - Chart labels
     * @param {Array<Array<number>>} datasets - Array of datasets
     * @param {Array<string>} datasetLabels - Labels for each dataset
     * @param {Object} options - Additional chart options
     * @returns {Chart} - Chart.js instance
     */
    function createLineChart(canvas, labels, datasets, datasetLabels, options = {}) {
        // Destroy existing chart if it exists
        if (canvas.chart instanceof Chart) {
            canvas.chart.destroy();
        }
        
        // Generate colors if not provided
        const colors = options.colors || generateColors(datasets.length);
        
        // Create datasets configuration
        const chartDatasets = datasets.map((data, index) => {
            return {
                label: datasetLabels[index],
                data: data,
                borderColor: colors[index],
                backgroundColor: addAlpha(colors[index], 0.2),
                fill: options.fill !== undefined ? options.fill : false,
                tension: 0.1
            };
        });
        
        // Create chart configuration
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: chartDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
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
                            display: options.yTitle ? true : false,
                            text: options.yTitle || ''
                        }
                    },
                    x: {
                        title: {
                            display: options.xTitle ? true : false,
                            text: options.xTitle || ''
                        }
                    }
                }
            }
        };
        
        // Apply additional options
        if (options.onClick) {
            config.options.onClick = options.onClick;
        }
        
        // Create and return the chart
        canvas.chart = new Chart(canvas, config);
        return canvas.chart;
    }
    
    /**
     * Generate colors for chart elements
     * @param {number} count - Number of colors needed
     * @returns {Array<string>} - Array of color strings
     */
    function generateColors(count) {
        // If we need more colors than are in the default array, generate them
        if (count <= chartColors.length) {
            return chartColors.slice(0, count);
        }
        
        // Generate additional colors
        const colors = [...chartColors];
        
        for (let i = chartColors.length; i < count; i++) {
            // Generate random color
            const h = Math.floor(Math.random() * 360);
            const s = 70;
            const l = 50;
            const color = `hsl(${h}, ${s}%, ${l}%)`;
            colors.push(color);
        }
        
        return colors;
    }
    
    /**
     * Adjust a color's lightness
     * @param {string} color - Color string (hex or hsl)
     * @param {number} amount - Amount to adjust (-100 to 100)
     * @returns {string} - Adjusted color
     */
    function adjustColor(color, amount) {
        // For HSL colors
        if (color.startsWith('hsl')) {
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
                const h = parseInt(hslMatch[1]);
                const s = parseInt(hslMatch[2]);
                const l = Math.max(0, Math.min(100, parseInt(hslMatch[3]) + amount));
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        
        // For hex colors
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            let r = parseInt(hex[0] + hex[0], 16);
            let g = parseInt(hex[1] + hex[1], 16);
            let b = parseInt(hex[2] + hex[2], 16);
            
            r = Math.max(0, Math.min(255, r + amount));
            g = Math.max(0, Math.min(255, g + amount));
            b = Math.max(0, Math.min(255, b + amount));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } else if (hex.length === 6) {
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);
            
            r = Math.max(0, Math.min(255, r + amount));
            g = Math.max(0, Math.min(255, g + amount));
            b = Math.max(0, Math.min(255, b + amount));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        
        return color;
    }
    
    /**
     * Add alpha value to a color
     * @param {string} color - Color string (hex or hsl)
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} - Color with alpha
     */
    function addAlpha(color, alpha) {
        // For HSL colors
        if (color.startsWith('hsl')) {
            return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
        }
        
        // For hex colors
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        return color;
    }
    
    /**
     * Group data by a field and count
     * @param {Array<Object>} data - Data array
     * @param {string} field - Field to group by
     * @returns {Object} - Grouped counts
     */
    function groupAndCount(data, field) {
        return data.reduce((counts, item) => {
            const value = item[field] || 'Unknown';
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
    }
    
    /**
     * Prepare chart data from grouped counts
     * @param {Object} groupedData - Grouped data object
     * @returns {Object} - Object with labels and data arrays
     */
    function prepareChartData(groupedData) {
        const entries = Object.entries(groupedData);
        
        // Sort by count (descending)
        entries.sort((a, b) => b[1] - a[1]);
        
        // Extract labels and data
        const labels = entries.map(entry => entry[0]);
        const data = entries.map(entry => entry[1]);
        
        return { labels, data };
    }
    
    // Public API
    return {
        createBarChart,
        createPieChart,
        createLineChart,
        generateColors,
        groupAndCount,
        prepareChartData
    };
})();
