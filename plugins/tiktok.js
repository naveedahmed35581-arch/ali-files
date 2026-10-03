const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tiktokdl", "tt"],
    react: '📥',
    desc: "Download TikTok videos",
    category: "download",
    use: ".tiktok <TikTok video URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        const tiktokUrl = args[0];
        if (!tiktokUrl || !tiktokUrl.includes("tiktok.com")) {
            return reply('❌ Please provide a valid TikTok video URL.\n\nExample: .tiktok https://tiktok.com/...');
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiUrl = `https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(tiktokUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (!response.data || response.data.status !== 200 || !response.data.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('❌ Unable to fetch the video. Please check the URL and try again.');
        }

        const { title, author, metrics, url } = response.data.result;

        const videoResponse = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        if (!videoResponse.data) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('❌ Failed to download the video. Please try again later.');
        }

        const videoBuffer = Buffer.from(videoResponse.data, 'binary');

        const caption =
`*╭┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*
*┋* *_ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ_*
*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*
*┋➠ 🎬 ᴛɪᴛʟᴇ:* ${title || 'No title'}
*┋➠ 👤 ᴀᴜᴛʜᴏʀ:* @${author?.username || 'N/A'} (${author?.nickname || 'N/A'})
*┋➠ ❤️ ʟɪᴋᴇs:* ${metrics?.digg_count ?? 'N/A'}
*┋➠ 💬 ᴄᴏᴍᴍᴇɴᴛs:* ${metrics?.comment_count ?? 'N/A'}
*┋➠ 🔁 sʜᴀʀᴇs:* ${metrics?.share_count ?? 'N/A'}
*┋➠ ✅ sᴛᴀᴛᴜs:* ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ
*┋➠ 🤖 ʙᴏᴛ:* Ali Md mini bot
*╰┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*`;

        await conn.sendMessage(from, {
            video: videoBuffer,
            caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Error downloading TikTok video:', error.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❌ Unable to download the video. Please try again later.');
    }
});
