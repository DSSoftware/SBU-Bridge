const HypixelDiscordChatBridgeError = require('../../contracts/errorHandler.js');
// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, CommandInteraction } = require('discord.js');
const config = require('#root/config.js').getConfig();
const Logger = require('../.././Logger.js');
const { ErrorEmbed } = require('../../contracts/embedHandler.js');

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await interaction.deferReply({ ephemeral: false }).catch((e) => {
                    Logger.warnMessage(e);
                });

                const command = interaction.client.commands.get(interaction.commandName);
                if (command === undefined) {
                    return;
                }

                if (command.moderatorOnly === true && isModerator(interaction) === false) {
                    throw new HypixelDiscordChatBridgeError("You don't have permission to use this command.");
                }

                if (command.requiresBot === true && isBotOnline() === false) {
                    throw new HypixelDiscordChatBridgeError(
                        "Bot doesn't seem to be connected to Hypixel. Please try again."
                    );
                }

                Logger.discordMessage(`${interaction.user.username} - [${interaction.commandName}]`);
                await command.execute(interaction);
            }
        } catch (error) {
            Logger.warnMessage(error);
            try {
                const errorMessage =
                    error instanceof HypixelDiscordChatBridgeError
                        ? ''
                        : 'Please try again later. The error has been sent to the Developers.\n\n';

                const errorEmbed = new ErrorEmbed(`${errorMessage}\`\`\`${error}\`\`\``);

                await interaction.editReply({ embeds: [errorEmbed] });

                if (error instanceof HypixelDiscordChatBridgeError === false) {
                    const username = interaction.user.username ?? interaction.user.tag ?? 'Unknown';
                    const commandOptions = JSON.stringify(interaction.options.data) ?? 'Unknown';
                    const commandName = interaction.commandName ?? 'Unknown';
                    const errorStack = error.stack ?? error ?? 'Unknown';
                    const userID = interaction.user.id ?? 'Unknown';

                    const errorLog = new ErrorEmbed(
                        `Command: \`${commandName}\`\nOptions: \`${commandOptions}\`\nUser ID: \`${userID}\`\nUser: \`${username}\`\n\`\`\`${errorStack}\`\`\``
                    );
                    interaction.client.channels.cache.get(config.discord.channels.loggingChannel).send({
                        content: `<@&${config.bot.commands.notifyContent}>`,
                        embeds: [errorLog]
                    });
                }
            } catch (e) {
                Logger.warnMessage(
                    "Failed to respond to interaction and wasn't able to send an error. Probably error with bot permissions."
                );
            }
        }
    }
};

function isBotOnline() {
    if (bot === undefined || bot._client.chat === undefined) {
        return false;
    }

    return true;
}

function isModerator(interaction) {
    const user = interaction.member;
    const userRoles = user.roles.cache.map((role) => role.id);

    return false;
}
