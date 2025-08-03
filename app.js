require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// ✅ Configuration MongoDB standardisée
const mongoURI = process.env.MONGODB_URI || process.env.CONNECTION_STRING;

console.log('🔧 Vérification des variables d\'environnement:');
console.log('MONGODB_URI:', mongoURI ? '✅ Définie' : '❌ Manquante');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 8888);

// ✅ Forcer NODE_ENV=production sur Vercel
if (process.env.VERCEL) {
  process.env.NODE_ENV = 'production';
  console.log('🚀 Détection Vercel - NODE_ENV forcé à production');
}

if (!mongoURI) {
  console.error('❌ ERREUR CRITIQUE: Aucune URI MongoDB trouvée');
  console.error('📝 Vérifiez que MONGODB_URI est définie dans vos variables d\'environnement');
  process.exit(1);
}

// ✅ Connexion MongoDB optimisée pour Vercel
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 75000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
})
.then(() => {
  console.log('✅ MongoDB connecté avec succès');
  console.log('🔗 Base de données:', mongoURI.replace(/\/\/.*:.*@/, '//***:***@'));
})
.catch(err => {
  console.error('❌ Erreur MongoDB:', err.message);
  if (err.message.includes('buffering timed out')) {
    console.error('💡 Vérifiez l\'IP Whitelist sur MongoDB Atlas');
  }
});

// ✅ Import des routes avec gestion d'erreurs
let usersRouter, productsRouter, customersRouter, stripeRoutes, stripeCheckoutRoutes, confirmOrderRouter, ordersRouter;

try {
  console.log('📁 Import des modules de routes...');
  
  usersRouter = require('./routes/users');
  console.log('  ✅ Users routes importées');
  
  productsRouter = require('./routes/products');
  console.log('  ✅ Products routes importées');
  
  customersRouter = require('./routes/customers');
  console.log('  ✅ Customers routes importées');
  
  stripeRoutes = require('./routes/stripe-webhook');
  console.log('  ✅ Stripe webhook routes importées');
  
  stripeCheckoutRoutes = require('./routes/create-checkout');
  console.log('  ✅ Stripe checkout routes importées');
  
  confirmOrderRouter = require('./routes/confirm-order');
  console.log('  ✅ Confirm order routes importées');
  
  ordersRouter = require('./routes/orders');
  console.log('  ✅ Orders routes importées');
  
  console.log('✅ Tous les modules de routes importés avec succès');
  
} catch (importError) {
  console.error('❌ ERREUR lors de l\'import des routes:', importError.message);
  console.error('Stack:', importError.stack);
  process.exit(1);
}

const app = express();

// ✅ Configuration CORS optimisée
const corsOptions = {
  origin: [
    'http://localhost:3001',                        // Frontend local
    'https://monsavonvert-frontend.vercel.app',     // Frontend production
    'http://localhost:8888',                        // Backend local
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
  optionsSuccessStatus: 200
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
  console.log('📍 Health check demandé');
  res.json({ 
    status: 'OK',
    message: 'Backend MonSavonVert opérationnel', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8888,
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ✅ Route racine informative
app.get('/', (req, res) => {
  console.log('📍 Accès à la route racine');
  res.json({
    message: 'API MonSavonVert - Backend opérationnel',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      users: '/users',
      products: '/products',
      customers: '/customers',
      orders: '/orders',
      api: '/api'
    }
  });
});

// ✅ Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ✅ Enregistrement des routes dans l'ordre optimal
console.log('📍 Enregistrement des routes...');

try {
  // Routes principales
  app.use('/users', usersRouter);
  console.log('  ✅ Routes /users enregistrées');
  
  app.use('/products', productsRouter);
  console.log('  ✅ Routes /products enregistrées');
  
  app.use('/customers', customersRouter);
  console.log('  ✅ Routes /customers enregistrées');
  
  app.use('/orders', ordersRouter);
  console.log('  ✅ Routes /orders enregistrées');
  
  // Routes API (même préfixe mais pas de conflit car routes spécifiques)
  app.use('/api', stripeCheckoutRoutes);
  console.log('  ✅ Routes /api (checkout) enregistrées');
  
  app.use('/api', confirmOrderRouter);
  console.log('  ✅ Routes /api (confirm-order) enregistrées');
  
  // Routes Stripe webhook
  app.use('/stripe', stripeRoutes);
  console.log('  ✅ Routes /stripe enregistrées');
  
  console.log('✅ Toutes les routes enregistrées avec succès');
  
} catch (routeError) {
  console.error('❌ ERREUR lors de l\'enregistrement des routes:', routeError.message);
  console.error('Stack:', routeError.stack);
  process.exit(1);
}

// ✅ Gestion des routes non trouvées (404)
app.use('*', (req, res) => {
  console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: {
      health: 'GET /health',
      root: 'GET /',
      users: 'GET,POST,PUT /users/*',
      products: 'GET,POST,PUT,DELETE /products/*',
      customers: 'GET,PUT /customers/*',
      orders: 'GET,PUT /orders/*',
      api: 'POST /api/*',
      stripe: 'POST /stripe/*'
    }
  });
});

// ✅ Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  console.error('💥 ERREUR GLOBALE:', error.message);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Stack:', error.stack);
  
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// ✅ Configuration du port (dynamique pour Vercel)
const PORT = process.env.PORT || 8888;

// ✅ Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`\n🚀 ====================================`);
  console.log(`✅ Server MonSavonVert démarré !`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Port: ${PORT}`);
  
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://monsavonvert-backend.vercel.app' 
    : `http://localhost:${PORT}`;
  
  console.log(`🔗 URL: ${backendUrl}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connecté' : '⏳ En cours...'}`);
  console.log(`🚀 ====================================\n`);
});

// ✅ Gestion propre des arrêts du serveur
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Signal ${signal} reçu - Arrêt propre du serveur...`);
  
  server.close(async () => {
    console.log('🔒 Serveur HTTP fermé');
    
    try {
      await mongoose.disconnect();
      console.log('✅ Connexion MongoDB fermée');
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture MongoDB:', error);
    }
    
    console.log('✅ Arrêt complet du serveur');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;