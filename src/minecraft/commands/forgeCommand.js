const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const { hypixelRequest } = require('../../../API/utils/scfAPIHandler.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { renderLore } = require('../../contracts/renderItem.js');
const { uploadImage } = require('../../contracts/API/imgurAPI.js');
const config = require('#root/config.js').getConfig();
const Logger = require('#root/src/Logger.js');

class ForgeCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'forge';
        this.aliases = ['forges'];
        this.description = 'Shows active Dwarven Forge processes.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            },
            {
                name: 'profile',
                description: 'Profile fruit name (optional)',
                required: false
            }
        ];
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            const args = this.getArgs(message).filter((arg) => arg !== '');
            const targetUsername = args[0] || username;
            const targetProfile = args.length >= 2 ? args[1] : null;

            const context = await resolveForgeContext(targetUsername, targetProfile);
            const displayName = formatUsername(context.username, context.profileData?.game_mode);
            const profileName = context.profileData?.cute_name ?? 'Unknown';

            const miningCore = context.memberData?.mining_core ?? {};
            const forgeData = context.memberData?.forge ?? {};
            const processes = extractForgeProcesses(miningCore, forgeData);

            if (processes.length === 0) {
                this.send(`/${channel} ${displayName}'s Forge (${profileName}) | No active forge processes.`);
                return;
            }

            const now = Date.now();
            const processDetails = processes
                .map((entry) => normalizeForgeProcess(entry, now))
                .sort((a, b) => sortableRemainingMs(a.remainingMs) - sortableRemainingMs(b.remainingMs));

            const readyCount = processDetails.filter((entry) => entry.ready).length;
            const notReadyCount = processDetails.length - readyCount;
            const readyItems = processDetails.filter((entry) => entry.ready);

            const readySummary = readyItems.length > 0
                ? readyItems.slice(0, 3).map((entry) => entry.itemName).join(', ')
                : 'None';

            const summary = `${displayName}'s Forge (${profileName}) | Ready ${readyCount} (${readySummary}) | Not Ready ${notReadyCount}`;

            const lore = [
                `§7Profile: §a${profileName}`,
                `§7Ready: §a${readyCount} §7(${readySummary})`,
                `§7Not Ready: §6${notReadyCount}`,
                '§f',
                ...processDetails.slice(0, 8).map((entry) => `§7${entry.slotLabel}: §e${entry.itemName}`)
            ];

            const renderedItem = await renderLore(`§6${displayName}'s Forge`, lore);
            const upload = await uploadImage(renderedItem);

            if (!config.minecraft.commands.integrate_images) {
                this.send(`/${channel} ${summary}. Full response in Discord.`);
                this.sendDiscordFollowup(channel, upload.data.link, [renderedItem]);
                return;
            }

            this.send(`/${channel} ${summary} | ${upload.data.link}`);
        } catch (error) {
            Logger.warnMessage(error);
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

function extractForgeProcesses(miningCore, forgeData) {
    const sources = [
        miningCore?.forge_processes,
        miningCore?.forge_processes_orge,
        forgeData?.forge_processes,
        forgeData?.forge_processes_orge
    ];
    const entries = [];

    for (const source of sources) {
        if (!source || typeof source !== 'object') {
            continue;
        }

        collectForgeProcessEntries(source, entries);
    }

    return entries;
}

function collectForgeProcessEntries(node, entries, path = '') {
    if (!node || typeof node !== 'object') {
        return;
    }

    for (const [key, value] of Object.entries(node)) {
        const nextPath = path ? `${path}.${key}` : key;

        if (isForgeProcessObject(value)) {
            entries.push({ slotKey: nextPath, process: value });
            continue;
        }

        if (value && typeof value === 'object') {
            collectForgeProcessEntries(value, entries, nextPath);
        }
    }
}

function isForgeProcessObject(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return (
        value.startTime != undefined ||
        value.start_time != undefined ||
        value.endTime != undefined ||
        value.end_time != undefined ||
        value.id != undefined ||
        value.item_id != undefined
    );
}

function normalizeForgeProcess(entry, now) {
    const process = entry.process ?? {};

    const start = Number(process?.startTime ?? process?.start_time ?? process?.start ?? 0);
    const end = Number(process?.endTime ?? process?.end_time ?? process?.end ?? 0);
    const duration = Number(process?.duration ?? process?.duration_ms ?? process?.total_duration ?? 0);

    let computedEnd = end;
    if (computedEnd <= 0 && start > 0 && duration > 0) {
        computedEnd = start + duration;
    }

    const hasKnownEnd = computedEnd > 0;
    const remainingMs = hasKnownEnd ? Math.max(0, computedEnd - now) : Number.POSITIVE_INFINITY;
    const ready = hasKnownEnd ? remainingMs <= 0 : false;

    return {
        slotLabel: formatSlotLabel(entry.slotKey, process),
        itemName: formatItemName(process),
        ready,
        remainingMs,
        hasKnownEnd
    };
}

function formatSlotLabel(slotKey, process) {
    const numericSlot = Number(process?.slot ?? process?.forge_slot);
    if (Number.isFinite(numericSlot) && numericSlot > 0) {
        return `Slot ${numericSlot}`;
    }

    const slotMatch = String(slotKey ?? '').match(/forge_(\d+)(?:\.(\d+))?/i);
    if (slotMatch) {
        const primary = Number(slotMatch[1]);
        const secondary = Number(slotMatch[2]);

        if (Number.isFinite(secondary) && secondary > 0) {
            return `Slot ${secondary}`;
        }

        if (Number.isFinite(primary) && primary > 0) {
            return `Slot ${primary}`;
        }
    }

    const rawSlot = slotKey;
    const slotValue = String(rawSlot ?? 'slot').replace(/_/g, ' ');
    return slotValue
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatItemName(process) {
    const rawName = process?.item_name ?? process?.itemName ?? process?.name ?? process?.output_name ?? process?.id ?? process?.item_id ?? 'Unknown';
    return String(rawName)
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function sortableRemainingMs(value) {
    if (Number.isFinite(value)) {
        return value;
    }

    return Number.MAX_SAFE_INTEGER;
}

module.exports = ForgeCommand;

async function resolveForgeContext(targetUsername, profileName = null) {
    const uuidResponse = await getUUID(targetUsername, true);
    const targetUuid = uuidResponse?.uuid;

    if (!targetUuid) {
        throw 'Invalid username.';
    }

    const profilesResponse = await hypixelRequest(
        `https://api.hypixel.net/v2/skyblock/profiles?key=${config.API.hypixelAPIkey}&uuid=${targetUuid}`
    );

    const profiles = profilesResponse?.profiles ?? [];
    if (profiles.length === 0) {
        throw 'Player has no SkyBlock profiles.';
    }

    const profileData =
        typeof profileName === 'string' && profileName.trim().length > 0
            ? profiles.find((profile) => (profile?.cute_name ?? '').toLowerCase() === profileName.toLowerCase())
            : profiles.find((profile) => profile?.selected) || profiles[0];

    if (!profileData) {
        throw `Profile not found: ${profileName}`;
    }

    const memberData = profileData?.members?.[targetUuid];
    if (!memberData) {
        throw 'Player is not on the selected profile.';
    }

    return {
        uuid: targetUuid,
        username: uuidResponse?.username ?? targetUsername,
        profileData,
        memberData
    };
}
