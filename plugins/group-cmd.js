const { cmd } = require('../command');
const config = require('../config');

function normalizeJid(jid) {
    if (!jid) return jid;
    const [user, server] = jid.split('@');
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@${server}`;
}

// ✅ FIX: ctx.isBotAdmins/ctx.isAdmins (jo bot.js bharta hai) WhatsApp ke @lid
// privacy format ki wajah se galat nikal sakte hain. Har group command ab
// isi fresh, live check ka istemal karta hai — jaisa antilink/antisticker mein hai.
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

// ==================== ACCEPT ALL JOIN REQUESTS ====================
cmd({
    pattern: "acceptall",
    alias: ["approveall", "allowall"],
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to accept join requests.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("ℹ️ No pending join requests to accept.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");

        reply(`✅ Successfully accepted ${requests.length} join request${requests.length > 1 ? 's' : ''}.`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to accept join requests.");
    }
});

// ==================== REJECT ALL JOIN REQUESTS ====================
cmd({
    pattern: "rejectall",
    alias: ["declineall", "denyall"],
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to reject join requests.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("ℹ️ No pending join requests to reject.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");

        reply(`✅ Successfully rejected ${requests.length} join request${requests.length > 1 ? 's' : ''}.`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to reject join requests.");
    }
});

// ==================== LIST PENDING REQUESTS ====================
cmd({
    pattern: "requests",
    alias: ["pending", "joinlist"],
    desc: "Shows pending group join requests with numbers",
    category: "group",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to view join requests.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("ℹ️ No pending join requests.");

        let text = `📋 *Pending Join Requests (${requests.length})*\n\n`;
        requests.forEach((user, i) => {
            text += `${i + 1}. ${user.jid.replace('@s.whatsapp.net', '')}\n`;
        });

        text += `\n*Usage:*\n• Type \`.accept 1\` to accept request #1\n• Type \`.reject 3\` to reject request #3\n• Type \`.acceptall\` to accept all\n• Type \`.rejectall\` to reject all`;

        reply(text);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to fetch join requests.");
    }
});

// ==================== ACCEPT ONE REQUEST BY NUMBER ====================
cmd({
    pattern: "accept",
    alias: ["approve"],
    desc: "Accept specific join request by number",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, args, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to accept join requests.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        if (!args[0]) return reply("❓ Usage: .accept [number]\nExample: .accept 1");

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return reply("⚠️ Please provide a valid number.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("ℹ️ No pending join requests.");
        if (num > requests.length) return reply(`⚠️ Only ${requests.length} pending request${requests.length > 1 ? 's' : ''} available.`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "approve");

        reply(`✅ Accepted join request #${num} from ${user.replace('@s.whatsapp.net', '')}`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to accept join request.");
    }
});

// ==================== REJECT ONE REQUEST BY NUMBER ====================
cmd({
    pattern: "reject",
    alias: ["decline", "deny"],
    desc: "Reject specific join request by number",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, args, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to reject join requests.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        if (!args[0]) return reply("❓ Usage: .reject [number]\nExample: .reject 2");

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return reply("⚠️ Please provide a valid number.");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("ℹ️ No pending join requests.");
        if (num > requests.length) return reply(`⚠️ Only ${requests.length} pending request${requests.length > 1 ? 's' : ''} available.`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "reject");

        reply(`✅ Rejected join request #${num} from ${user.replace('@s.whatsapp.net', '')}`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to reject join request.");
    }
});

// ==================== ADD USER TO GROUP ====================
cmd({
    pattern: "add",
    desc: "Add user to group",
    category: "group",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ Group only.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I need admin.");

        if (!isCreator) return reply("🔐 Owner only.");

        let userJid = null;

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0) && !args[0]) {
            return reply("❓ Please mention user, quote, or provide number!");
        }

        if (m.mentionedJid && m.mentionedJid.length > 0) {
            userJid = m.mentionedJid[0];
        } else if (m.quoted && m.quoted.sender) {
            userJid = m.quoted.sender;
        } else if (args[0]) {
            const num = args[0].replace(/[^0-9]/g, '');
            if (num.length >= 10) userJid = num + "@s.whatsapp.net";
        }

        if (!userJid) return reply("⚠️ Couldn't determine user.");

        await conn.groupParticipantsUpdate(from, [userJid], "add");
        await conn.sendMessage(from, { text: `✅ Added!`, mentions: [userJid] });

    } catch (err) {
        console.error(err);
        reply("❌ Failed to add user.");
    }
});

