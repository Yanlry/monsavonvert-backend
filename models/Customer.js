const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  reviews: [
    {
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Middleware pour convertir les champs en minuscule avant de sauvegarder
customerSchema.pre('save', function (next) {
  this.firstName = this.firstName.toLowerCase();
  this.lastName = this.lastName.toLowerCase();
  this.email = this.email.toLowerCase();
  this.address = this.address.toLowerCase();
  this.city = this.city.toLowerCase();
  this.country = this.country.toLowerCase();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);