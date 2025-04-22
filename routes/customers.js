require('../models/connection');
const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Route pour récupérer tous les clients
router.get('/', (req, res) => {
  console.log('📋 [Backend] Récupération de tous les clients');
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('❌ [Backend] Token manquant');
    return res.status(401).json({ result: false, error: 'Token manquant.' });
  }
  
  // Vérifier si l'utilisateur a le rôle 'admin'
  User.findOne({ token }).then(adminUser => {
    if (!adminUser || adminUser.role !== 'admin') {
      console.log('⛔ [Backend] Accès refusé pour l\'utilisateur:', adminUser?.email);
      return res.status(403).json({ result: false, error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    // Récupérer uniquement les utilisateurs avec le rôle 'user' (clients)
    User.find({ role: 'user' }).then(users => {
      console.log(`✅ [Backend] ${users.length} clients trouvés`);
      
      const customers = users.map(user => {
        // Trouver l'adresse par défaut ou la première adresse si disponible
        const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0] || {};
        
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          // Extraire les données d'adresse du tableau addresses
          address: defaultAddress.street || null,
          postalCode: defaultAddress.postalCode || null,
          city: defaultAddress.city || null,
          country: defaultAddress.country || null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          notes: user.notes || '',
        };
      });
      
      res.status(200).json({ result: true, customers });
    }).catch(err => {
      console.error('❌ [Backend] Erreur lors de la récupération des clients:', err);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la vérification du token:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

// Route pour rechercher un client par email
router.get('/search', (req, res) => {
  const { email } = req.query;
  console.log('🔍 [Backend] Recherche de client par email:', email);
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ result: false, error: 'Token manquant.' });
  }
  
  if (!email) {
    return res.status(400).json({ result: false, error: 'Email manquant dans la requête.' });
  }
  
  // Vérifier si l'utilisateur a le rôle 'admin'
  User.findOne({ token }).then(adminUser => {
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ result: false, error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    // Rechercher le client par email ET rôle 'user'
    User.findOne({ email: email.toLowerCase(), role: 'user' }).then(user => {
      if (!user) {
        console.log('❌ [Backend] Aucun client trouvé avec cet email:', email);
        return res.status(404).json({ result: false, error: 'Client introuvable.' });
      }
      
      console.log('✅ [Backend] Client trouvé:', user.email);
      
      // Trouver l'adresse par défaut ou la première adresse si disponible
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0] || {};
      
      const customer = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: defaultAddress.street || null,
        postalCode: defaultAddress.postalCode || null,
        city: defaultAddress.city || null,
        country: defaultAddress.country || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        notes: user.notes || '',
      };
      
      res.status(200).json({ result: true, customer });
    }).catch(err => {
      console.error('❌ [Backend] Erreur lors de la recherche du client:', err);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la vérification du token:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

// Nouvelle route pour rechercher un client par email en paramètre d'URL
router.get('/find-by-email/:email', (req, res) => {
  const { email } = req.params;
  console.log('🔍 [Backend] Recherche de client par email (params):', email);
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('❌ [Backend] Token manquant');
    return res.status(401).json({ result: false, error: 'Token manquant.' });
  }
  
  if (!email) {
    console.log('❌ [Backend] Email manquant dans les paramètres');
    return res.status(400).json({ result: false, error: 'Email manquant dans les paramètres.' });
  }
  
  // Vérifier si l'utilisateur a le rôle 'admin'
  User.findOne({ token }).then(adminUser => {
    if (!adminUser || adminUser.role !== 'admin') {
      console.log('⛔ [Backend] Accès refusé pour l\'utilisateur:', adminUser?.email);
      return res.status(403).json({ result: false, error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    // Rechercher le client par email ET rôle 'user'
    User.findOne({ email: email.toLowerCase(), role: 'user' }).then(user => {
      if (!user) {
        console.log('❌ [Backend] Aucun client trouvé avec cet email:', email);
        return res.status(404).json({ result: false, error: 'Client introuvable.' });
      }
      
      console.log('✅ [Backend] Client trouvé:', user.email);
      
      // Trouver l'adresse par défaut ou la première adresse si disponible
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0] || {};
      
      const customer = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: defaultAddress.street || null,
        postalCode: defaultAddress.postalCode || null,
        city: defaultAddress.city || null,
        country: defaultAddress.country || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        notes: user.notes || '',
      };
      
      res.status(200).json({ result: true, customer });
    }).catch(err => {
      console.error('❌ [Backend] Erreur lors de la recherche du client:', err);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la vérification du token:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

// Route pour mettre à jour un client
router.put('/:id', (req, res) => {
  const { id } = req.params;
  console.log('✏️ [Backend] Mise à jour du client:', id);
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ result: false, error: 'Token manquant.' });
  }
  
  // Vérifier si l'utilisateur a le rôle 'admin'
  User.findOne({ token }).then(adminUser => {
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ result: false, error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    // Mise à jour du client (vérifie aussi qu'il a le rôle 'user')
    User.findOne({ _id: id, role: 'user' }).then(user => {
      if (!user) {
        console.log('❌ [Backend] Client introuvable pour l\'ID:', id);
        return res.status(404).json({ result: false, error: 'Client introuvable.' });
      }
      
      // Mettre à jour les informations de base
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.notes = req.body.notes || user.notes;
      
      // Mettre à jour ou créer l'adresse
      let addressToUpdate = user.addresses.find(addr => addr.isDefault);
      let addressIndex = addressToUpdate ? user.addresses.findIndex(addr => addr.isDefault) : 0;
      
      // Si pas d'adresse par défaut et pas d'adresses du tout, créer une nouvelle
      if (!addressToUpdate && user.addresses.length === 0) {
        user.addresses.push({
          street: req.body.address || null,
          postalCode: req.body.postalCode || null,
          city: req.body.city || null,
          country: req.body.country || 'France',
          isDefault: true
        });
      } 
      // Si pas d'adresse par défaut mais au moins une adresse existe
      else if (!addressToUpdate && user.addresses.length > 0) {
        user.addresses[0].street = req.body.address || user.addresses[0].street;
        user.addresses[0].postalCode = req.body.postalCode || user.addresses[0].postalCode;
        user.addresses[0].city = req.body.city || user.addresses[0].city;
        user.addresses[0].country = req.body.country || user.addresses[0].country || 'France';
        user.addresses[0].isDefault = true;
      }
      // Si adresse par défaut trouvée
      else {
        user.addresses[addressIndex].street = req.body.address || user.addresses[addressIndex].street;
        user.addresses[addressIndex].postalCode = req.body.postalCode || user.addresses[addressIndex].postalCode;
        user.addresses[addressIndex].city = req.body.city || user.addresses[addressIndex].city;
        user.addresses[addressIndex].country = req.body.country || user.addresses[addressIndex].country || 'France';
      }
      
      user.save().then(updatedUser => {
        console.log('✅ [Backend] Client mis à jour avec succès:', updatedUser.email);
        
        // Formater la réponse
        const defaultAddress = updatedUser.addresses.find(addr => addr.isDefault) || updatedUser.addresses[0] || {};
        
        const customer = {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: defaultAddress.street || null,
          postalCode: defaultAddress.postalCode || null,
          city: defaultAddress.city || null,
          country: defaultAddress.country || null,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          notes: updatedUser.notes || '',
        };
        
        res.status(200).json({ result: true, customer });
      }).catch(err => {
        console.error('❌ [Backend] Erreur lors de la sauvegarde du client:', err);
        res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
      });
    }).catch(err => {
      console.error('❌ [Backend] Erreur lors de la recherche du client:', err);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    });
  }).catch(err => {
    console.error('❌ [Backend] Erreur lors de la vérification du token:', err);
    res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
  });
});

module.exports = router;