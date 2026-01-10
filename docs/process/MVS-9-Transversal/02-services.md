# MVS-9-Transversal - SERVICES

## Date d'audit : 2026-01-10

---

## Constat

Pas de couche service dédiée identifiée pour le MVS-9-Transversal.

Les modeles transversaux sont utilises directement par les autres MVS sans service intermediaire.

---

## Usage des modeles transversaux

### AffectationPersonneVol

| MVS utilisateur | Usage |
|-----------------|-------|
| MVS-5-Flights | Gestion affectations personnel aux vols |
| MVS-2-CRV | Affichage personnel affecte |

### EvenementOperationnel

| MVS utilisateur | Usage |
|-----------------|-------|
| MVS-2-CRV | Declaration evenements sur CRV |
| MVS-3-Phases | Impact sur phases |

---

## Recommandation

Si le module evolue vers plus de complexite, il serait pertinent de creer :

```
src/services/transversal/
├── affectationPersonne.service.js
├── evenementOperationnel.service.js
└── index.js
```

Fonctions suggerees :

**affectationPersonne.service.js** :
- affecterPersonneAuVol(volId, personneId, role, heureDebut)
- terminerAffectation(affectationId)
- obtenirEquipeVol(volId)
- obtenirAffectationsPersonne(personneId, dateDebut, dateFin)

**evenementOperationnel.service.js** :
- declarerEvenement(volId, typeEvenement, description, gravite)
- resoudreEvenement(evenementId, actionsCorrectives)
- calculerImpactTotal(volId)
- obtenirEvenementsNonResolus(volId)

---

## Etat actuel

Pas de fichier service a documenter.

