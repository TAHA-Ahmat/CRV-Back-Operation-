# 📋 Contrat d'Interface Backend ↔ Frontend - Système CRV

**Version:** 1.0
**Date:** 2026-01-06
**Audience:** Équipe Frontend

---

## 🎯 Vue d'ensemble

Ce document décrit précisément comment le backend traite les requêtes CRV et ce que le frontend doit fournir/attendre.

---

## 📦 1. CRÉATION DE CRV

### Endpoint
```
POST /api/crv
```

### Headers requis
```http
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

### Format de requête (2 modes supportés)

#### Mode 1: Création avec Vol existant (recommandé)
```json
{
  "volId": "695a2b9703894c422fe7a028",
  "responsableVolId": "695a2b6e03894c422fe7a016" // Optionnel
}
```

#### Mode 2: Création automatique de Vol
```json
{
  "type": "arrivee",  // "arrivee" | "depart" | "turnaround"
  "date": "2026-01-07T08:00:00.000Z"  // Optionnel, défaut: Date.now()
}
```

### Traitement Backend (étapes séquentielles)

```
1. AUTHENTIFICATION
   └─ Vérification JWT token
   └─ Vérification rôle ≠ QUALITE (lecture seule)
   └─ Extraction user._id du token

2. VALIDATION DONNÉES
   ├─ Si volId fourni: vérifier existence du Vol
   └─ Si type fourni: valider enum ['arrivee', 'depart', 'turnaround']

3. RÉSOLUTION DU VOL
   ├─ Mode 1 (volId fourni):
   │   └─ Vol.findById(volId)
   │
   └─ Mode 2 (type fourni):
       ├─ Déterminer typeOperation:
       │   ├─ "arrivee" → "ARRIVEE"
       │   ├─ "depart" → "DEPART"
       │   └─ "turnaround" → "TURN_AROUND"
       │
       └─ Créer Vol automatiquement:
           ├─ numeroVol: "VOL" + (count + 1).padStart(4, '0')
           ├─ typeOperation: déterminé ci-dessus
           ├─ compagnieAerienne: "Air France" (par défaut)
           ├─ codeIATA: "AF"
           ├─ dateVol: date fournie ou Date.now()
           └─ statut: "PROGRAMME"

4. GÉNÉRATION NUMÉRO CRV
   └─ Format: "CRV" + YYMMDD + "-" + sequence (ex: CRV260106-0001)

5. CRÉATION HORAIRE
   └─ Horaire.create({ vol: volId })

6. CRÉATION CRV
   ├─ numeroCRV: généré étape 4
   ├─ vol: volId
   ├─ horaire: horaire._id
   ├─ creePar: req.user._id (depuis token)
   ├─ responsableVol: responsableVolId (si fourni)
   └─ statut: "BROUILLON"

7. INITIALISATION PHASES
   └─ Création ChronologiePhase selon vol.typeOperation:
       ├─ ARRIVEE: 6 phases (atterrissage, roulage, calage, passerelle, débarquement, déchargement)
       ├─ DEPART: 9 phases (inspection, avitaillement, nettoyage, chargement, embarquement, fermeture, repoussage, roulage, décollage)
       └─ TURN_AROUND: 15 phases (toutes phases ARRIVEE + DEPART)

8. CALCUL COMPLÉTUDE INITIALE
   └─ calculerCompletude(crv._id)
       ├─ Phases: 40%
       ├─ Charges: 30%
       ├─ Événements: 20%
       └─ Observations: 10%
       → Résultat initial typique: 20% (phases initialisées mais non complétées)

9. POPULATION RELATIONS
   └─ .populate('vol horaire creePar responsableVol')

10. AUDIT LOG
    └─ Enregistrement action 'CREATION' avec userId, crvId, timestamp
