const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "getpp",
    alias: ["gp", "getpic"],
    desc: "Get profile picture of a user or group",
    category: "general",
    react: "🖼️",
    use: ".getpp [@mention | reply | phone number]",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, reply }) => {
    try {
        let targetUser = null;
        let targetType = 'user'; // 'user' or 'chat'

        // ✅ FIX: quoted sender aur mentionedJid, ctx ke fields se nahi —
        // m.quoted.sender aur m.mentionedJid se aate hain (lib/msg.js se)
        if (m.quoted && m.quoted.sender) {
            targetUser = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length) {
            targetUser = m.mentionedJid[0];
        } else if (args.length > 0) {
            const rawNumber = args[0].replace(/\D/g, '');
            if (!rawNumber) {
                return reply('❌ Please provide a valid phone number (e.g., .getpp 923292532170)');
            }
            targetUser = `${rawNumber}@s.whatsapp.net`;
        } else {
            targetUser = from; // group JID or private chat JID
            targetType = 'chat';
        }

        if (!targetUser) {
            return reply('❌ Could not identify target. Use `.getpp @mention`, reply to a message, or provide a number.');
        }

        try {
            const ppUrl = await conn.profilePictureUrl(targetUser, 'image');

            if (!ppUrl) {
                return reply('❌ Profile picture not found for this target.');
            }

            const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            let caption;
            if (targetType === 'chat') {
                caption = isGroup ? '🖼️ Group profile picture' : '👤 Contact profile picture';
                caption += '\n\n💡 *Usage:* `.getpp @mention` / reply / `.getpp number`';
            } else {
                caption = `👤 Profile picture of @${targetUser.split('@')[0]}`;
            }

            await conn.sendMessage(from, {
                image: buffer,
                caption,
                mentions: targetType === 'user' ? [targetUser] : []
            }, { quoted: mek });

        } catch (profileError) {
            const errMsg = profileError.message || '';
            if (errMsg.includes('item-not-found') ||
                errMsg.includes('404') ||
                errMsg.includes('not found') ||
                errMsg.includes('500')) {
                return reply('❌ This user/group does not have a profile picture.');
            } else if (errMsg.includes('forbidden') || errMsg.includes('401')) {
                return reply('❌ Profile picture is private or not available.');
            } else {
                console.error('Profile picture error:', profileError);
                return reply('❌ Failed to retrieve profile picture.');
            }
        }

    } catch (error) {
        console.error('Unexpected error in getpp:', error);
        reply('❌ An unexpected error occurred. Please try again later.');
    }
});
