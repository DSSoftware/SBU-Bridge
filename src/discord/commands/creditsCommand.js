const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'credits',
    description: 'Returns user permission info.',

    execute: async (interaction) => {
        let used_sources = "";

        // Developers
        used_sources += "**Developers**\n";
        used_sources += "Artem (Discord: @artemdev)\n";
        used_sources += "Rubiclex (Discord: @rubiclex)\n";

        // Used Projects
        used_sources += "\n**Used Projects**\n";
        used_sources += "[DuckySoLucky's Bridge](https://github.com/duckysolucky/hypixel-discord-chat-bridge)\n";
        used_sources += "[SCF API](https://github.com/SCF-Tools/SCF-API-Client)\n";

        let embed = new EmbedBuilder()
            .setColor(5763719)
            .setAuthor({ name: 'Credits' })
            .setDescription(used_sources);

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
