// backend/routes/contact.js
// Route pour traiter les formulaires de contact et envoyer des emails

const express = require('express');
const router = express.Router();
const { sendContactFormEmail } = require('../modules/emailSender');
const { checkBody } = require('../modules/checkBody');

/**
 * POST /contact/send
 * Route pour traiter la soumission du formulaire de contact
 */
router.post('/send', (req, res) => {
  console.log('\n📧 === RÉCEPTION FORMULAIRE CONTACT ===');
  console.log('📧 Données reçues:', JSON.stringify(req.body, null, 2));
  
  try {
    // Vérification des champs obligatoires
    if (!checkBody(req.body, ['name', 'email', 'message'])) {
      console.log('❌ Champs obligatoires manquants');
      return res.json({
        result: false,
        error: 'Veuillez remplir tous les champs obligatoires (nom, email, message)'
      });
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      console.log('❌ Format email invalide:', req.body.email);
      return res.json({
        result: false,
        error: 'Veuillez saisir une adresse email valide'
      });
    }

    // Extraction des données du formulaire
    const contactData = {
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      subject: req.body.subject || 'information',
      message: req.body.message.trim()
    };

    console.log('📧 Données de contact validées:', contactData);

    // Envoi de l'email de contact de manière asynchrone
    sendContactFormEmail(contactData)
      .then(() => {
        console.log('✅ Email de contact envoyé avec succès');
      })
      .catch((error) => {
        console.error('❌ Erreur envoi email contact:', error.message);
        // On ne fait pas échouer la requête si l'email échoue
        // L'utilisateur aura quand même une confirmation
      });

    // Réponse immédiate à l'utilisateur
    console.log('✅ Formulaire de contact traité avec succès');
    console.log('📧 === FIN TRAITEMENT CONTACT ===\n');
    
    res.json({
      result: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
    });

  } catch (error) {
    console.error('❌ === ERREUR FORMULAIRE CONTACT ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Données reçues:', req.body);
    console.error('=== FIN ERREUR CONTACT ===\n');
    
    res.json({
      result: false,
      error: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.'
    });
  }
});

/**
 * GET /contact/test
 * Route de test pour vérifier que le système de contact fonctionne
 */
router.get('/test', (req, res) => {
  console.log('🔍 Test route contact appelée');
  res.json({
    result: true,
    message: 'Route contact fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;