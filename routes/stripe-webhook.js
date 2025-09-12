const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Customer = require("../models/Customer");
const Order = require("../models/Order");
// Importer le module d'envoi d'email AVEC LA NOUVELLE FONCTION
const { sendOrderConfirmation, sendOrderNotificationToAdmin } = require("../modules/emailSender");

// Route spéciale pour tester l'envoi d'email manuellement
router.get("/test-email/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(`🔍 Test d'envoi d'email pour la commande ${orderId}`);
    
    // Trouver la commande
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Commande non trouvée");
    }
    
    // Trouver le client associé
    const customer = await Customer.findById(order.customer);
    if (!customer) {
      return res.status(404).send("Client non trouvé");
    }
    
    // Envoyer les emails (client + admin)
    await sendOrderConfirmation(customer, order);
    await sendOrderNotificationToAdmin(customer, order);
    
    res.send("Emails de test envoyés avec succès (client + admin)");
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails de test:", error);
    res.status(500).send(`Erreur: ${error.message}`);
  }
});

// Route pour les tests - garde-la pendant que tu développes
router.post("/webhook-test", express.json(), async (req, res) => {
  console.log("📌 Webhook TEST reçu");
  
  const event = req.body;
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`🔄 Traitement de la session de test: ${session.id}`);

    try {
      if (session.payment_status !== 'paid') {
        console.log(`⚠️ Paiement non complété. Statut: ${session.payment_status}`);
        return res.status(200).send("Webhook reçu, paiement non complété.");
      }

      const { customer_email } = session;
      
      if (!session.metadata) {
        console.error("❌ Aucune métadonnée trouvée dans la session");
        return res.status(200).send("Webhook reçu, mais métadonnées manquantes.");
      }

      const { 
        items, 
        totalAmount, 
        firstName, 
        lastName, 
        phone, 
        address, 
        city, 
        postalCode, 
        country,
        shippingMethod
      } = session.metadata;

      console.log(`📋 Métadonnées reçues:`, session.metadata);

      let customer = await Customer.findOne({ email: customer_email });

      if (!customer) {
        customer = new Customer({
          firstName,
          lastName,
          email: customer_email,
          phone,
          address,
          city,
          postalCode,
          country,
        });
        await customer.save();
        console.log(`✅ Nouveau client créé avec l'ID: ${customer._id}`);
      } else {
        console.log(`🔄 Client existant trouvé avec l'ID: ${customer._id}`);
      }

      let parsedItems;
      try {
        parsedItems = JSON.parse(items);
        console.log(`📦 Articles parsés: ${parsedItems.length} articles`);
      } catch (parseError) {
        console.error("❌ Erreur lors du parsing des articles:", parseError);
        return res.status(200).send("Webhook reçu, erreur de parsing des articles.");
      }

      const newOrder = new Order({
        customer: customer._id,
        items: parsedItems,
        totalAmount: parseFloat(totalAmount),
        status: "processing",
        payment: "completed", // Marquer le paiement comme complété
        sessionId: session.id,
        shippingMethod,
        shippingCost: 0,
      });
      
      await newOrder.save();
      console.log(`✅ Nouvelle commande créée avec l'ID: ${newOrder._id}`);

      customer.orders.push(newOrder._id);
      await customer.save();
      console.log(`🔄 Commande associée au client avec succès`);

      // === NOUVELLE SECTION : ENVOI DES EMAILS ===
      console.log("\n📧 === DÉBUT ENVOI DES EMAILS ===");
      
      // 1. Envoyer l'email de confirmation au CLIENT
      try {
        console.log(`📧 Envoi de l'email de confirmation au client: ${customer.email}`);
        await sendOrderConfirmation(customer, newOrder);
        console.log(`✉️ ✅ Email de confirmation envoyé avec succès au client: ${customer.email}`);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de confirmation au client:", emailError.message);
        // On continue même si l'email échoue pour ne pas bloquer la commande
      }

      // 2. NOUVEAU : Envoyer la notification à L'ADMIN (contact@monsavonvert.com)
      try {
        console.log(`🚨 Envoi de la notification admin pour la commande #${newOrder.orderNumber || newOrder._id}`);
        await sendOrderNotificationToAdmin(customer, newOrder);
        console.log(`✉️ ✅ Notification admin envoyée avec succès à: contact@monsavonvert.com`);
      } catch (adminEmailError) {
        console.error("❌ Erreur lors de l'envoi de la notification admin:", adminEmailError.message);
        // On continue même si l'email admin échoue pour ne pas bloquer la commande
      }
      
      console.log("📧 === FIN ENVOI DES EMAILS ===\n");

      console.log("✅ Client et commande enregistrés avec succès.");
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du client ou de la commande:", error);
      return res.status(200).send("Webhook reçu, erreur de traitement interne.");
    }
  }

  console.log("📬 Réponse 200 envoyée");
  res.status(200).send("Webhook de test reçu et traité avec succès.");
});

