const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Importer le modèle Product
const User = require('../models/user'); // AJOUT : Import du modèle User pour l'authentification
const multer = require('multer'); // Importer multer
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Importer CloudinaryStorage
const cloudinary = require('cloudinary').v2; // Importer Cloudinary

// Configurer Cloudinary
cloudinary.config({
  cloud_name: 'dk9tkqs0t',
  api_key: '871371399894135',
  api_secret: '47uVVjxagVkZ58AF8d_jhWdY8-g',
});

// Configurer le stockage avec multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// MIDDLEWARE D'AUTHENTIFICATION CORRIGÉ - Compatible avec vos tokens uid2
const authenticateToken = async (req, res, next) => {
  console.log('🔐 Vérification du token d\'authentification');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.error('❌ Token manquant');
    return res.status(401).json({ 
      result: false, 
      error: 'Token d\'authentification requis' 
    });
  }

  try {
    console.log('🔍 Recherche utilisateur avec token:', token.substring(0, 10) + '...');
    
    // Chercher l'utilisateur par token (même méthode que /users/me)
    const user = await User.findOne({ token: token });
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé avec ce token');
      return res.status(403).json({ 
        result: false, 
        error: 'Token invalide' 
      });
    }
    
    console.log('✅ Utilisateur authentifié:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    
    // Ajouter les informations utilisateur à la requête (format exact attendu)
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'user'
    };
    
    next();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    return res.status(500).json({ 
      result: false, 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// Ajouter un produit
router.post('/add', upload.array('images', 5), (req, res) => {
  console.log("Fichiers reçus:", req.files);

  const { title, description, price, characteristics, stock, ingredients, usageTips } = req.body;

  if (!title || !description || !price || stock === undefined) {
    return res.status(400).json({ result: false, error: 'Champs obligatoires manquants.' });
  }

  const imageUrls = req.files ? req.files.map(file => file.path) : [];
  
  console.log("URLs des images:", imageUrls);

  const newProduct = new Product({
    title,
    description,
    price,
    characteristics,
    stock,
    ingredients,
    usageTips,
    images: imageUrls,
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
    console.log('Produits récupérés :', products.length, 'produits');
    res.status(200).json({ result: true, products });
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err);
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
    console.log("Données reçues :", req.body);
    console.log("Fichiers reçus :", req.files);

    const { title, description, price, stock, characteristics, ingredients, usageTips } = req.body;

    let existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    console.log("Images existantes avant filtrage :", existingImages);

    existingImages = existingImages.filter((image) => typeof image === 'string' && image.trim() !== '');
    console.log("Images existantes après filtrage :", existingImages);

    const newImages = req.files.map((file) => file.path);
    console.log("Nouvelles images :", newImages);

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
        images: [...existingImages, ...newImages],
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
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ result: false, error: 'Produit introuvable.' });
    }
    
    if (product.images && product.images.length > 0) {
      console.log("Suppression des images du produit:", product.images);
      
      for (const imageUrl of product.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          console.log("Image supprimée:", publicId);
        } catch (error) {
          console.error("Erreur lors de la suppression de l'image:", error);
        }
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ result: true, message: 'Produit supprimé avec succès.' });
  } catch (err) {
    console.error("Erreur lors de la suppression:", err);
    res.status(500).json({ result: false, error: 'Erreur lors de la suppression du produit.' });
  }
});

// AJOUTER UN AVIS - Avec authentification corrigée
router.post('/:id/review', authenticateToken, async (req, res) => {
  console.log('📝 Ajout d\'un nouvel avis');
  console.log('🔍 Product ID:', req.params.id);
  console.log('👤 Utilisateur authentifié:', req.user);
  console.log('📦 Données reçues:', req.body);

  try {
    const { firstName, lastName, comment, rating } = req.body;

    // Validation des données
    if (!firstName || !lastName || !comment || !rating) {
      console.error('❌ Données manquantes:', { firstName, lastName, comment, rating });
      return res.status(400).json({
        result: false,
        error: 'Tous les champs sont obligatoires (firstName, lastName, comment, rating)'
      });
    }

    if (rating < 1 || rating > 5) {
      console.error('❌ Note invalide:', rating);
      return res.status(400).json({
        result: false,
        error: 'La note doit être entre 1 et 5'
      });
    }

    if (comment.trim().length < 10) {
      console.error('❌ Commentaire trop court');
      return res.status(400).json({
        result: false,
        error: 'Le commentaire doit contenir au moins 10 caractères'
      });
    }

    // Rechercher le produit
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    // Créer le nouvel avis avec toutes les informations nécessaires
    const newReview = {
      userId: req.user.userId || req.user.id, // CRUCIAL : ID pour la suppression
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      user: `${firstName.trim()} ${lastName.trim()}`, // Pour compatibilité
      rating: parseInt(rating, 10),
      comment: comment.trim(),
      createdAt: new Date()
    };

    console.log('✅ Nouvel avis créé avec userId:', newReview);

    // Initialiser reviews s'il n'existe pas
    if (!product.reviews) {
      product.reviews = [];
    }

    // Ajouter l'avis
    product.reviews.push(newReview);
    await product.save();

    // Récupérer l'avis ajouté avec son _id généré par MongoDB
    const addedReview = product.reviews[product.reviews.length - 1];

    console.log('✅ Avis sauvegardé avec succès, _id:', addedReview._id);

    res.json({
      result: true,
      review: addedReview, // Retourner l'avis complet avec _id
      message: 'Avis ajouté avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de l\'ajout de l\'avis'
    });
  }
});

