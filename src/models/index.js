// ============================================================================
// BARREL PRINCIPAL - MODÈLES CRV BACKEND
// ============================================================================
// Ce fichier centralise les exports de tous les modèles pour faciliter les imports.
// Organisation par MVS (Minimum Viable Systems) selon cartographie validée.
//
// USAGE:
//   import { CRV, Vol, Personne } from '../models/index.js';
//   // ou directement depuis les sous-dossiers:
//   import CRV from '../models/crv/CRV.js';
//   import Vol from '../models/flights/Vol.js';
// ============================================================================

// MVS 1 - Sécurité & Identité
export { default as Personne } from './security/Personne.js';
export { default as UserActivityLog } from './security/UserActivityLog.js';

// MVS 2 - CRV (Coeur opérationnel)
export { default as CRV } from './crv/CRV.js';
export { default as HistoriqueModification } from './crv/HistoriqueModification.js';
export { default as Observation } from './crv/Observation.js';

// MVS 3 - Phases opérationnelles
export { default as Phase } from './phases/Phase.js';
export { default as ChronologiePhase } from './phases/ChronologiePhase.js';
export { default as Horaire } from './phases/Horaire.js';

// MVS 4 - Charges & Trafic
export { default as ChargeOperationnelle } from './charges/ChargeOperationnelle.js';

// MVS 5 - Ressources sol (Engins)
export { default as Engin } from './resources/Engin.js';
export { default as AffectationEnginVol } from './resources/AffectationEnginVol.js';

// MVS 6 - Vols & Programmes
export { default as Vol } from './flights/Vol.js';
export { default as ProgrammeVolSaisonnier } from './flights/ProgrammeVolSaisonnier.js';
export { default as ProgrammeVol } from './flights/ProgrammeVol.js';
export { default as VolProgramme } from './flights/VolProgramme.js';

// MVS 6b - Bulletin de Mouvement (Exploitation court terme)
export { default as BulletinMouvement } from './bulletin/BulletinMouvement.js';

// MVS 7 - Validation & Qualité
export { default as ValidationCRV } from './validation/ValidationCRV.js';

// MVS 8 - Notifications & SLA
export { default as Notification } from './notifications/Notification.js';

// MVS 9 - Référentiels
export { default as Avion } from './referentials/Avion.js';

// Transversal (multi-MVS)
export { default as EvenementOperationnel } from './transversal/EvenementOperationnel.js';
export { default as AffectationPersonneVol } from './transversal/AffectationPersonneVol.js';
