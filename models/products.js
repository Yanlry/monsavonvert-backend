const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    characteristics: { type: String, required: false },
    stock: { type: Number, required: true, default: 0 },
    ingredients: { type: String, required: false },
    usageTips: { type: String, required: false },
    // Remplacer le champ image par un tableau d'images
    images: [{ type: String }], // Tableau pouvant contenir jusqu'à 5 URLs d'images
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  });

module.exports = mongoose.model('Product', productSchema);