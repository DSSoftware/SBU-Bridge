const HypixelAPIReborn = require('hypixel-api-reborn');
const config = require()

let instance = null;

class Hypixel {
    init(api_key) {
        console.log(api_key);
        
        if (!api_key) {
            throw "Invalid API Key";
        }

        if (instance) {
            return instance;
        }

        instance = new HypixelAPIReborn.Client(api_key, {
            cache: true
        });
    }
}

module.exports = Hypixel;
