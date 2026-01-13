# Migration Programme Vol - Guide Frontend

## Contexte

Le système de Programme Vol a été **entièrement restructuré** pour fonctionner comme un calendrier/planning. L'ancien système monolithique a été remplacé par une architecture à deux modèles séparés.

---

## 1. Changement de Philosophie

### Ancien Système (OBSOLÈTE)
```
ProgrammeVolSaisonnier = Un enregistrement unique contenant TOUTES les données du vol
```

### Nouveau Système (ACTUEL)
```
ProgrammeVol (Conteneur) → contient N → VolProgramme (Vols individuels)
```

**Analogie**: C'est comme un agenda (ProgrammeVol) dans lequel on ajoute des événements (VolProgramme) un par un.

---

## 2. Workflow Utilisateur

### Étape 1: Créer un Programme (Conteneur vide)
```
POST /api/programmes-vol
{
  "nom": "HIVER_2025_2026",
  "dateDebut": "2025-10-27",
  "dateFin": "2026-03-28",
  "edition": "N°01/17-déc.-25",      // optionnel
  "description": "Programme hiver"    // optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Programme \"HIVER_2025_2026\" créé avec succès",
  "data": {
    "_id": "abc123...",
    "nom": "HIVER_2025_2026",
    "statut": "BROUILLON",
    "actif": false,
    "nombreVols": 0,
    "compagnies": []
  }
}
```

### Étape 2: Ajouter des Vols (un par un)
```
POST /api/programmes-vol/:programmeId/vols
{
  "joursSemaine": [1, 3, 5],        // Lundi, Mercredi, Vendredi (0=Dim, 6=Sam)
  "numeroVol": "ET939",
  "typeAvion": "B737-800",
  "version": "16C138Y",
  "provenance": "ADD",
  "heureArrivee": "12:10",
  "destination": "ADD",
  "heureDepart": "14:05",
  "departLendemain": false,         // true si départ J+1
  "observations": "Royal Airways",
  "categorieVol": "INTERNATIONAL"   // INTERNATIONAL, REGIONAL, DOMESTIQUE, CARGO
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Vol ET939 ajouté au programme",
  "data": {
    "_id": "vol123...",
    "programme": "abc123...",
    "numeroVol": "ET939",
    "codeCompagnie": "ET",          // Auto-déduit du numéro de vol
    "joursTexte": "Lun-Mer-Ven",    // Virtual field
    "ordre": 1
  }
}
```

### Étape 3: Valider le Programme
```
POST /api/programmes-vol/:id/valider
```
- Passe le statut de `BROUILLON` → `VALIDE`
- Requiert au moins 1 vol dans le programme

### Étape 4: Activer le Programme
```
POST /api/programmes-vol/:id/activer
```
- Passe le statut de `VALIDE` → `ACTIF`
- **Désactive automatiquement** tout autre programme actif (un seul actif à la fois)

---

## 3. Structure des Données

### ProgrammeVol (Conteneur)
| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `nom` | String | Nom unique (ex: HIVER_2025_2026) |
| `edition` | String | N° édition (ex: N°01/17-déc.-25) |
| `description` | String | Description libre |
| `dateDebut` | Date | Début de validité |
| `dateFin` | Date | Fin de validité |
| `statut` | Enum | BROUILLON, VALIDE, ACTIF, SUSPENDU, TERMINE |
| `actif` | Boolean | Programme actuellement actif |
| `nombreVols` | Number | Nombre de vols (auto-calculé) |
| `compagnies` | [String] | Liste des codes compagnies (auto-calculé) |
| `validation.valide` | Boolean | Est validé |
| `validation.validePar` | ObjectId | Qui a validé |
| `validation.dateValidation` | Date | Quand validé |
| `createdBy` | ObjectId | Créateur |
| `updatedBy` | ObjectId | Dernier modificateur |