// Route de production - cette route sera appelée par Stripe, pas par ton frontend
// ATTENTION: Changer le format de la route pour passer le contenu brut correctement
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  // Pour le développement/test, si pas de signature, on traite quand même
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'; // Utilise une valeur par défaut si pas de secret configuré
  
  console.log("📌 Webhook Stripe reçu - VÉRIFICATION");
  
  let event;
  
  try {
    // Si on a une signature et un secret, on vérifie
    if (sig && endpointSecret && endpointSecret !== 'whsec_test') {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log(`✅ Événement Stripe vérifié: ${event.type}`);
    } else {
      // Sinon, on prend le body tel quel (mode développement)
      event = JSON.parse(req.body.toString());
      console.log(`⚠️ Mode développement: signature non vérifiée`);
    }

    // IMPORTANT: Logger l'événement pour le débogage
    console.log("📋 Événement reçu:", JSON.stringify(event, null, 2));
  } catch (err) {
    console.error("❌ Erreur lors du traitement du webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement `checkout.session.completed`
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`🔄 Traitement de la session de paiement: ${session.id}`);

    try {
      // Vérifier que le paiement est bien réussi
      if (session.payment_status !== 'paid') {
        console.log(`⚠️ Paiement non complété pour la session ${session.id}. Statut: ${session.payment_status}`);
        return res.status(200).send("Webhook reçu, paiement non complété.");
      }

      // Récupérer les informations du client et de la commande
      const { customer_email } = session;
      
      // Vérifier que les métadonnées existent
      if (!session.metadata) {
        console.error("❌ Aucune métadonnée trouvée dans la session");
        return res.status(200).send("Webhook reçu, mais métadonnées manquantes.");
      }

      const { 
        items, 
        totalAmount, 
        firstName, 
        lastName, 
        phone, 
        address, 
        city, 
        postalCode, 
        country,
        shippingMethod
      } = session.metadata;

      // Vérifier si le client existe déjà
      console.log(`🔍 Recherche du client avec l'email: ${customer_email}`);
      let customer = await Customer.findOne({ email: customer_email });

      if (!customer) {
        // Créer un nouveau client
        console.log(`✨ Création d'un nouveau client: ${firstName} ${lastName}`);
        customer = new Customer({
          firstName,
          lastName,
          email: customer_email,
          phone,
          address,
          city,
          postalCode,
          country,
        });
        await customer.save();
        console.log(`✅ Nouveau client créé avec l'ID: ${customer._id}`);
      } else {
        console.log(`🔄 Client existant trouvé avec l'ID: ${customer._id}`);
      }

      // Parsing des items avec gestion d'erreur
      let parsedItems;
      try {
        parsedItems = JSON.parse(items);
        console.log(`📦 Articles parsés: ${parsedItems.length} articles`);
      } catch (parseError) {
        console.error("❌ Erreur lors du parsing des articles:", parseError);
        return res.status(200).send("Webhook reçu, erreur de parsing des articles.");
      }

      // Créer une nouvelle commande associée au client
      const newOrder = new Order({
        customer: customer._id,
        items: parsedItems,
        totalAmount: parseFloat(totalAmount),
        status: "processing",
        payment: "completed", // Marquer le paiement comme complété
        sessionId: session.id,
        shippingMethod,
        shippingCost: session.shipping_cost ? session.shipping_cost.amount_total / 100 : 0,
      });
      
      await newOrder.save();
      console.log(`✅ Nouvelle commande créée avec l'ID: ${newOrder._id}`);

      // Associer la commande au client
      customer.orders.push(newOrder._id);
      await customer.save();
      console.log(`🔄 Commande associée au client avec succès`);

      // === NOUVELLE SECTION : ENVOI DES EMAILS ===
      console.log("\n📧 === DÉBUT ENVOI DES EMAILS ===");
      
      // 1. Envoyer l'email de confirmation au CLIENT
      try {
        console.log(`📧 Envoi de l'email de confirmation au client: ${customer.email}`);
        await sendOrderConfirmation(customer, newOrder);
        console.log(`✉️ ✅ Email de confirmation envoyé avec succès au client: ${customer.email}`);
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email de confirmation au client:", emailError.message);
        console.error("Détail de l'erreur client:", emailError.stack);
        // On continue même si l'email client échoue
      }

      // 2. NOUVEAU : Envoyer la notification à L'ADMIN (contact@monsavonvert.com)
      try {
        console.log(`🚨 Envoi de la notification admin pour la commande #${newOrder.orderNumber || newOrder._id}`);
        await sendOrderNotificationToAdmin(customer, newOrder);
        console.log(`✉️ ✅ Notification admin envoyée avec succès à: contact@monsavonvert.com`);
      } catch (adminEmailError) {
        console.error("❌ ERREUR IMPORTANTE lors de l'envoi de la notification admin:", adminEmailError.message);
        console.error("Détail de l'erreur admin:", adminEmailError.stack);
        // On continue même si l'email admin échoue pour ne pas bloquer la commande
      }
      
      console.log("📧 === FIN ENVOI DES EMAILS ===\n");

      console.log("✅ Client et commande enregistrés avec succès.");
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du client ou de la commande:", error);
      // Ne pas échouer le webhook même en cas d'erreur de traitement
      return res.status(200).send("Webhook reçu, erreur de traitement interne.");
    }
  }

  // Toujours renvoyer un succès pour les webhooks Stripe
  console.log("📬 Réponse 200 envoyée à Stripe");
  res.status(200).send("Webhook reçu et traité avec succès.");
});

