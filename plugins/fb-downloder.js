const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    desc: "Download Facebook video",
    category: "download",
    react: "📘",
    use: ".fb <facebook url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Facebook video link do\n\nExample:\n.fb https://facebook.com/xxxx");
        }

        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            return reply("❌ Valid Facebook URL nahi hai");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://arslan-apis-v2.vercel.app/download/fbdown?url=${encodeURIComponent(q)}`;
        const { data } = await axios.get(api, { timeout: 60000 });

        if (
            !data?.status ||
            !data?.result?.download ||
            (!data.result.download.hd && !data.result.download.sd)
        ) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Facebook video fetch nahi ho saka");
        }

        const meta = data.result.metadata || {};
        const dl = data.result.download;

        const videoUrl = dl.hd || dl.sd;
        const quality = dl.hd ? "HD" : "SD";

        const caption =
`*╭┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*
*┋* *_ғᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ_*
*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*
*┋➠ 🎬 ᴛɪᴛʟᴇ:* ${meta.title || 'N/A'}
*┋➠ ⏱️ ᴅᴜʀᴀᴛɪᴏɴ:* ${meta.duration || 'N/A'}
*┋➠ 📊 ᴀᴠᴀɪʟᴀʙʟᴇ:* HD${dl.hd ? ' ✅' : ' ❌'} | SD${dl.sd ? ' ✅' : ' ❌'}
*┋➠ 📹 ǫᴜᴀʟɪᴛʏ:* ${quality}
*┋➠ ✅ sᴛᴀᴛᴜs:* ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ
*┋➠ 🤖 ʙᴏᴛ:* Ali - xD
*╰┉┉┉┉◉◉◉┉┉┉┉┉┉┉┉┉━┈⍟*`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption,
            contextInfo: {
                externalAdReply: {
                    title: meta.title || "Facebook Video",
                    body: "Facebook Downloader",
                    thumbnailUrl: meta.thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("FB-DL ERROR:", err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error aagaya, thori dair baad try karo");
    }
});
