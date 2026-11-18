const minecraftCommand = require('../../contracts/minecraftCommand.js');
const axios = require('axios');

class MiningWeightCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'mweight';
        this.aliases = ['mw', 'miningweight'];
        this.description = 'Sends your mining weight';
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

            let rank = 0;
            let top = 0;
            let cw = 0;

            try {
                let response = await axios.get(`https://ninjune.dev/api/coleweight?username=${username}`, {
                    timeout: 5000
                });

                if (!response.data.name){
                    this.send(`/${channel} ${username} not found `);
                    return;
                }

                let rank = res.data.rank;
                let top = res.data.percentile;
                let cw = res.data.coleweight;
                
                this.send(`/${channel} ${username}'s Coleweight: ${cw} Top(%): ${top}% Rank: ${rank}`);
            }
            catch (error){
                this.send(`/${channel} [ERROR] Failed to fetch your mining weight.`);
            }

        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MiningWeightCommand;