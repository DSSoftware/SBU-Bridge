const minecraftCommand = require("../../contracts/minecraftCommand.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI.js");
const axios = require("axios");
const config = require("../../../config.js");
const { renderLore } = require("../../contracts/renderItem.js");
const { uploadImage } = require("../../contracts/API/imgurAPI.js");

class topCommand extends minecraftCommand {
  constructor(minecraft) {
    super(minecraft);

    this.name = "fweight";
    this.aliases = ["fw"];
    this.description = "Sends your farming weight.";
    this.options = [
      {
        name: "username",
        description: "Minecraft username",
        required: false,
      },
    ];
  }

  async onCommand(username, message, channel = "gc") {
    try {
      let passed_username = this.getArgs(message)[0];
      username = passed_username || username;
      const player_uuid = await getUUID(username);

      let farming_weight = `https://api.elitebot.dev/Weight/${player_uuid}`;

      let weight_info = await Promise.all([
        axios.get(farming_weight)
      ]).catch((error) => {
        throw "No player with that IGN found."
      });

      weight_info = weight_info[0].data ?? {};

      const selected_profile = weight_info?.selectedProfileId;
      let weight = "-";
      let position = "N/A";

      for(let profile of (weight_info?.profiles ?? [])){
        if(profile?.profileId == selected_profile){
          weight = (profile?.totalWeight ?? 0).toString().toFixed(2);
        }
      }

      let farming_lb = `https://api.elitebot.dev/Leaderboard/ranks/${player_uuid}/${selected_profile}`;

      let lb_info = await Promise.all([
        axios.get(farming_lb)
      ]).catch((error) => {});

      lb_info = lb_info[0].data ?? {};

      position = lb_info?.misc?.farmingweight ?? "N/A";
      if(position == -1){
        position = "N/A";
      }

      this.send(
        `/${channel} ${username}'s Farming Weight: ${weight}. Farming weight leaderboard position: ${position}.`,
      );
    } catch (error) {
      console.log(error);
      this.send(`/${channel} [ERROR] ${error}`);
    }
  }
}

module.exports = topCommand;