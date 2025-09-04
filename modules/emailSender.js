// modules/emailSender.js
// Version migrée vers Amazon SES (remplace SendGrid)

const { SESClient, SendEmailCommand, GetSendQuotaCommand } = require('@aws-sdk/client-ses');

// Configuration du client Amazon SES (remplace le transporter Nodemailer)
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "eu-north-1", // Stockholm par défaut
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Fonction utilitaire pour envoyer un email via Amazon SES
 * @param {Object} emailData - Données de l'email
 * @returns {Promise} - Résultat de l'envoi
 */
const sendEmailViaSES = async ({ to, subject, htmlContent, textContent }) => {
  try {
    const params = {
      Source: process.env.SES_FROM_EMAIL || "contact@monsavonvert.com", // CORRECTION: Utilise SES_FROM_EMAIL au lieu de SENDER_EMAIL
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: "UTF-8",
          },
          Text: {
            Data: textContent,
            Charset: "UTF-8",
          },
        },
      },
    };

    console.log('📧 Envoi depuis:', params.Source); // Log pour débugger
    console.log('📧 Envoi vers:', to);

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    
    return {
      messageId: response.MessageId,
      success: true
    };
  } catch (error) {
    console.error('Erreur Amazon SES:', error.message);
    throw error;
  }
};

/**
 * Envoie un email de confirmation de commande
 * @param {Object} customer - Données du client (email, nom, etc.)
 * @param {Object} order - Données de la commande (items, total, etc.)
 * @returns {Promise} - Promesse résolue quand l'email est envoyé
 */
