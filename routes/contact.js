// backend/routes/contact.js
// Route pour traiter les formulaires de contact et envoyer des emails

const express = require('express');
const router = express.Router();
const { sendContactFormEmail } = require('../modules/emailSender');
const { checkBody } = require('../modules/checkBody');

/**
 * POST /contact/send
 * Route pour traiter la soumission du formulaire de contact
 * VERSION CORRIGÉE : Utilise async/await comme tes autres routes qui fonctionnent
 */
router.post('/send', async (req, res) => {  // CHANGEMENT 1: Ajout de async
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

    // CHANGEMENT 2: Envoi de l'email AVANT de renvoyer la réponse (comme tes autres routes)
    try {
      console.log('📧 Envoi de l\'email de contact en cours...');
      await sendContactFormEmail(contactData);  // CHANGEMENT 3: Ajout de await
      console.log('✅ Email de contact envoyé avec succès');
      
      // Réponse de succès SEULEMENT après que l'email soit envoyé
      console.log('✅ Formulaire de contact traité avec succès');
      console.log('📧 === FIN TRAITEMENT CONTACT ===\n');
      
      res.json({
        result: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
      });
      
    } catch (emailError) {
      // CHANGEMENT 4: Gestion d'erreur d'email comme dans tes autres routes
      console.error('❌ Erreur envoi email contact:', emailError.message);
      console.error('❌ Détail de l\'erreur:', emailError.stack);
      
      // Renvoyer une erreur si l'email n'a pas pu être envoyé
      res.json({
        result: false,
        error: 'Impossible d\'envoyer votre message pour le moment. Veuillez réessayer ou nous contacter directement par téléphone.'
      });
    }

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

/**
 * NOUVELLE ROUTE : Test d'envoi d'email de contact
 * Pour tester si l'envoi d'email fonctionne vraiment
 */
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Test d\'envoi d\'email de contact');
    
    // Données de test pour l'email
    const testContactData = {
      name: 'Test Client',
      email: 'test@example.com',
      subject: 'information',
      message: 'Ceci est un test du formulaire de contact pour vérifier que les emails fonctionnent correctement.'
    };
    
    // Envoyer l'email de test
    console.log('📧 Envoi de l\'email de test...');
    await sendContactFormEmail(testContactData);
    
    res.json({
      success: true,
      message: 'Email de test de contact envoyé avec succès !',
      details: {
        destinataire: 'contact@monsavonvert.com',
        expediteur: testContactData.email,
        sujet: testContactData.subject
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;