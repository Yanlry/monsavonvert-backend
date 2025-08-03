// ================================
// scripts/migrate-reviews.js
// Script pour migrer les anciens avis et ajouter les champs manquants
// ================================

const mongoose = require('mongoose');
const Product = require('../models/product');
require('dotenv').config();

// ✅ STANDARDISATION: Même logique que app.js
const mongoURI = process.env.MONGODB_URI || process.env.CONNECTION_STRING;

console.log('🔍 Configuration de migration:');
console.log('URI MongoDB:', mongoURI ? mongoURI.replace(/\/\/.*:.*@/, '//***:***@') : 'AUCUNE URI');
console.log('Environnement:', process.env.NODE_ENV || 'development');

/**
 * Fonction principale de migration des avis
 */
async function migrateReviews() {
  try {
    console.log('🚀 Début de la migration des avis...\n');
    
    // ✅ Vérification de l'URI MongoDB
    if (!mongoURI) {
      console.error('❌ ERREUR CRITIQUE: Aucune URI MongoDB trouvée');
      console.error('📝 Vérifiez que MONGODB_URI est définie dans votre .env');
      console.error('💡 Variables disponibles:');
      console.error('   - MONGODB_URI:', process.env.MONGODB_URI ? 'Définie' : 'Manquante');
      console.error('   - CONNECTION_STRING:', process.env.CONNECTION_STRING ? 'Définie' : 'Manquante');
      throw new Error('Variables MongoDB manquantes');
    }
    
    // ✅ Connexion MongoDB avec même config que app.js
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
    });
    console.log('✅ Connecté à la base de données MongoDB\n');

    // ✅ Recherche des produits avec avis
    console.log('🔍 Recherche des produits avec des avis...');
    const products = await Product.find({ 
      'reviews.0': { $exists: true } 
    });
    
    console.log(`📦 ${products.length} produit(s) trouvé(s) avec des avis\n`);

    if (products.length === 0) {
      console.log('ℹ️ Aucun produit avec des avis trouvé. Migration terminée.');
      return { migrated: 0, alreadyMigrated: 0, products: 0 };
    }

    // ✅ Compteurs pour le rapport
    let totalMigrated = 0;
    let totalAlreadyMigrated = 0;
    let totalErrors = 0;

    // ✅ Migration produit par produit
    for (const [index, product] of products.entries()) {
      console.log(`📦 [${index + 1}/${products.length}] Migration du produit: "${product.title}"`);
      console.log(`   Avis à traiter: ${product.reviews.length}`);
      
      let productModified = false;
      
      for (let i = 0; i < product.reviews.length; i++) {
        const review = product.reviews[i];
        
        try {
          // ✅ Vérifier si l'avis a déjà un userId
          if (review.userId) {
            totalAlreadyMigrated++;
            console.log(`   ✅ Avis ${i + 1} déjà migré (userId: ${review.userId})`);
            continue;
          }

          // ✅ Extraire firstName et lastName
          const { firstName, lastName } = extractNames(review);
          
          // ✅ Générer un userId temporaire
          const tempUserId = generateTempUserId(firstName, lastName, review.user);

          // ✅ Mettre à jour l'avis avec tous les champs requis
          product.reviews[i] = {
            ...review.toObject(),
            userId: tempUserId,
            firstName: firstName || 'Anonyme',
            lastName: lastName || '',
            user: review.user || `${firstName} ${lastName}`.trim(),
            createdAt: review.createdAt || new Date(),
            // Ajouter d'autres champs si nécessaire
            verified: review.verified || false,
            helpful: review.helpful || 0,
          };

          productModified = true;
          totalMigrated++;
          
          console.log(`   🔄 Avis ${i + 1} migré:`, {
            originalUser: review.user || 'Non défini',
            newUserId: tempUserId,
            firstName: firstName || 'Anonyme',
            lastName: lastName || ''
          });

        } catch (reviewError) {
          console.error(`   ❌ Erreur avis ${i + 1}:`, reviewError.message);
          totalErrors++;
        }
      }

      // ✅ Sauvegarder le produit si modifié
      if (productModified) {
        try {
          await product.save();
          console.log(`   💾 Produit sauvegardé avec succès`);
        } catch (saveError) {
          console.error(`   ❌ Erreur sauvegarde:`, saveError.message);
          totalErrors++;
        }
      }
      
      console.log(''); // Ligne vide pour lisibilité
    }

    // ✅ Rapport final
    const report = {
      migrated: totalMigrated,
      alreadyMigrated: totalAlreadyMigrated,
      products: products.length,
      errors: totalErrors
    };

    console.log('📊 RAPPORT DE MIGRATION:');
    console.log('================================');
    console.log(`✅ Avis migrés:           ${report.migrated}`);
    console.log(`⏭️  Avis déjà migrés:     ${report.alreadyMigrated}`);
    console.log(`📦 Produits traités:      ${report.products}`);
    console.log(`❌ Erreurs rencontrées:   ${report.errors}`);
    console.log('================================\n');

    return report;

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE lors de la migration:', error.message);
    
    // ✅ Messages d'aide pour diagnostic
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez que MONGODB_URI est définie dans votre .env');
      console.log('  2. Assurez-vous que votre URI MongoDB Atlas est correcte');
      console.log('  3. Vérifiez votre connexion internet');
      console.log('  4. Si MongoDB local, assurez-vous qu\'il est démarré');
    }
    
    if (error.message.includes('buffering timed out')) {
      console.log('\n💡 Problème de timeout:');
      console.log('  1. Vérifiez l\'IP Whitelist sur MongoDB Atlas');
      console.log('  2. Testez la connexion depuis votre app principale');
    }
    
    throw error;
  } finally {
    // ✅ Fermeture propre de la connexion
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔚 Connexion MongoDB fermée');
    }
  }
}

