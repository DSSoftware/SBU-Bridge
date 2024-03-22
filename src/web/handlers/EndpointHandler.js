const config = require("../../../config.js");
const { getUUID } = require("../../contracts/API/PlayerDBAPI");
const hypixel = require("../../contracts/API/HypixelRebornAPI.js");
const Skykings = require("../../../API/utils/skykings");
const Blacklist = require("../../../API/utils/blacklist");
const SCFBlacklist = require("../../../API/utils/scfBlacklist");
const { getNetworth } = require("skyhelper-networth");
const getDungeons = require("../../../API/stats/dungeons.js");
const getSkills = require("../../../API/stats/skills.js");
const getSlayer = require("../../../API/stats/slayer.js");
const { getLatestProfile } = require("../../../API/functions/getLatestProfile.js");

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

      // Checking the requirements

      let skill_requirements = false;

      try {
        let passed_requirements = true;
        let masteries_failed = 0;
        let masteries_passed = false;

        let player = await hypixel.getPlayer(uuid);
        let profile = await getLatestProfile(uuid);

        const skyblockLevel = (profile?.profile?.leveling?.experience || 0) / 100 ?? 0;
        const dungeonsStats = getDungeons(profile.playerRes, profile.profile);
        const catacombsLevel = Math.round(dungeonsStats?.catacombs?.skill?.levelWithProgress || 0);

        // MAIN REQS
        if(skyblockLevel < config.minecraft.guildRequirements.requirements.skyblockLevel){
          passed_requirements = false;
        }
        if(catacombsLevel < config.minecraft.guildRequirements.requirements.catacombsLevel){
          passed_requirements = false;
        }
        // MAIN REQS
        
        if(config.minecraft.guildRequirements.requirements.masteries.masteriesEnabled === "true"){
          const networthCalculated = await getNetworth(profile.profile, profile.profileData?.banking?.balance || 0, {
            onlyNetworth: true,
            museumData: profile.museum,
          });

          const calculatedSkills = getSkills(profile.profile);

          const skillAverage = (
            Object.keys(calculatedSkills)
              .filter((skill) => !["runecrafting", "social"].includes(skill))
              .map((skill) => calculatedSkills[skill].levelWithProgress || 0)
              .reduce((a, b) => a + b, 0) /
            (Object.keys(calculatedSkills).length - 2)
          );

          const calculatedSlayers = getSlayer(profile.profile);
          let slayerXP = 0;
          Object.keys(calculatedSlayers).reduce(
            (acc, slayer) => {
              slayerXP += calculatedSlayers[slayer].xp ?? 0;
            }
          );
  
          // MASTERIES
          if(skyblockLevel < config.minecraft.guildRequirements.requirements.masteries.skyblockLevel){
            masteries_failed += 1;
          }
          if(catacombsLevel < config.minecraft.guildRequirements.requirements.masteries.catacombsLevel){
            masteries_failed += 1;
          }
          if((networthCalculated.networth ?? 0) < config.minecraft.guildRequirements.requirements.masteries.networth){
            masteries_failed += 1;
          }
          if(skillAverage < config.minecraft.guildRequirements.requirements.masteries.skillAverage){
            masteries_failed += 1;
          }
          if(slayerXP < config.minecraft.guildRequirements.requirements.masteries.slayerEXP){
            masteries_failed += 1;
          }

          if(masteries_failed <= config.minecraft.guildRequirements.requirements.masteries.maximumFailed){
            masteries_passed = true;
          }
          // MASTERIES
        }
        else{
          masteries_passed = true;
        }

        skill_requirements = passed_requirements && masteries_passed;
      }
      catch (e) {
        // Failed to lookup player data.
        console.log(e);
      }
      //

      if (skykings_scammer !== true && blacklisted !== true && scf_blacklisted !== true && skill_requirements === true) {
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

    web.post("/" + guild + "/inviteForce", async (req, res) => {
      if (config.web.endpoints.invite === false) return;
      const username = req.body.username;
      const uuid = req.body.uuid;
      const token = req.body.token;

      if (config.minecraft.API.SCF.key !== token) return;
      let success = false;
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
