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

// ✅ CORRECTION PRINCIPALE: Configuration CORS avec tes NOUVEAUX domaines
const cors = require('cors');

// Fonction pour récupérer les domaines autorisés depuis .env ou utiliser les défauts
function getAllowedOrigins() {
  // Si tu as configuré FRONTEND_URL dans ton .env, on l'utilise
  if (process.env.FRONTEND_URL) {
    const origins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    console.log('🔧 Domaines autorisés depuis .env:', origins);
    return origins;
  }
  
  // Sinon, on utilise la liste par défaut avec TES nouveaux domaines
  const defaultOrigins = [
    'http://localhost:3001', // Frontend local
    'http://localhost:3000', // Next.js local par défaut
    'http://localhost:8888', // Backend local
    'https://monsavonvert-frontend.vercel.app', // Ancien domaine Vercel
    'https://www.monsavonvert.com', // TON NOUVEAU DOMAINE PRINCIPAL
    'https://monsavonvert.com', // TON NOUVEAU DOMAINE SANS WWW
  ];
  
  console.log('🔧 Domaines autorisés par défaut:', defaultOrigins);
  return defaultOrigins;
}

const corsOptions = {
  origin: getAllowedOrigins(), // Utilise la fonction pour récupérer les domaines
  credentials: true, // Important pour les cookies et authentification
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Pour les anciens navigateurs
};

app.use(cors(corsOptions));

// ✅ Middleware de logging pour voir toutes les requêtes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin} - ${new Date().toISOString()}`);
  next();
});

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route de test pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Backend MonSavonVert is running!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8888,
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: getAllowedOrigins(), // Affiche les domaines autorisés
    corsEnabled: true
  });
});

// ✅ Route de test spéciale pour debug CORS depuis ton frontend
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS fonctionne correctement !',
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
});

// Vos routes existantes (AUCUN CHANGEMENT)
app.use('/users', usersRouter);
app.use('/api', passwordResetRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/stripe', stripeRoutes);
app.use('/api', stripeCheckoutRoutes);
app.use('/api', confirmOrderRouter); 
app.use('/orders', ordersRouter);

// ✅ Gestion des erreurs 404 avec message explicite
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl,
    message: 'Vérifiez que vous utilisez la bonne URL d\'API'
  });
});

// ✅ Gestion des erreurs générales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message
  });
});

// ✅ Port dynamique pour Vercel (IMPORTANT!)
const PORT = process.env.PORT || 8888;

// ✅ Démarrage du serveur avec logs détaillés
app.listen(PORT, () => {
  console.log('🚀 =================================');
  console.log(`✅ Server MonSavonVert démarré !`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend URL: ${process.env.NODE_ENV === 'production' ? 'https://monsavonvert-backend.vercel.app' : `http://localhost:${PORT}`}`);
  console.log(`🔒 CORS configuré pour:`, getAllowedOrigins());
  console.log(`📊 Routes de test disponibles:`);
  console.log(`   - GET /health (vérifier que le serveur marche)`);
  console.log(`   - GET /test-cors (tester la configuration CORS)`);
  console.log('🚀 =================================');
});

module.exports = app;