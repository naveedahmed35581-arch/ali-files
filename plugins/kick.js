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

// ✅ Batching helper — WhatsApp ek call mein sab members remove karne se rate-limit/error deta hai
async function removeBatched(conn, from, jids, delayMs = 1200, batchSize = 5) {
    const removed = [];
    const failed = [];

    for (let i = 0; i < jids.length; i += batchSize) {
        const batch = jids.slice(i, i + batchSize);
        try {
            await conn.groupParticipantsUpdate(from, batch, "remove");
            removed.push(...batch);
        } catch (e) {
            failed.push(...batch);
        }
        await new Promise(r => setTimeout(r, delayMs));
    }

    return { removed, failed };
}

// ==================== KICK (single/mentioned users) ====================
cmd({
    pattern: "kick",
    alias: ["remove"],
    desc: "Remove a member from the group",
    category: "group",
    react: "🚫",
    use: ".kick @user  |  reply to user's message with .kick",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, sender, reply, quoted, botNumber2 }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isOwner && !isCreator && !isAdmin) {
            return reply("❌ Only group admins or the owner can use this.");
        }

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ Make the bot an admin first, then try .kick again.");

        const mentionedJid = m.mentionedJid || quoted?.mentionedJid || [];
        const targets = extractTargets(m, mentionedJid, args);

        if (targets.length === 0) {
            return reply("❓ Usage:\n.kick @user\nOr reply to their message with .kick\nOr .kick <number>");
        }

        // Bot khud ko ya owner ko na kick kar sake
        const safeTargets = targets.filter(t => t !== normalizeJid(botNumber2) && !config.OWNER_NUMBER.includes(t.split('@')[0]));

        if (safeTargets.length === 0) {
            return reply("❌ Can't remove the bot or the owner.");
        }

        try {
            await conn.groupParticipantsUpdate(from, safeTargets, "remove");
            const names = safeTargets.map(t => `@${t.split('@')[0]}`).join(', ');
            await conn.sendMessage(from, {
                text: `✅ *Removed:* ${names}`,
                mentions: safeTargets
            });
        } catch (e) {
            console.error('Kick error:', e.message);
            reply("❌ Failed to remove. Make sure the bot has admin rights and the user is in this group.");
        }

    } catch (e) {
        console.error('Kick cmd error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

// ==================== KICKALL (remove all non-admin members) ====================
cmd({
    pattern: "kickall",
    desc: "Remove all non-admin members from the group (owner only)",
    category: "group",
    react: "⚠️",
    use: ".kickall confirm",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, reply, botNumber2 }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isOwner && !isCreator) return reply("❌ Only the bot owner can use this command — it's destructive.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ Make the bot an admin first, then try .kickall again.");

        if ((args[0] || '').toLowerCase() !== 'confirm') {
            return reply(`⚠️ *This will remove ALL non-admin members from the group!*\n\nTo confirm, send:\n.kickall confirm`);
        }

        const groupMeta = await conn.groupMetadata(from);
        const botJids = [conn.user?.id, conn.user?.lid].filter(Boolean).map(normalizeJid);

        const targets = groupMeta.participants
            .filter(p => p.admin !== 'admin' && p.admin !== 'superadmin')
            .map(p => normalizeJid(p.id))
            .filter(jid => !botJids.includes(jid) && !config.OWNER_NUMBER.includes(jid.split('@')[0]));

        if (targets.length === 0) {
            return reply("ℹ️ No removable (non-admin) members found.");
        }

        await conn.sendMessage(from, { text: `⏳ *Removing ${targets.length} member(s)...* This may take a bit.` });

        const { removed, failed } = await removeBatched(conn, from, targets);

        await conn.sendMessage(from, {
            text: `✅ *Kickall complete*\n\n👥 Removed: ${removed.length}\n❌ Failed: ${failed.length}`
        });

    } catch (e) {
        console.error('Kickall error:', e.message);
        reply("❌ Error: " + e.message);
    }
});

// ==================== OUTALL (remove literally everyone, then bot leaves) ====================
cmd({
    pattern: "outall",
    desc: "Remove EVERYONE (including admins) from the group, then the bot leaves too (owner only)",
    category: "group",
    react: "💥",
    use: ".outall confirm",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isOwner && !isCreator) return reply("❌ Only the bot owner can use this command — it's extremely destructive.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ Make the bot an admin first, then try .outall again.");

        if ((args[0] || '').toLowerCase() !== 'confirm') {
            return reply(`💥 *WARNING: This will remove EVERYONE from the group (including admins), then the bot will leave.*\n\nThis cannot be undone.\n\nTo confirm, send:\n.outall confirm`);
        }

        const groupMeta = await conn.groupMetadata(from);
        const botJids = [conn.user?.id, conn.user?.lid].filter(Boolean).map(normalizeJid);

        const targets = groupMeta.participants
            .map(p => normalizeJid(p.id))
            .filter(jid => !botJids.includes(jid));

        if (targets.length === 0) {
            return reply("ℹ️ No other members to remove.");
        }

        await conn.sendMessage(from, { text: `💥 *Removing ALL ${targets.length} member(s)...* Bot will leave after.` });

        const { removed, failed } = await removeBatched(conn, from, targets);

        try {
            await conn.sendMessage(from, {
                text: `✅ *Outall complete*\n\n👥 Removed: ${removed.length}\n❌ Failed: ${failed.length}\n\n👋 Bot is leaving the group now.`
            });
        } catch (_) {}

        await new Promise(r => setTimeout(r, 1500));

        try {
            await conn.groupLeave(from);
        } catch (e) {
            console.error('Bot leave error:', e.message);
        }

    } catch (e) {
        console.error('Outall error:', e.message);
        reply("❌ Error: " + e.message);
    }
});
