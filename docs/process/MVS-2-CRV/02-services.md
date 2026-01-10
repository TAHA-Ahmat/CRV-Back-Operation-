# MVS-2-CRV - SERVICES

## Date d'audit : 2026-01-10

---

## 1. crv.service.js

### Emplacement
`src/services/crv/crv.service.js`

### Role dans le MVS
Service principal contenant la logique metier du CRV : calcul de completude, verification SLA, generation numero CRV, deduction type operation.

---

### calculerCompletude(crvId)

**Signature** : `async (crvId) -> Number`

**Parametres** :
- `crvId` : ObjectId - ID du CRV

**Logique metier** :

Ponderation officielle (Cahier des charges) :
- Phases : 40% (pro-rata des phases terminees/non-realisees)
- Charges : 30% (presence de charges operationnelles)
- Evenements : 20% (TOUJOURS attribues - absence = vol nominal)
- Observations : 10% (TOUJOURS attribues - absence = rien a signaler)

**Etapes** :
1. Charger le CRV avec vol et horaire
2. Recuperer les phases (ChronologiePhase)
3. Calculer score phases : (terminees / total) * 40
4. Recuperer les charges avec donnees saisies
5. Calculer score charges : 20-30 selon nb types
6. Ajouter 20 points evenements (toujours)
7. Ajouter 10 points observations (toujours)
8. Mise a jour CRV.completude

**Modeles utilises** :
- CRV
- ChronologiePhase
- ChargeOperationnelle
- EvenementOperationnel
- Observation

**Ecritures en base** :
- CRV.completude mis a jour

**Retour** : Number (0-100)

---

### genererNumeroCRV(vol)

**Signature** : `async (vol) -> String`

**Parametres** :
- `vol` : Document Vol

**Logique** :
1. Extraire date actuelle (YY, MM, DD)
2. Compter les CRV du jour
3. Generer sequence 4 chiffres
4. Format : `CRV{YY}{MM}{DD}-{NNNN}`

**Modeles utilises** : CRV (count)

**Ecritures en base** : Aucune

**Retour** : String (ex: "CRV260110-0001")

---

### verifierConformiteSLA(crvId, compagnieAerienne)

**Signature** : `async (crvId, compagnieAerienne) -> Object`

**Parametres** :
- `crvId` : ObjectId
- `compagnieAerienne` : String

**Logique** :
1. Charger les phases du CRV avec leur reference
2. Pour chaque phase TERMINE avec ecart
3. Si ecart > 15 minutes, ajouter aux ecarts

**Modeles utilises** :
- ChronologiePhase
- Phase

**Ecritures en base** : Aucune

**Retour** :
```javascript
{
  conformite: Boolean,
  ecarts: Array<{ phase, ecartMinutes, description }>,
  nbEcarts: Number
}
```

---

### calculerDureesPhases(heureDebut, heureFin)

**Signature** : `(heureDebut, heureFin) -> Number|null`

**Logique** : Calcule la duree en minutes entre deux dates

**Retour** : Number (minutes) ou null si invalide

---

### deduireTypeOperation(crvId)

**Signature** : `async (crvId) -> Object`

**Parametres** :
- `crvId` : ObjectId

**Logique metier** (Cahier des charges §3) :
Le type d'operation n'est JAMAIS choisi a l'avance, il est DEDUIT automatiquement.

**Indicateurs analyses** :
- Phases ARRIVEE utilisees
- Phases DEPART utilisees
- Horaires arrivee renseignes
- Horaires depart renseignes
- Charges DEBARQUEMENT
- Charges EMBARQUEMENT

**Deduction** :
- Indicateurs arrivee + depart > 0 → TURN_AROUND
- Indicateurs arrivee seuls → ARRIVEE
- Indicateurs depart seuls → DEPART
- Aucun → null (indetermine)

**Modeles utilises** :
- CRV
- ChronologiePhase
- ChargeOperationnelle

**Retour** :
```javascript
{
  typeOperation: 'ARRIVEE' | 'DEPART' | 'TURN_AROUND' | null,
  details: { ... },
  confidence: Number (0-100)
}
```

