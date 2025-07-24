const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  characteristics: { type: String, required: false },
  stock: { type: Number, required: true, default: 0 },
  ingredients: { type: String, required: false },
  usageTips: { type: String, required: false },
  images: [{ type: String }], // Tableau pouvant contenir jusqu'à 5 URLs d'images
  reviews: [
    {
      // MODIFICATION : Rendre ces champs optionnels pour compatibilité avec anciens avis
      userId: { type: String, required: false }, // Optionnel pour anciens avis
      firstName: { type: String, required: false }, // Optionnel pour anciens avis
      lastName: { type: String, required: false }, // Optionnel pour anciens avis
      user: { type: String, required: false }, // Nom complet (pour compatibilité)
      comment: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now }, // Date de création de l'avis
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);