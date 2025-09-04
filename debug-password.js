// debug-password.js - Diagnostic complet du problème de mot de passe
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    console.log('🔍 DIAGNOSTIC PROBLÈME MOT DE PASSE');
    console.log('==================================');
    
    // Connexion MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté');
    
    // Rechercher l'utilisateur problématique
    const email = 'jeansilva@gmail.com';
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('\n👤 INFORMATIONS UTILISATEUR:');
    console.log('Email:', user.email);
    console.log('Nom:', user.firstName, user.lastName);
    console.log('ID:', user._id);
    console.log('Date création:', user.createdAt || 'Non définie');
    
    console.log('\n🔒 INFORMATIONS MOT DE PASSE:');
    console.log('Hash stocké:', user.password);
    console.log('Longueur hash:', user.password.length);
    console.log('Commence par $2a$ (bcrypt):', user.password.startsWith('$2a$'));
    
    // Test avec différents mots de passe possibles
    const possiblePasswords = [
      'Jeansilva',
      'jeansilva', 
      'JeanSilva',
      'JEANSILVA',
      'Jeansilva1',
      'Jeansilva!',
      'jeansilva@gmail.com'
    ];
    
    console.log('\n🧪 TEST DIFFÉRENTS MOTS DE PASSE:');
    for (const testPassword of possiblePasswords) {
      const isMatch = bcrypt.compareSync(testPassword, user.password);
      console.log(`"${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    // Test de création d'un nouveau hash pour "Jeansilva"
    console.log('\n🔧 TEST CRÉATION NOUVEAU HASH:');
    const newHash = bcrypt.hashSync('Jeansilva', 10);
    console.log('Nouveau hash pour "Jeansilva":', newHash);
    const testNewHash = bcrypt.compareSync('Jeansilva', newHash);
    console.log('Test nouveau hash:', testNewHash ? '✅ FONCTIONNE' : '❌ PROBLÈME');
    
    // Proposition de correction
    console.log('\n💡 SOLUTIONS POSSIBLES:');
    console.log('1. Réinitialiser le mot de passe avec la fonction de récupération');
    console.log('2. Corriger manuellement le hash en base (pour debugging)');
    console.log('3. Créer un nouveau compte avec les bonnes informations');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

debugPassword();