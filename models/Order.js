const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  total: { type: Number }, // Compatibilité avec le frontend
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], // Étapes de traitement de la commande
    default: 'pending'
  },
  payment: { 
    type: String, 
    enum: ['completed', 'failed'], // Statuts de paiement
    default: 'failed' // Par défaut, le paiement est considéré comme échoué
  },
  statusLabel: { type: String }, // Labels en français pour le frontend
  sessionId: { type: String, required: true },
  shippingMethod: { type: String },
  shippingCost: { type: Number, default: 0 },
  shipping: { type: Number }, // Compatibilité avec le frontend
  paymentMethod: { type: String, default: 'Carte bancaire' }, // Méthode de paiement
  trackingNumber: { type: String }, // Suivi des colis
  cancellationReason: { type: String }, // Raison d'annulation
  shippingAddress: { // Adresse de livraison structurée
    street: { type: String },
    postalCode: { type: String },
    city: { type: String },
    country: { type: String, default: 'France' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour synchroniser les champs avant de sauvegarder
OrderSchema.pre('save', function(next) {
  // Synchroniser le montant total pour compatibilité frontend/backend
  this.total = this.totalAmount || 0;
  
  // Synchroniser les frais de livraison
  this.shipping = this.shippingCost || 0;
  
  // Définir les étiquettes de statut en français
  const statusLabels = {
    'pending': 'En attente',
    'processing': 'En préparation',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  this.statusLabel = statusLabels[this.status] || 'Statut inconnu';
  
  next();
});

module.exports = mongoose.model("Order", OrderSchema);