### VolProgramme (Vol individuel)
| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Identifiant unique |
| `programme` | ObjectId | Référence au programme parent |
| `joursSemaine` | [Number] | Jours d'opération (0=Dim, 6=Sam) |
| `numeroVol` | String | Numéro de vol (ex: ET939, CH110/111) |
| `codeCompagnie` | String | Code IATA (auto-déduit) |
| `typeAvion` | String | Type avion (ex: B737-800) |
| `version` | String | Config sièges (ex: 16C138Y, TBN, CARGO) |
| `provenance` | String | Origine (ex: ADD, IST-NIM) |
| `heureArrivee` | String | Format HH:MM |
| `destination` | String | Destination (ex: CDG, ADD) |
| `heureDepart` | String | Format HH:MM |
| `departLendemain` | Boolean | Départ le lendemain (J+1) |
| `observations` | String | Remarques libres |
| `categorieVol` | Enum | INTERNATIONAL, REGIONAL, DOMESTIQUE, CARGO |
| `typeOperation` | Enum | ARRIVEE, DEPART, TURN_AROUND, TRANSIT |
| `ordre` | Number | Position dans la liste |

### Champs Virtuels (calculés, non stockés)
| Champ | Exemple | Description |
|-------|---------|-------------|
| `joursTexte` | "Lun-Mer-Ven" ou "Quotidien" | Jours en texte |
| `estQuotidien` | true/false | Opère 7j/7 |
| `arriveeFormatee` | "12H10" | Heure avec H |
| `departFormate` | "14H05 (J+1)" | Avec indication J+1 |

---

## 4. API Endpoints Complets

### Programme (Conteneur)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/programmes-vol` | Créer un programme |
| `GET` | `/api/programmes-vol` | Lister les programmes |
| `GET` | `/api/programmes-vol/actif` | Obtenir le programme actif |
| `GET` | `/api/programmes-vol/:id` | Obtenir un programme |
| `PATCH` | `/api/programmes-vol/:id` | Modifier un programme |
| `DELETE` | `/api/programmes-vol/:id` | Supprimer programme + ses vols |
| `POST` | `/api/programmes-vol/:id/valider` | Valider (BROUILLON→VALIDE) |
| `POST` | `/api/programmes-vol/:id/activer` | Activer (VALIDE→ACTIF) |
| `POST` | `/api/programmes-vol/:id/suspendre` | Suspendre (ACTIF→SUSPENDU) |
| `POST` | `/api/programmes-vol/:id/dupliquer` | Dupliquer avec tous ses vols |
| `GET` | `/api/programmes-vol/:id/statistiques` | Stats du programme |
| `GET` | `/api/programmes-vol/:id/resume` | Résumé complet avec vols |

### Vols dans un Programme

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/programmes-vol/:programmeId/vols` | Ajouter un vol |
| `GET` | `/api/programmes-vol/:programmeId/vols` | Lister les vols |
| `GET` | `/api/programmes-vol/:programmeId/vols/:id` | Obtenir un vol |
| `PATCH` | `/api/programmes-vol/:programmeId/vols/:id` | Modifier un vol |
| `DELETE` | `/api/programmes-vol/:programmeId/vols/:id` | Supprimer un vol |
| `GET` | `/api/programmes-vol/:programmeId/vols/jour/:jour` | Vols par jour (0-6) |
| `GET` | `/api/programmes-vol/:programmeId/vols/recherche?q=ET` | Rechercher |
| `GET` | `/api/programmes-vol/:programmeId/vols/compagnie/:code` | Par compagnie |
| `POST` | `/api/programmes-vol/:programmeId/vols/import` | Import bulk |
| `PATCH` | `/api/programmes-vol/:programmeId/vols/reorganiser` | Réordonner |
| `GET` | `/api/programmes-vol/:programmeId/export-pdf` | Données pour PDF |

---

## 5. Query Parameters

### GET /api/programmes-vol
```
?statut=BROUILLON     // Filtrer par statut
?actif=true           // Filtrer les actifs
?nom=HIVER            // Recherche par nom (partiel)
```

### GET /api/programmes-vol/:programmeId/vols
```
?tri=ordre            // Trier par: ordre, heureArrivee, heureDepart, numeroVol
?ordre=asc            // Ordre: asc, desc
```

### GET /api/programmes-vol/:programmeId/vols/recherche
```
?q=ET939              // Terme de recherche (min 2 caractères)
```

---

## 6. Statuts et Transitions

```
                    ┌──────────────┐
                    │  BROUILLON   │ ← Création
                    └──────┬───────┘
                           │ valider (si nombreVols > 0)
                           ▼
                    ┌──────────────┐
                    │    VALIDE    │
                    └──────┬───────┘
                           │ activer
                           ▼
                    ┌──────────────┐
            ┌───────│    ACTIF     │───────┐
            │       └──────────────┘       │
            │ suspendre                    │ (auto si dateFin passée)
            ▼                              ▼
     ┌──────────────┐              ┌──────────────┐
     │   SUSPENDU   │              │   TERMINE    │
     └──────────────┘              └──────────────┘
            │
            │ activer (réactivation)
            ▼
     ┌──────────────┐
     │    ACTIF     │
     └──────────────┘
