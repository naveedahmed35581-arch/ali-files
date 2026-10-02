const mongoose = require('mongoose');

const sudoSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true }
});

const Sudo = mongoose.models.Sudo || mongoose.model('Sudo', sudoSchema);

const getAllSudo = async () => {
    try {
        const list = await Sudo.find({});
        return list.map(s => s.number);
    } catch (e) {
        console.error('getAllSudo error:', e.message);
        return [];
    }
};

const addSudo = async (number) => {
    try {
        const clean = number.replace(/[^0-9]/g, '');
        await Sudo.findOneAndUpdate(
            { number: clean },
            { $setOnInsert: { number: clean } },
            { upsert: true, new: true }
        );
        return true;
    } catch (e) {
        console.error('addSudo error:', e.message);
        return false;
    }
};

const removeSudo = async (number) => {
    try {
        const clean = number.replace(/[^0-9]/g, '');
        await Sudo.deleteOne({ number: clean });
        return true;
    } catch (e) {
        console.error('removeSudo error:', e.message);
        return false;
    }
};

module.exports = { Sudo, getAllSudo, addSudo, removeSudo };
