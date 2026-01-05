# Plan de recette métier - Backend CRV

## 🎯 Objectif

Valider que le backend CRV respecte strictement toutes les règles métier aéronautiques et que les données produites sont exploitables pour les reportings SLA et l'audit.

---

## 📋 PRÉ-REQUIS

- [ ] MongoDB démarré et accessible
- [ ] Backend lancé (`npm run dev`)
- [ ] Health check OK : `GET /health` → 200
- [ ] Phases référentielles chargées (16 phases)
- [ ] Utilisateur ADMIN créé
- [ ] Utilisateur SUPERVISEUR créé
- [ ] Utilisateur AGENT_ESCALE créé
- [ ] Client API prêt (Postman/Insomnia)

---

## 🧪 SCÉNARIOS DE RECETTE

### Scénario 1 : Cycle de vie complet d'un vol ARRIVEE

#### 1.1 Création des données de base

**Action** : Créer un utilisateur AGENT_ESCALE
```bash
POST /api/auth/register
{
  "nom": "Durand",
  "prenom": "Marie",
  "matricule": "AGT001",
  "email": "marie.durand@test.com",
  "password": "Test123456",
  "fonction": "AGENT_ESCALE"
}
```

**Validation** :
- [ ] Status 201
- [ ] Token reçu
- [ ] Fonction = AGENT_ESCALE

---

**Action** : Créer un vol en ARRIVEE
```bash
POST /api/vols
Authorization: Bearer <token_superviseur>
{
  "numeroVol": "AF1234",
  "typeOperation": "ARRIVEE",
  "compagnieAerienne": "Air France",
  "codeIATA": "AF",
  "aeroportOrigine": "CDG",
  "dateVol": "2024-01-20T14:00:00Z",
  "statut": "PROGRAMME"
}
```

**Validation** :
- [ ] Status 201
- [ ] numeroVol = "AF1234"
- [ ] typeOperation = "ARRIVEE"
- [ ] ID vol récupéré

---

#### 1.2 Création du CRV

**Action** : Créer le CRV
```bash
POST /api/crv
Authorization: Bearer <token_agent>
{
  "volId": "<id_vol_arrivee>"
}
```

**Validation** :
- [ ] Status 201
- [ ] numeroCRV généré (format CRVyyMMdd-XXXX)
- [ ] statut = "BROUILLON"
- [ ] completude = 20% (vol + horaire uniquement)
- [ ] 6 phases initialisées (ARRIVEE + COMMUN)
  - [ ] ARR_ATTERRISSAGE
  - [ ] ARR_ROULAGE
  - [ ] ARR_CALAGE
  - [ ] ARR_PASSERELLE
  - [ ] ARR_DEBARQ_PAX
  - [ ] ARR_DECHARG_SOUTE
  - [ ] COM_CONTROLE_SECU

**Validation critique** :
- [ ] **AUCUNE phase DEPART présente**
- [ ] Toutes phases en statut "NON_COMMENCE"

---

#### 1.3 Tentative d'ajout de phase incompatible

**Action** : Récupérer l'ID d'une phase DEPART dans la base
```bash
# Manuellement via MongoDB Compass ou script
# Trouver une phase avec code "DEP_DECOLLAGE"
```

**Action** : Tenter de démarrer cette phase DEPART sur le CRV ARRIVEE
```bash
POST /api/phases/<id_phase_depart>/demarrer
Authorization: Bearer <token_agent>
{}
```

**Validation critique** :
- [ ] **Status 400**
- [ ] **Code erreur : "INCOHERENCE_TYPE_OPERATION"**
- [ ] Message : "Cette phase est de type DEPART et ne peut être utilisée sur un vol de type ARRIVEE"
- [ ] `details.phaseType` = "DEPART"
- [ ] `details.volType` = "ARRIVEE"

**Résultat attendu** : IMPOSSIBLE d'ajouter phase DEPART sur vol ARRIVEE ✅

---

#### 1.4 Exécution normale des phases ARRIVEE

