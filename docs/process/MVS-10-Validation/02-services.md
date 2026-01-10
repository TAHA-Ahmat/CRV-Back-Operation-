# MVS-10-Validation - SERVICES

## Date d'audit : 2026-01-10

---

## Constat

Pas de couche service dédiée identifiée pour le MVS-10-Validation.

La logique métier est directement implémentée dans le controller.

---

## Logique metier dans le controller

### Calcul scoreCompletude

Le score de completude est calcule en fonction de la presence des elements obligatoires du CRV :
- Informations vol (date, numero, etc.)
- Horaires (STD, STA, ATD, ATA)
- Charges (passagers, bagages, fret)
- Phases operationnelles
- Engins affectes

### Verification conformiteSLA

La conformite SLA est evaluee en comparant les durees reelles des phases avec les SLA definis :
- Si une phase depasse son SLA -> ecartsSLA ajoute
- Si toutes les phases sont conformes -> conformiteSLA = true

---

## Recommandation

Si le module evolue vers plus de complexite, il serait pertinent de creer :

```
src/services/validation/
├── validation.service.js
└── index.js
```

Fonctions suggerees :
- calculerScoreCompletude(crv)
- verifierConformiteSLA(crv, phases)
- genererRapportValidation(validationId)
- notifierValidation(validationId, statut)

---

## Etat actuel

Pas de fichier service a documenter.

