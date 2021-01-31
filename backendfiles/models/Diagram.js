const mongoose = require('mongoose');

const DiagramSchema = mongoose.Schema({
    diagramID: {
        type: String,
        required: true
    },
    entities: {
        type: Array,
        required: false
    },
});

module.exports = mongoose.model('Diagrams', DiagramSchema);
