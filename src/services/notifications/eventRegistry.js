/**
 * EVENT REGISTRY — Registre officiel des événements métier CRV
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * Ce fichier est la SOURCE UNIQUE de vérité pour tous les événements notifiables.
 * 82 événements × 12 domaines.
 *
 * AUCUNE MODIFICATION DES FICHIERS EXISTANTS.
 */

// ─── DOMAINES ─────────────────────────────────────────────────
export const EVENT_DOMAINS = Object.freeze({
  CRV: 'CRV',
  VALIDATION: 'VALIDATION',
  ANNULATION: 'ANNULATION',
  ARCHIVAGE: 'ARCHIVAGE',
  PHASES: 'PHASES',
  BULLETIN: 'BULLETIN',
  PROGRAMME: 'PROGRAMME',
  CHARGES: 'CHARGES',
  SLA: 'SLA',
  AUTH: 'AUTH',
  ENGINS: 'ENGINS',
  AVIONS: 'AVIONS'
});

// ─── PRIORITÉS ────────────────────────────────────────────────
export const EVENT_PRIORITIES = Object.freeze({
  CRITIQUE: 'CRITIQUE',
  HAUTE: 'HAUTE',
  NORMALE: 'NORMALE',
  BASSE: 'BASSE'
});

// ─── NOMS D'ÉVÉNEMENTS (constantes) ──────────────────────────
export const EVENTS = Object.freeze({
  // CRV (16)
  CRV_CREE: 'CRV_CREE',
  CRV_DEMARRE: 'CRV_DEMARRE',
  CRV_TERMINE: 'CRV_TERMINE',
  CRV_MIS_A_JOUR: 'CRV_MIS_A_JOUR',
  CRV_SUPPRIME: 'CRV_SUPPRIME',
  CRV_CHARGE_AJOUTEE: 'CRV_CHARGE_AJOUTEE',
  CRV_EVENEMENT_AJOUTE: 'CRV_EVENEMENT_AJOUTE',
  CRV_INCIDENT_CRITIQUE: 'CRV_INCIDENT_CRITIQUE',
  CRV_OBSERVATION_AJOUTEE: 'CRV_OBSERVATION_AJOUTEE',
  CRV_HORAIRE_MIS_A_JOUR: 'CRV_HORAIRE_MIS_A_JOUR',
  CRV_ABSENCE_CONFIRMEE: 'CRV_ABSENCE_CONFIRMEE',
  CRV_ABSENCE_ANNULEE: 'CRV_ABSENCE_ANNULEE',
  CRV_PERSONNEL_AJOUTE: 'CRV_PERSONNEL_AJOUTE',
  CRV_PERSONNEL_MIS_A_JOUR: 'CRV_PERSONNEL_MIS_A_JOUR',
  CRV_PERSONNEL_SUPPRIME: 'CRV_PERSONNEL_SUPPRIME',
  CRV_PRET_VALIDATION: 'CRV_PRET_VALIDATION',

  // Validation (5)
  CRV_VALIDE: 'CRV_VALIDE',
  CRV_VERROUILLE: 'CRV_VERROUILLE',
  CRV_DEVERROUILLE: 'CRV_DEVERROUILLE',
  CRV_REJETE: 'CRV_REJETE',
  CRV_VALIDATION_ECHOUEE: 'CRV_VALIDATION_ECHOUEE',

  // Annulation (2)
  CRV_ANNULE: 'CRV_ANNULE',
  CRV_REACTIVE: 'CRV_REACTIVE',

  // Archivage (3)
  CRV_ARCHIVE: 'CRV_ARCHIVE',
  CRV_ARCHIVAGE_ECHOUE: 'CRV_ARCHIVAGE_ECHOUE',
  ARCHIVAGE_SERVICE_ERREUR: 'ARCHIVAGE_SERVICE_ERREUR',

  // Phases (5)
  PHASE_DEMARREE: 'PHASE_DEMARREE',
  PHASE_TERMINEE: 'PHASE_TERMINEE',
  PHASE_NON_REALISEE: 'PHASE_NON_REALISEE',
  PHASE_MISE_A_JOUR: 'PHASE_MISE_A_JOUR',
  PHASES_INITIALISEES: 'PHASES_INITIALISEES',

  // Bulletin (10)
  BULLETIN_CREE: 'BULLETIN_CREE',
  BULLETIN_DEPUIS_PROGRAMME: 'BULLETIN_DEPUIS_PROGRAMME',
  BULLETIN_PUBLIE: 'BULLETIN_PUBLIE',
  BULLETIN_ARCHIVE: 'BULLETIN_ARCHIVE',
  MOUVEMENT_AJOUTE: 'MOUVEMENT_AJOUTE',
  MOUVEMENT_MODIFIE: 'MOUVEMENT_MODIFIE',
  MOUVEMENT_SUPPRIME: 'MOUVEMENT_SUPPRIME',
  MOUVEMENT_ANNULE: 'MOUVEMENT_ANNULE',
  VOL_HORS_PROGRAMME: 'VOL_HORS_PROGRAMME',
  VOLS_CREES_BULLETIN: 'VOLS_CREES_BULLETIN',

  // Programme (7)
  PROGRAMME_CREE: 'PROGRAMME_CREE',
  PROGRAMME_MIS_A_JOUR: 'PROGRAMME_MIS_A_JOUR',
  PROGRAMME_SUPPRIME: 'PROGRAMME_SUPPRIME',
  PROGRAMME_VALIDE: 'PROGRAMME_VALIDE',
  PROGRAMME_ACTIVE: 'PROGRAMME_ACTIVE',
  PROGRAMME_SUSPENDU: 'PROGRAMME_SUSPENDU',
  PROGRAMME_DUPLIQUE: 'PROGRAMME_DUPLIQUE',

  // Charges (8)
  FRET_MIS_A_JOUR: 'FRET_MIS_A_JOUR',
  MARCHANDISE_DANGEREUSE_AJOUTEE: 'MARCHANDISE_DANGEREUSE_AJOUTEE',
  MARCHANDISE_DANGEREUSE_RETIREE: 'MARCHANDISE_DANGEREUSE_RETIREE',
  MARCHANDISE_DANGEREUSE_VALIDEE: 'MARCHANDISE_DANGEREUSE_VALIDEE',
  PASSAGERS_CATEGORIES_MAJ: 'PASSAGERS_CATEGORIES_MAJ',
  PASSAGERS_CLASSES_MAJ: 'PASSAGERS_CLASSES_MAJ',
  PASSAGERS_BESOINS_MEDICAUX: 'PASSAGERS_BESOINS_MEDICAUX',
  PASSAGERS_MINEURS_MAJ: 'PASSAGERS_MINEURS_MAJ',

  // SLA (10)
  SLA_CRV_WARNING: 'SLA_CRV_WARNING',
  SLA_CRV_CRITIQUE: 'SLA_CRV_CRITIQUE',
  SLA_CRV_DEPASSE: 'SLA_CRV_DEPASSE',
  SLA_PHASE_WARNING: 'SLA_PHASE_WARNING',
  SLA_PHASE_CRITIQUE: 'SLA_PHASE_CRITIQUE',
  SLA_PHASE_DEPASSE: 'SLA_PHASE_DEPASSE',
  SLA_CONFIG_MODIFIEE: 'SLA_CONFIG_MODIFIEE',
  // Tâches fines SLA (phases fines) — Mission SLA_FULL_COVERAGE_BACK / M5
  SLA_TACHE_WARNING: 'SLA_TACHE_WARNING',
  SLA_TACHE_CRITIQUE: 'SLA_TACHE_CRITIQUE',
  SLA_TACHE_DEPASSE: 'SLA_TACHE_DEPASSE',

  // Auth (5)
  AUTH_CONNEXION: 'AUTH_CONNEXION',
  AUTH_INSCRIPTION: 'AUTH_INSCRIPTION',
  AUTH_MOT_DE_PASSE_CHANGE: 'AUTH_MOT_DE_PASSE_CHANGE',
  AUTH_COMPTE_VALIDE: 'AUTH_COMPTE_VALIDE',
  AUTH_CONNEXION_ECHOUEE: 'AUTH_CONNEXION_ECHOUEE',

  // Utilisateurs (5)
  UTILISATEUR_CREE: 'UTILISATEUR_CREE',
  UTILISATEUR_MIS_A_JOUR: 'UTILISATEUR_MIS_A_JOUR',
  UTILISATEUR_SUPPRIME: 'UTILISATEUR_SUPPRIME',
  UTILISATEUR_DESACTIVE: 'UTILISATEUR_DESACTIVE',
  UTILISATEUR_REACTIVE: 'UTILISATEUR_REACTIVE',

  // Engins (5)
  ENGIN_CREE: 'ENGIN_CREE',
  ENGIN_MIS_A_JOUR: 'ENGIN_MIS_A_JOUR',
  ENGIN_SUPPRIME: 'ENGIN_SUPPRIME',
  ENGIN_AFFECTE_CRV: 'ENGIN_AFFECTE_CRV',
  ENGIN_RETIRE_CRV: 'ENGIN_RETIRE_CRV',

  // Avions (4)
  AVION_CONFIG_MAJ: 'AVION_CONFIG_MAJ',
  AVION_VERSION_CREEE: 'AVION_VERSION_CREEE',
  AVION_VERSION_RESTAUREE: 'AVION_VERSION_RESTAUREE',
  AVION_REVISION_PROCHE: 'AVION_REVISION_PROCHE'
});

