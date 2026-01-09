import express from 'express';
import { body } from 'express-validator';
import { login, register, getMe, changerMotDePasse } from '../../controllers/security/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate
], login);

// 🔒 PHASE 1 AJUSTÉE - Rôles actifs (opérationnels + QUALITE) | ADMIN gelé (technique uniquement)
router.post('/register', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']).withMessage('Fonction invalide - rôles autorisés: AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER, QUALITE'),
  validate
], register);

router.get('/me', protect, getMe);

// Changement de mot de passe
router.post('/changer-mot-de-passe', protect, [
  body('ancienMotDePasse').notEmpty().withMessage('Ancien mot de passe requis'),
  body('nouveauMotDePasse').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caractères'),
  validate
], changerMotDePasse);

// ============================================
// ALIAS POUR COMPATIBILITÉ FRONTEND
// ============================================

// Alias pour /connexion → /login
router.post('/connexion', [
  body('email').isEmail().withMessage('Email invalide'),
  body('motDePasse').optional().notEmpty().withMessage('Mot de passe requis'),
  body('password').optional().notEmpty().withMessage('Mot de passe requis'),
  validate
], login);

// Alias pour /inscription → /register
router.post('/inscription', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('motDePasse').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('password').optional().isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('fonction').isIn(['AGENT_ESCALE', 'CHEF_EQUIPE', 'SUPERVISEUR', 'MANAGER', 'QUALITE']).withMessage('Fonction invalide'),
  validate
], register);

// Alias pour /deconnexion → /me (logout est géré côté client)
router.post('/deconnexion', (req, res) => {
  res.status(200).json({ success: true, message: 'Déconnexion réussie' });
});

export default router;
