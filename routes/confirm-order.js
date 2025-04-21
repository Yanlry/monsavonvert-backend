const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/user'); // Si tu as un modèle User distinct

// Route pour confirmer une commande après paiement Stripe
router.post('/confirm-order', async (req, res) => {
  try {
    console.log("📝 Réception d'une demande de confirmation de commande");
    const { customerId, items, totalAmount, sessionId, shippingMethod, shippingCost } = req.body;

    console.log("📋 Données reçues:", {
      customerId,
      itemsCount: items?.length || 0,
      totalAmount,
      sessionId,
      shippingMethod,
      shippingCost
    });

    // Vérifier si les données requises sont présentes
    if (!customerId || !items || !totalAmount || !sessionId) {
      console.error("❌ Données de commande incomplètes");
      return res.status(400).json({
        success: false,
        error: "Données de commande incomplètes"
      });
    }

    // Trouver le client associé à l'utilisateur
    console.log(`🔍 Recherche du client pour l'utilisateur ID: ${customerId}`);
    let customer = await Customer.findOne({ userId: customerId });
    
    // Si aucun client n'est trouvé, on essaie de le trouver par email
    if (!customer) {
      console.log("⚠️ Client non trouvé par userId, recherche de l'utilisateur");
      const user = await User.findById(customerId);
      
      if (!user) {
        console.error("❌ Utilisateur non trouvé");
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé"
        });
      }
      
      console.log(`🔍 Recherche du client par email: ${user.email}`);
      customer = await Customer.findOne({ email: user.email });
      
      // Si toujours pas de client, on en crée un nouveau
      if (!customer) {
        console.log("✨ Création d'un nouveau client");
        customer = new Customer({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userId: user._id,
          phone: user.phone || '',
          // Autres champs selon ton modèle
        });
        
        await customer.save();
        console.log(`✅ Nouveau client créé avec l'ID: ${customer._id}`);
      }
    }

    // Créer la commande
    console.log("🛒 Création de la nouvelle commande");
    const newOrder = new Order({
      customer: customer._id,
      items: items,
      totalAmount: parseFloat(totalAmount),
      status: "pending", // Statut initial de la commande
      payment: "completed", // Statut de paiement
      sessionId: sessionId,
      shippingMethod: shippingMethod || 'standard',
      shippingCost: parseFloat(shippingCost || 0),
    });
    
    await newOrder.save();
    console.log(`✅ Nouvelle commande créée avec l'ID: ${newOrder._id}`);
    
    // Associer la commande au client
    customer.orders = customer.orders || [];
    customer.orders.push(newOrder._id);
    await customer.save();
    console.log("🔄 Commande associée au client");

    // Répondre avec les données de la commande
    console.log("📬 Envoi de la réponse");
    res.status(200).json({
      success: true,
      order: newOrder,
      message: "Commande confirmée avec succès"
    });
  } catch (error) {
    console.error("❌ Erreur lors de la confirmation de la commande:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la confirmation de la commande"
    });
  }
});

module.exports = router;