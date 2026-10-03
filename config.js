const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "ALI MD MINI BOT", 
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://offarslan_db_user:arslanmd@cluster0.xrqkzwg.mongodb.net/?appName=Cluster0',
    
    PREFIX: process.env.PREFIX || '.',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '923292532170',
    BOT_NAME: "Ali Md mini bot",
    OWNER_NAME: 'mr Ali Md',
    IK_IMAGE_PATH: 'https://i.ibb.co/PvCxgJjh/491f2cf33ce1.jpg',
    BOT_FOOTER: 'Power by Ali Md mini bot',
    
    WORK_TYPE: process.env.WORK_TYPE || "public", 
    
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || 'true',
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'true',
    AUTO_LIKE_EMOJI: ['❤️', '🌹', '😇', '💥', '🔥', '💫', '💎', '💙', '🌝', '💚'], 
    
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'false',
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || 'Nice status! 🔥',
    
    READ_MESSAGE: process.env.READ_MESSAGE || 'false',
    AUTO_TYPING: process.env.AUTO_TYPING || 'false',
    AUTO_RECORDING: process.env.AUTO_RECORDING || 'false',
    
    WELCOME_ENABLE: process.env.WELCOME_ENABLE || 'true',
    GOODBYE_ENABLE: process.env.GOODBYE_ENABLE || 'true',
    WELCOME_MSG: process.env.WELCOME_MSG || null, 
    GOODBYE_MSG: process.env.GOODBYE_MSG || null, 
    WELCOME_IMAGE: process.env.WELCOME_IMAGE || null, 
    GOODBYE_IMAGE: process.env.GOODBYE_IMAGE || null,
    ADMIN_ACTION: process.env.ADMIN_ACTION || 'false',
    
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK || '',
    
    ANTI_CALL: process.env.ANTI_CALL || 'false',
    REJECT_MSG: process.env.REJECT_MSG || '*📞 Call rejected automatically. No calls allowed.*',
    
    IMAGE_PATH: 'https://i.ibb.co/PvCxgJjh/491f2cf33ce1.jpg',
    CHANNEL_LINK: process.env.CHANNEL_LINK || '',
    
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || 'same',
    
    NEWSLETTER_JIDS: process.env.NEWSLETTER_JIDS
    ? process.env.NEWSLETTER_JIDS.split(',').map(j => j.trim())
    : [
        '120363413386172269@newsletter',
        '120363365530973563@newsletter',
        '120363420163227139@newsletter',
        '120363407898199836@newsletter'
    ],

    // ✅ NEW: AUTOREACT — global defaults (per-number override lives in MongoDB userConfig)
    AUTO_REACT: process.env.AUTO_REACT || 'false',
    AUTO_REACT_EMOJIS: [], // per-number custom pool override, saved via .autoreactset
    AUTO_REACT_DEFAULT_EMOJIS: [
        '😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳','😇','🙃','😉','😌',
        '🤗','🤔','😏','😴','🤤','😜','🤪','🥴','😱','😭','😤','😡','🤯','🥶','🥵',
        '😷','🤒','👻','💀','👽','🤖','🎃','😺','💯','🔥','✨','⭐','🌟','💫','🌈',
        '☀️','🌙','⚡','💥','🎉','🎊','🎁','🏆','🥇','❤️','🧡','💛','💚','💙','💜',
        '🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','👍','👎','👏',
        '🙌','🤝','🙏','💪','✌️','🤞','👌','🤙','🎯','🚀','🌸','🌹','🌺','🍀','🍎',
        '🍕','🍔','☕','🍺','⚽','🏀','🎮','🎧','📸','🎬'
    ],
    
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '7214172448:AAHGqSgaw-zGVPZWvl8msDOVDhln-9kExas',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7825445776'
};
