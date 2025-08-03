const express = require('express'); 
const router = express.Router(); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const uid2 = require('uid2'); 

// ✅ Import des modèles et utilitaires
require('../models/connection');
const User = require('../models/user');
const { checkBody } = require('../modules/checkBody'); 

/**
 * Validation du mot de passe selon les critères de sécurité
 * @param {string} password - Le mot de passe à valider
 * @returns {boolean} - True si le mot de passe est valide
 */
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

/**
 * Middleware de validation d'ObjectId MongoDB
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next function
 */
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error('❌ [Users] ID invalide fourni:', id);
    return res.status(400).json({ 
      result: false, 
      error: 'ID utilisateur invalide.',
      providedId: id
    });
  }
  
  next();
};

/**
 * Middleware d'authentification par token
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next function
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      result: false, 
      error: 'Token d\'authentification requis.' 
    });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(403).json({ 
        result: false, 
        error: 'Token invalide.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [Users] Erreur d\'authentification:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur d\'authentification.' 
    });
  }
};

// ✅ ===== ROUTES SPÉCIFIQUES EN PREMIER (avant /:id) =====

/**
 * Route d'inscription utilisateur
 */
router.post('/signup', async (req, res) => {
  console.log('📝 [Users] Tentative d\'inscription');
  
  try {
    // Validation des champs requis
    if (!checkBody(req.body, ['firstName', 'lastName', 'email', 'password'])) {
      return res.status(400).json({ 
        result: false, 
        error: 'Champs obligatoires manquants' 
      });
    }

    const { firstName, lastName, email, password, role, addresses, phone, termsAccepted } = req.body;

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('⚠️ [Users] Tentative d\'inscription avec email existant:', email);
      return res.status(409).json({ 
        result: false, 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hashage du mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Formatage des noms (première lettre en majuscule)
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    // Création du nouvel utilisateur
    const newUser = new User({
      firstName: formattedFirstName,
      lastName: formattedLastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      addresses: addresses || [],
      phone: phone || null,
      termsAccepted: termsAccepted || false,
      token: uid2(32),
    });

    const savedUser = await newUser.save();
    
    console.log('✅ [Users] Utilisateur créé avec succès:', savedUser._id);
    
    res.status(201).json({
      result: true,
      token: savedUser.token,
      userId: savedUser._id,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('❌ [Users] Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la création de l\'utilisateur' 
    });
  }
});

/**
 * Route de connexion utilisateur
 */
router.post('/signin', async (req, res) => {
  console.log('🔐 [Users] Tentative de connexion');
  
  try {
    if (!checkBody(req.body, ['email', 'password'])) {
      return res.status(400).json({ 
        result: false, 
        error: 'Email et mot de passe requis' 
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.log('⚠️ [Users] Tentative de connexion échouée pour:', email);
      return res.status(401).json({ 
        result: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    console.log('✅ [Users] Connexion réussie pour:', user.email);
    
    res.status(200).json({
      result: true,
      userId: user._id,
      token: user.token,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error('❌ [Users] Erreur lors de la connexion:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la connexion' 
    });
  }
});

/**
 * Route pour obtenir les informations de l'utilisateur connecté
 */
router.get('/me', authenticateToken, (req, res) => {
  console.log('👤 [Users] Récupération des données utilisateur connecté');
  
  const user = req.user;
  
  res.status(200).json({
    result: true,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      addresses: user.addresses,
      isSubscribedToNewsletter: user.isSubscribedToNewsletter,
      role: user.role
    },
  });
});

/**
 * Route de test pour vérifier le bon fonctionnement
 */
router.get('/test', (req, res) => {
  console.log('🧪 [Users] Route de test appelée');
  res.json({ 
    result: true, 
    message: 'Routes utilisateurs opérationnelles',
    timestamp: new Date().toISOString()
  });
});

// ✅ ===== ROUTES AVEC PARAMÈTRES (après les routes spécifiques) =====

/**
 * Route pour obtenir un utilisateur par ID
 * ⚠️ IMPORTANT: Cette route DOIT être après /me et /test pour éviter les conflits
 */
router.get('/:id', validateObjectId, async (req, res) => {
  const userId = req.params.id;
  console.log('🔍 [Users] Récupération des données pour l\'ID:', userId);

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ [Users] Utilisateur introuvable pour l\'ID:', userId);
      return res.status(404).json({ 
        result: false, 
        error: 'Utilisateur introuvable' 
      });
    }

    console.log('✅ [Users] Données utilisateur récupérées pour:', user.email);
    
    res.status(200).json({ 
      result: true, 
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        addresses: user.addresses,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [Users] Erreur lors de la récupération:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la récupération des données utilisateur' 
    });
  }
});

/**
 * Route pour mettre à jour un utilisateur
 */
router.put('/update/:id', validateObjectId, async (req, res) => {
  const userId = req.params.id;
  console.log('✏️ [Users] Mise à jour de l\'utilisateur:', userId);

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ [Users] Utilisateur introuvable pour mise à jour:', userId);
      return res.status(404).json({ 
        result: false, 
        error: 'Utilisateur introuvable' 
      });
    }

    // Application des mises à jour
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== 'token') { // Éviter la modification directe du mot de passe
        user[key] = updates[key];
      }
    });

    const updatedUser = await user.save();
    
    console.log('✅ [Users] Utilisateur mis à jour avec succès:', updatedUser._id);
    
    res.status(200).json({ 
      result: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('❌ [Users] Erreur lors de la mise à jour:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la mise à jour de l\'utilisateur' 
    });
  }
});

/**
 * Route pour gérer l'abonnement à la newsletter
 */
router.put('/subscribe-newsletter/:id', validateObjectId, async (req, res) => {
  const userId = req.params.id;
  const { isSubscribed } = req.body;
  
  console.log('📧 [Users] Mise à jour abonnement newsletter:', userId, isSubscribed);

  if (typeof isSubscribed !== 'boolean') {
    return res.status(400).json({ 
      result: false, 
      error: 'Valeur d\'abonnement invalide' 
    });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { isSubscribedToNewsletter: isSubscribed }, 
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ 
        result: false, 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    console.log('✅ [Users] Abonnement newsletter mis à jour');
    
    res.status(200).json({ 
      result: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('❌ [Users] Erreur mise à jour newsletter:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la mise à jour de l\'abonnement' 
    });
  }
});

/**
 * Route pour changer le mot de passe
 */
router.put('/change-password/:id', validateObjectId, async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;
  
  console.log('🔒 [Users] Demande de changement de mot de passe:', userId);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      result: false, 
      error: 'Mot de passe actuel et nouveau mot de passe requis' 
    });
  }

  // Validation du nouveau mot de passe
  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      result: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.',
    });
  }

  try {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        result: false, 
        error: 'Utilisateur introuvable' 
      });
    }

    // Vérification de l'ancien mot de passe
    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      console.log('⚠️ [Users] Tentative de changement avec mauvais mot de passe actuel');
      return res.status(401).json({ 
        result: false, 
        error: 'Mot de passe actuel incorrect' 
      });
    }

    // Hashage et sauvegarde du nouveau mot de passe
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedNewPassword;
    
    await user.save();
    
    console.log('✅ [Users] Mot de passe mis à jour avec succès');
    
    res.status(200).json({ 
      result: true, 
      message: 'Mot de passe mis à jour avec succès' 
    });

  } catch (error) {
    console.error('❌ [Users] Erreur changement mot de passe:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la mise à jour du mot de passe' 
    });
  }
});

console.log('✅ Routes utilisateurs chargées avec succès');

module.exports = router;