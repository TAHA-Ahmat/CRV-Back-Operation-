import express from 'express';
import { body } from 'express-validator';
import { login, register, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';

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

export default router;
