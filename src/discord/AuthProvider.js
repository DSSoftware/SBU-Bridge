const config = require("../../config.js");
const axios = require("axios");

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
  debug: false
};

const MOD_PERMS = {
  manage_roles: false,
  blacklist: true,
  mc_demote: true,
  execute: false,
  invite: true,
  kick: true,
  mute: true,
  mc_promote: true,
  restart: true,
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
    let perm_name = "Member";
    let auth_provider = "INNATE";

    config.discord.commands.permissions.mod.forEach(mod_id => {
      if (user.roles.cache.has(mod_id)) {
        permission_level = 1;
        perm_name = "Moderator";
        auth_provider = "ROLES";
  
        permissions = MOD_PERMS;
      }
    });

    config.discord.commands.permissions.admin.forEach(admin_id => {
      if (user.roles.cache.has(admin_id)) {
        permission_level = 3;
        perm_name = "Administrator";
        auth_provider = "ROLES";
  
        permissions = ADM_PERMS;
      }
    });

    config.discord.commands.permissions.ownerIDs.forEach(owner_id => {
      if (user.id == owner_id) {
        permission_level = 5;
        perm_name = "Guild Owner";
        auth_provider = "INTERNAL";
  
        permissions = GM_PERMS;
      }
    });

    try {
      if(config.minecraft.API.SCF.enabled){
        let player_info = await Promise.all([
          axios.get(
            `https://sky.dssoftware.ru/api.php?method=getPermissionsLevel&discord_id=${user.id}&api=${config.minecraft.API.SCF.key}`,
          ),
        ]).catch((error) => {});
  
        player_info = player_info[0]?.data ?? {};
  
        if (player_info?.data?.exists) {
          permission_level = player_info?.data?.permission_level ?? 0;
          perm_name = "Role was assigned via permission command.";
          permissions = player_info?.permissions ?? DEFAULT_PERMS;
  
          auth_provider = "SCF_WEB";
        }
      }
    } catch (e) {
      console.log("Permission API Down");
    }

    config.discord.commands.permissions.dev.forEach(dev_id => {
      if (user.roles.cache.has(dev_id)) {
        permissions.debug = true;
      }
    });

    return {
      level: permission_level,
      name: perm_name,
      permissions: permissions,
      provider: auth_provider,
    };
  }
}

module.exports = AuthHandler;
