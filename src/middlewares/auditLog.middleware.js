import HistoriqueModification from '../models/HistoriqueModification.js';

/**
 * RÈGLE MÉTIER CRITIQUE : Audit trail automatique
 * Toute modification d'un CRV doit être tracée dans l'historique
 */
export const auditLog = (typeModification) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (data) {
      // Extraire le crvId depuis différentes sources possibles
      const crvId = req.crvId ||
                    req.params.id ||
                    req.body.crvId ||
                    (req.crv && req.crv._id) ||
                    (req.chronoPhase && req.chronoPhase.crv);

      if (crvId && req.user && res.statusCode >= 200 && res.statusCode < 400) {
        try {
          await HistoriqueModification.create({
            crv: crvId,
            modifiePar: req.user._id,
            typeModification,
            champModifie: req.body.champModifie || req.path || 'multiple',
            ancienneValeur: req.body.ancienneValeur,
            nouvelleValeur: req.body.nouvelleValeur || req.body,
            raisonModification: req.body.raisonModification,
            adresseIP: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent')
          });
        } catch (error) {
          console.error('❌ Erreur critique lors de la création du log d\'audit:', error);
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};
