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

                if (top_info?.data == undefined || top_info?.data?.length == 0) {
                    return this.send(`/${channel} [ERROR] Somehow top has 0 players in it.`);
                }

                let member = top_info?.data?.[spot-1] ?? {};
                if(member?.uuid == undefined){
                    return this.send(`/${channel} [ERROR] There is no player at that position!`);
                }

                let nick = member?.nick ?? "N/A";
                let messages = member?.count ?? "N/A";

                return this.send(`/${channel} Top ${spot} is ${nick} with ${messages} score.`);
            }

            if (this.getArgs(message)[0] == 'weekly') {
                if (!config.minecraft.commands.integrate_images) {
                    return this.send(`/${channel} This sub-command was disabled!`);
                }
                let top_info = await SCFAPI.getMessagesTop(config.minecraft.guild.guildId);

                if (top_info?.data == undefined || top_info?.data?.length == 0) {
                    return this.send(`/${channel} [ERROR] Somehow top has 0 players in it.`);
                }

                let Name = `§6Guild Top:`;
                let Lore = [];
                let place = 0;

                top_info?.data.forEach((element) => {
                    place++;
                    let place_color = '§7';
                    if (place == 1) {
                        place_color = '§6';
                    }
                    if (place == 2) {
                        place_color = '§f';
                    }
                    if (place == 3) {
                        place_color = '§c';
                    }
                    let info = `§7${place_color}${place}. ${element.nick} - ${element.count} Score§7`;

                    Lore.push(info);
                });

                Lore.push(`§f`);

                Lore.unshift(`§f`);
                Lore.unshift(`§7Players Logged: ${top_info?.players ?? 0}.`);

                const renderedItem = await renderLore(Name, Lore);
                const upload = await uploadImage(renderedItem);

                if (!config.minecraft.commands.integrate_images) {
                    this.send(`/${channel} Guild Top was sent in Discord.`);
    
                    this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                    return;
                }

                this.send(`/${channel} Guild Top: ${upload.data.link}`);

                return;
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

            let placement_info = await SCFAPI.getMessagesSent(player_uuid, overall_flag);

            if (placement_info.data.place == null || placement_info.data.place == undefined) {
                return this.send(
                    `/${channel} Unable to retrieve place, maybe the player sent no messages? Try running !top <username> overall. ${display_flag}`
                );
            }

            this.send(
                `/${channel} ${username}'s place: ${placement_info.data.place} | Weekly Score: ${placement_info.data.count} ${display_flag}`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = topCommand;
