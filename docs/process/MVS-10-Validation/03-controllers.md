# MVS-10-Validation - CONTROLLERS

## Date d'audit : 2026-01-10

---

## validation.controller.js

### Emplacement
`src/controllers/validation/validation.controller.js`

---

## Handlers

### obtenirValidationCRV

| Element | Detail |
|---------|--------|
| Route | GET /api/validation/:id |
| Middlewares | protect |
| Params | id (CRV id) |
| Populate | crv, validePar, verrouillePar, ecartsSLA.phase, historique.utilisateur |
| Reponse 200 | { success: true, data: validation } |
| Reponse 404 | Validation non trouvee |

---

### validerCRVController

| Element | Detail |
|---------|--------|
| Route | POST /api/validation/:id/valider |
| Middlewares | protect, authorize(QUALITE, ADMIN) |
| Params | id (CRV id) |
| Body | { commentaires } |
| Logique | Calcul scoreCompletude, verification SLA |
| Reponse 200 | { success: true, message, data: validation } |
| Reponse 400 | CRV deja valide ou verrouille |
| Reponse 404 | CRV non trouve |

**Logique** :
```javascript
// 1. Verifier CRV existe et statut
if (crv.statut === 'VALIDE' || crv.statut === 'VERROUILLE') {
  return res.status(400).json({ error: 'CRV deja valide ou verrouille' });
}

// 2. Calculer score completude
const scoreCompletude = calculerScoreCompletude(crv);

// 3. Verifier conformite SLA
const { conformiteSLA, ecartsSLA } = verifierConformiteSLA(crv, phases);

// 4. Creer ou mettre a jour validation
let validation = await ValidationCRV.findOne({ crv: crvId });
if (!validation) {
  validation = new ValidationCRV({ crv: crvId });
}

validation.validePar = req.user._id;
validation.dateValidation = new Date();
validation.statut = 'VALIDE';
validation.scoreCompletude = scoreCompletude;
validation.conformiteSLA = conformiteSLA;
validation.ecartsSLA = ecartsSLA;
validation.commentaires = req.body.commentaires;

// 5. Ajouter a l'historique
validation.historique.push({
  action: 'VALIDATION',
  utilisateur: req.user._id,
  commentaire: req.body.commentaires
});

// 6. Mettre a jour CRV
crv.statut = 'VALIDE';
await crv.save();
```

---

### rejeterCRVController

| Element | Detail |
|---------|--------|
| Route | POST /api/validation/:id/rejeter |
| Middlewares | protect, authorize(QUALITE, ADMIN) |
| Params | id (CRV id) |
| Body | { commentaires } (obligatoire) |
| Reponse 200 | { success: true, message, data: validation } |
| Reponse 400 | CRV deja verrouille, commentaire manquant |
| Reponse 404 | CRV non trouve |

---

### verrouilleCRVController

| Element | Detail |
|---------|--------|
| Route | POST /api/validation/:id/verrouiller |
| Middlewares | protect, authorize(QUALITE, ADMIN) |
| Params | id (CRV id) |
| Precondition | CRV doit etre VALIDE |
| Reponse 200 | { success: true, message, data: validation } |
| Reponse 400 | CRV non valide ou deja verrouille |
| Reponse 404 | CRV non trouve |

**Logique** :
```javascript
// Verifier precondition
if (crv.statut !== 'VALIDE') {
  return res.status(400).json({ error: 'CRV doit etre valide avant verrouillage' });
}

// MAJ validation
validation.verrouille = true;
validation.dateVerrouillage = new Date();
validation.verrouillePar = req.user._id;
validation.statut = 'VERROUILLE';

// Historique
validation.historique.push({
  action: 'VERROUILLAGE',
  utilisateur: req.user._id
});

// MAJ CRV
crv.statut = 'VERROUILLE';
await crv.save();
```

---

### deverrouillerCRVController

| Element | Detail |
|---------|--------|
| Route | POST /api/validation/:id/deverrouiller |
| Middlewares | protect, authorize(ADMIN) |
| Params | id (CRV id) |
| Body | { motif } (obligatoire) |
| Reponse 200 | { success: true, message, data: validation } |
| Reponse 400 | CRV non verrouille, motif manquant |
| Reponse 404 | CRV non trouve |

**Note** : Operation ADMIN uniquement avec motif obligatoire.

---

## Fonctions internes

### calculerScoreCompletude

```javascript
function calculerScoreCompletude(crv) {
  let score = 0;
  const criteres = [
    { condition: crv.vol, poids: 15 },
    { condition: crv.horaireReel?.depart, poids: 10 },
    { condition: crv.horaireReel?.arrivee, poids: 10 },
    { condition: crv.charges?.passagers !== undefined, poids: 15 },
    { condition: crv.charges?.bagages !== undefined, poids: 10 },
    { condition: crv.charges?.fret !== undefined, poids: 10 },
    { condition: crv.phases?.length > 0, poids: 20 },
    { condition: crv.engins?.length > 0, poids: 10 }
  ];

  criteres.forEach(c => {
    if (c.condition) score += c.poids;
  });

  return score;
}
```

### verifierConformiteSLA

```javascript
function verifierConformiteSLA(crv, phases) {
  const ecartsSLA = [];
  let conformiteSLA = true;

  phases.forEach(phase => {
    if (phase.dureeReelle > phase.slaMinutes) {
      conformiteSLA = false;
      ecartsSLA.push({
        phase: phase._id,
        ecartMinutes: phase.dureeReelle - phase.slaMinutes,
        typeEcart: 'DEPASSEMENT'
      });
    }
  });

  return { conformiteSLA, ecartsSLA };
}
```

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| obtenirValidationCRV | GET /validation/:id | Obtenir validation |
| validerCRVController | POST /validation/:id/valider | Valider CRV |
| rejeterCRVController | POST /validation/:id/rejeter | Rejeter CRV |
| verrouilleCRVController | POST /validation/:id/verrouiller | Verrouiller CRV |
| deverrouillerCRVController | POST /validation/:id/deverrouiller | Deverrouiller CRV |