// SUPPRIMER UN AVIS - Avec gestion des anciens avis
router.delete('/:productId/review/:reviewId', authenticateToken, async (req, res) => {
  console.log('🗑️ Tentative de suppression d\'avis');
  console.log('🔍 Product ID:', req.params.productId);
  console.log('🔍 Review ID:', req.params.reviewId);
  console.log('👤 Utilisateur authentifié:', req.user);

  try {
    // Rechercher le produit
    const product = await Product.findById(req.params.productId);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    // Rechercher l'avis
    const reviewIndex = product.reviews.findIndex(
      review => review._id.toString() === req.params.reviewId
    );

    if (reviewIndex === -1) {
      console.error('❌ Avis non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Avis non trouvé'
      });
    }

    const review = product.reviews[reviewIndex];
    console.log('🔍 Avis trouvé:', review);

    // Récupérer les informations de l'utilisateur authentifié
    const currentUserId = req.user.userId || req.user.id;
    const currentUserFirstName = req.user.firstName;
    const currentUserLastName = req.user.lastName;
    const isAdmin = req.user.role === 'admin';

    console.log('👤 Utilisateur current:', {
      userId: currentUserId,
      firstName: currentUserFirstName,
      lastName: currentUserLastName,
      role: req.user.role
    });

    // Vérifier les droits de suppression - LOGIQUE AMÉLIORÉE
    let canDelete = false;
    let deleteReason = '';

    // 1. Si l'utilisateur est admin, il peut tout supprimer
    if (isAdmin) {
      canDelete = true;
      deleteReason = 'Admin rights';
    }
    // 2. Si l'avis a un userId (nouveaux avis), vérifier par ID
    else if (review.userId) {
      canDelete = review.userId === currentUserId;
      deleteReason = 'Author by userId';
    }
    // 3. Pour les anciens avis (sans userId), vérifier par nom
    else if (review.firstName && review.lastName && currentUserFirstName && currentUserLastName) {
      const reviewFullName = `${review.firstName} ${review.lastName}`.toLowerCase().trim();
      const userFullName = `${currentUserFirstName} ${currentUserLastName}`.toLowerCase().trim();
      canDelete = reviewFullName === userFullName;
      deleteReason = 'Author by name (legacy review)';
    }
    // 4. Dernière tentative avec le champ 'user' (nom complet)
    else if (review.user && currentUserFirstName && currentUserLastName) {
      const reviewName = review.user.toLowerCase().trim();
      const userName = `${currentUserFirstName} ${currentUserLastName}`.toLowerCase().trim();
      canDelete = reviewName === userName;
      deleteReason = 'Author by full name (legacy review)';
    }

    console.log('🔐 Vérification des droits détaillée:', {
      currentUserId,
      reviewUserId: review.userId || 'undefined',
      currentUserFullName: `${currentUserFirstName} ${currentUserLastName}`,
      reviewAuthor: review.user || `${review.firstName} ${review.lastName}`,
      isAdmin,
      canDelete,
      deleteReason
    });

    if (!canDelete) {
      console.error('❌ Droits insuffisants pour la suppression');
      return res.status(403).json({
        result: false,
        error: 'Vous n\'avez pas les droits pour supprimer cet avis'
      });
    }

    // Supprimer l'avis
    product.reviews.splice(reviewIndex, 1);
    await product.save();

    console.log(`✅ Avis supprimé avec succès (${deleteReason})`);

    res.json({
      result: true,
      message: 'Avis supprimé avec succès',
      deleteReason: deleteReason
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de la suppression de l\'avis'
    });
  }
});

// ROUTE DE TEST TEMPORAIRE - À supprimer après debug
router.get('/test-auth', authenticateToken, (req, res) => {
  console.log('🧪 ROUTE DE TEST - Utilisateur authentifié:', req.user);
  res.json({
    result: true,
    message: 'Authentification fonctionne !',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// RÉCUPÉRER TOUS LES AVIS D'UN PRODUIT (optionnel)
router.get('/:id/reviews', async (req, res) => {
  console.log('📋 Récupération des avis du produit:', req.params.id);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    console.log('✅ Avis récupérés:', product.reviews?.length || 0, 'avis');

    res.json({
      result: true,
      reviews: product.reviews || [],
      totalReviews: product.reviews?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de la récupération des avis'
    });
  }
});

module.exports = router;