**Action** : Démarrer phase ARR_ATTERRISSAGE
```bash
POST /api/phases/<id_phase_atterrissage>/demarrer
{}
```

**Validation** :
- [ ] Status 200
- [ ] statut = "EN_COURS"
- [ ] heureDebutReelle renseignée (timestamp actuel)
- [ ] responsable = utilisateur connecté

---

**Action** : Terminer phase ARR_ATTERRISSAGE (attendre 30 secondes)
```bash
POST /api/phases/<id_phase_atterrissage>/terminer
{}
```

**Validation** :
- [ ] Status 200
- [ ] statut = "TERMINE"
- [ ] heureFinReelle renseignée
- [ ] **dureeReelleMinutes calculée automatiquement** (≈ 1 minute)
- [ ] ecartMinutes calculé (peut être null si pas d'heures prévues)

**Vérifier dans MongoDB** :
- [ ] HistoriqueModification créé pour cette action
- [ ] modifiePar = ID utilisateur
- [ ] typeModification = "MISE_A_JOUR"
- [ ] adresseIP renseignée

---

**Action** : Marquer phase ARR_PASSERELLE comme NON_REALISE **sans justification**
```bash
POST /api/phases/<id_phase_passerelle>/non-realise
{
  "motifNonRealisation": "EQUIPEMENT_INDISPONIBLE"
}
```

**Validation critique** :
- [ ] **Status 400**
- [ ] **Code erreur : "DETAIL_MOTIF_REQUIS"**
- [ ] Message : "Une phase non réalisée doit avoir un détail de justification"

---

**Action** : Marquer phase ARR_PASSERELLE comme NON_REALISE **avec justification**
```bash
POST /api/phases/<id_phase_passerelle>/non-realise
{
  "motifNonRealisation": "EQUIPEMENT_INDISPONIBLE",
  "detailMotif": "Passerelle en maintenance préventive"
}
```

**Validation** :
- [ ] Status 200
- [ ] statut = "NON_REALISE"
- [ ] motifNonRealisation = "EQUIPEMENT_INDISPONIBLE"
- [ ] detailMotif = "Passerelle en maintenance préventive"
- [ ] **heureDebutReelle = null**
- [ ] **heureFinReelle = null**
- [ ] **dureeReelleMinutes = null**
- [ ] **ecartMinutes = null**

**Résultat attendu** : Phase non réalisée ne contient AUCUNE durée ✅

---

#### 1.5 Ajout de charges opérationnelles

**Action** : Ajouter charge passagers **sans valeurs explicites**
```bash
POST /api/crv/<id_crv>/charges
{
  "typeCharge": "PASSAGERS",
  "sensOperation": "DEBARQUEMENT"
}
```

**Validation critique** :
- [ ] **Status 400**
- [ ] **Code erreur : "VALEURS_EXPLICITES_REQUISES"**
- [ ] Message contient "Distinguez \"0 passagers\" (saisi) de \"non renseigné\" (absent)"

---

**Action** : Ajouter charge passagers **avec 0 explicite**
```bash
POST /api/crv/<id_crv>/charges
{
  "typeCharge": "PASSAGERS",
  "sensOperation": "DEBARQUEMENT",
  "passagersAdultes": 142,
  "passagersEnfants": 8,
  "passagersPMR": 2,
  "passagersTransit": 0
}
```

**Validation** :
- [ ] Status 201
- [ ] passagersTransit = 0 (et non null)
- [ ] Total passagers calculable = 152

---

**Action** : Ajouter bagages **sans poids**
```bash
POST /api/crv/<id_crv>/charges
{
  "typeCharge": "BAGAGES",
  "sensOperation": "DEBARQUEMENT",
  "nombreBagagesSoute": 140
}
```

**Validation critique** :
- [ ] **Status 400**
- [ ] **Code erreur : "POIDS_REQUIS_AVEC_BAGAGES"**

---

**Action** : Ajouter bagages **avec poids**
```bash
POST /api/crv/<id_crv>/charges
{
  "typeCharge": "BAGAGES",
  "sensOperation": "DEBARQUEMENT",
  "nombreBagagesSoute": 140,
  "poidsBagagesSouteKg": 2100
}
```

**Validation** :
- [ ] Status 201
- [ ] Poids correctement enregistré

---

#### 1.6 Ajout d'événement opérationnel

**Action** : Ajouter retard
```bash
POST /api/crv/<id_crv>/evenements
{
  "typeEvenement": "RETARD",
  "gravite": "MODEREE",
  "dateHeureDebut": "2024-01-20T14:05:00Z",
  "dateHeureFin": "2024-01-20T14:23:00Z",
  "description": "Retard dû à trafic important au sol"
}
```

**Validation** :
- [ ] Status 201
- [ ] dureeImpactMinutes = 18 (calculé automatiquement)
- [ ] declarePar = utilisateur connecté
- [ ] statut = "OUVERT"

---

#### 1.7 Vérification complétude

**Action** : Récupérer le CRV complet
```bash
GET /api/crv/<id_crv>
```

**Validation** :
- [ ] completude > 60% (phases + charges + observations)
- [ ] Phases terminées/non réalisées comptabilisées
- [ ] Charges présentes
- [ ] Événement présent

---

#### 1.8 Tentative de validation avec données incomplètes

**Action** : Tenter validation sans responsable vol
```bash
POST /api/validation/<id_crv>/valider
{
  "commentaires": "Test validation"
}
```

**Validation** :
- [ ] Status 200 (validation enregistrée)
- [ ] statut = "EN_ATTENTE_CORRECTION"
- [ ] anomaliesDetectees contient : "Responsable du vol non défini"
- [ ] verrouille = false
- [ ] CRV toujours modifiable

---

**Action** : Ajouter responsable vol
```bash
PATCH /api/crv/<id_crv>
{
  "responsableVol": "<id_superviseur>"
}
```

---

**Action** : Compléter toutes les phases restantes (ARR_ROULAGE, ARR_CALAGE, ARR_DEBARQ_PAX, ARR_DECHARG_SOUTE, COM_CONTROLE_SECU)

---

#### 1.9 Validation finale réussie

**Action** : Valider le CRV complet
```bash
POST /api/validation/<id_crv>/valider
{
  "commentaires": "CRV complet et conforme"
}
```

**Validation** :
- [ ] Status 200
- [ ] statut = "VALIDE"
- [ ] scoreCompletude >= 80
- [ ] verrouille = true
- [ ] dateVerrouillage renseignée
- [ ] validePar = utilisateur connecté
- [ ] conformiteSLA calculée (true/false)
- [ ] ecartsSLA listés (si > 15 min)

**Vérifier CRV** :
```bash
GET /api/crv/<id_crv>
```

**Validation** :
- [ ] statut = "VERROUILLE"
- [ ] dateVerrouillage présente
- [ ] verrouillePar = validateur

---

#### 1.10 Tentative de modification CRV verrouillé

**Action** : Tenter d'ajouter une charge
```bash
POST /api/crv/<id_crv>/charges
{
  "typeCharge": "FRET",
  "sensOperation": "DEBARQUEMENT",
  "nombreFret": 1,
  "poidsFretKg": 50,
  "typeFret": "STANDARD"
}
```

**Validation critique** :
- [ ] **Status 403**
- [ ] **Code erreur : "CRV_VERROUILLE"**
- [ ] Message : "INTERDIT : CRV validé et verrouillé - aucune modification possible"

---

**Action** : Tenter de modifier une phase
```bash
PATCH /api/phases/<id_phase_quelconque>
{
  "remarques": "Test modification"
}
```

**Validation critique** :
- [ ] **Status 403**
- [ ] **Code erreur : "CRV_VERROUILLE"**

**Résultat attendu** : CRV validé totalement IMMUABLE ✅

---

#### 1.11 Déverrouillage (MANAGER uniquement)

**Action** : Tenter déverrouillage avec SUPERVISEUR
```bash
POST /api/validation/<id_crv>/deverrouiller
Authorization: Bearer <token_superviseur>
{
  "raison": "Correction erreur saisie"
}
```

**Validation critique** :
- [ ] **Status 403**
- [ ] Message : "Rôle SUPERVISEUR n'est pas autorisé"

---

**Action** : Déverrouiller avec MANAGER
```bash
POST /api/validation/<id_crv>/deverrouiller
Authorization: Bearer <token_manager>
{
  "raison": "Correction poids bagages suite audit"
}
```

**Validation** :
- [ ] Status 200
- [ ] Message : "CRV déverrouillé avec succès"

**Vérifier CRV** :
```bash
GET /api/crv/<id_crv>
```

**Validation** :
- [ ] statut = "EN_COURS" (ou "TERMINE")
- [ ] verrouillePar = null
- [ ] dateVerrouillage = null
- [ ] CRV à nouveau modifiable

---

### Scénario 2 : Cycle de vie vol DEPART

Répéter le scénario 1 avec `typeOperation: "DEPART"` et vérifier :

- [ ] Phases DEPART initialisées (9 phases)
- [ ] Aucune phase ARRIVEE présente
- [ ] Impossibilité d'utiliser phase ARRIVEE sur vol DEPART
- [ ] Toutes règles identiques au scénario 1

---

### Scénario 3 : Vol TURN_AROUND

**Action** : Créer vol TURN_AROUND
```bash
POST /api/vols
{
  "numeroVol": "AF5678",
  "typeOperation": "TURN_AROUND",
  "compagnieAerienne": "Air France",
  "codeIATA": "AF",
  "dateVol": "2024-01-20T16:00:00Z"
}
```

**Action** : Créer CRV
```bash
POST /api/crv
{
  "volId": "<id_vol_turnaround>"
}
```

**Validation** :
- [ ] Phases ARRIVEE + DEPART + COMMUN toutes initialisées (≈16 phases)
- [ ] Possibilité d'utiliser toutes les phases
- [ ] Pas de restriction sur typeOperation

---

### Scénario 4 : Calculs de durées et écarts

**Objectif** : Vérifier que les calculs sont fiables et cohérents.

**Action** : Créer phase avec heures prévues et réelles

**Vérifier dans MongoDB** :
```javascript
// Phase avec écart de +10 minutes (retard)
heureDebutPrevue: "2024-01-20T14:00:00Z"
heureFinPrevue: "2024-01-20T14:05:00Z"  // Durée prévue: 5 min
heureDebutReelle: "2024-01-20T14:02:00Z"
heureFinReelle: "2024-01-20T14:09:00Z"  // Durée réelle: 7 min
```

**Validation** :
- [ ] dureeReelleMinutes = 7
- [ ] ecartMinutes = 2 (7 - 5)

**Vérifier cohérence** :
```javascript
calculerDureeMinutes(heureDebutReelle, heureFinReelle) === dureeReelleMinutes
```
- [ ] Cohérence validée ✅

---

### Scénario 5 : Audit trail complet

**Action** : Effectuer plusieurs modifications successives sur un CRV

**Vérifier dans MongoDB** : Collection `historiquemodifications`

**Validation** :
- [ ] Un enregistrement par modification
- [ ] Tous les crvId corrects
- [ ] Tous les modifiePar corrects
- [ ] Tous les typeModification corrects (CREATION, MISE_A_JOUR, VALIDATION)
- [ ] adresseIP renseignée
- [ ] userAgent renseigné
- [ ] dateModification chronologique

---

### Scénario 6 : Conformité SLA

**Objectif** : Vérifier la détection automatique des écarts SLA.

**Action** : Créer CRV avec phases en retard (écart > 15 min)

**Action** : Valider le CRV
```bash
POST /api/validation/<id_crv>/valider
{}
```

**Validation** :
- [ ] conformiteSLA = false
- [ ] ecartsSLA contient les phases concernées
- [ ] Chaque écart indique :
  - [ ] phase (ObjectId)
  - [ ] ecartMinutes (> 15)
  - [ ] description

**Vérifier** :
- [ ] CRV validé malgré non-conformité SLA (enregistrée mais n'empêche pas)

---

## 📊 EXPLOITATION DES DONNÉES

### Test 7 : Reporting SLA

**Objectif** : Vérifier que les données CRV permettent d'expliquer un retard.

**Scénario** : Vol avec retard de 25 minutes au décollage.

**Action** : Récupérer le CRV complet
```bash
GET /api/crv/<id_crv>
```

**Exploitation manuelle** :

1. **Identifier l'écart** :
   - [ ] Horaire.ecartDecollage = 25 minutes

2. **Analyser les phases** :
   - [ ] Identifier phase(s) en retard (ecartMinutes > 0)
   - [ ] Vérifier si phases NON_REALISE (motif + détail)

3. **Consulter événements** :
   - [ ] Événements durant le vol
   - [ ] Gravité, type, durée impact

4. **Observations** :
   - [ ] Commentaires agents
   - [ ] Catégorie SLA si mentionné

**Résultat attendu** :
- [ ] Retard **explicable** via données CRV
- [ ] Causes identifiées (événement, phase retardée)
- [ ] Justifications présentes (motif, détail, observations)

---

### Test 8 : Performance opérationnelle

**Objectif** : Vérifier que les durées réelles permettent d'évaluer la performance.

**Action** : Comparer durées réelles vs standard

**Exploitation** :

Pour chaque phase :
```javascript
ecartPerformance = dureeReelleMinutes - phase.dureeStandardMinutes
```

**Validation** :
- [ ] Phases plus rapides que standard (optimisation)
- [ ] Phases plus lentes (analyse causes)
- [ ] Calculs justes et exploitables

---

## ✅ CHECKLIST FINALE DE RECETTE

### Règles métier validées

- [ ] CRV validé totalement immuable (HTTP 403)
- [ ] Phase ARRIVEE impossible sur vol DEPART (HTTP 400)
- [ ] Phase DEPART impossible sur vol ARRIVEE (HTTP 400)
- [ ] Phase NON_REALISE exige motif + détail (HTTP 400)
- [ ] Phase NON_REALISE ne contient aucune durée
- [ ] 0 ≠ champ absent pour charges (HTTP 400)
- [ ] Poids requis si bagages/fret présents (HTTP 400)
- [ ] Calculs durées automatiques et fiables
- [ ] Audit trail complet sur toutes modifications
- [ ] Validation SLA détecte écarts > 15 min
- [ ] Déverrouillage MANAGER+ uniquement

### Données exploitables

- [ ] Retards explicables via CRV
- [ ] Performances mesurables
- [ ] Causes identifiables
- [ ] Historique traçable

### Sécurité

- [ ] Authentification JWT obligatoire
- [ ] Autorisation par rôles respectée
- [ ] Rate limiting actif
- [ ] Pas d'injection MongoDB possible

---

## 🎯 CRITÈRES D'ACCEPTATION

Le backend est validé si :

✅ Tous les scénarios passent
✅ Toutes les validations critiques OK
✅ Aucune régression fonctionnelle
✅ Données CRV exploitables pour reporting
✅ Audit trail complet et fiable

---

## 📝 RAPPORT DE RECETTE

À compléter après tests :

**Date** : __________
**Testeur** : __________
**Environnement** : __________

**Résultat global** : ☐ ACCEPTÉ  ☐ REFUSÉ

**Scénarios** :
- Scénario 1 (Vol ARRIVEE) : ☐ OK  ☐ KO
- Scénario 2 (Vol DEPART) : ☐ OK  ☐ KO
- Scénario 3 (TURN_AROUND) : ☐ OK  ☐ KO
- Scénario 4 (Calculs) : ☐ OK  ☐ KO
- Scénario 5 (Audit) : ☐ OK  ☐ KO
- Scénario 6 (SLA) : ☐ OK  ☐ KO
- Scénario 7 (Reporting) : ☐ OK  ☐ KO
- Scénario 8 (Performance) : ☐ OK  ☐ KO

**Anomalies détectées** :
_____________________

**Recommandations** :
_____________________

**Signature testeur** : __________
**Signature responsable produit** : __________

---

Version : 1.0
Date : 2024-01-15
