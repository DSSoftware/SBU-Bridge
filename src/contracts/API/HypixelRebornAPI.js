const HypixelAPIReborn = require('hypixel-api-reborn');
const config = require('#root/config.js').getConfig();

console.log(config.API.hypixelAPIKey);

const hypixel = new HypixelAPIReborn.Client(config.API.hypixelAPIkey, {
    cache: true
});

module.exports = hypixel;
