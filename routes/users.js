var express = require('express'); 
var router = express.Router(); 

require('../models/connection');
const mongoose = require('mongoose');
const User = require('../models/user');
const { checkBody } = require('../modules/checkBody'); 
const bcrypt = require('bcryptjs');
const uid2 = require('uid2'); 

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

// NOUVEAU CODE SIGNUP - Sans hashage manuel (le middleware s'en charge)
router.post('/signup', async (req, res) => {
  console.log('🚀 DÉBUT INSCRIPTION');
  console.log('📧 Email reçu:', req.body.email);
  console.log('🔒 Mot de passe reçu (longueur):', req.body.password ? req.body.password.length : 'undefined');
  
  // Vérifiez que tous les champs requis sont présents
  if (!checkBody(req.body, ['firstName', 'lastName', 'email', 'password'])) {
    console.log('❌ Champs manquants');
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  try {
    // Vérifiez si l'utilisateur existe déjà avec l'email
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    
    if (existingUser) {
      console.log('❌ Email déjà utilisé');
      return res.status(409).json({ result: false, error: 'User already exists' });
    }

    console.log('✅ Email disponible, création du compte');
    
    // IMPORTANT : On ne hashe plus ici, le middleware s'en charge automatiquement
    console.log('🔒 Le mot de passe sera hashé automatiquement par le middleware');

    // Mettre en majuscule la première lettre du prénom et du nom
    const formattedFirstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1).toLowerCase();
    const formattedLastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1).toLowerCase();

    // Créez un nouvel utilisateur - le middleware hashera automatiquement le password
    const newUser = new User({
      firstName: formattedFirstName,
      lastName: formattedLastName,
      email: req.body.email.toLowerCase(),
      password: req.body.password, // Mot de passe en clair - sera hashé par le middleware
      role: req.body.role || 'user',
      addresses: req.body.addresses || [],
      phone: req.body.phone || null,
      termsAccepted: req.body.termsAccepted || false,
      token: uid2(32),
    });

    // Sauvegardez l'utilisateur - le middleware pre('save') va hasher le password
    const savedUser = await newUser.save();
    
    console.log('✅ Utilisateur sauvegardé avec succès');
    console.log('📧 Email:', savedUser.email);
    console.log('🆔 ID:', savedUser._id);
    console.log('🔑 Token:', savedUser.token.substring(0, 10) + '...');
    
    res.status(201).json({
      result: true,
      token: savedUser.token,
      userId: savedUser._id,
    });
    
  } catch (err) {
    console.error('❌ Erreur sauvegarde utilisateur:', err);
    res.status(500).json({ result: false, error: 'Failed to save user' });
  }
});

