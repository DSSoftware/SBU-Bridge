const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.js");
const axios = require("axios");
const AuthProvider = require("../AuthProvider.js");

module.exports = {
  name: `${config.minecraft.bot.guild_prefix}` + "whoami",
  description: "Returns user permission info.",

  execute: async (interaction) => {
    const user = interaction.member;

    let perm_data = undefined;

    const AuthData = new AuthProvider();
    perm_data = await AuthData.permissionInfo(user);

    let player_role = perm_data?.name ?? "Member";
    let permissions = JSON.stringify(perm_data?.permissions ?? {});

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "Whoami" })
      .setDescription(
        `User permission info:\nPlatform Auth Provider: \`${perm_data?.provider ?? "None"}\`\nUser role: \`${player_role}\`\nUser permissions: \`\`\`${permissions}\`\`\``,
      )
      .setFooter({
        text: "/help for more info",
        iconURL: config.minecraft.API.SCF.logo,
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};
