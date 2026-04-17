import CRV from '../../models/crv/CRV.js';
import ChronologiePhase from '../../models/phases/ChronologiePhase.js';
import Phase from '../../models/phases/Phase.js';
import Vol from '../../models/flights/Vol.js';

/**
 * BUX-1 — Contrôleur export agrégé conformité SLA
 *
 * Mission : SLA_FULL_COVERAGE_BACK
 * But : permettre à la Qualité / Manager / Superviseur d'obtenir sur une période donnée
 *       une vue agrégée du taux de respect SLA (par compagnie + par tâche fine)
 *       sans ouvrir chaque PDF CRV individuellement.
 *
 * Endpoint :
 *   GET /api/sla/conformite/export?dateDebut=...&dateFin=...&codeIATA=...&format=json|csv
 *
 * Logique :
 *   - Récupère tous les CRV VALIDE ou VERROUILLE dans la période (par dateCreation)
 *   - Pour chaque CRV, récupère les ChronologiePhase attachées à des phases fines SLA_*
 *   - Calcule le verdict conformité : |ecartMinutes| <= 15 → CONFORME, sinon DEPASSE
 *   - Agrège global / par compagnie (codeIATA) / par tâche (code phase)
 *
 * Protection : QUALITE, MANAGER, SUPERVISEUR
 */

const SEUIL_ECART_MINUTES = 15;

/**
 * Calcule l'écart (en minutes) entre la planification et la réalisation
 * pour une chrono phase fine SLA donnée.
 *
 * Règles :
 * - Phase DEBUT_FIN (slaMode=DUREE) : écart = heureFinReelle - heureFinPrevue (fin = livraison)
 *   Fallback : chronoPhase.ecartMinutes si déjà calculé
 * - Phase INSTANT (slaMode=DEADLINE) : écart = heureDebutReelle - heureDebutPrevue
 *
 * Retourne :
 *   {
 *     cibleMs, reelMs, ecartMinutes, verdict: 'CONFORME'|'DEPASSE'|'INCOMPLET',
 *     cibleISO, reelISO
 *   }
 */
function calculerVerdictChrono(chronoPhase, phase) {
  // Si la phase n'a pas été terminée, on ne peut pas juger de la conformité
  if (chronoPhase.statut !== 'TERMINE') {
    return { verdict: 'INCOMPLET', ecartMinutes: null, cibleISO: null, reelISO: null };
  }

  const isInstant = phase?.typeTemporel === 'INSTANT' || phase?.slaMode === 'DEADLINE';

  let cible, reel;
  if (isInstant) {
    cible = chronoPhase.heureDebutPrevue;
    reel = chronoPhase.heureDebutReelle;
  } else {
    cible = chronoPhase.heureFinPrevue;
    reel = chronoPhase.heureFinReelle;
  }

  if (!cible || !reel) {
    // Fallback : champ ecartMinutes précalculé (hook pre-save ChronologiePhase)
    if (typeof chronoPhase.ecartMinutes === 'number') {
      const verdict = Math.abs(chronoPhase.ecartMinutes) > SEUIL_ECART_MINUTES ? 'DEPASSE' : 'CONFORME';
      return {
        verdict,
        ecartMinutes: chronoPhase.ecartMinutes,
        cibleISO: cible ? new Date(cible).toISOString() : null,
        reelISO: reel ? new Date(reel).toISOString() : null
      };
    }
    return { verdict: 'INCOMPLET', ecartMinutes: null, cibleISO: null, reelISO: null };
  }

  const ecartMinutes = Math.round((new Date(reel) - new Date(cible)) / 60000);
  const verdict = Math.abs(ecartMinutes) > SEUIL_ECART_MINUTES ? 'DEPASSE' : 'CONFORME';

  return {
    verdict,
    ecartMinutes,
    cibleISO: new Date(cible).toISOString(),
    reelISO: new Date(reel).toISOString()
  };
}

/**
 * Sérialise une ligne CSV en échappant les champs comportant une virgule / guillemet / retour chariot.
 */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatMinutes(mn) {
  if (mn === null || mn === undefined) return '';
  const sign = mn >= 0 ? '+' : '-';
  const abs = Math.abs(mn);
  return `${sign}${abs}min`;
}

/**
 * GET /api/sla/conformite/export
 */
