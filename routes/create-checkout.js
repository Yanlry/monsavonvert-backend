const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout", express.json(), async (req, res) => {
  try {
    console.log("📌 Requête de création de session Stripe reçue");
    
    // Récupérer les données de la requête
    const { items, shippingCost, shippingMethod, email, customerInfo } = req.body;

    console.log("📋 Données reçues:", { 
      itemsCount: items.length, 
      shippingCost, 
      shippingMethod, 
      email, 
      customerInfo 
    });

    // Vérifier les données essentielles
    if (!items || items.length === 0) {
      console.error("❌ Aucun article fourni pour la création de la session");
      return res.status(400).json({ error: "Les articles sont requis" });
    }

    if (!email) {
      console.error("❌ Aucun email fourni pour la création de la session");
      return res.status(400).json({ error: "Email client requis" });
    }

    // Créer les lignes de produits pour Stripe
    const lineItems = items.map((item) => {
      // Vérifier les données de l'article
      if (!item.name || item.price === undefined || item.quantity === undefined) {
        console.error("❌ Article invalide:", item);
        throw new Error(`Article invalide: ${JSON.stringify(item)}`);
      }

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100), // Conversion en centimes
        },
        quantity: item.quantity,
      };
    });

    console.log(`✅ ${lineItems.length} articles transformés pour Stripe`);

    // Ajouter les frais de livraison si nécessaire
    if (shippingCost > 0) {
      console.log(`📦 Ajout des frais de livraison: ${shippingCost}€ (${shippingMethod})`);
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: shippingMethod === "express" ? "Livraison express" : "Livraison standard",
          },
          unit_amount: Math.round(shippingCost * 100), // Conversion en centimes
        },
        quantity: 1,
      });
    }

    // Calculer le montant total
    const totalAmount = parseFloat(shippingCost) + items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log(`💰 Montant total calculé: ${totalAmount}€`);

    // Simplifier les items pour les métadonnées
    const simplifiedItems = items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      ...(item.image ? { image: item.image } : {})
    }));

    // Créer la session de paiement Stripe
    console.log("🔄 Création de la session Stripe...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection:
        shippingMethod !== "pickup"
          ? {
              allowed_countries: ["FR", "BE", "CH", "LU", "CA"],
            }
          : undefined,
      customer_email: email,
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
      metadata: {
        firstName: customerInfo.firstName || "",
        lastName: customerInfo.lastName || "",
        phone: customerInfo.phone || "",
        address: customerInfo.address || "",
        city: customerInfo.city || "",
        postalCode: customerInfo.postalCode || "",
        country: customerInfo.country || "",
        shippingMethod,
        items: JSON.stringify(simplifiedItems),
        totalAmount: totalAmount.toString(),
      },
    });

    // Retourner l'ID de session et l'URL au client
    console.log("✅ Session Stripe créée avec succès, ID:", session.id);
    res.status(200).json({ 
      success: true,
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la session Stripe:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Erreur interne du serveur" 
    });
  }
});

module.exports = router;