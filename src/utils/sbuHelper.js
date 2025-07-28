const config = require('#root/config.js').getConfig();
const Logger = require('../Logger.js');
const globalSbuService = require('../contracts/GlobalSbuService.js');

class SbuHelper {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        if (!config.API.SBU.enabled) {
            Logger.infoMessage('SBU service is disabled');
            this.isInitialized = true;
            return false;
        }

        try {
            // The GlobalSbuService should already be initialized by the main app
            // We just need to verify it's ready
            if (!globalSbuService.initialized) {
                await globalSbuService.initialize();
            }
            this.isInitialized = true;
            Logger.infoMessage('SBU helper initialized successfully');
            return true;
        } catch (error) {
            Logger.errorMessage('Failed to initialize SBU helper:', error.message);
            this.isInitialized = true;
            return false;
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    async makeApiCall(endpoint, options = {}) {
        await this.ensureInitialized();

        if (!this.isAvailable()) {
            throw new Error('SBU service is not available');
        }

        return globalSbuService.getService().makeApiCall(endpoint, options);
    }

    isAvailable() {
        return config.API.SBU.enabled && globalSbuService.initialized && globalSbuService.sbuService;
    }

    async safeApiCall(endpoint, options = {}) {
        try {
            // Auto-initialize if not already done
            await this.ensureInitialized();
            
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