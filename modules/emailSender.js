// backend/modules/emailSender.js
// Migration complète vers Mailjet - VERSION CORRIGÉE
// INSTRUCTIONS : Remplacez TOUT le contenu de votre fichier existant par ce code

const Mailjet = require('node-mailjet');

/**
 * Configuration de Mailjet avec vérification des variables d'environnement
 */
const initializeMailjetClient = () => {
  try {
    console.log('🔧 INITIALISATION MAILJET...');
    
    // Vérification des clés API
    if (!process.env.MAILJET_API_KEY) {
      throw new Error('❌ MAILJET_API_KEY manquante dans le fichier .env');
    }
    
    if (!process.env.MAILJET_SECRET_KEY) {
      throw new Error('❌ MAILJET_SECRET_KEY manquante dans le fichier .env');
    }
    
    console.log('✅ Clés API Mailjet trouvées');
    console.log('📧 Email expéditeur:', process.env.MAILJET_FROM_EMAIL || 'contact@monsavonvert.com');
    
    // SYNTAXE CORRECTE - Configuration du client Mailjet
    const mailjetClient = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    });
    
    console.log('✅ Client Mailjet initialisé avec succès');
    return mailjetClient;
    
  } catch (error) {
    console.error('❌ Erreur initialisation Mailjet:', error.message);
    throw error;
  }
};

/**
 * Fonction principale pour envoyer un email via Mailjet
 */
const sendEmailViaMailjet = async ({ to, subject, htmlContent, textContent, fromName = null }) => {
  try {
    console.log('\n📧 === ENVOI EMAIL VIA MAILJET ===');
    console.log('📧 Destinataire:', to);
    console.log('📧 Sujet:', subject);
    console.log('📧 Depuis:', process.env.MAILJET_FROM_EMAIL || 'contact@monsavonvert.com');
    
    const mailjetClient = initializeMailjetClient();
    
    // Configuration de l'email pour Mailjet
    const emailData = {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'contact@monsavonvert.com',
            Name: fromName || process.env.MAILJET_FROM_NAME || 'Mon Savon Vert'
          },
          To: [
            {
              Email: to
            }
          ],
          Subject: subject,
          HTMLPart: htmlContent,
          TextPart: textContent || 'Version texte de l\'email'
        }
      ]
    };
    
    console.log('🚀 Envoi en cours via Mailjet...');
    
    // Envoi de l'email via Mailjet
    const response = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request(emailData);
    
    console.log('✅ Email envoyé avec succès via Mailjet !');
    console.log('📬 Statut:', response.response.status);
    console.log('📬 Message ID:', response.body.Messages[0].To[0].MessageID);
    console.log('=== FIN ENVOI EMAIL ===\n');
    
    return {
      messageId: response.body.Messages[0].To[0].MessageID,
      status: response.response.status,
      success: true,
      provider: 'Mailjet'
    };
    
  } catch (error) {
    console.error('❌ === ERREUR ENVOI EMAIL MAILJET ===');
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Destinataire concerné:', to);
    console.error('❌ Sujet concerné:', subject);
    
    // Affichage détaillé de l'erreur Mailjet
    if (error.response) {
      console.error('❌ Code d\'erreur HTTP:', error.response.status);
      console.error('❌ Réponse Mailjet:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.statusCode) {
      console.error('❌ Status Code:', error.statusCode);
    }
    
    console.error('=== FIN ERREUR EMAIL ===\n');
    
    throw error;
  }
};

/**
 * Test de connexion Mailjet (pour diagnostiquer les problèmes)
 */
const testMailjetConnection = async () => {
  try {
    console.log('\n🔍 === TEST CONNEXION MAILJET ===');
    
    const mailjetClient = initializeMailjetClient();
    
    // Test simple avec l'API Mailjet
    const testEmailData = {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'contact@monsavonvert.com',
            Name: process.env.MAILJET_FROM_NAME || 'Mon Savon Vert'
          },
          To: [
            {
              Email: process.env.MAILJET_FROM_EMAIL || 'contact@monsavonvert.com'
            }
          ],
          Subject: 'Test de connexion Mailjet',
          HTMLPart: '<h1>Test réussi !</h1><p>Votre configuration Mailjet fonctionne parfaitement.</p>',
          TextPart: 'Test réussi ! Votre configuration Mailjet fonctionne parfaitement.'
        }
      ]
    };
    
    const response = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request(testEmailData);
    
    console.log('✅ Test Mailjet réussi !');
    console.log('📬 Statut:', response.response.status);
    console.log('📬 Message ID:', response.body.Messages[0].To[0].MessageID);
    console.log('=== FIN TEST CONNEXION ===\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ === ÉCHEC TEST MAILJET ===');
    console.error('❌ Erreur:', error.message);
    
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Données:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('=== FIN TEST ÉCHEC ===\n');
    throw error;
  }
};

