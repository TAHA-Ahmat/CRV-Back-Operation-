# CRV Report V2 — Design Document

Date : 2026-03-11
Auteur : Claude Code

---

## 1. OBJECTIF

Remplacer le PDF CRV V1 (3 sections, 1 page) par un rapport aviation professionnel 6 pages couvrant **100% des données opérationnelles**.

## 2. ARCHITECTURE

### Fichier modifié
`src/services/documents/crv/CrvGenerator.js` — classe `CrvGenerator` (même nom, V2 interne)

### Héritage
```
DocumentGenerator (base/DocumentGenerator.js)
  └── CrvGenerator (crv/CrvGenerator.js) — V2
```

### Collections chargées (fetchData)
| Collection | Model | Populate | Tri |
|-----------|-------|----------|-----|
| CRV | CRV.js | vol, creePar, responsableVol, verrouillePar, archivage.archivedBy | - |
| Phases | ChronologiePhase.js | phase, responsable | phase.ordre |
| Charges | ChargeOperationnelle.js | - | - |
| Événements | EvenementOperationnel.js | declarePar | dateHeureDebut |
| Observations | Observation.js | auteur | dateHeure DESC |
| Validation | ValidationCRV.js | validePar | findOne |

### Intégration
- `crvArchivage.service.js` (zone rouge) : **AUCUNE MODIFICATION** — importe `CrvGenerator` par nom, inchangé
- `index.js` : export existant `CrvGenerator` — inchangé
- `documents/index.js` : re-export existant — inchangé

## 3. STRUCTURE DU RAPPORT (6 PAGES)

### Page 1 — Synthèse Opérationnelle
- Titre CRV + numéro
- Informations vol (2 colonnes : vol + escale)
- 4 KPI cards : OPERATION (conforme/mineur/incident), RETARD ARR, RETARD DEP, SLA
- Statut : statut CRV, complétude, nombre événements, date création

### Page 2 — Statistiques Trafic
- Passagers : adultes, enfants, bébés, PMR, transit (embarquement/débarquement)
- Bagages : nombre soute, poids soute, cabine
- Fret : nombre, poids, type

### Page 3 — Chronologie & Ressources
- Chronologie : phase, prévu, début, fin, durée, écart (coloré), statut (coloré)
- Personnel affecté : nom, fonction, matricule
- Matériel utilisé : type, ID, début, fin, opérateur

### Page 4 — Événements & Incidents
- Tableau : type, gravité (colorée), description, impact, action corrective
- Si aucun événement : bandeau vert "Vol nominal"

### Page 5 — Observations Terrain (inline après événements)
- Cards avec bordure bleue gauche
- Catégorie, date, contenu, auteur

### Page 6 — Validation Officielle
- Informations : créé par, responsable vol, validé par, date, score, SLA, statut
- Anomalies détectées (liste rouge)
- Commentaires validation
- Double bloc signature : Responsable du Vol + Superviseur

## 4. DESIGN SYSTEM

### Palette Aviation
| Token | Hex | Usage |
|-------|-----|-------|
| NAVY | #0c2340 | Headers, barres section, en-têtes tableau |
| BLUE | #1a56db | Liens, accents, bordure observations |
| GREEN | #059669 | Conforme, terminé, SLA OK |
| ORANGE | #d97706 | Écart modéré, mineur, en cours |
| RED | #dc2626 | Critique, majeur, non conforme |

### Composants réutilisables
- `_sectionBar(text)` : bandeau NAVY pleine largeur
- `_kpiCard(label, value, color, bg)` : carte indicateur
- `_thinTable()` : layout tableau fin avec séparateurs légers

### Header/Footer
- **Header** : THS Organisation + Département | NuméroCRV + Type + Escale + Vol + Date
- **Footer** : THS contact + SITA | NuméroCRV + Page X/Y

## 5. COMPARAISON V1 → V2

| Aspect | V1 | V2 |
|--------|----|----|
| Pages | 1 | 6 |
| Collections | 1 (CRV) | 6 (CRV + 5 liées) |
| Sections | 3 (vol, personnel, matériel) | 12+ sections |
| KPI | Non | 4 cartes KPI |
| Phases | Non | Chronologie complète |
| Charges | Non | Passagers/Bagages/Fret |
| Événements | Non | Tableau avec gravité colorée |
| Observations | Non | Cards avec auteur |
| Validation | Non | Détails + anomalies |
| Signatures | 1 (responsable) | 2 (responsable + superviseur) |
| Design | Basique | Aviation professionnel |

## 6. RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Modèle Observation non trouvé | Crash PDF | Import vérifié : `src/models/crv/Observation.js` existe |
| Phases/charges vides | Pages vides | Fallback "Aucune donnée" pour chaque section |
| Validation absente | Page 6 vide | Tous les champs ont des fallbacks (`'-'`, `0`) |
| Performance (6 queries) | Latence | `Promise.all` parallélise les 5 queries supplémentaires |

## 7. TEST

Pour tester la génération PDF :
```
GET /api/crv/:id/pdf-base64
GET /api/crv/:id/telecharger-pdf
```

Le PDF V2 est maintenant utilisé automatiquement pour :
- Téléchargement PDF depuis le frontend
- Archivage Google Drive (via `crvArchivage.service.js`)
