const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.js");
const AuthProvider = require("../AuthProvider.js");

module.exports = {
  name: `${config.minecraft.bot.replication_prefix}` + "simulate",
  description: "Simulation command, used for debug purposes.",
  options: [
    {
      name: "message",
      description: "Message to be sent.",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.member;
    const permission_required = "debug";

    let permission = false;

    const AuthData = new AuthProvider();
    permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

    if (!permission) {
      throw new HypixelDiscordChatBridgeError(
        "You do not have permission to use this command, or the Permission API is Down.",
      );
    }

    const simulated_message = interaction.options.getString("message");
    class SimulatedCommand {
      constructor(message) {
        this.message = message;
      }
      toString() {
        return this.message;
      }
      toMotd() {
        return this.message;
      }
    }
    debug_chat_handler.onMessage(new SimulatedCommand(simulated_message));

    const commandMessage = new EmbedBuilder().setColor(2067276).setTitle("Success");

    await interaction.followUp({ embeds: [commandMessage], ephemeral: true });
  },
};
