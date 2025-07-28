const SbuService = require('../../API/utils/sbuService.js');
const config = require('#root/config.js').getConfig();
const Logger = require('../Logger.js');

class GlobalSbuService {
    constructor() {
        this.sbuService = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return this.sbuService;
        }

        if (!config.API.SBU.enabled) {
            Logger.infoMessage('SBU service is disabled in configuration');
            this.initialized = true;
            return null;
        }

        try {
            this.sbuService = new SbuService(
                config.API.SBU.baseURL,
                config.API.SBU.authToken
            );

            await this.sbuService.initialize();
            this.initialized = true;
            Logger.broadcastMessage('SBU Service initialized successfully', 'Global');
            
            return this.sbuService;
        } catch (error) {
            Logger.warnMessage('Failed to initialize SBU Service:', error);
            this.initialized = true; // Mark as initialized even if failed
            throw error;
        }
    }

    getService() {
        if (!this.initialized || !this.sbuService) {
            throw new Error('SBU Service not initialized. Call initialize() first.');
        }
        return this.sbuService;
    }

    async makeApiCall(endpoint, options = {}) {
        try {
            const service = this.getService();
            // Use the service's makeApiCall method directly
            return await service.makeApiCall(endpoint, options);
        } catch (error) {
            Logger.warnMessage('SBU API call failed:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const globalSbuService = new GlobalSbuService();

module.exports = globalSbuService;