```

### Réponse Success (201 Created)

```json
{
  "success": true,
  "data": {
    "_id": "695cfb73d38e30c1f398e78b",
    "numeroCRV": "CRV260106-0002",
    "vol": {
      "_id": "695cfb72d38e30c1f398e786",
      "numeroVol": "VOL0005",
      "typeOperation": "ARRIVEE",
      "compagnieAerienne": "Air France",
      "codeIATA": "AF",
      "dateVol": "2026-01-07T08:00:00.000Z",
      "statut": "PROGRAMME"
    },
    "horaire": {
      "_id": "695cfb72d38e30c1f398e789",
      "vol": "695cfb72d38e30c1f398e786"
    },
    "statut": "BROUILLON",
    "creePar": {
      "_id": "695a2b6e03894c422fe7a016",
      "nom": "Test",
      "prenom": "User",
      "email": "test@ths.com",
      "fonction": "ADMIN",
      "matricule": "TEST001"
    },
    "responsableVol": null,
    "completude": 20,
    "dateCreation": "2026-01-06T12:09:23.136Z",
    "derniereModification": "2026-01-06T12:09:23.137Z",
    "archivage": {
      "driveFileId": null,
      "driveWebViewLink": null,
      "archivedAt": null,
      "archivedBy": null
    },
    "annulation": {
      "dateAnnulation": null,
      "annulePar": null,
      "raisonAnnulation": null,
      "commentaireAnnulation": null,
      "ancienStatut": null
    }
  }
}
```

### Erreurs possibles

#### 400 Bad Request - Type invalide
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "field": "type",
      "message": "Type invalide"
    }
  ]
}
```

#### 403 Forbidden - Rôle QUALITE
```json
{
  "success": false,
  "message": "Accès refusé - Rôle QUALITE en lecture seule"
}
```

#### 404 Not Found - Vol inexistant
```json
{
  "success": false,
  "message": "Vol non trouvé"
}
```

#### 401 Unauthorized - Token invalide
```json
{
  "success": false,
  "message": "Token invalide ou expiré"
}
```

---

## 🔄 2. ÉTATS ET TRANSITIONS CRV

### Diagramme d'états

```
BROUILLON ──────────────────────────────────────┐
    │                                            │
    │ (saisie données)                           │
    │ completude < 80%                           │
    │                                            │
    ↓                                            │
EN_COURS ───────────────────────────────────────┤
    │                                            │
    │ (validation demandée)                      │
    │ completude ≥ 80%                           │  (modification)
    │ phases complètes                           │
    │                                            │
    ↓                                            │
TERMINE ────────────────────────────────────────┤
    │                                            │
    │ (validation QUALITE)                       │
    │ conformiteSLA: true                        │
    │ scoreCompletude ≥ 80%                      │
    │                                            │
    ↓                                            │
VALIDE                                           │
    │                                            │
    │ (verrouillage automatique)                 │
    │                                            │
    ↓                                            │
VERROUILLE ─────────────────────────────────────┘
    │                (IMMUABLE - aucune modification)
    │
    │ (archivage)
    │
    ↓
[ARCHIVÉ sur Google Drive]


ANNULE ←──────────────────────────────────────────
    (possible depuis tous états sauf VERROUILLE)
    avec justification obligatoire
```

### Règles de transition

| État actuel | Action | État suivant | Conditions |
|-------------|--------|--------------|------------|
| BROUILLON | Saisie données | EN_COURS | Automatique dès première modification |
| EN_COURS | Demande validation | TERMINE | completude ≥ 80%, phases complètes |
| TERMINE | Validation QUALITE | VALIDE | scoreCompletude ≥ 80%, conformiteSLA = true |
| VALIDE | Auto-verrouillage | VERROUILLE | Immédiat après validation |
| Tous (sauf VERROUILLE) | Annulation | ANNULE | Avec justification obligatoire |
| ANNULE | Réactivation | État précédent | Par ADMIN/MANAGER uniquement |

---

## 📊 3. CALCUL DE COMPLÉTUDE

### Formule (pondération 100%)

```javascript
completude = (
  (scorePhases * 0.40) +      // 40% - Phases chronologie
  (scoreCharges * 0.30) +     // 30% - Charges opérationnelles
  (scoreEvenements * 0.20) +  // 20% - Événements déclarés
  (scoreObservations * 0.10)  // 10% - Observations
)
```

### Détail calcul par composant

#### A. Score Phases (40%)
```javascript
phasesCompletes = phases.filter(p =>
  p.statut === 'TERMINE' ||
  p.statut === 'NON_REALISE' // Avec justification
)

scorePhases = (phasesCompletes.length / phases.length) * 100

// Seuil minimal: 80% des phases doivent être complétées
```

