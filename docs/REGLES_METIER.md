# Règles métier Backend CRV - Documentation officielle

## 🔒 RÈGLES DE VERROUILLAGE ABSOLUES

### 1. Immutabilité des CRV validés

**RÈGLE** : Un CRV avec `statut: 'VERROUILLE'` est **totalement immuable**.

**Implémentation** :
- Middleware `verifierCRVNonVerrouille` sur toutes les routes de modification
- Retour HTTP 403 avec code `CRV_VERROUILLE` en cas de tentative

**Routes protégées** :
```
PATCH /api/crv/:id
POST /api/crv/:id/charges
POST /api/crv/:id/evenements
POST /api/crv/:id/observations
POST /api/phases/:id/demarrer
POST /api/phases/:id/terminer
POST /api/phases/:id/non-realise
PATCH /api/phases/:id
```

**Exception** : Seul un MANAGER ou ADMIN peut déverrouiller via :
```
POST /api/validation/:id/deverrouiller
```

---

### 2. Cohérence Phase ↔ Type d'opération Vol

**RÈGLE** : Les phases doivent correspondre au type d'opération du vol.

| Type Vol | Phases autorisées |
|----------|------------------|
| ARRIVEE | ARRIVEE + COMMUN uniquement |
| DEPART | DEPART + COMMUN uniquement |
| TURN_AROUND | Toutes phases |

**Implémentation** :
- Middleware `verifierCoherencePhaseTypeOperation`
- Vérification automatique sur démarrage/fin/modification de phase

**Erreur retournée** :
```json
{
  "success": false,
  "message": "INTERDIT : Cette phase est de type DEPART et ne peut être utilisée sur un vol de type ARRIVEE",
  "code": "INCOHERENCE_TYPE_OPERATION",
  "details": {
    "phaseType": "DEPART",
    "volType": "ARRIVEE",
    "phaseLibelle": "Décollage"
  }
}
```

---

### 3. Justification obligatoire pour phase non réalisée

**RÈGLE** : Une phase marquée "NON_REALISE" **DOIT** avoir :
1. Un `motifNonRealisation` (énumération)
2. Un `detailMotif` (texte libre, non vide)

**Motifs autorisés** :
- `NON_NECESSAIRE`
- `EQUIPEMENT_INDISPONIBLE`
- `PERSONNEL_ABSENT`
- `CONDITIONS_METEO`
- `AUTRE`

**Implémentation** :
- Middleware `verifierJustificationNonRealisation`
- Validation express-validator sur `/api/phases/:id/non-realise`

**Erreur si manquant** :
```json
{
  "success": false,
  "message": "INTERDIT : Une phase non réalisée doit avoir un détail de justification",
  "code": "DETAIL_MOTIF_REQUIS",
  "champsManquants": ["detailMotif"]
}
```

---

## 📊 RÈGLES DE COHÉRENCE DES DONNÉES

### 4. Distinction 0 vs champ absent

**RÈGLE FONDAMENTALE** :
- `0` = "Valeur zéro explicitement saisie"
- `null` / `undefined` = "Donnée non renseignée"

**Exemples pratiques** :

#### ✅ Correct
```json
{
  "typeCharge": "PASSAGERS",
  "passagersAdultes": 0,
  "passagersEnfants": 0,
  "passagersPMR": 0,
  "passagersTransit": 0
}
```
→ Signifie : "Vol sans passagers (confirmé)"

#### ❌ Incorrect
```json
{
  "typeCharge": "PASSAGERS"
}
```
→ Retourne erreur `VALEURS_EXPLICITES_REQUISES`

**Implémentation** :
- Middleware `validerCoherenceCharges`
- Validation métier avant insertion

---

### 5. Phase non réalisée = pas de durée

**RÈGLE** : Une phase `statut: 'NON_REALISE'` ne peut avoir :
- `heureDebutReelle`
- `heureFinReelle`
- `dureeReelleMinutes`
- `ecartMinutes`

**Implémentation** :
- Hook `pre('save')` sur modèle ChronologiePhase
- Nettoyage automatique des champs temporels

```javascript
if (this.statut === 'NON_REALISE') {
  this.heureDebutReelle = null;
  this.heureFinReelle = null;
  this.dureeReelleMinutes = null;
  this.ecartMinutes = null;
}
```

---

### 6. Cohérence charges opérationnelles

**RÈGLE** : Si une charge est présente, ses attributs associés sont obligatoires.

| Charge | Si présent | Alors requis |
|--------|-----------|--------------|
| BAGAGES | `nombreBagagesSoute > 0` | `poidsBagagesSouteKg` |
| FRET | `nombreFret > 0` | `poidsFretKg` ET `typeFret` |

**Erreur si incohérent** :
```json
{
  "success": false,
  "message": "INTERDIT : Si fret présent, le type doit être précisé",
  "code": "TYPE_FRET_REQUIS"
}
```

---

## ⏱️ RÈGLES DE CALCUL DES DURÉES

### 7. Centralisation des calculs

**RÈGLE** : Tous les calculs de durées passent par `calcul.service.js`.

**Garanties** :
- Précision : minutes (entier)
- Cohérence : même algorithme partout
- Traçabilité : logs en cas d'incohérence

**Fonctions centralisées** :
```javascript
calculerDureeMinutes(dateDebut, dateFin)        // → Number|null
calculerEcartHoraire(prevue, reelle)            // → Number|null
calculerEcartDuree(debPrev, finPrev, debReel, finReel) // → Object
```

---

### 8. Validation automatique des durées

**RÈGLE** : Les durées sont recalculées à chaque sauvegarde.

