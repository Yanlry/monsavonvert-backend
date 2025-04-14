const express = require('express');
const router = express.Router();
const Product = require('../models/products');
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
router.post('/add', upload.single('image'), (req, res) => {
    console.log(req.file); // Vérifiez si l'image est bien reçue
  
    const { title, description, price, characteristics, stock, ingredients, usageTips } = req.body;
  
    if (!title || !description || !price || stock === undefined) {
      return res.status(400).json({ result: false, error: 'Champs obligatoires manquants.' });
    }
  
    const newProduct = new Product({
      title,
      description,
      price,
      characteristics,
      stock,
      ingredients,
      usageTips,
      image: req.file ? req.file.path : null, // URL de l'image sur Cloudinary
    });
  
    newProduct.save()
      .then(product => res.status(201).json({ result: true, product }))
      .catch(err => res.status(500).json({ result: false, error: 'Erreur lors de l\'ajout du produit.' }));
  });

// Récupérer tous les produits
router.get('/', (req, res) => {
  Product.find()
    .then(products => res.status(200).json({ result: true, products }))
    .catch(err => res.status(500).json({ result: false, error: 'Erreur lors de la récupération des produits.' }));
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
router.put('/update/:id', upload.single('image'), async (req, res) => {
    try {
      const updatedData = { ...req.body };
  
      // Si une nouvelle image est envoyée
      if (req.file) {
        // Récupérer le produit actuel pour supprimer l'ancienne image
        const existingProduct = await Product.findById(req.params.id);
        if (existingProduct && existingProduct.image) {
          // Supprimer l'ancienne image de Cloudinary
          const publicId = existingProduct.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
  
        // Ajouter la nouvelle image
        updatedData.image = req.file.path; // URL de l'image sur Cloudinary
      }
  
      // Mettre à jour le produit
      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ result: false, error: 'Produit introuvable.' });
      }
  
      res.status(200).json({ result: true, product: updatedProduct });
    } catch (err) {
      console.error(err);
      res.status(500).json({ result: false, error: 'Erreur lors de la mise à jour du produit.' });
    }
  });
  
// Supprimer un produit
router.delete('/delete/:id', (req, res) => {
  Product.findByIdAndDelete(req.params.id)
    .then(deletedProduct => {
      if (!deletedProduct) {
        return res.status(404).json({ result: false, error: 'Produit introuvable.' });
      }
      res.status(200).json({ result: true, message: 'Produit supprimé avec succès.' });
    })
    .catch(err => res.status(500).json({ result: false, error: 'Erreur lors de la suppression du produit.' }));
});

module.exports = router;