const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    id: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false,
    },
    plays: {
        type: Array,
        required: false,
    }
});

module.exports = mongoose.model('Users', UserSchema);