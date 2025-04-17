const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Importer le modèle Product
const multer = require('multer'); // Importer multer
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Importer CloudinaryStorage
const cloudinary = require('cloudinary').v2; // Importer Cloudinary

// Configurer Cloudinary
cloudinary.config({
  cloud_name: 'dk9tkqs0t', // Remplacez par votre Cloud Name
  api_key: '871371399894135',       // Remplacez par votre API Key
  api_secret: '47uVVjxagVkZ58AF8d_jhWdY8-g', // Remplacez par votre API Secret
});

// Configurer le stockage avec multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Dossier dans lequel les images seront stockées sur Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Formats autorisés
  },
});

const upload = multer({ storage }); // Utiliser multer avec CloudinaryStorage

// Ajouter un produit
router.post('/add', upload.array('images', 5), (req, res) => { // Accepter jusqu'à 5 images
    console.log("Fichiers reçus:", req.files); // Log pour déboguer
  
    const { title, description, price, characteristics, stock, ingredients, usageTips } = req.body;
  
    if (!title || !description || !price || stock === undefined) {
      return res.status(400).json({ result: false, error: 'Champs obligatoires manquants.' });
    }
  
    // Extraire les URLs des images téléchargées
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    
    console.log("URLs des images:", imageUrls); // Log pour déboguer
  
    const newProduct = new Product({
      title,
      description,
      price,
      characteristics,
      stock,
      ingredients,
      usageTips,
      images: imageUrls, // Stocker le tableau d'URLs
    });
  
    newProduct.save()
      .then(product => res.status(201).json({ result: true, product }))
      .catch(err => {
        console.error("Erreur lors de l'enregistrement:", err);
        res.status(500).json({ result: false, error: 'Erreur lors de l\'ajout du produit.' });
      });
  });

// Récupérer tous les produits
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('Produits récupérés :', products); // 👈 Ajout pour debug
    res.status(200).json({ result: true, products });
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err); // 👈 Log utile pour Render logs
    res.status(500).json({ result: false, error: 'Erreur lors de la récupération des produits.' });
  }
});


// Récupérer un produit par ID
router.get('/:id', (req, res) => {
  Product.findById(req.params.id)
    .then(product => {
      if (!product) {
        return res.status(404).json({ result: false, error: 'Produit introuvable.' });
      }
      res.status(200).json({ result: true, product });
    })
    .catch(err => res.status(500).json({ result: false, error: 'Erreur lors de la récupération du produit.' }));
});

// Mettre à jour un produit
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
  try {
    console.log("Données reçues :", req.body); // Log des données reçues
    console.log("Fichiers reçus :", req.files); // Log des fichiers reçus

    const { title, description, price, stock, characteristics, ingredients, usageTips } = req.body;

    // Parser les images existantes
    let existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    console.log("Images existantes avant filtrage :", existingImages);

    // Filtrer les images existantes pour ne garder que les chaînes de caractères valides
    existingImages = existingImages.filter((image) => typeof image === 'string' && image.trim() !== '');
    console.log("Images existantes après filtrage :", existingImages);

    // Ajouter les nouvelles images
    const newImages = req.files.map((file) => file.path);
    console.log("Nouvelles images :", newImages);

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        price,
        stock,
        characteristics,
        ingredients,
        usageTips,
        images: [...existingImages, ...newImages], // Conserver les anciennes images et ajouter les nouvelles
      },
      { new: true }
    );

    res.status(200).json({ result: true, product: updatedProduct });
  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
    res.status(500).json({ result: false, error: 'Erreur lors de la mise à jour du produit.' });
  }
});
  
// Supprimer un produit
router.delete('/delete/:id', async (req, res) => {
  try {
    // Récupérer le produit pour supprimer ses images
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ result: false, error: 'Produit introuvable.' });
    }
    
    // Supprimer les images de Cloudinary
    if (product.images && product.images.length > 0) {
      console.log("Suppression des images du produit:", product.images);
      
      for (const imageUrl of product.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          console.log("Image supprimée:", publicId);
        } catch (error) {
          console.error("Erreur lors de la suppression de l'image:", error);
          // Continuer même en cas d'erreur
        }
      }
    }
    
    // Supprimer le produit de la base de données
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ result: true, message: 'Produit supprimé avec succès.' });
  } catch (err) {
    console.error("Erreur lors de la suppression:", err);
    res.status(500).json({ result: false, error: 'Erreur lors de la suppression du produit.' });
  }
});

// Ajouter un commentaire à un produit
router.post('/:id/review', async (req, res) => {
  try {
    console.log("Données reçues par le backend :", req.body);

    const { firstName, lastName, comment, rating } = req.body;

    // Vérifiez que tous les champs sont présents
    if (!firstName || !lastName || !comment || !rating) {
      return res.status(400).json({ result: false, error: 'Champs obligatoires manquants.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ result: false, error: 'La note doit être comprise entre 1 et 5.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ result: false, error: 'Produit introuvable.' });
    }

    // Concaténer firstName et lastName pour le champ user
    const user = `${firstName} ${lastName}`;

    product.reviews.push({
      user,
      comment,
      rating,
    });

    await product.save();

    res.status(201).json({ result: true, message: 'Commentaire ajouté avec succès.', product });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du commentaire :', err);
    res.status(500).json({ result: false, error: 'Erreur lors de l\'ajout du commentaire.' });
  }
});

module.exports = router;