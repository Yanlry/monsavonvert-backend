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
 * NOUVEAU STYLE MON SAVON VERT - Logique gardée identique
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
            <td style="padding: 15px; border-bottom: 1px solid #e8f5e8; font-weight: 500;">
              ${productName}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e8f5e8; text-align: center; font-weight: 500;">
              ${productQuantity}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e8f5e8; text-align: right; font-weight: 600; color: #1b5e20;">
              ${productPrice}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      productsList = `
        <tr>
          <td colspan="3" style="padding: 30px; text-align: center; color: #666; font-style: italic;">
            Aucun produit trouvé dans cette commande
          </td>
        </tr>
      `;
    }
    
    // Template HTML avec le nouveau style Mon Savon Vert
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande - Mon Savon Vert</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        
        <!-- Container principal -->
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- BANNIÈRE SUPÉRIEURE -->
          <div style="width: 100%; background-color: #1b5e20; padding: 40px 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 36px; font-weight: bold; letter-spacing: 2px;">
              🧼 MON SAVON VERT
            </h1>
            <p style="margin: 10px 0 0 0; color: #a5d6a7; font-size: 16px; font-weight: 300;">
              Savons naturels et écologiques
            </p>
          </div>
          
          <!-- CONTENU PRINCIPAL -->
          <div style="padding: 50px 40px;">
            
            <!-- Titre de confirmation -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1b5e20; margin: 0; font-size: 28px; font-weight: bold;">
                ✅ Commande confirmée !
              </h2>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">
                Merci pour votre confiance en nos produits naturels
              </p>
            </div>
            
            <!-- Message personnel -->
            <div style="background: linear-gradient(135deg, #e8f5e8, #f1f8e9); padding: 30px; border-radius: 15px; margin-bottom: 35px; border-left: 5px solid #1b5e20;">
              <p style="margin: 0; font-size: 18px; color: #2e7d32;">
                Bonjour <strong style="color: #1b5e20;">${customer.firstName || customer.email}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; color: #4a4a4a; line-height: 1.7;">
                Nous avons bien reçu votre commande et nous vous remercions chaleureusement pour votre confiance ! 
                Nos artisans savonniers préparent déjà vos produits avec le plus grand soin. 🌿
              </p>
            </div>
            
            <!-- Détails de la commande -->
            <div style="background: #ffffff; border: 2px solid #1b5e20; border-radius: 15px; padding: 30px; margin-bottom: 35px;">
              <h3 style="margin: 0 0 25px 0; color: #1b5e20; font-size: 22px; font-weight: bold; border-bottom: 2px solid #e8f5e8; padding-bottom: 15px;">
                📋 Récapitulatif de votre commande
              </h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">Numéro de commande :</span>
                  <span style="font-weight: bold; color: #1b5e20; font-size: 16px;">#${order.orderNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">Date de commande :</span>
                  <span style="color: #333;">${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                  <span style="font-weight: 600; color: #555;">Email de confirmation :</span>
                  <span style="color: #1b5e20; font-weight: 500;">${customer.email}</span>
                </div>
              </div>
            </div>
            
            <!-- Liste des produits -->
            <div style="background: #ffffff; border: 2px solid #1b5e20; border-radius: 15px; padding: 30px; margin-bottom: 35px;">
              <h3 style="margin: 0 0 25px 0; color: #1b5e20; font-size: 22px; font-weight: bold; border-bottom: 2px solid #e8f5e8; padding-bottom: 15px;">
                🛒 Vos produits sélectionnés
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #1b5e20;">
                    <th style="padding: 18px 15px; text-align: left; color: white; font-weight: bold; font-size: 16px;">Produit</th>
                    <th style="padding: 18px 15px; text-align: center; color: white; font-weight: bold; font-size: 16px;">Quantité</th>
                    <th style="padding: 18px 15px; text-align: right; color: white; font-weight: bold; font-size: 16px;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsList}
                </tbody>
              </table>
            </div>
            
            <!-- Total -->
            <div style="background: linear-gradient(135deg, #1b5e20, #2e7d32); color: white; padding: 25px; border-radius: 15px; text-align: center; margin-bottom: 35px;">
              <h3 style="margin: 0; font-size: 24px; font-weight: bold;">
                💰 Total de votre commande : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
              </h3>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">
                TVA incluse • Livraison calculée à l'étape suivante
              </p>
            </div>
            
            <!-- Informations de livraison -->
            <div style="background: #e8f5e8; border-radius: 15px; padding: 30px; margin-bottom: 35px; border-left: 5px solid #1b5e20;">
              <h3 style="margin: 0 0 20px 0; color: #1b5e20; font-size: 20px; font-weight: bold;">
                🚚 Informations de livraison
              </h3>
              <div style="color: #2e7d32; line-height: 1.8;">
                <p style="margin: 0 0 10px 0;">📦 <strong>Préparation :</strong> Votre commande sera préparée avec soin sous 24-48h ouvrées</p>
                <p style="margin: 0 0 10px 0;">🚛 <strong>Expédition :</strong> Vous recevrez un email de confirmation d'expédition avec numéro de suivi</p>
                <p style="margin: 0;">🌍 <strong>Engagement :</strong> Emballage 100% recyclable et livraison éco-responsable</p>
              </div>
            </div>
            
            <!-- Support client -->
            <div style="background: #ffffff; border: 2px solid #1b5e20; border-radius: 15px; padding: 30px; text-align: center;">
              <h3 style="margin: 0 0 20px 0; color: #1b5e20; font-size: 20px; font-weight: bold;">
                💬 Une question ? Notre équipe est là !
              </h3>
              <p style="margin: 0 0 20px 0; color: #555; line-height: 1.6;">
                Notre service client dédié est disponible pour répondre à toutes vos questions
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #1b5e20;">
                <p style="margin: 0; font-weight: bold; color: #1b5e20; font-size: 16px;">
                  📧 contact@monsavonvert.com
                </p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                  Réponse garantie sous 24h • Du lundi au vendredi, 9h-18h
                </p>
              </div>
            </div>
            
          </div>
          
          <!-- BANNIÈRE INFÉRIEURE -->
          <div style="width: 100%; background-color: #1b5e20; padding: 40px 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: white; font-size: 20px; font-weight: bold;">
              🌱 Merci de faire confiance à Mon Savon Vert !
            </h4>
            <p style="margin: 0 0 20px 0; color: #a5d6a7; font-size: 16px; line-height: 1.6;">
              Des savons artisanaux et naturels pour prendre soin de vous et de notre planète
            </p>
            <div style="border-top: 1px solid #388e3c; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0; color: #c8e6c9; font-size: 14px;">
                🌿 100% naturel • 🌍 Zéro déchet • ♻️ Emballage recyclable • 🐰 Non testé sur les animaux
              </p>
              <p style="margin: 10px 0 0 0; color: #81c784; font-size: 12px;">
                Mon Savon Vert © 2024 • Artisans savonniers français • Fait avec ❤️ pour la nature
              </p>
            </div>
          </div>
          
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email (gardée identique)
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
 * NOUVEAU STYLE MON SAVON VERT - Logique gardée identique
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
    const resetUrl = `${process.env.FRONTEND_URL || 'https://monsavonvert.com'}/reset-password/${resetToken}`;
    
    console.log('🔐 URL de reset générée:', resetUrl);
    
    // Template HTML avec le nouveau style Mon Savon Vert
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Mon Savon Vert</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        
        <!-- Container principal -->
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- BANNIÈRE SUPÉRIEURE -->
          <div style="width: 100%; background-color: #1b5e20; padding: 40px 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 36px; font-weight: bold; letter-spacing: 2px;">
              🧼 MON SAVON VERT
            </h1>
            <p style="margin: 10px 0 0 0; color: #a5d6a7; font-size: 16px; font-weight: 300;">
              Réinitialisation de mot de passe
            </p>
          </div>
          
          <!-- CONTENU PRINCIPAL -->
          <div style="padding: 50px 40px;">
            
            <!-- Titre de réinitialisation -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1b5e20; margin: 0; font-size: 28px; font-weight: bold;">
                🔑 Réinitialisation demandée
              </h2>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">
                Suivez les étapes ci-dessous pour créer un nouveau mot de passe
              </p>
            </div>
            
            <!-- Message personnel -->
            <div style="background: linear-gradient(135deg, #e8f5e8, #f1f8e9); padding: 30px; border-radius: 15px; margin-bottom: 35px; border-left: 5px solid #1b5e20;">
              <p style="margin: 0; font-size: 18px; color: #2e7d32;">
                Bonjour,
              </p>
              <p style="margin: 15px 0 0 0; color: #4a4a4a; line-height: 1.7;">
                Vous avez demandé la réinitialisation du mot de passe pour votre compte <strong style="color: #1b5e20;">${user.email}</strong>.
                Cliquez sur le bouton ci-dessous pour procéder en toute sécurité. 🔐
              </p>
            </div>
            
            <!-- Bouton de réinitialisation -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; 
                        background: linear-gradient(135deg, #1b5e20, #2e7d32); 
                        color: white; 
                        padding: 20px 40px; 
                        text-decoration: none; 
                        border-radius: 15px; 
                        font-weight: bold; 
                        font-size: 18px;
                        box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
                        transition: all 0.3s ease;">
                🔄 Réinitialiser mon mot de passe
              </a>
            </div>
            
            <!-- Informations importantes -->
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 15px; padding: 30px; margin: 35px 0;">
              <h3 style="margin: 0 0 20px 0; color: #856404; font-size: 20px; font-weight: bold;">
                ⚠️ Informations importantes
              </h3>
              <div style="color: #856404; line-height: 1.8;">
                <p style="margin: 0 0 15px 0;">🕐 <strong>Durée de validité :</strong> Ce lien expire dans exactement 1 heure</p>
                <p style="margin: 0 0 15px 0;">🔒 <strong>Sécurité :</strong> Ne partagez jamais ce lien avec personne</p>
                <p style="margin: 0 0 15px 0;">❌ <strong>Demande non autorisée :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</p>
                <p style="margin: 0;">🛡️ <strong>Protection :</strong> Votre compte reste sécurisé tant que vous ne cliquez pas sur le lien</p>
              </div>
            </div>
            
            <!-- Lien alternatif -->
            <div style="background: #ffffff; border: 2px solid #1b5e20; border-radius: 15px; padding: 30px; margin-bottom: 35px;">
              <h3 style="margin: 0 0 20px 0; color: #1b5e20; font-size: 20px; font-weight: bold;">
                💻 Le bouton ne fonctionne pas ?
              </h3>
              <p style="margin: 0 0 15px 0; color: #555;">
                Copiez et collez ce lien directement dans votre navigateur :
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #1b5e20;">
                <p style="word-break: break-all; color: #1b5e20; font-family: 'Courier New', monospace; font-size: 14px; margin: 0; line-height: 1.4;">
                  ${resetUrl}
                </p>
              </div>
            </div>
            
            <!-- Support client -->
            <div style="background: #ffffff; border: 2px solid #1b5e20; border-radius: 15px; padding: 30px; text-align: center;">
              <h3 style="margin: 0 0 20px 0; color: #1b5e20; font-size: 20px; font-weight: bold;">
                💬 Besoin d'aide ?
              </h3>
              <p style="margin: 0 0 20px 0; color: #555; line-height: 1.6;">
                Si vous rencontrez des difficultés, notre équipe technique est là pour vous aider
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #1b5e20;">
                <p style="margin: 0; font-weight: bold; color: #1b5e20; font-size: 16px;">
                  📧 contact@monsavonvert.com
                </p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                  Support technique • Réponse rapide garantie
                </p>
              </div>
            </div>
            
          </div>
          
          <!-- BANNIÈRE INFÉRIEURE -->
          <div style="width: 100%; background-color: #1b5e20; padding: 40px 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: white; font-size: 20px; font-weight: bold;">
              🔐 Sécurité et confidentialité
            </h4>
            <p style="margin: 0 0 20px 0; color: #a5d6a7; font-size: 16px; line-height: 1.6;">
              Votre sécurité est notre priorité. Tous vos données sont protégées et chiffrées.
            </p>
            <div style="border-top: 1px solid #388e3c; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0; color: #c8e6c9; font-size: 14px;">
                🛡️ Connexion sécurisée • 🔒 Données chiffrées • 🌐 Conformité RGPD
              </p>
              <p style="margin: 10px 0 0 0; color: #81c784; font-size: 12px;">
                Mon Savon Vert © 2024 • Email automatique - Ne pas répondre • Support : contact@monsavonvert.com
              </p>
            </div>
          </div>
          
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email (gardée identique)
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