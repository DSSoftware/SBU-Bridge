const cluster = require("node:cluster");
const axios = require("axios");
const config = require("./config.js");
const Logger = require("./src/Logger.js");

const webhook_url = config.minecraft.API.SCF.fail_webhook;

const notifications_url = `https://sky.dssoftware.ru/api.php?method=getBotState&api=${config.minecraft.API.SCF.key}`;
const fetch = require("node-fetch");

if (cluster.isPrimary) {
  function messageHandler(message) {
    if (message.event_id && message.event_id === "exceptionCaught") {
      var params = {
        embeds: [
          {
            title: "Bot Failed",
            fields: [
              {
                name: "Exception Data",
                value: `\`\`\`${message.stack}\`\`\`\`\`\`${message.exception}\`\`\`\nInstance: \`${config.minecraft.bot.unique_id}\``,
              },
            ],
          },
        ],
      };

      fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(params),
      });
    }
  }

  let process_state = false;
  let forced_shutdown = false;

  function reforkProcess() {
    cluster.fork();

    process_state = true;

    for (const id in cluster.workers) {
      cluster.workers[id].on("message", messageHandler);
    }
  }

  function checkInstructions() {
    if (forced_shutdown) {
      return;
    }
    let requested_state = 1;

    axios
      .get(notifications_url)
      .then(function (response) {
        let new_state = 1;
        if (response.data.data === 0) {
          new_state = 0;
        }

        requested_state = new_state;
      })
      .catch(function (error) {
        requested_state = 1;
      })
      .then(() => {
        if (requested_state === 1) {
          if (!process_state) {
            reforkProcess();
          }
        } else {
          if (process_state) {
            for (const id in cluster.workers) {
              cluster.workers[id].kill();
            }
          }
        }

        //console.log("Checked state:", requested_state);
      });
  }

  checkInstructions();
  setInterval(checkInstructions, 30000);

  cluster.on("exit", function (worker, code, signal) {
    process_state = false;
    if (code == 123) {
      var params = {
        content: `<@&${config.discord.commands.notifyRole}>`,
        embeds: [
          {
            title: "Bot Stopped",
            fields: [
              {
                name: "Exception Data",
                value: `Something bad has happened to the bot, maybe it's banned or muted. The app will shut down.`,
              },
            ],
          },
        ],
      };

      fetch(webhook_url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(params),
      });

      forced_shutdown = true;

      Logger.errorMessage("The bot was shut down! Continuing to run the parent process...");

      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
    }

    if (code == 5) {
      Logger.warnMessage("The bot is deploying the new version...");
      process.exit();
    }
    console.log(`Fork exited with exit code ${code}.`);
  });
}

if (cluster.isWorker) {
  process.on("uncaughtException", (error) => {
    console.log(error);
    process.send({
      event_id: "exceptionCaught",
      exception: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
  const app = require("./src/Application.js");

  ("use strict");

  app
    .register()
    .then(() => {
      app.connect();
    })
    .catch((error) => {
      console.error(error);
    });
}
