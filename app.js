var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// performance/security express middleware
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

// Create express application object
var app = express();

// Add helmet to middleware chain to protect against
// common vulnerabilities
app.use(
    helmet.contentSecurityPolicy({
        // allow bootstrap and jquery scripts that were imported.
        directives: {
            'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
        },
    })
);

// set up rate limiter
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, //requests
    // = max 20 requests per minute.
});
// apply limiter to all requests
app.use(limiter);

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const mongoDB = process.env.MONGODB_URI;

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// MIDDLEWARE STACK //
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// express middleware compressing all routes
app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
