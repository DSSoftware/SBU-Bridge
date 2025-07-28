const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SbuService {
    constructor(baseURL, authToken) {
        this.baseURL = baseURL;
        this.authToken = authToken; // Your initial auth token (64+ chars)
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenFilePath = path.join(__dirname, '../../tokens/tokens.json');

        // Add state management to prevent multiple concurrent operations
        this.isInitializing = false;
        this.isRefreshing = false;
        this.initializationPromise = null;
        this.refreshPromise = null;
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 100; // Minimum 100ms between requests
        this.requestQueue = [];
        this.isProcessingQueue = false;

        // Create axios instance with better defaults
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 10000, // Reduced from 30s to 10s
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor with rate limiting
        this.api.interceptors.request.use(
            async (config) => {
                // Add rate limiting
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequestTime;
                if (timeSinceLastRequest < this.minRequestInterval) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
                    );
                }
                this.lastRequestTime = Date.now();

                if (this.accessToken) {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Improved response interceptor
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Only handle 401s if this isn't already a retry and we're not in manual retry mode
                if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._retryAttempted) {
                    originalRequest._retry = true;

                    try {
                        console.log('Axios interceptor handling 401, refreshing token...');
                        
                        if (this.refreshToken) {
                            await this.refreshAccessToken();
                        } else {
                            await this.initialize();
                        }
                        
                        // Update the authorization header
                        originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
                        
                        console.log('Token refreshed by interceptor, retrying request');
                        return this.api(originalRequest);
                        
                    } catch (refreshError) {
                        console.error('Token refresh failed in interceptor:', refreshError.message);
                        // Don't retry again, let the error bubble up
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Check if token is expired or about to expire
     */
    isTokenExpired() {
        if (!this.accessToken) return true;
        
        try {
            // Decode JWT payload (simple base64 decode, no verification)
            const payload = JSON.parse(Buffer.from(this.accessToken.split('.')[1], 'base64').toString());
            const now = Math.floor(Date.now() / 1000);
            
            // Check if token expires within the next 5 minutes (300 seconds)
            return payload.exp && (payload.exp - now) < 300;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Assume expired if we can't parse
        }
    }

    /**
     * Ensure we have a valid token, with proper state management
     */
    async ensureValidToken() {
        // If we're already refreshing, wait for that to complete
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        // If we're initializing, wait for that to complete
        if (this.isInitializing && this.initializationPromise) {
            return this.initializationPromise;
        }

        // If we don't have a token, initialize
        if (!this.accessToken) {
            return this.initialize();
        }

        // Check if token is expired or about to expire
        if (this.isTokenExpired()) {
            console.log('Token is expired or about to expire, refreshing...');
            if (this.refreshToken) {
                return this.refreshAccessToken();
            } else {
                return this.initialize();
            }
        }

        // Token is valid
        return Promise.resolve();
    }

    /**
     * Initialize the auth service - load tokens and login if needed
     */
    async initialize() {
        // Prevent multiple concurrent initializations
        if (this.isInitializing) {
            return this.initializationPromise;
        }

        this.isInitializing = true;
        this.initializationPromise = this._doInitialize();

        try {
            const result = await this.initializationPromise;
            return result;
        } finally {
            this.isInitializing = false;
            this.initializationPromise = null;
        }
    }

    async _doInitialize() {
        const maxRetries = 2;
        const baseDelay = 2000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to load existing tokens
                await this.loadTokens();

                // If we have an access token, verify it
                if (this.accessToken) {
                    try {
                        await this.verifyToken();
                        console.log('Existing access token is valid');
                        return true;
                    } catch (error) {
                        if (error.message === 'Token expired') {
                            console.log('Access token expired, attempting refresh...');
                            // Try to refresh if we have a refresh token
                            if (this.refreshToken) {
                                try {
                                    await this._doRefreshAccessToken();
                                    console.log('Successfully refreshed access token');
                                    return true;
                                } catch (refreshError) {
                                    console.log('Refresh token failed:', refreshError.message);
                                    // Clear invalid tokens
                                    this.accessToken = null;
                                    this.refreshToken = null;
                                }
                            }
                        } else {
                            console.log('Token verification failed:', error.message);
                            // Clear invalid tokens
                            this.accessToken = null;
                            this.refreshToken = null;
                        }
                    }
                }

                // If we reach here, we need to login with auth token
                console.log('Logging in with auth token...');
                await this.login();
                console.log('Successfully logged in with auth token');
                return true;

            } catch (error) {
                console.error(`Init attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error('Failed to initialize auth service after all retries:', error.message);
                    throw error;
                }

                // Longer delay between retries
                const delay = baseDelay * attempt;
                console.log(`Retrying init in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Login with the initial auth token
     */
    async login() {
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                token: this.authToken
            }, {
                timeout: 5000
            });

            this.accessToken = response.data.accessToken;
            this.refreshToken = response.data.refreshToken;

            // Save tokens to file
            await this.saveTokens();

            console.log('Login successful');
            return response.data;

        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Refresh the access token using refresh token
     */
    async refreshAccessToken() {
        // Prevent multiple concurrent refreshes
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this._doRefreshAccessToken();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    async _doRefreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await axios.post(`${this.baseURL}/api/auth/refresh`, {
                refreshToken: this.refreshToken
            }, {
                timeout: 5000 // Shorter timeout for refresh
            });

            this.accessToken = response.data.accessToken;

            // Save updated tokens
            await this.saveTokens();

            console.log('Access token refreshed successfully');
            return response.data;

        } catch (error) {
            console.error('Token refresh failed:', error.response?.data || error.message);
            // Clear invalid refresh token
            this.refreshToken = null;
            await this.saveTokens();
            throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Verify current access token
     */
    async verifyToken() {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await axios.get(`${this.baseURL}/api/auth/verify`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                },
                timeout: 5000
            });

            return response.data;

        } catch (error) {
            // If we get a 401, the token is expired/invalid
            if (error.response?.status === 401) {
                console.log('Token verification failed with 401 - token is expired/invalid');
                // Don't throw here, let the caller handle the refresh
                throw new Error('Token expired');
            }
            
            // For other errors, throw with more context
            throw new Error(`Token verification failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Logout from current session
     */
    async logout() {
        if (!this.refreshToken) {
            console.log('No refresh token to logout');
            return;
        }

        try {
            await axios.post(`${this.baseURL}/api/auth/logout`, {
                refreshToken: this.refreshToken
            });

            console.log('Logout successful');

        } catch (error) {
            console.error('Logout failed:', error.response?.data || error.message);
        } finally {
            // Clear tokens regardless of logout success
            this.accessToken = null;
            this.refreshToken = null;
            await this.saveTokens();
        }
    }

    /**
     * Logout from all sessions
     */
    async logoutAll() {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await this.api.post('/api/auth/logout-all');

            // Clear local tokens
            this.accessToken = null;
            this.refreshToken = null;
            await this.saveTokens();

            console.log('Logged out from all devices');
            return response.data;

        } catch (error) {
            console.error('Logout all failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Save tokens to file
     */
    async saveTokens() {
        try {
            const tokens = {
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                lastUpdated: new Date().toISOString()
            };

            await fs.writeFile(this.tokenFilePath, JSON.stringify(tokens, null, 2));
        } catch (error) {
            console.error('Failed to save tokens:', error.message);
        }
    }

    /**
     * Load tokens from file
     */
    async loadTokens() {
        try {
            const data = await fs.readFile(this.tokenFilePath, 'utf8');
            const tokens = JSON.parse(data);

            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;

            console.log('Tokens loaded from file');
        } catch (error) {
            // File doesn't exist or is invalid, that's okay
            console.log('No existing tokens found');
        }
    }

    /**
     * Get authenticated API instance
     */
    getApiInstance() {
        return this.api;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Make an authenticated API call
     */
    async makeApiCall(endpoint, options = {}) {
        try {
            // Proactively ensure we have a valid token
            await this.ensureValidToken();

            console.log('Making API call:', {
                endpoint,
                method: options.method || 'GET',
                baseURL: this.api.defaults.baseURL,
                hasData: !!options.data
            });

            // Use the configured axios instance which already handles auth
            const response = await this.api({
                url: endpoint,
                method: options.method || 'GET',
                data: options.data,
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            return response.data;

        } catch (error) {
            // If we get a 401 and haven't already retried, try to refresh
            if (error.response?.status === 401 && !options._retryAttempted) {
                console.log('Received 401, attempting token refresh...');
                try {
                    if (this.refreshToken) {
                        await this.refreshAccessToken();
                    } else {
                        await this.initialize();
                    }
                    
                    // Retry the request with the new token
                    return await this.makeApiCall(endpoint, { ...options, _retryAttempted: true });
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError.message);
                    throw refreshError;
                }
            }

            console.error('API call failed:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method
            });
            throw error;
        }
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const { endpoint, options, resolve, reject } = this.requestQueue.shift();

            try {
                // Ensure we have a valid token
                await this.ensureValidToken();

                console.log('Making queued API call:', {
                    endpoint,
                    method: options.method || 'GET',
                    queueLength: this.requestQueue.length
                });

                const response = await this.api({
                    url: endpoint,
                    method: options.method || 'GET',
                    data: options.data,
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });

                resolve(response.data);

                // Small delay between queued requests
                if (this.requestQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.minRequestInterval));
                }

            } catch (error) {
                // Handle 401 errors with token refresh and retry
                if (error.response?.status === 401 && !options._retryAttempted) {
                    console.log('Received 401 in queue, attempting token refresh...');
                    try {
                        if (this.refreshToken) {
                            await this.refreshAccessToken();
                        } else {
                            await this.initialize();
                        }
                        
                        // Put the request back at the front of the queue with retry flag
                        this.requestQueue.unshift({
                            endpoint,
                            options: { ...options, _retryAttempted: true },
                            resolve,
                            reject
                        });
                        
                        console.log('Token refreshed, retrying queued request');
                        continue; // Continue to next iteration to retry this request
                        
                    } catch (refreshError) {
                        console.error('Token refresh failed in queue:', refreshError.message);
                        reject(refreshError);
                        continue;
                    }
                }

                console.error('Queued API call failed:', {
                    endpoint,
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }
}

module.exports = SbuService;