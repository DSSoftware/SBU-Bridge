const HypixelDiscordChatBridgeError = require("../../contracts/errorHandler.js");
const config = require("../../../config.js");
const { EmbedBuilder } = require("discord.js");
const app = require("../../Application.js");
const AuthProvider = require("../AuthProvider.js");
const { spawn } = require('child_process');
const { exec } = require("child_process");

module.exports = {
  name: `${config.minecraft.bot.replication_prefix}` + "deploy",
  description: "Deploys the new version from github.",

  execute: async (interaction) => {
    const user = interaction.member;
    const executor_id = user.id;
    const permission_required = "debug";

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
      .setTitle("Restarting...")
      .setDescription("The bot is restarting. This might take few seconds.")
      .setFooter({
        text: "/help [command] for more information",
        iconURL: config.minecraft.API.SCF.logo,
      });

    interaction.followUp({ embeds: [restartEmbed] });

    function updateCode() {
      exec("git pull", (error, stdout, stderr) => {
        console.log(stdout);
        exec("git fetch --all", (error, stdout, stderr) => {
          console.log(stdout);
          exec("git reset --hard", (error, stdout, stderr) => {
            console.log(stdout);
            spawn(process.argv[0], process.argv.slice(1), {
              stdio: 'ignore',
            }).unref();

            process.exit(5);
          });
        });
      });
    }

    updateCode();
  },
};
