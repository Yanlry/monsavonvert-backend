// diagnostic-complet.js - Diagnostic complet du système d'authentification
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function diagnosticComplet() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DU SYSTÈME D\'AUTHENTIFICATION');
    console.log('====================================================');
    
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté');
    
    // Test 1: Vérifier bcrypt directement
    console.log('\n1️⃣ TEST DE BCRYPT DIRECT');
    const testPassword = 'TestPassword123!';
    const directHash = bcrypt.hashSync(testPassword, 10);
    console.log('Hash créé directement:', directHash);
    console.log('Longueur:', directHash.length);
    
    const directTest = bcrypt.compareSync(testPassword, directHash);
    console.log('Test direct bcrypt:', directTest ? '✅ FONCTIONNE' : '❌ PROBLÈME');
    
    // Test 2: Créer un utilisateur temporaire et tester immédiatement
    console.log('\n2️⃣ TEST CRÉATION UTILISATEUR TEMPORAIRE');
    
    const tempEmail = 'temp-' + Date.now() + '@test.com';
    const tempPassword = 'TempPass123!';
    
    // Créer le hash
    const hash = bcrypt.hashSync(tempPassword, 10);
    console.log('Hash pour utilisateur temporaire:', hash);
    
    // Créer l'utilisateur en base
    const tempUser = new User({
      firstName: 'Temp',
      lastName: 'User', 
      email: tempEmail,
      password: hash,
      token: 'temp-token-' + Date.now()
    });
    
    const savedUser = await tempUser.save();
    console.log('✅ Utilisateur temporaire sauvegardé avec ID:', savedUser._id);
    
    // Récupérer immédiatement depuis la base
    const retrievedUser = await User.findById(savedUser._id).select('+password');
    console.log('✅ Utilisateur récupéré depuis la base');
    console.log('Hash en base:', retrievedUser.password);
    console.log('Hash identique?', hash === retrievedUser.password ? '✅ OUI' : '❌ NON');
    
    // Test de comparaison
    const compareTest = bcrypt.compareSync(tempPassword, retrievedUser.password);
    console.log('Test de comparaison:', compareTest ? '✅ SUCCÈS' : '❌ ÉCHEC');
    
    // Test 3: Vérifier la structure du modèle User
    console.log('\n3️⃣ VÉRIFICATION DU MODÈLE USER');
    const userSchema = User.schema;
    const passwordField = userSchema.paths.password;
    
    console.log('Champ password existe:', !!passwordField ? '✅ OUI' : '❌ NON');
    if (passwordField) {
      console.log('Type du champ password:', passwordField.instance);
      console.log('Options select:', passwordField.options.select);
      console.log('Required:', passwordField.options.required);
    }
    
    // Nettoyage
    await User.deleteOne({ _id: savedUser._id });
    console.log('🗑️ Utilisateur temporaire supprimé');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Diagnostic terminé');
  }
}

diagnosticComplet();