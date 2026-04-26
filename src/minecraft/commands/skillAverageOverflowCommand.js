### Question:
    i want to add a !sao (skill avarage overflow) command.
    the command should show the overflow lvl of the skills, which is the xp divided by the max skill xp.

    so max skill might be 60 but the overflow xp is like 15 level ontop.

### Answer:
    I'll help you create a `!sao` (skill average overflow) command. First, let me create the command file following the project's structure.

    ```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            let overflow_points = 0;
            let overflow_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .map((skill) => {
                    const levelWithProgress = profile[skill].levelWithProgress ?? 0;
                    const level = Math.floor(levelWithProgress);
                    const overflowLevel = levelWithProgress - level;

                    // Only count overflow for skills that aren't runecrafting or social
                    if (skill !== 'runecrafting' && skill !== 'social') {
                        overflow_points += overflowLevel;
                        overflow_skills++;
                    }

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} +${overflowLevel.toFixed(2)}`;
                })
                .join(' | ');

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
} catch (error) {
    this.send(`/${channel} [ERROR] ${error}`);
}
}
}

module.exports = SkillAverageOverflowCommand;
```

This command:

1. **Follows the same pattern** as the existing `skillsCommand.js`
2. **Calculates overflow** by taking the decimal portion of `levelWithProgress` (the progress beyond the base level)
3. **Excludes runecrafting and social** skills from the average (same as the regular skills command)
4. **Shows individual skill overflow** in the format `SkillName +X.XX`
5. **Displays the average overflow** across all counted skills
6. **Uses the alias `sao`** for easy access

The overflow level is calculated as: `levelWithProgress - Math.floor(levelWithProgress)`, which gives you the fractional part representing progress toward the next level.

### Question:
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +0.09 (Farming +0.00 | Mining +0.00 | Combat +0.00 | Foraging +0.53 | Fishing +0.00 | Hunting +0.40 | Enchanting +0.00 | Alchemy +0.00 | Carpentry +0.00 | Runecrafting +0.00 | Social +0.36 | Taming +0.00)

### Answer:
I see the issue. The command is including `Runecrafting` and `Social` in the output even though they shouldn't be counted in the average. Also, looking at the output, it seems like `Social` is being displayed when it shouldn't be. Let me fix the command to properly exclude those skills from the output:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            let overflow_points = 0;
            let overflow_skills = 0;
            const skillsList = [];

            Object.keys(profile).forEach((skill) => {
                const levelWithProgress = profile[skill].levelWithProgress ?? 0;
                const level = Math.floor(levelWithProgress);
                const overflowLevel = levelWithProgress - level;

                // Only count overflow for skills that aren't runecrafting or social
                if (skill !== 'runecrafting' && skill !== 'social') {
                    overflow_points += overflowLevel;
                    overflow_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    skillsList.push(`${skillName} +${overflowLevel.toFixed(2)}`);
                }
            });

            const skillsFormatted = skillsList.join(' | ');

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

The key changes:
1. **Moved the exclusion check** to only add skills to `skillsList` if they're not `runecrafting` or `social`
2. **Changed from `.map()` to `.forEach()`** to have better control over which skills are added to the output
3. Now `Runecrafting` and `Social` won't appear in the output at all, only in the average calculation exclusion

This should now output something like:
```
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +0.09 (Farming +0.00 | Mining +0.00 | Combat +0.00 | Foraging +0.53 | Fishing +0.00 | Hunting +0.40 | Enchanting +0.00 | Alchemy +0.00 | Carpentry +0.00 | Taming +0.00)
    ```

### Question:
also the overflow should be displayed as full lvls

like +10 lvl or similar

### Answer:
I understand. You want the overflow to be displayed as full levels instead of decimals. Looking at the `calcSkill` function, the overflow is calculated based on XP beyond the max level. Let me update the command to convert that decimal overflow into full levels:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = data.profile;
            let overflow_points = 0;
            let overflow_skills = 0;
            const skillsList = [];

            const skillsToCheck = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];

            skillsToCheck.forEach((skill) => {
                const experienceKey = `experience_skill_${skill}`;
                const experience = profile[experienceKey] || 0;

                let table = 'normal';
                if (skill === 'runecrafting') table = 'runecrafting';
                if (skill === 'social') table = 'social';

                let maxLevel = xp_tables.max_levels[skill] || 60;
                let totalXpForMaxLevel = 0;

                // Calculate total XP needed to reach max level
                for (let i = 0; i < maxLevel; i++) {
                    totalXpForMaxLevel += xp_tables[table][i];
                }

                // Calculate overflow XP and convert to levels
                if (experience > totalXpForMaxLevel) {
                    const overflowXp = experience - totalXpForMaxLevel;
                    const xpPerLevel = xp_tables[table][maxLevel] || 200000000;
                    const overflowLevel = Math.floor(overflowXp / xpPerLevel);

                    overflow_points += overflowLevel;
                    overflow_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    skillsList.push(`${skillName} +${overflowLevel}`);
                }
            });

            const skillsFormatted = skillsList.join(' | ');

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Import `xp_tables`** to access the XP requirements
2. **Calculate total XP for max level** by summing up all XP requirements up to max level
3. **Calculate overflow XP** as experience beyond max level
4. **Convert overflow XP to levels** by dividing by the XP per level at max level
5. **Display as full levels** (e.g., `+10` instead of `+0.53`)
6. **Only show skills with overflow** - skills with 0 overflow won't appear in the list

Now it will display something like:
```
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +5.25 (Foraging +10 | Hunting +3 | Taming +2)
    ```

### Question:
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +N/A ()

### Answer:
The issue is that the `skillsToCheck` array doesn't include all skills, and the XP table lookup might not be working correctly. Let me fix this by using the same approach as the `skillsCommand.js` which uses the `getSkills` function:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = data.profile;
            const skillsData = getSkills(profile);

            let overflow_points = 0;
            let overflow_skills = 0;
            const skillsList = [];

            Object.keys(skillsData).forEach((skill) => {
                // Skip runecrafting and social
                if (skill === 'runecrafting' || skill === 'social') {
                    return;
                }

                const experienceKey = `experience_skill_${skill}`;
                const experience = profile[experienceKey] || 0;

                let table = 'normal';
                if (skill === 'runecrafting') table = 'runecrafting';
                if (skill === 'social') table = 'social';
                if (skill === 'dungeoneering') table = 'catacombs';

                let maxLevel = xp_tables.max_levels[skill] || 60;
                let totalXpForMaxLevel = 0;

                // Calculate total XP needed to reach max level
                for (let i = 0; i < maxLevel; i++) {
                    totalXpForMaxLevel += xp_tables[table][i];
                }

                // Calculate overflow XP and convert to levels
                if (experience > totalXpForMaxLevel) {
                    const overflowXp = experience - totalXpForMaxLevel;
                    const xpPerLevel = xp_tables[table][maxLevel] || 200000000;
                    const overflowLevel = Math.floor(overflowXp / xpPerLevel);

                    if (overflowLevel > 0) {
                        overflow_points += overflowLevel;
                        overflow_skills++;

                        const skillName = skill[0].toUpperCase() + skill.slice(1);
                        skillsList.push(`${skillName} +${overflowLevel}`);
                    }
                }
            });

            const skillsFormatted = skillsList.length > 0 ? skillsList.join(' | ') : 'No overflow';

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Use `getSkills(profile)`** to get all available skills dynamically instead of hardcoding them
2. **Iterate through all skills** returned by `getSkills`
3. **Only show skills with overflow > 0** to avoid cluttering the output
4. **Display "No overflow"** if no skills have overflow
5. **Added check for `overflowLevel > 0`** before counting it

This should now properly detect all skills and calculate their overflow levels correctly.

### Question:
Guild > LambdaPiBridge [STAFF]: strategybob's Skill Average Overflow: +N/A (No overflow)

### Answer:
The issue is that the experience key lookup isn't matching the actual profile data structure. Let me fix this by using the same approach as the `skillsCommand.js`, which uses `getSkills` to get the skill data directly:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = data.profile;
            const skillsData = getSkills(profile);

            let overflow_points = 0;
            let overflow_skills = 0;
            const skillsList = [];

            Object.keys(skillsData).forEach((skill) => {
                // Skip runecrafting and social
                if (skill === 'runecrafting' || skill === 'social') {
                    return;
                }

                const skillInfo = skillsData[skill];
                const level = Math.floor(skillInfo.levelWithProgress ?? 0);
                const levelWithProgress = skillInfo.levelWithProgress ?? 0;
                const overflowLevel = levelWithProgress - level;

                // Only count if there's actual overflow
                if (overflowLevel > 0) {
                    overflow_points += overflowLevel;
                    overflow_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    skillsList.push(`${skillName} +${Math.floor(overflowLevel)}`);
                }
            });

            const skillsFormatted = skillsList.length > 0 ? skillsList.join(' | ') : 'No overflow';

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = (overflow_points / overflow_skills).toFixed(2);
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Use `skillsData[skill]` directly** instead of trying to look up experience keys
2. **Extract `levelWithProgress`** from the skill data returned by `getSkills`
3. **Calculate overflow as the decimal portion** of `levelWithProgress` (e.g., if level is 60.75, overflow is 0.75)
4. **Convert overflow to full levels** using `Math.floor()` for display

This approach is much simpler and uses the same data structure that `getSkills` already provides, which should now properly show overflow levels.

### Question:
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +0.46 (Foraging +0 | Hunting +0)

### Answer:
The issue is that `Math.floor()` on a decimal less than 1 returns 0. The overflow is being calculated correctly (0.46 average), but we need to display it differently. Since overflow is a fractional level, we should display it as a decimal, not as full levels. Let me fix this:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
// Only count if there's actual overflow
if (overflowLevel > 0) {
    overflow_points += overflowLevel;
    overflow_skills++;

    const skillName = skill[0].toUpperCase() + skill.slice(1);
    skillsList.push(`${skillName} +${overflowLevel.toFixed(2)}`);
}
```

