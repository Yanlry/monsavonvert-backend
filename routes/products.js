// Fichier : routes/products.js
// 🔒 Version sécurisée avec variables d'environnement

// ✅ Charger les variables d'environnement AVANT tout le reste
require('dotenv').config();

const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Assure-toi que ce chemin est correct
const User = require('../models/user'); // Import du modèle User
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// 🔍 LOGS DE DÉBOGAGE POUR LES VARIABLES D'ENVIRONNEMENT
console.log('🔧 Vérification des variables d\'environnement Cloudinary :');
console.log('✅ CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Défini' : '❌ MANQUANT');
console.log('✅ API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Défini' : '❌ MANQUANT');
console.log('✅ API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Défini' : '❌ MANQUANT');

// 🛡️ CONFIGURATION SÉCURISÉE DE CLOUDINARY
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ ERREUR CRITIQUE : Variables Cloudinary manquantes dans le fichier .env');
  console.error('📝 Assure-toi d\'avoir un fichier .env avec :');
  console.error('   - CLOUDINARY_CLOUD_NAME=ton_cloud_name');
  console.error('   - CLOUDINARY_API_KEY=ton_api_key');
  console.error('   - CLOUDINARY_API_SECRET=ton_api_secret');
  process.exit(1); // Arrêter l'application si les credentials manquent
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('✅ Cloudinary configuré avec succès !');

// 📁 CONFIGURATION DU STOCKAGE AVEC GESTION D'ERREURS
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Dossier sur Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Formats autorisés
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Limiter la taille
      { quality: 'auto' } // Optimisation automatique
    ]
  },
});

