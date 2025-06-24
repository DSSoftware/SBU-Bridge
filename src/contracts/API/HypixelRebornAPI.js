const HypixelAPIReborn = require('hypixel-api-reborn');
const config = require('#/config.js').getConfig();('../../../config.js');

const hypixel = new HypixelAPIReborn.Client(config.API.hypixelAPIkey, {
    cache: true
});

module.exports = hypixel;
