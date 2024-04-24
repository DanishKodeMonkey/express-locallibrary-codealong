/* THIS IS A LEFTOVER EXPERIMENT MODULE REGARDING MONGODB IMPLEMENTATION

It serves no other purpose than a reminder of certain techniques to use alongside mongoose.
*/

// import mongoose package
const mongoose = require('mongoose');

// set strictQuery to false for non-existing filtering properties
mongoose.set('strictQuery', 'false');

// Declare connection string
const mongoDB = 'connectionstring';

// call async function main(), catch errors
main().catch(err => console.log(err));

// async main () attempts to connect.
async function main() {
    await mongoose.connect(mongoDB);
}

// define schema

const Schema = mongoose.Schema;

const someModelSchema = new Schema({
    name: String,
    binary: Buffer,
    living: Boolean,
    updated: { type: Date, default: Date.now() },
    age: { type: Number, min: 18, max: 65, required: true },
    mixed: Schema.Types.Mixed, // Anything goes schema type, can use anything here.
    _someId: Schema.Types.ObjectId, // unique ID to associate with each item, auto generated.
    array: [],
    ofString: [String], // Can also have array of each of the other types  too
    nested: { stuff: { type: String, lowercase: true, trim: true } },
});

// example 2, schema validators

const breakfastSchema = new Schema({
    eggs: {
        type: Number,
        min: [6, 'Too few eggs'],
        max: 12,
        required: [true, 'Why not eggs :('],
    },
    drink: {
        type: String,
        enum: ['Coffee', 'Tea', 'Water'],
    },
});
