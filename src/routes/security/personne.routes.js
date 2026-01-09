import express from 'express';
import { body } from 'express-validator';
import {
  getAllPersonnes,
  getPersonneById,
  createPersonne,
  updatePersonne,
  deletePersonne,
  getPersonnesStats
} from '../../controllers/security/personne.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

const router = express.Router();

// Routes publiques (nécessitent authentification)
router.use(protect);

// GET /api/personnes - Liste tous les utilisateurs
router.get('/', getAllPersonnes);

// GET /api/personnes/stats/global - Statistiques des utilisateurs
router.get('/stats/global', getPersonnesStats);

// GET /api/personnes/:id - Obtenir un utilisateur
router.get('/:id', getPersonneById);

// Middleware pour valider qu'au moins password ou motDePasse est fourni
const validatePassword = (req, res, next) => {
  const { password, motDePasse } = req.body;
  if (!password && !motDePasse) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: [{
        field: 'password',
        message: 'Le mot de passe est requis (password ou motDePasse)'
      }]
    });
  }
  next();
};

// Routes réservées aux ADMIN
router.post('/', authorize('ADMIN'), [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').optional().trim(),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('motDePasse').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN']).withMessage('Fonction invalide'),
  validate,
  validatePassword
], createPersonne);

// Support PUT et PATCH pour la modification
const updateValidation = [
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('password').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('motDePasse').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('fonction').optional().isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE', 'ADMIN']).withMessage('Fonction invalide'),
  body('statut').optional().isIn(['ACTIF', 'ABSENT', 'CONGE', 'INACTIF']).withMessage('Statut invalide'),
  validate
];

router.put('/:id', authorize('ADMIN'), updateValidation, updatePersonne);
router.patch('/:id', authorize('ADMIN'), updateValidation, updatePersonne);

router.delete('/:id', authorize('ADMIN'), deletePersonne);

export default router;