#### B. Score Charges (30%)
```javascript
champsRequis = [
  'sensOperation',      // DEBARQUEMENT | EMBARQUEMENT
  'typeCharge',         // PASSAGERS | BAGAGES | FRET | COURRIER
  // + champs spécifiques selon typeCharge
]

chargesCompletes = charges.filter(c => {
  if (c.typeCharge === 'PASSAGERS') {
    return c.passagersAdultes !== undefined ||
           c.passagersEnfants !== undefined ||
           c.passagersPMR !== undefined
  }
  if (c.typeCharge === 'BAGAGES') {
    return c.nombreBagagesSoute !== undefined &&
           c.poidsBagagesSouteKg !== undefined
  }
  if (c.typeCharge === 'FRET') {
    return c.nombreFret !== undefined &&
           c.poidsFretKg !== undefined &&
           c.typeFret !== undefined
  }
  return true
})

scoreCharges = charges.length > 0
  ? (chargesCompletes.length / charges.length) * 100
  : 0
```

#### C. Score Événements (20%)
```javascript
// Au moins 1 événement = 100%
// 0 événement = 0%
scoreEvenements = evenements.length > 0 ? 100 : 0
```

#### D. Score Observations (10%)
```javascript
// Au moins 1 observation = 100%
// 0 observation = 0%
scoreObservations = observations.length > 0 ? 100 : 0
```

### Seuils validation

| Critère | Seuil minimum | Blocant ? |
|---------|---------------|-----------|
| Complétude globale | 80% | ✅ OUI |
| Phases complétées | 80% | ✅ OUI |
| Charges renseignées | 1 minimum | ✅ OUI |
| Responsable vol défini | Obligatoire | ✅ OUI |
| Événements | Optionnel | ❌ NON |
| Observations | Optionnel | ❌ NON |

---

## 🔐 4. RÈGLES MÉTIER CRITIQUES

### R1: CRV Verrouillé = Immuable

```javascript
// Toute tentative de modification sur statut=VERROUILLE
→ 403 Forbidden
{
  "success": false,
  "message": "INTERDIT : CRV validé et verrouillé - aucune modification possible",
  "code": "CRV_VERROUILLE"
}
```

### R2: Cohérence Phase ↔ Type Opération

```javascript
// Exemple: Phase DEPART sur Vol ARRIVEE
→ 400 Bad Request
{
  "success": false,
  "message": "INTERDIT : Cette phase est de type DEPART et ne peut être utilisée sur un vol de type ARRIVEE",
  "code": "INCOHERENCE_TYPE_OPERATION"
}
```

### R3: Phase Non Réalisée → Justification Obligatoire

```javascript
// Marquer phase comme NON_REALISE sans motifNonRealisation
→ 400 Bad Request
{
  "success": false,
  "message": "INTERDIT : Une phase non réalisée doit avoir un motif obligatoire",
  "code": "MOTIF_NON_REALISATION_REQUIS"
}
```

### R4: Distinction 0 vs Non Renseigné

```javascript
// Pour les charges opérationnelles
passagersAdultes: 0        // = "Zéro passagers adultes" (valeur explicite)
passagersAdultes: null     // = "Non renseigné" (absent)
passagersAdultes: undefined // = "Non renseigné" (absent)

// Le backend refuse les saisies implicites
→ 400 Bad Request
{
  "success": false,
  "message": "INTERDIT : Pour les passagers, vous devez saisir explicitement les valeurs (même si zéro)",
  "code": "VALEURS_EXPLICITES_REQUISES"
}
```

### R5: Annulation avec Traçabilité

```javascript
// Annuler un CRV DOIT fournir:
{
  "raisonAnnulation": "ANNULATION_CLIENT",  // Enum obligatoire
  "commentaireAnnulation": "Justification détaillée..." // Texte obligatoire
}

// L'état précédent est sauvegardé pour réactivation éventuelle
```

---

## 🔄 5. ENDPOINTS CRUD COMPLETS

### GET /api/crv/:id - Obtenir CRV complet

**Réponse:**
```json
{
  "success": true,
  "data": {
    "crv": { /* objet CRV complet */ },
    "phases": [ /* tableau ChronologiePhase */ ],
    "charges": [ /* tableau ChargeOperationnelle */ ],
    "evenements": [ /* tableau EvenementOperationnel */ ],
    "observations": [ /* tableau Observation */ ]
  }
}
```

### GET /api/crv - Lister CRVs (avec filtres)

**Query params:**
```javascript
{
  statut: "BROUILLON" | "EN_COURS" | "TERMINE" | "VALIDE" | "VERROUILLE" | "ANNULE",
  compagnie: "Air France",
  dateDebut: "2026-01-01",
  dateFin: "2026-01-31",
  page: 1,
  limit: 50,
  sort: "-dateCreation" // Tri par date décroissant
}
```

