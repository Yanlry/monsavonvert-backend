require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// ✅ STANDARDISATION: Utiliser MONGODB_URI partout (standard de l'industrie)
const mongoURI = process.env.MONGODB_URI || process.env.CONNECTION_STRING;

// ✅ Vérification des variables d'environnement critiques
console.log('🔧 Vérification des variables d\'environnement:');
console.log('MONGODB_URI:', mongoURI ? '✅ Définie' : '❌ Manquante');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 8888);

if (!mongoURI) {
  console.error('❌ ERREUR CRITIQUE: Aucune URI MongoDB trouvée');
  console.error('📝 Assurez-vous d\'avoir MONGODB_URI dans vos variables d\'environnement');
  process.exit(1);
}

// ✅ Connexion MongoDB avec configuration optimisée pour Vercel
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 secondes pour Vercel
  socketTimeoutMS: 75000,          // 75 secondes pour les requêtes longues
  maxPoolSize: 10,                 // Pool de connexions
  retryWrites: true,
  retryReads: true,
})
.then(() => {
  console.log('✅ MongoDB connecté avec succès');
  console.log('🔗 Base de données:', mongoURI.replace(/\/\/.*:.*@/, '//***:***@'));
})
.catch(err => {
  console.error('❌ Erreur MongoDB:', err.message);
  
  // Messages d'aide pour le débogage
  if (err.message.includes('buffering timed out')) {
    console.error('💡 Timeout MongoDB - Vérifiez:');
    console.error('   1. IP Whitelist sur MongoDB Atlas');
    console.error('   2. Variables d\'environnement sur Vercel');
    console.error('   3. Format de l\'URI MongoDB');
  }
});

// Import des routes
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const stripeRoutes = require('./routes/stripe-webhook');
const stripeCheckoutRoutes = require('./routes/create-checkout');
const confirmOrderRouter = require('./routes/confirm-order');  
const ordersRouter = require('./routes/orders');

const app = express();

// ✅ Configuration CORS améliorée
const corsOptions = {
  origin: [
    'http://localhost:3001',                        // Frontend local
    'https://monsavonvert-frontend.vercel.app',     // Frontend production
    'http://localhost:8888',                        // Backend local (pour tests)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Pour les navigateurs legacy
};

app.use(cors(corsOptions));

// ✅ Middlewares
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route de santé pour monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Backend MonSavonVert is running!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8888,
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ✅ Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ✅ Routes principales
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/stripe', stripeRoutes);
app.use('/api', stripeCheckoutRoutes);
app.use('/api', confirmOrderRouter); 
app.use('/orders', ordersRouter);

// ✅ Route racine pour vérification
app.get('/', (req, res) => {
  res.json({
    message: 'API MonSavonVert - Backend opérationnel',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/products',
      users: '/users',
      orders: '/orders'
    }
  });
});

// ✅ Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Port dynamique pour Vercel
const PORT = process.env.PORT || 8888;

// ✅ Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://monsavonvert-backend.vercel.app' 
    : `http://localhost:${PORT}`;
  
  console.log(`🔗 Backend URL: ${backendUrl}`);
  console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
});

// ✅ Gestion propre des arrêts
process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur...');
  await mongoose.disconnect();
  console.log('✅ Connexions fermées');
  process.exit(0);
});

module.exports = app;