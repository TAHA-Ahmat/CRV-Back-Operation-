# MVS-8-Referentials - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : CREATION AVION DANS LE REFERENTIEL

### Objectif
Ajouter un nouvel avion au referentiel.

### Sequence

```
[Client] POST /api/avions
    |-- Body: { immatriculation, typeAvion, compagnie, capaciteMax, configuration, remarques }
    |
    v
[Middlewares] protect, authorize(MANAGER, ADMIN)
    |
    v
[Controller] creerAvion
    |
    |-- 1. Normaliser immatriculation (uppercase, trim)
    |-- 2. Verifier unicite immatriculation
    |       Si existe: return 400 AVION_DUPLIQUE
    |
    v
[Model] Avion.create({
    immatriculation,
    typeAvion,
    compagnie,
    capaciteMax,
    configuration,
    remarques,
    actif: true,
    version: 1
})
    |
    v
[Response] 201 + { data: avion }
```

### Etat cree
- Avion actif avec version 1

---

## PROCESS 2 : MISE A JOUR CONFIGURATION (Extension 3)

### Objectif
Modifier la configuration d'un avion avec versioning.

### Sequence

```
[Client] PUT /api/avions/:id/configuration
    |-- Body: { configuration, commentaire }
    |
    v
[Middlewares] protect, authorize(MANAGER, ADMIN)
    |
    v
[Controller] mettreAJourConfiguration
    |
    |-- 1. Verifier avion existe
    |-- 2. Sauvegarder version actuelle dans historiqueVersions
    |       {
    |         version: avion.version,
    |         configuration: avion.configuration,
    |         dateModification: now,
    |         modifiePar: req.user._id,
    |         commentaire
    |       }
    |-- 3. Incrementer version
    |-- 4. Appliquer nouvelle configuration
    |
    v
[Model] avion.save()
    |
    v
[Response] 200 + { data: avion }
```

### Comportement versioning
- Chaque modification cree une nouvelle version
- L'historique est conserve indefiniment
- Rollback possible via restauration

---

## PROCESS 3 : RESTAURATION VERSION ANTERIEURE

### Objectif
Restaurer la configuration d'une version precedente.

### Sequence

```
[Client] POST /api/avions/:id/versions/:versionNum/restaurer
    |
    v
[Middlewares] protect, authorize(ADMIN)
    |
    v
[Controller] restaurerVersion
    |
    |-- 1. Verifier avion existe
    |-- 2. Trouver version dans historiqueVersions
    |       Si non trouvee: return 400 VERSION_NON_TROUVEE
    |-- 3. Sauvegarder configuration actuelle dans historique
    |-- 4. Incrementer version
    |-- 5. Appliquer configuration de la version cible
    |
    v
[Model] avion.save()
    |
    v
[Response] 200 + { message: 'Version restauree', data: avion }
```

### Note
La restauration cree une nouvelle version (pas de retour en arriere destructif).

---

## PROCESS 4 : CONSULTATION HISTORIQUE VERSIONS

### Objectif
Consulter l'historique des modifications de configuration.

### Sequence

```
[Client] GET /api/avions/:id/versions
    |
    v
[Middlewares] protect
    |
    v
[Controller] obtenirHistoriqueVersions
    |
    |-- 1. Verifier avion existe
    |-- 2. Populate modifiePar (nom, prenom)
    |
    v
[Response] 200 + {
    data: {
      version: avion.version,
      historiqueVersions: [...]
    }
}
```

---

## PROCESS 5 : SUPPRESSION AVION

### Objectif
Supprimer un avion du referentiel.

### Sequence

```
[Client] DELETE /api/avions/:id
    |
    v
[Middlewares] protect, authorize(ADMIN)
    |
    v
[Controller] supprimerAvion
    |
    |-- 1. Verifier avion existe
    |-- 2. Compter vols associes a cet avion
    |       Si > 0: return 400 AVION_EN_UTILISATION
    |
    v
[Model] avion.deleteOne()
    |
    v
[Response] 200 + { message: 'Avion supprime' }
```

### Protection
- Suppression impossible si historique de vols existe

---

## PROCESS 6 : RECHERCHE AVION PAR IMMATRICULATION

### Objectif
Trouver un avion par son immatriculation.

### Sequence

```
[Client] GET /api/avions/recherche/F-HPJA
    |
    v
[Middlewares] protect
    |
    v
[Controller] rechercherAvionParImmatriculation
    |
    |-- 1. Normaliser immatriculation (uppercase)
    |-- 2. Rechercher par immatriculation exacte
    |
    v
[Response] 200 + { data: avion }
         ou 404 si non trouve
```

---

## SYNTHESE

| Process | Trigger | Criticite |
|---------|---------|-----------|
| Creation avion | POST /avions | MOYENNE |
| MAJ configuration | PUT /avions/:id/configuration | HAUTE |
| Restauration version | POST /avions/:id/versions/:v/restaurer | HAUTE |
| Consultation historique | GET /avions/:id/versions | BASSE |
| Suppression avion | DELETE /avions/:id | HAUTE |
| Recherche immatriculation | GET /avions/recherche/:immat | BASSE |

