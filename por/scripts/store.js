/**
 * Data Store Module
 * Handles data persistence and retrieval using IndexedDB through localForage
 */

const DataStore = (function() {
    // Database configuration
    const DB_CONFIG = {
        name: 'task-tracker-db',
        version: 1
    };

    // Store names
    const STORES = {
        ORDERS: 'orders',
        UPLOADS: 'uploads',
        SETTINGS: 'settings'
    };

    // Initialize localForage instances for different stores
    const ordersStore = localforage.createInstance({
        name: DB_CONFIG.name,
        storeName: STORES.ORDERS
    });

    const uploadsStore = localforage.createInstance({
        name: DB_CONFIG.name,
        storeName: STORES.UPLOADS
    });

    const settingsStore = localforage.createInstance({
        name: DB_CONFIG.name,
        storeName: STORES.SETTINGS
    });

    /**
     * Save a new CSV upload with its data
     * @param {Object} uploadData - Object containing upload metadata and parsed data
     * @returns {Promise} - Promise resolving to the saved upload ID
     */
    async function saveUpload(uploadData) {
        try {
            // Generate upload ID using timestamp
            const uploadId = Date.now().toString();
            
            // Save upload metadata
            await uploadsStore.setItem(uploadId, {
                id: uploadId,
                timestamp: new Date().toISOString(),
                filename: uploadData.filename,
                rowCount: uploadData.data.length,
                columns: uploadData.columns
            });
            
            // Process and save individual orders with reference to this upload
            const savePromises = uploadData.data.map(async (row) => {
                // Use UniqueID as the key if available, otherwise generate one
                const orderId = row.UniqueID || `${uploadId}-${Math.random().toString(36).substring(2, 10)}`;
                
                // Check if this order already exists
                const existingOrder = await ordersStore.getItem(orderId);
                
                // Prepare order object with upload reference and row data
                const orderData = {
                    ...row,
                    _uploadId: uploadId,
                    _firstSeen: existingOrder ? existingOrder._firstSeen : new Date().toISOString(),
                    _lastSeen: new Date().toISOString(),
                    _status: existingOrder ? 'updated' : 'new'
                };
                
                return ordersStore.setItem(orderId, orderData);
            });
            
            await Promise.all(savePromises);
            
            // Return the upload ID
            return uploadId;
        } catch (error) {
            console.error('Error saving upload:', error);
            throw error;
        }
    }

    /**
     * Get all uploads sorted by timestamp (newest first)
     * @returns {Promise<Array>} - Promise resolving to array of upload objects
     */
    async function getUploads() {
        try {
            const uploads = [];
            
            await uploadsStore.iterate((value) => {
                uploads.push(value);
            });
            
            // Sort by timestamp, newest first
            return uploads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error retrieving uploads:', error);
            throw error;
        }
    }

    /**
     * Get a specific upload by ID
     * @param {string} uploadId - The upload ID
     * @returns {Promise<Object>} - Promise resolving to the upload object
     */
    async function getUpload(uploadId) {
        try {
            return await uploadsStore.getItem(uploadId);
        } catch (error) {
            console.error(`Error retrieving upload ${uploadId}:`, error);
            throw error;
        }
    }

    /**
     * Get all orders from a specific upload
     * @param {string} uploadId - The upload ID
     * @returns {Promise<Array>} - Promise resolving to array of order objects from the upload
     */
    async function getOrdersByUpload(uploadId) {
        try {
            const orders = [];
            
            await ordersStore.iterate((value) => {
                if (value._uploadId === uploadId) {
                    orders.push(value);
                }
            });
            
            return orders;
        } catch (error) {
            console.error(`Error retrieving orders for upload ${uploadId}:`, error);
            throw error;
        }
    }

    /**
     * Get the most recent upload data
     * @returns {Promise<Object>} - Promise resolving to the most recent upload and its orders
     */
    async function getLatestData() {
        try {
            const uploads = await getUploads();
            
            if (uploads.length === 0) {
                return { upload: null, orders: [] };
            }
            
            const latestUpload = uploads[0];
            const orders = await getOrdersByUpload(latestUpload.id);
            
            return { upload: latestUpload, orders };
        } catch (error) {
            console.error('Error retrieving latest data:', error);
            throw error;
        }
    }

    /**
     * Get all orders matching filter criteria
     * @param {Object} filters - Object containing filter criteria
     * @param {string} uploadId - Optional: specific upload ID to filter from
     * @returns {Promise<Array>} - Promise resolving to filtered orders
     */
    async function getFilteredOrders(filters = {}, uploadId = null) {
        try {
            const orders = [];
            
            await ordersStore.iterate((value) => {
                // Filter by upload ID if specified
                if (uploadId && value._uploadId !== uploadId) {
                    return;
                }
                
                // Check if the order matches all filter criteria
                const matchesFilters = Object.entries(filters).every(([key, filterValue]) => {
                    // Skip internal fields that start with underscore
                    if (key.startsWith('_')) {
                        return true;
                    }
                    
                    // Handle array of possible values
                    if (Array.isArray(filterValue)) {
                        return filterValue.length === 0 || filterValue.includes(value[key]);
                    }
                    
                    // Handle string search (case-insensitive)
                    if (typeof filterValue === 'string' && typeof value[key] === 'string') {
                        return value[key].toLowerCase().includes(filterValue.toLowerCase());
                    }
                    
                    // Exact match for other types
                    return filterValue === value[key];
                });
                
                if (matchesFilters) {
                    orders.push(value);
                }
            });
            
            return orders;
        } catch (error) {
            console.error('Error retrieving filtered orders:', error);
            throw error;
        }
    }

    /**
     * Get order by ID
     * @param {string} orderId - The order ID to retrieve
     * @returns {Promise<Object>} - Promise resolving to the order data
     */
    async function getOrder(orderId) {
        try {
            return await ordersStore.getItem(orderId);
        } catch (error) {
            console.error(`Error retrieving order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Search orders by text query across all fields
     * @param {string} query - Search query text
     * @param {string} uploadId - Optional: specific upload ID to search in
     * @returns {Promise<Array>} - Promise resolving to matching orders
     */
    async function searchOrders(query, uploadId = null) {
        try {
            if (!query || query.trim() === '') {
                return uploadId ? await getOrdersByUpload(uploadId) : [];
            }
            
            const searchQuery = query.toLowerCase().trim();
            const orders = [];
            
            await ordersStore.iterate((value) => {
                // Filter by upload ID if specified
                if (uploadId && value._uploadId !== uploadId) {
                    return;
                }
                
                // Check if any field contains the search query
                const matchesSearch = Object.entries(value).some(([key, fieldValue]) => {
                    // Skip internal fields that start with underscore
                    if (key.startsWith('_')) {
                        return false;
                    }
                    
                    // Check if field value contains the search query
                    if (fieldValue !== null && fieldValue !== undefined) {
                        return String(fieldValue).toLowerCase().includes(searchQuery);
                    }
                    
                    return false;
                });
                
                if (matchesSearch) {
                    orders.push(value);
                }
            });
            
            return orders;
        } catch (error) {
            console.error('Error searching orders:', error);
            throw error;
        }
    }

    /**
     * Get distinct values for a specific field across all orders
     * @param {string} field - The field name to get distinct values for
     * @param {string} uploadId - Optional: specific upload ID to filter from
     * @returns {Promise<Array>} - Promise resolving to array of distinct values
     */
    async function getDistinctValues(field, uploadId = null) {
        try {
            const valueSet = new Set();
            
            await ordersStore.iterate((value) => {
                // Filter by upload ID if specified
                if (uploadId && value._uploadId !== uploadId) {
                    return;
                }
                
                // Add the field value to the set if it exists
                if (value[field] !== null && value[field] !== undefined) {
                    valueSet.add(value[field]);
                }
            });
            
            // Convert set to array and sort
            return Array.from(valueSet).sort();
        } catch (error) {
            console.error(`Error retrieving distinct values for ${field}:`, error);
            throw error;
        }
    }

    /**
     * Compare two uploads to identify changes
     * @param {string} uploadId1 - First upload ID
     * @param {string} uploadId2 - Second upload ID
     * @returns {Promise<Object>} - Promise resolving to change statistics
     */
    async function compareUploads(uploadId1, uploadId2) {
        try {
            const [orders1, orders2] = await Promise.all([
                getOrdersByUpload(uploadId1),
                getOrdersByUpload(uploadId2)
            ]);
            
            // Create maps for faster lookup
            const orderMap1 = new Map(orders1.map(order => [order.UniqueID, order]));
            const orderMap2 = new Map(orders2.map(order => [order.UniqueID, order]));
            
            // Find new, removed, and modified orders
            const newOrders = orders2.filter(order => !orderMap1.has(order.UniqueID));
            const removedOrders = orders1.filter(order => !orderMap2.has(order.UniqueID));
            
            // Find modified orders (same UniqueID but different data)
            const modifiedOrders = orders2.filter(order => {
                const oldOrder = orderMap1.get(order.UniqueID);
                if (!oldOrder) return false;
                
                // Compare fields excluding internal tracking fields
                return Object.entries(order).some(([key, value]) => {
                    if (key.startsWith('_')) return false;
                    return oldOrder[key] !== value;
                });
            });
            
            return {
                newCount: newOrders.length,
                removedCount: removedOrders.length,
                modifiedCount: modifiedOrders.length,
                new: newOrders,
                removed: removedOrders,
                modified: modifiedOrders
            };
        } catch (error) {
            console.error(`Error comparing uploads ${uploadId1} and ${uploadId2}:`, error);
            throw error;
        }
    }

    /**
     * Save a user setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise} - Promise resolving when setting is saved
     */
    async function saveSetting(key, value) {
        try {
            return await settingsStore.setItem(key, value);
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get a user setting
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default value if setting doesn't exist
     * @returns {Promise<any>} - Promise resolving to the setting value
     */
    async function getSetting(key, defaultValue = null) {
        try {
            const value = await settingsStore.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.error(`Error retrieving setting ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Clear all data from the database
     * @returns {Promise} - Promise resolving when data is cleared
     */
    async function clearAllData() {
        try {
            await Promise.all([
                ordersStore.clear(),
                uploadsStore.clear()
            ]);
            // Don't clear settings
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    // Public API
    return {
        saveUpload,
        getUploads,
        getUpload,
        getOrdersByUpload,
        getLatestData,
        getFilteredOrders,
        getOrder,
        searchOrders,
        getDistinctValues,
        compareUploads,
        saveSetting,
        getSetting,
        clearAllData
    };
})();
