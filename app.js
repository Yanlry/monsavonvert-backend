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

// Configuration CORS
const corsOptions = {
  origin: 'https://monsavonvert-frontend.vercel.app', // URL de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
  credentials: true, // Autorise les cookies/sessions
};
app.use(cors(corsOptions));

// Middleware pour vérifier les en-têtes CORS (optionnel, pour débogage)
app.use((req, res, next) => {
  console.log('CORS Headers:', res.getHeaders());
  next();
});

const PORT = process.env.PORT || 3000; // Utilise le port défini dans .env ou 3000 par défaut
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes JSON
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // Augmente la limite à 10 Mo pour les requêtes URL-encodées
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/users', usersRouter); // Route pour les utilisateurs
app.use('/products', productsRouter); // Route pour les produits
app.use('/customers', customersRouter); // Route pour les clients

module.exports = app;