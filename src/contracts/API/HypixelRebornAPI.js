const HypixelAPIReborn = require('hypixel-api-reborn');
const config = require('#root/config.js').getConfig();

const hypixel = new HypixelAPIReborn.Client(config.API.hypixelAPIkey, {
    cache: true
});

module.exports = hypixel;
