const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const Logger = require('#root/src/Logger.js');
const config = require('../../../config.js');
const hypixel = require('../../contracts/API/HypixelRebornAPI.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');

class topCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'activity';
        this.aliases = ['points', 'ap'];
        this.description = 'Sends your Activity Points';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            if (!config.minecraft.API.SCF.enabled) {
                return this.send(`/${channel} This command was disabled!`);
            }

            username = this.getArgs(message)[0] || username;

            let score = 0;
            let gexp = 0;

            const player_uuid = await getUUID(username);

            const guild = await hypixel.getGuild('player', player_uuid);
            if(guild?.members == undefined){
                throw "Wrong IGN or player is not in a guild!";
            }
            const player = (guild?.members ?? {}).find((member) => member.uuid == player_uuid);

            if (player === undefined) {
                throw 'Player is not in the Guild.';
            }

            gexp = player.weeklyExperience || 0;

            let placement_info = await SCFAPI.getMessagesSent(player_uuid, 1);

            score = placement_info.data.count ?? 0;

            const aps = gexp + 500 * score;

            this.send(
                `/${channel} ${username}'s Activity Points: ${aps.toLocaleString()} (GEXP: ${gexp.toLocaleString()}, Score: ${score.toLocaleString()})`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(
                `/${channel} [ERROR] ${error
                    .toString()
                    .replace('[hypixel-api-reborn] ', '')
                    .replace('For help join our Discord Server https://discord.gg/NSEBNMM', '')
                    .replace('Error:', '[ERROR]')}`
            );
        }
    }
}

module.exports = topCommand;