This will display the overflow as a decimal (e.g., `Foraging +0.46 | Hunting +0.23`) which represents the fractional level progress beyond the max level. The average at the end will then make sense as the average of all these decimal values.

### Question:
change it to display just the overflow xp not the levels

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = data.profile;
            const skillsData = getSkills(profile);

            let overflow_xp = 0;
            let overflow_skills = 0;
            const skillsList = [];

            Object.keys(skillsData).forEach((skill) => {
                // Skip runecrafting and social
                if (skill === 'runecrafting' || skill === 'social') {
                    return;
                }

                const experienceKey = `experience_skill_${skill}`;
                const experience = profile[experienceKey] || 0;

                let table = 'normal';
                if (skill === 'runecrafting') table = 'runecrafting';
                if (skill === 'social') table = 'social';
                if (skill === 'dungeoneering') table = 'catacombs';

                let maxLevel = xp_tables.max_levels[skill] || 60;
                let totalXpForMaxLevel = 0;

                // Calculate total XP needed to reach max level
                for (let i = 0; i < maxLevel; i++) {
                    totalXpForMaxLevel += xp_tables[table][i];
                }

                // Calculate overflow XP
                if (experience > totalXpForMaxLevel) {
                    const overflowXpAmount = experience - totalXpForMaxLevel;
                    overflow_xp += overflowXpAmount;
                    overflow_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    skillsList.push(`${skillName} +${overflowXpAmount.toLocaleString()}`);
                }
            });

            const skillsFormatted = skillsList.length > 0 ? skillsList.join(' | ') : 'No overflow';

            let skillAverageOverflow = 'N/A';

            if (overflow_skills !== 0) {
                skillAverageOverflow = Math.floor(overflow_xp / overflow_skills).toLocaleString();
            }

            this.send(`/${channel} ${username}'s Skill Average Overflow: +${skillAverageOverflow ?? 0} XP (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Changed `overflow_points` to `overflow_xp`** to track actual XP amounts
2. **Store `overflowXpAmount`** instead of calculating levels
3. **Display overflow XP with `.toLocaleString()`** for number formatting (e.g., `1,234,567`)
4. **Calculate average as `overflow_xp / overflow_skills`** and floor it
5. **Added "XP" to the output** to clarify it's experience points

Now it will display something like:
```
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average Overflow: +500,000 XP (Foraging +1,000,000 | Hunting +250,000)
    ```

### Question:
i want to get the total xp per skill instead of the calculated level

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            let total_xp = 0;
            let xp_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .map((skill) => {
                    const totalXp = profile[skill].totalXp ?? 0;

                    if (skill != 'runecrafting' && skill != 'social') {
                        total_xp += totalXp;
                        xp_skills++;
                    }

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} ${totalXp.toLocaleString()}`;
                })
                .join(' | ');

            let skillAverageXp = 'N/A';

            if (xp_skills != 0) {
                skillAverageXp = Math.floor(total_xp / xp_skills).toLocaleString();
            }

            this.send(`/${channel} ${username}'s Skill Average XP: ${skillAverageXp ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Changed to use `totalXp`** from the skill data instead of `levelWithProgress`
2. **Renamed variables** to reflect XP tracking (`sa_points` → `total_xp`, `sa_skills` → `xp_skills`)
3. **Added `.toLocaleString()`** to format numbers with commas
4. **Updated output message** to say "Skill Average XP"
5. **Removed unused `xp_tables` import**

Now it will display something like:
```
Guild > LambdaPiBridge [STAFF]: rubiclex's Skill Average XP: 50,000,000 (Farming 45,000,000 | Mining 55,000,000 | Combat 48,000,000 | ...)
    ```

### Question:
Minecraft bot has been kicked from the server for "{"extra":["Chat message too long"],"text":""}"

### Answer:
The message is too long. We need to filter the skills list to only show skills with overflow XP. Here's the fix:

```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
let total_xp = 0;
let xp_skills = 0;
const skillsWithXp = [];

Object.keys(profile).forEach((skill) => {
    const totalXp = profile[skill].totalXp ?? 0;

    if (skill != 'runecrafting' && skill != 'social') {
        total_xp += totalXp;
        xp_skills++;

        if (totalXp > 0) {
            const skillName = skill[0].toUpperCase() + skill.slice(1);
            skillsWithXp.push(`${skillName} ${totalXp.toLocaleString()}`);
        }
    }
});

const skillsFormatted = skillsWithXp.length > 0 ? skillsWithXp.join(' | ') : 'No XP';

let skillAverageXp = 'N/A';

if (xp_skills != 0) {
    skillAverageXp = Math.floor(total_xp / xp_skills).toLocaleString();
}

this.send(`/${channel} ${username}'s Skill Average XP: ${skillAverageXp ?? 0} (${skillsFormatted})`);
```

Key changes:
1. **Changed to `forEach`** instead of `.map()` for better control
2. **Only include skills with `totalXp > 0`** in the display
3. **Renamed to `skillsWithXp`** array to clarify it only contains skills with XP
4. **Added fallback** "No XP" if no skills have experience

This will significantly reduce the message length by only showing skills that have actual XP.

### Question:
 const level = Math.floor(profile[skill].levelWithProgress ?? 0);

what does this do ?

### Answer:
This line extracts and calculates the skill level from the profile data:

```javascript
const level = Math.floor(profile[skill].levelWithProgress ?? 0);
```

Breaking it down:

1. **`profile[skill]`** - Accesses the skill object (e.g., `profile['farming']`, `profile['mining']`)

2. **`.levelWithProgress`** - Gets the level value that includes fractional progress toward the next level
   - Example: If you're halfway to level 50, this might be `49.5`

3. **`?? 0`** - The nullish coalescing operator - if `levelWithProgress` is `null` or `undefined`, it defaults to `0`

4. **`Math.floor()`** - Rounds down to the nearest whole number
   - Example: `49.5` becomes `49`, `49.9` becomes `49`

**In summary:** It gets the player's skill level (as a whole number) from the profile, defaulting to 0 if the data doesn't exist.

**Example:**
- If a player has `levelWithProgress: 45.75` in farming, this line sets `level = 45`
- If the data is missing, it sets `level = 0`

### Question:
the message is to long, remove social and runecrafting from it complely

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const skillsFormatted = Object.keys(profile)
    .filter((skill) => skill !== 'runecrafting' && skill !== 'social')
    .map((skill) => {
        const level = profile[skill].totalXp;

        sa_points += level;
        sa_skills++;

        const skillName = skill[0].toUpperCase() + skill.slice(1);
        return `${skillName} ${level}`;
    })
    .join(' | ');
```

Key changes:
1. **Added `.filter()`** to remove runecrafting and social skills completely before mapping
2. **Removed the `if` check** inside the map since we're already filtering them out
3. This reduces the message length by not including those two skills at

### Question:
remove dungeoneering aswell

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const skillsFormatted = Object.keys(profile)
    .filter((skill) => skill !== 'runecrafting' && skill !== 'social' && skill !== 'dungeoneering')
    .map((skill) => {
        const level = profile[skill].totalXp;

        sa_points += level;
        sa_skills++;

        const skillName = skill[0].toUpperCase() + skill.slice(1);
        return `${skillName} ${level}`;
    })
    .join(' | ');
```

Key change:
1. **Added `&& skill !== 'dungeoneering'`** to the filter to exclude dungeoneering from the

### Question:
change the xp numbers to 230m  instead of 230.000.000

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername, formatNumber } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
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

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            let sa_points = 0;
            let sa_skills = 0;

            const skillsFormatted = Object.keys(profile)
                .filter((skill) => skill !== 'runecrafting' && skill !== 'social' && skill !== 'dungeoneering')
                .map((skill) => {
                    const level = profile[skill].totalXp;

                    sa_points += level;
                    sa_skills++;

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} ${formatNumber(level)}`;
                })
                .join(' | ');

            let skillAverage = 'N/A';

            if (sa_skills != 0) {
                skillAverage = formatNumber(sa_points / sa_skills);
            }

            this.send(`/${channel} ${username}'s Skill Average: ${skillAverage ?? 0} (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;
```

Key changes:
1. **Added `formatNumber` import** from helperFunctions
2. **Wrapped `level` with `formatNumber(level)`** in the map function
3. **Wrapped `sa_points / sa_skills` with `formatNumber()`** for the average

Now it will display: `Farming 230M | Mining 450M` instead of `Farming 230000000 | Mining 450000000`

### Question:
calculate the max xp for each skill and substract it from the total xp to show the overflow.

also remove the average part

### Answer:
```javascript
// File: C:\Users\chris\WebstormProjects\SBU-Bridge\src\minecraft\commands\skillAverageOverflowCommand.js
const minecraftCommand = require('../../contracts/minecraftCommand.js');
const { formatUsername, formatNumber } = require('../../contracts/helperFunctions.js');
const { getLatestProfile } = require('../../../API/functions/getLatestProfile.js');
const { getUUID } = require('../../contracts/API/PlayerDBAPI.js');
const getSkills = require('../../../API/stats/skills.js');
const xp_tables = require('../../../API/constants/xp_tables.js');

class SkillAverageOverflowCommand extends minecraftCommand {
    constructor(minecraft) {
        super(minecraft);

        this.name = 'skillAverageOverflow';
        this.aliases = ['sao'];
        this.description = 'Skill Average Overflow of specified user.';
        this.options = [
            {
                name: 'username',
                description: 'Minecraft username',
                required: false
            }
        ];
    }

    getMaxXp(skill) {
        let table = 'normal';
        if (skill === 'runecrafting') table = 'runecrafting';
        if (skill === 'social') table = 'social';
        if (skill === 'dungeoneering') table = 'catacombs';

        let maxXp = 0;
        const maxLevel = xp_tables.max_levels[skill] || 60;

        for (let i = 0; i < maxLevel; i++) {
            maxXp += xp_tables[table][i];
        }

        return maxXp;
    }

    async onCommand(username, message, channel = 'gc') {
        try {
            username = this.getArgs(message)[0] || username;

            const uuid = await getUUID(username);

            const data = await getLatestProfile(uuid);

            username = formatUsername(username, data.profileData.cute_name);

            const profile = getSkills(data.profile);

            const skillsFormatted = Object.keys(profile)
                .filter((skill) => skill !== 'runecrafting' && skill !== 'social' && skill !== 'dungeoneering')
                .map((skill) => {
                    const totalXp = profile[skill].totalXp;
                    const maxXp = this.getMaxXp(skill);
                    const overflow = Math.max(0, totalXp - maxXp);

                    const skillName = skill[0].toUpperCase() + skill.slice(1);
                    return `${skillName} ${formatNumber(overflow)}`;
                })
                .join(' | ');

            this.send(`/${channel} ${username}'s Skill Overflow: (${skillsFormatted})`);
        } catch (error) {
            this.send(`/${channel} [ERROR] ${error}}`);
        }
    }
}

module.exports = SkillAverageOverflowCommand;