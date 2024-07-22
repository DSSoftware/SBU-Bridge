const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.js');
const Logger = require('#root/src/Logger.js');
const playerAPI = require('../../contracts/API/PlayerDBAPI.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'link',
    description: 'Links the correct user account for the bridge.',
    options: [
        {
            name: 'nick',
            description: 'Minecraft nick.',
            type: 3,
            required: true
        }
    ],

    execute: async (interaction) => {
        const user = interaction.member;

        const minecraft_nick = interaction.options.getString('nick');
        const uuid = await playerAPI.getUUID(minecraft_nick);

        if(uuid == null){
            throw new HypixelDiscordChatBridgeError('Invalid IGN.');
        }

        let data = await SCFAPI.saveLinked(user.id, uuid, user.user.username).catch((error) => {
            Logger.warnMessage(error);
            throw new HypixelDiscordChatBridgeError(`Failed to connect to API. Try again later.`);
        });

        if ((data?.response ?? 'FAULT') == 'FAULT') {
            throw new HypixelDiscordChatBridgeError(data?.info ?? 'Failed to connect to API.');
        }

        const embed = new EmbedBuilder()
            .setColor(5763719)
            .setAuthor({ name: 'Successfully linked' })
            .setDescription(`Now you will send messages as \`${minecraft_nick}\`.`)
            .setFooter({
                text: '/help for more info',
                iconURL: config.minecraft.API.SCF.logo
            });

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
