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
  }
});

/**
 * Envoie un email de confirmation de commande
 * @param {Object} customer - Données du client (email, nom, etc.)
 * @param {Object} order - Données de la commande (items, total, etc.)
 * @returns {Promise} - Promesse résolue quand l'email est envoyé
 */
const sendOrderConfirmation = async (customer, order) => {
  try {
    console.log('📧 Préparation de l\'email pour:', customer.email);
    
    // Vérification que l'email existe
    if (!customer.email) {
      throw new Error('Email du client manquant');
    }
    
    // Format des produits pour l'email - Simplifié pour éviter les filtres anti-spam
    const productsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} €</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>
    `).join('');

    // Création du contenu de l'email - Version simplifiée pour éviter les filtres anti-spam
    const mailOptions = {
      from: {
        name: 'Mon Savon Vert',
        address: process.env.SENDER_EMAIL
      },
      to: customer.email,
      subject: `Confirmation de votre commande #${order._id}`,
      // En-têtes supplémentaires pour améliorer la livraison
      headers: {
        'X-Priority': '1', // Priorité haute
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
            <h1 style="color: white;">Confirmation de commande</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2>Merci pour votre commande, ${customer.firstName} !</h2>
            <p>Nous avons bien reçu votre paiement et votre commande #${order._id} est maintenant confirmée.</p>
            
            <h3>Articles commandés</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: center;">Quantité</th>
                <th style="padding: 10px; text-align: right;">Prix</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
              ${productsHtml}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total :</strong></td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${order.totalAmount.toFixed(2)} €</td>
              </tr>
            </table>
            
            <p style="margin-top: 20px;">Cordialement,<br>L'équipe Mon Savon Vert</p>
          </div>
        </div>
      `,
      // Toujours inclure une version texte pour améliorer la livraison
      text: `
        CONFIRMATION DE COMMANDE
        
        Merci pour votre commande, ${customer.firstName} !
        
        Nous avons bien reçu votre paiement et votre commande #${order._id} est maintenant confirmée.
        
        Total de la commande: ${order.totalAmount.toFixed(2)} €
        
        Cordialement,
        L'équipe Mon Savon Vert
      `
    };

    console.log('📧 Tentative d\'envoi de l\'email...');
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Email de confirmation envoyé avec succès:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    throw error;
  }
};

// Fonction pour tester la configuration email
const testEmailConfiguration = async () => {
  try {
    console.log('🔄 Test de la configuration email...');
    
    // Tester que les variables d'environnement sont correctement définies
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY n\'est pas définie dans les variables d\'environnement');
    }
    
    if (!process.env.SENDER_EMAIL) {
      throw new Error('SENDER_EMAIL n\'est pas définie dans les variables d\'environnement');
    }
    
    // Tester la connexion à SendGrid
    await transporter.verify();
    console.log('✅ Configuration email correcte. SendGrid est accessible.');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error.message);
    return false;
  }
};

// Exécuter le test au démarrage du serveur
testEmailConfiguration();

// Exporter les fonctions
module.exports = { 
  sendOrderConfirmation,
  testEmailConfiguration
};