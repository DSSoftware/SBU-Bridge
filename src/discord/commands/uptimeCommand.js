const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'uptime',
    description: 'Shows the uptime of the bot.',

    execute: async (interaction) => {
        const uptimeEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🕐 Uptime!')
            .setDescription(`Online since <t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>`)
            .setFooter({
                text: '/help [command] for more information',
                iconURL: config.API.SCF.logo
            });

        interaction.followUp({ embeds: [uptimeEmbed] });
    }
};
