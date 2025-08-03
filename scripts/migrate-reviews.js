// scripts/migrate-reviews.js
// Script pour migrer les anciens avis et ajouter les champs manquants

const mongoose = require('mongoose');
const Product = require('../models/product'); // Ajustez le chemin selon votre structure
require('dotenv').config(); // Charger les variables d'environnement

// Configuration de la base de données - utiliser la même URI que votre app
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/votre-db';

console.log('🔍 URI MongoDB utilisée:', MONGODB_URI ? MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@') : 'AUCUNE URI');

async function migrateReviews() {
  try {
    console.log('🚀 Début de la migration des avis...');
    
    // Vérifier que l'URI est définie
    if (!MONGODB_URI || MONGODB_URI.includes('localhost')) {
      console.error('❌ ATTENTION: Utilisation de MongoDB local ou URI manquante');
      console.log('💡 Assurez-vous que MONGODB_URI est définie dans votre .env');
      console.log('💡 Variable trouvée:', process.env.MONGODB_URI ? 'OUI' : 'NON');
    }
    
    // Se connecter à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à la base de données MongoDB');

    // Trouver tous les produits avec des avis
    const products = await Product.find({ 'reviews.0': { $exists: true } });
    console.log(`📦 ${products.length} produits trouvés avec des avis`);

    if (products.length === 0) {
      console.log('ℹ️ Aucun produit avec des avis trouvé. Migration terminée.');
      return;
    }

    let totalMigrated = 0;
    let totalAlreadyMigrated = 0;

    for (const product of products) {
      console.log(`\n📦 Migration du produit: ${product.title}`);
      
      let productModified = false;
      
      for (let i = 0; i < product.reviews.length; i++) {
        const review = product.reviews[i];
        
        // Vérifier si l'avis a déjà un userId
        if (review.userId) {
          totalAlreadyMigrated++;
          console.log(`  ✅ Avis ${i + 1} déjà migré (userId: ${review.userId})`);
          continue;
        }

        // Extraire firstName et lastName du champ 'user' si possible
        let firstName = review.firstName;
        let lastName = review.lastName;
        
        if (!firstName && !lastName && review.user) {
          const nameParts = review.user.trim().split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        // Générer un userId temporaire basé sur le nom
        // ⚠️ ATTENTION: Cette méthode génère des IDs temporaires
        // Dans un vrai système, vous devriez mapper les vrais IDs utilisateurs
        const tempUserId = generateTempUserId(firstName, lastName, review.user);

        // Mettre à jour l'avis
        product.reviews[i] = {
          ...review.toObject(),
          userId: tempUserId,
          firstName: firstName || 'Anonyme',
          lastName: lastName || '',
          user: review.user || `${firstName} ${lastName}`,
          createdAt: review.createdAt || new Date()
        };

        productModified = true;
        totalMigrated++;
        
        console.log(`  🔄 Avis ${i + 1} migré:`, {
          originalUser: review.user,
          newUserId: tempUserId,
          firstName,
          lastName
        });
      }

      // Sauvegarder le produit si modifié
      if (productModified) {
        await product.save();
        console.log(`  💾 Produit sauvegardé`);
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`  ✅ ${totalMigrated} avis migrés`);
    console.log(`  ⏭️  ${totalAlreadyMigrated} avis déjà migrés`);
    console.log(`  📦 ${products.length} produits traités`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez que MONGODB_URI est définie dans votre .env');
      console.log('  2. Assurez-vous que votre URI MongoDB Atlas est correcte');
      console.log('  3. Vérifiez votre connexion internet');
      console.log('  4. Si vous utilisez MongoDB local, assurez-vous qu\'il est démarré');
    }
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔚 Connexion fermée');
  }
}

/**
 * Génère un userId temporaire basé sur le nom
 * ⚠️ ATTENTION: Cette méthode est pour la migration uniquement
 * Dans un vrai système, utilisez les vrais IDs utilisateurs
 */
function generateTempUserId(firstName, lastName, fullName) {
  const name = fullName || `${firstName} ${lastName}`;
  const hash = name.toLowerCase().replace(/\s+/g, '');
  const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres
  return `temp_${hash}_${timestamp}`;
}

/**
 * Version alternative si vous avez une table Users
 * Cette fonction essaie de trouver le vrai userId
 */
async function findRealUserId(firstName, lastName, fullName) {
  // Si vous avez un modèle User, décommentez et adaptez:
  /*
  const User = require('../models/user');
  
  let user = null;
  
  // Chercher par prénom et nom
  if (firstName && lastName) {
    user = await User.findOne({ 
      firstName: new RegExp(firstName, 'i'), 
      lastName: new RegExp(lastName, 'i') 
    });
  }
  
  // Si pas trouvé, chercher par nom complet
  if (!user && fullName) {
    const [fName, ...lNameParts] = fullName.split(' ');
    const lName = lNameParts.join(' ');
    user = await User.findOne({ 
      firstName: new RegExp(fName, 'i'), 
      lastName: new RegExp(lName, 'i') 
    });
  }
  
  if (user) {
    return user._id.toString();
  }
  */
  
  // Fallback: générer un ID temporaire
  return generateTempUserId(firstName, lastName, fullName);
}

// Lancer la migration
if (require.main === module) {
  migrateReviews()
    .then(() => {
      console.log('🎉 Migration terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateReviews };