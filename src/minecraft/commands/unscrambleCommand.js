const { getRandomWord, scrambleWord } = require('../constants/words.js');
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const config = require('#root/config.js').getConfig();

const getAnswer = (message, answer) => {
    if (!message || !answer) return false;
    const cleanMessage = message.trim().toLowerCase();
    const cleanAnswer = answer.trim().toLowerCase();

    if (cleanMessage === cleanAnswer) {
        return true;
    }

    const message_parts = cleanMessage.split(/\s+/);
    if (message_parts[message_parts.length - 1] === cleanAnswer) {
        return true;
    }
    if (message_parts.length >= 2) {
        if (
            message_parts[message_parts.length - 1] + message_parts[message_parts.length - 2] ===
            cleanAnswer
        ) {
            return true;
        }
    }

    return false;
};

async function generateWord() {
    try {
        let word = await config.SCF.API.gtw.createWord();
        if (word) {
            return word;
        }
    } catch (e) {
        // Fall back to local word list on API error
    }
    return getRandomWord();
}

const cooldowns = new Map();

let last_used = 0;
let notification = false;

class unscrambleCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'unscramble';
        this.aliases = ['unscramble', 'us'];
        this.description = 'Unscramble the word and type it in chat to win!';
        this.options = [];
        this.cooldown = 15 * 1000;
    }

    async onCommand(username, message, channel = 'gc') {
        
        if (last_used + this.cooldown >= (new Date()).getTime()) {
            if (notification) return;
            notification = true;
            return this.send(`/${channel} You can only use !unscramble command once every ${this.cooldown / 1000} seconds :(`);
        }
        last_used = (new Date()).getTime();
        notification = false;

        try {
            const answer = await generateWord();
            const scrambledWord = scrambleWord(answer);

            const cooldownDuration = this.cooldown;

            if (cooldowns.has(this.name)) {
                const lastTime = cooldowns.get(this.name);
                const elapsedTime = Date.now() - lastTime;
                const remainingTime = cooldownDuration - elapsedTime;

                if (remainingTime > 0) {
                    return this.send(`/${channel} Please wait until current game is over.`);
                }
            }

            let answered = false;
            cooldowns.set(this.name, Date.now());

            const chatRegex =
                config.bot.other.messageMode === 'minecraft'
                    ? /^(?<chatType>§[0-9a-fA-F](Guild|Officer)) > (?<rank>§[0-9a-fA-F](?:\[.*?\])?)?\s*(?<username>[^§\s]+)\s*(?:(?<guildRank>§[0-9a-fA-F](?:\[.*?\])?))?\s*§f: (?<message>.*)/
                    : /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;

            const discordRegex = /^(?<player>[^\s»:>\s]+(?:\s+[^\s»:>\s]+)*)\s*[»:>\s]\s*(?<msg>.*)/;

            const startTime = Date.now();

            const listener = (rawMsg) => {
                const msgString = rawMsg.toString();
                const colouredMsg = rawMsg.toMotd ? rawMsg.toMotd() : msgString;
                const match = (config.bot.other.messageMode === 'minecraft' ? colouredMsg : msgString).match(chatRegex);

                if (!match || !match.groups) {
                    return;
                }

                let sender = match.groups.username;
                let text = match.groups.message;

                // Handle messages forwarded from Discord through the bridge bot
                const discordMatch = text.match(discordRegex);
                if (discordMatch && discordMatch.groups) {
                    sender = discordMatch.groups.player;
                    text = discordMatch.groups.msg;
                }

                if (getAnswer(text, answer)) {
                    answered = true;
                    bot.removeListener('message', listener);
                    cooldowns.delete(this.name);

                    this.send(
                        `/${channel} GG ${sender}! You've guessed it right! Time elapsed: ${(Date.now() - startTime).toLocaleString()}ms!`
                    );
                }
            };

            bot.on('message', listener);
            this.send(`/${channel} Unscramble the following word: "${scrambledWord.toLowerCase()}"`);

            setTimeout(() => {
                bot.removeListener('message', listener);
                cooldowns.delete(this.name);

                if (answered === false) {
                    this.send(`/${channel} Time's up! The answer was ${answer}`);
                }
            }, 30000);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error || 'Something went wrong..'}`);
        }
    }
}

module.exports = unscrambleCommand;
