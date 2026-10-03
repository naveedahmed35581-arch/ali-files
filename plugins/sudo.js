const { cmd } = require('../command');
const config = require('../config');
const { getAllSudo, addSudo, removeSudo } = require('../data/sudo');

function isPrimaryOwner(senderNumber, isMe) {
    return config.OWNER_NUMBER.includes(senderNumber) || isMe;
}

function extractTargetNumber(m, args) {
    if (args[0]) {
        const digits = args[0].replace(/[^0-9]/g, '');
        if (digits.length >= 8) return digits;
    }
    if (m.mentionedJid && m.mentionedJid.length) {
        return m.mentionedJid[0].split('@')[0];
    }
    if (m.quoted && m.quoted.sender) {
        return m.quoted.sender.split('@')[0];
    }
    return null;
}

cmd({
    pattern: "addsudo",
    desc: "Grant a number full bot control (sudo access)",
    category: "owner",
    react: "👑",
    use: ".addsudo <number>",
    filename: __filename
}, async (conn, mek, m, { from, args, senderNumber, isMe, reply }) => {
    try {
        if (!isPrimaryOwner(senderNumber, isMe)) {
            return reply("❌ Only the main bot owner can manage sudo.");
        }

        const number = extractTargetNumber(m, args);
        if (!number) return reply("❓ Usage: .addsudo <number>\nExample: .addsudo 923292532170\nOr reply to their message / mention them.");

        const ok = await addSudo(number);
        if (!ok) return reply("❌ Failed to add sudo, try again.");

        await conn.sendMessage(from, {
            text: `✅ *Sudo access granted to* @${number}\n\nThis number now has full bot control.`,
            mentions: [`${number}@s.whatsapp.net`]
        }, { quoted: mek });
    } catch (e) {
        console.error('addsudo error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

cmd({
    pattern: "delsudo",
    alias: ["removesudo", "unsudo"],
    desc: "Revoke sudo access from a number",
    category: "owner",
    react: "🚫",
    use: ".delsudo <number>",
    filename: __filename
}, async (conn, mek, m, { from, args, senderNumber, isMe, reply }) => {
    try {
        if (!isPrimaryOwner(senderNumber, isMe)) {
            return reply("❌ Only the main bot owner can manage sudo.");
        }

        const number = extractTargetNumber(m, args);
        if (!number) return reply("❓ Usage: .delsudo <number>\nExample: .delsudo 923292532170\nOr reply to their message / mention them.");

        const ok = await removeSudo(number);
        if (!ok) return reply("❌ Failed to remove sudo, try again.");

        await conn.sendMessage(from, {
            text: `✅ *Sudo access revoked from* @${number}`,
            mentions: [`${number}@s.whatsapp.net`]
        }, { quoted: mek });
    } catch (e) {
        console.error('delsudo error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

cmd({
    pattern: "sudolist",
    alias: ["sudos", "listsudo"],
    desc: "Show all sudo (full-control) numbers",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, senderNumber, isMe, reply }) => {
    try {
        if (!isPrimaryOwner(senderNumber, isMe)) {
            return reply("❌ Only the main bot owner can view the sudo list.");
        }

        const list = await getAllSudo();
        if (!list.length) return reply("ℹ️ No sudo numbers added yet.\n\nMain owner: " + config.OWNER_NUMBER);

        const mentions = list.map(n => `${n}@s.whatsapp.net`);
        const text = `📋 *Sudo Numbers (${list.length})*\n\n` +
            list.map((n, i) => `${i + 1}. @${n}`).join('\n') +
            `\n\n👑 Main owner: ${config.OWNER_NUMBER}`;

        await conn.sendMessage(from, { text, mentions }, { quoted: mek });
    } catch (e) {
        console.error('sudolist error:', e.message);
        reply("❌ Error: " + e.message);
    }
});
