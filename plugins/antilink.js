const { cmd } = require('../command');
const config = require('../config');

// ============================================
// 🔗 ANTI-LINK SYSTEM
// ============================================

// ============================================
// 🎀 STYLISH FONT MAP
// ============================================
const stylishFont = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
    'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
    's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
    'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
    'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
};

function toStylish(text) {
    if (!text) return text;
    return text.split('').map(char => stylishFont[char] || char).join('');
}

// ============================================
// 📋 BORDER STYLES
// ============================================
const topBorder = `*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⍟*`;
const midBorder = `*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*`;
const bottomBorder = `*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⍟*`;

// ============================================
// 📋 DATA STORAGE
// ============================================
const antilinkGroups = new Map();
const antilinkWarnings = new Map();

// ============================================
// 📋 LINK PATTERNS
// ============================================
const linkPatterns = [
    /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
    /https?:\/\/(www\.)?whatsapp\.com\/channel\/\S+/gi,
    /wa\.me\/\S+/gi,
    /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
    /https?:\/\/youtu\.be\/\S+/gi,
    /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
    /https?:\/\/fb\.me\/\S+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?x\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?discord\.gg\/\S+/gi,
    /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
    /https?:\/\/bit\.ly\/\S+/gi,
    /https?:\/\/tinyurl\.com\/\S+/gi,
    /https?:\/\/t\.co\/\S+/gi,
    /https?:\/\/\S+\.\S{2,6}(\/\S*)?/gi,
];

// ============================================
// 🛠️ HELPER FUNCTIONS
// ============================================