const sendOrderConfirmation = async (customer, order) => {
  try {
    console.log('📧 ===== DÉBUT ENVOI EMAIL COMMANDE =====');
    console.log('📧 Email destinataire:', customer.email);
    console.log('📧 Nom du client:', customer.firstName, customer.lastName);
    console.log('📧 ID de la commande:', order._id);
    
    if (!customer.email) {
      throw new Error('Email du client manquant');
    }

    if (!order.items || order.items.length === 0) {
      throw new Error('Aucun article dans la commande');
    }
    
    // Format des produits pour l'email (gardé identique)
    const productsHtml = order.items.map(item => {
      const itemName = item.name || item.title || 'Produit sans nom';
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      const itemTotal = itemPrice * itemQuantity;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${itemName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${itemQuantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${itemPrice.toFixed(2)} €</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${itemTotal.toFixed(2)} €</td>
        </tr>
      `;
    }).join('');

    const customerName = customer.firstName || 'Client';
    const orderId = order._id || 'INCONNUE';
    const totalAmount = order.totalAmount || order.total || 0;

    // Template HTML (gardé identique)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Confirmation de commande</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Merci pour votre commande, ${customerName} !</h2>
          <p style="font-size: 16px; color: #666;">Nous avons bien reçu votre paiement et votre commande #${orderId} est maintenant confirmée.</p>
          
          <h3 style="color: #333; margin-top: 30px;">Articles commandés :</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Produit</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Quantité</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Prix unitaire</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9f9f9;">
                <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">TOTAL :</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #4CAF50;">${totalAmount.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #4CAF50;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Que se passe-t-il maintenant ?</h4>
            <p style="margin: 0; color: #666;">Votre commande est maintenant en cours de préparation. Vous recevrez un email de confirmation d'expédition avec un numéro de suivi dès que votre colis sera envoyé.</p>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            Cordialement,<br>
            <strong>L'équipe Mon Savon Vert</strong>
          </p>
        </div>
      </div>
    `;

    // Version texte (gardée identique)
    const textContent = `
CONFIRMATION DE COMMANDE

Merci pour votre commande, ${customerName} !

Nous avons bien reçu votre paiement et votre commande #${orderId} est maintenant confirmée.

ARTICLES COMMANDÉS :
${order.items.map(item => `- ${item.name || item.title}: ${item.quantity}x ${item.price}€`).join('\n')}

TOTAL DE LA COMMANDE: ${totalAmount.toFixed(2)} €

Cordialement,
L'équipe Mon Savon Vert
    `;

    // Envoi via Amazon SES (remplace transporter.sendMail)
    const info = await sendEmailViaSES({
      to: customer.email,
      subject: `Confirmation de votre commande #${orderId}`,
      htmlContent: htmlContent,
      textContent: textContent
    });
    
    console.log('✅ Email de commande envoyé avec succès');
    console.log('✉️ Message ID:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Erreur envoi email commande:', error.message);
    throw error;
  }
};

/**
 * Envoie un email de récupération de mot de passe
 * @param {Object} user - Données de l'utilisateur
 * @param {string} resetToken - Token de récupération
 * @returns {Promise} - Promesse résolue quand l'email est envoyé
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    console.log('🔒 ===== DÉBUT ENVOI EMAIL RÉCUPÉRATION =====');
    console.log('🔒 Email destinataire:', user.email);
    console.log('🔒 Nom utilisateur:', user.firstName, user.lastName);
    console.log('🔒 Token généré:', resetToken.substring(0, 10) + '...');
    
    if (!user.email) {
      throw new Error('Email de l\'utilisateur manquant');
    }

    if (!resetToken) {
      throw new Error('Token de récupération manquant');
    }

    const userName = user.firstName || 'Utilisateur';
    
    // URL pour réinitialiser le mot de passe (gardée identique)
    const resetURL = process.env.NODE_ENV === 'production' 
      ? `https://www.monsavonvert.com/reset-password/${resetToken}`
      : `http://localhost:3001/reset-password/${resetToken}`;

    // Template HTML (gardé identique)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2196F3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Récupération de mot de passe</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Bonjour ${userName},</h2>
          
          <p style="font-size: 16px; color: #666;">
            Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Mon Savon Vert.
          </p>
          
          <p style="font-size: 16px; color: #666;">
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" 
               style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="font-size: 14px; color: #999;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${resetURL}" style="color: #2196F3; word-break: break-all;">${resetURL}</a>
          </p>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Important :</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Ce lien expire dans <strong>10 minutes</strong></li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Pour votre sécurité, ne partagez jamais ce lien</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            Cordialement,<br>
            <strong>L'équipe Mon Savon Vert</strong>
          </p>
        </div>
      </div>
    `;

    // Version texte (gardée identique)
    const textContent = `
RÉCUPÉRATION DE MOT DE PASSE

Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Mon Savon Vert.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetURL}

IMPORTANT :
- Ce lien expire dans 10 minutes
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Pour votre sécurité, ne partagez jamais ce lien

Cordialement,
L'équipe Mon Savon Vert
    `;

    console.log('🔒 Configuration email récupération préparée, tentative d\'envoi...');
    console.log('🔒 URL de récupération:', resetURL);
    
    // Envoi via Amazon SES (remplace transporter.sendMail)
    const info = await sendEmailViaSES({
      to: user.email,
      subject: 'Récupération de votre mot de passe - Mon Savon Vert',
      htmlContent: htmlContent,
      textContent: textContent
    });
    
    console.log('✅ ===== EMAIL RÉCUPÉRATION ENVOYÉ AVEC SUCCÈS =====');
    console.log('✉️ Message ID:', info.messageId);
    console.log('✉️ Destinataire:', user.email);
    
    return info;
  } catch (error) {
    console.error('❌ ===== ERREUR ENVOI EMAIL RÉCUPÉRATION =====');
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Email destinataire:', user?.email || 'INCONNU');
    throw error;
  }
};

// Fonction pour tester la configuration email (adaptée pour Amazon SES)
const testEmailConfiguration = async () => {
  try {
    console.log('🔄 ===== TEST CONFIGURATION EMAIL AMAZON SES =====');
    
    // Vérification des variables d'environnement AWS
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID n\'est pas définie dans les variables d\'environnement');
    }
    
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY n\'est pas définie dans les variables d\'environnement');
    }
    
    if (!process.env.SES_FROM_EMAIL) {
      throw new Error('SES_FROM_EMAIL n\'est pas définie dans les variables d\'environnement');
    }
    
    console.log('✅ Variables d\'environnement AWS présentes');
    console.log('📧 Sender email:', process.env.SES_FROM_EMAIL); // CORRECTION: Affiche SES_FROM_EMAIL au lieu de SENDER_EMAIL
    console.log('🌍 Région AWS:', process.env.AWS_REGION || 'eu-north-1');
    
    // Test de connexion Amazon SES
    const command = new GetSendQuotaCommand({});
    const response = await sesClient.send(command);
    
    console.log('✅ Configuration Amazon SES correcte. SES est accessible.');
    console.log('📊 Quotas SES:', response);
    console.log('✅ ===== CONFIGURATION EMAIL SES OK =====');
    
    return true;
  } catch (error) {
    console.error('❌ ===== ERREUR CONFIGURATION EMAIL SES =====');
    console.error('❌ Erreur de configuration email:', error.message);
    return false;
  }
};

// Exécuter le test au démarrage du serveur
testEmailConfiguration();

// Exporter les fonctions (gardé identique)
module.exports = { 
  sendOrderConfirmation,
  sendPasswordResetEmail,
  testEmailConfiguration
};