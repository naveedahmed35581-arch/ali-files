const mongoose = require('mongoose');

const antideleteSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    status: { type: Boolean, default: false }
});
const Antidelete = mongoose.model('Antidelete', antideleteSchema);

// ✅ NEW: ANTI_DEL_PATH ('inbox'/'same') ko bhi Mongo mein persist karo,
// taake dyno restart pe reset na ho (jo crash-loop ke dauran ho raha tha)
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String }
});
const BotSetting = mongoose.model('BotSetting', settingsSchema);

const getAntideleteStatus = async (chatId) => {
    try {
        const data = await Antidelete.findOne({ chatId });
        return data ? data.status : false;
    } catch (e) { return false; }
};

const setAntideleteStatus = async (chatId, status) => {
    try {
        await Antidelete.findOneAndUpdate({ chatId }, { status }, { upsert: true, new: true });
        return true;
    } catch (e) { return false; }
};

const getAntiDelPath = async () => {
    try {
        const doc = await BotSetting.findOne({ key: 'ANTI_DEL_PATH' });
        return doc ? doc.value : 'same';
    } catch (e) { return 'same'; }
};

const setAntiDelPath = async (value) => {
    try {
        await BotSetting.findOneAndUpdate({ key: 'ANTI_DEL_PATH' }, { value }, { upsert: true, new: true });
        return true;
    } catch (e) { return false; }
};

module.exports = { Antidelete, getAntideleteStatus, setAntideleteStatus, getAntiDelPath, setAntiDelPath };
