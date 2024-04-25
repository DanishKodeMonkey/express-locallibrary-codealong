const Genre = require('../models/genre');
const asyncHandler = require('express-async-handler');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render('genre_list', {
        title: 'Genre List',
        genre_list: allGenres,
    });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
    // GET details of genre and all associated books in parallel based on genre id
    // Deconstruct the resolved promises once all have resolved into genre and booksInGenre
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);
    // if genre is null, no results found.
    if (genre === null) {
        // no results
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }
    //otherwise, respond with render.
    res.render('genre_detail', {
        title: 'Genre Detail',
        genre: genre,
        genre_books: booksInGenre,
    });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
    // doesnt use async handler since no code here can throw an exception
    res.render('genre_form', { title: 'Create Genre' });
});

// Handle Genre create on POST.
// Note how the method is an array of middleware. This is required to execute the
// midddleware functions in order
exports.genre_create_post = [
    // Validate and sanitize the name field
    // Take body, trim name, validate name length, escape name (check and remove dangerous HTML)
    body('name', 'Genre name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // Process request after validate and sanitize operation
    asyncHandler(async (req, res, next) => {
        // Extract validation errors from a request
        const errors = validationResult(req);

        //create genre object with checked data
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // Errors were found, render form again with fixed values and error messages
            res.render('genre_form', {
                title: 'Create genre',
                genre: genre,
                errors: errors.array(),
            });
            // finish here dude to error
            return;
        } else {
            //no errors found, proceed.
            const genreExists = await Genre.findOne({
                name: req.body.name,
            })
                // collation is mongoose method that checks for english similarities like Fantasy, fantasy and FaNtaSy
                .collation({ locale: 'en', strength: 2 })
                .exec();
            if (genreExists) {
                //genre exists, redirect to its details page
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                // genre now saved,d redirect to new genre detail paage
                res.redirect(genre.url);
            }
        }
    }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    // GET details of Genres  and their books paralell
    const [genre, allGenreBooks] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);
    if (genre === null) {
        // No results
        // Nothing to delete, redirect.
        res.redirect('/catalog/genres');
    }
    // render genre_delete.pug and pass data
    res.render('genre_delete', {
        title: 'Delete Genre',
        genre: genre,
        genre_books: allGenreBooks,
    });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    const [genre, allGenreBooks] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'genre books').exec(),
    ]);
    if (allGenreBooks.length > 0) {
        // book has instances
        res.render('genre_delete', {
            title: 'Delete genre',
            genre: genre,
            genre_books: allGenreBooks,
        });
        return;
    } else {
        // Book has no instances
        await Genre.findByIdAndDelete(req.body.genreid);
        res.redirect('/catalog/genres');
    }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update GET');
});

// Handle Genre update on POST.
exports.genre_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update POST');
});