/**
 * Fonction pour envoyer l'email de confirmation de commande
 * GARDÉE IDENTIQUE - seule la méthode d'envoi change
 */
const sendOrderConfirmation = async (customer, order) => {
  try {
    console.log('\n💼 === PRÉPARATION EMAIL COMMANDE ===');
    console.log('💼 Client:', customer.email);
    console.log('💼 Numéro commande:', order.orderNumber);
    console.log('💼 Montant:', order.totalAmount);
    
    // Validation des données d'entrée
    if (!customer || !customer.email) {
      throw new Error('❌ Données client manquantes ou email invalide');
    }
    
    if (!order || !order.orderNumber) {
      throw new Error('❌ Données de commande manquantes');
    }
    
    // Construction de la liste des produits
    let productsList = '';
    if (order.products && order.products.length > 0) {
      productsList = order.products.map(product => {
        const productName = product.name || 'Produit sans nom';
        const productPrice = product.price ? `${product.price.toFixed(2)}€` : 'Prix non disponible';
        const productQuantity = product.quantity || 1;
        
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              <strong>${productName}</strong>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
              ${productQuantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
              ${productPrice}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      productsList = `
        <tr>
          <td colspan="3" style="padding: 20px; text-align: center; color: #666;">
            Aucun produit trouvé dans cette commande
          </td>
        </tr>
      `;
    }
    
    // Template HTML pour l'email de confirmation (gardé identique)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🧼 Mon Savon Vert</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Savons naturels et écologiques</p>
        </div>
        
        <!-- Contenu principal -->
        <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
          
          <h2 style="color: #4CAF50; margin-top: 0;">✅ Commande confirmée !</h2>
          
          <p>Bonjour <strong>${customer.firstName || customer.email}</strong>,</p>
          
          <p>Nous avons bien reçu votre commande et nous vous remercions pour votre confiance ! 🌿</p>
          
          <!-- Détails de la commande -->
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">📋 Détails de votre commande</h3>
            <p><strong>Numéro de commande :</strong> ${order.orderNumber}</p>
            <p><strong>Date :</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}</p>
            <p><strong>Email :</strong> ${customer.email}</p>
          </div>
          
          <!-- Liste des produits -->
          <h3 style="color: #333;">🛒 Vos produits</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #4CAF50; color: white;">
                <th style="padding: 12px; text-align: left;">Produit</th>
                <th style="padding: 12px; text-align: center;">Quantité</th>
                <th style="padding: 12px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
          
          <!-- Total -->
          <div style="text-align: right; margin: 20px 0; padding: 15px; background: #f0f8f0; border-radius: 8px;">
            <h3 style="margin: 0; color: #4CAF50; font-size: 20px;">
              💰 Total : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
            </h3>
          </div>
          
          <!-- Informations de livraison -->
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">🚚 Livraison</h3>
            <p>Votre commande sera expédiée sous 24-48h ouvrées.</p>
            <p>Vous recevrez un email de confirmation d'expédition avec le numéro de suivi.</p>
          </div>
          
          <!-- Support -->
          <div style="border-top: 2px solid #4CAF50; padding-top: 20px; margin-top: 30px;">
            <h3 style="color: #333;">💬 Besoin d'aide ?</h3>
            <p>Notre équipe est là pour vous aider !</p>
            <p>📧 Email : <a href="mailto:contact@monsavonvert.com" style="color: #4CAF50;">contact@monsavonvert.com</a></p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 14px;">
          <p style="margin: 0;">Merci de faire confiance à Mon Savon Vert ! 🌱</p>
          <p style="margin: 5px 0 0 0;">Des savons naturels pour prendre soin de vous et de la planète</p>
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email
    const textContent = `
      MON SAVON VERT - Confirmation de commande
      
      Bonjour ${customer.firstName || customer.email},
      
      Nous avons bien reçu votre commande et nous vous remercions !
      
      DÉTAILS DE VOTRE COMMANDE :
      - Numéro : ${order.orderNumber}
      - Date : ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}
      - Email : ${customer.email}
      - Total : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
      
      Votre commande sera expédiée sous 24-48h ouvrées.
      
      Besoin d'aide ? Contactez-nous : contact@monsavonvert.com
      
      Merci de votre confiance !
      L'équipe Mon Savon Vert
    `;
    
    console.log('💼 Template email préparé');
    
    // Envoi via Mailjet
    const result = await sendEmailViaMailjet({
      to: customer.email,
      subject: `✅ Commande confirmée #${order.orderNumber} - Mon Savon Vert`,
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'Mon Savon Vert - Confirmations'
    });
    
    console.log('💼 === EMAIL COMMANDE ENVOYÉ ===\n');
    return result;
    
  } catch (error) {
    console.error('❌ === ERREUR EMAIL COMMANDE ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Client concerné:', customer?.email || 'Email non disponible');
    console.error('❌ Commande concernée:', order?.orderNumber || 'Numéro non disponible');
    console.error('=== FIN ERREUR EMAIL COMMANDE ===\n');
    throw error;
  }
};

/**
 * Fonction pour envoyer l'email de récupération de mot de passe
 * GARDÉE IDENTIQUE - seule la méthode d'envoi change
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    console.log('\n🔐 === PRÉPARATION EMAIL RESET PASSWORD ===');
    console.log('🔐 Utilisateur:', user.email);
    console.log('🔐 Token généré:', resetToken ? 'OUI' : 'NON');
    
    // Validation des données d'entrée
    if (!user || !user.email) {
      throw new Error('❌ Données utilisateur manquantes ou email invalide');
    }
    
    if (!resetToken) {
      throw new Error('❌ Token de réinitialisation manquant');
    }
    
    // URL de réinitialisation (adaptez selon votre frontend)
    const resetUrl = `${process.env.FRONTEND_URL || 'https://monsavonvert.com'}/reset-password?token=${resetToken}`;
    
    console.log('🔐 URL de reset générée:', resetUrl);
    
    // Template HTML pour l'email de récupération
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF6B6B, #ee5a52); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔐 Mon Savon Vert</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Réinitialisation de mot de passe</p>
        </div>
        
        <!-- Contenu principal -->
        <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none;">
          
          <h2 style="color: #FF6B6B; margin-top: 0;">🔑 Réinitialisation demandée</h2>
          
          <p>Bonjour,</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>${user.email}</strong>.</p>
          
          <!-- Bouton de réinitialisation -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; 
                      background: #FF6B6B; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;">
              🔄 Réinitialiser mon mot de passe
            </a>
          </div>
          
          <!-- Informations importantes -->
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Important</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Ce lien expire dans <strong>1 heure</strong></li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Ne partagez jamais ce lien avec personne</li>
            </ul>
          </div>
          
          <!-- Lien alternatif -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">💻 Lien alternatif</h3>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #FF6B6B; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
          </div>
          
          <!-- Support -->
          <div style="border-top: 2px solid #FF6B6B; padding-top: 20px; margin-top: 30px;">
            <h3 style="color: #333;">💬 Besoin d'aide ?</h3>
            <p>Si vous rencontrez des difficultés, contactez notre support :</p>
            <p>📧 Email : <a href="mailto:contact@monsavonvert.com" style="color: #FF6B6B;">contact@monsavonvert.com</a></p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 14px;">
          <p style="margin: 0;">Mon Savon Vert - Savons naturels et écologiques 🌱</p>
          <p style="margin: 5px 0 0 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre</p>
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email
    const textContent = `
      MON SAVON VERT - Réinitialisation de mot de passe
      
      Bonjour,
      
      Vous avez demandé la réinitialisation de votre mot de passe pour : ${user.email}
      
      Pour créer un nouveau mot de passe, cliquez sur ce lien :
      ${resetUrl}
      
      IMPORTANT :
      - Ce lien expire dans 1 heure
      - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
      - Ne partagez jamais ce lien
      
      Besoin d'aide ? Contactez-nous : contact@monsavonvert.com
      
      L'équipe Mon Savon Vert
    `;
    
    console.log('🔐 Template email reset préparé');
    
    // Envoi via Mailjet
    const result = await sendEmailViaMailjet({
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe - Mon Savon Vert',
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'Mon Savon Vert - Support'
    });
    
    console.log('🔐 === EMAIL RESET PASSWORD ENVOYÉ ===\n');
    return result;
    
  } catch (error) {
    console.error('❌ === ERREUR EMAIL RESET PASSWORD ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Utilisateur concerné:', user?.email || 'Email non disponible');
    console.error('❌ Token fourni:', resetToken ? 'OUI' : 'NON');
    console.error('=== FIN ERREUR EMAIL RESET ===\n');
    throw error;
  }
};

// Export des fonctions pour utilisation dans vos routes
module.exports = {
  sendOrderConfirmation,
  sendPasswordResetEmail,
  testMailjetConnection,
  sendEmailViaMailjet
};