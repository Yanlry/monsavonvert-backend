require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// ✅ STANDARDISATION: Utiliser MONGODB_URI partout
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
  process.exit(1);
}

// ✅ Connexion MongoDB
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
});

// 🔍 DIAGNOSTIC: Import des routes un par un
let usersRouter, productsRouter;

try {
  console.log('📁 Import des modules de routes...');
  
  console.log('  - Importing users...');
  usersRouter = require('./routes/users');
  
  console.log('  - Importing products...');
  productsRouter = require('./routes/products');
  
  console.log('✅ Modules de base importés avec succès');
  
} catch (importError) {
  console.error('❌ ERREUR lors de l\'import des routes:', importError.message);
  console.error('Stack:', importError.stack);
  throw importError;
}

const app = express();

// ✅ Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'https://monsavonvert-frontend.vercel.app',
    'http://localhost:8888',
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

// ✅ Route de santé SIMPLE
app.get('/health', (req, res) => {
  console.log('📍 Route /health appelée');
  res.json({ 
    status: 'OK',
    message: 'Backend test fonctionnel', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ✅ Route racine SIMPLE
app.get('/', (req, res) => {
  console.log('📍 Route / appelée');
  res.json({
    message: 'API MonSavonVert - Test minimal',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 🧪 TEST: Enregistrer SEULEMENT les routes users et products
console.log('📍 Enregistrement des routes de test...');

try {
  console.log('  - Registering users routes...');
  app.use('/users', usersRouter);
  console.log('  ✅ Users routes registered');
} catch (error) {
  console.error('  ❌ Error with users routes:', error.message);
  throw error;
}

try {
  console.log('  - Registering products routes...');
  app.use('/products', productsRouter);
  console.log('  ✅ Products routes registered');
} catch (error) {
  console.error('  ❌ Error with products routes:', error.message);
  throw error;
}

console.log('✅ Routes de test enregistrées');

// ✅ 404 handler
app.use('*', (req, res) => {
  console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/health', '/', '/users', '/products']
  });
});

// ✅ Error handler
app.use((error, req, res, next) => {
  console.error('💥 ERREUR GLOBALE:', error.message);
  console.error('Stack:', error.stack);
  
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
    timestamp: new Date().toISOString()
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
  console.log(`🧪 TEST: Seules les routes /users et /products sont actives`);
});

// ✅ Gestion propre des arrêts
process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur...');
  await mongoose.disconnect();
  console.log('✅ Connexions fermées');
  process.exit(0);
});

module.exports = app;