// ─── METADATA DES ÉVÉNEMENTS ─────────────────────────────────
// Chaque événement possède: domain, priority, description, messageTemplate
const D = EVENT_DOMAINS;
const P = EVENT_PRIORITIES;

export const EVENT_METADATA = Object.freeze({
  // ── CRV ──
  [EVENTS.CRV_CREE]: {
    domain: D.CRV, priority: P.NORMALE,
    description: 'Nouveau CRV créé',
    messageTemplate: { titre: 'Nouveau CRV {{numeroCRV}}', message: 'Le CRV {{numeroCRV}} a été créé par {{userName}}.' }
  },
  [EVENTS.CRV_DEMARRE]: {
    domain: D.CRV, priority: P.NORMALE,
    description: 'CRV démarré (EN_COURS)',
    messageTemplate: { titre: 'CRV {{numeroCRV}} démarré', message: 'Le CRV {{numeroCRV}} est passé en cours par {{userName}}.' }
  },
  [EVENTS.CRV_TERMINE]: {
    domain: D.CRV, priority: P.HAUTE,
    description: 'CRV terminé — complétude calculée',
    messageTemplate: { titre: 'CRV {{numeroCRV}} terminé', message: 'Le CRV {{numeroCRV}} a été terminé par {{userName}}. Complétude: {{completude}}%.' }
  },
  [EVENTS.CRV_MIS_A_JOUR]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'CRV modifié',
    messageTemplate: { titre: 'CRV {{numeroCRV}} modifié', message: 'Le CRV {{numeroCRV}} a été modifié par {{userName}}.' }
  },
  [EVENTS.CRV_SUPPRIME]: {
    domain: D.CRV, priority: P.HAUTE,
    description: 'CRV supprimé',
    messageTemplate: { titre: 'CRV {{numeroCRV}} supprimé', message: 'Le CRV {{numeroCRV}} a été supprimé par {{userName}}.' }
  },
  [EVENTS.CRV_CHARGE_AJOUTEE]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Charge ajoutée au CRV',
    messageTemplate: { titre: 'Charge ajoutée — CRV {{numeroCRV}}', message: 'Une charge a été ajoutée au CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_EVENEMENT_AJOUTE]: {
    domain: D.CRV, priority: P.NORMALE,
    description: 'Événement opérationnel ajouté',
    messageTemplate: { titre: 'Événement — CRV {{numeroCRV}}', message: 'Un événement opérationnel a été ajouté au CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_INCIDENT_CRITIQUE]: {
    domain: D.CRV, priority: P.CRITIQUE,
    description: 'Incident CRITIQUE signalé',
    messageTemplate: { titre: '🚨 INCIDENT CRITIQUE — CRV {{numeroCRV}}', message: 'Un incident CRITIQUE a été signalé sur le CRV {{numeroCRV}} par {{userName}}. Action immédiate requise.' }
  },
  [EVENTS.CRV_OBSERVATION_AJOUTEE]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Observation ajoutée',
    messageTemplate: { titre: 'Observation — CRV {{numeroCRV}}', message: 'Une observation a été ajoutée au CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_HORAIRE_MIS_A_JOUR]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Horaire CRV mis à jour',
    messageTemplate: { titre: 'Horaire modifié — CRV {{numeroCRV}}', message: 'L\'horaire du CRV {{numeroCRV}} a été mis à jour par {{userName}}.' }
  },
  [EVENTS.CRV_ABSENCE_CONFIRMEE]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Absence confirmée sur CRV',
    messageTemplate: { titre: 'Absence confirmée — CRV {{numeroCRV}}', message: 'Absence confirmée sur le CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_ABSENCE_ANNULEE]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Confirmation d\'absence annulée',
    messageTemplate: { titre: 'Absence annulée — CRV {{numeroCRV}}', message: 'La confirmation d\'absence a été annulée sur le CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_PERSONNEL_AJOUTE]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Personnel ajouté au CRV',
    messageTemplate: { titre: 'Personnel ajouté — CRV {{numeroCRV}}', message: 'Du personnel a été ajouté au CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_PERSONNEL_MIS_A_JOUR]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Personnel modifié sur CRV',
    messageTemplate: { titre: 'Personnel modifié — CRV {{numeroCRV}}', message: 'Le personnel du CRV {{numeroCRV}} a été modifié par {{userName}}.' }
  },
  [EVENTS.CRV_PERSONNEL_SUPPRIME]: {
    domain: D.CRV, priority: P.BASSE,
    description: 'Personnel retiré du CRV',
    messageTemplate: { titre: 'Personnel retiré — CRV {{numeroCRV}}', message: 'Du personnel a été retiré du CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.CRV_PRET_VALIDATION]: {
    domain: D.CRV, priority: P.HAUTE,
    description: 'CRV prêt pour validation (complétude >= 80%)',
    messageTemplate: { titre: 'CRV {{numeroCRV}} prêt pour validation', message: 'Le CRV {{numeroCRV}} a atteint {{completude}}% de complétude et est prêt pour validation.' }
  },

  // ── VALIDATION ──
  [EVENTS.CRV_VALIDE]: {
    domain: D.VALIDATION, priority: P.HAUTE,
    description: 'CRV validé par superviseur/manager',
    messageTemplate: { titre: '✅ CRV {{numeroCRV}} validé', message: 'Le CRV {{numeroCRV}} a été validé par {{userName}}.' }
  },
  [EVENTS.CRV_VERROUILLE]: {
    domain: D.VALIDATION, priority: P.HAUTE,
    description: 'CRV verrouillé',
    messageTemplate: { titre: '🔒 CRV {{numeroCRV}} verrouillé', message: 'Le CRV {{numeroCRV}} a été verrouillé par {{userName}}.' }
  },
  [EVENTS.CRV_DEVERROUILLE]: {
    domain: D.VALIDATION, priority: P.HAUTE,
    description: 'CRV déverrouillé',
    messageTemplate: { titre: '🔓 CRV {{numeroCRV}} déverrouillé', message: 'Le CRV {{numeroCRV}} a été déverrouillé par {{userName}}. Raison: {{raison}}.' }
  },
  [EVENTS.CRV_REJETE]: {
    domain: D.VALIDATION, priority: P.HAUTE,
    description: 'CRV rejeté lors de la validation',
    messageTemplate: { titre: '❌ CRV {{numeroCRV}} rejeté', message: 'Le CRV {{numeroCRV}} a été rejeté par {{userName}}. Motif: {{motif}}.' }
  },
  [EVENTS.CRV_VALIDATION_ECHOUEE]: {
    domain: D.VALIDATION, priority: P.NORMALE,
    description: 'Tentative de validation échouée (conditions non remplies)',
    messageTemplate: { titre: 'Validation échouée — CRV {{numeroCRV}}', message: 'La validation du CRV {{numeroCRV}} a échoué. Conditions non remplies.' }
  },

  // ── ANNULATION ──
  [EVENTS.CRV_ANNULE]: {
    domain: D.ANNULATION, priority: P.CRITIQUE,
    description: 'CRV annulé',
    messageTemplate: { titre: '⛔ CRV {{numeroCRV}} ANNULÉ', message: 'Le CRV {{numeroCRV}} a été annulé par {{userName}}. Motif: {{motif}}.' }
  },
  [EVENTS.CRV_REACTIVE]: {
    domain: D.ANNULATION, priority: P.HAUTE,
    description: 'CRV réactivé après annulation',
    messageTemplate: { titre: '♻️ CRV {{numeroCRV}} réactivé', message: 'Le CRV {{numeroCRV}} a été réactivé par {{userName}}.' }
  },

  // ── ARCHIVAGE ──
  [EVENTS.CRV_ARCHIVE]: {
    domain: D.ARCHIVAGE, priority: P.NORMALE,
    description: 'CRV archivé avec succès',
    messageTemplate: { titre: '📦 CRV {{numeroCRV}} archivé', message: 'Le CRV {{numeroCRV}} a été archivé avec succès sur Google Drive.' }
  },
  [EVENTS.CRV_ARCHIVAGE_ECHOUE]: {
    domain: D.ARCHIVAGE, priority: P.CRITIQUE,
    description: 'Échec de l\'archivage CRV',
    messageTemplate: { titre: '🚨 Échec archivage — CRV {{numeroCRV}}', message: 'L\'archivage du CRV {{numeroCRV}} a échoué. Intervention requise.' }
  },
  [EVENTS.ARCHIVAGE_SERVICE_ERREUR]: {
    domain: D.ARCHIVAGE, priority: P.CRITIQUE,
    description: 'Service d\'archivage Google Drive indisponible',
    messageTemplate: { titre: '🚨 Service archivage indisponible', message: 'Le service d\'archivage Google Drive est indisponible. Vérification requise.' }
  },

  // ── PHASES ──
  [EVENTS.PHASE_DEMARREE]: {
    domain: D.PHASES, priority: P.NORMALE,
    description: 'Phase de vol démarrée',
    messageTemplate: { titre: 'Phase démarrée — CRV {{numeroCRV}}', message: 'La phase {{phaseNom}} du CRV {{numeroCRV}} a été démarrée par {{userName}}.' }
  },
  [EVENTS.PHASE_TERMINEE]: {
    domain: D.PHASES, priority: P.NORMALE,
    description: 'Phase de vol terminée',
    messageTemplate: { titre: 'Phase terminée — CRV {{numeroCRV}}', message: 'La phase {{phaseNom}} du CRV {{numeroCRV}} a été terminée.' }
  },
  [EVENTS.PHASE_NON_REALISEE]: {
    domain: D.PHASES, priority: P.HAUTE,
    description: 'Phase marquée non réalisée (justification requise)',
    messageTemplate: { titre: '⚠️ Phase non réalisée — CRV {{numeroCRV}}', message: 'La phase {{phaseNom}} du CRV {{numeroCRV}} a été marquée non réalisée par {{userName}}. Justification: {{justification}}.' }
  },
  [EVENTS.PHASE_MISE_A_JOUR]: {
    domain: D.PHASES, priority: P.BASSE,
    description: 'Phase modifiée',
    messageTemplate: { titre: 'Phase modifiée — CRV {{numeroCRV}}', message: 'Une phase du CRV {{numeroCRV}} a été modifiée par {{userName}}.' }
  },
  [EVENTS.PHASES_INITIALISEES]: {
    domain: D.PHASES, priority: P.BASSE,
    description: 'Phases initialisées pour un CRV',
    messageTemplate: { titre: 'Phases initialisées — CRV {{numeroCRV}}', message: 'Les phases du CRV {{numeroCRV}} ont été initialisées.' }
  },

  // ── BULLETIN ──
  [EVENTS.BULLETIN_CREE]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Bulletin de mouvement créé',
    messageTemplate: { titre: 'Nouveau bulletin {{numeroBulletin}}', message: 'Le bulletin {{numeroBulletin}} a été créé par {{userName}}.' }
  },
  [EVENTS.BULLETIN_DEPUIS_PROGRAMME]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Bulletin créé depuis un programme',
    messageTemplate: { titre: 'Bulletin {{numeroBulletin}} (programme)', message: 'Le bulletin {{numeroBulletin}} a été créé depuis un programme par {{userName}}.' }
  },
  [EVENTS.BULLETIN_PUBLIE]: {
    domain: D.BULLETIN, priority: P.HAUTE,
    description: 'Bulletin publié — opérationnel',
    messageTemplate: { titre: '📢 Bulletin {{numeroBulletin}} publié', message: 'Le bulletin {{numeroBulletin}} a été publié par {{userName}} et est maintenant opérationnel.' }
  },
  [EVENTS.BULLETIN_ARCHIVE]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Bulletin archivé',
    messageTemplate: { titre: 'Bulletin {{numeroBulletin}} archivé', message: 'Le bulletin {{numeroBulletin}} a été archivé.' }
  },
  [EVENTS.MOUVEMENT_AJOUTE]: {
    domain: D.BULLETIN, priority: P.BASSE,
    description: 'Mouvement ajouté au bulletin',
    messageTemplate: { titre: 'Mouvement ajouté — {{numeroBulletin}}', message: 'Un mouvement a été ajouté au bulletin {{numeroBulletin}} par {{userName}}.' }
  },
  [EVENTS.MOUVEMENT_MODIFIE]: {
    domain: D.BULLETIN, priority: P.BASSE,
    description: 'Mouvement modifié',
    messageTemplate: { titre: 'Mouvement modifié — {{numeroBulletin}}', message: 'Un mouvement du bulletin {{numeroBulletin}} a été modifié par {{userName}}.' }
  },
  [EVENTS.MOUVEMENT_SUPPRIME]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Mouvement supprimé du bulletin',
    messageTemplate: { titre: 'Mouvement supprimé — {{numeroBulletin}}', message: 'Un mouvement du bulletin {{numeroBulletin}} a été supprimé par {{userName}}.' }
  },
  [EVENTS.MOUVEMENT_ANNULE]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Mouvement annulé',
    messageTemplate: { titre: 'Mouvement annulé — {{numeroBulletin}}', message: 'Un mouvement du bulletin {{numeroBulletin}} a été annulé par {{userName}}.' }
  },
  [EVENTS.VOL_HORS_PROGRAMME]: {
    domain: D.BULLETIN, priority: P.HAUTE,
    description: 'Vol hors programme ajouté',
    messageTemplate: { titre: '✈️ Vol hors programme — {{numeroBulletin}}', message: 'Un vol hors programme a été ajouté au bulletin {{numeroBulletin}} par {{userName}}.' }
  },
  [EVENTS.VOLS_CREES_BULLETIN]: {
    domain: D.BULLETIN, priority: P.NORMALE,
    description: 'Vols créés depuis le bulletin',
    messageTemplate: { titre: 'Vols créés — {{numeroBulletin}}', message: 'Les vols ont été créés depuis le bulletin {{numeroBulletin}}.' }
  },

  // ── PROGRAMME ──
  [EVENTS.PROGRAMME_CREE]: {
    domain: D.PROGRAMME, priority: P.NORMALE,
    description: 'Programme de vol créé',
    messageTemplate: { titre: 'Programme {{titre}} créé', message: 'Le programme de vol "{{titre}}" a été créé par {{userName}}.' }
  },
  [EVENTS.PROGRAMME_MIS_A_JOUR]: {
    domain: D.PROGRAMME, priority: P.BASSE,
    description: 'Programme de vol modifié',
    messageTemplate: { titre: 'Programme {{titre}} modifié', message: 'Le programme "{{titre}}" a été modifié par {{userName}}.' }
  },
  [EVENTS.PROGRAMME_SUPPRIME]: {
    domain: D.PROGRAMME, priority: P.HAUTE,
    description: 'Programme de vol supprimé',
    messageTemplate: { titre: 'Programme supprimé', message: 'Un programme de vol a été supprimé par {{userName}}.' }
  },
  [EVENTS.PROGRAMME_VALIDE]: {
    domain: D.PROGRAMME, priority: P.HAUTE,
    description: 'Programme de vol validé',
    messageTemplate: { titre: '✅ Programme {{titre}} validé', message: 'Le programme "{{titre}}" a été validé par {{userName}}.' }
  },
  [EVENTS.PROGRAMME_ACTIVE]: {
    domain: D.PROGRAMME, priority: P.HAUTE,
    description: 'Programme de vol activé — opérationnel',
    messageTemplate: { titre: '🟢 Programme {{titre}} activé', message: 'Le programme "{{titre}}" est maintenant actif et opérationnel.' }
  },
  [EVENTS.PROGRAMME_SUSPENDU]: {
    domain: D.PROGRAMME, priority: P.HAUTE,
    description: 'Programme de vol suspendu',
    messageTemplate: { titre: '⏸️ Programme {{titre}} suspendu', message: 'Le programme "{{titre}}" a été suspendu par {{userName}}.' }
  },
  [EVENTS.PROGRAMME_DUPLIQUE]: {
    domain: D.PROGRAMME, priority: P.BASSE,
    description: 'Programme de vol dupliqué',
    messageTemplate: { titre: 'Programme dupliqué', message: 'Le programme "{{titre}}" a été dupliqué par {{userName}}.' }
  },

  // ── CHARGES ──
  [EVENTS.FRET_MIS_A_JOUR]: {
    domain: D.CHARGES, priority: P.BASSE,
    description: 'Données fret mises à jour',
    messageTemplate: { titre: 'Fret modifié — CRV {{numeroCRV}}', message: 'Les données fret du CRV {{numeroCRV}} ont été mises à jour par {{userName}}.' }
  },
  [EVENTS.MARCHANDISE_DANGEREUSE_AJOUTEE]: {
    domain: D.CHARGES, priority: P.CRITIQUE,
    description: 'Marchandise dangereuse signalée',
    messageTemplate: { titre: '🚨 DGR ajoutée — CRV {{numeroCRV}}', message: 'Une marchandise dangereuse a été signalée sur le CRV {{numeroCRV}} par {{userName}}. Action immédiate requise.' }
  },
  [EVENTS.MARCHANDISE_DANGEREUSE_RETIREE]: {
    domain: D.CHARGES, priority: P.HAUTE,
    description: 'Marchandise dangereuse retirée',
    messageTemplate: { titre: 'DGR retirée — CRV {{numeroCRV}}', message: 'Une marchandise dangereuse a été retirée du CRV {{numeroCRV}} par {{userName}}.' }
  },
  [EVENTS.MARCHANDISE_DANGEREUSE_VALIDEE]: {
    domain: D.CHARGES, priority: P.HAUTE,
    description: 'Marchandise dangereuse validée',
    messageTemplate: { titre: 'DGR validée — CRV {{numeroCRV}}', message: 'La marchandise dangereuse du CRV {{numeroCRV}} a été validée par {{userName}}.' }
  },
  [EVENTS.PASSAGERS_CATEGORIES_MAJ]: {
    domain: D.CHARGES, priority: P.BASSE,
    description: 'Catégories passagers mises à jour',
    messageTemplate: { titre: 'Passagers — CRV {{numeroCRV}}', message: 'Les catégories de passagers du CRV {{numeroCRV}} ont été mises à jour.' }
  },
  [EVENTS.PASSAGERS_CLASSES_MAJ]: {
    domain: D.CHARGES, priority: P.BASSE,
    description: 'Classes passagers mises à jour',
    messageTemplate: { titre: 'Classes passagers — CRV {{numeroCRV}}', message: 'Les classes de passagers du CRV {{numeroCRV}} ont été mises à jour.' }
  },
  [EVENTS.PASSAGERS_BESOINS_MEDICAUX]: {
    domain: D.CHARGES, priority: P.NORMALE,
    description: 'Besoins médicaux signalés',
    messageTemplate: { titre: 'Besoins médicaux — CRV {{numeroCRV}}', message: 'Des besoins médicaux ont été signalés sur le CRV {{numeroCRV}}.' }
  },
  [EVENTS.PASSAGERS_MINEURS_MAJ]: {
    domain: D.CHARGES, priority: P.NORMALE,
    description: 'Mineurs non accompagnés mis à jour',
    messageTemplate: { titre: 'Mineurs — CRV {{numeroCRV}}', message: 'La liste des mineurs du CRV {{numeroCRV}} a été mise à jour.' }
  },

  // ── SLA ──
  [EVENTS.SLA_CRV_WARNING]: {
    domain: D.SLA, priority: P.HAUTE,
    description: 'SLA CRV à 75% — attention requise',
    messageTemplate: { titre: '⚠️ SLA CRV {{numeroCRV}} — 75%', message: 'Le CRV {{numeroCRV}} a consommé 75% de son SLA. {{heuresRestantes}}h restantes.' }
  },
  [EVENTS.SLA_CRV_CRITIQUE]: {
    domain: D.SLA, priority: P.CRITIQUE,
    description: 'SLA CRV à 90% — critique',
    messageTemplate: { titre: '🔴 SLA CRITIQUE — CRV {{numeroCRV}}', message: 'Le CRV {{numeroCRV}} a consommé 90% de son SLA. {{heuresRestantes}}h restantes. Action urgente requise.' }
  },
  [EVENTS.SLA_CRV_DEPASSE]: {
    domain: D.SLA, priority: P.CRITIQUE,
    description: 'SLA CRV dépassé — 100%',
    messageTemplate: { titre: '🚨 SLA DÉPASSÉ — CRV {{numeroCRV}}', message: 'Le SLA du CRV {{numeroCRV}} est DÉPASSÉ. Escalade immédiate requise.' }
  },
  [EVENTS.SLA_PHASE_WARNING]: {
    domain: D.SLA, priority: P.HAUTE,
    description: 'SLA Phase à 75%',
    messageTemplate: { titre: '⚠️ SLA Phase — CRV {{numeroCRV}}', message: 'La phase {{phaseNom}} du CRV {{numeroCRV}} a consommé 75% de son SLA.' }
  },
  [EVENTS.SLA_PHASE_CRITIQUE]: {
    domain: D.SLA, priority: P.HAUTE,
    description: 'SLA Phase à 90%',
    messageTemplate: { titre: '🔴 SLA Phase critique — CRV {{numeroCRV}}', message: 'La phase {{phaseNom}} du CRV {{numeroCRV}} a consommé 90% de son SLA.' }
  },
  [EVENTS.SLA_PHASE_DEPASSE]: {
    domain: D.SLA, priority: P.CRITIQUE,
    description: 'SLA Phase dépassé — 100%',
    messageTemplate: { titre: '🚨 SLA Phase DÉPASSÉ — CRV {{numeroCRV}}', message: 'Le SLA de la phase {{phaseNom}} du CRV {{numeroCRV}} est DÉPASSÉ.' }
  },
  [EVENTS.SLA_CONFIG_MODIFIEE]: {
    domain: D.SLA, priority: P.NORMALE,
    description: 'Configuration SLA modifiée',
    messageTemplate: { titre: 'Configuration SLA modifiée', message: 'La configuration SLA a été modifiée par {{userName}}.' }
  },
  // ── Tâches fines SLA (M5) ──
  [EVENTS.SLA_TACHE_WARNING]: {
    domain: D.SLA, priority: P.HAUTE,
    description: 'SLA tâche fine à 75% — alerte',
    messageTemplate: { titre: '⚠️ SLA tâche {{phaseLibelle}} — CRV {{numeroCRV}}', message: 'La tâche {{phaseLibelle}} du CRV {{numeroCRV}} a consommé 75% de son SLA ({{domaineSLA}}).' }
  },
  [EVENTS.SLA_TACHE_CRITIQUE]: {
    domain: D.SLA, priority: P.CRITIQUE,
    description: 'SLA tâche fine à 90% — critique',
    messageTemplate: { titre: '🔴 SLA tâche CRITIQUE — {{phaseLibelle}} / CRV {{numeroCRV}}', message: 'La tâche {{phaseLibelle}} du CRV {{numeroCRV}} a consommé 90% de son SLA ({{domaineSLA}}). Action urgente requise.' }
  },
  [EVENTS.SLA_TACHE_DEPASSE]: {
    domain: D.SLA, priority: P.CRITIQUE,
    description: 'SLA tâche fine dépassé — 100%',
    messageTemplate: { titre: '🚨 SLA tâche DÉPASSÉ — {{phaseLibelle}} / CRV {{numeroCRV}}', message: 'Le SLA de la tâche {{phaseLibelle}} du CRV {{numeroCRV}} est DÉPASSÉ ({{domaineSLA}}). Escalade immédiate.' }
  },

  // ── AUTH ──
  [EVENTS.AUTH_CONNEXION]: {
    domain: D.AUTH, priority: P.BASSE,
    description: 'Utilisateur connecté',
    messageTemplate: { titre: 'Connexion', message: '{{userName}} s\'est connecté.' }
  },
  [EVENTS.AUTH_INSCRIPTION]: {
    domain: D.AUTH, priority: P.HAUTE,
    description: 'Nouvelle inscription — validation requise',
    messageTemplate: { titre: '🆕 Nouvelle inscription', message: '{{userName}} ({{email}}) s\'est inscrit. Validation du compte requise.' }
  },
  [EVENTS.AUTH_MOT_DE_PASSE_CHANGE]: {
    domain: D.AUTH, priority: P.NORMALE,
    description: 'Mot de passe changé',
    messageTemplate: { titre: 'Mot de passe changé', message: '{{userName}} a changé son mot de passe.' }
  },
  [EVENTS.AUTH_COMPTE_VALIDE]: {
    domain: D.AUTH, priority: P.NORMALE,
    description: 'Compte utilisateur validé par admin',
    messageTemplate: { titre: 'Compte validé', message: 'Le compte de {{userName}} a été validé.' }
  },
  [EVENTS.AUTH_CONNEXION_ECHOUEE]: {
    domain: D.AUTH, priority: P.HAUTE,
    description: 'Tentative de connexion échouée',
    messageTemplate: { titre: '⚠️ Connexion échouée', message: 'Tentative de connexion échouée pour {{email}}.' }
  },

  // ── UTILISATEURS ──
  [EVENTS.UTILISATEUR_CREE]: {
    domain: D.AUTH, priority: P.NORMALE,
    description: 'Utilisateur créé par admin',
    messageTemplate: { titre: 'Utilisateur créé', message: 'L\'utilisateur {{targetName}} a été créé par {{userName}}.' }
  },
  [EVENTS.UTILISATEUR_MIS_A_JOUR]: {
    domain: D.AUTH, priority: P.BASSE,
    description: 'Utilisateur modifié',
    messageTemplate: { titre: 'Utilisateur modifié', message: 'Le profil de {{targetName}} a été modifié par {{userName}}.' }
  },
  [EVENTS.UTILISATEUR_SUPPRIME]: {
    domain: D.AUTH, priority: P.HAUTE,
    description: 'Utilisateur supprimé',
    messageTemplate: { titre: '🗑️ Utilisateur supprimé', message: 'L\'utilisateur {{targetName}} a été supprimé par {{userName}}.' }
  },
  [EVENTS.UTILISATEUR_DESACTIVE]: {
    domain: D.AUTH, priority: P.HAUTE,
    description: 'Utilisateur désactivé',
    messageTemplate: { titre: 'Utilisateur désactivé', message: 'Le compte de {{targetName}} a été désactivé par {{userName}}.' }
  },
  [EVENTS.UTILISATEUR_REACTIVE]: {
    domain: D.AUTH, priority: P.NORMALE,
    description: 'Utilisateur réactivé',
    messageTemplate: { titre: 'Utilisateur réactivé', message: 'Le compte de {{targetName}} a été réactivé par {{userName}}.' }
  },

  // ── ENGINS ──
  [EVENTS.ENGIN_CREE]: {
    domain: D.ENGINS, priority: P.BASSE,
    description: 'Engin créé',
    messageTemplate: { titre: 'Nouvel engin', message: 'L\'engin {{enginNom}} a été ajouté par {{userName}}.' }
  },
  [EVENTS.ENGIN_MIS_A_JOUR]: {
    domain: D.ENGINS, priority: P.BASSE,
    description: 'Engin modifié',
    messageTemplate: { titre: 'Engin modifié', message: 'L\'engin {{enginNom}} a été modifié par {{userName}}.' }
  },
  [EVENTS.ENGIN_SUPPRIME]: {
    domain: D.ENGINS, priority: P.NORMALE,
    description: 'Engin supprimé',
    messageTemplate: { titre: 'Engin supprimé', message: 'L\'engin {{enginNom}} a été supprimé par {{userName}}.' }
  },
  [EVENTS.ENGIN_AFFECTE_CRV]: {
    domain: D.ENGINS, priority: P.BASSE,
    description: 'Engin affecté à un CRV',
    messageTemplate: { titre: 'Engin affecté — CRV {{numeroCRV}}', message: 'L\'engin {{enginNom}} a été affecté au CRV {{numeroCRV}}.' }
  },
  [EVENTS.ENGIN_RETIRE_CRV]: {
    domain: D.ENGINS, priority: P.BASSE,
    description: 'Engin retiré d\'un CRV',
    messageTemplate: { titre: 'Engin retiré — CRV {{numeroCRV}}', message: 'L\'engin {{enginNom}} a été retiré du CRV {{numeroCRV}}.' }
  },

  // ── AVIONS ──
  [EVENTS.AVION_CONFIG_MAJ]: {
    domain: D.AVIONS, priority: P.NORMALE,
    description: 'Configuration avion mise à jour',
    messageTemplate: { titre: 'Config avion modifiée', message: 'La configuration de l\'avion {{immatriculation}} a été mise à jour par {{userName}}.' }
  },
  [EVENTS.AVION_VERSION_CREEE]: {
    domain: D.AVIONS, priority: P.NORMALE,
    description: 'Nouvelle version de configuration avion',
    messageTemplate: { titre: 'Nouvelle version — {{immatriculation}}', message: 'Une nouvelle version de la configuration de {{immatriculation}} a été créée par {{userName}}.' }
  },
  [EVENTS.AVION_VERSION_RESTAUREE]: {
    domain: D.AVIONS, priority: P.HAUTE,
    description: 'Version de configuration avion restaurée',
    messageTemplate: { titre: '♻️ Version restaurée — {{immatriculation}}', message: 'La configuration de {{immatriculation}} a été restaurée à une version antérieure par {{userName}}.' }
  },
  [EVENTS.AVION_REVISION_PROCHE]: {
    domain: D.AVIONS, priority: P.HAUTE,
    description: 'Révision avion prochaine',
    messageTemplate: { titre: '🔧 Révision proche — {{immatriculation}}', message: 'L\'avion {{immatriculation}} approche de sa date de révision.' }
  }
});

// ─── HELPER : Liste des événements par domaine ───────────────
export function getEventsByDomain(domain) {
  return Object.entries(EVENT_METADATA)
    .filter(([, meta]) => meta.domain === domain)
    .map(([event]) => event);
}

// ─── HELPER : Tous les noms d'événements ─────────────────────
export function getAllEventNames() {
  return Object.keys(EVENTS);
}

// ─── VALIDATION ──────────────────────────────────────────────
export function isValidEvent(eventName) {
  return eventName in EVENTS;
}

export const TOTAL_EVENTS = Object.keys(EVENTS).length; // 85 (82 + 3 SLA_TACHE_*)
