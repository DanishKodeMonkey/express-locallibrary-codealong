const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, // NOTE reference to Book model
    imprint: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], // Enum: Allowed values of a string
        default: 'Maintenance',
    },
    due_back: { type: Date, default: Date.now },
});

// ISOdate format for bookInstance.pug
BookInstanceSchema.virtual('due_back_yyyy_mm_dd').get(function () {
    return DateTime.fromJSDate(this.due_back).toISODate(); // format 'YYYY-MM-DD'
});

// Virtual for dateTime formatting
BookInstanceSchema.virtual('due_back_formatted').get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

//virtual for bookInstaance URL

BookInstanceSchema.virtual('url').get(function () {
    // Dont use arrow function as we need object immediately
    return `/catalog/bookinstance/${this._id}`;
});

module.exports = mongoose.model('BookInstance', BookInstanceSchema);