### PATCH /api/crv/:id - Mettre à jour CRV

**Champs modifiables** (selon état):
```javascript
// BROUILLON, EN_COURS, TERMINE uniquement
{
  "responsableVolId": "...", // Optionnel
  // Autres champs métier selon formulaire
}
```

### POST /api/crv/:id/phases - Mettre à jour Phase

**Format:**
```json
{
  "statut": "TERMINE" | "EN_COURS" | "NON_COMMENCE" | "NON_REALISE",
  "dateHeureDebut": "2026-01-06T10:00:00Z",
  "dateHeureFin": "2026-01-06T10:30:00Z",
  "responsableId": "695a2b6e03894c422fe7a016",

  // Si statut = NON_REALISE (obligatoires):
  "motifNonRealisation": "CONDITIONS_METEOROLOGIQUES" | "PROBLEME_TECHNIQUE" | ...,
  "detailMotif": "Description détaillée obligatoire"
}
```

### POST /api/crv/:id/charges - Ajouter Charge

**Format Passagers:**
```json
{
  "typeCharge": "PASSAGERS",
  "sensOperation": "EMBARQUEMENT" | "DEBARQUEMENT",
  "passagersAdultes": 150,
  "passagersEnfants": 20,
  "passagersPMR": 2,
  "passagersTransit": 5
}
```

**Format Fret:**
```json
{
  "typeCharge": "FRET",
  "sensOperation": "EMBARQUEMENT",
  "nombreFret": 10,
  "poidsFretKg": 2500,
  "typeFret": "GENERAL" | "PERISSABLE" | "DANGEREUX",

  // Si typeFret = DANGEREUX (Extension 5):
  "dangereux": {
    "classeDGR": "3",
    "numeroONU": "UN1203",
    "nomMatiere": "Essence",
    "groupeEmballage": "II"
  }
}
```

---

## 🎨 6. NORMALISATION DONNÉES (Backend → Frontend)

### Ajout champ `id` automatique

**Problématique:** MongoDB retourne `_id`, Frontend attend `id`

**Solution Backend:** Tous les endpoints ajoutent automatiquement:
```javascript
const personneWithId = personne.toObject();
personneWithId.id = personneWithId._id.toString();
// Retourne à la fois _id ET id
```

**Champs concernés:**
- Personnes (GET /api/personnes)
- CRV (GET /api/crv)
- Vols (GET /api/vols)
- Tous les modèles principaux

### Dates au format ISO 8601

```javascript
// Format backend → frontend
"2026-01-06T12:09:23.136Z"

// Usage frontend:
new Date(dateString) // Conversion automatique
```

---

## ⚠️ 7. GESTION ERREURS STANDARDISÉE

### Format erreur unique

