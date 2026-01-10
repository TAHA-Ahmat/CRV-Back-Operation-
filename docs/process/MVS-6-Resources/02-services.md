# MVS-6-Resources - SERVICES

## Date d'audit : 2026-01-10

---

## Constat

Aucun service dedie dans `src/services/resources/`.

La logique metier est directement implementee dans les controllers.

---

## Recommandation

Pour une meilleure separation des responsabilites, envisager la creation de :
- `engin.service.js` : Gestion du parc materiel
- `affectation.service.js` : Gestion des affectations engins-vols

---

## Logique actuelle (dans engin.controller.js)

### Gestion Parc Materiel

| Fonction | Localisation | Description |
|----------|--------------|-------------|
| Verification unicite | creerEngin:L79 | Verifie que numeroEngin n'existe pas |
| Verification utilisation | supprimerEngin:L160 | Verifie qu'aucune affectation n'existe |
| Listing disponibles | listerEnginsDisponibles:L188 | Filtre statut DISPONIBLE ou EN_SERVICE |

### Gestion Affectations

| Fonction | Localisation | Description |
|----------|--------------|-------------|
| Creation automatique engin | mettreAJourEnginsAffectes:L289-311 | Cree l'engin si n'existe pas |
| Mapping type-usage | mettreAJourEnginsAffectes:L316-327 | Convertit type frontend vers usage backend |
| Remplacement affectations | mettreAJourEnginsAffectes:L279 | Supprime et recree toutes les affectations |

---

## Mapping Type Frontend -> Type Engin Backend

| Frontend | Backend |
|----------|---------|
| tracteur | TRACTEUR |
| chariot_bagages | CHARIOT_BAGAGES |
| chariot_fret | CHARIOT_FRET |
| camion_fret | CHARIOT_FRET |
| passerelle | STAIRS |
| gpu | GPU |
| asu | ASU |
| camion_avitaillement | AUTRE |
| convoyeur | CONVOYEUR |
| autre | AUTRE |

---

## Mapping Type Frontend -> Usage

| Frontend | Backend Usage |
|----------|---------------|
| tracteur | TRACTAGE |
| chariot_bagages | BAGAGES |
| chariot_fret | FRET |
| camion_fret | FRET |
| passerelle | PASSERELLE |
| gpu | ALIMENTATION_ELECTRIQUE |
| asu | CLIMATISATION |
| camion_avitaillement | CHARGEMENT |
| convoyeur | CHARGEMENT |
| autre | CHARGEMENT |

