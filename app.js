require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');

var app = express();

const PORT = process.env.PORT || 3000; // Utilise le port défini dans .env ou 3000 par défaut
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
 
module.exports = app;
