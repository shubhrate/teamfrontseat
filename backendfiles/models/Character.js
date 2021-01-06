const mongoose = require('mongoose');

const CharacterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    play: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    actor: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Characters', CharacterSchema);
