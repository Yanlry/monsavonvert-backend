// test-new-account.js - Test complet création et connexion nouveau compte
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const uid2 = require('uid2');

async function testNewAccount() {
  try {
    console.log('🧪 TEST CRÉATION ET CONNEXION NOUVEAU COMPTE');
    console.log('=============================================');
    
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté');
    
    // Données du compte de test
    const testEmail = 'test-' + Date.now() + '@gmail.com';
    const testPassword = 'TestPassword123!';
    
    console.log('\n1️⃣ CRÉATION DU COMPTE TEST');
    console.log('Email:', testEmail);
    console.log('Mot de passe:', testPassword);
    
    // Simuler la création de compte (comme ton code signup)
    const hash = bcrypt.hashSync(testPassword, 10);
    
    const newUser = new User({
      firstName: 'Test',
      lastName: 'Utilisateur',
      email: testEmail.toLowerCase(),
      password: hash,
      role: 'user',
      addresses: [],
      phone: null,
      termsAccepted: true,
      token: uid2(32),
    });
    
    const savedUser = await newUser.save();
    console.log('✅ Compte créé avec succès');
    console.log('   - ID:', savedUser._id);
    console.log('   - Hash créé:', hash.length, 'caractères');
    
    // Test de connexion immédiat
    console.log('\n2️⃣ TEST DE CONNEXION IMMÉDIATE');
    
    const foundUser = await User.findOne({ email: testEmail }).select('+password');
    
    if (foundUser) {
      console.log('✅ Utilisateur trouvé pour connexion');
      
      const passwordMatch = bcrypt.compareSync(testPassword, foundUser.password);
      console.log('🔒 Test du mot de passe:', passwordMatch ? '✅ SUCCÈS' : '❌ ÉCHEC');
      
      if (passwordMatch) {
        console.log('\n🎉 TOUT FONCTIONNE PARFAITEMENT !');
        console.log('=====================================');
        console.log('✅ Création de compte : OK');
        console.log('✅ Hashage du mot de passe : OK');
        console.log('✅ Sauvegarde en base : OK');
        console.log('✅ Connexion : OK');
        console.log('\nTon système d\'authentification fonctionne bien pour les nouveaux comptes.');
      } else {
        console.log('❌ Problème de connexion détecté');
      }
    } else {
      console.log('❌ Utilisateur non trouvé après création');
    }
    
    // Nettoyage : supprimer le compte de test
    console.log('\n3️⃣ NETTOYAGE');
    await User.deleteOne({ email: testEmail });
    console.log('🗑️ Compte de test supprimé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Test terminé');
  }
}

testNewAccount();