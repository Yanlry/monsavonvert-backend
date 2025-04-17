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

// Configuration CORS améliorée
app.use(cors({
  origin: ['https://monsavonvert-backend.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Mise en cache des pré-vérifications CORS pendant 24h
}));

// Middleware pour ajouter explicitement les en-têtes CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://monsavonvert-backend.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Log pour debugging
  console.log(`Request received: ${req.method} ${req.path}`);
  
  // Gestion spéciale des requêtes OPTIONS pour les pré-vérifications CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);

// Route par défaut pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API MonSavonVert fonctionnelle' });
});

// IMPORTANT: Pour Vercel, ne pas utiliser app.listen()
// mais exporter simplement l'application
module.exports = app;