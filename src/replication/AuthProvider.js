const config = require('#root/config.js').getConfig();
const axios = require('axios');

const GM_PERMS = {
    manage_roles: true,
    blacklist: true,
    mc_demote: true,
    execute: true,
    invite: true,
    kick: true,
    mute: true,
    mc_promote: true,
    restart: true,
    unmute: true,
    debug: true
};

const ADM_PERMS = {
    manage_roles: true,
    blacklist: true,
    mc_demote: true,
    execute: false,
    invite: true,
    kick: true,
    mute: true,
    mc_promote: true,
    restart: true,
    unmute: true,
    debug: true
};

const MOD_PERMS = {
    manage_roles: false,
    blacklist: false,
    mc_demote: false,
    execute: false,
    invite: true,
    kick: true,
    mute: true,
    mc_promote: false,
    restart: false,
    unmute: true,
    debug: false
};

const DEFAULT_PERMS = {
    manage_roles: false,
    blacklist: false,
    mc_demote: false,
    execute: false,
    invite: false,
    kick: false,
    mute: false,
    mc_promote: false,
    restart: false,
    unmute: false,
    debug: false
};

class AuthHandler {
    async permissionInfo(user) {
        let permissions = DEFAULT_PERMS;

        let permission_level = 0;
        let perm_name = 'Member';
        let auth_provider = 'INNATE';

        config.replication.permissions.mod.forEach((mod_id) => {
            if (user.roles.cache.has(mod_id)) {
                permission_level = 1;
                perm_name = 'Moderator';
                auth_provider = 'ROLES';

                permissions = MOD_PERMS;
            }
        });

        config.replication.permissions.admin.forEach((admin_id) => {
            if (user.roles.cache.has(admin_id)) {
                permission_level = 3;
                perm_name = 'Administrator';
                auth_provider = 'ROLES';

                permissions = ADM_PERMS;
            }
        });

        config.replication.permissions.ownerIDs.forEach((owner_id) => {
            if (user.id == owner_id) {
                permission_level = 5;
                perm_name = 'Guild Owner';
                auth_provider = 'INTERNAL';

                permissions = GM_PERMS;
            }
        });

        config.replication.permissions.dev.forEach((dev_id) => {
            if (user.roles.cache.has(dev_id)) {
                permissions.debug = true;
            }
        });

        return {
            level: permission_level,
            name: perm_name,
            permissions: permissions,
            provider: auth_provider
        };
    }
}

module.exports = AuthHandler;
