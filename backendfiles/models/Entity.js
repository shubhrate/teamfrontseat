const mongoose = require('mongoose');
const properties = require('./properties');

const EntitySchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
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
}, properties);

module.exports = mongoose.model('Entities', EntitySchema);