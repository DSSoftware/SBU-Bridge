const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'ping',
    description: 'Shows the latency of the bot.',

    execute: async (interaction) => {
        const clientLatency = Date.now() - interaction.createdTimestamp;
        const apiLatency = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🏓 Pong!')
            .setDescription(`Client Latency: \`${clientLatency}ms\`\nAPI Latency: \`${apiLatency}ms\``)
            .setFooter({
                text: '/help [command] for more information',
                iconURL: config.API.SCF.logo
            });

        interaction.followUp({ embeds: [embed] });
    }
};
