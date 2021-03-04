const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: {
<<<<<<< HEAD
        type: String,
        required: false
=======
            type: String,
            required: false,
>>>>>>> 210d82724b5606038bf0a7c9c3376eeb8616c106
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