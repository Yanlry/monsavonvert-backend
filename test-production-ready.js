// test-production-ready.js - Test si l'accès production Amazon SES est activé
require('dotenv').config();
const mongoose = require('mongoose');
const { sendPasswordResetEmail } = require('./modules/emailSender');

async function testProductionReady() {
  try {
    console.log('🧪 TEST ACCÈS PRODUCTION AMAZON SES');
    console.log('===================================');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ MongoDB connecté');
    
    // Test avec ton vrai email (non vérifié dans SES)
    const testUser = {
      email: 'yanlry.mongo@gmail.com', // Ton email personnel
      firstName: 'Test',
      lastName: 'Production'
    };
    
    const resetToken = 'TEST-PRODUCTION-ACCESS-123456';
    
    console.log('📧 Test envoi vers email non vérifié dans SES:', testUser.email);
    console.log('');
    console.log('🔍 Analyse du résultat :');
    console.log('   - Si ça fonctionne = Accès production ACTIVÉ 🎉');
    console.log('   - Si erreur "not verified" = Encore en mode sandbox ⏳');
    console.log('');
    
    // Tentative d'envoi d'email
    const result = await sendPasswordResetEmail(testUser, resetToken);
    
    if (result.success !== false) {
      console.log('🎉 ACCÈS PRODUCTION ACTIVÉ !');
      console.log('============================');
      console.log('✅ Félicitations ! AWS a approuvé ta demande');
      console.log('✅ Tu peux maintenant envoyer des emails à TOUTES les adresses');
      console.log('✅ Plus aucune restriction sandbox');
      console.log('✅ Ton site peut envoyer des emails à tous tes utilisateurs');
      console.log('');
      console.log('📧 Un email de test a été envoyé à yanlry.mongo@gmail.com');
      console.log('📧 Vérifie ta boîte email (et les spams)');
      console.log('');
      console.log('🚀 TON SYSTÈME D\'EMAILS EST MAINTENANT 100% OPÉRATIONNEL !');
    }
    
  } catch (error) {
    console.error('❌ Résultat du test:', error.message);
    
    if (error.message.includes('Email address is not verified')) {
      console.log('');
      console.log('⏳ ENCORE EN MODE SANDBOX');
      console.log('=========================');
      console.log('📋 AWS n\'a pas encore activé l\'accès production');
      console.log('📋 C\'est normal, ça peut prendre 24-48h');
      console.log('📋 Continue à attendre leur réponse');
      console.log('');
      console.log('🔄 Tu peux relancer ce test plus tard avec :');
      console.log('   cd backend');
      console.log('   node test-production-ready.js');
    } else {
      console.log('');
      console.log('❌ Erreur technique inattendue');
      console.log('💡 Vérifie que ton serveur et tes variables AWS sont OK');
    }
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 Test terminé');
  }
}

// Lancer le test
testProductionReady();