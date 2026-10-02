const { cmd } = require('../command');
const config = require('../config');
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');

// ==================== AUTOREACT ON/OFF ====================
cmd({
    pattern: "autoreact",
    alias: ["areact"],
    desc: "Enable/disable auto-react to every incoming message",
    category: "owner",
    react: "🎯",
    use: ".autoreact on/off",
    filename: __filename
},
async (conn, mek, m, { args, isOwner, isCreator, reply, botNumber }) => {
    try {
        if (!isOwner && !isCreator) return reply("❌ Only the owner can use this command!");

        const action = (args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(action)) {
            const userConfig = await getUserConfigFromMongoDB(botNumber);
            const status = userConfig.AUTO_REACT === 'true' ? '✅ ON' : '❌ OFF';
            const pool = (userConfig.AUTO_REACT_EMOJIS && userConfig.AUTO_REACT_EMOJIS.length)
                ? userConfig.AUTO_REACT_EMOJIS.join(' ')
                : 'Default (random from full emoji pool)';

            return reply(`╭────⬡ 𝗔𝗨𝗧𝗢-𝗥𝗘𝗔𝗖𝗧 ⬡────
├📌 *Status:* ${status}
├📌 *Emoji Pool:* ${pool}
├──────────────────
├📝 *Usage:*
├• .autoreact on
├• .autoreact off
├• .autoreactset 😍 🔥 💯  (custom emojis)
├• .autoreactset default   (reset to full pool)
╰────────────────────`);
        }

        await updateUserConfigInMongoDB(botNumber, { AUTO_REACT: action === 'on' ? 'true' : 'false' });
        reply(action === 'on'
            ? "🟢 *Auto-React ENABLED* — bot will now react to every incoming message."
            : "🔴 *Auto-React DISABLED*.");
    } catch (e) {
        console.error('Autoreact cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

// ==================== SET CUSTOM EMOJI POOL ====================
cmd({
    pattern: "autoreactset",
    alias: ["customreact", "setreact"],
    desc: "Set custom emoji(s) used for auto-react",
    category: "owner",
    react: "🎨",
    use: ".autoreactset 😍 🔥 💯  |  .autoreactset default",
    filename: __filename
},
async (conn, mek, m, { args, isOwner, isCreator, reply, botNumber }) => {
    try {
        if (!isOwner && !isCreator) return reply("❌ Only the owner can use this command!");

        if (!args.length) {
            return reply("❓ Usage:\n.autoreactset 😍 🔥 💯 (space-separated emojis)\n.autoreactset default (reset to full random pool)");
        }

        const first = args[0].toLowerCase();
        if (['default', 'reset', 'clear'].includes(first)) {
            await updateUserConfigInMongoDB(botNumber, { AUTO_REACT_EMOJIS: [] });
            return reply("✅ *Reset to default* — auto-react will now pick randomly from the full emoji pool.");
        }

        const emojis = args.join(' ').split(/\s+/).filter(Boolean);
        if (!emojis.length) {
            return reply("❌ Please provide at least one emoji.");
        }

        await updateUserConfigInMongoDB(botNumber, { AUTO_REACT_EMOJIS: emojis });
        reply(`✅ *Custom auto-react emoji(s) set:*\n${emojis.join(' ')}\n\nBot will now react using ${emojis.length > 1 ? 'one of these randomly' : 'this emoji'} on every message.`);
    } catch (e) {
        console.error('Autoreactset error:', e.message);
        reply("❌ Error: " + e.message);
    }
});
