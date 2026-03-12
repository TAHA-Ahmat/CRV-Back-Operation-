/**
 * OPS CONTROLLER — Endpoints du Centre de Contrôle Opérationnel
 *
 * MODULE OPS CONTROL CENTER v1.0.0
 *
 * Endpoints :
 * - GET /api/ops/stream   → SSE temps réel (EventSource)
 * - GET /api/ops/dashboard → Snapshot JSON des opérations
 *
 * Auth SSE : Token JWT via query parameter (EventSource ne supporte pas les headers)
 * Rôles autorisés : ADMIN, MANAGER, SUPERVISEUR
 */

import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import Personne from '../../models/security/Personne.js';
import opsStream from '../../services/ops/opsStream.service.js';

// ─── RÔLES AUTORISÉS ────────────────────────────────────────
const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'SUPERVISEUR'];

// ─── SSE STREAM ─────────────────────────────────────────────
/**
 * GET /api/ops/stream?token=xxx
 * Ouvre une connexion SSE temps réel.
 * EventSource ne pouvant pas envoyer de headers,
 * le JWT est passé en query parameter.
 */
export const streamEvents = async (req, res) => {
  try {
    // ─── AUTH via query param ───
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant — Utilisez ?token=xxx'
      });
    }

    // Vérifier le JWT
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expiré', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Token invalide', code: 'TOKEN_INVALID' });
    }

    // Récupérer l'utilisateur
    const user = await Personne.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (user.statut !== 'ACTIF') {
      return res.status(403).json({ success: false, message: 'Compte inactif' });
    }

    // Vérifier le rôle
    if (!ALLOWED_ROLES.includes(user.fonction)) {
      return res.status(403).json({
        success: false,
        message: `Rôle ${user.fonction} non autorisé pour le flux OPS`
      });
    }

    // ─── SETUP SSE ───
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Désactive le buffering nginx
    });

    // Envoyer le buffer initial
    const buffer = opsStream.getBuffer();
    if (buffer.length > 0) {
      res.write(`event: init\ndata: ${JSON.stringify(buffer)}\n\n`);
    }

    // Enregistrer le client
    const clientId = opsStream.addClient(res);

    // Message de bienvenue
    res.write(`event: connected\ndata: ${JSON.stringify({
      clientId,
      user: user.prenom + ' ' + user.nom,
      role: user.fonction,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Nettoyage à la déconnexion
    req.on('close', () => {
      opsStream.removeClient(clientId);
    });

  } catch (error) {
    console.error('[OPS] Erreur stream:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'ouverture du flux OPS'
      });
    }
  }
};

// ─── DASHBOARD SNAPSHOT ─────────────────────────────────────
/**
 * GET /api/ops/dashboard
 * Retourne un snapshot JSON des opérations en cours.
 * Protégé par middleware protect + authorize.
 */
export const getDashboard = async (req, res) => {
  try {
    const snapshot = await opsStream.getSnapshot();

    res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error('[OPS] Erreur dashboard:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard OPS'
    });
  }
};

// ─── STATS ──────────────────────────────────────────────────
/**
 * GET /api/ops/stats
 * Retourne les statistiques du service OPS Stream.
 */
export const getStats = (req, res) => {
  res.status(200).json({
    success: true,
    data: opsStream.getStats()
  });
};
