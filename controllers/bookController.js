const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');

const asyncHandler = require('express-async-handler');

exports.index = asyncHandler(async (req, res, next) => {
    // GET details of books, book instances, authors and genre counts in parallel;
    // do this asynchronously and return result once all promises resolve
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: 'Available' }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);
    // create response object with gathered data, using specified view (index)
    res.render('index', {
        title: 'Local Library Home',
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
    // declare a mongoose mongoDB method chain.
    // We call find() on the Book model, returning only title and author, sort the result by title, ascending.
    // and Populate() on Book, with the author field, replacing the book author id with the full author details.
    // execute chain query with .exec()
    const allBooks = await Book.find({}, 'title author')
        .sort({ title: 1 })
        .populate('author')
        .exec();

    // call render, sending the values for the title and book_list, the result of the chain query, to book_list.pug
    res.render('book_list', { title: 'Book List', book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
    // Get details of books, book instances for specific book
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if (book === null) {
        // No results.
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    res.render('book_detail', {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
    // GET all authors and genres, which we use for adding to our book
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);
    res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres,
    });
});

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) => {
        // if array is not req.body.genre make it so.
        if (!Array.isArray(req.body.genre)) {
            req.body.genre =
                typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
        }
        next();
    },
    // validate and sanitize
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    //note wildcard: 'Sanitize every item below key genre'
    body('genre.*').escape(),

    // Process request
    asyncHandler(async (req, res, next) => {
        // extract validation errors
        const errors = validationResult(req);

        // create book object
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: rq.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if (!errors.isEmpty()) {
            // Errors re-render form

            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);
            // Mark selected genres as checked
            for (const genre of allGenres) {
                if (book.genre.includes(genre._id)) {
                    genre.checked = 'true';
                }
            }
            // pass data to book_form.pug
            res.render('book_form', {
                title: 'Create Book',
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
        } else {
            //save data
            await book.save();
            res.redirect(book.url);
        }
    }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    // GET details of book and their instances paralell
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, 'book instances').exec(),
    ]);
    if (book === null) {
        // No results
        // Nothing to delete, redirect.
        res.redirect('/catalog/books');
    }
    // render book_delete.pug and pass data
    res.render('book_delete', {
        title: 'Delete Book',
        book: book,
        book_instances: allBookInstances,
    });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    const [book, allBookinstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, 'book instances').exec(),
    ]);
    if (allBookinstances.length > 0) {
        // book has instances
        res.render('book_delete', {
            title: 'Delete book',
            book: book,
            book_instances: allBookInstances,
        });
        return;
    } else {
        // Book has no instances
        await Book.findByIdAndDelete(req.body.bookid);
        res.redirect('/catalog/authors');
    }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
    // GET book, author and genre data for form
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id).populate('author').exec(),
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);
    if (book === null) {
        // no results
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    // mark genres as selected as needed
    allGenres.forEach(genre => {
        if (book.genre.includes(genre._id)) genre.checked = 'true';
    });

    // send to view
    res.render('book_form', {
        title: 'Update Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
    });
});

// Handle book update on POST.
exports.book_update_post = [
    // convert genre to an array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            req.body.genre =
                typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
        }
        next();
    },

    // Validate and sanitize
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        // New book object with data
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
            _id: req.params.id, // Required or new ID will be assigned.
        });
        if (!errors.isEmpty()) {
            // errors found, render form again
            // Get all authors and genres for form
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);

            // Mark selected genres as checked.
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = 'true';
                }
            }
            res.render('book_form', {
                title: 'Update Book',
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedBook = await Book.findByIdAndUpdate(
                req.params.id,
                book,
                {}
            );
            // Redirect to book detail page.
            res.redirect(updatedBook.url);
        }
    }),
];
