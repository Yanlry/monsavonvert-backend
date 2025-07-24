// scripts/migrate-reviews.js
// Script à exécuter UNE SEULE FOIS pour migrer tes avis existants

const mongoose = require('mongoose');
const Product = require('../models/product'); // Ajuste le chemin si nécessaire

// AJOUT : Charger les variables d'environnement
require('dotenv').config();

/**
 * Script de migration pour ajouter userId aux avis existants
 * À exécuter une seule fois après la mise à jour des routes
 */

async function migrateReviews() {
  try {
    console.log('🔄 Début de la migration des avis...');

    // CORRECTION : Utiliser la vraie URL MongoDB depuis .env
    const mongoUri = process.env.CONNECTION_STRING || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('❌ URL MongoDB non trouvée dans les variables d\'environnement (CONNECTION_STRING ou MONGODB_URI)');
    }

    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les produits avec des avis
    const products = await Product.find({ reviews: { $exists: true, $ne: [] } });
    console.log(`📋 ${products.length} produits trouvés avec des avis`);

    if (products.length === 0) {
      console.log('ℹ️  Aucun produit avec des avis trouvé. Migration terminée.');
      return;
    }

    let totalReviewsUpdated = 0;

    for (const product of products) {
      console.log(`\n🔍 Traitement du produit: ${product.title}`);
      console.log(`📝 ${product.reviews.length} avis à traiter`);

      let productUpdated = false;

      for (const review of product.reviews) {
        // Vérifier si l'avis a déjà un userId
        if (!review.userId) {
          console.log(`⚠️  Avis sans userId trouvé: ${review.user || 'Anonyme'}`);
          
          // Assigner un userId générique pour les anciens avis
          review.userId = 'legacy-user-' + review._id.toString().substring(18);
          
          // Ajouter une date de création si elle n'existe pas
          if (!review.createdAt) {
            review.createdAt = new Date();
          }

          productUpdated = true;
          totalReviewsUpdated++;
          
          console.log(`✅ Avis mis à jour avec userId: ${review.userId}`);
        } else {
          console.log(`✓ Avis déjà avec userId: ${review.userId}`);
        }
      }

      // Sauvegarder seulement si des modifications ont été faites
      if (productUpdated) {
        await product.save();
        console.log(`💾 Produit sauvegardé`);
      }
    }

    console.log(`\n🎉 Migration terminée !`);
    console.log(`📊 ${totalReviewsUpdated} avis mis à jour au total`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('📤 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  migrateReviews();
}

module.exports = migrateReviews;