const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.js");
const AuthProvider = require("../AuthProvider.js");

module.exports = {
  name: `${config.minecraft.bot.guild_prefix}` + `masskick`,
  description: "Kick the given users from the Guild.",
  options: [
    {
      name: "names",
      description: "Minecraft Usernames to kick, separated by spaces",
      type: 3,
      required: true,
    },
    {
      name: "reason",
      description: "Reason",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.member;
    const permission_required = "kick";

    let permission = false;

    const AuthData = new AuthProvider();
    permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

    if (!permission) {
      throw new HypixelDiscordChatBridgeError(
        "You do not have permission to use this command, or the Permission API is Down.",
      );
    }

    const [nameList, reason] = [interaction.options.getString("names"), interaction.options.getString("reason")];
    const names = nameList.split(" ");
    for (let name of names) {
      bot.chat("/g kick " + name + " " + reason);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "Kick" })
      .setDescription(`Successfully kicked ${names}`)
      .setFooter({
        text: `by @phoenix.owo | /help [command] for more information`,
        iconURL: config.minecraft.API.SCF.logo,
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};
