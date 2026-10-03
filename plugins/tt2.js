const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok2",
    alias: ["tt2"],
    react: "⬇️",
    desc: "Download TikTok videos (Alternative API)",
    category: "download",
    use: ".tiktok2 <TikTok URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, q }) => {
    try {
        const tiktokUrl = q || args.join(' ');

        if (!tiktokUrl) {
            return reply('*❌ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴛɪᴋᴛᴏᴋ ᴜʀʟ*\n*ᴜsᴀɢᴇ:* .tiktok2 https://vm.tiktok.com/xxxxx');
        }

        if (!tiktokUrl.includes('tiktok.com')) {
            return reply('*❌ Please provide a valid TikTok URL*');
        }

        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        const response = await axios.get(`https://apis.davidcyriltech.my.id/download/tiktokv3?url=${encodeURIComponent(tiktokUrl)}`, { timeout: 30000 });

        if (!response.data?.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`*❌ Failed to fetch TikTok video*\n\nError: ${response.data?.message || 'Unknown error'}`);
        }

        const { author, description, video } = response.data;

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        const caption =
`*╭┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*
*┋* *_ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ_*
*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*
*┋➠ 👤 ᴀᴜᴛʜᴏʀ:* ${author || 'N/A'}
*┋➠ 📝 ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:* ${description || 'N/A'}
*┋➠ ✅ sᴛᴀᴛᴜs:* ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ
*┋➠ 🤖 ʙᴏᴛ:* Ali Md mini bot
*╰┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*`;

        await conn.sendMessage(from, {
            video: { url: video },
            caption
        }, { quoted: mek });

    } catch (error) {
        console.error('❌ TikTok2 download error:', error.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`*❌ Failed to download TikTok video*\n\nError: ${error.message || 'Unknown error'}`);
    }
});
