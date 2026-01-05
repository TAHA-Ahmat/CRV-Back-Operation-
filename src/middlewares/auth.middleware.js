import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import Personne from '../models/Personne.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    // ✅ ALIGNÉ SUR MAGASIN : Gestion des erreurs JWT spécifiques
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      req.user = await Personne.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (req.user.statut !== 'ACTIF') {
        return res.status(403).json({
          success: false,
          message: 'Compte utilisateur inactif'
        });
      }

      next();
    } catch (err) {
      // ✅ ALIGNÉ SUR MAGASIN : Codes d'erreur spécifiques
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expiré',
          code: 'TOKEN_EXPIRED',
          requireLogin: true
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Token invalide',
          code: 'TOKEN_INVALID'
        });
      } else {
        return res.status(401).json({
          message: "Erreur d'authentification",
          code: 'AUTH_ERROR'
        });
      }
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.fonction)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.fonction} n'est pas autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};

/**
 * 🔒 P0-1 CORRECTIF SÉCURITÉ - Exclure QUALITE des opérations d'écriture
 *
 * QUALITE est un profil LECTURE SEULE (observation, analyse, rapports).
 * Ce middleware bloque toutes tentatives de modification par QUALITE.
 *
 * Utilisation: Placer APRÈS protect, AVANT les handlers
 *
 * @example
 * router.post('/', protect, excludeQualite, creerCRV);
 * router.put('/:id', protect, excludeQualite, mettreAJourCRV);
 */
export const excludeQualite = (req, res, next) => {
  if (req.user.fonction === 'QUALITE') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé: QUALITE est un profil lecture seule uniquement',
      code: 'QUALITE_READ_ONLY'
    });
  }
  next();
};
