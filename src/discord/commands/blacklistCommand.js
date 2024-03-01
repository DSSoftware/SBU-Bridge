const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.js");
const AuthProvider = require("../AuthProvider.js");

module.exports = {
  name: `${config.minecraft.bot.guild_prefix}` + "blacklist",
  description: "Blacklists the user from using the bot.",
  options: [
    {
      name: "arg",
      description: "Add or Remove",
      type: 3,
      required: true,
      choices: [
        {
          name: "Add",
          value: "add",
        },
        {
          name: "Remove",
          value: "remove",
        },
      ],
    },
    {
      name: "name",
      description: "Minecraft Username",
      type: 3,
      required: true,
    },
  ],

  execute: async (interaction) => {
    const user = interaction.member;
    const permission_required = "blacklist";

    let permission = false;

    const AuthData = new AuthProvider();
    permission = (await AuthData.permissionInfo(user)).permissions?.[permission_required] ?? false;

    if (!permission) {
      throw new HypixelDiscordChatBridgeError(
        "You do not have permission to use this command, or the Permission API is Down.",
      );
    }

    const name = interaction.options.getString("name");
    const arg = interaction.options.getString("arg").toLowerCase();

    if (arg == "add") {
      bot.chat(`/ignore add ${name}`);
    } else if (arg == "remove") {
      bot.chat(`/ignore remove ${name}`);
    } else {
      throw new HypixelDiscordChatBridgeError("Invalid Usage: `/ignore [add/remove] [name]`.");
    }

    const embed = new EmbedBuilder()
      .setColor(5763719)
      .setAuthor({ name: "Blacklist" })
      .setDescription(`Successfully executed \`/ignore ${arg} ${name}\``)
      .setFooter({
        text: "/help for more info",
        iconURL: config.minecraft.API.SCF.logo,
      });

    await interaction.followUp({
      embeds: [embed],
    });
  },
};
