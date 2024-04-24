const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'Author', required: true }, //NOTE reference to Author model
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: [{ type: Schema.Types.ObjectId, ref: 'Genre' }], // NOTE reference to Genre model
});

// Virtual for book URL

BookSchema.virtual('url').get(function () {
    return `/catalog/book/${this._id}`;
});

module.exports = mongoose.model('Book', BookSchema);
