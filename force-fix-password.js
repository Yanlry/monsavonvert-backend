// force-fix-password.js - Correction forcée et définitive du mot de passe
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function forceFixPassword() {
  try {
    console.log('🔧 CORRECTION FORCÉE DU MOT DE PASSE');
    console.log('===================================');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté avec succès');
    
    // 1. Vérifier l'état actuel
    console.log('\n1️⃣ VÉRIFICATION ÉTAT ACTUEL');
    let user = await User.findOne({ email: 'jeansilva@gmail.com' }).select('+password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:');
    console.log('   - ID:', user._id);
    console.log('   - Email:', user.email);
    console.log('   - Nom:', user.firstName, user.lastName);
    console.log('   - Hash actuel:', user.password);
    console.log('   - Longueur hash:', user.password ? user.password.length : 'undefined');
    
    // 2. Test du mot de passe actuel
    if (user.password) {
      const testActuel = bcrypt.compareSync('Jeansilva', user.password);
      console.log('   - Test "Jeansilva" avec hash actuel:', testActuel ? '✅ MATCH' : '❌ NO MATCH');
    }
    
    // 3. Créer un nouveau hash et FORCER la mise à jour
    console.log('\n2️⃣ CRÉATION ET MISE À JOUR FORCÉE');
    const motDePasseCorrect = 'Jeansilva';
    const nouveauHash = bcrypt.hashSync(motDePasseCorrect, 10);
    
    console.log('🔐 Nouveau hash créé:', nouveauHash);
    console.log('🔐 Longueur nouveau hash:', nouveauHash.length);
    
    // Méthode 1: Mise à jour directe via updateOne
    const updateResult = await User.updateOne(
      { email: 'jeansilva@gmail.com' },
      { $set: { password: nouveauHash } }
    );
    
    console.log('📝 Résultat mise à jour directe:', updateResult);
    
    // 4. Vérification immédiate
    console.log('\n3️⃣ VÉRIFICATION IMMÉDIATE');
    user = await User.findOne({ email: 'jeansilva@gmail.com' }).select('+password');
    
    console.log('🔍 Hash après mise à jour:', user.password);
    console.log('🔍 Longueur hash après mise à jour:', user.password ? user.password.length : 'undefined');
    
    // Test du nouveau hash
    if (user.password) {
      const testNouveauHash = bcrypt.compareSync(motDePasseCorrect, user.password);
      console.log('🧪 Test "Jeansilva" avec nouveau hash:', testNouveauHash ? '✅ MATCH' : '❌ NO MATCH');
      
      // Double vérification avec le hash créé directement
      const testHashDirect = bcrypt.compareSync(motDePasseCorrect, nouveauHash);
      console.log('🧪 Test "Jeansilva" avec hash créé:', testHashDirect ? '✅ MATCH' : '❌ NO MATCH');
      
      if (testNouveauHash && testHashDirect) {
        console.log('\n🎉 CORRECTION RÉUSSIE !');
        console.log('==================');
        console.log('Le mot de passe a été corrigé avec succès.');
        console.log('Informations de connexion :');
        console.log('📧 Email: jeansilva@gmail.com');
        console.log('🔒 Mot de passe: Jeansilva');
        console.log('\n⚠️ Redémarre ton serveur backend avec yarn dev avant de tester');
      } else {
        console.log('\n❌ ÉCHEC DE LA CORRECTION');
        console.log('Le problème persiste. Il pourrait y avoir un problème avec le modèle User.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction forcée:', error.message);
    console.error('📋 Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécution du script
forceFixPassword();