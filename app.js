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

// ✅ IMPORTANT: Forcer NODE_ENV=production sur Vercel
if (process.env.VERCEL) {
  process.env.NODE_ENV = 'production';
  console.log('🚀 Détection Vercel - NODE_ENV forcé à production');
}

if (!mongoURI) {
  console.error('❌ ERREUR CRITIQUE: Aucune URI MongoDB trouvée');
  console.error('📝 Assurez-vous d\'avoir MONGODB_URI dans vos variables d\'environnement');
  process.exit(1);
}

// ✅ Connexion MongoDB avec configuration optimisée pour Vercel (sans warnings deprecated)
mongoose.connect(mongoURI, {
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

// 🔍 DIAGNOSTIC: Import des routes un par un avec try/catch
let usersRouter, productsRouter, customersRouter, stripeRoutes, stripeCheckoutRoutes, confirmOrderRouter, ordersRouter;

try {
  console.log('📁 Import des modules de routes...');
  
  console.log('  - Importing users...');
  usersRouter = require('./routes/users');
  
  console.log('  - Importing products...');
  productsRouter = require('./routes/products');
  
  console.log('  - Importing customers...');
  customersRouter = require('./routes/customers');
  
  console.log('  - Importing stripe-webhook...');
  stripeRoutes = require('./routes/stripe-webhook');
  
  console.log('  - Importing create-checkout...');
  stripeCheckoutRoutes = require('./routes/create-checkout');
  
  console.log('  - Importing confirm-order...');
  confirmOrderRouter = require('./routes/confirm-order');
  
  console.log('  - Importing orders...');
  ordersRouter = require('./routes/orders');
  
  console.log('✅ Tous les modules importés avec succès');
  
} catch (importError) {
  console.error('❌ ERREUR lors de l\'import des routes:', importError.message);
  console.error('Stack:', importError.stack);
  throw importError;
}

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

// ✅ Route de santé pour monitoring (AVANT les autres routes)
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

// ✅ Route racine simple pour test (AVANT les autres routes)
app.get('/', (req, res) => {
  console.log('📍 Accès à la route racine /');
  res.json({
    message: 'API MonSavonVert - Backend opérationnel',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      products: '/products',
      users: '/users',
      orders: '/orders'
    }
  });
});

// ✅ Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// 🔍 DIAGNOSTIC: Routes avec try/catch individuels pour identifier le problème
console.log('📍 Enregistrement des routes...');

// Testez une route à la fois - décommentez-les progressivement :

// Route 1: Users
try {
  console.log('  - Registering users routes...');
  app.use('/users', usersRouter);
  console.log('  ✅ Users routes registered');
} catch (error) {
  console.error('  ❌ Error with users routes:', error.message);
  throw error;
}

// Route 2: Products (commentez temporairement si erreur)
try {
  console.log('  - Registering products routes...');
  app.use('/products', productsRouter);
  console.log('  ✅ Products routes registered');
} catch (error) {
  console.error('  ❌ Error with products routes:', error.message);
  throw error;
}

// Route 3: Customers (commentez temporairement si erreur)
try {
  console.log('  - Registering customers routes...');
  app.use('/customers', customersRouter);
  console.log('  ✅ Customers routes registered');
} catch (error) {
  console.error('  ❌ Error with customers routes:', error.message);
  throw error;
}

// Route 4: Stripe webhook (commentez temporairement si erreur)
try {
  console.log('  - Registering stripe webhook routes...');
  app.use('/stripe', stripeRoutes);
  console.log('  ✅ Stripe webhook routes registered');
} catch (error) {
  console.error('  ❌ Error with stripe webhook routes:', error.message);
  throw error;
}

// Route 5: Stripe checkout (commentez temporairement si erreur)
try {
  console.log('  - Registering stripe checkout routes...');
  app.use('/api', stripeCheckoutRoutes);
  console.log('  ✅ Stripe checkout routes registered');
} catch (error) {
  console.error('  ❌ Error with stripe checkout routes:', error.message);
  throw error;
}

// Route 6: Confirm order (commentez temporairement si erreur)
try {
  console.log('  - Registering confirm order routes...');
  app.use('/api', confirmOrderRouter);
  console.log('  ✅ Confirm order routes registered');
} catch (error) {
  console.error('  ❌ Error with confirm order routes:', error.message);
  throw error;
}

// Route 7: Orders (commentez temporairement si erreur)
try {
  console.log('  - Registering orders routes...');
  app.use('/orders', ordersRouter);
  console.log('  ✅ Orders routes registered');
} catch (error) {
  console.error('  ❌ Error with orders routes:', error.message);
  throw error;
}

console.log('✅ Toutes les routes enregistrées avec succès');

// ✅ Gestion des erreurs 404
app.use('*', (req, res) => {
  console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('💥 ERREUR GLOBALE:', error.message);
  console.error('Stack:', error.stack);
  
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
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