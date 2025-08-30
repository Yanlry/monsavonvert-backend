const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { sendPasswordResetEmail } = require('../modules/emailSender');

/**
 * Route POST /forgot-password
 * Permet à un utilisateur de demander la récupération de son mot de passe
 */
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('🔒 ===== DEMANDE DE RÉCUPÉRATION DE MOT DE PASSE =====');
    
    const { email } = req.body;
    
    // Vérification que l'email est fourni
    if (!email) {
      console.log('❌ Email manquant dans la demande');
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }
    
    console.log('🔍 Recherche de l\'utilisateur avec email:', email);
    
    // Rechercher l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour l\'email:', email);
      // Pour des raisons de sécurité, on renvoie toujours un message de succès
      // même si l'utilisateur n'existe pas
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de récupération.'
      });
    }
    
    console.log('✅ Utilisateur trouvé:', user.firstName, user.lastName);
    
    // Générer le token de récupération
    const resetToken = user.generateResetPasswordToken();
    
    // Sauvegarder les modifications (token et expiration)
    await user.save();
    
    console.log('🔑 Token de récupération généré et sauvegardé');
    
    try {
      // Envoyer l'email de récupération
      await sendPasswordResetEmail(user, resetToken);
      
      console.log('✅ Email de récupération envoyé avec succès');
      
      res.status(200).json({
        success: true,
        message: 'Un email de récupération a été envoyé à votre adresse.'
      });
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError.message);
      
      // Nettoyer le token en cas d'erreur d'envoi
      user.clearResetPasswordToken();
      await user.save();
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur dans forgot-password:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
});

/**
 * Route POST /reset-password/:token
 * Permet de réinitialiser le mot de passe avec un token valide
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    console.log('🔒 ===== RÉINITIALISATION DE MOT DE PASSE =====');
    
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    console.log('🔑 Token reçu:', token.substring(0, 10) + '...');
    
    // Vérifications des données reçues
    if (!password || !confirmPassword) {
      console.log('❌ Mot de passe ou confirmation manquant');
      return res.status(400).json({
        success: false,
        message: 'Mot de passe et confirmation requis'
      });
    }
    
    if (password !== confirmPassword) {
      console.log('❌ Les mots de passe ne correspondent pas');
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }
    
    if (password.length < 6) {
      console.log('❌ Mot de passe trop court');
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    console.log('🔍 Recherche de l\'utilisateur avec token valide...');
    
    // Hasher le token pour le comparer avec celui en base
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Trouver l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Token non expiré
    });
    
    if (!user) {
      console.log('❌ Token invalide ou expiré');
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré. Veuillez faire une nouvelle demande de récupération.'
      });
    }
    
    console.log('✅ Utilisateur trouvé:', user.firstName, user.lastName);
    console.log('✅ Token valide, mise à jour du mot de passe...');
    
    // Mettre à jour le mot de passe (il sera automatiquement hashé par le middleware)
    user.password = password;
    
    // Nettoyer les tokens de récupération
    user.clearResetPasswordToken();
    
    // Sauvegarder les modifications
    await user.save();
    
    console.log('✅ Mot de passe mis à jour avec succès');
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });
    
  } catch (error) {
    console.error('❌ Erreur dans reset-password:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
});

/**
 * Route GET /verify-reset-token/:token
 * Vérifie si un token de récupération est valide (pour afficher la page ou non)
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    console.log('🔍 ===== VÉRIFICATION DE TOKEN =====');
    
    const { token } = req.params;
    
    console.log('🔑 Vérification du token:', token.substring(0, 10) + '...');
    
    // Hasher le token pour le comparer avec celui en base
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Trouver l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log('❌ Token invalide ou expiré');
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
    
    console.log('✅ Token valide pour:', user.firstName, user.lastName);
    
    // Calculer le temps restant avant expiration
    const timeRemaining = Math.ceil((user.resetPasswordExpire - Date.now()) / 1000 / 60); // en minutes
    
    res.status(200).json({
      success: true,
      message: 'Token valide',
      user: {
        firstName: user.firstName,
        email: user.email
      },
      timeRemaining: timeRemaining
    });
    
  } catch (error) {
    console.error('❌ Erreur dans verify-reset-token:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * Route de test pour envoyer un email de récupération manuellement
 */
router.get('/test-password-reset/:email', async (req, res) => {
  try {
    console.log('🧪 ===== TEST EMAIL RÉCUPÉRATION =====');
    
    const { email } = req.params;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const resetToken = user.generateResetPasswordToken();
    await user.save();
    
    await sendPasswordResetEmail(user, resetToken);
    
    res.json({
      success: true,
      message: `Email de test envoyé à ${email}`,
      token: resetToken // ATTENTION: Ne pas faire ça en production !
    });
    
  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;