function normalizeJid(jid) {
    if (!jid) return jid;
    let jidStr = jid;
    if (typeof jidStr !== 'string') jidStr = String(jidStr);
    const [user, server] = jidStr.split('@');
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@${server}`;
}

async function checkBotIsAdmin(conn, from) {
    try {
        const groupMeta = await conn.groupMetadata(from);
        if (!groupMeta || !groupMeta.participants) return false;

        const candidates = [conn.user?.id, conn.user?.lid]
            .filter(Boolean)
            .map(normalizeJid);

        if (candidates.length === 0) return false;

        const botParticipant = groupMeta.participants.find(p => {
            const pJid = normalizeJid(p.id);
            const pLid = p.lid ? normalizeJid(p.lid) : null;
            return candidates.includes(pJid) || (pLid && candidates.includes(pLid));
        });

        if (!botParticipant) {
            console.log(`Bot not found in participants list for ${from}. Candidates: ${candidates.join(', ')}`);
            return false;
        }
        return botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
    } catch (e) {
        console.error('checkBotIsAdmin error:', e.message);
        return false;
    }
}

async function checkUserIsAdmin(conn, from, userJid) {
    try {
        const groupMeta = await conn.groupMetadata(from);
        if (!groupMeta || !groupMeta.participants) return false;

        const cleanUserJid = normalizeJid(userJid);
        const participant = groupMeta.participants.find(p => {
            const pJid = normalizeJid(p.id);
            const pLid = p.lid ? normalizeJid(p.lid) : null;
            return pJid === cleanUserJid || pLid === cleanUserJid;
        });

        if (!participant) return false;
        return participant.admin === 'admin' || participant.admin === 'superadmin';
    } catch (e) {
        console.error('checkUserIsAdmin error:', e.message);
        return false;
    }
}

// ============================================
// 🔗 ANTI-LINK COMMAND
// ============================================
cmd({
    pattern: "antilink",
    alias: ["link", "antilinkstatus"],
    desc: "Enable/disable antilink",
    category: "group",
    react: "🔗",
    use: ".antilink on/off",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, reply, sender, pushName }) => {
    try {
        if (!isGroup) {
            return reply(`❌ Tʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs.`);
        }

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        console.log(`User ${sender} isAdmin: ${isAdmin}, isOwner: ${isOwner}, isCreator: ${isCreator}`);

        if (!isOwner && !isCreator && !isAdmin) {
            return reply(`❌ Oɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs.`);
        }

        const action = (args[0] || '').toLowerCase();

        if (!['on', 'off', 'status'].includes(action)) {
            return reply(`
${topBorder}
*┋*      ${toStylish('A N T I - L I N K   S Y S T E M')}
${midBorder}
*┋ ⋄ ➠* *${toStylish('🔗 Commands:')}*
*┋ ⋄ ➠* *${toStylish('.antilink on  - Enable')}*
*┋ ⋄ ➠* *${toStylish('.antilink off - Disable')}*
*┋ ⋄ ➠* *${toStylish('.antilink status - Check')}*
${bottomBorder}
            `.trim());
        }

        if (action === 'on') {
            const botIsAdmin = await checkBotIsAdmin(conn, from);
            console.log(`Bot admin status in ${from}: ${botIsAdmin}`);

            if (!botIsAdmin) {
                return reply(`
${topBorder}
*┋*      ${toStylish('B O T   N O T   A D M I N')}
${midBorder}
*┋ ⋄ ➠* *❌ ${toStylish('Bot is not an admin!')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish('Please make the bot an admin:')}*
*┋ ⋄ ➠* *${toStylish('1. Open group info')}*
*┋ ⋄ ➠* *${toStylish('2. Tap "Add Members"')}*
*┋ ⋄ ➠* *${toStylish('3. Make bot admin')}*
*┋ ⋄ ➠* *${toStylish('4. Try again')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish('Note: Bot needs admin rights')}*
*┋ ⋄ ➠* *${toStylish('to delete messages and remove members.')}*
${bottomBorder}
                `.trim());
            }
        }

        if (action === 'on') {
            antilinkGroups.set(from, true);
            for (const key of antilinkWarnings.keys()) {
                if (key.startsWith(from + ':')) antilinkWarnings.delete(key);
            }
            return reply(`
${topBorder}
*┋*      ${toStylish('A N T I - L I N K   E N A B L E D')}
${midBorder}
*┋ ⋄ ➠* *🟢 ${toStylish('Status: Active')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish('📋 Features:')}*
*┋ ⋄ ➠* *${toStylish('• 1st offense: ⚠️ Warning + Delete')}*
*┋ ⋄ ➠* *${toStylish('• 2nd offense: 🚫 Remove from group')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish(`📍 Group: ${pushName || from.split('@')[0]}`)}*
${bottomBorder}
            `.trim());
        } else if (action === 'off') {
            antilinkGroups.set(from, false);
            for (const key of antilinkWarnings.keys()) {
                if (key.startsWith(from + ':')) antilinkWarnings.delete(key);
            }
            return reply(`
${topBorder}
*┋*      ${toStylish('A N T I - L I N K   D I S A B L E D')}
${midBorder}
*┋ ⋄ ➠* *🔴 ${toStylish('Status: Inactive')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish('📋 Features:')}*
*┋ ⋄ ➠* *${toStylish('• All links allowed')}*
*┋ ⋄ ➠* *${toStylish('• No warnings or deletions')}*
*┋ ⋄ ➠* **
*┋ ⋄ ➠* *${toStylish(`📍 Group: ${pushName || from.split('@')[0]}`)}*
${bottomBorder}
            `.trim());
        } else if (action === 'status') {
            const status = antilinkGroups.get(from) || false;
            const warnings = [];
            for (const [key, value] of antilinkWarnings.entries()) {
                if (key.startsWith(from + ':')) {
                    const user = key.split(':')[1];
                    warnings.push(`• @${user.split('@')[0]}: ${value} warning(s)`);
                }
            }
            return reply(`
${topBorder}
*┋*      ${toStylish('A N T I - L I N K   S T A T U S')}
${midBorder}
*┋ ⋄ ➠* *${toStylish(`📊 Status: ${status ? '🟢 Active' : '🔴 Inactive'}`)}*
*┋ ⋄ ➠* *${toStylish(`📝 Warnings: ${warnings.length || 'None'}`)}*
${warnings.length ? `*┋ ⋄ ➠* *${toStylish('───────────────')}*\n*┋ ⋄ ➠* *${toStylish(warnings.join('\n*┋ ⋄ ➠* *'))}*` : ''}
${bottomBorder}
            `.trim());
        }

    } catch (e) {
        console.error('Antilink cmd error:', e.message);
        reply(`❌ Fᴀɪʟᴇᴅ ᴛᴏ ᴜᴘᴅᴀᴛᴇ ᴀɴᴛɪʟɪɴᴋ: ${e.message}`);
    }
});

// ============================================
// 🔍 ANTI-LINK DETECTOR - LINK DISPLAY REMOVED
// ============================================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, isGroup, isOwner, isCreator }) => {
    try {
        if (!isGroup) return;
        if (mek.key?.fromMe) return;

        if (!antilinkGroups.get(from)) return;

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (isAdmin || isOwner || isCreator) return;

        if (!body || typeof body !== 'string') return;

        let hasLink = false;

        for (const pattern of linkPatterns) {
            pattern.lastIndex = 0;
            const match = pattern.exec(body);
            if (match) {
                hasLink = true;
                break;
            }
        }

        if (!hasLink) return;

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) {
            antilinkGroups.set(from, false);
            console.log(`Antilink disabled in ${from} - Bot not admin`);
            return;
        }

        const cleanSender = normalizeJid(sender);
        const warnKey = `${from}:${cleanSender}`;
        const userWarnings = antilinkWarnings.get(warnKey) || 0;

        if (userWarnings === 0) {
            antilinkWarnings.set(warnKey, 1);

            try {
                await conn.sendMessage(from, { delete: mek.key });
            } catch (delErr) {
                console.error('Antilink delete (1st offense) failed:', delErr.message);
            }

            await conn.sendMessage(from, {
                text: `
${topBorder}
*┋*      ${toStylish('W A R N I N G')}
${midBorder}
*┋ ⋄ ➠* *⚠️ @${cleanSender.split('@')[0]}*
*┋ ⋄ ➠* *📌 ${toStylish('Rules:')}*
*┋ ⋄ ➠* *${toStylish('Links are not allowed in this group.')}*
*┋ ⋄ ➠* *⚠️ ${toStylish('First Warning:')}*
*┋ ⋄ ➠* *${toStylish('Your message has been deleted.')}*
*┋ ⋄ ➠* *🚫 ${toStylish('Next offense:')}*
*┋ ⋄ ➠* *${toStylish('You will be removed from the group.')}*
${bottomBorder}
                `.trim(),
                mentions: [cleanSender]
            });

        } else {
            antilinkWarnings.delete(warnKey);

            try {
                await conn.sendMessage(from, { delete: mek.key });
            } catch (delErr) {
                console.error('Antilink delete (2nd offense) failed:', delErr.message);
            }

            await conn.sendMessage(from, {
                text: `
${topBorder}
*┋*      ${toStylish('R E M O V E D   F R O M   G R O U P')}
${midBorder}
*┋ ⋄ ➠* *🚫 @${cleanSender.split('@')[0]}*
*┋ ⋄ ➠* *📌 ${toStylish('Reason:')}*
*┋ ⋄ ➠* *${toStylish('Repeatedly sending links after warning.')}*
*┋ ⋄ ➠* *🔄 ${toStylish('Action:')}*
*┋ ⋄ ➠* *${toStylish('User has been removed from the group.')}*
${bottomBorder}
                `.trim(),
                mentions: [cleanSender]
            });

            try {
                await conn.groupParticipantsUpdate(from, [cleanSender], "remove");
                console.log(`User ${cleanSender} removed from ${from} for sending links`);
            } catch (removeErr) {
                console.error('Antilink remove failed:', removeErr.message);
                await conn.sendMessage(from, {
                    text: `
${topBorder}
*┋*      ${toStylish('E R R O R')}
${midBorder}
*┋ ⋄ ➠* *${toStylish('❌ Failed to remove user.')}*
*┋ ⋄ ➠* *${toStylish('Please check bot permissions.')}*
${bottomBorder}
                    `.trim(),
                    mentions: [cleanSender]
                });
            }
        }

    } catch (e) {
        console.error('Antilink detect error:', e.message);
    }
});

// ============================================
// 🧹 CLEAR WARNINGS COMMAND
// ============================================
cmd({
    pattern: "clearwarnings",
    alias: ["clearwarn", "resetwarnings", "resetwarn"],
    desc: "Clear all warnings for a specific user or all users",
    category: "group",
    react: "🧹",
    use: ".clearwarnings [@user|all]",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, reply, sender, mentionedJid }) => {
    try {
        if (!isGroup) return reply(`❌ Tʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs.`);

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isOwner && !isCreator && !isAdmin) {
            return reply(`❌ Oɴʟʏ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs ᴏʀ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs.`);
        }

        const target = args[0]?.toLowerCase();

        if (target === 'all') {
            let count = 0;
            for (const key of antilinkWarnings.keys()) {
                if (key.startsWith(from + ':')) {
                    antilinkWarnings.delete(key);
                    count++;
                }
            }
            return reply(`
${topBorder}
*┋*      ${toStylish('W A R N I N G S   C L E A R E D')}
${midBorder}
*┋ ⋄ ➠* *${toStylish(`🧹 Cleared ${count} warning(s)`)}*
*┋ ⋄ ➠* *${toStylish('✅ All warnings removed from this group.')}*
${bottomBorder}
            `.trim());
        }

        if (mentionedJid && mentionedJid.length > 0) {
            const targetJid = normalizeJid(mentionedJid[0]);
            const warnKey = `${from}:${targetJid}`;
            if (antilinkWarnings.has(warnKey)) {
                antilinkWarnings.delete(warnKey);
                return reply(`
${topBorder}
*┋*      ${toStylish('W A R N I N G   C L E A R E D')}
${midBorder}
*┋ ⋄ ➠* *${toStylish(`🧹 Cleared warnings for @${targetJid.split('@')[0]}`)}*
*┋ ⋄ ➠* *${toStylish('✅ All warnings removed.')}*
${bottomBorder}
                `.trim(), { mentions: [targetJid] });
            } else {
                return reply(`❌ Nᴏ ᴡᴀʀɴɪɴɢs ғᴏᴜɴᴅ ғᴏʀ @${targetJid.split('@')[0]}`, { mentions: [targetJid] });
            }
        }

        const warnings = [];
        for (const [key, value] of antilinkWarnings.entries()) {
            if (key.startsWith(from + ':')) {
                const user = key.split(':')[1];
                warnings.push(`• @${user.split('@')[0]}: ${value} warning(s)`);
            }
        }

        if (warnings.length === 0) {
            return reply(`
${topBorder}
*┋*      ${toStylish('N O   W A R N I N G S')}
${midBorder}
*┋ ⋄ ➠* *${toStylish('📊 No warnings in this group')}*
*┋ ⋄ ➠* *${toStylish('✅ All users have 0 warnings.')}*
${bottomBorder}
            `.trim());
        }

        return reply(`
${topBorder}
*┋*      ${toStylish('W A R N I N G   L I S T')}
${midBorder}
*┋ ⋄ ➠* *${toStylish(`📊 Total: ${warnings.length} user(s)`)}*
*┋ ⋄ ➠* *${toStylish('───────────────')}*
*┋ ⋄ ➠* *${toStylish(warnings.join('\n*┋ ⋄ ➠* *'))}*
*┋ ⋄ ➠* *${toStylish('')}*
*┋ ⋄ ➠* *${toStylish('Commands:')}*
*┋ ⋄ ➠* *${toStylish('.clearwarnings @user - Clear specific')}*
*┋ ⋄ ➠* *${toStylish('.clearwarnings all - Clear all')}*
${bottomBorder}
        `.trim());

    } catch (e) {
        console.error('Clear warnings error:', e.message);
        reply(`❌ Fᴀɪʟᴇᴅ ᴛᴏ ᴄʟᴇᴀʀ ᴡᴀʀɴɪɴɢs: ${e.message}`);
    }
});

// ============================================
// 📊 ANTI-LINK STATS COMMAND
// ============================================
cmd({
    pattern: "antilinkstats",
    alias: ["linkstats", "antistats"],
    desc: "Show antilink statistics for current group",
    category: "group",
    react: "📊",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply(`❌ Tʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs.`);

        const isEnabled = antilinkGroups.get(from) || false;
        let totalWarnings = 0;
        let warnedUsers = 0;

        for (const [key, value] of antilinkWarnings.entries()) {
            if (key.startsWith(from + ':')) {
                totalWarnings += value;
                warnedUsers++;
            }
        }

        const groupMeta = await conn.groupMetadata(from);
        const totalMembers = groupMeta.participants?.length || 0;

        return reply(`
${topBorder}
*┋*      ${toStylish('A N T I - L I N K   S T A T S')}
${midBorder}
*┋ ⋄ ➠* *${toStylish(`📊 Status: ${isEnabled ? '🟢 Active' : '🔴 Inactive'}`)}*
*┋ ⋄ ➠* *${toStylish(`👥 Members: ${totalMembers}`)}*
*┋ ⋄ ➠* *${toStylish(`⚠️ Warnings: ${totalWarnings}`)}*
*┋ ⋄ ➠* *${toStylish(`👤 Warned Users: ${warnedUsers}`)}*
*┋ ⋄ ➠* *${toStylish(`🔗 Links Blocked: ${totalWarnings}`)}*
*┋ ⋄ ➠* *${toStylish('')}*
*┋ ⋄ ➠* *${toStylish('Commands:')}*
*┋ ⋄ ➠* *${toStylish('.antilink on/off - Enable/Disable')}*
*┋ ⋄ ➠* *${toStylish('.clearwarnings @user - Clear warnings')}*
*┋ ⋄ ➠* *${toStylish('.antilinkstats - This menu')}*
${bottomBorder}
        `.trim());

    } catch (e) {
        console.error('Antilink stats error:', e.message);
        reply(`❌ Fᴀɪʟᴇᴅ ᴛᴏ ɢᴇᴛ sᴛᴀᴛs: ${e.message}`);
    }
});
