const config = require("../../../config.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI");
const Skykings = require("../../../API/utils/skykings");
const Blacklist = require("../../../API/utils/blacklist");
const SCFBlacklist = require("../../../API/utils/scfBlacklist");

class EndpointHandler {
  constructor(server) {
    this.server = server;
  }

  registerEvents() {
    const { web } = this.server;
    const guild = config.minecraft.bot.unique_id;
    web.post("/" + guild + "/invite", async (req, res) => {
      if (config.web.endpoints.invite === false) return;
      const username = req.body.username;
      const token = req.body.token;

      if (config.minecraft.API.SCF.key !== token) return;
      let success = false;
      const uuid = await getUUID(username);
      const skykings_scammer = await Skykings.lookupUUID(uuid);
      const blacklisted = await Blacklist.checkBlacklist(uuid);
      const scf_blacklisted = await SCFBlacklist.checkBlacklist(uuid);
      if (skykings_scammer !== true && blacklisted !== true && scf_blacklisted !== true) {
        bot.chat(`/guild invite ${username}`);
        success = true;
      }
      if (!success) {
        res.send({
          success: success,
          reason: "Player lookup failed OR another internal error occured",
        });
        return;
      }
      res.send({
        success: success,
      });
    });

    web.post("/" + guild + "/kick", async (req, res) => {
      if (config.web.endpoints.kick === false) return;
      const username = req.body.username;
      const reason = req.body.reason;
      const token = req.body.token;

      if (config.minecraft.API.SCF.key !== token) return;
      let success = false;
      bot.chat("/g kick " + username + " " + reason);
      success = true;
      if (!success) {
        res.send({
          success: success,
          reason: "Player lookup failed OR another internal error occured",
        });
        return;
      }
      res.send({
        success: success,
      });
    });
  }
}

module.exports = EndpointHandler;
