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
    
    // Template HTML moderne pour l'email de récupération
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600&display=swap');
          
          * { box-sizing: border-box; }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f9fbf7;
          }
          
          .email-hero {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 50%, #d63031 100%);
            color: white;
            padding: 48px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .email-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(255, 107, 107, 0.15) 0%, transparent 50%);
            pointer-events: none;
          }
          
          .email-logo {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 32px;
            font-weight: 600;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 1;
          }
          
          .email-tagline {
            font-size: 16px;
            margin: 0;
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 1;
          }
          
          .email-content {
            background: white;
            padding: 40px 32px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .security-badge {
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 24px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
          }
          
          .security-icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ff6b6b;
            font-size: 12px;
            font-weight: bold;
          }
          
          .greeting {
            font-size: 18px;
            margin-bottom: 16px;
            color: #2c3e50;
          }
          
          .intro-text {
            font-size: 16px;
            margin-bottom: 32px;
            color: #546e7a;
          }
          
          .reset-button-container {
            text-align: center;
            margin: 40px 0;
            padding: 24px;
            background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
            border-radius: 16px;
            border: 1px solid #ffcdd2;
          }
          
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .reset-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.2);
            transition: transform 0.6s;
            transform: skewX(-15deg);
          }
          
          .reset-button:hover::before {
            transform: translateX(100%) skewX(-15deg);
          }
          
          .button-icon {
            margin-right: 8px;
          }
          
          .warning-card {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffc107;
            border-left: 4px solid #ff9800;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
          }
          
          .warning-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 18px;
            font-weight: 600;
            color: #856404;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
          }
          
          .warning-icon {
            margin-right: 8px;
            font-size: 20px;
          }
          
          .warning-list {
            margin: 12px 0 0 0;
            padding-left: 20px;
            color: #856404;
          }
          
          .warning-list li {
            margin-bottom: 8px;
            font-weight: 500;
          }
          
          .alt-link-card {
            background: white;
            border: 1px solid #e8f5e8;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .alt-link-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 16px;
            color: #1a4d2f;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
          }
          
          .alt-link-text {
            color: #546e7a;
            margin-bottom: 12px;
          }
          
          .alt-link {
            word-break: break-all;
            color: #ff6b6b;
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            border: 1px solid #e9ecef;
          }
          
          .support-section {
            border-top: 2px solid #f1f8e9;
            padding-top: 24px;
            margin-top: 32px;
            text-align: center;
          }
          
          .support-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 18px;
            color: #1a4d2f;
            margin-bottom: 12px;
          }
          
          .support-text {
            color: #546e7a;
            margin-bottom: 16px;
          }
          
          .support-email {
            display: inline-flex;
            align-items: center;
            background: #2e7d32;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .email-footer {
            background: #1a4d2f;
            color: rgba(255, 255, 255, 0.8);
            padding: 32px;
            text-align: center;
            border-radius: 0 0 16px 16px;
          }
          
          .footer-logo {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 20px;
            color: white;
            margin-bottom: 8px;
          }
          
          .footer-text {
            font-size: 14px;
            margin: 4px 0;
            opacity: 0.8;
          }
          
          @media (max-width: 600px) {
            .email-hero { padding: 32px 20px; }
            .email-content { padding: 24px 20px; }
            .reset-button-container { padding: 16px; margin: 24px 0; }
            .reset-button { padding: 14px 24px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Hero Section -->
          <div class="email-hero">
            <h1 class="email-logo">🔐 Mon Savon Vert</h1>
            <p class="email-tagline">Réinitialisation de mot de passe</p>
          </div>
          
          <!-- Contenu Principal -->
          <div class="email-content">
            <!-- Badge de sécurité -->
            <div class="security-badge">
              <div class="security-icon">🔑</div>
              Demande de réinitialisation
            </div>
            
            <!-- Salutation -->
            <p class="greeting">Bonjour,</p>
            
            <p class="intro-text">
              Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>${user.email}</strong>. 
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé.
            </p>
            
            <!-- Bouton de réinitialisation -->
            <div class="reset-button-container">
              <a href="${resetUrl}" class="reset-button">
                <span class="button-icon">🔄</span>
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <!-- Avertissements de sécurité -->
            <div class="warning-card">
              <h3 class="warning-title">
                <span class="warning-icon">⚠️</span>
                Informations importantes
              </h3>
              <ul class="warning-list">
                <li>Ce lien expire dans <strong>1 heure</strong> pour votre sécurité</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec personne</li>
              </ul>
            </div>
            
            <!-- Lien alternatif -->
            <div class="alt-link-card">
              <h3 class="alt-link-title">
                💻 Lien alternatif
              </h3>
              <p class="alt-link-text">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <div class="alt-link">${resetUrl}</div>
            </div>
            
            <!-- Support -->
            <div class="support-section">
              <h3 class="support-title">Besoin d'aide ?</h3>
              <p class="support-text">
                Si vous rencontrez des difficultés ou avez des questions concernant la sécurité de votre compte, notre équipe support est à votre disposition.
              </p>
              <a href="mailto:contact@monsavonvert.com" class="support-email">
                📧 Contacter le support
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="email-footer">
            <div class="footer-logo">Mon Savon Vert</div>
            <p class="footer-text">Savons naturels et écologiques</p>
            <p class="footer-text">Cet email a été envoyé automatiquement, merci de ne pas y répondre</p>
          </div>
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