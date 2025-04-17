var express = require('express'); 
var router = express.Router(); 

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody'); 
const bcrypt = require('bcrypt'); 
const uid2 = require('uid2'); 

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

router.post('/signup', (req, res) => {
  // Vérifiez que tous les champs requis sont présents
  if (!checkBody(req.body, ['firstName', 'lastName', 'email', 'password'])) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  // Vérifiez si l'utilisateur existe déjà avec l'email
  User.findOne({ email: req.body.email.toLowerCase() }).then(data => {
    if (data === null) {
      // Hachez le mot de passe
      const hash = bcrypt.hashSync(req.body.password, 10);

      // Créez un nouvel utilisateur avec tous les champs requis
      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email.toLowerCase(),
        password: hash,
        role: req.body.role || 'user', // Par défaut, le rôle est "user"
        addresses: req.body.addresses || [], // Par défaut, aucune adresse
        phone: req.body.phone || null,
        termsAccepted: req.body.termsAccepted || false,
        token: uid2(32),
      });

      // Sauvegardez l'utilisateur dans la base de données
      newUser.save().then(newDoc => {
        console.log('User saved:', newDoc); // Vérifiez que le token et l'ID utilisateur sont bien présents ici
        res.status(201).json({
          result: true,
          token: newDoc.token,
          userId: newDoc._id, // Ajoutez l'ID utilisateur dans la réponse
        });
      }).catch(err => {
        console.error('Error saving user:', err);
        res.status(500).json({ result: false, error: 'Failed to save user' });
      });
    } else {
      res.status(409).json({ result: false, error: 'User already exists' });
    }
  }).catch(err => {
    res.status(500).json({ result: false, error: 'Internal server error' });
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  User.findOne({ email: req.body.email.toLowerCase() }).select('+password').then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.status(200).json({
        result: true,
        userId: data._id, // Inclure l'ID utilisateur
        token: data.token,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      });
    } else {
      res.status(401).json({ result: false, error: 'Adresse e-mail non trouvée ou mot de passe incorrect' });
    }
  }).catch(err => {
    res.status(500).json({ result: false, error: 'Internal server error' });
  });
});

router.put('/update/:id', (req, res) => {
  const userId = req.params.id;
  console.log('🔍 [Backend] ID utilisateur reçu dans la requête:', userId); // Log pour vérifier l'ID utilisateur

  if (!userId || userId === 'null') {
    console.error('❌ [Backend] Erreur : ID utilisateur invalide.');
    return res.status(400).json({ result: false, error: 'ID utilisateur invalide.' });
  }

  User.findById(userId).then(user => {
    if (!user) {
      console.error('❌ [Backend] Erreur : Utilisateur introuvable pour l\'ID:', userId);
      return res.status(404).json({ result: false, error: 'Utilisateur introuvable.' });
    }

    console.log('✅ [Backend] Utilisateur trouvé, mise à jour des champs:', req.body);
    // Mettre à jour les champs fournis dans le corps de la requête
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

  if (!userId || userId === 'null') {
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

router.put('/change-password/:id', async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ result: false, error: 'Champs manquants.' });
  }

  // Valider le nouveau mot de passe
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

    // Vérifier si l'ancien mot de passe est correct
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ result: false, error: 'Mot de passe actuel incorrect.' });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;

    await user.save();
    res.status(200).json({ result: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('❌ [Backend] Erreur lors de la mise à jour du mot de passe:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;