// ==================== UPDATE GROUP DESCRIPTION ====================
cmd({
    pattern: "updategdesc",
    alias: ["gdesc", "setdesc", "groupdesc"],
    desc: "Change the group description",
    category: "group",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, q, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to change group description.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        if (!q) return reply("❌ Please provide a new group description.\nExample: `.gdesc Welcome to our group!`");
        if (q.length > 500) return reply("⚠️ Description is too long (max 500 characters).");

        await conn.groupUpdateDescription(from, q);
        reply("✅ Group description updated successfully!");
    } catch (err) {
        console.error(err);
        reply("❌ Failed to update group description.");
    }
});

// ==================== UPDATE GROUP NAME ====================
cmd({
    pattern: "updategname",
    alias: ["gname", "setname", "groupname"],
    desc: "Change the group name",
    category: "group",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, q, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to change group name.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        if (!q) return reply("❌ Please provide a new group name.\nExample: `.gname My New Group`");
        if (q.length > 100) return reply("⚠️ Group name is too long (max 100 characters).");

        await conn.groupUpdateSubject(from, q);
        reply(`✅ Group name changed to: *${q}*`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to update group name.");
    }
});

// ==================== GROUP INFO ====================
cmd({
    pattern: "ginfo",
    alias: ["groupinfo"],
    desc: "Get group information",
    category: "group",
    react: "🥏",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to fetch group info.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        const groupData = await conn.groupMetadata(from);
        const groupAdminsList = groupData.participants?.filter(p => p.admin) || [];

        let text = `*「 Group Information 」*\n\n`;
        text += `*Name:* ${groupData.subject}\n`;
        text += `*ID:* ${groupData.id}\n`;
        text += `*Participants:* ${groupData.participants?.length || 'N/A'}\n`;
        text += `*Created:* ${new Date(groupData.creation * 1000).toLocaleDateString()}\n`;
        text += `*Description:* ${groupData.desc?.slice(0, 100) || 'No description'}${groupData.desc?.length > 100 ? '...' : ''}\n\n`;
        text += `*Admins (${groupAdminsList.length}):*\n`;

        groupAdminsList.forEach((admin, i) => {
            text += `${i + 1}. @${admin.id.split('@')[0]}\n`;
        });

        try {
            const ppUrl = await conn.profilePictureUrl(from, 'image');
            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: text,
                mentions: groupAdminsList.map(a => a.id)
            }, { quoted: mek });
        } catch {
            await conn.sendMessage(from, { text, mentions: groupAdminsList.map(a => a.id) }, { quoted: mek });
        }
    } catch (err) {
        console.error(err);
        reply("❌ Failed to fetch group information.");
    }
});

// ==================== SEND INVITE TO SOMEONE ====================
cmd({
    pattern: "invite",
    alias: ["aja"],
    desc: "Send group invite link to someone",
    category: "group",
    react: "📨",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isCreator, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ Group only.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I need admin.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isCreator && !isAdmin) return reply("🔐 Admins only.");

        if (!args[0]) {
            const code = await conn.groupInviteCode(from);
            return reply(`🔗 Group Link:\nhttps://chat.whatsapp.com/${code}`);
        }

        let number = args[0].replace(/[^0-9]/g, '');
        if (number.length < 10) return reply("⚠️ Invalid number.");

        let jid = number + "@s.whatsapp.net";

        const groupMeta = await conn.groupMetadata(from);
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;

        await conn.sendMessage(jid, {
            text: `📨 *You're invited to join ${groupMeta.subject}*\n\n🔗 ${link}\n\n👤 Invited by: @${m.sender.split('@')[0]}`
        });

        await conn.sendMessage(from, { text: `📨 Invite sent to @${number}`, mentions: [jid] });
    } catch (err) {
        console.error(err);
        reply("❌ Failed to send invite.");
    }
});

