// ✅ COPIÉ DEPUIS MAGASIN : Middleware de finalisation d'audit
import UserActivityLog from '../models/UserActivityLog.js';
import Personne from '../models/Personne.js';

const auditFinalizeMiddleware = (req, res, next) => {
  // S'assurer que res.locals existe
  if (!res.locals) res.locals = {};

  // Écrire 1 log par requête quand la réponse est terminée
  res.on('finish', async () => {
    try {
      // Événement métier optionnel posé par un contrôleur : { action, context, meta, type? }
      const evt = res.locals.audit || null;

      // 🎯 SOLUTION CLEAN : Ne logger QUE les actions métier explicites
      if (!evt) {
        return; // Pas d'audit défini = pas de log (élimine pollution http_request)
      }

      // Extraction sécurisée de l'userId
      const userId = req.user?.id || req.user?._id;

      const base = res.locals.auditBase || {
        request: {
          id: null,
          method: req.method,
          path: req.originalUrl || req.url || '',
          query: req.query || {},
          statusCode: res.statusCode,
          latencyMs: null,
        },
        client: {
          ip: (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || (req.ip || ''),
          userAgent: req.get ? (req.get('user-agent') || '') : (req.headers['user-agent'] || ''),
        },
        utilisateurId: userId || null,
        // ✅ ADAPTÉ POUR CRV : utilise 'fonction' au lieu de 'role'
        userSnapshot: { username: req.user?.nom || req.user?.email || null, role: req.user?.fonction || null },
      };

      // Déterminer type + action (par défaut : simple accès HTTP → système)
      const type = (evt && evt.type) || 'system';
      const action = (evt && evt.action) || 'http_request';

      // Contexte et méta (optionnels)
      const context = evt?.context || {};
      const meta = evt?.meta || {};

      // Construire l'entrée de log
      // 🔧 EXTRACTION intelligente de l'utilisateur (req.user OU context.entityId pour login_success)
      const finalUserId = userId || context?.entityId || null;

      const entry = {
        type,
        action,
        utilisateurId: finalUserId,
        userSnapshot: base.userSnapshot || { username: null, role: null },
        request: {
          id: base.request?.id || null,
          method: base.request?.method || req.method,
          path: base.request?.path || req.originalUrl || req.url || '',
          query: base.request?.query || req.query || {},
          statusCode: base.request?.statusCode ?? res.statusCode,
          latencyMs: typeof base.request?.latencyMs === 'number' ? base.request.latencyMs : null,
        },
        client: {
          ip: base.client?.ip || '',
          userAgent: base.client?.userAgent || '',
        },
        context,
        meta,
        details: meta?.summary || '',
      };

      // Entry construite pour audit

      // 🛡️ PROTECTION: Si utilisateurId manque pour type nécessitant un utilisateur, passer en type 'system'
      if (!entry.utilisateurId && (entry.type === 'action' || entry.type === 'business' || entry.type === 'auth')) {
        console.log(`⚠️ [AUDIT] utilisateurId manquant pour type ${entry.type} - conversion en type system`);
        entry.type = 'system';
        entry.utilisateurId = null; // explicite pour le modèle
      }

      // 🔧 ENRICHISSEMENT userSnapshot si vide (pour savoir QUI fait QUOI)
      // ✅ ADAPTÉ POUR CRV : utilise Personne au lieu de User, et 'fonction' au lieu de 'role'
      if (entry.utilisateurId && (!entry.userSnapshot.username || !entry.userSnapshot.role)) {
        console.log(`🔍 [MIDDLEWARE] Enrichissement userSnapshot pour userId: ${entry.utilisateurId}`);
        try {
          const personne = await Personne.findById(entry.utilisateurId, 'nom email fonction').lean();
          if (personne) {
            console.log(`📚 [MIDDLEWARE] Personne trouvée en DB: nom="${personne.nom}", email="${personne.email}", fonction="${personne.fonction}"`);

            const oldUsername = entry.userSnapshot.username;
            const oldRole = entry.userSnapshot.role;
            const oldEmail = entry.meta.email;

            entry.userSnapshot.username = personne.nom || entry.userSnapshot.username;
            entry.userSnapshot.role = personne.fonction || entry.userSnapshot.role;

            // 🎓 LEÇON 5: Fallback enrichi - ajouter email si manquant dans meta
            if (!entry.meta.email && personne.email) {
              entry.meta.email = personne.email;
            }

            console.log(`🔄 [MIDDLEWARE] Enrichissement appliqué:`);
            console.log(`   - username: "${oldUsername}" → "${entry.userSnapshot.username}"`);
            console.log(`   - role: "${oldRole}" → "${entry.userSnapshot.role}"`);
            console.log(`   - email: "${oldEmail}" → "${entry.meta.email}"`);
          } else {
            console.log(`❌ [MIDDLEWARE] Aucune personne trouvée en DB pour userId: ${entry.utilisateurId}`);
          }
        } catch (err) {
          console.log(`💥 [MIDDLEWARE] Erreur enrichissement DB: ${err.message}`);
        }
      }

      // 🎓 LEÇON 4: Debug spécifique déconnexion
      if (entry.action?.includes('logout')) {
        console.log('🚪 [MIDDLEWARE] ===== LOG LOGOUT FINAL =====');
        console.log(`   - Action: ${entry.action}`);
        console.log(`   - Type: ${entry.type}`);
        console.log(`   - UserId: ${entry.utilisateurId}`);
        console.log(`   - Username: "${entry.userSnapshot.username}"`);
        console.log(`   - Role: "${entry.userSnapshot.role}"`);
        console.log(`   - Email: "${entry.meta.email}"`);
        console.log(`   - Logout Type: "${entry.meta.logout_type}"`);
        console.log('🚪 ==========================================');
      }

      // Debug temporaire
      console.log(`🔍 MIDDLEWARE DEBUG: Avant écriture - type="${entry.type}", utilisateurId="${entry.utilisateurId}"`);

      // Écriture centralisée (avec filtre anti-secrets dans le modèle)
      await UserActivityLog.write(entry);
    } catch (err) {
      // Ne jamais casser le flux de réponse pour un problème de log
      try {
        console.error("[audit] Échec d'écriture du log :", err?.message || err);
      } catch (_) {}
    }
  });

  next();
};

export default auditFinalizeMiddleware;
