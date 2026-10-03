const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

const IMGBB_API_KEY = '8db492efc937a635b90680a9a860dc85';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

async function getImageBuffer(mek, m) {
    try {
        // ✅ FIX: aapke bot ka m.quoted (lib/msg.js se) already download() function
        // deta hai jo view-once ko bhi handle karta hai — Baileys ka
        // downloadMediaMessage seedha use karne ki zarurat nahi
        if (m.quoted && m.quoted.mtype === 'imageMessage') {
            return await m.quoted.download();
        }
        if (m.mtype === 'imageMessage' && m.download) {
            return await m.download();
        }
        return null;
    } catch (e) {
        console.error('getImageBuffer error:', e.message);
        return null;
    }
}

async function uploadToImgBB(buffer) {
    try {
        const form = new FormData();
        form.append('key', IMGBB_API_KEY);
        form.append('image', buffer.toString('base64'));
        form.append('name', `alimd_${Date.now()}.jpg`);

        const res = await axios.post(IMGBB_UPLOAD_URL, form, {
            headers: form.getHeaders(),
            timeout: 60000
        });
        return res.data?.data?.url || null;
    } catch (e) {
        console.error('uploadToImgBB error:', e.message);
        return null;
    }
}

cmd({
    pattern: "image2url",
    alias: ["url", "uploadimg", "imgbb"],
    desc: "Upload an image and get a shareable URL",
    category: "utility",
    react: "⏳",
    use: ".image2url (reply to an image)",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const imageBuffer = await getImageBuffer(mek, m);
        if (!imageBuffer) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('❌ Please reply to an image (or send an image with this as caption)');
        }

        await reply('📤 Uploading to ImgBB...');
        const imageUrl = await uploadToImgBB(imageBuffer);

        if (!imageUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('❌ Upload failed');
        }

        await reply(`✅ *Image Uploaded!*\n\n🔗 *URL:* ${imageUrl}`);
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('image2url error:', error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ ${error.message}`);
    }
});
