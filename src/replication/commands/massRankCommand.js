const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');
const { EmbedBuilder } = require('discord.js');
const config = require('#root/config.js').getConfig();
const AuthProvider = require('#root/src/AuthProvider.js');

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + `rank`,
    description: 'Set the users\' rank in bulk.',
    options: [
        {
            name: 'names',
            description: 'Minecraft Usernames to set rank of, separated by spaces',
            type: 3,
            required: true
        },
        {
            name: 'rank',
            description: 'Rank to assign.',
            type: 3,
            required: true
        }
    ],

    execute: async (interaction) => {
        const user = interaction.member;
        const permission_required = 'kick';

        let permission = false;

        const AuthData = new AuthProvider();
        permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

        if (!permission) {
            throw new HypixelDiscordChatBridgeError(
                'You do not have permission to use this command, or the Permission API is Down.'
            );
        }

        const [nameList, rank] = [interaction.options.getString('names'), interaction.options.getString('rank')];
        const names = nameList.split(' ');
        for (let name of names) {
            bot.chat('/g setrank ' + name + ' ' + rank);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const embed = new EmbedBuilder()
            .setColor(5763719)
            .setAuthor({ name: 'Set rank' })
            .setDescription(`Successfully set rank of ${names}`)
            .setFooter({
                text: `/help [command] for more information`,
                iconURL: config.branding.logo
            });

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