```

### Règles de Modification
- **BROUILLON**: Tout modifiable (programme + vols)
- **VALIDE**: Tout modifiable (programme + vols)
- **ACTIF**: Non modifiable. Doit être suspendu d'abord.
- **SUSPENDU**: Tout modifiable (programme + vols)
- **TERMINE**: Archivé, non modifiable

---

## 7. Représentation des Jours

### Convention
```javascript
const JOURS = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi'
};
```

### Exemples
| joursSemaine | joursTexte |
|--------------|------------|
| `[1, 2, 3, 4, 5]` | "Lun-Mar-Mer-Jeu-Ven" |
| `[1, 3, 5]` | "Lun-Mer-Ven" |
| `[0, 1, 2, 3, 4, 5, 6]` | "Quotidien" |
| `[6]` | "Sam" |

### Composant UI Suggéré
```jsx
// Checkbox pour chaque jour
const JoursSemaineSelector = ({ value, onChange }) => {
  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="jours-selector">
      {jours.map((jour, index) => (
        <label key={index}>
          <input
            type="checkbox"
            checked={value.includes(index)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...value, index].sort());
              } else {
                onChange(value.filter(j => j !== index));
              }
            }}
          />
          {jour}
        </label>
      ))}
    </div>
  );
};
```

---

## 8. Import en Masse

### POST /api/programmes-vol/:programmeId/vols/import
```json
{
  "vols": [
    {
      "joursSemaine": [1, 3, 5],
      "numeroVol": "ET939",
      "typeAvion": "B737-800",
      "version": "16C138Y",
      "provenance": "ADD",
      "heureArrivee": "12:10",
      "destination": "ADD",
      "heureDepart": "14:05"
    },
    {
      "joursSemaine": [0, 1, 2, 3, 4, 5, 6],
      "numeroVol": "AF946",
      "typeAvion": "A350",
      "version": "34C280Y",
      "provenance": "CDG",
      "heureArrivee": "09:05",
      "destination": "CDG",
      "heureDepart": "10:35"
    }
  ]
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "2 vol(s) importé(s) avec succès",
  "data": {
    "volsCrees": 2,
    "volsErreurs": 0,
    "succes": [...],
    "erreurs": []
  }
}
```

---

## 9. Réorganisation des Vols

### PATCH /api/programmes-vol/:programmeId/vols/reorganiser
```json
{
  "ordres": [
    { "volId": "vol_id_1", "ordre": 1 },
    { "volId": "vol_id_2", "ordre": 2 },
    { "volId": "vol_id_3", "ordre": 3 }
  ]
}
```

---

## 10. Export PDF

### GET /api/programmes-vol/:programmeId/export-pdf
**Réponse:**
```json
{
  "success": true,
  "data": {
    "programme": {
      "nom": "HIVER_2025_2026",
      "edition": "N°01/17-déc.-25",
      "dateDebut": "2025-10-27",
      "dateFin": "2026-03-28"
    },
    "parJour": {
      "DIMANCHE": [...],
      "LUNDI": [
        {
          "jours": "Lun-Mer-Ven",
          "numeroVol": "ET939",
          "typeAvion": "B737-800",
          "version": "16C138Y",
          "provenance": "ADD",
          "arrivee": "12H10",
          "destination": "ADD",
          "depart": "14H05",
          "observations": ""
        }
      ],
      "MARDI": [...],
      ...
    },
    "totalVols": 25,
    "compagnies": ["ET", "AF", "TK"]
  }
}
```

---

## 11. Duplication de Programme

### POST /api/programmes-vol/:id/dupliquer
```json
{
  "nom": "ETE_2026",
  "dateDebut": "2026-03-29",
  "dateFin": "2026-10-25",
  "edition": "N°01"
}
```

Crée un nouveau programme avec **tous les vols copiés** depuis le programme source.

---

## 12. Gestion des Erreurs

### Codes HTTP
| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Erreur de validation / Action impossible |
| 404 | Programme ou Vol non trouvé |
| 409 | Conflit (nom existe déjà) |
| 500 | Erreur serveur |

### Exemple Erreur
```json
{
  "success": false,
  "message": "Impossible de modifier un vol d'un programme actif. Suspendez le programme d'abord."
}
```

---

## 13. Statistiques

### GET /api/programmes-vol/:id/statistiques
```json
{
  "success": true,
  "data": {
    "programme": {
      "nom": "HIVER_2025_2026",
      "statut": "ACTIF",
      "periode": {
        "debut": "2025-10-27",
        "fin": "2026-03-28",
        "dureeJours": 153
      }
    },
    "totalVols": 25,
    "compagnies": ["ET", "AF", "TK", "MS"],
    "parCategorie": {
      "INTERNATIONAL": 20,
      "REGIONAL": 3,
      "CARGO": 2
    },
    "parJour": {
      "Dimanche": { "total": 5, "vols": ["AF946", "ET939", ...] },
      "Lundi": { "total": 8, "vols": [...] },
      ...
    }
  }
}
```

---

## 14. Résumé des Changements Clés

| Aspect | Ancien | Nouveau |
|--------|--------|---------|
| Architecture | 1 modèle monolithique | 2 modèles (Programme + Vols) |
| Ajout de vol | Tout d'un coup | Un par un (progressif) |
| Base URL | `/api/programmes-vol` | Idem |
| Vols d'un programme | Inclus dans le programme | Sous-ressource `/:id/vols` |
| Jours de la semaine | String ou autre | Array de Numbers [0-6] |
| Heures | Variable | Format HH:MM strict |
| Stats programme | À calculer | Auto-calculées (nombreVols, compagnies) |
| Workflow | Implicite | Explicite (BROUILLON→VALIDE→ACTIF) |

---

## 15. Migration Frontend

### Anciens Appels à Remplacer

```javascript
// AVANT (NE PLUS UTILISER)
POST /api/programmes-vol avec tout le contenu

