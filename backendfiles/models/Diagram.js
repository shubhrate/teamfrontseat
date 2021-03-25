const mongoose = require('mongoose');
const properties = require('./properties');

// Mongoose Schema for Diagram MongoDB collection
const DiagramSchema = mongoose.Schema({
    id: { // useful for checking which diagram a user wants to connect to / update (which play rehearsal)
        type: String,
        required: true
    },
    entities: { // array of entity ids
        type: Array,
        required: false
    },
}, properties);

module.exports = mongoose.model('Diagrams', DiagramSchema);
