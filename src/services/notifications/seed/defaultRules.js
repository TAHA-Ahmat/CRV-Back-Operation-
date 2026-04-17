/**
 * DEFAULT RULES — Matrice par défaut des 492 règles de notification
 *
 * MODULE NOTIFICATION ENGINE v0.9.0
 * 82 événements × 6 rôles = 492 règles.
 *
 * Format par événement:
 *   EVENT_NAME: { ROLE: { enabled, inApp, email, whatsapp } }
 *
 * Conventions canaux par défaut:
 *   - CRITIQUE → inApp + email pour hiérarchie (SUP, MGR), inApp seul pour agents
 *   - HAUTE    → inApp pour tous les concernés, email pour MGR
 *   - NORMALE  → inApp sélectif
 *   - BASSE    → inApp sélectif, souvent désactivé pour ADMIN
 *   - ADMIN    → reçoit uniquement Auth/Utilisateurs/Config
 *   - QUALITE  → reçoit les incidents critiques, validations, SLA
 */

/**
 * SEED_VERSION — Incrémenter à chaque modification de la matrice DEFAULT_RULES.
 * Le système compare cette version à celle en base pour décider si une migration est nécessaire.
 *
 * Historique :
 * - v1.0.0 : 492 rules initiales (82 events × 6 rôles)
 * - v1.1.0 : 112 rules fantômes désactivées (21 events réellement émis)
 * - v1.2.0 : ajout versionning + champ source
 * - v1.3.0 : ajout SLA_TACHE_WARNING / CRITIQUE / DEPASSE (Mission SLA_FULL_COVERAGE_BACK / M5)
 * - v1.4.0 : ajout SLA_TACHE_ESCALADE (BUX-2 — escalade auto après 3 alertes non acquittées)
 */
export const SEED_VERSION = '1.4.0';

// Shorthand helpers
const ON = (inApp = true, email = false, whatsapp = false) => ({ enabled: true, inApp, email, whatsapp });
const IE = () => ON(true, true, false);  // inApp + email
const I  = () => ON(true, false, false); // inApp only
const OFF = () => ({ enabled: false, inApp: false, email: false, whatsapp: false });

/**
 * Matrice complète : eventName → { role → config }
 */
