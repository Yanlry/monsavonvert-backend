const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const User = require('../models/users'); // Importez le modèle User
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

// Route pour récupérer tous les clients
router.get('/', async (req, res) => {
    try {
      const customers = await Customer.find(); // Récupère tous les clients
      res.status(200).json({ result: true, customers });
    } catch (error) {
      console.error('Erreur lors de la récupération des clients :', error);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    }
  });
  
  // Route pour récupérer un client spécifique par ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await Customer.findById(id); // Recherche le client par ID
  
      if (!customer) {
        return res.status(404).json({ result: false, error: 'Client non trouvé.' });
      }
  
      res.status(200).json({ result: true, customer });
    } catch (error) {
      console.error('Erreur lors de la récupération du client :', error);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    }
  });

router.post('/', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, address, city, postalCode, country, termsAccepted } = req.body;
  
      // Vérification des champs obligatoires
      if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode || !country) {
        return res.status(400).json({ result: false, error: 'Tous les champs sont obligatoires.' });
      }
  
      // Vérification des termes et conditions
      if (!termsAccepted) {
        return res.status(400).json({ result: false, error: 'Vous devez accepter les termes et conditions pour continuer.' });
      }
  
      // Vérifier si un client avec cet e-mail existe déjà
      let existingCustomer = await Customer.findOne({ email });
  
      if (existingCustomer) {
        if (existingCustomer.firstName !== firstName || existingCustomer.lastName !== lastName) {
          return res.status(400).json({
            result: false,
            error: 'Un compte est déjà enregistré avec cette adresse e-mail, mais avec un prénom ou un nom différent. Veuillez vérifié vos informations.',
          });
        }
  
        let existingUser = await User.findOne({ email });
        if (existingUser) {
          const addressExists = existingUser.addresses.some(
            (addr) =>
              addr.street === address &&
              addr.city === city &&
              addr.postalCode === postalCode &&
              addr.country === country
          );
  
          if (!addressExists) {
            existingUser.addresses.push({
              street: address,
              city,
              postalCode,
              country,
              isDefault: existingUser.addresses.length === 0,
            });
            await existingUser.save();
          }
  
          return res.status(200).json({
            result: true,
            message: 'Client existant trouvé et adresse mise à jour.',
            customer: existingCustomer,
            user: existingUser,
          });
        }
  
        return res.status(200).json({
          result: true,
          message: 'Client existant trouvé.',
          customer: existingCustomer,
        });
      }
  
      const newCustomer = new Customer({
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
      });
  
      await newCustomer.save();
  
      const password = uid2(8);
      const hashedPassword = bcrypt.hashSync(password, 10);
  
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'user',
        phone,
        token: uid2(32),
        termsAccepted: true, // Enregistrer l'acceptation des termes
        addresses: [
          {
            street: address,
            city,
            postalCode,
            country,
            isDefault: true,
          },
        ],
      });
  
      await newUser.save();
  
      res.status(201).json({
        result: true,
        message: 'Client et compte utilisateur créés avec succès.',
        customer: newCustomer,
        user: newUser,
        temporaryPassword: password,
      });
    } catch (error) {
      console.error('Erreur lors de la gestion du client :', error);
      res.status(500).json({ result: false, error: 'Erreur interne du serveur.' });
    }
  });

module.exports = router;