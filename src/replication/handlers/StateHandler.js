const config = require("../../../config.js");
const Logger = require("../../Logger.js");

class StateHandler {
  constructor(discord) {
    this.discord = discord;
  }

  async onReady() {
    Logger.replicationInfo("Client ready, logged in as " + this.discord.client.user.tag);
    this.discord.client.user.setPresence({
      activities: [{ name: `/help | by @artemdev` }],
    });

    const channel = await this.getChannel("Guild");
    if (channel === undefined) {
      return Logger.errorMessage(`Channel "Guild" not found!`);
    }

    channel.send({
      embeds: [
        {
          author: { name: `Chat Bridge is Online` },
          color: 2067276,
        },
      ],
    });
  }

  async onClose() {
    const channel = await this.getChannel("Guild");
    if (channel === undefined) {
      return Logger.errorMessage(`Channel "Guild" not found!`);
    }

    await channel.send({
      embeds: [
        {
          author: { name: `Chat Bridge is Offline` },
          color: 15548997,
        },
      ],
    });
  }

  async getChannel(type) {
    if (typeof type !== "string" || type === undefined) {
      return Logger.errorMessage(`Channel type must be a string!`);
    }

    switch (type.replace(/§[0-9a-fk-or]/g, "").trim()) {
      case "Guild":
        return this.discord.client.channels.cache.get(config.discord.replication.channels.guild);
      case "Officer":
        return this.discord.client.channels.cache.get(config.discord.replication.channels.officer);
      case "Logger":
        return this.discord.client.channels.cache.get(config.discord.replication.channels.logging);
      default:
        return this.discord.client.channels.cache.get(config.discord.replication.channels.debug);
    }
  }
}

module.exports = StateHandler;
