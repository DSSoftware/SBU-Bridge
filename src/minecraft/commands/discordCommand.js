const minecraftCommand = require("../../contracts/minecraftCommand.js");

class DiscordLinkCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "discord";
    this.aliases = ["dc"];
    this.description = "Sends a link to the Discord server.";
    this.options = [];
  }

  onCommand(username, message, channel = "gc") {
    try {
      this.send(`/${channel} Join SBU: https://discord.gg/sbuni | Our guild discord: https://discord.gg/JRZJtEdX9D`);
    } catch (error) {
      this.send("/${channel} Something went wrong..");
    }
  }
}

module.exports = DiscordLinkCommand;
