const mongoose = require('mongoose');
const properties = require('./properties');

const DiagramSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    entities: {
        type: Array,
        required: false
    },
}, properties);

module.exports = mongoose.model('Diagrams', DiagramSchema);
