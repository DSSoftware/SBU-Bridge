const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const Logger = require('#root/src/Logger.js');
const config = require('#root/config.js').getConfig();
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');

class topCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'top';
        this.aliases = ['pos'];
        this.description = 'Sends your placement in messages sent leaderboard.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            },
            {
                name: 'overall',
                description: "Overall flag, set to 'overall' to see overall ranking.",
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            if (!config.API.SCF.enabled) {
                return this.send(`/${channel} This command was disabled!`);
            }

            if(this.getCommandType(message).slice(1) == `pos`){
                const spot = parseInt(this.getArgs(message)[0]);
                if(spot > 10 || spot < 1){
                    return this.send(`/${channel} [ERROR] Position argument must be in a range from 1 to 10!`);
                }

                let top_info = await SCFAPI.getMessagesTop(config.minecraft.guild.guildId);
                let top_list = top_info.list;

                if (!top_list) {
                    return this.send(`/${channel} [ERROR] Somehow top has 0 players in it.`);
                }

                let member = top_list?.[spot-1] ?? {};
                if(member?.uuid == undefined){
                    return this.send(`/${channel} [ERROR] There is no player at that position!`);
                }

                let nick = member.nick ?? "N/A";
                let messages = member.score ?? "N/A";

                return this.send(`/${channel} Top ${spot} is ${nick} with ${messages} score.`);
            }

            let overall_flag = 0;
            let display_flag = '(GUILD)';
            let passed_username = this.getArgs(message)[0];
            if (this.getArgs(message)[0] == 'overall') {
                overall_flag = 1;
                passed_username = false;
                display_flag = '(OVERALL)';
            }
            if (this.getArgs(message)[1] == 'overall') {
                overall_flag = 1;
                display_flag = '(OVERALL)';
            }

            username = passed_username || username;

            const player_uuid = await getUUID(username);

            let placement_info = await SCFAPI.getCutoffScore(player_uuid, overall_flag);

            if (!placement_info.place) {
                return this.send(
                    `/${channel} Unable to retrieve place, maybe the player sent no messages? Try running !top <username> overall. ${display_flag}`
                );
            }

            this.send(
                `/${channel} ${username}'s place: ${placement_info.place} | Weekly Score: ${placement_info.score} ${display_flag}`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = topCommand;
