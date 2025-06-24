const chalk = require('chalk');
const config = require('#root/config.js').getConfig();
const SCFAPI = require('../API/utils/scfAPIHandler');

async function infoMessage(message) {
    SCFAPI.saveLogging("info", message);
    return console.log(chalk.inverse(`[${await getCurrentTime()}] Info >`) + ' ' + message);
}

async function discordMessage(message) {
    SCFAPI.saveLogging("discord", message);
    return console.log(chalk.bgMagenta.black(`[${await getCurrentTime()}] Discord >`) + ' ' + chalk.magenta(message));
}

async function replicationInfo(message) {
    SCFAPI.saveLogging("replica", message);
    return console.log(
        chalk.bgBlueBright.black(`[${await getCurrentTime()}] Replication >`) + ' ' + chalk.blueBright(message)
    );
}

async function minecraftMessage(message) {
    SCFAPI.saveLogging("minecraft", message);
    return console.log(
        chalk.bgGreenBright.black(`[${await getCurrentTime()}] Minecraft >`) + ' ' + chalk.greenBright(message)
    );
}

async function webMessage(message) {
    SCFAPI.saveLogging("web", message);
    return console.log(chalk.bgCyan.black(`[${await getCurrentTime()}] Web >`) + ' ' + chalk.cyan(message));
}

async function warnMessage(message) {
    SCFAPI.saveLogging("warn", message);
    console.log(chalk.bgYellow.black(`[${await getCurrentTime()}] Warning >`) + ' ' + chalk.yellow(message));
    if(config.logging.verbose){
        console.log(message);
    }
}

async function errorMessage(message) {
    SCFAPI.saveLogging("error", message);
    console.log(chalk.bgRedBright.black(`[${await getCurrentTime()}] Error >`) + ' ' + chalk.redBright(message));
    if(config.logging.verbose){
        console.log(message);
    }
}

async function broadcastMessage(message, location) {
    return console.log(chalk.inverse(`[${await getCurrentTime()}] ${location} Broadcast >`) + ' ' + message);
}

async function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

module.exports = {
    discordMessage,
    minecraftMessage,
    replicationInfo,
    webMessage,
    warnMessage,
    errorMessage,
    broadcastMessage,
    getCurrentTime,
    infoMessage
};
