# MVS-8-Referentials - SERVICES

## Date d'audit : 2026-01-10

---

## Constat

Pas de couche service dédiée identifiée pour le MVS-8-Referentials.

La logique métier est directement implémentée dans les controllers.

---

## Impact

| Aspect | Evaluation |
|--------|------------|
| Réutilisabilité | Faible - code dupliqué si besoin ailleurs |
| Testabilité | Réduite - couplage controller-model |
| Maintenabilité | Moyenne - logique dans les controllers |

---

## Recommandation

Si le module évolue vers plus de complexité (règles de validation avancées, calculs automatiques), il serait pertinent de créer :

```
src/services/referentials/
├── avion.service.js
└── index.js
```

Fonctions suggérées :
- validerConfiguration(config)
- calculerCapaciteTotale(sieges)
- creerNouvelleVersion(avion, modifications, user)
- verifierDisponibiliteAvion(immatriculation, date)

---

## Etat actuel

Pas de fichier service à documenter.

