const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // AJOUTÉ : Pour hasher les mots de passe

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
    lowercase: true // Convertit automatiquement l'email en minuscule
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
    required: [true, 'Vous devez accepter les termes et conditions pour créer un compte.'],
    default: false,
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

// AJOUTÉ : Middleware pour hasher le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  // Si le mot de passe n'a pas été modifié, passer au middleware suivant
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hasher le mot de passe avec bcrypt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pour formater les champs avant de sauvegarder (TON CODE EXISTANT)
userSchema.pre('save', function (next) {
  if (this.firstName) {
    this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  }
  if (this.lastName) {
    this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();
  }
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  if (this.addresses && this.addresses.length > 0) {
    this.addresses = this.addresses.map(address => ({
      ...address,
      street: address.street ? address.street.toLowerCase() : null,
      city: address.city ? address.city.toLowerCase() : null,
      country: address.country ? address.country.toLowerCase() : null,
    }));
  }
  next();
});

// AJOUTÉ : Méthode pour comparer les mots de passe lors de la connexion
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// AJOUTÉ : Méthode pour générer un token de récupération de mot de passe
userSchema.methods.generateResetPasswordToken = function() {
  // Générer un token aléatoire de 32 caractères
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  // Hasher le token avant de le sauvegarder en base de données
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Définir l'expiration du token (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Retourner le token non hashé (c'est celui qu'on enverra par email)
  return resetToken;
};

// AJOUTÉ : Méthode pour vérifier si le token de récupération est valide
userSchema.methods.isResetPasswordTokenValid = function(token) {
  // Hasher le token reçu pour le comparer avec celui en base
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Vérifier si le token correspond et n'est pas expiré
  return (
    this.resetPasswordToken === hashedToken &&
    this.resetPasswordExpire > Date.now()
  );
};

// AJOUTÉ : Méthode pour nettoyer les tokens de récupération après utilisation
userSchema.methods.clearResetPasswordToken = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpire = null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;