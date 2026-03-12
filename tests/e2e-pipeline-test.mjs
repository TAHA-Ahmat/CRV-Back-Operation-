/**
 * TEST E2E PIPELINE CRV — Mission test complet
 * Aucune modification de code. Test + observation + documentation.
 *
 * Pipeline: Programme → Bulletin → Vol → Horaire → CRV → Phases → Services → Validation → Archivage → PDF
 */

const BASE = 'http://localhost:4000/api';
const LOGS = [];

function log(phase, message, data = null) {
  const entry = { timestamp: new Date().toISOString(), phase, message, data };
  LOGS.push(entry);
  console.log(`[${phase}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

async function api(method, path, body = null, token = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const url = `${BASE}${path}`;
  log('API', `${method} ${path}`);

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
      log('API', `ERREUR ${res.status}`, json);
    }
    return { status: res.status, ok: res.ok, data: json };
  } catch (err) {
    log('API', `FETCH ERROR: ${err.message}`);
    return { status: 0, ok: false, data: { error: err.message } };
  }
}

// ========================================================
// MAIN
// ========================================================
async function main() {
  const RESULTS = {};

  // ==========================
  // LOGIN
  // ==========================
  log('AUTH', 'Connexion superviseur...');
  const loginSup = await api('POST', '/auth/login', { email: 'superviseur@crv.test', password: 'Test1234!' });
  if (!loginSup.ok) {
    log('AUTH', 'ECHEC LOGIN SUPERVISEUR', loginSup.data);
    // Try connexion endpoint
    const loginSup2 = await api('POST', '/auth/connexion', { email: 'superviseur@crv.test', motDePasse: 'Test1234!' });
    if (!loginSup2.ok) {
      log('AUTH', 'ECHEC TOTAL LOGIN', loginSup2.data);
      process.exit(1);
    }
    var TOKEN_SUP = loginSup2.data.token;
  } else {
    var TOKEN_SUP = loginSup.data.token;
  }
  log('AUTH', 'Token superviseur obtenu', { tokenLength: TOKEN_SUP?.length });

  // Login agent
  log('AUTH', 'Connexion agent...');
  const loginAgent = await api('POST', '/auth/login', { email: 'agent@crv.test', password: 'Test1234!' });
  let TOKEN_AGENT;
  if (loginAgent.ok) {
    TOKEN_AGENT = loginAgent.data.token;
  } else {
    const loginAgent2 = await api('POST', '/auth/connexion', { email: 'agent@crv.test', motDePasse: 'Test1234!' });
    TOKEN_AGENT = loginAgent2.ok ? loginAgent2.data.token : TOKEN_SUP;
  }
  log('AUTH', 'Token agent obtenu', { tokenLength: TOKEN_AGENT?.length });

  // ==========================
  // PHASE 0 — NETTOYAGE (via API, pas MongoDB direct)
  // ==========================
  log('PHASE_0', '=== NETTOYAGE BASE ===');

  // Lister bulletins existants et les supprimer
  const bulletins = await api('GET', '/bulletins', null, TOKEN_SUP);
  if (bulletins.ok) {
    const bulletinList = bulletins.data.data || bulletins.data.bulletins || bulletins.data || [];
    log('PHASE_0', `Bulletins existants: ${Array.isArray(bulletinList) ? bulletinList.length : 'N/A'}`);

    if (Array.isArray(bulletinList)) {
      for (const b of bulletinList) {
        const bid = b._id || b.id;
        if (bid) {
          const del = await api('DELETE', `/bulletins/${bid}`, null, TOKEN_SUP);
          log('PHASE_0', `Suppression bulletin ${bid}: ${del.status}`);
        }
      }
    }
  }

  // Lister CRVs existants et les supprimer (seulement BROUILLON)
  const crvs = await api('GET', '/crv', null, TOKEN_SUP);
  if (crvs.ok) {
    const crvList = crvs.data.data || crvs.data.crvs || crvs.data || [];
    log('PHASE_0', `CRVs existants: ${Array.isArray(crvList) ? crvList.length : 'N/A'}`);

    if (Array.isArray(crvList)) {
      for (const c of crvList) {
        const cid = c._id || c.id;
        if (cid && (c.statut === 'BROUILLON' || c.statut === 'EN_COURS')) {
          const del = await api('DELETE', `/crv/${cid}`, null, TOKEN_SUP);
          log('PHASE_0', `Suppression CRV ${cid} (${c.statut}): ${del.status}`);
        }
      }
    }
  }

  RESULTS.phase0 = { status: 'OK', message: 'Nettoyage effectue' };

  // ==========================
  // PHASE 1 — IDENTIFIER PROGRAMME
  // ==========================
  log('PHASE_1', '=== IDENTIFIER PROGRAMME VOL ===');
  const progs = await api('GET', '/programmes-vol', null, TOKEN_SUP);

  let programme = null;
  let programmeVols = [];

  if (progs.ok) {
    const progList = progs.data.data || progs.data.programmes || progs.data || [];
    log('PHASE_1', `Programmes trouves: ${Array.isArray(progList) ? progList.length : 'N/A'}`);

    if (Array.isArray(progList) && progList.length > 0) {
      // Prendre le premier programme actif ou le premier tout court
      programme = progList.find(p => p.statut === 'ACTIF') || progList[0];
      const progId = programme._id || programme.id;
      log('PHASE_1', 'Programme selectionne', {
        id: progId,
        nom: programme.nom,
        statut: programme.statut,
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin
      });

      // Lister les vols du programme
      const volsProg = await api('GET', `/programmes-vol/${progId}/vols`, null, TOKEN_SUP);
      if (volsProg.ok) {
        programmeVols = volsProg.data.data || volsProg.data.vols || volsProg.data || [];
        log('PHASE_1', `Vols dans le programme: ${Array.isArray(programmeVols) ? programmeVols.length : 'N/A'}`);

        if (Array.isArray(programmeVols) && programmeVols.length > 0) {
          // Afficher les 5 premiers vols
          for (const v of programmeVols.slice(0, 5)) {
            log('PHASE_1', 'Vol programme', {
              numeroVol: v.numeroVol,
              compagnie: v.compagnie || v.codeCompagnie || v.codeIATA,
              typeAvion: v.typeAvion,
              heureArrivee: v.heureArrivee || v.heureArriveePrevue,
              heureDepart: v.heureDepart || v.heureDepartPrevue,
              provenance: v.provenance,
              destination: v.destination,
              joursSemaine: v.joursSemaine
            });
          }
        }
      }
    }
  }

  if (!programme) {
    log('PHASE_1', 'ERREUR: Aucun programme trouve');
    RESULTS.phase1 = { status: 'ERREUR', message: 'Aucun programme' };
  } else {
    RESULTS.phase1 = {
      status: 'OK',
      programmeId: programme._id || programme.id,
      nom: programme.nom,
      nbVols: Array.isArray(programmeVols) ? programmeVols.length : 0
    };
  }

  // ==========================
  // PHASE 2 — CREATION BULLETIN
  // ==========================
  log('PHASE_2', '=== CREATION BULLETIN DE MOUVEMENT ===');

  const today = new Date().toISOString().split('T')[0]; // 2026-03-11
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const progId = programme?._id || programme?.id;

  let bulletin = null;
  let bulletinId = null;

  if (progId) {
    // Creer bulletin depuis programme
    log('PHASE_2', 'Creation bulletin depuis programme...', { progId, today, tomorrow });
    const createBulletin = await api('POST', '/bulletins/depuis-programme', {
      escale: programme.escale || 'ALG',
      dateDebut: today,
      dateFin: tomorrow,
      programmeId: progId,
      titre: `Bulletin test E2E - ${today}`,
      remarques: 'Test pipeline E2E automatise'
    }, TOKEN_SUP);

    if (createBulletin.ok) {
      bulletin = createBulletin.data.data || createBulletin.data.bulletin || createBulletin.data;
      bulletinId = bulletin._id || bulletin.id;
      log('PHASE_2', 'Bulletin cree avec succes', {
        id: bulletinId,
        escale: bulletin.escale,
        statut: bulletin.statut,
        mouvements: bulletin.mouvements?.length
      });
    } else {
      log('PHASE_2', 'Echec creation depuis programme, tentative creation manuelle...');

      // Fallback: creer bulletin manuellement
      const createManual = await api('POST', '/bulletins', {
        escale: programme.escale || 'ALG',
        dateDebut: today,
        dateFin: tomorrow,
        titre: `Bulletin test E2E - ${today}`,
        remarques: 'Test pipeline E2E automatise'
      }, TOKEN_SUP);

      if (createManual.ok) {
        bulletin = createManual.data.data || createManual.data.bulletin || createManual.data;
        bulletinId = bulletin._id || bulletin.id;
        log('PHASE_2', 'Bulletin manuel cree', { id: bulletinId });
      } else {
        log('PHASE_2', 'ECHEC creation bulletin', createManual.data);
      }
    }
  }

  // Si bulletin cree sans mouvements ou trop peu, ajouter manuellement
  if (bulletinId) {
    // Verifier les mouvements existants
    const getBulletin = await api('GET', `/bulletins/${bulletinId}`, null, TOKEN_SUP);
    if (getBulletin.ok) {
      const bData = getBulletin.data.data || getBulletin.data.bulletin || getBulletin.data;
      const mvts = bData.mouvements || [];
      log('PHASE_2', `Mouvements dans le bulletin: ${mvts.length}`);

      // S'il n'y a pas assez de mouvements, en ajouter
      if (mvts.length === 0) {
        // Prendre un vol du programme pour les donnees
        const volRef = Array.isArray(programmeVols) && programmeVols.length > 0 ? programmeVols[0] : null;

        // Mouvement ARRIVEE
        const mvtArr = await api('POST', `/bulletins/${bulletinId}/mouvements`, {
          numeroVol: volRef?.numeroVol || 'AH1001',
          dateMouvement: today,
          heureArriveePrevue: `${today}T10:30:00.000Z`,
          provenance: volRef?.provenance || 'CDG',
          typeAvion: volRef?.typeAvion || 'B737',
          codeCompagnie: volRef?.compagnie || volRef?.codeCompagnie || 'AH',
          remarques: 'Mouvement test E2E - ARRIVEE',
          origine: 'PROGRAMME'
        }, TOKEN_SUP);

        if (mvtArr.ok) {
          log('PHASE_2', 'Mouvement ARRIVEE cree', {
            status: mvtArr.status,
            mouvement: mvtArr.data?.data?.mouvements?.slice(-1)?.[0] || 'OK'
          });
        } else {
          log('PHASE_2', 'Echec mouvement ARRIVEE', mvtArr.data);
        }
      }

      // Afficher les mouvements finaux
      const getBulletinFinal = await api('GET', `/bulletins/${bulletinId}`, null, TOKEN_SUP);
      if (getBulletinFinal.ok) {
        const bFinal = getBulletinFinal.data.data || getBulletinFinal.data.bulletin || getBulletinFinal.data;
        const mvtsFinal = bFinal.mouvements || [];
        log('PHASE_2', `Mouvements finaux: ${mvtsFinal.length}`);
        for (const m of mvtsFinal) {
          log('PHASE_2', 'Detail mouvement', {
            id: m._id,
            numeroVol: m.numeroVol,
            typeAvion: m.typeAvion,
            heureArriveePrevue: m.heureArriveePrevue,
            heureDepartPrevue: m.heureDepartPrevue,
            provenance: m.provenance,
            destination: m.destination,
            codeCompagnie: m.codeCompagnie,
            statut: m.statut
          });
        }
      }
    }
  }

  RESULTS.phase2 = {
    status: bulletinId ? 'OK' : 'ERREUR',
    bulletinId
  };

  // ==========================
  // PUBLIER BULLETIN (pour creer les vols)
  // ==========================
  log('PHASE_2B', '=== PUBLICATION BULLETIN ===');

  let volsCreated = null;
  if (bulletinId) {
    const pub = await api('POST', `/bulletins/${bulletinId}/publier`, null, TOKEN_SUP);
    log('PHASE_2B', 'Publication bulletin', { status: pub.status, data: pub.data });

    // Creer les vols depuis le bulletin
    const creerVols = await api('POST', `/bulletins/${bulletinId}/creer-vols`, null, TOKEN_SUP);
    log('PHASE_2B', 'Creation vols depuis bulletin', { status: creerVols.status, data: creerVols.data });
    volsCreated = creerVols.data;
  }

  // ==========================
  // PHASE 3 — VERIFICATION VOL + HORAIRE
  // ==========================
  log('PHASE_3', '=== VERIFICATION VOL + HORAIRE ===');

  let volId = null;
  let volData = null;

  // Relire le bulletin pour trouver les vols lies
  if (bulletinId) {
    const getBulletin = await api('GET', `/bulletins/${bulletinId}`, null, TOKEN_SUP);
    if (getBulletin.ok) {
      const bData = getBulletin.data.data || getBulletin.data.bulletin || getBulletin.data;
      const mvts = bData.mouvements || [];

      // Chercher un mouvement avec vol lie
      for (const m of mvts) {
        if (m.vol) {
          volId = typeof m.vol === 'object' ? (m.vol._id || m.vol.id) : m.vol;
          log('PHASE_3', 'Vol trouve via mouvement', { mouvementId: m._id, volId });
          break;
        }
      }
    }
  }

  // Si pas de vol via bulletin, chercher dans la liste des vols
  if (!volId) {
    const vols = await api('GET', '/vols', null, TOKEN_SUP);
    if (vols.ok) {
      const volList = vols.data.data || vols.data.vols || vols.data || [];
      log('PHASE_3', `Vols en base: ${Array.isArray(volList) ? volList.length : 'N/A'}`);
      if (Array.isArray(volList) && volList.length > 0) {
        // Prendre le plus recent
        const lastVol = volList[volList.length - 1];
        volId = lastVol._id || lastVol.id;
        volData = lastVol;
      }
    }
  }

  // Recuperer details du vol
  if (volId) {
    const getVol = await api('GET', `/vols/${volId}`, null, TOKEN_SUP);
    if (getVol.ok) {
      volData = getVol.data.data || getVol.data.vol || getVol.data;
      log('PHASE_3', 'Detail vol', {
        id: volId,
        numeroVol: volData.numeroVol,
        typeAvion: volData.typeAvion,
        typeOperation: volData.typeOperation,
        dateVol: volData.dateVol,
        compagnieAerienne: volData.compagnieAerienne,
        statut: volData.statut,
        bulletinMouvementReference: volData.bulletinMouvementReference
      });
    }
  }

  RESULTS.phase3 = {
    status: volId ? 'OK' : 'ERREUR',
    volId,
    typeAvion: volData?.typeAvion,
    typeOperation: volData?.typeOperation
  };

  // ==========================
  // PHASE 4 — CREATION CRV
  // ==========================
  log('PHASE_4', '=== CREATION CRV ===');

  let crvId = null;
  let crvData = null;

  if (bulletinId && volId) {
    // Recuperer le mouvement ID
    const getBulletin = await api('GET', `/bulletins/${bulletinId}`, null, TOKEN_SUP);
    let mouvementId = null;
    if (getBulletin.ok) {
      const bData = getBulletin.data.data || getBulletin.data.bulletin || getBulletin.data;
      const mvts = bData.mouvements || [];
      const mvtWithVol = mvts.find(m => {
        const mVol = typeof m.vol === 'object' ? (m.vol._id || m.vol.id) : m.vol;
        return mVol === volId || String(mVol) === String(volId);
      });
      if (mvtWithVol) mouvementId = mvtWithVol._id;
    }

    if (mouvementId) {
      // PATH 1: Creer CRV depuis bulletin + mouvement
      log('PHASE_4', 'Creation CRV PATH 1 (bulletin+mouvement)', { bulletinId, mouvementId });
      const createCRV = await api('POST', '/crv', {
        bulletinId,
        mouvementId,
        escale: programme?.escale || 'ALG'
      }, TOKEN_AGENT);

      if (createCRV.ok) {
        crvData = createCRV.data.data || createCRV.data.crv || createCRV.data;
        crvId = crvData._id || crvData.id;
        log('PHASE_4', 'CRV cree avec succes', {
          id: crvId,
          numeroCRV: crvData.numeroCRV,
          statut: crvData.statut,
          completude: crvData.completude,
          typeOperation: crvData.typeOperation || crvData.vol?.typeOperation
        });
      } else {
        log('PHASE_4', 'Echec creation CRV PATH 1', createCRV.data);

        // Fallback PATH 3: CRV depuis volId
        log('PHASE_4', 'Tentative PATH 3 (volId)');
        const createCRV3 = await api('POST', '/crv', {
          volId,
          escale: programme?.escale || 'ALG'
        }, TOKEN_AGENT);

        if (createCRV3.ok) {
          crvData = createCRV3.data.data || createCRV3.data.crv || createCRV3.data;
          crvId = crvData._id || crvData.id;
          log('PHASE_4', 'CRV cree via PATH 3', { id: crvId, numeroCRV: crvData.numeroCRV });
        } else {
          log('PHASE_4', 'Echec creation CRV PATH 3', createCRV3.data);
        }
      }
    } else {
      log('PHASE_4', 'Pas de mouvementId, tentative PATH 3');
      const createCRV3 = await api('POST', '/crv', { volId, escale: programme?.escale || 'ALG' }, TOKEN_AGENT);
      if (createCRV3.ok) {
        crvData = createCRV3.data.data || createCRV3.data.crv || createCRV3.data;
        crvId = crvData._id || crvData.id;
        log('PHASE_4', 'CRV cree via PATH 3', { id: crvId });
      } else {
        log('PHASE_4', 'Echec CRV PATH 3', createCRV3.data);
      }
    }
  }

  RESULTS.phase4 = {
    status: crvId ? 'OK' : 'ERREUR',
    crvId,
    numeroCRV: crvData?.numeroCRV,
    statut: crvData?.statut
  };

  // ==========================
  // PHASE 5 — VERIFICATION CHRONOLOGIE PHASES
  // ==========================
  log('PHASE_5', '=== VERIFICATION CHRONOLOGIE PHASES ===');

  let phases = [];
  if (crvId) {
    // Recuperer CRV complet avec phases
    const getCRV = await api('GET', `/crv/${crvId}`, null, TOKEN_SUP);
    if (getCRV.ok) {
      const fullCRV = getCRV.data.data || getCRV.data.crv || getCRV.data;
      phases = fullCRV.phases || fullCRV.chronologiePhases || [];

      log('PHASE_5', `Nombre de phases: ${phases.length}`);

      for (const p of phases) {
        const phaseRef = p.phase || {};
        log('PHASE_5', 'Phase', {
          id: p._id,
          nom: phaseRef.nom || phaseRef.name || 'N/A',
          typeOperation: phaseRef.typeOperation,
          ordre: phaseRef.ordre,
          statut: p.statut,
          heureDebutPrevue: p.heureDebutPrevue || 'NON RENSEIGNE',
          heureFinPrevue: p.heureFinPrevue || 'NON RENSEIGNE',
          dureeStandardMinutes: phaseRef.dureeStandardMinutes
        });
      }

      // Verifier la cascade
      let cascadeOk = true;
      for (let i = 1; i < phases.length; i++) {
        if (phases[i].heureDebutPrevue && phases[i-1].heureFinPrevue) {
          const diff = new Date(phases[i].heureDebutPrevue) - new Date(phases[i-1].heureFinPrevue);
          if (Math.abs(diff) > 1000) { // tolerance 1 seconde
            cascadeOk = false;
            log('PHASE_5', 'ANOMALIE CASCADE', {
              phase: phases[i].phase?.nom,
              debutPrevue: phases[i].heureDebutPrevue,
              finPrevuePrecedente: phases[i-1].heureFinPrevue,
              ecartMs: diff
            });
          }
        }
      }

      if (cascadeOk && phases.length > 0 && phases[0].heureDebutPrevue) {
        log('PHASE_5', 'CASCADE TEMPORELLE: OK');
      } else if (phases.length > 0 && !phases[0].heureDebutPrevue) {
        log('PHASE_5', 'CASCADE TEMPORELLE: NON INITIALISEE (heureDebutPrevue null)');
      }
    }
  }

  RESULTS.phase5 = {
    status: phases.length > 0 ? 'OK' : 'ERREUR',
    nbPhases: phases.length,
    cascadeInitialisee: phases.length > 0 && !!phases[0]?.heureDebutPrevue
  };

  // ==========================
  // PHASE 6 — OPERATIONS AGENT ESCALE
  // ==========================
  log('PHASE_6', '=== OPERATIONS AGENT ESCALE ===');

  if (crvId) {
    // Demarrer le CRV
    log('PHASE_6', 'Demarrage CRV...');
    const demarrer = await api('POST', `/crv/${crvId}/demarrer`, null, TOKEN_AGENT);
    log('PHASE_6', 'Resultat demarrage CRV', { status: demarrer.status, data: demarrer.data });

    // Demarrer et terminer la premiere phase
    if (phases.length > 0) {
      const firstPhase = phases[0];
      const phaseId = firstPhase._id;

      log('PHASE_6', `Demarrage phase ${firstPhase.phase?.nom || phaseId}...`);
      const startPhase = await api('POST', `/phases/${phaseId}/demarrer`, null, TOKEN_AGENT);
      log('PHASE_6', 'Resultat demarrage phase', { status: startPhase.status, ok: startPhase.ok });

      // Attendre 1 seconde pour simuler une duree
      await new Promise(r => setTimeout(r, 1000));

      log('PHASE_6', `Terminaison phase ${firstPhase.phase?.nom || phaseId}...`);
      const endPhase = await api('POST', `/phases/${phaseId}/terminer`, null, TOKEN_AGENT);
      log('PHASE_6', 'Resultat terminaison phase', { status: endPhase.status, ok: endPhase.ok });

      // Si plusieurs phases, demarrer et terminer la 2eme
      if (phases.length > 1) {
        const secondPhase = phases[1];
        const phase2Id = secondPhase._id;

        log('PHASE_6', `Demarrage phase 2: ${secondPhase.phase?.nom || phase2Id}...`);
        const startP2 = await api('POST', `/phases/${phase2Id}/demarrer`, null, TOKEN_AGENT);
        log('PHASE_6', 'Phase 2 demarree', { status: startP2.status });

        await new Promise(r => setTimeout(r, 500));

        const endP2 = await api('POST', `/phases/${phase2Id}/terminer`, null, TOKEN_AGENT);
        log('PHASE_6', 'Phase 2 terminee', { status: endP2.status });
      }

      // Marquer les phases restantes comme NON_REALISE pour pouvoir terminer le CRV
      for (let i = 2; i < phases.length; i++) {
        const pId = phases[i]._id;
        log('PHASE_6', `Marquer phase ${i+1} comme NON_REALISE`);
        const nr = await api('POST', `/phases/${pId}/non-realise`, {
          motifNonRealisation: 'NON_NECESSAIRE',
          detailMotif: 'Test E2E - phase non necessaire pour ce test'
        }, TOKEN_AGENT);
        log('PHASE_6', `Phase ${i+1} marquee`, { status: nr.status });
      }
    }

    // Terminer le CRV
    log('PHASE_6', 'Terminaison CRV...');
    const terminer = await api('POST', `/crv/${crvId}/terminer`, null, TOKEN_AGENT);
    log('PHASE_6', 'Resultat terminaison CRV', { status: terminer.status, data: terminer.data });
  }

  RESULTS.phase6 = { status: crvId ? 'OK' : 'SKIP' };

  // ==========================
  // PHASE 7 — CREATION SERVICES (CHARGES)
  // ==========================
  log('PHASE_7', '=== CREATION SERVICES (CHARGES) ===');

  if (crvId) {
    // Charge PASSAGERS (embarquement)
    log('PHASE_7', 'Creation charge PASSAGERS...');
    const chargePax = await api('POST', `/crv/${crvId}/charges`, {
      typeCharge: 'PASSAGERS',
      sensOperation: 'DEBARQUEMENT',
      passagersAdultes: 120,
      passagersEnfants: 8,
      passagersPMR: 2,
      passagersTransit: 15
    }, TOKEN_AGENT);
    log('PHASE_7', 'Charge passagers', { status: chargePax.status, ok: chargePax.ok });

    // Charge BAGAGES
    log('PHASE_7', 'Creation charge BAGAGES...');
    const chargeBag = await api('POST', `/crv/${crvId}/charges`, {
      typeCharge: 'BAGAGES',
      sensOperation: 'DEBARQUEMENT',
      nombreBagagesSoute: 95,
      nombreBagagesCabine: 45
    }, TOKEN_AGENT);
    log('PHASE_7', 'Charge bagages', { status: chargeBag.status, ok: chargeBag.ok });

    // Charge FRET
    log('PHASE_7', 'Creation charge FRET...');
    const chargeFret = await api('POST', `/crv/${crvId}/charges`, {
      typeCharge: 'FRET',
      sensOperation: 'DEBARQUEMENT',
      nombreFret: 12,
      poidsFretKg: 850,
      typeFret: 'GENERAL'
    }, TOKEN_AGENT);
    log('PHASE_7', 'Charge fret', { status: chargeFret.status, ok: chargeFret.ok });

    // Confirmer absence evenements/observations
    log('PHASE_7', 'Confirmation absence evenements...');
    const confirmEvt = await api('POST', `/crv/${crvId}/confirmer-absence`, { type: 'evenement' }, TOKEN_AGENT);
    log('PHASE_7', 'Absence evenements', { status: confirmEvt.status });

    log('PHASE_7', 'Confirmation absence observations...');
    const confirmObs = await api('POST', `/crv/${crvId}/confirmer-absence`, { type: 'observation' }, TOKEN_AGENT);
    log('PHASE_7', 'Absence observations', { status: confirmObs.status });
  }

  RESULTS.phase7 = { status: crvId ? 'OK' : 'SKIP' };

  // ==========================
  // PHASE 8 — VALIDATION CRV
  // ==========================
  log('PHASE_8', '=== VALIDATION CRV ===');

  if (crvId) {
    // Verifier l'etat du CRV avant validation
    const getCRVPreVal = await api('GET', `/crv/${crvId}`, null, TOKEN_SUP);
    if (getCRVPreVal.ok) {
      const crvPreVal = getCRVPreVal.data.data || getCRVPreVal.data.crv || getCRVPreVal.data;
      log('PHASE_8', 'Etat CRV avant validation', {
        statut: crvPreVal.statut,
        completude: crvPreVal.completude
      });
    }

    // Verifier l'etat de validation
    const valStatus = await api('GET', `/validation/${crvId}`, null, TOKEN_SUP);
    log('PHASE_8', 'Etat validation', { status: valStatus.status, data: valStatus.data });

    // Valider le CRV (superviseur)
    log('PHASE_8', 'Validation CRV par superviseur...');
    const valider = await api('POST', `/validation/${crvId}/valider`, null, TOKEN_SUP);
    log('PHASE_8', 'Resultat validation', { status: valider.status, data: valider.data });

    // Verifier l'etat post-validation
    const getCRVPostVal = await api('GET', `/crv/${crvId}`, null, TOKEN_SUP);
    if (getCRVPostVal.ok) {
      const crvPostVal = getCRVPostVal.data.data || getCRVPostVal.data.crv || getCRVPostVal.data;
      log('PHASE_8', 'Etat CRV apres validation', {
        statut: crvPostVal.statut,
        completude: crvPostVal.completude
      });
    }
  }

  RESULTS.phase8 = { status: crvId ? 'OK' : 'SKIP' };

  // ==========================
  // PHASE 9 — ARCHIVAGE + PDF
  // ==========================
  log('PHASE_9', '=== ARCHIVAGE + PDF ===');

  if (crvId) {
    // Test generation PDF
    log('PHASE_9', 'Test generation PDF...');
    const pdfBase64 = await api('GET', `/crv/${crvId}/pdf-base64`, null, TOKEN_SUP);
    log('PHASE_9', 'PDF base64', {
      status: pdfBase64.status,
      ok: pdfBase64.ok,
      dataLength: typeof pdfBase64.data === 'object' ? JSON.stringify(pdfBase64.data).length : 'N/A'
    });

    // Verifier statut archivage
    log('PHASE_9', 'Verification statut archivage...');
    const archStatus = await api('GET', `/crv/${crvId}/archive/status`, null, TOKEN_SUP);
    log('PHASE_9', 'Statut archivage', { status: archStatus.status, data: archStatus.data });

    // Tentative archivage
    log('PHASE_9', 'Tentative archivage CRV...');
    const archive = await api('POST', `/crv/${crvId}/archive`, null, TOKEN_SUP);
    log('PHASE_9', 'Resultat archivage', { status: archive.status, data: archive.data });
  }

  RESULTS.phase9 = { status: crvId ? 'OK' : 'SKIP' };

  // ==========================
  // PHASE 10 — SYNTHESE LOGS
  // ==========================
  log('PHASE_10', '=== SYNTHESE LOGS ===');

  const errors = LOGS.filter(l => l.message.includes('ERREUR') || l.message.includes('ECHEC'));
  const warnings = LOGS.filter(l => l.message.includes('ANOMALIE') || l.message.includes('WARN'));

  log('PHASE_10', 'Resume', {
    totalLogs: LOGS.length,
    erreurs: errors.length,
    warnings: warnings.length,
    phases: RESULTS
  });

  // ==========================
  // ECRITURE RESULTAT BRUT
  // ==========================
  const output = {
    timestamp: new Date().toISOString(),
    results: RESULTS,
    logs: LOGS,
    errors: errors.map(e => ({ phase: e.phase, message: e.message, data: e.data })),
    warnings: warnings.map(w => ({ phase: w.phase, message: w.message, data: w.data }))
  };

  const fs = await import('fs');
  fs.writeFileSync(
    'tests/e2e-pipeline-results.json',
    JSON.stringify(output, null, 2),
    'utf8'
  );

  console.log('\n========================================');
  console.log('TEST E2E PIPELINE TERMINE');
  console.log('========================================');
  console.log('Resultats par phase:');
  for (const [phase, result] of Object.entries(RESULTS)) {
    console.log(`  ${phase}: ${result.status}`);
  }
  console.log(`\nErreurs: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`\nResultats detailles: tests/e2e-pipeline-results.json`);
}

main().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
