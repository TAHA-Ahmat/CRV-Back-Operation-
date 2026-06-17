import express from 'express';
import { body } from 'express-validator';
import { login, register, getMe, changerMotDePasse, validerCompte } from '../../controllers/security/auth.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { seedPhases } from '../../utils/seedPhases.js';
import Phase from '../../models/phases/Phase.js';

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  validate
], login);

// 🔒 Mission 013 — Registration sécurisée (rôle forcé AGENT_ESCALE, statutCompte EN_ATTENTE)
router.post('/register', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 12 }).withMessage('Mot de passe minimum 12 caractères'),
  // fonction supprimée de la validation : forcée à AGENT_ESCALE côté controller
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

// Alias pour /inscription → /register (Mission 013 : fonction supprimée, forcée côté controller)
router.post('/inscription', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('matricule').notEmpty().withMessage('Matricule requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('motDePasse').optional().isLength({ min: 12 }).withMessage('Mot de passe minimum 12 caractères'),
  body('password').optional().isLength({ min: 12 }).withMessage('Mot de passe minimum 12 caractères'),
  validate
], register);

// 🔒 Mission 013 — Validation de compte par ADMIN
router.post('/valider-compte', protect, authorize('ADMIN'), [
  body('personnelId').notEmpty().withMessage('personnelId requis'),
  validate
], validerCompte);

// Alias pour /deconnexion → /me (logout est géré côté client)
router.post('/deconnexion', (req, res) => {
  res.status(200).json({ success: true, message: 'Déconnexion réussie' });
});

// Seed phases maîtres (ADMIN uniquement — usage unique déploiement)
router.post('/admin/seed-phases', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const count = await Phase.countDocuments();
    if (count > 0 && !req.query.force) {
      return res.status(200).json({ success: true, message: `${count} phases déjà présentes`, data: { count } });
    }
    const result = await seedPhases(!!req.query.force);
    res.status(200).json({ success: true, message: 'Seed terminé', data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
