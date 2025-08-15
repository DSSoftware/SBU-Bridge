const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');
const config = require('#root/config.js').getConfig();
const { EmbedBuilder } = require('discord.js');
const AuthProvider = require('#root/src/AuthProvider.js');
const { exec } = require('child_process');
const Logger = require('#root/src/Logger.js');

module.exports = {
    name: `${config.minecraft.bot.guild_prefix}` + 'deploy',
    description: 'Deploys the new version from github.',

    execute: async (interaction) => {
        const user = interaction.member;
        const executor_id = user.id;
        const permission_required = 'debug';

        let permission = false;

        const AuthData = new AuthProvider();
        permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

        if (!permission) {
            throw new HypixelDiscordChatBridgeError(
                'You do not have permission to use this command, or the Permission API is Down.'
            );
        }

        const restartEmbed = new EmbedBuilder()
            .setColor(15548997)
            .setTitle('Restarting...')
            .setDescription('The bot is restarting. This might take few seconds.')
            .setFooter({
                text: '/help [command] for more information',
                iconURL: config.branding.logo
            });

        interaction.followUp({ embeds: [restartEmbed] });

        function updateCode() {
            exec('git pull', (error, stdout, stderr) => {
                Logger.warnMessage(stdout);
                exec('git fetch --all', (error, stdout, stderr) => {
                    Logger.warnMessage(stdout);
                    exec('git reset --hard', (error, stdout, stderr) => {
                        Logger.warnMessage(stdout);

                        process.exit(5);
                    });
                });
            });
        }

        updateCode();
    }
};
