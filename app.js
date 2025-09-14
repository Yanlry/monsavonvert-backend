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
var contactRouter = require('./routes/contact');

var app = express();

// ✅ CORRECTION CORS SIMPLE (seulement ce qui était cassé)
const cors = require('cors');
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://monsavonvert-frontend.vercel.app',
    'https://www.monsavonvert.com',
    'https://monsavonvert.com',
    'http://localhost:8888'
  ],
  credentials: true,
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

// ✅ Route de test simple
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date().toISOString()
  });
});

// Tes routes existantes
app.use('/users', usersRouter);
app.use('/password-reset', passwordResetRouter); // 🔧 CORRECTION : Changé /api en /password-reset
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/stripe', stripeRoutes);
app.use('/api', stripeCheckoutRoutes);
app.use('/api', confirmOrderRouter); 
app.use('/orders', ordersRouter);
app.use('/contact', contactRouter);
// ✅ Port pour Vercel
const PORT = process.env.PORT || 8888;

// ✅ Démarrage simple
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;