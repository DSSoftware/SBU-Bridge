const Logger = require('../../src/Logger.js');

class SbuServiceWrapper {
    constructor() {
        this.service = null;
        this.isEnabled = false;
        this.pendingCalls = [];
        this.isReady = false;
    }

    async initialize(baseURL, authToken) {
        try {
            const SbuService = require('./sbuService.js');
            this.service = new SbuService(baseURL, authToken);
            await this.service.initialize();
            this.isEnabled = true;
            this.isReady = true;
            
            Logger.infoMessage('SBU Service wrapper initialized successfully');
            
            // Process any pending calls
            this.processPendingCalls();
            
            return true;
        } catch (error) {
            Logger.errorMessage('SBU Service wrapper initialization failed:', error.message);
            this.isEnabled = false;
            this.isReady = true; // Mark as ready even if failed, so pending calls can be rejected
            
            // Reject all pending calls
            this.pendingCalls.forEach(({ reject }) => {
                reject(new Error('SBU Service initialization failed'));
            });
            this.pendingCalls = [];
            
            return false;
        }
    }

    async makeApiCall(endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                // Queue the call until service is ready
                this.pendingCalls.push({ endpoint, options, resolve, reject });
                return;
            }

            if (!this.isEnabled || !this.service) {
                reject(new Error('SBU Service is not available'));
                return;
            }

            this.service.makeApiCall(endpoint, options)
                .then(resolve)
                .catch(reject);
        });
    }

    processPendingCalls() {
        if (!this.isEnabled || !this.service) {
            // Reject all pending calls
            this.pendingCalls.forEach(({ reject }) => {
                reject(new Error('SBU Service is not available'));
            });
        } else {
            // Process all pending calls
            this.pendingCalls.forEach(({ endpoint, options, resolve, reject }) => {
                this.service.makeApiCall(endpoint, options)
                    .then(resolve)
                    .catch(reject);
            });
        }
        this.pendingCalls = [];
    }

    isAvailable() {
        return this.isEnabled && this.service && this.isReady;
    }
}

// Create global instance
const globalSbuServiceWrapper = new SbuServiceWrapper();

module.exports = globalSbuServiceWrapper;