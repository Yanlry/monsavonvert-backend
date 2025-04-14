require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products'); // Importez les routes des produits

var app = express();

const PORT = process.env.PORT || 3000; // Utilise le port défini dans .env ou 3000 par défaut
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes JSON
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes URL-encodées
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/users', usersRouter); // Route pour les utilisateurs
app.use('/products', productsRouter); // Route pour les produits

module.exports = app;