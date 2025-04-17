require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products'); // Importez les routes des produits
var customersRouter = require('./routes/customers'); // Importez la route des clients

var app = express();

const PORT = process.env.PORT || 3000; // Utilise le port défini dans .env ou 3000 par défaut

// Log de démarrage du serveur
console.log('Starting server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}`);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Middleware pour loguer toutes les requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes JSON
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes URL-encodées
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log des routes chargées
console.log('Routes loaded:');
console.log('/users -> usersRouter');
console.log('/products -> productsRouter');
console.log('/customers -> customersRouter');

// Routes
app.use('/users', usersRouter); // Route pour les utilisateurs
app.use('/products', productsRouter); // Route pour les produits
app.use('/customers', customersRouter); // Route pour les clients

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('An error occurred:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Log si aucune route ne correspond
app.use((req, res, next) => {
  console.warn(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;