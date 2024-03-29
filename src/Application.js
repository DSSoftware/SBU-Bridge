const DiscordManager = require("./discord/DiscordManager.js");
const MinecraftManager = require("./minecraft/MinecraftManager.js");
const webManager = require("./web/WebsiteManager.js");
const ReplicationManager = require("./replication/ReplicationManager.js");
const config = require("../config.js");
const axios = require("axios");

class Application {
  async register() {
    this.discord = new DiscordManager(this);
    this.minecraft = new MinecraftManager(this);
    this.web = new webManager(this);

    this.discord.setBridge(this.minecraft);
    this.minecraft.setBridge(this.discord);

    if (config.discord.replication.enabled) {
      this.replication = new ReplicationManager(this);

      this.replication.setBridge(this.minecraft);
      this.replication.setBridge(this.discord);

      this.discord.setBridge(this.replication);
      this.minecraft.setBridge(this.replication);
    }
  }

  async connect() {
    this.discord.connect();
    this.minecraft.connect();
    this.web.connect();
    if (config.discord.replication.enabled) {
      this.replication.connect();
    }


    function sendStatus(){
      function isBotOnline() {
        if (bot === undefined || bot._client.chat === undefined) {
          return 0;
        }
      
        return 1;
      }

      let botConnected = isBotOnline();

      let statusURL = `https://sky.dssoftware.ru/api.php?method=updateBridgeStatus&api=${config.minecraft.API.SCF.key}&connected=${botConnected}`;

      axios
      .get(statusURL)
      .then(function (response) {
        // Successfully sent bot status.
      })
      .catch(function (error) {
        // Failed to send bot status...
      });
    }
    
    sendStatus();
    setInterval(sendStatus, 30000);
  }
}

module.exports = new Application();
