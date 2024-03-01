const minecraftCommand = require("../../contracts/minecraftCommand.js");

class HelpCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "help";
    this.aliases = ["info"];
    this.description = "Shows help menu";
    this.options = [];
  }

  onCommand(username, message, channel = "gc") {
    try {
      this.send(`/${channel} https://imgur.com/a/u03rJ1v`);
    } catch (error) {
      this.send("/${channel} Something went wrong..");
    }
  }
}

module.exports = HelpCommand;
