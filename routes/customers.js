const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const uid2 = require("uid2");

// Route pour récupérer tous les clients
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({ result: true, customers });
  } catch (error) {
    console.error("Erreur lors de la récupération des clients :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour récupérer un client spécifique par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ result: false, error: "Client non trouvé." });
    }

    res.status(200).json({ result: true, customer });
  } catch (error) {
    console.error("Erreur lors de la récupération du client :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour créer un nouveau client et un utilisateur associé
// Route pour créer un nouveau client et un utilisateur associé
router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      termsAccepted,
      password, // Ajout du champ password
    } = req.body;

    // Vérification des champs obligatoires
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !postalCode ||
      !country ||
      !password // Vérification du mot de passe
    ) {
      return res.status(400).json({ result: false, error: "Tous les champs sont obligatoires." });
    }

    // Vérification des termes et conditions
    if (!termsAccepted) {
      return res.status(400).json({
        result: false,
        error: "Vous devez accepter les termes et conditions pour continuer.",
      });
    }

    // Vérifier si un client avec cet e-mail existe déjà
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        result: false,
        error: "Un client avec cet e-mail existe déjà.",
      });
    }

    // Vérifier si un utilisateur avec cet e-mail existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        result: false,
        error: "Un utilisateur avec cet e-mail existe déjà.",
      });
    }

    // Hachage du mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Création du client
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
    });
    await newCustomer.save();

    // Création de l'utilisateur associé
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
      phone,
      token: uid2(32),
      termsAccepted: true,
      addresses: [
        {
          street: address,
          city,
          postalCode,
          country,
          isDefault: true,
        },
      ],
    });
    await newUser.save();

    res.status(201).json({
      result: true,
      message: "Client et utilisateur créés avec succès.",
      customer: newCustomer,
      user: newUser,
    });
  } catch (error) {
    console.error("Erreur lors de la création du client :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour créer une commande pour un client
router.post("/:id/orders", async (req, res) => {
  try {
    const { id } = req.params;
    const { items, totalAmount } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ result: false, error: "Client non trouvé." });
    }

    const newOrder = new Order({
      customer: id,
      items,
      totalAmount,
      status: "pending",
    });
    await newOrder.save();

    customer.orders.push(newOrder._id);
    await customer.save();

    res.status(201).json({ result: true, message: "Commande créée avec succès.", order: newOrder });
  } catch (error) {
    console.error("Erreur lors de la création de la commande :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour récupérer les commandes d'un client
router.get("/:id/orders", async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id).populate("orders");
    if (!customer) {
      return res.status(404).json({ result: false, error: "Client non trouvé." });
    }

    res.status(200).json({ result: true, orders: customer.orders });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour mettre à jour le statut d'une commande
router.patch("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ result: false, error: "Commande non trouvée." });
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ result: true, message: "Statut de la commande mis à jour.", order });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route pour associer une commande validée à un client
router.post("/confirm", async (req, res) => {
  try {
    const { customerId, items, totalAmount, sessionId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ result: false, error: "Client non trouvé." });
    }

    const newOrder = new Order({
      customer: customerId,
      items,
      totalAmount,
      status: "completed",
      sessionId,
    });
    await newOrder.save();

    customer.orders.push(newOrder._id);
    await customer.save();

    res.status(201).json({
      result: true,
      message: "Commande validée et associée au client.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Erreur lors de la confirmation de la commande :", error);
    res.status(500).json({ result: false, error: "Erreur interne du serveur." });
  }
});

module.exports = router;