// APRÈS
// 1. Créer le programme
POST /api/programmes-vol { nom, dateDebut, dateFin }

// 2. Ajouter les vols
POST /api/programmes-vol/:id/vols { ...volData }
POST /api/programmes-vol/:id/vols { ...volData }
...

// 3. Valider
POST /api/programmes-vol/:id/valider

// 4. Activer
POST /api/programmes-vol/:id/activer
```

### Hooks React Suggérés

```javascript
// useProgramme.js
const useProgramme = (programmeId) => {
  const [programme, setProgramme] = useState(null);
  const [vols, setVols] = useState([]);

  useEffect(() => {
    // Charger programme
    fetch(`/api/programmes-vol/${programmeId}`)
      .then(r => r.json())
      .then(d => setProgramme(d.data));

    // Charger vols
    fetch(`/api/programmes-vol/${programmeId}/vols`)
      .then(r => r.json())
      .then(d => setVols(d.data));
  }, [programmeId]);

  const ajouterVol = async (volData) => {
    const res = await fetch(`/api/programmes-vol/${programmeId}/vols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(volData)
    });
    const data = await res.json();
    if (data.success) {
      setVols([...vols, data.data]);
    }
    return data;
  };

  return { programme, vols, ajouterVol, ... };
};
```

---

## 16. Contact

Pour toute question sur cette migration, contactez l'équipe backend.

**Date de migration**: Janvier 2026
**Version API**: 2.0