---

### mettreAJourTypeOperation(crvId)

**Signature** : `async (crvId) -> Object`

**Logique** :
1. Appeler deduireTypeOperation
2. Mettre a jour Vol.typeOperation

**Ecritures en base** : Vol.typeOperation

**Retour** :
```javascript
{
  success: Boolean,
  typeOperation: String|null,
  confidence: Number,
  message: String
}
```

---

## 2. annulation.service.js

### Emplacement
`src/services/crv/annulation.service.js`

### Role dans le MVS
Gestion du cycle de vie d'annulation des CRV (Extension 6).

---

### annulerCRV(crvId, detailsAnnulation, userId)

**Signature** : `async (crvId, detailsAnnulation, userId) -> CRV`

**Parametres** :
- `crvId` : ObjectId
- `detailsAnnulation` : { raisonAnnulation, commentaireAnnulation }
- `userId` : ObjectId

**Logique** :
1. Charger le CRV
2. Verifier qu'il n'est pas deja annule
3. Verifier qu'il n'est pas VERROUILLE
4. Sauvegarder ancien statut
5. Mettre statut a ANNULE
6. Remplir champs annulation

**Verifications** :
- CRV existe (404)
- CRV pas deja annule (400)
- CRV pas verrouille (400)

**Ecritures en base** :
- CRV.statut = 'ANNULE'
- CRV.annulation = {...}

**Retour** : Document CRV mis a jour

---

### reactiverCRV(crvId, userId)

**Signature** : `async (crvId, userId) -> CRV`

**Logique** :
1. Charger le CRV
2. Verifier qu'il est annule
3. Restaurer ancien statut
4. Vider champs annulation

**Ecritures en base** :
- CRV.statut = ancienStatut
- CRV.annulation = null

---

### obtenirCRVAnnules(filtres)

**Signature** : `async (filtres) -> Array<CRV>`

**Filtres** :
- dateDebut, dateFin
- raisonAnnulation

**Retour** : Liste des CRV annules

---

### obtenirStatistiquesAnnulations(filtres)

**Signature** : `async (filtres) -> Object`

**Retour** : Statistiques agregees par raison d'annulation

---

### verifierPeutAnnuler(crvId)

**Signature** : `async (crvId) -> Object`

**Retour** :
```javascript
{
  peutAnnuler: Boolean,
  raisons: Array<String>
}
```

---

## 3. crvArchivageService.js

### Emplacement
`src/services/crv/crvArchivageService.js`

### Role dans le MVS
Archivage des CRV au format PDF vers Google Drive.

---

### archiveCRVPdf(options)

**Signature** : `async ({ buffer, filename, mimeType, crvId, userId }) -> Object`

**Logique** :
1. Verifier configuration Google Drive
2. Upload fichier vers Drive
3. Retourner infos fichier

**Retour** :
```javascript
{
  fileId: String,
  webViewLink: String,
  filename: String,
  size: Number
}
```

---

### checkArchivageStatus()

**Signature** : `async () -> Object`

**Retour** : { configured: Boolean, ... }

---

## SYNTHESE SERVICES MVS-2-CRV

| Service | Fichier | Fonctions | Role |
|---------|---------|-----------|------|
| crv.service | crv.service.js | 5 | Logique metier principale |
| annulation.service | annulation.service.js | 5 | Cycle annulation |
| crvArchivageService | crvArchivageService.js | 2 | Archivage Google Drive |

### Fonctions critiques

| Fonction | Criticite | Justification |
|----------|-----------|---------------|
| calculerCompletude | CRITIQUE | Determine l'etat du CRV |
| genererNumeroCRV | CRITIQUE | Unicite et tracabilite |
| deduireTypeOperation | HAUTE | Logique metier centrale |
| annulerCRV | HAUTE | Cycle de vie CRV |

### Zones a risque

1. **calculerCompletude** : Modification des ponderations impacte tous les CRV
2. **genererNumeroCRV** : Format DOIT rester coherent (audit)
3. **deduireTypeOperation** : Logique complexe, necessaire tests exhaustifs
