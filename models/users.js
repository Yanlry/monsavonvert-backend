const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Veuillez fournir un prénom'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  token: {
    type: String,
    default: null // Non obligatoire à l'inscription
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir une adresse email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir une adresse email valide'
    ],
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Empêche le mot de passe d'être renvoyé dans les requêtes
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  addresses: [{
    street: { type: String, default: null },
    city: { type: String, default: null },
    postalCode: { type: String, default: null },
    country: { type: String, default: null },
    isDefault: { type: Boolean, default: false }
  }],
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(v);
      },
      message: props => `${props.value} n'est pas un numéro de téléphone valide!`
    },
    default: null // Non obligatoire à l'inscription
  },
  termsAccepted: {
    type: Boolean,
    default: false // Non obligatoire à l'inscription
  },
  isSubscribedToNewsletter: {
    type: Boolean,
    default: false, // Par défaut, l'utilisateur n'est pas abonné
  },
  resetPasswordToken: {
    type: String,
    default: null // Non obligatoire à l'inscription
  },
  resetPasswordExpire: {
    type: Date,
    default: null // Non obligatoire à l'inscription
  },
  emailVerified: {
    type: Boolean,
    default: false // Non obligatoire à l'inscription
  },
  verificationToken: {
    type: String,
    default: null // Non obligatoire à l'inscription
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
}, {
  timestamps: true, // Ajoute automatiquement `createdAt` et `updatedAt`
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;