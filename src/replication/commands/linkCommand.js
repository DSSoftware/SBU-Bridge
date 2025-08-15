const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');
const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');
const playerAPI = require('../../contracts/API/PlayerDBAPI.js');
const SCFAPI = require('../../../API/utils/scfAPIHandler.js');

module.exports = {
    name: `${config.minecraft.bot.replication_prefix}` + 'link',
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

        if (uuid == null) {
            throw new HypixelDiscordChatBridgeError('Invalid IGN.');
        }

        let hypixel_info = await SCFAPI.hypixelRequest(
            `https://api.hypixel.net/v2/player?key=${config.API.hypixelAPIkey}&uuid=${uuid}`
        ).catch((error) => {});
        let tag = hypixel_info.player.socialMedia?.links?.DISCORD || undefined;

        if (tag != user.user.username) {
            throw new HypixelDiscordChatBridgeError(
                `Discord account on Hypixel is different from your current account!\n\nYour current user tag: ${user.user.username}\nLinked user tag: ${tag}`
            );
        }

        let data = await SCFAPI.saveLinked(user.id, uuid).catch((error) => {
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
                iconURL: config.branding.logo
            });

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
