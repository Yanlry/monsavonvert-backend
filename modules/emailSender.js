// modules/emailSender.js
const nodemailer = require('nodemailer');

// Configuration améliorée du transporteur d'email avec SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // Utilise TLS
  auth: {
    user: 'apikey', // Ce texte doit rester tel quel pour SendGrid
    pass: process.env.SENDGRID_API_KEY
  },
  // Paramètres supplémentaires pour améliorer la livraison
  tls: {
    rejectUnauthorized: false // Nécessaire pour certains serveurs
  },
  // NOUVEAU : Activer les logs de debug
  debug: true,
  logger: true
});

/**
 * Envoie un email de confirmation de commande
 * @param {Object} customer - Données du client (email, nom, etc.)
 * @param {Object} order - Données de la commande (items, total, etc.)
 * @returns {Promise} - Promesse résolue quand l'email est envoyé
 */
const sendOrderConfirmation = async (customer, order) => {
  try {
    console.log('📧 ===== DÉBUT ENVOI EMAIL =====');
    console.log('📧 Email destinataire:', customer.email);
    console.log('📧 Nom du client:', customer.firstName, customer.lastName);
    console.log('📧 ID de la commande:', order._id);
    console.log('📧 Nombre d\'articles:', order.items?.length || 0);
    console.log('📧 SENDGRID_API_KEY présente:', !!process.env.SENDGRID_API_KEY);
    console.log('📧 SENDER_EMAIL:', process.env.SENDER_EMAIL);
    
    // Vérification que l'email existe
    if (!customer.email) {
      throw new Error('Email du client manquant');
    }

    // Vérification que les articles existent
    if (!order.items || order.items.length === 0) {
      throw new Error('Aucun article dans la commande');
    }
    
    // Format des produits pour l'email
    const productsHtml = order.items.map(item => {
      console.log('📦 Article:', item);
      
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

    // Création du contenu de l'email
    const mailOptions = {
      from: {
        name: 'Mon Savon Vert',
        address: process.env.SENDER_EMAIL
      },
      to: customer.email,
      subject: `Confirmation de votre commande #${orderId}`,
      html: `
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
      `,
      text: `
CONFIRMATION DE COMMANDE

Merci pour votre commande, ${customerName} !

Nous avons bien reçu votre paiement et votre commande #${orderId} est maintenant confirmée.

ARTICLES COMMANDÉS :
${order.items.map(item => `- ${item.name || item.title}: ${item.quantity}x ${item.price}€`).join('\n')}

TOTAL DE LA COMMANDE: ${totalAmount.toFixed(2)} €

Votre commande est maintenant en cours de préparation. Vous recevrez un email de confirmation d'expédition avec un numéro de suivi dès que votre colis sera envoyé.

Cordialement,
L'équipe Mon Savon Vert
      `
    };

    console.log('📧 Configuration email préparée, tentative d\'envoi...');
    console.log('📧 From:', mailOptions.from);
    console.log('📧 To:', mailOptions.to);
    console.log('📧 Subject:', mailOptions.subject);
    
    // Envoi de l'email avec plus de logs
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ ===== EMAIL ENVOYÉ AVEC SUCCÈS =====');
    console.log('✉️ Message ID:', info.messageId);
    console.log('✉️ Response:', info.response);
    console.log('✉️ Envelope:', info.envelope);
    console.log('✉️ Accepted:', info.accepted);
    console.log('✉️ Rejected:', info.rejected);
    console.log('✉️ Pending:', info.pending);
    
    return info;
  } catch (error) {
    console.error('❌ ===== ERREUR ENVOI EMAIL =====');
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Code d\'erreur:', error.code);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Email destinataire:', customer?.email || 'INCONNU');
    console.error('❌ Variables d\'env configurées:');
    console.error('   - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'PRÉSENTE' : 'MANQUANTE');
    console.error('   - SENDER_EMAIL:', process.env.SENDER_EMAIL ? process.env.SENDER_EMAIL : 'MANQUANTE');
    
    // NOUVEAU : Logger les détails spécifiques SendGrid
    if (error.response) {
      console.error('❌ Réponse du serveur SMTP:', error.response);
    }
    if (error.responseCode) {
      console.error('❌ Code de réponse SMTP:', error.responseCode);
    }
    
    throw error;
  }
};

// Fonction pour tester la configuration email
const testEmailConfiguration = async () => {
  try {
    console.log('🔄 ===== TEST CONFIGURATION EMAIL =====');
    
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY n\'est pas définie dans les variables d\'environnement');
    }
    
    if (!process.env.SENDER_EMAIL) {
      throw new Error('SENDER_EMAIL n\'est pas définie dans les variables d\'environnement');
    }
    
    console.log('✅ Variables d\'environnement présentes');
    console.log('📧 Sender email:', process.env.SENDER_EMAIL);
    
    // Tester la connexion à SendGrid
    await transporter.verify();
    console.log('✅ Configuration email correcte. SendGrid est accessible.');
    console.log('✅ ===== CONFIGURATION EMAIL OK =====');
    
    return true;
  } catch (error) {
    console.error('❌ ===== ERREUR CONFIGURATION EMAIL =====');
    console.error('❌ Erreur de configuration email:', error.message);
    console.error('❌ Vérifiez votre fichier .env');
    return false;
  }
};

// Exécuter le test au démarrage du serveur
testEmailConfiguration();

module.exports = { 
  sendOrderConfirmation,
  testEmailConfiguration
};