/**
 * Extrait firstName et lastName à partir des données d'avis
 * @param {Object} review - L'objet avis
 * @returns {Object} - {firstName, lastName}
 */
function extractNames(review) {
  let firstName = review.firstName;
  let lastName = review.lastName;
  
  // Si pas de firstName/lastName, essayer d'extraire du champ 'user'
  if (!firstName && !lastName && review.user) {
    const nameParts = review.user.trim().split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  return { firstName, lastName };
}

/**
 * Génère un userId temporaire basé sur le nom
 * ⚠️ ATTENTION: Cette méthode est pour la migration uniquement
 * Dans un vrai système, utilisez les vrais IDs utilisateurs
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} fullName 
 * @returns {string} - userId temporaire
 */
function generateTempUserId(firstName, lastName, fullName) {
  const name = fullName || `${firstName} ${lastName}`;
  const hash = name.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, ''); // Nettoyer les caractères spéciaux
  const timestamp = Date.now().toString().slice(-6);
  return `temp_${hash}_${timestamp}`;
}

/**
 * Version alternative si vous avez une table Users
 * Cette fonction essaie de trouver le vrai userId
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} fullName 
 * @returns {string} - userId réel ou temporaire
 */
async function findRealUserId(firstName, lastName, fullName) {
  // ✅ Si vous avez un modèle User, décommentez et adaptez:
  /*
  try {
    const User = require('../models/user');
    
    let user = null;
    
    // Chercher par prénom et nom
    if (firstName && lastName) {
      user = await User.findOne({ 
        firstName: new RegExp(`^${firstName}$`, 'i'), 
        lastName: new RegExp(`^${lastName}$`, 'i') 
      });
    }
    
    // Si pas trouvé, chercher par nom complet
    if (!user && fullName) {
      const [fName, ...lNameParts] = fullName.split(' ');
      const lName = lNameParts.join(' ');
      user = await User.findOne({ 
        $or: [
          { 
            firstName: new RegExp(`^${fName}$`, 'i'), 
            lastName: new RegExp(`^${lName}$`, 'i') 
          },
          { 
            email: new RegExp(`${fullName.replace(/\s+/g, '.')}@`, 'i') 
          }
        ]
      });
    }
    
    if (user) {
      console.log(`   🎯 Utilisateur réel trouvé: ${user._id}`);
      return user._id.toString();
    }
  } catch (error) {
    console.log(`   ⚠️  Erreur recherche utilisateur: ${error.message}`);
  }
  */
  
  // Fallback: générer un ID temporaire
  return generateTempUserId(firstName, lastName, fullName);
}

// ✅ Point d'entrée principal
if (require.main === module) {
  console.log('🌟 MIGRATION DES AVIS - MonSavonVert');
  console.log('=====================================\n');
  
  migrateReviews()
    .then((report) => {
      console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS');
      
      if (report.errors > 0) {
        console.log('⚠️  Attention: Des erreurs ont été rencontrées');
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('💥 ÉCHEC DE LA MIGRATION:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  migrateReviews, 
  extractNames, 
  generateTempUserId, 
  findRealUserId 
};