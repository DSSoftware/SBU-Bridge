const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const axios = require('axios');
const Logger = require('#root/src/Logger.js');

class topCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'fweight';
        this.aliases = ['fw', 'farmingweight'];
        this.description = 'Sends your farming weight.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            let passed_username = this.getArgs(message)[0];
            username = passed_username || username;
            const player_uuid = await getUUID(username);

            let farming_weight = `https://api.elitebot.dev/Weight/${player_uuid}`;

            let weight_info = await Promise.all([axios.get(farming_weight)]).catch((error) => {
                throw 'No player with that IGN found.';
            });

            weight_info = weight_info[0].data ?? {};

            let weight = 0;
            let position = 'N/A';

            for (let profile of weight_info?.profiles ?? []) {
                const profile_id = profile?.profileId;
                const profile_weight = profile?.totalWeight ?? 0;

                if (profile_weight >= weight) {
                    weight = profile_weight;

                    let farming_lb = `https://api.elitebot.dev/Leaderboard/ranks/${player_uuid}/${profile_id}`;

                    let lb_info = await Promise.all([axios.get(farming_lb)]).catch((error) => {});

                    lb_info = lb_info[0].data ?? {};

                    position = lb_info?.misc?.farmingweight ?? 'N/A';
                }
            }

            weight = weight.toFixed(2);
            if (position == -1 || position == 'N/A') {
                position = 'N/A';
            } else {
                position = `#${position}`;
            }

            this.send(
                `/${channel} ${username}'s Farming Weight: ${weight}. Farming weight leaderboard position: ${position}.`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = topCommand;
