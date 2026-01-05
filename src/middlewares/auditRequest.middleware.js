// ✅ COPIÉ DEPUIS MAGASIN : Middleware d'initialisation d'audit de requête

// 🔹 Génère un ID simple sans dépendance externe
const genRequestId = () => {
  const rnd = Math.random().toString(16).slice(2);
  return `${Date.now()}-${rnd}`;
};

const auditRequestMiddleware = (req, res, next) => {
  // ⏱ Point de départ (utilise hrtime si dispo, sinon Date.now)
  if (!res.locals) res.locals = {};
  if (!res.locals._t0) {
    try {
      res.locals._t0 = typeof process.hrtime === 'function' ? process.hrtime.bigint() : BigInt(Date.now() * 1e6);
    } catch (_) {
      res.locals._t0 = null; // fallback si environnement restreint
    }
  }

  // 🆔 Correlation ID (honore X-Request-Id si présent)
  if (!req.requestId) {
    const hdr = req.headers['x-request-id'];
    req.requestId = (Array.isArray(hdr) ? hdr[0] : hdr) || genRequestId();
  }

  // 🌐 IP & User-Agent
  const ipFromProxy = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  const ip = ipFromProxy || (req.ip || '').toString();
  const userAgent = req.get ? (req.get('user-agent') || '') : (req.headers['user-agent'] || '');

  // 📦 Base d'audit accessible partout dans le cycle
  res.locals.auditBase = {
    request: {
      id: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || '',
      query: req.query || {},
      statusCode: null,   // rempli à la fin
      latencyMs: null,    // rempli à la fin
    },
    client: {
      ip,
      userAgent,
    },
    // sera renseigné par authMiddleware si l'utilisateur est authentifié
    utilisateurId: null,
    userSnapshot: { username: null, role: null },
  };

  // 📝 Espace optionnel pour que les contrôleurs posent un événement métier
  // ex: res.locals.audit = { action, context, meta }
  if (typeof res.locals.audit === 'undefined') {
    res.locals.audit = null;
  }

  // 🎯 Calcul statut/latence en fin de réponse (aucune écriture BD ici)
  if (!res.locals._bindFinishOnce) {
    res.locals._bindFinishOnce = true;
    res.on('finish', () => {
      try {
        const status = res.statusCode;
        let latencyMs = null;

        if (res.locals._t0 && typeof process.hrtime === 'function') {
          const t1 = process.hrtime.bigint();
          latencyMs = Number(t1 - res.locals._t0) / 1e6;
        } else if (res.locals._t0) {
          // si _t0 a été posé avec Date.now * 1e6
          const t1approx = BigInt(Date.now() * 1e6);
          latencyMs = Number(t1approx - res.locals._t0) / 1e6;
        }

        if (res.locals.auditBase) {
          res.locals.auditBase.request.statusCode = status;
          res.locals.auditBase.request.latencyMs = latencyMs != null ? Math.round(latencyMs) : null;
        }
      } catch (_) {
        // ne jamais casser la réponse
      }
    });
  }

  next();
};

export default auditRequestMiddleware;
