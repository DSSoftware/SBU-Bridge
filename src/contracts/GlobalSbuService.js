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
            const api = service.getApiInstance();
            return await api.request(endpoint, options);
        } catch (error) {
            Logger.warnMessage('SBU API call failed:', error);
            throw error;
        }
    }

}

// Create a singleton instance
const globalSbuService = new GlobalSbuService();

module.exports = globalSbuService;