// ==================== JOIN A GROUP VIA LINK ====================
cmd({
    pattern: "join",
    alias: ["j", "joinlink", "gclink"],
    desc: "Join a group using invite link",
    category: "group",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { isCreator, q, reply }) => {
    try {
        if (!isCreator) return reply("🔐 Only bot owner can use this command.");

        let link;

        if (m.quoted && m.quoted.text) {
            const linkMatch = m.quoted.text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }

        if (!link && q) {
            const linkMatch = q.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }

        if (!link) {
            return reply("❌ Please provide a valid WhatsApp group invite link.\nExample: .join https://chat.whatsapp.com/ABC123XYZ");
        }

        link = link.split('?')[0];

        try {
            await conn.groupAcceptInvite(link);
            reply("✅ Successfully joined the group!");
        } catch (err) {
            if (err.message?.includes("already") || err.status === 409) {
                reply("ℹ️ I'm already in this group.");
            } else if (err.message?.includes("reset") || err.message?.includes("expired")) {
                reply("❌ This link has expired or been reset.");
            } else if (err.message?.includes("invalid") || err.message?.includes("bad-request")) {
                reply("❌ Invalid group link.");
            } else {
                reply("❌ Failed to join group: " + (err.message || "Unknown error"));
            }
        }
    } catch (err) {
        console.error(err);
        reply("❌ An error occurred while processing the command.");
    }
});

// ==================== LEAVE GROUP ====================
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("❗ This command can only be used in *groups*.");
        if (!isCreator) return reply("❗ This command can only be used by my *owner*.");

        await reply(`_JA RAHA HO ES FALTO GROUP SY JAN E MAN ACHA LGA YAHA AAKY_ ❤️`);
        await new Promise(r => setTimeout(r, 1500));
        await conn.groupLeave(from);
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== GET GROUP LINK ====================
cmd({
    pattern: "link",
    alias: ["gclink", "invitelink"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to get the invite link.");

        const inviteCode = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${inviteCode}`;

        reply(`🔗 *Group Invite Link:*\n\n${link}`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to get group link. I may not have admin permission.");
    }
});

// ==================== CREATE NEW GROUP ====================
cmd({
    pattern: "newgc",
    alias: ["creategroup", "makegroup"],
    desc: "Create a new group and add participants",
    category: "group",
    react: "🆕",
    filename: __filename
}, async (conn, mek, m, { isCreator, body, reply }) => {
    try {
        if (!isCreator) return reply("🔐 Only bot owner can use this command.");

        if (!body) {
            return reply("❓ Usage: `.newgc Group Name;number1,number2,...`\nExample: `.newgc My Group;923292532170,923292532170`");
        }

        const parts = body.split(";");
        if (parts.length < 2) {
            return reply("⚠️ Please provide both group name and numbers.\nFormat: Group Name;number1,number2,...");
        }

        const groupName = parts[0].trim();
        const numbersString = parts[1].trim();

        if (!groupName || !numbersString) return reply("⚠️ Group name and numbers are required.");

        const participantNumbers = numbersString.split(",")
            .map(num => {
                let cleanNum = num.trim();
                if (cleanNum.startsWith("3")) cleanNum = "92" + cleanNum;
                return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
            })
            .filter(num => num.match(/^\d+@s\.whatsapp\.net$/));

        if (participantNumbers.length === 0) {
            return reply("❌ No valid phone numbers provided.\nExample: 923292532170,923292532170");
        }

        const ownerJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!participantNumbers.includes(ownerJid)) participantNumbers.push(ownerJid);

        const group = await conn.groupCreate(groupName, participantNumbers);
        const inviteCode = await conn.groupInviteCode(group.id);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await conn.sendMessage(group.id, {
            text: `🎉 *Welcome to ${groupName}!*\n\nGroup created successfully!\nInvite Link: ${inviteLink}\n\nUse this link to invite more members.`
        });

        reply(`✅ Group created successfully!\n\n📌 *Name:* ${groupName}\n👥 *Members:* ${participantNumbers.length}\n🔗 *Link:* ${inviteLink}\n\nWelcome message sent to the group.`);
    } catch (err) {
        console.error(err);
        if (err.message?.includes("401") || err.message?.includes("not authorized")) {
            reply("❌ I'm not authorized to create groups. Check bot permissions.");
        } else if (err.message?.includes("invalid") || err.message?.includes("phone")) {
            reply("❌ Invalid phone number(s) provided.\nEnsure numbers are in international format: 923292532170");
        } else if (err.message?.includes("too many")) {
            reply("❌ Too many participants. WhatsApp limits group creation to certain numbers.");
        } else {
            reply("❌ Failed to create group: " + (err.message || "Unknown error"));
        }
    }
});

// ==================== POLL ====================
cmd({
    pattern: "poll",
    alias: ["vote", "survey"],
    desc: "Create a poll with question and options",
    category: "group",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, q, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can create polls.");

        if (!q) return reply("❓ Usage: `.poll Question;Option1,Option2,Option3`\nExample: `.poll Best color?;Red,Blue,Green,Black`");

        const parts = q.split(";");
        if (parts.length < 2) return reply("⚠️ Please provide both question and options.\nFormat: Question;Option1,Option2,Option3");

        const question = parts[0].trim();
        const optionsString = parts[1].trim();

        if (!question || !optionsString) return reply("⚠️ Question and options are required.");

        const options = optionsString.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) return reply("❌ Please provide at least two options.");
        if (options.length > 12) return reply("⚠️ Maximum 12 options allowed.");

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply("❌ Failed to create poll.");
    }
});

// ==================== REVOKE / RESET GROUP LINK ====================
cmd({
    pattern: "revoke",
    alias: ["resetlink", "newlink"],
    desc: "Reset group invite link",
    category: "group",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to reset link.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        const newCode = await conn.groupRevokeInvite(from);
        reply(`*✅ Link Reset Successful!*\n\n🔗 https://chat.whatsapp.com/${newCode}`);
    } catch (err) {
        console.error(err);
        reply("❌ Failed to reset link.");
    }
});

