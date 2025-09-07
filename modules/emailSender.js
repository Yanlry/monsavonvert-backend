// backend/modules/emailSender.js
// Migration complète vers Mailjet - VERSION PREMIUM
// Templates email redesignés avec direction artistique sophistiquée

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
            Name: fromName || process.env.MAILJET_FROM_NAME || 'MonSavonVert'
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
            Name: process.env.MAILJET_FROM_NAME || 'MonSavonVert'
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
 * TEMPLATE REDESIGNÉ - Direction artistique premium
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
    
    // Construction de la liste des produits avec design premium
    let productsList = '';
    if (order.products && order.products.length > 0) {
      productsList = order.products.map(product => {
        const productName = product.name || 'Produit sans nom';
        const productPrice = product.price ? `${product.price.toFixed(2)} €` : 'Prix non disponible';
        const productQuantity = product.quantity || 1;
        
        return `
          <tr style="border-bottom: 1px solid #f1f8e9;">
            <td style="padding: 20px 16px; vertical-align: top;">
              <div style="font-weight: 600; color: #2c3e50; font-size: 16px; margin-bottom: 4px;">
                ${productName}
              </div>
              <div style="color: #546e7a; font-size: 14px;">
                Cosmétique naturel artisanal
              </div>
            </td>
            <td style="padding: 20px 16px; text-align: center; vertical-align: middle;">
              <span style="background: #f1f8e9; color: #2e7d32; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                ${productQuantity}
              </span>
            </td>
            <td style="padding: 20px 16px; text-align: right; vertical-align: middle;">
              <div style="font-weight: 700; color: #2e7d32; font-size: 16px;">
                ${productPrice}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      productsList = `
        <tr>
          <td colspan="3" style="padding: 40px 20px; text-align: center; color: #546e7a; font-style: italic;">
            Aucun produit trouvé dans cette commande
          </td>
        </tr>
      `;
    }
    
    // Template HTML premium redesigné
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande - MonSavonVert</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet">
        <!--[if mso]>
        <style type="text/css">
          .fallback-font { font-family: Arial, sans-serif !important; }
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fbf7; font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #2c3e50;">
        
        <!-- Container principal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fbf7;">
          <tr>
            <td style="padding: 40px 20px;">
              
              <!-- Carte email -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden;">
                
                <!-- Header avec dégradé -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a4d2f 0%, #2e7d32 100%); padding: 0; position: relative;">
                    
                    <!-- Motif décoratif -->
                    <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; transform: translate(40px, -40px);"></div>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 48px 40px; text-align: center; position: relative; z-index: 2;">
                          
                          <!-- Logo -->
                          <h1 style="margin: 0 0 12px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            MonSavonVert
                          </h1>
                          
                          <!-- Tagline -->
                          <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 400;">
                            Cosmétiques naturels & artisanaux
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Titre de confirmation -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                          
                          <!-- Icône de succès -->
                          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #4caf50, #2e7d32); border-radius: 50%; margin-bottom: 24px; position: relative;">
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px;">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20,6 9,17 4,12"></polyline>
                              </svg>
                            </div>
                          </div>
                          
                          <h2 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 700; color: #2c3e50; letter-spacing: -0.5px;">
                            Commande confirmée
                          </h2>
                          
                          <p style="margin: 0; font-size: 18px; color: #546e7a; line-height: 1.5;">
                            Merci pour votre confiance, <strong style="color: #2e7d32;">${customer.firstName || customer.email}</strong>
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Message personnel -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 24px 0;">
                          <p style="margin: 0; font-size: 16px; color: #2c3e50; line-height: 1.6; text-align: center;">
                            Votre commande a été reçue et est en cours de préparation. Nous mettons tout notre savoir-faire artisanal au service de votre bien-être naturel.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Détails de la commande -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fbf7; border-radius: 12px; margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          
                          <h3 style="margin: 0 0 20px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: #2e7d32; border-bottom: 2px solid #e8f5e8; padding-bottom: 12px;">
                            Récapitulatif de commande
                          </h3>
                          
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0;">
                                <strong style="color: #2c3e50;">Numéro de commande :</strong>
                              </td>
                              <td style="padding: 8px 0; text-align: right; font-family: 'Courier New', monospace; color: #2e7d32; font-weight: 600;">
                                ${order.orderNumber}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <strong style="color: #2c3e50;">Date de commande :</strong>
                              </td>
                              <td style="padding: 8px 0; text-align: right; color: #546e7a;">
                                ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <strong style="color: #2c3e50;">Email de contact :</strong>
                              </td>
                              <td style="padding: 8px 0; text-align: right; color: #546e7a;">
                                ${customer.email}
                              </td>
                            </tr>
                          </table>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Liste des produits -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                      <tr>
                        <td>
                          
                          <h3 style="margin: 0 0 24px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: #2e7d32;">
                            Vos produits sélectionnés
                          </h3>
                          
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius: 12px; overflow: hidden; border: 1px solid #e8f5e8;">
                            
                            <!-- En-tête du tableau -->
                            <tr style="background: linear-gradient(135deg, #2e7d32, #4caf50);">
                              <th style="padding: 16px; text-align: left; color: #ffffff; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
                                PRODUIT
                              </th>
                              <th style="padding: 16px; text-align: center; color: #ffffff; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
                                QTÉ
                              </th>
                              <th style="padding: 16px; text-align: right; color: #ffffff; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
                                PRIX
                              </th>
                            </tr>
                            
                            <!-- Produits -->
                            ${productsList}
                            
                          </table>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Total -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f1f8e9, #e8f5e8); border-radius: 12px; margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          
                          <div style="margin-bottom: 8px;">
                            <span style="font-size: 16px; color: #546e7a; font-weight: 500;">Total de votre commande</span>
                          </div>
                          
                          <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 36px; font-weight: 700; color: #2e7d32; letter-spacing: -1px;">
                            ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'} €
                          </div>
                          
                          <div style="margin-top: 8px;">
                            <span style="font-size: 14px; color: #546e7a;">TTC, livraison incluse</span>
                          </div>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Informations de livraison -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e8f5e8; border-radius: 12px; margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          
                          <h3 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600; color: #2e7d32; display: flex; align-items: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                              <rect x="1" y="3" width="15" height="13"></rect>
                              <polygon points="16,3 21,8 21,16 16,16"></polygon>
                              <circle cx="5.5" cy="18.5" r="2.5"></circle>
                              <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                            Livraison & Expédition
                          </h3>
                          
                          <div style="background: #f9fbf7; padding: 16px; border-radius: 8px; border-left: 4px solid #4caf50;">
                            <p style="margin: 0 0 12px 0; font-size: 16px; color: #2c3e50; font-weight: 600;">
                              Préparation sous 24-48h ouvrées
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #546e7a; line-height: 1.5;">
                              Votre commande sera soigneusement préparée par nos artisans. Vous recevrez un email de confirmation d'expédition avec le numéro de suivi dès l'envoi de votre colis.
                            </p>
                          </div>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Section support -->
                <tr>
                  <td style="background: #f8f9fa; padding: 32px 40px; border-top: 1px solid #e8f5e8;">
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          
                          <h3 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600; color: #2c3e50;">
                            Une question ? Notre équipe vous accompagne
                          </h3>
                          
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #546e7a; line-height: 1.5;">
                            Notre service client est à votre disposition pour toute question concernant votre commande.
                          </p>
                          
                          <a href="mailto:contact@monsavonvert.com" style="display: inline-block; background: linear-gradient(135deg, #2e7d32, #4caf50); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 25px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; transition: all 0.3s ease;">
                            Nous contacter
                          </a>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #2c3e50; padding: 32px 40px; text-align: center;">
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          
                          <p style="margin: 0 0 12px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: #ffffff;">
                            MonSavonVert
                          </p>
                          
                          <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                            Cosmétiques naturels & artisanaux<br>
                            Prendre soin de vous et de la planète
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `;
    
    // Version texte élégante
    const textContent = `
MONSAVONVERT - CONFIRMATION DE COMMANDE

Bonjour ${customer.firstName || customer.email},

Votre commande a été confirmée avec succès.

═══════════════════════════════════════════
RÉCAPITULATIF DE COMMANDE
═══════════════════════════════════════════

Numéro de commande : ${order.orderNumber}
Date : ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}
Email : ${customer.email}

MONTANT TOTAL : ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'} € TTC

═══════════════════════════════════════════
LIVRAISON & EXPÉDITION
═══════════════════════════════════════════

Votre commande sera préparée sous 24-48h ouvrées.
Vous recevrez un email de confirmation d'expédition avec le numéro de suivi.

═══════════════════════════════════════════
BESOIN D'AIDE ?
═══════════════════════════════════════════

Notre équipe est à votre disposition :
Email : contact@monsavonvert.com

Merci pour votre confiance,
L'équipe MonSavonVert

---
MonSavonVert - Cosmétiques naturels & artisanaux
Prendre soin de vous et de la planète
    `;
    
    console.log('💼 Template email premium préparé');
    
    // Envoi via Mailjet
    const result = await sendEmailViaMailjet({
      to: customer.email,
      subject: `Commande confirmée #${order.orderNumber} - MonSavonVert`,
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'MonSavonVert'
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
 * TEMPLATE REDESIGNÉ - Direction artistique premium
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
    
    // URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL || 'https://monsavonvert.com'}/reset-password/${resetToken}`;
    
    console.log('🔐 URL de reset générée:', resetUrl);
    
    // Template HTML premium pour reset password
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - MonSavonVert</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fbf7; font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #2c3e50;">
        
        <!-- Container principal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fbf7;">
          <tr>
            <td style="padding: 40px 20px;">
              
              <!-- Carte email -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden;">
                
                <!-- Header sécurisé -->
                <tr>
                  <td style="background: linear-gradient(135deg, #e65100 0%, #ff9800 100%); padding: 0; position: relative;">
                    
                    <!-- Motif décoratif -->
                    <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; transform: translate(40px, -40px);"></div>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 48px 40px; text-align: center; position: relative; z-index: 2;">
                          
                          <!-- Logo -->
                          <h1 style="margin: 0 0 12px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            MonSavonVert
                          </h1>
                          
                          <!-- Tagline sécurité -->
                          <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 400;">
                            Réinitialisation sécurisée
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Titre et icône -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                          
                          <!-- Icône de sécurité -->
                          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #ff9800, #e65100); border-radius: 50%; margin-bottom: 24px; position: relative;">
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px;">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            </div>
                          </div>
                          
                          <h2 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 700; color: #2c3e50; letter-spacing: -0.5px;">
                            Réinitialisation de mot de passe
                          </h2>
                          
                          <p style="margin: 0; font-size: 16px; color: #546e7a; line-height: 1.5;">
                            Une demande de réinitialisation a été effectuée pour votre compte
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Message personnel -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 24px 0;">
                          
                          <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; border-left: 4px solid #ff9800; margin-bottom: 24px;">
                            <p style="margin: 0; font-size: 16px; color: #2c3e50; line-height: 1.6;">
                              Bonjour,<br><br>
                              Vous avez demandé la réinitialisation de votre mot de passe pour le compte associé à l'adresse <strong style="color: #e65100;">${user.email}</strong>.
                            </p>
                          </div>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Bouton d'action principal -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 32px 0;">
                          
                          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #e65100, #ff9800); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 30px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(230, 81, 0, 0.3); transition: all 0.3s ease;">
                            Réinitialiser mon mot de passe
                          </a>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Instructions importantes -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fff3e0; border: 1px solid #ffcc02; border-radius: 12px; margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          
                          <h3 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: #e65100; display: flex; align-items: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Informations importantes
                          </h3>
                          
                          <ul style="margin: 0; padding-left: 20px; color: #2c3e50; font-size: 14px; line-height: 1.6;">
                            <li style="margin-bottom: 8px;">Ce lien de réinitialisation expire automatiquement dans <strong>10 minutes</strong></li>
                            <li style="margin-bottom: 8px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                            <li style="margin-bottom: 8px;">Ne partagez jamais ce lien avec une tierce personne</li>
                            <li>Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau</li>
                          </ul>
                          
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Lien alternatif -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8f9fa; border-radius: 12px; margin: 24px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          
                          <h4 style="margin: 0 0 12px 0; font-weight: 600; color: #2c3e50; font-size: 16px;">
                            Le bouton ne fonctionne pas ?
                          </h4>
                          
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #546e7a;">
                            Copiez et collez ce lien dans votre navigateur :
                          </p>
                          
                          <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e8f5e8; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; color: #e65100;">
                            ${resetUrl}
                          </div>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Section support -->
                <tr>
                  <td style="background: #f8f9fa; padding: 32px 40px; border-top: 1px solid #e8f5e8;">
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          
                          <h3 style="margin: 0 0 16px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600; color: #2c3e50;">
                            Besoin d'assistance ?
                          </h3>
                          
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #546e7a; line-height: 1.5;">
                            Si vous rencontrez des difficultés, notre équipe technique est à votre disposition.
                          </p>
                          
                          <a href="mailto:contact@monsavonvert.com" style="display: inline-block; background: #2c3e50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 20px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
                            Contacter le support
                          </a>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #2c3e50; padding: 32px 40px; text-align: center;">
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          
                          <p style="margin: 0 0 8px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: #ffffff;">
                            MonSavonVert
                          </p>
                          
                          <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.6); line-height: 1.4;">
                            Cet email a été envoyé automatiquement.<br>
                            Merci de ne pas y répondre directement.
                          </p>
                          
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `;
    
    // Version texte élégante
    const textContent = `
MONSAVONVERT - RÉINITIALISATION DE MOT DE PASSE

Bonjour,

Une demande de réinitialisation de mot de passe a été effectuée pour votre compte : ${user.email}

═══════════════════════════════════════════
LIEN DE RÉINITIALISATION
═══════════════════════════════════════════

Cliquez sur ce lien pour créer votre nouveau mot de passe :
${resetUrl}

═══════════════════════════════════════════
INFORMATIONS IMPORTANTES
═══════════════════════════════════════════

• Ce lien expire automatiquement dans 10 minutes
• Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
• Ne partagez jamais ce lien avec une tierce personne
• Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau

═══════════════════════════════════════════
BESOIN D'AIDE ?
═══════════════════════════════════════════

Si vous rencontrez des difficultés :
Email : contact@monsavonvert.com

Cordialement,
L'équipe MonSavonVert

---
Cet email a été envoyé automatiquement.
Merci de ne pas y répondre directement.
    `;
    
    console.log('🔐 Template email reset premium préparé');
    
    // Envoi via Mailjet
    const result = await sendEmailViaMailjet({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe - MonSavonVert',
      htmlContent: htmlContent,
      textContent: textContent,
      fromName: 'MonSavonVert - Support'
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