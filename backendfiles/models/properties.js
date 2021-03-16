//This ensures that the server doesn't send properties added by MongoDB

module.exports = {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
        }
    }
}