```json
{
  "success": false,
  "message": "Description lisible de l'erreur",
  "code": "CODE_ERREUR_MACHINE",  // Optionnel
  "errors": [                      // Optionnel (validation)
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

### Codes HTTP utilisés

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | Succès | GET réussi |
| 201 | Création réussie | POST /api/crv |
| 400 | Erreur validation | Champs manquants |
| 401 | Non authentifié | Token manquant/invalide |
| 403 | Non autorisé | Rôle insuffisant |
| 404 | Ressource introuvable | CRV inexistant |
| 409 | Conflit | CRV déjà verrouillé |
| 500 | Erreur serveur | Crash inattendu |

### Codes erreur métier

| Code | Description | Action frontend |
|------|-------------|-----------------|
| `CRV_VERROUILLE` | Modification impossible | Désactiver formulaire |
| `COMPLETUDE_INSUFFISANTE` | < 80% complétude | Afficher progression |
| `MOTIF_NON_REALISATION_REQUIS` | Justification manquante | Afficher modal justification |
| `INCOHERENCE_TYPE_OPERATION` | Phase incompatible | Bloquer sélection phase |
| `ACCOUNT_IN_USE` | Compte utilisé dans CRV | Proposer désactivation |

---

## 🚀 8. BONNES PRATIQUES FRONTEND

### ✅ À FAIRE

1. **Toujours vérifier `success: true`** avant traiter data
   ```javascript
   if (response.data.success) {
     const crv = response.data.data; // ✅
   }
   ```

2. **Gérer TOUS les codes HTTP**
   ```javascript
   try {
     await crvAPI.create(data);
   } catch (error) {
     if (error.response?.status === 403) {
       // CRV verrouillé
     } else if (error.response?.status === 400) {
       // Validation échouée
     }
   }
   ```

3. **Utiliser les champs `id` ET `_id`**
   ```javascript
   // Backend retourne les deux, préférer `id`
   const userId = user.id; // ✅ String
   ```

4. **Envoyer complétude au user en temps réel**
   ```javascript
   // Après chaque modification
   const response = await crvAPI.update(crvId, data);
   displayCompletude(response.data.data.completude); // 0-100
   ```

5. **Désactiver formulaire si verrouillé**
   ```javascript
   const isLocked = crv.statut === 'VERROUILLE';
   return <Form disabled={isLocked} />;
   ```

### ❌ À ÉVITER

1. **❌ Ne pas supposer structure data**
   ```javascript
   // ❌ MAUVAIS
   const crv = response.data.crv;

   // ✅ BON
   const crv = response.data.success
     ? response.data.data
     : null;
   ```

2. **❌ Ne pas ignorer les erreurs de validation**
   ```javascript
   // ❌ MAUVAIS
   catch (error) {
     toast.error("Erreur"); // Générique
   }

   // ✅ BON
   catch (error) {
     const errors = error.response?.data?.errors || [];
     errors.forEach(err => {
       setFieldError(err.field, err.message);
     });
   }
   ```

3. **❌ Ne pas envoyer de données inutiles**
   ```javascript
   // ❌ MAUVAIS
   await crvAPI.update(crvId, {
     ...entireFormState,  // Toutes les données
     someReadOnlyField: "..."
   });

   // ✅ BON
   await crvAPI.update(crvId, {
     responsableVolId: formData.responsable  // Seulement champs modifiés
   });
   ```

---

## 📝 9. EXEMPLES COMPLETS

### Exemple 1: Créer CRV + Phases + Charges

```javascript
// 1. Créer CRV
const { data } = await crvAPI.create({
  type: 'arrivee',
  date: new Date().toISOString()
});

const crvId = data.data._id;

// 2. Compléter phase débarquement
const phaseDebarquement = phases.find(p =>
  p.phase.code === 'ARR_DEBARQ_PAX'
);

await crvAPI.updatePhase(phaseDebarquement._id, {
  statut: 'TERMINE',
  dateHeureDebut: '2026-01-06T10:00:00Z',
  dateHeureFin: '2026-01-06T10:20:00Z',
  responsableId: currentUser.id
});

// 3. Ajouter charge passagers
await crvAPI.addCharge(crvId, {
  typeCharge: 'PASSAGERS',
  sensOperation: 'DEBARQUEMENT',
  passagersAdultes: 120,
  passagersEnfants: 15,
  passagersPMR: 2,
  passagersTransit: 0
});

// 4. Vérifier complétude
const { data: crvUpdated } = await crvAPI.getById(crvId);
console.log(`Complétude: ${crvUpdated.data.crv.completude}%`);
// → Complétude: 45% (phases + charges partielles)
```

### Exemple 2: Gérer annulation

```javascript
// Vérifier si annulation possible
const { data } = await crvAPI.verifierPeutAnnuler(crvId);

if (data.peutAnnuler) {
  await crvAPI.annuler(crvId, {
    raisonAnnulation: 'ANNULATION_CLIENT',
    commentaireAnnulation: 'Client a annulé sa réservation - Ref: ANN-2026-001'
  });

  toast.success('CRV annulé avec traçabilité');
} else {
  toast.error(data.message);
  // "Impossible d'annuler un CRV verrouillé"
}
```

---

## 📞 10. SUPPORT & QUESTIONS

### Points de contact

- **Backend Lead:** [Votre nom]
- **Documentation complète:** `/docs/API_COMPLETE_FRONTEND.md`
- **Postman Collection:** `/postman/CRV-API.postman_collection.json`
- **Issues:** GitHub Issues

### Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2026-01-06 | Version initiale - Création CRV automatique |

---

**🎯 Frontend TODO:**

1. ✅ Implémenter création CRV avec `type` + `date`
2. ⚠️ Ajouter sélection compagnie aérienne (actuellement "Air France" par défaut)
3. ⚠️ Afficher complétude en temps réel (0-100%)
4. ⚠️ Désactiver formulaire si `statut === 'VERROUILLE'`
5. ⚠️ Gérer codes erreur métier (`CRV_VERROUILLE`, etc.)
6. ⚠️ Afficher progression par composant (phases 40%, charges 30%, événements 20%, observations 10%)
