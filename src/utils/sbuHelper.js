const config = require('#root/config.js').getConfig();
const Logger = require('../Logger.js');

class SbuHelper {
    constructor() {
        this.service = null;
        this.isEnabled = false;
        this.isInitialized = false;
    }

    async initialize() {
        if (!config.API.SBU.enabled) {
            Logger.infoMessage('SBU service is disabled');
            this.isInitialized = true;
            return false;
        }

        try {
            const SbuService = require('../../API/utils/sbuService.js');
            this.service = new SbuService(config.API.SBU.baseURL, config.API.SBU.authToken);
            await this.service.initialize();
            this.isEnabled = true;
            this.isInitialized = true;
            Logger.infoMessage('SBU service initialized successfully');
            return true;
        } catch (error) {
            Logger.errorMessage('Failed to initialize SBU service:', error.message);
            this.isEnabled = false;
            this.isInitialized = true;
            return false;
        }
    }

    async makeApiCall(endpoint, options = {}) {
        if (!this.isInitialized) {
            throw new Error('SBU service not initialized');
        }

        if (!this.isEnabled || !this.service) {
            throw new Error('SBU service is not available');
        }

        return this.service.makeApiCall(endpoint, options);
    }

    isAvailable() {
        return this.isEnabled && this.service && this.isInitialized;
    }

    async safeApiCall(endpoint, options = {}) {
        try {
            if (!this.isAvailable()) {
                Logger.warnMessage('SBU service not available, skipping API call');
                return null;
            }
            return await this.makeApiCall(endpoint, options);
        } catch (error) {
            Logger.warnMessage('SBU API call failed:', error.message);
            return null;
        }
    }
}

// Create singleton
const sbuHelper = new SbuHelper();

module.exports = sbuHelper;