**Hooks Mongoose** :
- `ChronologiePhase.pre('save')` → recalcule `dureeReelleMinutes` et `ecartMinutes`
- `Horaire.pre('save')` → recalcule `ecartAtterissage`, `ecartDecollage`, `ecartParc`

**Détection d'incohérence** :
```javascript
validerCoherenceDuree(phase) // Vérifie durée stockée = durée calculée
```

---

## 📝 RÈGLES D'AUDIT ET TRAÇABILITÉ

### 9. Historique automatique sur toutes modifications

**RÈGLE** : Toute modification d'un CRV crée un enregistrement `HistoriqueModification`.

**Implémentation** :
- Middleware `auditLog(typeModification)`
- Extraction automatique du `crvId` depuis req.params, req.body, req.crv, etc.

**Données enregistrées** :
- `crv` : ID du CRV
- `modifiePar` : Utilisateur authentifié
- `typeModification` : CREATION | MISE_A_JOUR | VALIDATION | ANNULATION
- `champModifie` : Identifiant du champ/route
- `ancienneValeur` / `nouvelleValeur`
- `raisonModification` (optionnel)
- `adresseIP` + `userAgent`
- `dateModification` (auto)

**Codes de retour** : Seules les requêtes 2xx génèrent un historique.

---

### 10. Complétude calculée automatiquement

**RÈGLE** : Le champ `completude` (0-100%) est recalculé après chaque modification.

**Critères de calcul** (`crv.service.js::calculerCompletude`) :

| Critère | Points |
|---------|--------|
| Vol renseigné | 10% |
| Horaire renseigné | 10% |
| Phases terminées/non réalisées | 40% |
| Charges opérationnelles | 20% |
| Responsable vol | 10% |
| Observations présentes | 10% |

**Seuil validation** : 80% minimum requis.

---

## 🎯 RÈGLES DE VALIDATION SLA

### 11. Conformité SLA automatique

**RÈGLE** : Un écart de phase > 15 minutes est considéré comme non-conforme SLA.

**Calcul** :
```javascript
verifierConformiteSLA(crvId, compagnieAerienne)
```

**Retour** :
```javascript
{
  conformite: Boolean,
  ecarts: [{ phase, ecartMinutes, description }],
  nbEcarts: Number
}
```

**Utilisation** : Lors de la validation finale du CRV.

---

### 12. Validation finale et verrouillage

**RÈGLE** : La validation d'un CRV vérifie :
1. Complétude ≥ 80%
2. Responsable vol défini
3. Aucune phase en statut `NON_COMMENCE`
4. Conformité SLA (enregistrée mais n'empêche pas validation)

**Si valide** :
- Création `ValidationCRV` avec `statut: 'VALIDE'`
- CRV passe en `statut: 'VERROUILLE'`
- `dateVerrouillage` enregistrée
- `verrouillePar` enregistré

**Si invalide** :
- Création `ValidationCRV` avec `statut: 'EN_ATTENTE_CORRECTION'`
- Liste des `anomaliesDetectees`
- CRV reste modifiable

---

## 🔐 RÈGLES D'AUTORISATION

### 13. Hiérarchie des rôles

```
ADMIN > MANAGER > CHEF_EQUIPE > SUPERVISEUR > AGENT_ESCALE
```

**Autorisations** :

| Action | Rôles autorisés |
|--------|----------------|
| Créer CRV | Tous authentifiés |
| Modifier CRV | Tous authentifiés |
| Valider CRV | SUPERVISEUR+ |
| Déverrouiller CRV | MANAGER+ |
| Créer Vol | SUPERVISEUR+ |
| Modifier Vol | SUPERVISEUR+ |

---

## 📋 FORMAT DES RÉPONSES API

### 14. Structure standardisée

**Succès** :
```json
{
  "success": true,
  "data": { ... },
  "message": "Optionnel"
}
```

**Erreur** :
```json
{
  "success": false,
  "message": "Description claire",
  "code": "CODE_ERREUR_METIER",
  "details": { ... }  // Optionnel
}
```

**Codes HTTP** :
- `200` : OK
- `201` : Créé
- `400` : Erreur validation/règle métier
- `401` : Non authentifié
- `403` : Non autorisé (verrouillage, rôle insuffisant)
- `404` : Ressource non trouvée
- `500` : Erreur serveur

---

## ✅ CHECKLIST FRONTEND

Pour garantir l'alignement, le frontend doit :

- [ ] Gérer le code erreur `CRV_VERROUILLE` (HTTP 403)
- [ ] Désactiver les boutons de modification si CRV verrouillé
- [ ] Afficher les messages d'erreur métier (`code` + `message`)
- [ ] Distinguer visuellement 0 vs "non renseigné"
- [ ] Forcer la saisie de `detailMotif` pour phase non réalisée
- [ ] Ne jamais tenter de modifier un CRV validé
- [ ] Respecter les rôles utilisateurs (masquer actions non autorisées)
- [ ] Utiliser les codes de retour pour la logique conditionnelle
- [ ] Afficher la complétude en temps réel (0-100%)
- [ ] Indiquer clairement les écarts SLA

---

## 🚨 ERREURS CRITIQUES À NE JAMAIS IGNORER

1. **CRV_VERROUILLE** : Arrêter toute tentative de modification
2. **INCOHERENCE_TYPE_OPERATION** : Empêcher l'utilisateur de continuer
3. **DETAIL_MOTIF_REQUIS** : Forcer la saisie avant validation
4. **VALEURS_EXPLICITES_REQUISES** : Obliger l'utilisateur à saisir 0 explicitement

---

## 📞 CONTACT

En cas d'incohérence détectée entre frontend et backend, consulter ce document en priorité.

Version : 1.0
Date : 2024-01-15