// Route de test pour envoyer un email manuellement
router.get("/test-email-simple", async (req, res) => {
  try {
    console.log('🧪 Test d\'envoi d\'email simple');
    
    // Créer un client et une commande factices pour le test
    const testCustomer = {
      firstName: 'Test',
      lastName: 'Client', 
      email: 'yanlry.mongo@gmail.com' // Ton email vérifié
    };
    
    const testOrder = {
      _id: 'TEST123456789',
      orderNumber: 'TEST-001',
      items: [
        {
          name: 'Test Savon',
          price: 10.99,
          quantity: 2
        }
      ],
      totalAmount: 21.98,
      createdAt: new Date()
    };
    
    // Envoyer TOUS les emails de test
    console.log('📧 Envoi de l\'email de confirmation client...');
    await sendOrderConfirmation(testCustomer, testOrder);
    
    console.log('🚨 Envoi de la notification admin...');
    await sendOrderNotificationToAdmin(testCustomer, testOrder);
    
    res.json({
      success: true,
      message: 'Emails de test envoyés avec succès !',
      details: {
        clientEmail: testCustomer.email,
        adminEmail: 'contact@monsavonvert.com',
        orderNumber: testOrder.orderNumber
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails de test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NOUVELLE ROUTE : Test spécifique de la notification admin
router.get("/test-admin-notification", async (req, res) => {
  try {
    console.log('🚨 Test spécifique de la notification admin');
    
    // Créer un client et une commande factices pour le test
    const testCustomer = {
      _id: 'test-customer-id',
      firstName: 'Jean',
      lastName: 'Dupont', 
      email: 'jean.dupont@email.com',
      phone: '0123456789'
    };
    
    const testOrder = {
      _id: 'test-order-id',
      orderNumber: 'CMD-2024-001',
      items: [
        {
          name: 'Savon à l\'huile d\'olive',
          price: 8.50,
          quantity: 3
        },
        {
          name: 'Savon au miel et avoine',
          price: 9.99,
          quantity: 1
        }
      ],
      totalAmount: 35.49,
      createdAt: new Date(),
      shippingAddress: {
        name: 'Jean Dupont',
        line1: '123 Rue de la Paix',
        city: 'Paris',
        postal_code: '75001',
        country: 'France'
      }
    };
    
    // Envoyer UNIQUEMENT la notification admin
    console.log('🚨 Envoi de la notification admin...');
    await sendOrderNotificationToAdmin(testCustomer, testOrder);
    
    res.json({
      success: true,
      message: 'Notification admin envoyée avec succès !',
      details: {
        adminEmail: 'contact@monsavonvert.com',
        customerEmail: testCustomer.email,
        orderNumber: testOrder.orderNumber,
        totalAmount: testOrder.totalAmount
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification admin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;