const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getNetworth } = require('../../../API/utils/skykings.js');
const { formatNumber, formatUsername } = require('../../contracts/helperFunctions.js');
const { getUsername } = require('../../contracts/API/PlayerDBAPI.js');
const Logger = require('#root/src/Logger.js');

class NetWorthCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'networth';
        this.aliases = ['nw'];
        this.description = 'Networth of specified user.';
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
            username = this.getArgs(message)[0] || username;

            const data = await getLatestProfile(username);

            const profile = await getNetworth(
                {
                    profiles: data.profiles
                },
                data.uuid,
                {
                    profileName: data.profileData?.cute_name,
                    top: 25,
                    includeBank: true,
                    includeAllEntries: false
                }
            );

            const displayUsername = await getUsername(data.uuid);
            username = formatUsername(displayUsername ?? username, profile.profile?.mode);

            const totals = profile.totals ?? {};
            const networth = formatNumber(totals.networth ?? 0);
            const purse = formatNumber(totals.purse ?? 0);
            const bank = formatNumber((totals.bank ?? 0) + (totals.coop_bank ?? 0));
            const itemsValue = formatNumber(totals.items_value ?? 0);
            const petsValue = formatNumber(totals.pets_value ?? 0);
            const profileName = profile.profile?.name ?? data.profileData?.cute_name ?? 'Unknown';

            this.send(
                `/${channel} ${username}'s Networth is ${networth} | Purse: ${purse} | Bank: ${bank} | Items: ${itemsValue} | Pets: ${petsValue} | Profile: ${profileName}`
            );
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error.message ?? error}`);
        }
    }
}

module.exports = NetWorthCommand;
