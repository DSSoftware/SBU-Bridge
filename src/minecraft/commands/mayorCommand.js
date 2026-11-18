const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const Logger = require('#root/src/Logger.js');

class MayorCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'mayor';
        this.aliases = [];
        this.description = 'Shows the current SkyBlock Mayor, Minister and perks.';
        this.options = [];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const data = await hypixelRequest('https://api.hypixel.net/v2/resources/skyblock/election').catch(
                (error) => {
                    throw error ?? 'Request to Hypixel API failed. Please try again!';
                }
            );

            if (!data?.success) {
                throw 'Failed to fetch election data from the Hypixel API.';
            }

            const mayor = data?.mayor;
            if (mayor == undefined) {
                throw 'No mayor data is currently available.';
            }

            const mayorName = mayor.name ?? 'Unknown';
            const mayorPerks = (mayor.perks ?? []).map((perk) => perk.name).join(', ') || 'None';

            const minister = mayor.minister;
            const ministerName = minister?.name;
            const ministerPerk = minister?.perk?.name;

            let responseParts = [`Mayor: ${mayorName} (${mayorPerks})`];

            if (ministerName) {
                responseParts.push(`Minister: ${ministerName}${ministerPerk ? ` (${ministerPerk})` : ''}`);
            }

            const current = data?.current;
            if (current?.candidates?.length > 0) {
                const totalVotes = current.candidates.reduce((sum, c) => sum + (c.votes ?? 0), 0);
                const leading = [...current.candidates].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0];
                const leadingPercent = totalVotes > 0 ? ((leading.votes / totalVotes) * 100).toFixed(1) : '0.0';

                responseParts.push(`Election in progress - Leading: ${leading.name} (${leadingPercent}%)`);
            }

            this.send(`/${channel} ${responseParts.join(' | ')}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = MayorCommand;
