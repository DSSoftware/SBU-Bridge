const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.js");
const { EmbedBuilder } = require("discord.js");
const app = require("../../Application.js");
const AuthProvider = require("../AuthProvider.js");

module.exports = {
  name: `${config.minecraft.bot.guild_prefix}` + "stop",
  description: "Kills the bot.",

  execute: async (interaction) => {
    const user = interaction.member;
    const executor_id = user.id;
    const permission_required = "restart";

    let permission = false;

    const AuthData = new AuthProvider();
    permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

    if (!permission) {
      throw new HypixelDiscordChatBridgeError(
        "You do not have permission to use this command, or the Permission API is Down.",
      );
    }

    const restartEmbed = new EmbedBuilder()
      .setColor(15548997)
      .setTitle("Shutting down...")
      .setDescription("The bot will be shut down in 5 seconds.")
      .setFooter({
        text: "/help [command] for more information",
        iconURL: config.minecraft.API.SCF.logo,
      });

    interaction.followUp({ embeds: [restartEmbed] });

    setTimeout(() => {
      process.exit(123);
    }, 5000);
  },
};
