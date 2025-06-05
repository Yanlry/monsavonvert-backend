require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('✅ MongoDB connecté avec succès'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

  
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var customersRouter = require('./routes/customers');
var stripeRoutes = require('./routes/stripe-webhook');
var stripeCheckoutRoutes = require('./routes/create-checkout');
var confirmOrderRouter = require('./routes/confirm-order');  
var ordersRouter = require('./routes/orders');

var app = express();

const PORT = process.env.PORT || 8888;  
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/stripe', stripeRoutes);
app.use('/api', stripeCheckoutRoutes);
app.use('/api', confirmOrderRouter); 
app.use('/orders', ordersRouter);

module.exports = app;