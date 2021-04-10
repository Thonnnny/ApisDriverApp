const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const { urlencoded } = require('express');
const morgan = require('morgan');

require('dotenv').config();
const app = express();

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs'
}));

app.set('view engine', '.hbs');

// middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('json spaces', 2);

//Apis
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/apis'))


// Public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../node_modules/html5-qrcode/minified')));

//error response

/*
app.use(function(req, res, next) {
    res.status(404).render('404');
});
*/

// Starting
app.listen(app.get('port'), () => {
    console.log('Server is on port', app.get('port'));
});