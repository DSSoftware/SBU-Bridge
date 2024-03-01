const minecraftCommand = require("../../contracts/minecraftCommand.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const axios = require("axios");
const config = require("../../../config.js");

class AccessoriesCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "top";
    this.aliases = [];
    this.description = "Sends your placement in messages sent leaderboard.";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
      {
        name: "overall",
        description: "Overall flag, set to 'overall' to see overall ranking.",
        required: false,
      },
    ];
  }

  async onCommand(username, message, channel = "gc") {
    try {
      if (!config.minecraft.API.SCF.enabled) {
        return this.send(`/${channel} This command was disabled!`);
      }

      let overall_flag = 0;
      let display_flag = "(GUILD)";
      let passed_username = this.getArgs(message)[0];
      if (this.getArgs(message)[0] == "overall") {
        overall_flag = 1;
        passed_username = false;
        display_flag = "(OVERALL)";
      }
      if (this.getArgs(message)[1] == "overall") {
        overall_flag = 1;
        display_flag = "(OVERALL)";
      }

      username = passed_username || username;

      const player_uuid = await getUUID(username);

      let placement_info = await Promise.all([
        axios.get(
          `https://sky.dssoftware.ru/api.php?method=getMessagesSent&uuid=${player_uuid}&api=${config.minecraft.API.SCF.key}&overall=${overall_flag}`,
        ),
      ]).catch((error) => {});

      placement_info = placement_info[0].data ?? {};

      if (placement_info.data.place == null || placement_info.data.place == undefined) {
        return this.send(
          `/${channel} Unable to retrieve place, maybe the player sent no messages? Try running !top <username> overall. ${display_flag}`,
        );
      }

      this.send(
        `/${channel} ${username}'s place: ${placement_info.data.place} | Messages sent: ${placement_info.data.count} ${display_flag}`,
      );
    } catch (error) {
      this.send(`/${channel} [ERROR] ${error}`);
    }
  }
}

module.exports = AccessoriesCommand;
