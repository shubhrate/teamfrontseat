const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    id: {
        type: String,
        required: false,
    }
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    plays: {
        type: Array,
        required: false,
    }
});

module.exports = mongoose.model('Users', UserSchema);