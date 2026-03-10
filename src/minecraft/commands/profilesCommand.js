const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');

class ProfilesCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'profiles';
        this.aliases = ['profile'];
        this.description = 'Lists a player\'s SkyBlock profiles.';
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
            const args = this.getArgs(message).filter((arg) => arg !== '');
            const targetUsername = args[0] || username;

            const uuidResponse = await getUUID(targetUsername, true);
            const targetUuid = uuidResponse?.uuid;
            const resolvedUsername = uuidResponse?.username ?? targetUsername;

            if (!targetUuid) {
                return this.send(`/${channel} Invalid username provided.`);
            }

            const profilesResponse = await hypixelRequest(
                `https://api.hypixel.net/v2/skyblock/profiles?key=${config.API.hypixelAPIkey}&uuid=${targetUuid}`
            );

            const profiles = profilesResponse?.profiles ?? [];
            if (profiles.length === 0) {
                return this.send(`/${channel} ${resolvedUsername} has no SkyBlock profiles.`);
            }

            const displayName = formatUsername(resolvedUsername, null);
            const profileList = profiles
                .map((profile) => formatProfileLabel(profile))
                .join(', ');

            this.send(`/${channel} ${displayName}'s Profiles (${profiles.length}): ${profileList}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

function formatProfileLabel(profile) {
    const cuteName = profile?.cute_name ?? 'Unknown';
    const modeLabel = getProfileModeLabel(profile?.game_mode);
    const selectedSuffix = profile?.selected ? ' *' : '';

    if (modeLabel == null) {
        return `${cuteName}${selectedSuffix}`;
    }

    return `${cuteName} (${modeLabel})${selectedSuffix}`;
}

function getProfileModeLabel(gameMode) {
    if (typeof gameMode !== 'string' || gameMode.length === 0) {
        return null;
    }

    const normalized = gameMode.toLowerCase();

    if (normalized === 'ironman') {
        return 'Ironman';
    }

    if (normalized === 'stranded') {
        return 'Stranded';
    }

    if (normalized === 'bingo') {
        return 'Bingo';
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

module.exports = ProfilesCommand;