export const DEFAULT_RULES = {
  // ═══════════════════════════════════════════════════════════
  // CRV (16 événements)
  // ═══════════════════════════════════════════════════════════
  CRV_CREE:                 { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_DEMARRE:              { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_TERMINE:              { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_MIS_A_JOUR:           { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_SUPPRIME:             { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_CHARGE_AJOUTEE:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_EVENEMENT_AJOUTE:     { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_INCIDENT_CRITIQUE:    { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  CRV_OBSERVATION_AJOUTEE:  { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_HORAIRE_MIS_A_JOUR:   { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_ABSENCE_CONFIRMEE:    { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_ABSENCE_ANNULEE:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_PERSONNEL_AJOUTE:     { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_PERSONNEL_MIS_A_JOUR: { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_PERSONNEL_SUPPRIME:   { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  CRV_PRET_VALIDATION:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // VALIDATION (5 événements)
  // ═══════════════════════════════════════════════════════════
  CRV_VALIDE:               { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_VERROUILLE:           { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_DEVERROUILLE:         { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_REJETE:               { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  CRV_VALIDATION_ECHOUEE:   { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // ANNULATION (2 événements)
  // ═══════════════════════════════════════════════════════════
  CRV_ANNULE:               { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  CRV_REACTIVE:             { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // ARCHIVAGE (3 événements)
  // ═══════════════════════════════════════════════════════════
  CRV_ARCHIVE:              { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: I(),   ADMIN: OFF() },
  CRV_ARCHIVAGE_ECHOUE:     { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: IE()  },
  ARCHIVAGE_SERVICE_ERREUR:  { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: IE()  },

  // ═══════════════════════════════════════════════════════════
  // PHASES (5 événements)
  // ═══════════════════════════════════════════════════════════
  PHASE_DEMARREE:           { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PHASE_TERMINEE:           { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PHASE_NON_REALISEE:       { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  PHASE_MISE_A_JOUR:        { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PHASES_INITIALISEES:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // BULLETIN (10 événements)
  // ═══════════════════════════════════════════════════════════
  BULLETIN_CREE:            { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  BULLETIN_DEPUIS_PROGRAMME:{ AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  BULLETIN_PUBLIE:          { AGENT_ESCALE: I(),  CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  BULLETIN_ARCHIVE:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  MOUVEMENT_AJOUTE:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  MOUVEMENT_MODIFIE:        { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  MOUVEMENT_SUPPRIME:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  MOUVEMENT_ANNULE:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  VOL_HORS_PROGRAMME:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  VOLS_CREES_BULLETIN:      { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // PROGRAMME (7 événements)
  // ═══════════════════════════════════════════════════════════
  PROGRAMME_CREE:           { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_MIS_A_JOUR:     { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_SUPPRIME:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_VALIDE:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_ACTIVE:         { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_SUSPENDU:       { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  PROGRAMME_DUPLIQUE:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // CHARGES (8 événements)
  // ═══════════════════════════════════════════════════════════
  FRET_MIS_A_JOUR:               { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  MARCHANDISE_DANGEREUSE_AJOUTEE:{ AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  MARCHANDISE_DANGEREUSE_RETIREE:{ AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  MARCHANDISE_DANGEREUSE_VALIDEE:{ AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  PASSAGERS_CATEGORIES_MAJ:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PASSAGERS_CLASSES_MAJ:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PASSAGERS_BESOINS_MEDICAUX:    { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  PASSAGERS_MINEURS_MAJ:         { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // SLA (7 événements)
  // ═══════════════════════════════════════════════════════════
  SLA_CRV_WARNING:          { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  SLA_CRV_CRITIQUE:         { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  SLA_CRV_DEPASSE:          { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  SLA_PHASE_WARNING:        { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  SLA_PHASE_CRITIQUE:       { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  SLA_PHASE_DEPASSE:        { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  SLA_CONFIG_MODIFIEE:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: I()   },
  // ── Tâches fines SLA (M5) — AGENT inApp, CHEF_EQUIPE inApp, SUP inApp+email, MGR inApp+email ──
  SLA_TACHE_WARNING:        { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  SLA_TACHE_CRITIQUE:       { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },
  SLA_TACHE_DEPASSE:        { AGENT_ESCALE: IE(), CHEF_EQUIPE: IE(), SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: IE(),  ADMIN: OFF() },
  // ── Escalade SLA (BUX-2) — MANAGER inApp+email, SUPERVISEUR inApp+email, CHEF_EQUIPE inApp ──
  SLA_TACHE_ESCALADE:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: I(),  SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: I(),   ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // AUTH (5 événements)
  // ═══════════════════════════════════════════════════════════
  AUTH_CONNEXION:           { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  AUTH_INSCRIPTION:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: IE()  },
  AUTH_MOT_DE_PASSE_CHANGE: { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: I()   },
  AUTH_COMPTE_VALIDE:       { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: I()   },
  AUTH_CONNEXION_ECHOUEE:   { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: IE()  },

  // ═══════════════════════════════════════════════════════════
  // UTILISATEURS (5 événements)
  // ═══════════════════════════════════════════════════════════
  UTILISATEUR_CREE:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: I()   },
  UTILISATEUR_MIS_A_JOUR:   { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  UTILISATEUR_SUPPRIME:     { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: IE()  },
  UTILISATEUR_DESACTIVE:    { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: IE()  },
  UTILISATEUR_REACTIVE:     { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: I()   },

  // ═══════════════════════════════════════════════════════════
  // ENGINS (5 événements)
  // ═══════════════════════════════════════════════════════════
  ENGIN_CREE:               { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  ENGIN_MIS_A_JOUR:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  ENGIN_SUPPRIME:           { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  ENGIN_AFFECTE_CRV:        { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },
  ENGIN_RETIRE_CRV:         { AGENT_ESCALE: I(),  CHEF_EQUIPE: I(),  SUPERVISEUR: OFF(),MANAGER: OFF(), QUALITE: OFF(), ADMIN: OFF() },

  // ═══════════════════════════════════════════════════════════
  // AVIONS (4 événements)
  // ═══════════════════════════════════════════════════════════
  AVION_CONFIG_MAJ:         { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  AVION_VERSION_CREEE:      { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: I(),  MANAGER: I(),   QUALITE: OFF(), ADMIN: OFF() },
  AVION_VERSION_RESTAUREE:  { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() },
  AVION_REVISION_PROCHE:    { AGENT_ESCALE: OFF(),CHEF_EQUIPE: OFF(),SUPERVISEUR: IE(), MANAGER: IE(),  QUALITE: OFF(), ADMIN: OFF() }
};