// NOUVEAU CODE SIGNIN - Avec la méthode comparePassword du modèle
router.post('/signin', async (req, res) => {
  console.log('🔐 DÉBUT CONNEXION');
  console.log('📧 Email de connexion:', req.body.email);
  console.log('🔒 Mot de passe fourni (longueur):', req.body.password ? req.body.password.length : 'undefined');
  
  if (!checkBody(req.body, ['email', 'password'])) {
    console.log('❌ Champs manquants pour la connexion');
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  try {
    const emailToSearch = req.body.email.toLowerCase().trim();
    console.log('🔍 Recherche utilisateur avec email:', emailToSearch);

    // Trouver l'utilisateur avec le password inclus
    const user = await User.findOne({ email: emailToSearch }).select('+password');
    
    console.log('🔍 Résultat recherche utilisateur:', user ? 'TROUVÉ' : 'NON TROUVÉ');
    
    if (!user) {
      console.log('❌ UTILISATEUR NON TROUVÉ AVEC CET EMAIL');
      return res.status(401).json({ result: false, error: 'Adresse e-mail non trouvée ou mot de passe incorrect' });
    }
    
    console.log('👤 Utilisateur trouvé:');
    console.log('  - Email:', user.email);
    console.log('  - Nom:', user.firstName, user.lastName);
    console.log('  - ID:', user._id);
    console.log('  - Mot de passe hashé présent:', !!user.password);
    console.log('  - Longueur hash:', user.password ? user.password.length : 'undefined');
    
    // Utiliser la méthode comparePassword du modèle au lieu de bcrypt.compareSync
    const passwordMatch = await user.comparePassword(req.body.password);
    console.log('🔒 Comparaison mot de passe:', passwordMatch ? 'MATCH ✅' : 'NO MATCH ❌');
    
    if (passwordMatch) {
      console.log('✅ CONNEXION RÉUSSIE');
      res.status(200).json({
        result: true,
        userId: user._id,
        token: user.token,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    } else {
      console.log('❌ MOT DE PASSE INCORRECT');
      res.status(401).json({ result: false, error: 'Adresse e-mail non trouvée ou mot de passe incorrect' });
    }
    
  } catch (err) {
    console.error('❌ Erreur lors de la recherche utilisateur:', err);
    res.status(500).json({ result: false, error: 'Internal server error' });
  }
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ result: false, error: 'Token manquant.' });
  }

  User.findOne({ token }).then(user => {
    if (!user) {
      return res.status(404).json({ result: false, error: 'Utilisateur introuvable.' });
    }

    res.status(200).json({
      result: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        addresses: user.addresses,
        isSubscribedToNewsletter: user.isSubscribedToNewsletter,
      },
    });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la récupération des données utilisateur :', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

router.put('/update/:id', (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error('❌ [Backend] ID utilisateur invalide:', userId);
    return res.status(400).json({ result: false, error: 'ID utilisateur invalide.' });
  }

  User.findById(userId).then(user => {
    if (!user) {
      console.error('❌ [Backend] Utilisateur introuvable pour l\'ID:', userId);
      return res.status(404).json({ result: false, error: 'Utilisateur introuvable.' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    user.save()
      .then(updatedUser => {
        console.log('✅ [Backend] Utilisateur mis à jour avec succès:', updatedUser);
        res.status(200).json({ result: true, user: updatedUser });
      })
      .catch(err => {
        console.error('❌ [Backend] Erreur lors de la sauvegarde de l\'utilisateur:', err);
        res.status(500).json({ result: false, error: 'Échec de la mise à jour.' });
      });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la recherche de l\'utilisateur:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

router.get('/:id', (req, res) => {
  const userId = req.params.id;
  console.log('🔍 [Backend] Récupération des données utilisateur pour l\'ID:', userId);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error('❌ [Backend] ID utilisateur invalide:', userId);
    return res.status(400).json({ result: false, error: 'ID utilisateur invalide.' });
  }

  User.findById(userId)
    .then(user => {
      if (!user) {
        console.error('❌ [Backend] Utilisateur introuvable pour l\'ID:', userId);
        return res.status(404).json({ result: false, error: 'Utilisateur introuvable.' });
      }

      console.log('✅ [Backend] Données utilisateur récupérées:', user);
      res.status(200).json({ result: true, user });
    })
    .catch(err => {
      console.error('❌ [Backend] Erreur lors de la récupération des données utilisateur:', err);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    });
});

router.put('/subscribe-newsletter/:id', (req, res) => {
  const userId = req.params.id;
  const { isSubscribed } = req.body;

  if (typeof isSubscribed !== 'boolean') {
    return res.status(400).json({ result: false, error: 'Invalid value for subscription status.' });
  }

  User.findByIdAndUpdate(userId, { isSubscribedToNewsletter: isSubscribed }, { new: true })
    .then(updatedUser => {
      if (!updatedUser) {
        return res.status(404).json({ result: false, error: 'User not found.' });
      }
      res.status(200).json({ result: true, user: updatedUser });
    })
    .catch(err => {
      console.error('Error updating subscription status:', err);
      res.status(500).json({ result: false, error: 'Internal server error.' });
    });
});

// CHANGEMENT DE MOT DE PASSE - Utilise maintenant la méthode comparePassword
router.put('/change-password/:id', async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ result: false, error: 'Champs manquants.' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      result: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.',
    });
  }

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ result: false, error: 'Utilisateur introuvable.' });
    }

    // Utiliser la méthode comparePassword du modèle
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ result: false, error: 'Mot de passe actuel incorrect.' });
    }

    // Assigner le nouveau mot de passe - le middleware va le hasher automatiquement
    user.password = newPassword;

    await user.save();
    res.status(200).json({ result: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('❌ [Backend] Erreur lors de la mise à jour du mot de passe:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;