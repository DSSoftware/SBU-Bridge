const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'credits',
    description: 'Returns user permission info.',

    execute: async (interaction) => {
        let used_sources = "";

        // Developers
        used_sources += "**Developers**\n";
        used_sources += "Artem (<@476365125922586635>)\n";
        used_sources += "Rubiclex (<@199351956320419840>)\n";

        // Used Projects
        used_sources += "\n**Used Projects**\n";
        used_sources += "A fork of [DuckySoLucky's Bridge](https://github.com/duckysolucky/hypixel-discord-chat-bridge)\n";
        used_sources += "Uses [SCF API](https://github.com/SCF-Tools/SCF-API-Client)\n";

        let embed = new EmbedBuilder()
            .setColor(5763719)
            .setAuthor({ name: 'Credits' })
            .setDescription(used_sources);

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
