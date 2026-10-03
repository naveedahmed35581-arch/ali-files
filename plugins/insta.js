const { cmd } = require('../command');
const axios = require('axios');

async function fetchIgVideo(url) {
    // ✅ Multiple APIs try karo, jo bhi pehle kaam kare
    try {
        const res = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`, { timeout: 30000 });
        if (res.data?.status && res.data.data?.length) {
            return { items: res.data.data.map(i => ({ url: i.url, type: i.type })), meta: {} };
        }
    } catch (_) {}

    try {
        const res = await axios.get(`https://bk9.fun/download/instagram?url=${encodeURIComponent(url)}`, { timeout: 30000 });
        if (res.data?.status && res.data?.BK9?.[0]?.url) {
            return { items: [{ url: res.data.BK9[0].url, type: 'video' }], meta: {} };
        }
    } catch (_) {}

    try {
        const res = await axios.get(`https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`, { timeout: 30000 });
        if (res.data?.status && Array.isArray(res.data.result) && res.data.result[0]) {
            return { items: [{ url: res.data.result[0], type: 'video' }], meta: res.data.metadata || {} };
        }
    } catch (_) {}

    return null;
}

cmd({
    pattern: "igdl",
    alias: ["instagram", "insta", "ig"],
    react: "⬇️",
    desc: "Download Instagram videos/reels",
    category: "download",
    use: ".igdl <Instagram URL>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const url = q || m.quoted?.text;
        if (!url || !url.includes("instagram.com")) {
            return reply("❌ Please provide/reply to an Instagram link");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const result = await fetchIgVideo(url);
        if (!result || !result.items.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ Failed to fetch media. Invalid link or private content.");
        }

        const meta = result.meta || {};

        for (const item of result.items) {
            const caption =
`*╭┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*
*┋* *_ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ_*
*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*
*┋➠ 👤 ᴀᴜᴛʜᴏʀ:* ${meta.author || 'N/A'}
*┋➠ ❤️ ʟɪᴋᴇs:* ${meta.like || 'N/A'}
*┋➠ 💬 ᴄᴏᴍᴍᴇɴᴛs:* ${meta.comment || 'N/A'}
*┋➠ 📹 ᴛʏᴘᴇ:* ${item.type === 'video' ? 'Video' : 'Image'}
*┋➠ ✅ sᴛᴀᴛᴜs:* ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ
*┋➠ 🤖 ʙᴏᴛ:* Ali Md mini bot
*╰┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*`;

            await conn.sendMessage(from, {
                [item.type === 'video' ? 'video' : 'image']: { url: item.url },
                caption
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('IGDL Error:', error.message);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ Download failed. Try again later.");
    }
});