// ==================== SET GROUP PROFILE PICTURE ====================
cmd({
    pattern: "gcpp",
    alias: ["gpp", "fullppgc", "gcdp", "groupdp"],
    react: "🏙️",
    desc: "Set group profile picture (reply to an image)",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, sender, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command only works in groups.");

        const botIsAdmin = await checkBotIsAdmin(conn, from);
        if (!botIsAdmin) return reply("❌ I must be admin to change group picture.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("🔐 Only admins can use this command.");

        if (!m.quoted) return reply("*🍁 Please reply to an image with .gcpp*");

        const mtype = m.quoted.mtype;
        if (mtype !== "imageMessage") return reply("❌ Only image messages are supported for group picture");

        const buffer = await m.quoted.download();

        await conn.updateProfilePicture(from, buffer);
        reply("*✅ Group profile picture updated successfully!*");
    } catch (error) {
        console.error("gcpp Error:", error);
        reply("❌ Error updating group picture:\n" + error.message);
    }
});

// ==================== HIDETAG ====================
cmd({
    pattern: "hidetag",
    alias: ["tag", "h"],
    react: "🔊",
    desc: "Tag all members with a message/media",
    category: "group",
    use: '.hidetag Hello',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, sender, participants, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");

        const isAdmin = await checkUserIsAdmin(conn, from, sender);
        if (!isAdmin && !isCreator) return reply("❌ Only group admins can use this command.");

        const mentionAll = { mentions: participants.map(u => u.id) };

        if (!q && !m.quoted) {
            return reply("❌ Please provide a message or reply to a message to tag all members.");
        }

        if (m.quoted) {
            const type = m.quoted.mtype || '';

            if (type === 'extendedTextMessage' || type === 'conversation') {
                return await conn.sendMessage(from, {
                    text: m.quoted.text || 'No message content found.',
                    ...mentionAll
                }, { quoted: mek });
            }

            if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)) {
                try {
                    const buffer = await m.quoted.download?.();
                    if (!buffer) return reply("❌ Failed to download the quoted media.");

                    let content;
                    switch (type) {
                        case "imageMessage":
                            content = { image: buffer, caption: m.quoted.text || "📷 Image", ...mentionAll };
                            break;
                        case "videoMessage":
                            content = {
                                video: buffer,
                                caption: m.quoted.text || "🎥 Video",
                                gifPlayback: m.quoted.gifPlayback || false,
                                ...mentionAll
                            };
                            break;
                        case "audioMessage":
                            content = {
                                audio: buffer,
                                mimetype: "audio/mp4",
                                ptt: m.quoted.ptt || false,
                                ...mentionAll
                            };
                            break;
                        case "stickerMessage":
                            content = { sticker: buffer, ...mentionAll };
                            break;
                        case "documentMessage":
                            content = {
                                document: buffer,
                                mimetype: m.quoted.mimetype || "application/octet-stream",
                                fileName: m.quoted.fileName || "file",
                                caption: m.quoted.text || "",
                                ...mentionAll
                            };
                            break;
                    }

                    if (content) return await conn.sendMessage(from, content, { quoted: mek });
                } catch (e) {
                    console.error("Media download/send error:", e);
                    return reply("❌ Failed to process the media. Sending as text instead.");
                }
            }

            return await conn.sendMessage(from, {
                text: m.quoted.text || "📨 Message",
                ...mentionAll
            }, { quoted: mek });
        }

        if (q) {
            await conn.sendMessage(from, { text: q, ...mentionAll }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        reply(`❌ *Error Occurred !!*\n\n${e.message}`);
    }
});