export const exporterConformiteSLA = async (req, res) => {
  try {
    const { dateDebut, dateFin, codeIATA, format = 'json' } = req.query;

    // --- Validation des params ---
    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'dateDebut et dateFin sont obligatoires (format ISO)'
      });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'dateDebut / dateFin invalides (attendu ISO-8601)'
      });
    }
    if (fin < debut) {
      return res.status(400).json({
        success: false,
        message: 'dateFin doit être postérieure à dateDebut'
      });
    }

    const fmt = String(format).toLowerCase();
    if (!['json', 'csv'].includes(fmt)) {
      return res.status(400).json({
        success: false,
        message: 'format doit être "json" ou "csv"'
      });
    }

    // --- Résolution des CRV VALIDE/VERROUILLE dans la période ---
    // Filtre par dateCreation (périmètre simple et stable).
    const crvQuery = {
      statut: { $in: ['VALIDE', 'VERROUILLE'] },
      dateCreation: { $gte: debut, $lte: fin }
    };

    // Si filtre compagnie : résoudre les volIds correspondants
    let volIdsFilter = null;
    if (codeIATA) {
      const volDocs = await Vol.find({ codeIATA: String(codeIATA).toUpperCase() }).select('_id').lean();
      volIdsFilter = volDocs.map(v => v._id);
      crvQuery.vol = { $in: volIdsFilter };
    }

    const crvs = await CRV.find(crvQuery)
      .populate({ path: 'vol', select: 'numeroVol codeIATA compagnieAerienne' })
      .select('_id numeroCRV vol dateCreation')
      .lean();

    if (crvs.length === 0) {
      const emptyPayload = {
        periode: { debut: debut.toISOString(), fin: fin.toISOString() },
        filtre: { codeIATA: codeIATA || null },
        global: { crvs: 0, tachesTotal: 0, conformes: 0, depassees: 0, incomplets: 0, tauxConformite: 0 },
        parCompagnie: [],
        parTache: []
      };
      if (fmt === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="sla-conformite-${dateDebut}_${dateFin}.csv"`);
        return res.status(200).send('crvId,numeroCRV,numeroVol,codeIATA,compagnie,tache,cible,reel,ecart,verdict\n');
      }
      return res.status(200).json({ success: true, data: emptyPayload });
    }

    const crvIds = crvs.map(c => c._id);
    const crvMap = new Map(crvs.map(c => [c._id.toString(), c]));

    // --- Résolution des phases fines SLA_* (filtre sur code SLA_*) ---
    const phasesFines = await Phase.find({ code: { $regex: '^SLA_' } })
      .select('_id code libelle typeTemporel slaMode')
      .lean();
    const phaseMap = new Map(phasesFines.map(p => [p._id.toString(), p]));
    const phaseIds = phasesFines.map(p => p._id);

    if (phaseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          periode: { debut: debut.toISOString(), fin: fin.toISOString() },
          filtre: { codeIATA: codeIATA || null },
          global: { crvs: crvs.length, tachesTotal: 0, conformes: 0, depassees: 0, incomplets: 0, tauxConformite: 0 },
          parCompagnie: [],
          parTache: [],
          warning: 'Aucune phase fine SLA_* déclarée — import de seed manquant ?'
        }
      });
    }

    // --- Chrono phases liées ---
    const chronos = await ChronologiePhase.find({
      crv: { $in: crvIds },
      phase: { $in: phaseIds }
    }).select('crv phase statut heureDebutPrevue heureDebutReelle heureFinPrevue heureFinReelle ecartMinutes').lean();

    // --- Agrégation ---
    let totalTaches = 0;
    let totalConformes = 0;
    let totalDepassees = 0;
    let totalIncomplets = 0;

    // Pire tâche par compagnie : map codeIATA -> { code -> { depassees, total } }
    const compagnieAgg = new Map();  // codeIATA -> {crvs:Set, tachesTotal, conformes, depassees, incomplets, parTache: Map}
    const tacheAgg = new Map();      // code -> { total, conformes, depassees, incomplets }

    const lignesCSV = [];

    for (const cp of chronos) {
      const crv = crvMap.get(cp.crv.toString());
      if (!crv) continue;
      const phase = phaseMap.get(cp.phase.toString());
      if (!phase) continue;

      const iata = crv.vol?.codeIATA || 'N/A';
      const compagnieLibelle = crv.vol?.compagnieAerienne || 'N/A';
      const numeroVol = crv.vol?.numeroVol || '';

      const verdictInfo = calculerVerdictChrono(cp, phase);

      totalTaches++;
      if (verdictInfo.verdict === 'CONFORME') totalConformes++;
      else if (verdictInfo.verdict === 'DEPASSE') totalDepassees++;
      else totalIncomplets++;

      // --- agrégat compagnie ---
      if (!compagnieAgg.has(iata)) {
        compagnieAgg.set(iata, {
          codeIATA: iata,
          compagnie: compagnieLibelle,
          crvs: new Set(),
          tachesTotal: 0,
          conformes: 0,
          depassees: 0,
          incomplets: 0,
          parTache: new Map()
        });
      }
      const aggCompa = compagnieAgg.get(iata);
      aggCompa.crvs.add(crv._id.toString());
      aggCompa.tachesTotal++;
      if (verdictInfo.verdict === 'CONFORME') aggCompa.conformes++;
      else if (verdictInfo.verdict === 'DEPASSE') aggCompa.depassees++;
      else aggCompa.incomplets++;

      // tâche dans la compagnie
      if (!aggCompa.parTache.has(phase.code)) {
        aggCompa.parTache.set(phase.code, { total: 0, depassees: 0, conformes: 0 });
      }
      const tCompa = aggCompa.parTache.get(phase.code);
      tCompa.total++;
      if (verdictInfo.verdict === 'DEPASSE') tCompa.depassees++;
      if (verdictInfo.verdict === 'CONFORME') tCompa.conformes++;

      // --- agrégat global par tâche ---
      if (!tacheAgg.has(phase.code)) {
        tacheAgg.set(phase.code, {
          code: phase.code,
          libelle: phase.libelle,
          total: 0,
          conformes: 0,
          depassees: 0,
          incomplets: 0
        });
      }
      const tGlob = tacheAgg.get(phase.code);
      tGlob.total++;
      if (verdictInfo.verdict === 'CONFORME') tGlob.conformes++;
      else if (verdictInfo.verdict === 'DEPASSE') tGlob.depassees++;
      else tGlob.incomplets++;

      // ligne CSV
      lignesCSV.push({
        crvId: crv._id.toString(),
        numeroCRV: crv.numeroCRV,
        numeroVol,
        codeIATA: iata,
        compagnie: compagnieLibelle,
        tache: phase.code,
        cible: verdictInfo.cibleISO || '',
        reel: verdictInfo.reelISO || '',
        ecart: formatMinutes(verdictInfo.ecartMinutes),
        verdict: verdictInfo.verdict
      });
    }

    // --- Structures finales ---
    const tauxGlobal = totalTaches > 0
      ? Math.round((totalConformes / totalTaches) * 1000) / 10
      : 0;

    const parCompagnie = Array.from(compagnieAgg.values())
      .map(c => {
        // pire tache = celle avec le plus de dépassées (tie-break : plus gros total)
        let pire = null;
        for (const [code, t] of c.parTache.entries()) {
          if (!pire) { pire = { code, ...t }; continue; }
          if (t.depassees > pire.depassees ||
              (t.depassees === pire.depassees && t.total > pire.total)) {
            pire = { code, ...t };
          }
        }
        return {
          codeIATA: c.codeIATA,
          compagnie: c.compagnie,
          crvs: c.crvs.size,
          tachesTotal: c.tachesTotal,
          conformes: c.conformes,
          depassees: c.depassees,
          incomplets: c.incomplets,
          tauxConformite: c.tachesTotal > 0
            ? Math.round((c.conformes / c.tachesTotal) * 1000) / 10
            : 0,
          pireTache: pire ? pire.code : null,
          pireTacheDepassees: pire ? pire.depassees : 0
        };
      })
      .sort((a, b) => a.tauxConformite - b.tauxConformite);

    const parTache = Array.from(tacheAgg.values())
      .map(t => ({
        code: t.code,
        libelle: t.libelle,
        total: t.total,
        conformes: t.conformes,
        depassees: t.depassees,
        incomplets: t.incomplets,
        taux: t.total > 0
          ? Math.round((t.conformes / t.total) * 1000) / 10
          : 0
      }))
      .sort((a, b) => a.taux - b.taux);

    const payload = {
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
      filtre: { codeIATA: codeIATA || null },
      global: {
        crvs: crvs.length,
        tachesTotal: totalTaches,
        conformes: totalConformes,
        depassees: totalDepassees,
        incomplets: totalIncomplets,
        tauxConformite: tauxGlobal
      },
      parCompagnie,
      parTache
    };

    // --- Rendu ---
    if (fmt === 'csv') {
      const header = 'crvId,numeroCRV,numeroVol,codeIATA,compagnie,tache,cible,reel,ecart,verdict';
      const lignes = lignesCSV.map(l =>
        [l.crvId, l.numeroCRV, l.numeroVol, l.codeIATA, l.compagnie, l.tache, l.cible, l.reel, l.ecart, l.verdict]
          .map(csvCell)
          .join(',')
      );
      const body = [header, ...lignes].join('\n') + '\n';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sla-conformite-${dateDebut}_${dateFin}.csv"`);
      return res.status(200).send(body);
    }

    return res.status(200).json({ success: true, data: payload });

  } catch (error) {
    console.error('[SLA][CONFORMITE][EXPORT] Erreur:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération de l\'export conformité SLA'
    });
  }
};
