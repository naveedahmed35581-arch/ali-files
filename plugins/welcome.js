const { cmd } = require('../command');
const config = require('../config');
const { getGroupSettings, setWelcome, setGoodbye } = require('../data/groupSettings');

cmd({
    pattern: "welcome",
    desc: "Enable/disable welcome messages for this group",
    category: "group",
    react: "👋",
    use: ".welcome on/off",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isOwner && !isAdmins) return reply("❌ Only group admins or the owner can use this.");

        const action = (args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(action)) {
            const settings = await getGroupSettings(from);
            return reply(`❓ Use: .welcome on/off\n\nCurrent status: ${settings.welcome ? '✅ ON' : '❌ OFF'}`);
        }

        const ok = await setWelcome(from, action === 'on');
        if (!ok) return reply("❌ Failed to update setting, try again.");
        reply(action === 'on' ? "🟢 *Welcome messages enabled* for this group." : "🔴 *Welcome messages disabled* for this group.");
    } catch (e) {
        console.error('Welcome cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

cmd({
    pattern: "goodbye",
    alias: ["bye"],
    desc: "Enable/disable goodbye messages for this group",
    category: "group",
    react: "👋",
    use: ".goodbye on/off",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isOwner && !isAdmins) return reply("❌ Only group admins or the owner can use this.");

        const action = (args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(action)) {
            const settings = await getGroupSettings(from);
            return reply(`❓ Use: .goodbye on/off\n\nCurrent status: ${settings.goodbye ? '✅ ON' : '❌ OFF'}`);
        }

        const ok = await setGoodbye(from, action === 'on');
        if (!ok) return reply("❌ Failed to update setting, try again.");
        reply(action === 'on' ? "🟢 *Goodbye messages enabled* for this group." : "🔴 *Goodbye messages disabled* for this group.");
    } catch (e) {
        console.error('Goodbye cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});
