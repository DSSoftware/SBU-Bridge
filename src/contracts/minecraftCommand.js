const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const helperFunctions = require("./helperFunctions.js");
const config = require("../../config.js");

class minecraftCommand {
  constructor(minecraft) {
    this.minecraft = minecraft;
  }

  getArgs(message) {
    const args = message.split(" ");

    args.shift();

    return args;
  }

  send(message, n = 1) {
    if (bot === undefined && bot._client.chat === undefined) {
      return;
    }

    const listener = async (msg) => {
      if (
        msg.toString().includes("You are sending commands too fast! Please slow down.") &&
        !msg.toString().includes(":")
      ) {
        bot.removeListener("message", listener);
        return;
      } else if (
        msg.toString().includes("You cannot say the same message twice!") === true &&
        msg.toString().includes(":") === false
      ) {
        bot.removeListener("message", listener);
        n++;

        if (n >= 3) {
          return;
        }

        await delay(250);
        return this.send(
          `${message} - ${helperFunctions.generateID(config.minecraft.bot.messageRepeatBypassLength)}`,
          n + 1,
        );
      }
    };

    bot.once("message", listener);
    bot.chat(message);

    setTimeout(() => {
      bot.removeListener("message", listener);
    }, 500);
  }

  onCommand(player, message) {
    throw new Error("Command onCommand method is not implemented yet!");
  }
}

module.exports = minecraftCommand;
