const mongoose = require('mongoose');

const PlaySchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    characters: {
        type: Array,
        required: true
    },
    stageID: {
        type: String,
        required: false
    },
    script: {
        type: String,
        required: false
    },
});

module.exports = mongoose.model('Plays', PlaySchema);