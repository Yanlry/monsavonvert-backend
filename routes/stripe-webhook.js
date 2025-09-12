const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Customer = require("../models/Customer");
const Order = require("../models/Order");
// Importer le module d'envoi d'email - AVEC NOTIFICATION ADMIN
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
    
    // Envoyer l'email au client
    await sendOrderConfirmation(customer, order);
    
    // Envoyer la notification à l'admin
    await sendOrderNotificationToAdmin(customer, order);
    
    res.send("Email de test envoyé avec succès (client + admin)");
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de test:", error);
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
        payment: "completed",
        sessionId: session.id,
        shippingMethod,
        shippingCost: 0,
      });
      
      await newOrder.save();
      console.log(`✅ Nouvelle commande créée avec l'ID: ${newOrder._id}`);

      customer.orders.push(newOrder._id);
      await customer.save();
      console.log(`🔄 Commande associée au client avec succès`);

      // Envoyer les emails - CLIENT + ADMIN
      console.log(`📧 Tentative d'envoi d'emails pour la commande ${newOrder._id}`);
      try {
        // Email de confirmation au client
        await sendOrderConfirmation(customer, newOrder);
        console.log(`✉️ Email de confirmation envoyé au client: ${customer.email}`);
        
        // Email de notification à l'admin
        await sendOrderNotificationToAdmin(customer, newOrder);
        console.log(`🔔 Email de notification envoyé à l'admin`);
        
      } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des emails:", emailError);
      }

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
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
  
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
        payment: "completed",
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

      // EMPLACEMENT CRITIQUE - Envoyer les emails CLIENT + ADMIN
      console.log(`📧 Tentative d'envoi d'emails pour la commande ${newOrder._id}`);
      try {
        // Email de confirmation au client
        await sendOrderConfirmation(customer, newOrder);
        console.log(`✉️ Email de confirmation envoyé au client: ${customer.email}`);
        
        // Email de notification à l'admin
        await sendOrderNotificationToAdmin(customer, newOrder);
        console.log(`🔔 Email de notification envoyé à l'admin`);
        
      } catch (emailError) {
        console.error("❌ ERREUR IMPORTANTE lors de l'envoi des emails:", emailError);
        console.error("Détail de l'erreur:", emailError.message);
        console.error("Stack trace:", emailError.stack);
      }

      console.log("✅ Client et commande enregistrés avec succès.");
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du client ou de la commande:", error);
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
      orderNumber: 'TEST-' + Date.now(),
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
    
    // Envoyer l'email de test au client
    await sendOrderConfirmation(testCustomer, testOrder);
    
    // Envoyer la notification de test à l'admin
    await sendOrderNotificationToAdmin(testCustomer, testOrder);
    
    res.json({
      success: true,
      message: 'Emails de test envoyés (client + admin) !',
      destinataire_client: testCustomer.email,
      destinataire_admin: 'contact@monsavonvert.com'
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails de test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;