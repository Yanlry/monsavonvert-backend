// fix-password.js - Correction complète du mot de passe
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    console.log('🔧 CORRECTION MOT DE PASSE UTILISATEUR');
    console.log('=====================================');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté avec succès');
    
    // Trouver l'utilisateur avec l'email problématique
    const user = await User.findOne({ email: 'jeansilva@gmail.com' });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet email');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:');
    console.log('   - Nom:', user.firstName, user.lastName);
    console.log('   - Email:', user.email);
    console.log('   - ID:', user._id);
    
    // Définir le nouveau mot de passe correct
    const nouveauMotDePasse = 'Jeansilva';
    console.log('🔒 Nouveau mot de passe à définir:', nouveauMotDePasse);
    
    // Créer un nouveau hash sécurisé
    const nouveauHash = bcrypt.hashSync(nouveauMotDePasse, 10);
    console.log('🔐 Hash créé avec succès');
    
    // Sauvegarder l'ancien hash pour référence
    const ancienHash = user.password;
    console.log('📝 Ancien hash:', ancienHash);
    console.log('📝 Nouveau hash:', nouveauHash);
    
    // Mettre à jour le mot de passe de l'utilisateur
    user.password = nouveauHash;
    await user.save();
    
    console.log('✅ Mot de passe mis à jour avec succès dans la base de données');
    
    // Test de vérification pour confirmer que ça fonctionne
    const testVerification = bcrypt.compareSync(nouveauMotDePasse, nouveauHash);
    console.log('🧪 Test de vérification:', testVerification ? '✅ SUCCÈS' : '❌ ÉCHEC');
    
    if (testVerification) {
      console.log('');
      console.log('🎉 PROBLÈME RÉSOLU !');
      console.log('==================');
      console.log('Tu peux maintenant te connecter avec :');
      console.log('📧 Email: jeansilva@gmail.com');
      console.log('🔒 Mot de passe: Jeansilva');
      console.log('');
      console.log('Va tester la connexion sur ton site web.');
    } else {
      console.log('❌ Erreur: Le test de vérification a échoué');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    console.log('💡 Assure-toi que MongoDB est démarré et accessible');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la fonction de correction
fixPassword();