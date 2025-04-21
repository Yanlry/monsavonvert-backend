const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const User = require('../models/user'); // Si vous avez un modèle User séparé

// Route pour obtenir toutes les commandes d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`🔍 Recherche des commandes pour l'utilisateur ID: ${userId}`);
    
    // D'abord récupérer l'utilisateur pour avoir son email
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`❌ Utilisateur non trouvé avec l'ID: ${userId}`);
      return res.status(404).json({ 
        result: false, 
        error: "Utilisateur non trouvé" 
      });
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    
    // Maintenant chercher le customer par email
    const customer = await Customer.findOne({ email: user.email });
    
    if (!customer) {
      console.log(`⚠️ Aucun client trouvé pour l'email: ${user.email}`);
      return res.status(200).json({
        result: true,
        orders: []
      });
    }
    
    console.log(`✅ Client trouvé avec l'ID: ${customer._id}`);
    
    // Récupérer les commandes du customer
    const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });
    console.log(`✅ ${orders.length} commandes trouvées pour le client`);
    
    res.status(200).json({
      result: true,
      orders: orders
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des commandes:", error);
    res.status(500).json({ 
      result: false, 
      error: "Erreur lors de la récupération des commandes: " + error.message 
    });
  }
});

// Route pour obtenir les détails d'une commande spécifique
router.get('/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(`🔍 Recherche de la commande ID: ${orderId}`);
    
    const order = await Order.findById(orderId).populate('customer');
    
    if (!order) {
      console.log(`❌ Commande non trouvée avec l'ID: ${orderId}`);
      return res.status(404).json({ 
        result: false, 
        error: "Commande non trouvée" 
      });
    }
    
    console.log(`✅ Commande trouvée avec l'ID: ${orderId}`);
    res.status(200).json({
      result: true,
      order: order
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la commande:", error);
    res.status(500).json({ 
      result: false, 
      error: "Erreur lors de la récupération de la commande: " + error.message 
    });
  }
});

// NOUVELLE ROUTE: Route pour obtenir toutes les commandes (côté admin) classées par catégories
router.get('/', async (req, res) => {
  try {
    console.log('📋 [Backend] Récupération de toutes les commandes pour l\'admin');
    
    // Vérifier l'authentification admin (token dans les headers)
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ [Backend] Token manquant');
      return res.status(401).json({ result: false, error: 'Token manquant' });
    }
    
    // Vérifier que l'utilisateur a le rôle 'admin'
    const adminUser = await User.findOne({ token });
    if (!adminUser || adminUser.role !== 'admin') {
      console.log('⛔ [Backend] Accès refusé pour l\'utilisateur:', adminUser?.email);
      return res.status(403).json({ result: false, error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    // Récupérer toutes les commandes et les trier par date de création (décroissant)
    const allOrders = await Order.find()
      .populate('customer')  // Récupère les informations du client associé
      .sort({ createdAt: -1 });
    
    console.log(`✅ [Backend] ${allOrders.length} commandes trouvées au total`);
    
    // Organiser les commandes par catégories
    const pendingOrders = allOrders.filter(order => order.status === 'pending');
    const inDeliveryOrders = allOrders.filter(order => 
      order.status === 'processing' || order.status === 'shipped'
    );
    const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
    const cancelledOrders = allOrders.filter(order => order.status === 'cancelled');
    
    // Construire l'objet de réponse
    const ordersByCategory = {
      enAttente: {
        count: pendingOrders.length,
        orders: pendingOrders.map(order => formatOrderForResponse(order))
      },
      enCoursLivraison: {
        count: inDeliveryOrders.length,
        orders: inDeliveryOrders.map(order => formatOrderForResponse(order))
      },
      livre: {
        count: deliveredOrders.length,
        orders: deliveredOrders.map(order => formatOrderForResponse(order))
      },
      annule: {
        count: cancelledOrders.length,
        orders: cancelledOrders.map(order => formatOrderForResponse(order))
      },
      total: allOrders.length
    };
    
    // Loguer les statistiques
    console.log(`📊 [Backend] Statistiques des commandes:
      - En attente: ${pendingOrders.length}
      - En cours de livraison: ${inDeliveryOrders.length}
      - Livrées: ${deliveredOrders.length}
      - Annulées: ${cancelledOrders.length}
      - Total: ${allOrders.length}`);
    
    res.status(200).json({
      result: true,
      orders: ordersByCategory
    });
    
  } catch (error) {
    console.error("❌ [Backend] Erreur lors de la récupération des commandes admin:", error);
    res.status(500).json({ 
      result: false, 
      error: "Erreur lors de la récupération des commandes: " + error.message 
    });
  }
});

// Fonction utilitaire pour formater les commandes pour la réponse API
function formatOrderForResponse(order) {
  // Traduction des statuts en français
  const statusLabels = {
    'pending': 'En attente',
    'processing': 'En préparation',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  
  // Calculer le total des articles
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    id: order._id,
    date: order.createdAt,
    customer: {
      name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Client inconnu',
      email: order.customer?.email || 'Email non disponible',
      phone: order.customer?.phone || 'Téléphone non disponible',
      address: formatAddress(order.shippingAddress || order.customer?.addresses?.[0]) || 'Adresse non disponible'
    },
    status: order.status,
    statusLabel: statusLabels[order.status] || 'Statut inconnu',
    total: order.total || itemsTotal,
    items: order.items || [],
    shipping: order.shippingFee || 0,
    paymentMethod: order.paymentMethod || 'Paiement à la livraison',
    trackingNumber: order.trackingNumber || null,
    cancellationReason: order.cancellationReason || null
  };
}

// Fonction utilitaire pour formater l'adresse
function formatAddress(address) {
  if (!address) return null;
  
  let formattedAddress = '';
  if (address.street) formattedAddress += address.street;
  if (address.postalCode || address.city) {
    formattedAddress += ', ';
    if (address.postalCode) formattedAddress += address.postalCode + ' ';
    if (address.city) formattedAddress += address.city;
  }
  if (address.country) formattedAddress += ', ' + address.country;
  
  return formattedAddress || null;
}

// Exportez le routeur pour l'utiliser dans app.js
module.exports = router;