// backend/modules/emailSender.js
// Migration complète vers Mailjet avec NOUVEAU STYLE PROFESSIONNEL
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
 * STYLE COMPLETEMENT REFAIT - Logique identique
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
            <td style="padding: 15px; border-bottom: 1px solid #e8e8e8; font-size: 14px; color: #333;">
              ${productName}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e8e8e8; text-align: center; font-size: 14px; color: #666;">
              ${productQuantity}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e8e8e8; text-align: right; font-size: 14px; color: #1b5e20; font-weight: 600;">
              ${productPrice}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      productsList = `
        <tr>
          <td colspan="3" style="padding: 30px; text-align: center; color: #999; font-style: italic;">
            Aucun produit trouvé dans cette commande
          </td>
        </tr>
      `;
    }
    
    // NOUVEAU TEMPLATE HTML PROFESSIONNEL
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande - Mon Savon Vert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        
        <!-- BANNIÈRE SUPÉRIEURE -->
        <div style="width: 100%; background-color: #1b5e20; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">
              MON SAVON VERT
            </h1>
            <p style="color: #a5d6a7; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
              Savons naturels & écologiques
            </p>
          </div>
        </div>
        
        <!-- CONTENU PRINCIPAL -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Message de confirmation -->
          <div style="padding: 50px 40px 30px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #e8f5e9; border-radius: 50%; line-height: 80px; margin-bottom: 20px;">
                <span style="font-size: 40px;">✓</span>
              </div>
              <h2 style="color: #1b5e20; margin: 0 0 10px 0; font-size: 28px; font-weight: 400;">
                Commande confirmée
              </h2>
              <p style="color: #666; margin: 0; font-size: 16px;">
                Merci pour votre confiance ${customer.firstName || ''}!
              </p>
            </div>
            
            <!-- Informations de la commande -->
            <div style="background-color: #fafafa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; font-weight: 500; border-bottom: 2px solid #1b5e20; padding-bottom: 10px;">
                Détails de la commande
              </h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Numéro de commande :</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600; text-align: right;">#${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Date :</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Email :</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${customer.email}</td>
                </tr>
              </table>
            </div>
            
            <!-- Tableau des produits -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">
                Récapitulatif des produits
              </h3>
              <table style="width: 100%; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background-color: #f8f8f8;">
                    <th style="padding: 15px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Produit
                    </th>
                    <th style="padding: 15px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Quantité
                    </th>
                    <th style="padding: 15px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Prix
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${productsList}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 20px 15px; border-top: 2px solid #1b5e20; text-align: right; font-size: 18px; color: #333; font-weight: 500;">
                      Total :
                    </td>
                    <td style="padding: 20px 15px; border-top: 2px solid #1b5e20; text-align: right; font-size: 20px; color: #1b5e20; font-weight: 700;">
                      ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}€
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <!-- Informations de livraison -->
            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 8px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #1b5e20;">
              <h3 style="color: #1b5e20; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                📦 Informations de livraison
              </h3>
              <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                Votre commande sera préparée avec soin et expédiée sous <strong>24-48h ouvrées</strong>.
              </p>
              <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                Un email de confirmation avec le numéro de suivi vous sera envoyé dès l'expédition.
              </p>
            </div>
            
          </div>
        </div>
        
        <!-- BANNIÈRE INFÉRIEURE -->
        <div style="width: 100%; background-color: #1b5e20; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            
            <!-- Contact -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">
                BESOIN D'AIDE ?
              </h3>
              <p style="color: #a5d6a7; margin: 0 0 10px 0; font-size: 14px;">
                Notre équipe est à votre disposition
              </p>
              <p style="margin: 15px 0;">
                <a href="mailto:contact@monsavonvert.com" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                  ✉ contact@monsavonvert.com
                </a>
              </p>
            </div>
            
            <!-- Réseaux sociaux -->
            <div style="margin-bottom: 30px;">
              <p style="color: #a5d6a7; margin: 0 0 15px 0; font-size: 14px;">
                Suivez-nous sur les réseaux
              </p>
              <div>
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: rgba(255,255,255,0.1); border-radius: 50%; line-height: 40px; margin: 0 5px; text-decoration: none; color: #ffffff;">
                  <span style="font-size: 18px;">f</span>
                </a>
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: rgba(255,255,255,0.1); border-radius: 50%; line-height: 40px; margin: 0 5px; text-decoration: none; color: #ffffff;">
                  <span style="font-size: 18px;">📷</span>
                </a>
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: rgba(255,255,255,0.1); border-radius: 50%; line-height: 40px; margin: 0 5px; text-decoration: none; color: #ffffff;">
                  <span style="font-size: 18px;">𝕏</span>
                </a>
              </div>
            </div>
            
            <!-- Slogan -->
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
              <p style="color: #a5d6a7; margin: 0; font-size: 13px; font-style: italic;">
                🌿 Des savons naturels pour prendre soin de vous et de la planète
              </p>
              <p style="color: #81c784; margin: 10px 0 0 0; font-size: 12px;">
                © 2024 Mon Savon Vert - Tous droits réservés
              </p>
            </div>
            
          </div>
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
 * STYLE COMPLETEMENT REFAIT - Logique identique
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
    
    // NOUVEAU TEMPLATE HTML PROFESSIONNEL
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - Mon Savon Vert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        
        <!-- BANNIÈRE SUPÉRIEURE -->
        <div style="width: 100%; background-color: #1b5e20; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">
              MON SAVON VERT
            </h1>
            <p style="color: #a5d6a7; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
              Savons naturels & écologiques
            </p>
          </div>
        </div>
        
        <!-- CONTENU PRINCIPAL -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="padding: 50px 40px 30px 40px;">
            
            <!-- Icône et titre -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 80px; height: 80px; background-color: #fff3e0; border-radius: 50%; line-height: 80px; margin-bottom: 20px;">
                <span style="font-size: 40px;">🔐</span>
              </div>
              <h2 style="color: #1b5e20; margin: 0 0 10px 0; font-size: 28px; font-weight: 400;">
                Réinitialisation de mot de passe
              </h2>
              <p style="color: #666; margin: 0; font-size: 16px;">
                Une demande de réinitialisation a été reçue
              </p>
            </div>
            
            <!-- Message principal -->
            <div style="background-color: #fafafa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <p style="color: #333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="color: #555; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
                Nous avons reçu une demande de réinitialisation du mot de passe pour le compte associé à l'adresse <strong style="color: #1b5e20;">${user.email}</strong>.
              </p>
              <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">
                Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :
              </p>
            </div>
            
            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; 
                        background-color: #1b5e20; 
                        color: #ffffff; 
                        padding: 16px 40px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: 600; 
                        font-size: 16px;
                        letter-spacing: 0.5px;
                        box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
                        transition: all 0.3s ease;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <!-- Avertissements de sécurité -->
            <div style="background: #fff8e1; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
              <h3 style="color: #f57c00; margin: 0 0 15px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚠️ Informations importantes
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">
                  Ce lien est valable pendant <strong>1 heure</strong>
                </li>
                <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">
                  Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
                </li>
                <li style="margin-bottom: 0; font-size: 14px; line-height: 1.5;">
                  Ne partagez jamais ce lien avec quiconque
                </li>
              </ul>
            </div>
            
            <!-- Lien alternatif -->
            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                Problème avec le bouton ?
              </p>
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                Copiez et collez ce lien dans votre navigateur :
              </p>
              <div style="background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0;">
                <p style="word-break: break-all; color: #1b5e20; font-family: 'Courier New', monospace; font-size: 12px; margin: 0;">
                  ${resetUrl}
                </p>
              </div>
            </div>
            
          </div>
        </div>
        
        <!-- BANNIÈRE INFÉRIEURE -->
        <div style="width: 100%; background-color: #1b5e20; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
            
            <!-- Support -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px; font-weight: 300; letter-spacing: 1px;">
                BESOIN D'ASSISTANCE ?
              </h3>
              <p style="color: #a5d6a7; margin: 0 0 10px 0; font-size: 14px;">
                Notre équipe support est là pour vous aider
              </p>
              <p style="margin: 15px 0;">
                <a href="mailto:contact@monsavonvert.com" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                  ✉ contact@monsavonvert.com
                </a>
              </p>
              <p style="color: #a5d6a7; margin: 10px 0 0 0; font-size: 14px;">
                Disponible du lundi au vendredi, 9h-18h
              </p>
            </div>
            
            <!-- Sécurité -->
            <div style="background-color: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="color: #c8e6c9; margin: 0; font-size: 13px; line-height: 1.6;">
                🔒 Vos données sont protégées et sécurisées.<br>
                Nous ne demandons jamais votre mot de passe par email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px;">
              <p style="color: #a5d6a7; margin: 0; font-size: 13px; font-style: italic;">
                🌿 Des savons naturels pour prendre soin de vous et de la planète
              </p>
              <p style="color: #81c784; margin: 10px 0 0 0; font-size: 12px;">
                © 2024 Mon Savon Vert - Tous droits réservés
              </p>
            </div>
            
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