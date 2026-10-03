const { cmd } = require('../command');
const config = require('../config');

function normalizeJid(jid) {
    if (!jid) return jid;
    const [user, server] = jid.split('@');
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@${server}`;
}

async function checkBotIsAdmin(conn, from) {
    try {
        const groupMeta = await conn.groupMetadata(from);
        if (!groupMeta || !groupMeta.participants) return false;

        const candidates = [conn.user?.id, conn.user?.lid].filter(Boolean).map(normalizeJid);
        if (candidates.length === 0) return false;

        const botParticipant = groupMeta.participants.find(p => {
            const pJid = normalizeJid(p.id);
            const pLid = p.lid ? normalizeJid(p.lid) : null;
            return candidates.includes(pJid) || (pLid && candidates.includes(pLid));
        });

        if (!botParticipant) return false;
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

// ✅ Target user nikalne ke 3 tareeqe support: @mention, reply-to-message, ya khud number likhna
function extractTargets(m, mentionedJid, args) {
    const targets = [];

    if (mentionedJid && mentionedJid.length > 0) {
        targets.push(...mentionedJid.map(normalizeJid));
    } else if (m?.quoted?.sender) {
        targets.push(normalizeJid(m.quoted.sender));
    } else if (args && args[0]) {
        const digits = args[0].replace(/[^0-9]/g, '');
        if (digits.length >= 8) {
            targets.push(`${digits}@s.whatsapp.net`);
        }
    }

    return [...new Set(targets)];
}

// ==================== PROMOTE ====================
cmd({
    pattern: "promote",
    desc: "Promote a member to group admin",
    category: "group",
    react: "⬆️",
    use: ".promote @user  |  reply to user's message with .promote",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, sender, reply, quoted }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isOwner && !isCreator && !isAdmin) {
            return reply("❌ Only group admins or the owner can use this.");
        }

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ Make the bot an admin first, then try .promote again.");

        const mentionedJid = m.mentionedJid || quoted?.mentionedJid || [];
        const targets = extractTargets(m, mentionedJid, args);

        if (targets.length === 0) {
            return reply("❓ Usage:\n.promote @user\nOr reply to their message with .promote\nOr .promote <number>");
        }

        try {
            await conn.groupParticipantsUpdate(from, targets, "promote");
            const names = targets.map(t => `@${t.split('@')[0]}`).join(', ');
            await conn.sendMessage(from, {
                text: `✅ *Promoted to admin:* ${names}`,
                mentions: targets
            });
        } catch (e) {
            console.error('Promote error:', e.message);
            reply("❌ Failed to promote. Make sure the bot has admin rights and the user is in this group.");
        }

    } catch (e) {
        console.error('Promote cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

// ==================== DEMOTE ====================
cmd({
    pattern: "demote",
    desc: "Demote an admin to regular member",
    category: "group",
    react: "⬇️",
    use: ".demote @user  |  reply to user's message with .demote",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, sender, reply, quoted }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isOwner && !isCreator && !isAdmin) {
            return reply("❌ Only group admins or the owner can use this.");
        }

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ Make the bot an admin first, then try .demote again.");

        const mentionedJid = m.mentionedJid || quoted?.mentionedJid || [];
        const targets = extractTargets(m, mentionedJid, args);

        if (targets.length === 0) {
            return reply("❓ Usage:\n.demote @user\nOr reply to their message with .demote\nOr .demote <number>");
        }

        try {
            await conn.groupParticipantsUpdate(from, targets, "demote");
            const names = targets.map(t => `@${t.split('@')[0]}`).join(', ');
            await conn.sendMessage(from, {
                text: `✅ *Demoted from admin:* ${names}`,
                mentions: targets
            });
        } catch (e) {
            console.error('Demote error:', e.message);
            reply("❌ Failed to demote. Make sure the bot has admin rights and the user is in this group.");
        }

    } catch (e) {
        console.error('Demote cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});
