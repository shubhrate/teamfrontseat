const mongoose = require('mongoose');

const EntitySchema = mongoose.Schema({
    diagramID: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    drawType: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    color2: {
        type: String,
        required: true
    },
    posX: {
        type: Number,
        required: true
    },
    posY: {
        type: Number,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    angle: {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('Entities', EntitySchema);
