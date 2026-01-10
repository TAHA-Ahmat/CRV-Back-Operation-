# CONTRAT API FRONTEND-BACKEND CRV

## Application CRV (Compte-Rendu de Vol)
**Date**: 2026-01-09
**Version Frontend**: 1.0
**Base URL**: `http://localhost:4000/api`

---

## TABLE DES MATIERES

1. [Configuration](#1-configuration)
2. [Authentication](#2-authentication-api)
3. [CRV - Compte-Rendu de Vol](#3-crv-api)
4. [Phases](#4-phases-api)
5. [Charges](#5-charges-api)
6. [Validation](#6-validation-api)
7. [Engins](#7-engins-api)
8. [Vols](#8-vols-api)
9. [Programmes Vol](#9-programmes-vol-api)
10. [Personnes](#10-personnes-api)
11. [Notifications](#11-notifications-api)
12. [SLA](#12-sla-api)
13. [Avions](#13-avions-api)
14. [Enums et Valeurs Attendues](#14-enums-et-valeurs-attendues)

---

## 1. CONFIGURATION

### Headers
```
Content-Type: application/json
Authorization: Bearer <token_jwt>
```

### Timeout
- 30 secondes

### Codes d'erreur gérés
- `401` - Session expirée, redirection vers /login
- `403` + `ACCOUNT_DISABLED` - Compte désactivé
- `400` - Bad Request (validation)
- `404` - Ressource non trouvée
- `500` - Erreur serveur

---

## 2. AUTHENTICATION API

### POST /api/auth/connexion
**Description**: Connexion utilisateur

**Body envoyé**:
```json
{
  "email": "string",
  "motDePasse": "string"
}
```

**Réponse attendue**:
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "string",
    "nom": "string",
    "prenom": "string",
    "email": "string",
    "fonction": "AGENT_ESCALE | CHEF_EQUIPE | SUPERVISEUR | MANAGER | QUALITE",
    "matricule": "string?"
  }
}
```

---

### GET /api/auth/me
**Description**: Profil utilisateur connecté

**Headers**: `Authorization: Bearer <token>`

**Réponse attendue**:
```json
{
  "id": "string",
  "nom": "string",
  "prenom": "string",
  "email": "string",
  "fonction": "string",
  "matricule": "string?",
  "telephone": "string?"
}
```

---

### POST /api/auth/deconnexion
**Description**: Déconnexion

---

### POST /api/auth/changer-mot-de-passe
**Body envoyé**:
```json
{
  "ancienMotDePasse": "string",
  "nouveauMotDePasse": "string"
}
```

---

## 3. CRV API

### POST /api/crv
**Description**: Créer un nouveau CRV

**Body envoyé**:
```json
{
  "volId": "string?",
  "type": "ARRIVEE | DEPART | TURN_AROUND",
  "date": "string (ISO date)?",
  "responsableVolId": "string?"
}
```

**Réponse attendue**:
```json
{
  "id": "string",
  "statut": "BROUILLON",
  "completude": 0,
  "type": "string",
  "date": "string",
  "createdAt": "string",
  "createdBy": "string"
}
```

---

### GET /api/crv
**Description**: Lister les CRV

**Query params**:
- `statut`: BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE
- `compagnie`: string
- `dateDebut`: ISO date
- `dateFin`: ISO date
- `page`: number (default 1)
- `limit`: number (default 20)
- `sort`: string

**Réponse attendue**:
```json
{
  "data": [
    {
      "id": "string",
      "statut": "string",
      "completude": "number",
      "type": "string",
      "date": "string",
      "vol": {
        "numeroVol": "string",
        "compagnieAerienne": "string"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "pages": "number"
}
```

---

### GET /api/crv/:id
**Description**: Obtenir un CRV complet avec toutes ses données

**Réponse attendue**:
```json
{
  "crv": {
    "id": "string",
    "statut": "BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE",
    "completude": "number (0-100)",
    "completudeDetails": {
      "header": "number",
      "personnel": "number",
      "phases": "number",
      "charges": "number",
      "evenements": "number",
      "observations": "number"
    },
    "type": "ARRIVEE | DEPART | TURN_AROUND",
    "date": "string",
    "horaire": {
      "heureAtterrissageReelle": "string (HH:mm)?",
      "heureArriveeAuParcReelle": "string (HH:mm)?",
      "heureDepartDuParcReelle": "string (HH:mm)?",
      "heureDecollageReelle": "string (HH:mm)?"
    },
    "personnelAffecte": [
      {
        "id": "string",
        "nom": "string",
        "prenom": "string",
        "fonction": "string",
        "matricule": "string?",
        "telephone": "string?",
        "remarques": "string?"
      }
    ],
    "enginsUtilises": [
      {
        "id": "string",
        "type": "string (TYPE_ENGIN)",
        "immatriculation": "string?",
        "heureDebut": "string (HH:mm)?",
        "heureFin": "string (HH:mm)?",
        "usage": "string (USAGE_ENGIN)",
        "remarques": "string?"
      }
    ],
    "vol": {
      "id": "string",
      "numeroVol": "string",
      "compagnieAerienne": "string",
      "codeIATA": "string"
    },
    "confirmations": {
      "aucunEvenement": "boolean",
      "aucuneObservation": "boolean",
      "aucuneCharge": "boolean"
    },
    "createdAt": "string",
    "createdBy": "object",
    "updatedAt": "string"
  },
  "phases": [
    {
      "id": "string",
      "nom": "string",
      "code": "string",
      "categorie": "string",
      "statut": "NON_COMMENCE | EN_COURS | TERMINE | NON_REALISE | ANNULE",
      "obligatoire": "boolean",
      "heureDebutReelle": "string?",
      "heureFinReelle": "string?",
      "motifNonRealisation": "string?",
      "detailMotif": "string?",
      "remarques": "string?"
    }
  ],
  "charges": [
    {
      "id": "string",
      "typeCharge": "PASSAGERS | BAGAGES | FRET",
      "sensOperation": "EMBARQUEMENT | DEBARQUEMENT",
      "nombrePassagers": "number?",
      "passagersAdultes": "number?",
      "passagersEnfants": "number?",
      "passagersBebes": "number?",
      "nombreBagages": "number?",
      "poidsBagages": "number?",
      "poidsFret": "number?",
      "typeFret": "string?"
    }
  ],
  "evenements": [
    {
      "id": "string",
      "typeEvenement": "string (TYPE_EVENEMENT)",
      "gravite": "MINEURE | MODEREE | MAJEURE | CRITIQUE",
      "statut": "OUVERT | EN_COURS | RESOLU | CLOTURE",
      "description": "string",
      "dateHeureDebut": "string?",
      "dateHeureFin": "string?",
      "responsableSuivi": "string?"
    }
  ],
  "observations": [
    {
      "id": "string",
      "categorie": "GENERALE | TECHNIQUE | OPERATIONNELLE | SECURITE | QUALITE | SLA",
      "contenu": "string",
      "visibilite": "INTERNE | COMPAGNIE | PUBLIQUE",
      "phaseConcernee": "string?"
    }
  ]
}
```

---

### PATCH /api/crv/:id
**Description**: Modifier un CRV (données générales)

**Body envoyé** (partiel):
```json
{
  "responsableVol": "object?",
  "vol": "object?",
  "confirmations": {
    "aucunEvenement": "boolean?",
    "aucuneObservation": "boolean?",
    "aucuneCharge": "boolean?"
  }
}
```

---

### DELETE /api/crv/:id
**Description**: Supprimer un CRV
**Rôles**: SUPERVISEUR, MANAGER

---

### POST /api/crv/:id/demarrer
**Description**: Démarrer un CRV (BROUILLON -> EN_COURS)

**Réponse attendue**:
```json
{
  "statut": "EN_COURS",
  "message": "CRV démarré avec succès"
}
```

---

### POST /api/crv/:id/terminer
**Description**: Terminer un CRV (EN_COURS -> TERMINE)

**Prérequis backend**:
- completude >= 50%
- Toutes les phases obligatoires traitées

**Réponse succès**:
```json
{
  "statut": "TERMINE",
  "completude": "number"
}
```

**Réponse échec (400)**:
```json
{
  "code": "COMPLETUDE_INSUFFISANTE",
  "message": "string",
  "anomalies": [
    "Phase X non traitée",
    "Aucune charge enregistrée"
  ]
}
```

---

### GET /api/crv/:id/transitions
**Description**: Obtenir les transitions possibles depuis le statut actuel

**Réponse attendue**:
```json
{
  "statutActuel": "EN_COURS",
  "transitionsPossibles": ["TERMINE", "ANNULE"],
  "completude": 65
}
```

---

### PUT /api/crv/:id/horaire
**Description**: Mettre à jour les horaires du CRV

**Body envoyé**:
```json
{
  "heureAtterrissageReelle": "string (HH:mm)?",
  "heureArriveeAuParcReelle": "string (HH:mm)?",
  "heureDepartDuParcReelle": "string (HH:mm)?",
  "heureDecollageReelle": "string (HH:mm)?",
  "remarques": "string?"
}
```

---

### PUT /api/crv/:id/personnel
**Description**: Remplacer tout le personnel affecté

**Body envoyé**:
```json
{
  "personnelAffecte": [
    {
      "nom": "string (requis)",
      "prenom": "string (requis)",
      "fonction": "string (requis)",
      "matricule": "string?",
      "telephone": "string?",
      "remarques": "string?"
    }
  ]
}
```

---

### POST /api/crv/:id/personnel
**Description**: Ajouter une personne au personnel

**Body envoyé**:
```json
{
  "nom": "string",
  "prenom": "string",
  "fonction": "string",
  "matricule": "string?",
  "telephone": "string?",
  "remarques": "string?"
}
```

---

### DELETE /api/crv/:id/personnel/:personneId
**Description**: Retirer une personne du personnel

---

### POST /api/crv/:id/charges
**Description**: Ajouter une charge opérationnelle

**Body envoyé**:
```json
{
  "typeCharge": "PASSAGERS | BAGAGES | FRET",
  "sensOperation": "EMBARQUEMENT | DEBARQUEMENT",
  "nombrePassagers": "number? (si PASSAGERS)",
  "passagersAdultes": "number? (REQUIS si PASSAGERS)",
  "passagersEnfants": "number?",
  "passagersBebes": "number?",
  "nombreBagages": "number? (si BAGAGES)",
  "poidsBagages": "number? (REQUIS si nombreBagages > 0)",
  "poidsFret": "number? (REQUIS si FRET)",
  "typeFret": "STANDARD | EXPRESS | PERISSABLE | DANGEREUX | ANIMAUX_VIVANTS | AUTRE"
}
```

**Règles de validation backend**:
- Si `typeCharge` = PASSAGERS: `passagersAdultes` doit être explicitement fourni (pas null/undefined)
- Si `typeCharge` = BAGAGES et `nombreBagages` > 0: `poidsBagages` requis
- Si `typeCharge` = FRET: `poidsFret` et `typeFret` requis

---

### POST /api/crv/:id/evenements
**Description**: Ajouter un événement

**Body envoyé**:
```json
{
  "typeEvenement": "PANNE_EQUIPEMENT | ABSENCE_PERSONNEL | RETARD | INCIDENT_SECURITE | PROBLEME_TECHNIQUE | METEO | AUTRE",
  "gravite": "MINEURE | MODEREE | MAJEURE | CRITIQUE",
  "statut": "OUVERT | EN_COURS | RESOLU | CLOTURE",
  "description": "string (requis)",
  "dateHeureDebut": "string (ISO)?",
  "dateHeureFin": "string (ISO)?",
  "responsableSuivi": "string?"
}
```

---

### POST /api/crv/:id/observations
**Description**: Ajouter une observation

**Body envoyé**:
```json
{
  "categorie": "GENERALE | TECHNIQUE | OPERATIONNELLE | SECURITE | QUALITE | SLA",
  "contenu": "string (requis)",
  "visibilite": "INTERNE | COMPAGNIE | PUBLIQUE",
  "phaseConcernee": "string (ID phase)?"
}
```

---

### POST /api/crv/:id/confirmer-absence
**Description**: Confirmer l'absence (événement/observation/charge)

**Body envoyé**:
```json
{
  "type": "evenement | observation | charge"
}
```

**Impact complétude**:
- evenement: +20%
- observation: +10%
- charge: +30%

---

### DELETE /api/crv/:id/confirmer-absence
**Description**: Annuler confirmation absence

**Body envoyé**:
```json
{
  "type": "evenement | observation | charge"
}
```

---

### GET /api/crv/:id/peut-annuler
**Description**: Vérifier si un CRV peut être annulé

**Réponse attendue**:
```json
{
  "peutAnnuler": true,
  "raisons": []
}
```

---

### POST /api/crv/:id/annuler
**Description**: Annuler un CRV
**Rôles**: SUPERVISEUR, MANAGER

**Body envoyé**:
```json
{
  "motifAnnulation": "string (requis)",
  "details": "string?"
}
```

---

### POST /api/crv/:id/reactiver
**Description**: Réactiver un CRV annulé
**Rôles**: MANAGER uniquement

**Body envoyé**:
```json
{
  "motifReactivation": "string (requis)"
}
```

---

### GET /api/crv/search
**Description**: Recherche full-text

**Query params**:
- `q`: string (terme de recherche)
- `dateDebut`: ISO date
- `dateFin`: ISO date
- `statut`: string

---

### GET /api/crv/stats
**Description**: Statistiques CRV

**Query params**:
- `dateDebut`: ISO date
- `dateFin`: ISO date

---

### GET /api/crv/export
**Description**: Export Excel/CSV

**Query params**:
- `format`: excel | csv
- `dateDebut`: ISO date
- `dateFin`: ISO date
- `statut`: string

**Réponse**: Blob (fichier)

---

### GET /api/crv/annules
**Description**: Liste des CRV annulés

**Query params**:
- `dateDebut`: ISO date
- `dateFin`: ISO date
- `page`: number
- `limit`: number

---

### GET /api/crv/statistiques/annulations
**Description**: Statistiques des annulations
**Rôles**: MANAGER

---

## 4. PHASES API

### POST /api/phases/:id/demarrer
**Description**: Démarrer une phase

**Réponse attendue**:
```json
{
  "phase": {
    "id": "string",
    "statut": "EN_COURS",
    "heureDebutReelle": "string (HH:mm)"
  }
}
```

---

### POST /api/phases/:id/terminer
**Description**: Terminer une phase

**Réponse attendue**:
```json
{
  "phase": {
    "id": "string",
    "statut": "TERMINE",
    "heureFinReelle": "string (HH:mm)"
  }
}
```

---

### POST /api/phases/:id/non-realise
**Description**: Marquer une phase comme non réalisée

**Body envoyé**:
```json
{
  "motifNonRealisation": "NON_NECESSAIRE | EQUIPEMENT_INDISPONIBLE | PERSONNEL_ABSENT | CONDITIONS_METEO | AUTRE",
  "detailMotif": "string (REQUIS si motif = AUTRE)"
}
```

**Règle critique**: Si `motifNonRealisation` = `AUTRE`, alors `detailMotif` est OBLIGATOIRE

---

### PATCH /api/phases/:id
**Description**: Modifier une phase (données générales)

**Body envoyé** (partiel):
```json
{
  "personnelAffecte": "array?",
  "equipementsUtilises": "array?",
  "dureePrevue": "number?",
  "remarques": "string?"
}
```

---

### PUT /api/crv/:crvId/phases/:phaseId
**Description**: Mise à jour manuelle d'une phase (heures saisies par l'utilisateur)

**Body envoyé**:
```json
{
  "statut": "NON_COMMENCE | EN_COURS | TERMINE | NON_REALISE",
  "heureDebutReelle": "string (HH:mm)?",
  "heureFinReelle": "string (HH:mm)?",
  "motifNonRealisation": "string?",
  "detailMotif": "string?",
  "remarques": "string?"
}
```

---

### GET /api/phases/:id
**Description**: Obtenir une phase

---

### GET /api/phases?crvId=xxx
**Description**: Lister les phases d'un CRV

---

## 5. CHARGES API

### GET /api/charges/:id
**Description**: Obtenir une charge

---

### PATCH /api/charges/:id
**Description**: Modifier une charge

---

### PUT /api/charges/:id/categories-detaillees
**Description**: Modifier catégories détaillées passagers

**Body envoyé**:
```json
{
  "categoriesDetaillees": {
    "bebes": "number?",
    "enfants": "number?",
    "adolescents": "number?",
    "adultes": "number?",
    "seniors": "number?",
    "pmrFauteuilRoulant": "number?",
    "pmrMarcheAssistee": "number?",
    "pmrAutre": "number?",
    "transitDirect": "number?",
    "transitAvecChangement": "number?",
    "vip": "number?",
    "equipage": "number?",
    "deportes": "number?"
  }
}
```

---

### PUT /api/charges/:id/classes
**Description**: Modifier classes passagers

**Body envoyé**:
```json
{
  "classes": {
    "premiere": "number?",
    "affaires": "number?",
    "economique": "number?"
  }
}
```

---

### PUT /api/charges/:id/besoins-medicaux
**Body envoyé**:
```json
{
  "besoinsMedicaux": {
    "oxygeneBord": "boolean?",
    "brancardier": "boolean?",
    "accompagnementMedical": "boolean?"
  }
}
```

---

### PUT /api/charges/:id/mineurs
**Body envoyé**:
```json
{
  "mineurs": {
    "mineurNonAccompagne": "number?",
    "bebeNonAccompagne": "number?"
  }
}
```

---

### PUT /api/charges/:id/fret-detaille
**Body envoyé**:
```json
{
  "fretDetaille": {
    "categoriesFret": {
      "general": "number?",
      "perissable": "number?",
      "fragile": "number?",
      "valeurElevee": "number?",
      "volumineux": "number?",
      "animal": "number?"
    },
    "logistique": {
      "nombreColis": "number?",
      "nombrePalettes": "number?",
      "numeroLTA": "string?",
      "numeroAWB": "string?"
    },
    "douanes": {
      "declarationDouane": "boolean?",
      "valeurDeclaree": "number?",
      "devise": "string?"
    },
    "conditionsTransport": {
      "temperatureMin": "number?",
      "temperatureMax": "number?",
      "humidite": "number?",
      "instructionsSpeciales": "string?"
    }
  }
}
```

---

### POST /api/charges/:id/marchandises-dangereuses
**Description**: Ajouter une marchandise dangereuse

**Body envoyé**:
```json
{
  "codeONU": "string (requis)",
  "classeONU": "string (requis)",
  "designationOfficielle": "string (requis)",
  "quantite": "number (requis)",
  "unite": "string (requis)",
  "groupeEmballage": "string?",
  "instructions": "string?"
}
```

---

### DELETE /api/charges/:id/marchandises-dangereuses/:mdId
**Description**: Supprimer une marchandise dangereuse

---

### POST /api/charges/valider-marchandise-dangereuse
**Description**: Valider une marchandise dangereuse (réglementaire)

**Body envoyé**:
```json
{
  "codeONU": "string",
  "classeONU": "string",
  "quantite": "number",
  "unite": "string"
}
```

**Réponse attendue**:
```json
{
  "valide": true,
  "erreurs": [],
  "avertissements": []
}
```

---

### GET /api/charges/statistiques/passagers
### GET /api/charges/statistiques/fret
**Query params**: dateDebut, dateFin, compagnie

---

## 6. VALIDATION API

### POST /api/validation/:id/valider
**Description**: Valider un CRV
**Rôles**: CHEF_EQUIPE, SUPERVISEUR, MANAGER (PAS AGENT_ESCALE)

**Prérequis**:
- statut = TERMINE
- completude >= 80%

**Body envoyé**:
```json
{
  "commentaires": "string?"
}
```

**Réponse succès**:
```json
{
  "crv": {
    "statut": "VALIDE"
  },
  "anomaliesDetectees": []
}
```

**Réponse avec anomalies**:
```json
{
  "crv": {
    "statut": "VALIDE"
  },
  "anomaliesDetectees": [
    "Horaire incohérent",
    "Phase X durée anormale"
  ]
}
```

---

### POST /api/validation/:id/verrouiller
**Description**: Verrouiller manuellement un CRV
**Prérequis**: statut = VALIDE

---

### POST /api/validation/:id/deverrouiller
**Description**: Déverrouiller un CRV
**Rôles**: SUPERVISEUR, MANAGER

**Body envoyé**:
```json
{
  "raison": "string (requis)"
}
```

---

### GET /api/validation/:id
**Description**: Statut de validation d'un CRV

---

## 7. ENGINS API

### GET /api/engins
**Description**: Lister tous les engins du parc

**Query params**:
- `typeEngin`: string (TYPE_ENGIN)
- `statut`: DISPONIBLE | EN_SERVICE | EN_PANNE | EN_MAINTENANCE
- `page`: number
- `limit`: number

---

### GET /api/engins/types
**Description**: Obtenir les types d'engins disponibles

---

### GET /api/engins/disponibles
**Description**: Obtenir les engins disponibles

**Query params**:
- `typeEngin`: string?

---

### POST /api/engins
**Description**: Créer un engin
**Rôles**: MANAGER, ADMIN

**Body envoyé**:
```json
{
  "numeroEngin": "string",
  "typeEngin": "string (TYPE_ENGIN)",
  "marque": "string?",
  "modele": "string?"
}
```

---

### GET /api/crv/:crvId/engins
**Description**: Obtenir les engins affectés à un CRV

---

### PUT /api/crv/:crvId/engins
**Description**: Remplacer tous les engins d'un CRV

**Body envoyé**:
```json
{
  "engins": [
    {
      "type": "string (TYPE_ENGIN)",
      "immatriculation": "string?",
      "heureDebut": "string (HH:mm)?",
      "heureFin": "string (HH:mm)?",
      "usage": "string (USAGE_ENGIN)",
      "remarques": "string?"
    }
  ]
}
```

---

### POST /api/crv/:crvId/engins
**Description**: Ajouter un engin à un CRV

**Body envoyé**:
```json
{
  "enginId": "string?",
  "type": "string (TYPE_ENGIN)",
  "immatriculation": "string?",
  "heureDebut": "string (HH:mm)?",
  "heureFin": "string (HH:mm)?",
  "usage": "string (USAGE_ENGIN)",
  "remarques": "string?"
}
```

---

### DELETE /api/crv/:crvId/engins/:affectationId
**Description**: Retirer un engin d'un CRV

---

## 8. VOLS API

### POST /api/vols
**Body envoyé**:
```json
{
  "numeroVol": "string",
  "typeOperation": "ARRIVEE | DEPART | TURN_AROUND",
  "compagnieAerienne": "string",
  "codeIATA": "string",
  "dateVol": "string (ISO date)",
  "avion": "object?"
}
```

---

### GET /api/vols
**Query params**: dateDebut, dateFin, typeOperation, compagnie, page, limit, sort

---

### GET /api/vols/:id

---

### PATCH /api/vols/:id

---

### DELETE /api/vols/:id

---

### POST /api/vols/:id/lier-programme
**Body**: `{ "programmeId": "string" }`

---

### POST /api/vols/:id/marquer-hors-programme
**Body**:
```json
{
  "typeVolHorsProgramme": "CHARTER | VOL_FERRY | MEDICAL | TECHNIQUE | AUTRE",
  "raisonHorsProgramme": "string?"
}
```

---

### GET /api/vols/:id/suggerer-programmes

---

### GET /api/vols/hors-programme

---

## 9. PROGRAMMES VOL API

### POST /api/programmes-vol
**Body**:
```json
{
  "nom": "string",
  "dateDebut": "string (ISO)",
  "dateFin": "string (ISO)",
  "saison": "string?",
  "compagnies": "array?",
  "vols": "array?"
}
```

---

### GET /api/programmes-vol
**Query**: statut, saison, dateDebut, dateFin, page, limit

---

### POST /api/programmes-vol/:id/valider
**Rôles**: SUPERVISEUR, MANAGER

---

### POST /api/programmes-vol/:id/activer
**Rôles**: SUPERVISEUR, MANAGER

---

### POST /api/programmes-vol/:id/suspendre
**Body**: `{ "raison": "string?" }`

---

### POST /api/programmes-vol/import
**Content-Type**: multipart/form-data
**Body**: FormData avec fichier Excel

---

### GET /api/programmes-vol/applicables/:date
**Description**: Programmes applicables à une date

---

## 10. PERSONNES API

### GET /api/personnes
**Query**: page, limit, fonction, statut, search

---

### GET /api/personnes/:id

---

### POST /api/personnes
**Body**:
```json
{
  "nom": "string",
  "prenom": "string",
  "email": "string",
  "password": "string",
  "fonction": "AGENT_ESCALE | CHEF_EQUIPE | SUPERVISEUR | MANAGER | QUALITE",
  "matricule": "string?",
  "telephone": "string?",
  "specialites": "array?"
}
```

---

### PATCH /api/personnes/:id
**Body** (partiel):
```json
{
  "nom": "string?",
  "prenom": "string?",
  "email": "string?",
  "fonction": "string?",
  "statut": "string?",
  "statutCompte": "VALIDE | DESACTIVE | SUSPENDU",
  "raisonDesactivation": "string?",
  "raisonSuspension": "string?"
}
```

---

### DELETE /api/personnes/:id
**Note**: Échoue avec code `ACCOUNT_IN_USE` si compte utilisé

---

## 11. NOTIFICATIONS API

### GET /api/notifications
**Query**: lu (boolean), type, page, limit

---

### GET /api/notifications/count-non-lues
**Réponse**: `{ "count": number }`

---

### PATCH /api/notifications/lire-toutes

---

### POST /api/notifications
**Rôles**: MANAGER
**Body**:
```json
{
  "destinataire": "string (userId)",
  "type": "INFO | WARNING | URGENT | SYSTEME",
  "titre": "string",
  "message": "string",
  "reference": "string?"
}
```

---

### PATCH /api/notifications/:id/lire

---

### PATCH /api/notifications/:id/archiver

---

### DELETE /api/notifications/:id

---

## 12. SLA API

### GET /api/sla/rapport
**Rôles**: MANAGER
**Query**: dateDebut, dateFin

---

### GET /api/sla/configuration

---

### PUT /api/sla/configuration
**Rôles**: MANAGER
**Body**: `{ "seuils": {}, "alertes": {} }`

---

### POST /api/sla/surveiller/crv
**Body**: `{ "crvId": "string" }`

---

### POST /api/sla/surveiller/phases
**Body**: `{ "phaseIds": ["string"] }`

---

### GET /api/sla/crv/:id

---

### GET /api/sla/phase/:id

---

## 13. AVIONS API

### GET /api/avions

---

### GET /api/avions/:id

---

### POST /api/avions

---

### PUT /api/avions/:id/configuration

---

### POST /api/avions/:id/versions

---

### GET /api/avions/:id/versions

---

### POST /api/avions/:id/versions/:numero/restaurer

---

### GET /api/avions/:id/versions/comparer?v1=x&v2=y

---

### PUT /api/avions/:id/revision

---

### GET /api/avions/revisions/prochaines

---

## 14. ENUMS ET VALEURS ATTENDUES

### STATUT_CRV
```
BROUILLON | EN_COURS | TERMINE | VALIDE | VERROUILLE | ANNULE
```

### STATUT_PHASE
```
NON_COMMENCE | EN_COURS | TERMINE | NON_REALISE | ANNULE
```

### TYPE_OPERATION
```
ARRIVEE | DEPART | TURN_AROUND
```

### TYPE_CHARGE
```
PASSAGERS | BAGAGES | FRET
```

### SENS_OPERATION
```
EMBARQUEMENT | DEBARQUEMENT
```

### TYPE_FRET
```
STANDARD | EXPRESS | PERISSABLE | DANGEREUX | ANIMAUX_VIVANTS | AUTRE
```

### TYPE_EVENEMENT
```
PANNE_EQUIPEMENT | ABSENCE_PERSONNEL | RETARD | INCIDENT_SECURITE | PROBLEME_TECHNIQUE | METEO | AUTRE
```

### GRAVITE_EVENEMENT
```
MINEURE | MODEREE | MAJEURE | CRITIQUE
```

### STATUT_EVENEMENT
```
OUVERT | EN_COURS | RESOLU | CLOTURE
```

### CATEGORIE_OBSERVATION
```
GENERALE | TECHNIQUE | OPERATIONNELLE | SECURITE | QUALITE | SLA
```

### VISIBILITE_OBSERVATION
```
INTERNE | COMPAGNIE | PUBLIQUE
```

### MOTIF_NON_REALISATION
```
NON_NECESSAIRE | EQUIPEMENT_INDISPONIBLE | PERSONNEL_ABSENT | CONDITIONS_METEO | AUTRE
```
**Note**: Si `AUTRE`, le champ `detailMotif` est OBLIGATOIRE

### TYPE_ENGIN (15 types)
```
TRACTEUR_PUSHBACK | PASSERELLE | TAPIS_BAGAGES | GPU | ASU | ESCALIER | TRANSBORDEUR | CAMION_AVITAILLEMENT | CAMION_VIDANGE | CAMION_EAU | NACELLE_ELEVATRICE | CHARIOT_BAGAGES | CONTENEUR_ULD | DOLLY | AUTRE
```

### USAGE_ENGIN
```
TRACTAGE | BAGAGES | FRET | ALIMENTATION_ELECTRIQUE | CLIMATISATION | PASSERELLE | CHARGEMENT
```

### FONCTION (Rôles utilisateur)
```
AGENT_ESCALE | CHEF_EQUIPE | SUPERVISEUR | MANAGER | QUALITE
```

### STATUT_COMPTE
```
VALIDE | DESACTIVE | SUSPENDU
```

---

## REGLES METIER CRITIQUES

### 1. Workflow CRV
```
BROUILLON -> EN_COURS (demarrer)
EN_COURS -> TERMINE (terminer, completude >= 50%)
TERMINE -> VALIDE (valider, completude >= 80%)
VALIDE -> VERROUILLE (verrouiller)
* -> ANNULE (annuler, SUPERVISEUR/MANAGER)
```

### 2. Calcul Complétude
Le backend est la SOURCE DE VÉRITÉ pour le calcul de complétude.
Le frontend affiche `currentCRV.completude` et `currentCRV.completudeDetails`.

### 3. Permissions par Rôle
| Action | AGENT | CHEF_EQUIPE | SUPERVISEUR | MANAGER | QUALITE |
|--------|-------|-------------|-------------|---------|---------|
| Créer CRV | Oui | Oui | Oui | Oui | NON |
| Modifier CRV | Oui | Oui | Oui | Oui | NON |
| Valider CRV | NON | Oui | Oui | Oui | NON |
| Verrouiller | NON | NON | Oui | Oui | NON |
| Déverrouiller | NON | NON | Oui | Oui | NON |
| Annuler CRV | NON | NON | Oui | Oui | NON |
| Lecture seule | - | - | - | - | OUI |

### 4. Absence = Non documenté
Selon la doctrine CRV, l'absence d'événements/charges/observations n'est pas explicitement confirmée.
Les endpoints `confirmer-absence` existent mais le frontend NE LES UTILISE PAS activement (pas de checkbox de confirmation).

---

## CODES D'ERREUR ATTENDUS

| Code | Description |
|------|-------------|
| `CRV_VERROUILLE` | Tentative de modification d'un CRV verrouillé |
| `COMPLETUDE_INSUFFISANTE` | Complétude < seuil requis |
| `CONDITIONS_TERMINAISON_NON_SATISFAITES` | Phases obligatoires non traitées |
| `MOTIF_NON_REALISATION_REQUIS` | Phase NON_REALISE sans motif |
| `DETAIL_MOTIF_REQUIS` | Motif=AUTRE sans detailMotif |
| `TRANSITION_STATUT_INVALIDE` | Transition non autorisée |
| `QUALITE_READ_ONLY` | Utilisateur QUALITE tentant une modification |
| `ACCOUNT_DISABLED` | Compte utilisateur désactivé |
| `ACCOUNT_IN_USE` | Suppression d'un compte utilisé |
| `TOKEN_EXPIRED` | Token JWT expiré |
| `TOKEN_INVALID` | Token JWT invalide |

---

**FIN DU CONTRAT API**
