const Author = require('../models/author');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

//  display list of all authors
exports.author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render('author_list', {
        title: 'Author List',
        author_list: allAuthors,
    });
});

// display detail page for specific author
exports.author_detail = asyncHandler(async (req, res, next) => {
    const [author, allBooksAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);
    if (author === null) {
        //no results.
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }
    res.render('author_detail', {
        title: 'Author Detail',
        author: author,
        author_books: allBooksAuthor,
    });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
});

// Handle Author create on POST.
exports.author_create_post = [
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Family name must be specified')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    // Process request
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // form object
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });
        // handle errors
        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Create Author',
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // data valid, proceed
            await author.save();
            res.redirect(author.url);
        }
    }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    // GET details of author and their books paralell
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);
    if (author === null) {
        // No results
        // Nothing to delete, redirect.
        res.redirect('/catalog/authors');
    }
    // render author_delete.pug and pass data
    res.render('author_delete', {
        title: 'Delete Author',
        author: author,
        author_books: allBooksByAuthor,
    });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    // get details on author and his books paralell
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);

    if (allBooksByAuthor.length > 0) {
        // Author has books.
        res.render('author_delete', {
            title: 'Delete Author',
            author: author,
            author_books: allBooksByAuthor,
        });
        return;
    } else {
        // Author has no books.
        await Author.findByIdAndDelete(req.body.authorid);
        res.redirect('/catalog/authors');
    }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    // GET author data for form
    const author = await Author.findById(req.params.id);

    if (author === null) {
        // no result
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }

    res.render('author_form', {
        title: 'Update Author',
        author: author,
    });
});

// Handle Author update on POST.
exports.author_update_post = [
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Family name must be specified')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    // Process request
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // form object
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });
        // handle errors
        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Create Author',
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // data valid, proceed
            const updatedAuthor = await Author.findByIdAndUpdate(
                req.params.id,
                author,
                {}
            );
            //redirect to author detail page
            res.redirect(updatedAuthor.url);
        }
    }),
];
