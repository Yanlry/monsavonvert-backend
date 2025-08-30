require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('✅ MongoDB connecté avec succès'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var passwordResetRouter = require('./routes/password-reset');
var productsRouter = require('./routes/products');
var customersRouter = require('./routes/customers');
var stripeRoutes = require('./routes/stripe-webhook');
var stripeCheckoutRoutes = require('./routes/create-checkout');
var confirmOrderRouter = require('./routes/confirm-order');  
var ordersRouter = require('./routes/orders');

var app = express();

// ✅ CORRECTION 1: Configuration CORS AVANT les autres middlewares
const cors = require('cors');
const corsOptions = {
  origin: [
    'http://localhost:3001', // Votre frontend local
    'https://monsavonvert-frontend.vercel.app', // Votre frontend en production
    'http://localhost:8888', // Au cas où
  ],
  credentials: true, // Important pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CORRECTION 2: Route de test pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8888,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ CORRECTION 3: Log de toutes les requêtes pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Vos routes existantes
app.use('/users', usersRouter);
app.use('/api', passwordResetRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/stripe', stripeRoutes);
app.use('/api', stripeCheckoutRoutes);
app.use('/api', confirmOrderRouter); 
app.use('/orders', ordersRouter);

// ✅ CORRECTION 4: Port dynamique pour Vercel (IMPORTANT!)
const PORT = process.env.PORT || 8888;

// ✅ CORRECTION 5: Démarrage du serveur à la fin
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend URL: ${process.env.NODE_ENV === 'production' ? 'https://monsavonvert-backend.vercel.app' : `http://localhost:${PORT}`}`);
});

module.exports = app;