// 📤 CONFIGURATION DE MULTER AVEC LIMITES
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite à 5MB par fichier
    files: 5 // Maximum 5 fichiers
  },
  fileFilter: (req, file, cb) => {
    console.log('📋 Vérification du fichier:', file.originalname, 'Type:', file.mimetype);
    
    // Vérifier le type MIME
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.error('❌ Type de fichier non autorisé:', file.mimetype);
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// 🔐 MIDDLEWARE D'AUTHENTIFICATION
const authenticateToken = async (req, res, next) => {
  console.log('🔐 === DÉBUT AUTHENTIFICATION ===');
  console.log('🕐 Timestamp:', new Date().toISOString());
  
  const authHeader = req.headers['authorization'];
  console.log('📋 Auth header présent:', !!authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.error('❌ Token manquant dans l\'en-tête Authorization');
    console.log('💡 Format attendu: Authorization: Bearer YOUR_TOKEN');
    return res.status(401).json({ 
      result: false, 
      error: 'Token d\'authentification requis',
      debug: 'Aucun token fourni dans l\'en-tête Authorization'
    });
  }

  try {
    console.log('🔍 Recherche utilisateur avec token:', token.substring(0, 10) + '...');
    
    const user = await User.findOne({ token: token });
    
    if (!user) {
      console.error('❌ Aucun utilisateur trouvé avec ce token');
      return res.status(403).json({ 
        result: false, 
        error: 'Token invalide',
        debug: 'Utilisateur non trouvé en base de données'
      });
    }
    
    console.log('✅ Utilisateur authentifié avec succès:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'user'
    };
    
    console.log('🔐 === FIN AUTHENTIFICATION RÉUSSIE ===');
    next();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification:', error);
    return res.status(500).json({ 
      result: false, 
      error: 'Erreur serveur lors de l\'authentification',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ ===== ROUTES DANS LE BON ORDRE =====
// IMPORTANT: Les routes spécifiques DOIVENT être définies AVANT les routes génériques avec paramètres

// 📋 RÉCUPÉRER TOUS LES PRODUITS
router.get('/', async (req, res) => {
  console.log('📋 === RÉCUPÉRATION DE TOUS LES PRODUITS ===');
  
  try {
    const startTime = Date.now();
    const products = await Product.find().sort({ createdAt: -1 }); // Plus récents en premier
    const endTime = Date.now();
    
    console.log('✅ Produits récupérés:', products.length, 'produit(s)');
    console.log('⏱️ Temps de requête:', endTime - startTime, 'ms');
    
    // 📊 STATISTIQUES
    const stats = {
      total: products.length,
      withImages: products.filter(p => p.images && p.images.length > 0).length,
      inStock: products.filter(p => p.stock > 0).length,
      outOfStock: products.filter(p => p.stock === 0).length
    };
    
    console.log('📊 Statistiques:', stats);
    
    res.status(200).json({ 
      result: true, 
      products,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la récupération des produits',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🧪 ROUTE DE TEST AUTHENTIFICATION (AVANT /:id)
router.get('/test-auth', authenticateToken, (req, res) => {
  console.log('🧪 === TEST AUTHENTIFICATION ===');
  console.log('👤 Utilisateur authentifié:', req.user);
  
  res.json({
    result: true,
    message: '🎉 Authentification fonctionne parfaitement !',
    user: req.user,
    timestamp: new Date().toISOString(),
    cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME
  });
});

// 📊 ROUTE DE STATISTIQUES ADMIN (AVANT /:id)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  console.log('📊 === STATISTIQUES ADMIN ===');
  
  try {
    // Vérifier que c'est un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        result: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const products = await Product.find();
    
    const stats = {
      totalProducts: products.length,
      totalReviews: products.reduce((sum, p) => sum + (p.reviews?.length || 0), 0),
      averagePrice: products.length > 0 
        ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)
        : 0,
      outOfStock: products.filter(p => p.stock === 0).length,
      withImages: products.filter(p => p.images && p.images.length > 0).length,
      totalImages: products.reduce((sum, p) => sum + (p.images?.length || 0), 0)
    };

    console.log('📊 Statistiques calculées:', stats);

    res.json({
      result: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Erreur calcul statistiques:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur lors du calcul des statistiques'
    });
  }
});

// 📤 AJOUTER UN PRODUIT (AVANT /:id)
router.post('/add', upload.array('images', 5), async (req, res) => {
  console.log('📤 === AJOUT D\'UN NOUVEAU PRODUIT ===');
  console.log('📋 Données reçues:', req.body);
  console.log('🖼️ Fichiers reçus:', req.files?.length || 0, 'fichier(s)');

  try {
    const { title, description, price, characteristics, stock, ingredients, usageTips } = req.body;

    // ✅ VALIDATION DES DONNÉES
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!price) missingFields.push('price');
    if (stock === undefined || stock === null) missingFields.push('stock');

    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return res.status(400).json({ 
        result: false, 
        error: 'Champs obligatoires manquants',
        missingFields: missingFields
      });
    }

    // 🖼️ TRAITEMENT DES IMAGES
    const imageUrls = req.files ? req.files.map(file => {
      console.log('✅ Image uploadée:', file.path);
      return file.path;
    }) : [];
    
    console.log('📊 Résumé du produit à créer:', {
      title,
      price: parseFloat(price),
      stock: parseInt(stock),
      imagesCount: imageUrls.length
    });

    // 💾 CRÉATION DU PRODUIT
    const newProduct = new Product({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      characteristics: characteristics ? characteristics.trim() : '',
      stock: parseInt(stock),
      ingredients: ingredients ? ingredients.trim() : '',
      usageTips: usageTips ? usageTips.trim() : '',
      images: imageUrls,
      createdAt: new Date()
    });

    const savedProduct = await newProduct.save();
    
    console.log('✅ Produit créé avec succès, ID:', savedProduct._id);
    
    res.status(201).json({ 
      result: true, 
      product: savedProduct,
      message: `Produit "${title}" créé avec ${imageUrls.length} image(s)`
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du produit:', error);
    
    // 🧹 NETTOYAGE : Supprimer les images uploadées en cas d'erreur
    if (req.files && req.files.length > 0) {
      console.log('🧹 Nettoyage des images uploadées suite à l\'erreur...');
      for (const file of req.files) {
        try {
          const publicId = file.path.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
          console.log('🗑️ Image supprimée:', publicId);
        } catch (cleanupError) {
          console.error('⚠️ Erreur lors du nettoyage:', cleanupError.message);
        }
      }
    }
    
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de l\'ajout du produit',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔍 RÉCUPÉRER UN PRODUIT PAR ID (MAINTENANT APRÈS LES ROUTES SPÉCIFIQUES)
router.get('/:id', async (req, res) => {
  console.log('🔍 === RÉCUPÉRATION PRODUIT PAR ID ===');
  console.log('🆔 ID recherché:', req.params.id);

  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      console.error('❌ Produit non trouvé avec l\'ID:', req.params.id);
      return res.status(404).json({ 
        result: false, 
        error: 'Produit introuvable',
        productId: req.params.id
      });
    }
    
    console.log('✅ Produit trouvé:', {
      title: product.title,
      stock: product.stock,
      images: product.images?.length || 0,
      reviews: product.reviews?.length || 0
    });
    
    res.status(200).json({ 
      result: true, 
      product 
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du produit:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la récupération du produit',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📋 RÉCUPÉRER AVIS D'UN PRODUIT (APRÈS /:id mais avec pattern spécifique)
router.get('/:id/reviews', async (req, res) => {
  console.log('📋 === RÉCUPÉRATION AVIS PRODUIT ===');
  console.log('🆔 Product ID:', req.params.id);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    const reviews = product.reviews || [];
    console.log('✅ Avis récupérés:', reviews.length, 'avis');

    // 📊 STATISTIQUES AVIS
    const stats = {
      total: reviews.length,
      averageRating: reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      }
    };

    console.log('📊 Stats avis:', stats);

    res.json({
      result: true,
      reviews: reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), // Plus récents en premier
      stats: stats,
      productTitle: product.title
    });

  } catch (error) {
    console.error('❌ Erreur récupération avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de la récupération des avis',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✏️ METTRE À JOUR UN PRODUIT
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
  console.log('✏️ === MISE À JOUR PRODUIT ===');
  console.log('🆔 ID produit:', req.params.id);
  console.log('📋 Données reçues:', req.body);
  console.log('🖼️ Nouveaux fichiers:', req.files?.length || 0);

  try {
    const { title, description, price, stock, characteristics, ingredients, usageTips } = req.body;

    // 🖼️ GESTION DES IMAGES EXISTANTES
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
        console.log('📋 Images existantes parsées:', existingImages.length);
      } catch (parseError) {
        console.error('❌ Erreur parsing existingImages:', parseError);
        existingImages = [];
      }
    }

    // Filtrer les images valides
    existingImages = existingImages.filter(image => 
      typeof image === 'string' && image.trim() !== ''
    );
    
    console.log('✅ Images existantes valides:', existingImages.length);

    // 🖼️ NOUVELLES IMAGES
    const newImages = req.files ? req.files.map(file => {
      console.log('✅ Nouvelle image uploadée:', file.path);
      return file.path;
    }) : [];

    console.log('📊 Résumé images:', {
      existantes: existingImages.length,
      nouvelles: newImages.length,
      total: existingImages.length + newImages.length
    });

    // 💾 MISE À JOUR DU PRODUIT
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title: title?.trim(),
        description: description?.trim(),
        price: price ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        characteristics: characteristics?.trim(),
        ingredients: ingredients?.trim(),
        usageTips: usageTips?.trim(),
        images: [...existingImages, ...newImages],
        updatedAt: new Date()
      },
      { new: true, runValidators: true } // Retourner le document mis à jour + validation
    );

    if (!updatedProduct) {
      console.error('❌ Produit non trouvé pour mise à jour');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    console.log('✅ Produit mis à jour avec succès:', {
      id: updatedProduct._id,
      title: updatedProduct.title,
      imagesTotal: updatedProduct.images.length
    });

    res.status(200).json({ 
      result: true, 
      product: updatedProduct,
      message: 'Produit mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la mise à jour du produit',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🗑️ SUPPRIMER UN PRODUIT
router.delete('/delete/:id', async (req, res) => {
  console.log('🗑️ === SUPPRESSION PRODUIT ===');
  console.log('🆔 ID à supprimer:', req.params.id);

  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      console.error('❌ Produit non trouvé pour suppression');
      return res.status(404).json({ 
        result: false, 
        error: 'Produit introuvable' 
      });
    }
    
    console.log('📋 Produit à supprimer:', {
      title: product.title,
      images: product.images?.length || 0
    });
    
    // 🖼️ SUPPRESSION DES IMAGES DE CLOUDINARY
    if (product.images && product.images.length > 0) {
      console.log('🧹 Suppression des images de Cloudinary...');
      
      for (const imageUrl of product.images) {
        try {
          // Extraire le public_id de l'URL Cloudinary
          const urlParts = imageUrl.split('/');
          const fileWithExtension = urlParts[urlParts.length - 1];
          const publicId = `products/${fileWithExtension.split('.')[0]}`;
          
          console.log('🗑️ Suppression image:', publicId);
          
          const result = await cloudinary.uploader.destroy(publicId);
          
          if (result.result === 'ok') {
            console.log('✅ Image supprimée avec succès:', publicId);
          } else {
            console.warn('⚠️ Image peut-être déjà supprimée:', publicId, result);
          }
          
        } catch (imageError) {
          console.error('❌ Erreur suppression image:', imageError.message);
          // Continue malgré l'erreur pour supprimer les autres images
        }
      }
    }
    
    // 🗑️ SUPPRESSION DU PRODUIT DE LA BASE
    await Product.findByIdAndDelete(req.params.id);
    
    console.log('✅ Produit supprimé avec succès de la base de données');
    
    res.status(200).json({ 
      result: true, 
      message: `Produit "${product.title}" supprimé avec succès`,
      deletedImages: product.images?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    res.status(500).json({ 
      result: false, 
      error: 'Erreur lors de la suppression du produit',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📝 AJOUTER UN AVIS
router.post('/:id/review', authenticateToken, async (req, res) => {
  console.log('📝 === AJOUT NOUVEL AVIS ===');
  console.log('🆔 Product ID:', req.params.id);
  console.log('👤 Utilisateur:', req.user?.firstName, req.user?.lastName);
  console.log('📦 Données avis:', req.body);

  try {
    const { firstName, lastName, comment, rating } = req.body;

    // ✅ VALIDATION COMPLÈTE
    const errors = [];
    
    if (!firstName?.trim()) errors.push('Prénom requis');
    if (!lastName?.trim()) errors.push('Nom requis');
    if (!comment?.trim()) errors.push('Commentaire requis');
    if (!rating) errors.push('Note requise');
    
    if (comment?.trim().length < 10) {
      errors.push('Le commentaire doit contenir au moins 10 caractères');
    }
    
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      errors.push('La note doit être entre 1 et 5');
    }

    if (errors.length > 0) {
      console.error('❌ Erreurs de validation:', errors);
      return res.status(400).json({
        result: false,
        error: 'Données invalides',
        errors: errors
      });
    }

    // 🔍 VÉRIFICATION PRODUIT
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

    // 📝 CRÉATION AVIS
    const newReview = {
      userId: req.user.userId || req.user.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      user: `${firstName.trim()} ${lastName.trim()}`,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date()
    };

    console.log('✅ Nouvel avis créé:', {
      userId: newReview.userId,
      author: newReview.user,
      rating: newReview.rating,
      commentLength: newReview.comment.length
    });

    // 💾 SAUVEGARDE
    if (!product.reviews) {
      product.reviews = [];
    }

    product.reviews.push(newReview);
    await product.save();

    const addedReview = product.reviews[product.reviews.length - 1];

    console.log('✅ Avis sauvegardé, _id:', addedReview._id);

    res.json({
      result: true,
      review: addedReview,
      message: 'Avis ajouté avec succès',
      productTitle: product.title
    });

  } catch (error) {
    console.error('❌ Erreur ajout avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de l\'ajout de l\'avis',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🗑️ SUPPRIMER UN AVIS
router.delete('/:productId/review/:reviewId', authenticateToken, async (req, res) => {
  console.log('🗑️ === SUPPRESSION AVIS ===');
  console.log('🆔 Product ID:', req.params.productId);
  console.log('🆔 Review ID:', req.params.reviewId);
  console.log('👤 Utilisateur:', req.user);

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      console.error('❌ Produit non trouvé');
      return res.status(404).json({
        result: false,
        error: 'Produit non trouvé'
      });
    }

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
    console.log('🔍 Avis trouvé:', {
      id: review._id,
      author: review.user,
      userId: review.userId
    });

    // 🔐 VÉRIFICATION DROITS
    const currentUserId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let canDelete = false;
    let deleteReason = '';

    if (isAdmin) {
      canDelete = true;
      deleteReason = 'Droits administrateur';
    } else if (review.userId && review.userId === currentUserId) {
      canDelete = true;
      deleteReason = 'Auteur de l\'avis (par ID)';
    } else if (req.user.firstName && req.user.lastName) {
      const currentUserName = `${req.user.firstName} ${req.user.lastName}`.toLowerCase().trim();
      const reviewAuthorName = review.user?.toLowerCase().trim();
      
      if (currentUserName === reviewAuthorName) {
        canDelete = true;
        deleteReason = 'Auteur de l\'avis (par nom)';
      }
    }

    console.log('🔐 Vérification droits:', {
      canDelete,
      deleteReason,
      isAdmin,
      currentUserId,
      reviewUserId: review.userId
    });

    if (!canDelete) {
      console.error('❌ Droits insuffisants');
      return res.status(403).json({
        result: false,
        error: 'Vous n\'avez pas les droits pour supprimer cet avis'
      });
    }

    // 🗑️ SUPPRESSION
    product.reviews.splice(reviewIndex, 1);
    await product.save();

    console.log(`✅ Avis supprimé avec succès (${deleteReason})`);

    res.json({
      result: true,
      message: 'Avis supprimé avec succès',
      deleteReason: deleteReason
    });

  } catch (error) {
    console.error('❌ Erreur suppression avis:', error);
    res.status(500).json({
      result: false,
      error: 'Erreur serveur lors de la suppression de l\'avis',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ === MODULE ROUTES PRODUITS CHARGÉ ===');
console.log('🔧 Configuration:', {
  environment: process.env.NODE_ENV || 'development',
  cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
  debugMode: process.env.DEBUG_CLOUDINARY === 'true'
});

module.exports = router;