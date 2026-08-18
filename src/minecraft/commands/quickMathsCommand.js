const minecraftCommand = require('../../contracts/minecraftCommand.js');
const config = require('#root/config.js').getConfig();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getAnswer = (message, answer) => {
    if (!message || answer === undefined || answer === null) return false;
    const cleanMessage = message.trim().toLowerCase();
    const cleanAnswer = answer.toString().trim().toLowerCase();

    if (cleanMessage === cleanAnswer) {
        return true;
    }

    const message_parts = cleanMessage.split(/\s+/);
    if (message_parts[message_parts.length - 1] === cleanAnswer) {
        return true;
    }

    return false;
};

let last_used = 0;
let notification = false;

class QuickMathsCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'quickmaths';
        this.aliases = ['qm'];
        this.description = 'Solve the equation in less than 10 seconds! Test your math skills!';
        this.options = [];

        this.cooldown = 15 * 1000;
    }

    async onCommand(username, message, channel = 'gc') {
        if (last_used + this.cooldown >= (new Date()).getTime()) {
            if (notification) return;
            notification = true;
            return this.send(`/${channel} You can only use !quickmaths command once every ${this.cooldown / 1000} seconds :(`);
        }
        last_used = (new Date()).getTime();
        notification = false;

        try {
            const operands = [Math.floor(Math.random() * 25), Math.floor(Math.random() * 25)];
            const operators = ['+', '-', '*', '/'];
            const operator = operators[Math.floor(Math.random() * operators.length)];

            const equation = `${operands[0]} ${operator} ${operands[1]}`;
            const answer = Math.round(eval(operands.join(operator)) * 10) / 10;
            const headStart = 250;

            this.send(`/${channel} ${username} What is ${equation}? (You have ${headStart}ms headstart)`);
            await delay(headStart);

            const startTime = Date.now();
            let answered = false;

            const chatRegex =
                config.bot.other.messageMode === 'minecraft'
                    ? /^(?<chatType>§[0-9a-fA-F](Guild|Officer)) > (?<rank>§[0-9a-fA-F](?:\[.*?\])?)?\s*(?<username>[^§\s]+)\s*(?:(?<guildRank>§[0-9a-fA-F](?:\[.*?\])?))?\s*§f: (?<message>.*)/
                    : /^(?<chatType>\w+) > (?:(?:\[(?<rank>[^\]]+)\] )?(?:(?<username>\w+)(?: \[(?<guildRank>[^\]]+)\])?: )?)?(?<message>.+)$/;

            const discordRegex = /^(?<player>[^\s»:>\s]+(?:\s+[^\s»:>\s]+)*)\s*[»:>\s]\s*(?<msg>.*)/;

            const listener = (rawMsg) => {
                const msgString = rawMsg.toString();
                const colouredMsg = rawMsg.toMotd ? rawMsg.toMotd() : msgString;
                const match = (config.bot.other.messageMode === 'minecraft' ? colouredMsg : msgString).match(chatRegex);

                if (!match || !match.groups) {
                    return;
                }

                let sender = match.groups.username;
                let text = match.groups.message;

                const discordMatch = text.match(discordRegex);
                if (discordMatch && discordMatch.groups) {
                    sender = discordMatch.groups.player;
                    text = discordMatch.groups.msg;
                }

                if (!getAnswer(text, answer.toString())) {
                    return;
                }

                answered = true;
                this.send(`/${channel} Correct, ${sender}! It took you ${(Date.now() - startTime).toLocaleString()}ms`);
                bot.removeListener('message', listener);
            };

            bot.on('message', listener);

            setTimeout(() => {
                bot.removeListener('message', listener);

                if (!answered) {
                    this.send(`/${channel} Time's up! The answer was ${answer}`);
                }
            }, 10000);
        } catch (error) {
            this.send(`/${channel} ${username} [ERROR] ${error || 'Something went wrong..'}`);
        }
    }
}

module.exports = QuickMathsCommand;
