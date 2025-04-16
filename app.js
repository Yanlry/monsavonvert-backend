// app.js (backend)
require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var customersRouter = require('./routes/customers');

var app = express();

// Configuration CORS - TRÈS IMPORTANT
app.use(cors({
  origin: '*', // Autorise toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de test pour vérifier que l'API fonctionne
app.get('/api-test', (req, res) => {
  res.json({ message: 'API fonctionne correctement!' });
});

// Routes API
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);

// Gestion de l'erreur 404
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `L'URL ${req.originalUrl} n'existe pas sur ce serveur`
  });
});

// Gestion des erreurs générales
app.use((err, req, res, next) => {
  console.error('Erreur détectée :', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Une erreur est survenue sur le serveur'
  });
});

// Ne pas utiliser app.listen ici pour Vercel
// Vercel utilise le module exporté directement
// Si tu as besoin de démarrer le serveur localement, utilise:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8888;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;