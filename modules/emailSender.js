// backend/modules/emailSender.js
// Migration complète vers Mailjet + NOTIFICATION ADMIN - VERSION FINALE CORRIGÉE + CONTACT FORM
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
 * Fonction utilitaire pour générer un numéro de commande lisible
 */
const generateOrderNumber = (orderId) => {
  if (!orderId) return 'CMD-INCONNU';
  
  // Prendre les 8 derniers caractères de l'ObjectId et les mettre en majuscules
  const shortId = orderId.toString().slice(-8).toUpperCase();
  return `CMD-${shortId}`;
};

/**
 * NOUVELLE FONCTION : Récupération de l'adresse complète du client
 */
const getCompleteCustomerAddress = (customer) => {
  console.log('🏠 Récupération de l\'adresse pour:', customer);
  
  // Essayer d'abord le format User (avec tableau addresses)
  if (customer.addresses && customer.addresses.length > 0) {
    const addr = customer.addresses[0];
    return {
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      street: addr.street || '',
      postalCode: addr.postalCode || '',
      city: addr.city || '',
      country: addr.country || 'France',
      phone: customer.phone || ''
    };
  }
  
  // Ensuite le format Customer (champs séparés)
  if (customer.address && customer.city && customer.postalCode) {
    return {
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      street: customer.address,
      postalCode: customer.postalCode,
      city: customer.city,
      country: customer.country || 'France',
      phone: customer.phone || ''
    };
  }
  
  // Fallback avec ce qu'on a
  return {
    name: customer.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : 'Client',
    street: customer.address || 'Adresse non disponible',
    postalCode: customer.postalCode || '',
    city: customer.city || '',
    country: customer.country || 'France',
    phone: customer.phone || ''
  };
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
      .request(emailData);
    
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
 * Fonction pour envoyer l'email de confirmation de commande au CLIENT
 * VERSION CORRIGÉE FINALE - Avec adresse complète et méthode de livraison
 */
const sendOrderConfirmation = async (customer, order) => {
  try {
    console.log('\n💼 === PRÉPARATION EMAIL COMMANDE CLIENT ===');
    console.log('💼 Client:', customer.email);
    console.log('💼 Order ID:', order._id);
    console.log('💼 Montant:', order.totalAmount);
    console.log('💼 Données client reçues:', JSON.stringify(customer, null, 2));
    
    // Validation des données d'entrée - CORRIGÉE
    if (!customer || !customer.email) {
      throw new Error('❌ Données client manquantes ou email invalide');
    }
    
    if (!order || !order._id) {
      throw new Error('❌ Données de commande manquantes - Order ID requis');
    }
    
    // Récupérer l'adresse complète du client
    const customerAddress = getCompleteCustomerAddress(customer);
    console.log('🏠 Adresse récupérée:', customerAddress);
    
    // Générer un numéro de commande lisible à partir de l'_id
    const orderNumber = generateOrderNumber(order._id);
    console.log('💼 Numéro de commande généré:', orderNumber);
    
    // Construction de la liste des produits - CORRIGÉE pour utiliser order.items
    let productsList = '';
    if (order.items && order.items.length > 0) {
      productsList = order.items.map(item => {
        const productName = item.name || 'Produit sans nom';
        const productPrice = item.price ? `${item.price.toFixed(2)}€` : 'Prix non disponible';
        const productQuantity = item.quantity || 1;
        
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
              MON SAVON VERT
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
                Merci pour votre confiance !
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
                  <span style="font-weight: bold; color: #1b5e20; font-size: 16px;">#${orderNumber}</span>
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
                Total de votre commande : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
              </h3>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">
                TVA & Livraison incluse
              </p>
            </div>
            
            <!-- NOUVELLE SECTION : Informations de livraison avec adresse complète et méthode -->
            <div style="background: #e8f5e8; border-radius: 15px; padding: 30px; margin-bottom: 35px; border-left: 5px solid #1b5e20;">
              <h3 style="margin: 0 0 20px 0; color: #1b5e20; font-size: 20px; font-weight: bold;">
                Informations de livraison
              </h3>
              
              <!-- Adresse de livraison -->
              <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c8e6c9;">
                <h4 style="margin: 0 0 10px 0; color: #1b5e20; font-size: 16px;">Adresse de livraison :</h4>
                <p style="margin: 0; color: #2e7d32; line-height: 1.6; font-weight: 500;">
                  ${customerAddress.name}<br>
                  ${customerAddress.street}<br>
                  ${customerAddress.postalCode} ${customerAddress.city}<br>
                  ${customerAddress.country}
                  ${customerAddress.phone ? `<br>${customerAddress.phone}` : ''}
                </p>
              </div>
              
              <!-- Méthode de livraison -->
              <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c8e6c9;">
                <h4 style="margin: 0 0 10px 0; color: #1b5e20; font-size: 16px;">Mode de livraison :</h4>
                ${order.shippingMethod === 'pickup' ? `
                  <div style="color: #2e7d32; font-weight: 600;">
                    <strong>Remise en main propre</strong><br>
                    <span style="font-size: 14px; opacity: 0.8;">Nous vous contacterons pour organiser la récupération</span>
                  </div>
                ` : order.shippingMethod === 'express' ? `
                  <div style="color: #2e7d32; font-weight: 600;">
                    <strong>Livraison express</strong><br>
                    <span style="font-size: 14px; opacity: 0.8;">Livraison en 24-48h ouvrées</span>
                  </div>
                ` : `
                  <div style="color: #2e7d32; font-weight: 600;">
                    <strong>Livraison standard</strong><br>
                    <span style="font-size: 14px; opacity: 0.8;">Livraison en 2-5 jours ouvrées</span>
                  </div>
                `}
              </div>
              
              <div style="color: #2e7d32; line-height: 1.8;">
                <p style="margin: 0 0 10px 0;"><strong>Préparation :</strong> Votre commande sera préparée et envoyé avec soin sous 24h ouvrées</p>
                ${order.shippingMethod !== 'pickup' ? `<p style="margin: 0 0 10px 0;"><strong>Expédition :</strong> Vous recevrez un email de confirmation d'expédition avec numéro de suivi</p>` : ''}
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
                  contact@monsavonvert.com
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
              Merci de faire confiance à Mon Savon Vert !
            </h4>
            <p style="margin: 0 0 20px 0; color: #a5d6a7; font-size: 16px; line-height: 1.6;">
              Des savons artisanaux et naturels pour prendre soin de vous et de notre planète
            </p>
            <div style="border-top: 1px solid #388e3c; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0; color: #c8e6c9; font-size: 14px;">
                100% naturel • Emballage recyclable • Non testé sur les animaux
              </p>
              <p style="margin: 10px 0 0 0; color: #81c784; font-size: 12px;">
                Mon Savon Vert © 2025
              </p>
            </div>
          </div>
          
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email avec adresse et méthode de livraison
    const textContent = `
      MON SAVON VERT - Confirmation de commande
      
      DÉTAILS DE VOTRE COMMANDE :
      - Numéro : ${orderNumber}
      - Date : ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}
      - Email : ${customer.email}
      - Total : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
      
      ADRESSE DE LIVRAISON :
      ${customerAddress.name}
      ${customerAddress.street}
      ${customerAddress.postalCode} ${customerAddress.city}
      ${customerAddress.country}
      ${customerAddress.phone ? `Tel: ${customerAddress.phone}` : ''}
      
      MODE DE LIVRAISON :
      ${order.shippingMethod === 'pickup' ? 
        'Remise en main propre - Nous vous contacterons pour organiser la récupération' :
        order.shippingMethod === 'express' ?
        'Livraison express - Livraison en 24-48h ouvrées' :
        'Livraison standard - Livraison en 2-5 jours ouvrées'
      }
      
      ${order.shippingMethod !== 'pickup' ? 'Vous recevrez un email de confirmation d\'expédition avec numéro de suivi.' : ''}
      
      Besoin d'aide ? Contactez-nous : contact@monsavonvert.com
      
      Merci de votre confiance !
      L'équipe Mon Savon Vert
    `;
    
    console.log('💼 Template email client préparé');
    
    // Envoi via Mailjet
    const result = await sendEmailViaMailjet({
      to: customer.email,
      subject: `✅ Commande confirmée #${orderNumber} - Mon Savon Vert`,
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'Mon Savon Vert'
    });
    
    console.log('💼 === EMAIL COMMANDE CLIENT ENVOYÉ ===\n');
    return result;
    
  } catch (error) {
    console.error('❌ === ERREUR EMAIL COMMANDE CLIENT ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Client concerné:', customer?.email || 'Email non disponible');
    console.error('❌ Commande concernée:', order?._id || 'ID non disponible');
    console.error('=== FIN ERREUR EMAIL COMMANDE CLIENT ===\n');
    throw error;
  }
};

/**
 * NOUVELLE FONCTION : Notification ADMIN pour chaque nouvelle commande
 * VERSION CORRIGÉE FINALE - Avec adresse complète et méthode de livraison
 */
const sendOrderNotificationToAdmin = async (customer, order) => {
  try {
    console.log('\n🚨 === PRÉPARATION NOTIFICATION ADMIN ===');
    console.log('🚨 Nouvelle commande de:', customer.email);
    console.log('🚨 Order ID:', order._id);
    console.log('🚨 Montant:', order.totalAmount);
    console.log('🚨 Notification vers: contact@monsavonvert.com');
    
    // Validation des données d'entrée - CORRIGÉE
    if (!customer || !customer.email) {
      throw new Error('❌ Données client manquantes ou email invalide');
    }
    
    if (!order || !order._id) {
      throw new Error('❌ Données de commande manquantes - Order ID requis');
    }
    
    // Générer un numéro de commande lisible à partir de l'_id
    const orderNumber = generateOrderNumber(order._id);
    console.log('🚨 Numéro de commande généré:', orderNumber);
    
    // Récupérer l'adresse complète du client pour l'admin
    const customerAddress = getCompleteCustomerAddress(customer);
    console.log('🏠 Adresse admin récupérée:', customerAddress);
    
    // Récupération de la méthode de livraison
    let shippingMethodText = '';
    if (order.shippingMethod === 'pickup') {
      shippingMethodText = `
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4caf50;">
          <p style="margin: 0; color: #2e7d32; font-weight: 600;">
            🏪 <strong>Remise en main propre</strong><br>
            <span style="font-size: 14px; opacity: 0.8;">Le client viendra récupérer sa commande</span>
          </p>
        </div>
      `;
    } else if (order.shippingMethod === 'express') {
      shippingMethodText = `
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; color: #ef6c00; font-weight: 600;">
            ⚡ <strong>Livraison express</strong><br>
            <span style="font-size: 14px; opacity: 0.8;">Livraison en 24-48h</span>
          </p>
        </div>
      `;
    } else {
      shippingMethodText = `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #1976d2;">
          <p style="margin: 0; color: #1565c0; font-weight: 600;">
            📦 <strong>Livraison standard</strong><br>
            <span style="font-size: 14px; opacity: 0.8;">Livraison en 2-5 jours ouvrés</span>
          </p>
        </div>
      `;
    }
    
    // Construction de la liste des produits pour l'admin - CORRIGÉE
    let adminProductsList = '';
    if (order.items && order.items.length > 0) {
      adminProductsList = order.items.map(item => {
        const productName = item.name || 'Produit sans nom';
        const productPrice = item.price ? `${item.price.toFixed(2)}€` : 'Prix non disponible';
        const productQuantity = item.quantity || 1;
        const productTotal = item.price && item.quantity ? `${(item.price * item.quantity).toFixed(2)}€` : 'Total non calculable';
        
        return `
          <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e8f5e8; font-weight: 500; color: #333;">
              ${productName}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e8f5e8; text-align: center; font-weight: 500; color: #333;">
              ${productQuantity}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e8f5e8; text-align: right; font-weight: 500; color: #333;">
              ${productPrice}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e8f5e8; text-align: right; font-weight: 600; color: #d32f2f;">
              ${productTotal}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      adminProductsList = `
        <tr>
          <td colspan="4" style="padding: 30px; text-align: center; color: #666; font-style: italic;">
            ⚠️ Aucun produit trouvé dans cette commande
          </td>
        </tr>
      `;
    }
    
    const shippingInfo = `
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;">📦 Adresse de livraison :</h4>
        <p style="margin: 0 0 15px 0; color: #555; line-height: 1.6;">
          ${customerAddress.name}<br>
          ${customerAddress.street}<br>
          ${customerAddress.postalCode} ${customerAddress.city}<br>
          ${customerAddress.country}
          ${customerAddress.phone ? `<br>📱 ${customerAddress.phone}` : ''}
        </p>
        <h4 style="margin: 15px 0 10px 0; color: #1976d2; font-size: 16px;">🚚 Méthode de livraison :</h4>
        ${shippingMethodText}
      </div>
    `;
    
    // Template HTML pour l'admin - Style professionnel
    const adminHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚨 NOUVELLE COMMANDE - Mon Savon Vert Admin</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        
        <!-- Container principal -->
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- BANNIÈRE ALERTE ADMIN -->
          <div style="width: 100%; background: linear-gradient(135deg, #d32f2f, #f44336); padding: 30px 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
              🚨 NOUVELLE COMMANDE
            </h1>
            <p style="margin: 10px 0 0 0; color: #ffcdd2; font-size: 16px; font-weight: 500;">
              Notification Admin • Mon Savon Vert
            </p>
          </div>
          
          <!-- CONTENU ADMIN -->
          <div style="padding: 40px 30px;">
            
            <!-- Alerte urgente -->
            <div style="background: linear-gradient(135deg, #fff3e0, #ffe0b2); border: 3px solid #ff9800; border-radius: 15px; padding: 25px; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; color: #e65100; font-size: 24px; font-weight: bold;">
                💰 Commande #${orderNumber} reçue !
              </h2>
              <p style="margin: 0; color: #bf360c; font-size: 18px; font-weight: 600;">
                Montant total : <span style="background: #ff9800; color: white; padding: 5px 10px; border-radius: 5px; font-size: 20px;">${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€</span>
              </p>
              <p style="margin: 15px 0 0 0; color: #ef6c00; font-size: 14px;">
                📅 Commande passée le ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')} à ${new Date(order.createdAt || Date.now()).toLocaleTimeString('fr-FR')}
              </p>
            </div>
            
            <!-- Informations client -->
            <div style="background: #ffffff; border: 2px solid #1976d2; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #1976d2; font-size: 20px; font-weight: bold; border-bottom: 2px solid #e3f2fd; padding-bottom: 10px;">
                👤 Informations du client
              </h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">📧 Email :</span>
                  <span style="color: #1976d2; font-weight: 600;">${customer.email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">👤 Nom :</span>
                  <span style="color: #333;">${customer.firstName || 'Non renseigné'} ${customer.lastName || ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">📱 Téléphone :</span>
                  <span style="color: #333;">${customer.phone || 'Non renseigné'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="font-weight: 600; color: #555;">🆔 Client ID :</span>
                  <span style="color: #666; font-family: monospace; font-size: 12px;">${customer._id || 'Non disponible'}</span>
                </div>
              </div>
            </div>
            
            <!-- Informations de livraison AVEC ADRESSE COMPLÈTE -->
            <div style="background: #ffffff; border: 2px solid #4caf50; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #4caf50; font-size: 20px; font-weight: bold; border-bottom: 2px solid #e8f5e8; padding-bottom: 10px;">
                🚚 Informations de livraison
              </h3>
              ${shippingInfo}
            </div>
            
            <!-- Détails de la commande -->
            <div style="background: #ffffff; border: 2px solid #ff9800; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #ff9800; font-size: 20px; font-weight: bold; border-bottom: 2px solid #fff3e0; padding-bottom: 10px;">
                📋 Détails de la commande
              </h3>
              <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">📦 Numéro :</span>
                  <span style="font-weight: bold; color: #ff9800; font-size: 16px;">#${orderNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">📅 Date :</span>
                  <span style="color: #333;">${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">⏰ Heure :</span>
                  <span style="color: #333;">${new Date(order.createdAt || Date.now()).toLocaleTimeString('fr-FR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                  <span style="font-weight: 600; color: #555;">🆔 Commande ID :</span>
                  <span style="color: #666; font-family: monospace; font-size: 12px;">${order._id || 'Non disponible'}</span>
                </div>
              </div>
            </div>
            
            <!-- Liste des produits commandés -->
            <div style="background: #ffffff; border: 2px solid #9c27b0; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #9c27b0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #f3e5f5; padding-bottom: 10px;">
                🛒 Produits commandés
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #9c27b0;">
                    <th style="padding: 15px 12px; text-align: left; color: white; font-weight: bold; font-size: 14px;">Produit</th>
                    <th style="padding: 15px 12px; text-align: center; color: white; font-weight: bold; font-size: 14px;">Qté</th>
                    <th style="padding: 15px 12px; text-align: right; color: white; font-weight: bold; font-size: 14px;">Prix unitaire</th>
                    <th style="padding: 15px 12px; text-align: right; color: white; font-weight: bold; font-size: 14px;">Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  ${adminProductsList}
                </tbody>
              </table>
            </div>
            
            <!-- Total et actions à prendre -->
            <div style="background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; font-size: 26px; font-weight: bold;">
                💰 TOTAL COMMANDE : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
              </h3>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">
                TVA incluse • Prêt pour préparation et expédition
              </p>
            </div>
            
            <!-- Actions à prendre -->
            <div style="background: #e3f2fd; border: 2px solid #1976d2; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #1976d2; font-size: 20px; font-weight: bold;">
                ✅ Actions à prendre
              </h3>
              <div style="color: #0d47a1; line-height: 1.8;">
                <p style="margin: 0 0 12px 0;">📦 <strong>1. Vérifier les stocks</strong> des produits commandés</p>
                <p style="margin: 0 0 12px 0;">🏷️ <strong>2. Préparer les étiquettes</strong> d'expédition ${order.shippingMethod === 'pickup' ? '(pas nécessaire pour remise en main propre)' : ''}</p>
                <p style="margin: 0 0 12px 0;">📋 <strong>3. Organiser la préparation</strong> de la commande</p>
                <p style="margin: 0 0 12px 0;">📧 <strong>4. ${order.shippingMethod === 'pickup' ? 'Contacter le client pour organiser la récupération' : 'Prévoir l\'envoi du suivi au client'}</strong></p>
                <p style="margin: 0;">💼 <strong>5. Mettre à jour</strong> le système de gestion</p>
              </div>
            </div>
            
            <!-- Contact client si besoin -->
            <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 15px; padding: 25px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: #e65100; font-size: 18px; font-weight: bold;">
                📞 Contact client direct
              </h3>
              <p style="margin: 0 0 15px 0; color: #bf360c; line-height: 1.6;">
                Si vous devez contacter le client pour cette commande
              </p>
              <div style="background: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; font-weight: bold; color: #e65100; font-size: 16px;">
                  📧 ${customer.email}
                </p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                  ${customer.phone ? `📱 ${customer.phone}` : '📱 Téléphone non renseigné'}
                </p>
              </div>
            </div>
            
          </div>
          
          <!-- BANNIÈRE INFÉRIEURE ADMIN -->
          <div style="width: 100%; background-color: #424242; padding: 30px 20px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: white; font-size: 18px; font-weight: bold;">
              Mon Savon Vert - Administration
            </h4>
            <p style="margin: 0; color: #bdbdbd; font-size: 14px;">
              Email automatique • Traitement immédiat requis • ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
          
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte pour l'admin
    const adminTextContent = `
      🚨 NOUVELLE COMMANDE - MON SAVON VERT
      
      ⚠️  NOTIFICATION ADMIN ⚠️
      
      Une nouvelle commande vient d'être passée sur votre site !
      
      === DÉTAILS DE LA COMMANDE ===
      📦 Numéro : ${orderNumber}
      📅 Date : ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}
      ⏰ Heure : ${new Date(order.createdAt || Date.now()).toLocaleTimeString('fr-FR')}
      💰 Montant total : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
      
      === INFORMATIONS CLIENT ===
      📧 Email : ${customer.email}
      👤 Nom : ${customer.firstName || 'Non renseigné'} ${customer.lastName || ''}
      📱 Téléphone : ${customer.phone || 'Non renseigné'}
      
      === ADRESSE DE LIVRAISON ===
      ${customerAddress.name}
      ${customerAddress.street}
      ${customerAddress.postalCode} ${customerAddress.city}
      ${customerAddress.country}
      ${customerAddress.phone ? `Tel: ${customerAddress.phone}` : ''}
      
      === MODE DE LIVRAISON ===
      ${order.shippingMethod === 'pickup' ? 
        '🏪 Remise en main propre - Contacter le client pour organiser la récupération' :
        order.shippingMethod === 'express' ?
        '⚡ Livraison express - Livraison en 24-48h' :
        '📦 Livraison standard - Livraison en 2-5 jours ouvrés'
      }
      
      === ACTIONS À PRENDRE ===
      1. Vérifier les stocks
      2. Préparer les étiquettes ${order.shippingMethod === 'pickup' ? '(pas nécessaire pour remise en main propre)' : ''}
      3. Organiser la préparation
      4. ${order.shippingMethod === 'pickup' ? 'Contacter le client pour organiser la récupération' : 'Prévoir l\'envoi du suivi'}
      5. Mettre à jour le système
      
      Cette commande nécessite un traitement rapide !
      
      --
      Mon Savon Vert Administration
      Email automatique généré le ${new Date().toLocaleString('fr-FR')}
    `;
    
    console.log('🚨 Template notification admin préparé');
    
    // Envoi de la notification admin vers contact@monsavonvert.com
    const adminResult = await sendEmailViaMailjet({
      to: 'contact@monsavonvert.com',
      subject: `🚨 NOUVELLE COMMANDE #${orderNumber} - ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€ - ${customer.email}`,
      htmlContent: adminHtmlContent,
      textContent: adminTextContent,
      fromName: 'Mon Savon Vert'
    });
    
    console.log('🚨 === NOTIFICATION ADMIN ENVOYÉE ===\n');
    return adminResult;
    
  } catch (error) {
    console.error('❌ === ERREUR NOTIFICATION ADMIN ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Client concerné:', customer?.email || 'Email non disponible');
    console.error('❌ Commande concernée:', order?._id || 'ID non disponible');
    console.error('❌ Admin email: contact@monsavonvert.com');
    console.error('=== FIN ERREUR NOTIFICATION ADMIN ===\n');
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
              MON SAVON VERT
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
                Réinitialisation demandée
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
                <p style="margin: 0 0 15px 0;">🕐 <strong>Durée de validité :</strong> Ce lien expire dans exactement 10 minutes</p>
                <p style="margin: 0 0 15px 0;">🔒 <strong>Sécurité :</strong> Ne partagez jamais ce lien avec personne</p>
                <p style="margin: 0 0 15px 0;">❌ <strong>Demande non autorisée :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</p>
                <p style="margin: 0;">🛡️ <strong>Protection :</strong> Votre compte reste sécurisé tant que vous ne cliquez pas sur le lien</p>
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
              Sécurité et confidentialité
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
      fromName: 'Mon Savon Vert'
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

/**
 * NOUVELLE FONCTION : Envoyer un email quand quelqu'un remplit le formulaire de contact
 */
const sendContactFormEmail = async (contactData) => {
  try {
    console.log('\n📞 === PRÉPARATION EMAIL FORMULAIRE CONTACT ===');
    console.log('📞 Nom du client:', contactData.name);
    console.log('📞 Email du client:', contactData.email);
    console.log('📞 Sujet:', contactData.subject);
    console.log('📞 Message reçu');
    
    // Validation des données d'entrée
    if (!contactData || !contactData.email || !contactData.name || !contactData.message) {
      throw new Error('❌ Données de contact manquantes - nom, email et message requis');
    }
    
    // Convertir le sujet en texte lisible
    const subjectLabels = {
      'information': 'Demande d\'information',
      'order': 'Question sur une commande',
      'wholesale': 'Partenariat commercial',
      'custom': 'Commande personnalisée',
      'other': 'Autre demande'
    };
    
    const readableSubject = subjectLabels[contactData.subject] || 'Demande d\'information';
    
    // Template HTML pour l'email que TU vas recevoir
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>📞 Nouveau message de contact - Mon Savon Vert</title>
      </head>
      <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        
        <!-- Container principal -->
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- BANNIÈRE SUPÉRIEURE -->
          <div style="width: 100%; background: linear-gradient(135deg, #1976d2, #2196f3); padding: 30px 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
              📞 NOUVEAU MESSAGE DE CONTACT
            </h1>
            <p style="margin: 10px 0 0 0; color: #bbdefb; font-size: 16px; font-weight: 500;">
              Un client a rempli le formulaire sur votre site
            </p>
          </div>
          
          <!-- CONTENU PRINCIPAL -->
          <div style="padding: 40px 30px;">
            
            <!-- Alerte nouveau message -->
            <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 3px solid #1976d2; border-radius: 15px; padding: 25px; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; color: #0d47a1; font-size: 24px; font-weight: bold;">
                📧 Nouveau message reçu !
              </h2>
              <p style="margin: 0; color: #1565c0; font-size: 16px; font-weight: 500;">
                Un client souhaite vous contacter via le formulaire de votre site web
              </p>
              <p style="margin: 10px 0 0 0; color: #1976d2; font-size: 14px;">
                📅 Reçu le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
              </p>
            </div>
            
            <!-- Informations du client -->
            <div style="background: #ffffff; border: 2px solid #4caf50; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #4caf50; font-size: 20px; font-weight: bold; border-bottom: 2px solid #e8f5e8; padding-bottom: 10px;">
                👤 Informations du client
              </h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">👤 Nom :</span>
                  <span style="color: #4caf50; font-weight: 600; font-size: 16px;">${contactData.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="font-weight: 600; color: #555;">📧 Email :</span>
                  <span style="color: #1976d2; font-weight: 600; font-size: 16px;">
                    <a href="mailto:${contactData.email}" style="color: #1976d2; text-decoration: none;">${contactData.email}</a>
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                  <span style="font-weight: 600; color: #555;">📋 Sujet :</span>
                  <span style="color: #ff9800; font-weight: 600; font-size: 16px;">${readableSubject}</span>
                </div>
              </div>
            </div>
            
            <!-- Message du client -->
            <div style="background: #ffffff; border: 2px solid #ff9800; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #ff9800; font-size: 20px; font-weight: bold; border-bottom: 2px solid #fff3e0; padding-bottom: 10px;">
                💬 Message du client
              </h3>
              <div style="background: #fafafa; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #424242; line-height: 1.8; font-size: 16px;">
                  ${contactData.message.replace(/\n/g, '<br>')}
                </p>
              </div>
            </div>
            
            <!-- Action à prendre -->
            <div style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 25px; border-radius: 15px; text-align: center; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">
                ✉️ Répondre au client
              </h3>
              <p style="margin: 0 0 20px 0; opacity: 0.9; font-size: 16px;">
                Cliquez sur le bouton ci-dessous pour répondre directement par email
              </p>
              <a href="mailto:${contactData.email}?subject=Re: ${readableSubject} - Mon Savon Vert&body=Bonjour ${contactData.name},%0A%0AMerci pour votre message concernant: ${readableSubject}%0A%0A[Votre réponse ici]%0A%0ACordialement,%0AL'équipe Mon Savon Vert" 
                 style="display: inline-block; background: #ffffff; color: #4caf50; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                📧 Répondre maintenant
              </a>
            </div>
            
            <!-- Récapitulatif -->
            <div style="background: #f5f5f5; border: 2px solid #9e9e9e; border-radius: 15px; padding: 25px; text-align: center;">
              <h3 style="margin: 0 0 15px 0; color: #424242; font-size: 18px; font-weight: bold;">
                📊 Récapitulatif du contact
              </h3>
              <div style="color: #666; line-height: 1.8;">
                <p style="margin: 0 0 10px 0;">📅 <strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                <p style="margin: 0 0 10px 0;">⏰ <strong>Heure :</strong> ${new Date().toLocaleTimeString('fr-FR')}</p>
                <p style="margin: 0 0 10px 0;">🌐 <strong>Source :</strong> Formulaire de contact du site web</p>
                <p style="margin: 0;">⭐ <strong>Priorité :</strong> ${contactData.subject === 'order' ? 'Haute (commande)' : contactData.subject === 'wholesale' ? 'Haute (partenariat)' : 'Normale'}</p>
              </div>
            </div>
            
          </div>
          
          <!-- BANNIÈRE INFÉRIEURE -->
          <div style="width: 100%; background-color: #424242; padding: 30px 20px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: white; font-size: 18px; font-weight: bold;">
              Mon Savon Vert - Administration
            </h4>
            <p style="margin: 0; color: #bdbdbd; font-size: 14px;">
              Email automatique • Nouveau message de contact • ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
          
        </div>
        
      </body>
      </html>
    `;
    
    // Version texte de l'email
    const textContent = `
      NOUVEAU MESSAGE DE CONTACT - MON SAVON VERT
      
      Un client a rempli le formulaire de contact sur votre site !
      
      === INFORMATIONS DU CLIENT ===
      👤 Nom : ${contactData.name}
      📧 Email : ${contactData.email}
      📋 Sujet : ${readableSubject}
      
      === MESSAGE DU CLIENT ===
      ${contactData.message}
      
      === INFORMATIONS ===
      📅 Date : ${new Date().toLocaleDateString('fr-FR')}
      ⏰ Heure : ${new Date().toLocaleTimeString('fr-FR')}
      🌐 Source : Formulaire de contact du site web
      
      Pour répondre au client, utilisez son adresse email : ${contactData.email}
      
      --
      Mon Savon Vert Administration
      Email automatique généré le ${new Date().toLocaleString('fr-FR')}
    `;
    
    console.log('📞 Template email de contact préparé');
    
    // Envoi de l'email via Mailjet vers TON adresse
    const result = await sendEmailViaMailjet({
      to: 'contact@monsavonvert.com', // TON adresse email
      subject: `📞 Nouveau message de ${contactData.name} - ${readableSubject}`,
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'Mon Savon Vert'
    });
    
    console.log('📞 === EMAIL DE CONTACT ENVOYÉ ===\n');
    return result;
    
  } catch (error) {
    console.error('❌ === ERREUR EMAIL FORMULAIRE CONTACT ===');
    console.error('❌ Erreur:', error.message);
    console.error('❌ Client concerné:', contactData?.email || 'Email non disponible');
    console.error('❌ Nom du client:', contactData?.name || 'Nom non disponible');
    console.error('=== FIN ERREUR EMAIL CONTACT ===\n');
    throw error;
  }
};

// Export des fonctions pour utilisation dans vos routes
module.exports = {
  sendOrderConfirmation,
  sendOrderNotificationToAdmin,  // NOUVELLE FONCTION AJOUTÉE
  sendPasswordResetEmail,
  sendContactFormEmail,         // NOUVELLE FONCTION CONTACT AJOUTÉE
  testMailjetConnection,
  sendEmailViaMailjet
};