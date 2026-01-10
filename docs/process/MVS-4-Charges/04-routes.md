# MVS-4-Charges - ROUTES

## Date d'audit : 2026-01-10

---

## charge.routes.js

### Emplacement
`src/routes/charges/charge.routes.js`

### Base path
`/api/charges`

---

## Routes Categories Detaillees (Extension 4)

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| PUT | /:id/categories-detaillees | mettreAJourCategoriesDetaillees | protect, excludeQualite | Modifier categories passagers |
| PUT | /:id/classes | mettreAJourClassePassagers | protect, excludeQualite | Modifier classes passagers |
| PUT | /:id/besoins-medicaux | mettreAJourBesoinsMedicaux | protect, excludeQualite | Modifier besoins medicaux |
| PUT | /:id/mineurs | mettreAJourMineurs | protect, excludeQualite | Modifier mineurs |
| POST | /:id/convertir-categories-detaillees | convertirVersCategoriesDetaillees | protect, excludeQualite | Convertir vers detaille |

---

## Routes Statistiques Passagers

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /statistiques/passagers | obtenirStatistiquesGlobalesPassagers | protect | Stats globales passagers |
| GET | /crv/:crvId/statistiques-passagers | obtenirStatistiquesPassagersCRV | protect | Stats passagers par CRV |

---

## Routes Fret Detaille (Extension 5)

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| PUT | /:id/fret-detaille | mettreAJourFretDetaille | protect, excludeQualite | Modifier fret detaille |
| POST | /:id/marchandises-dangereuses | ajouterMarchandiseDangereuse | protect, excludeQualite | Ajouter DG |
| DELETE | /:id/marchandises-dangereuses/:marchandiseId | retirerMarchandiseDangereuse | protect, excludeQualite | Retirer DG |
| POST | /valider-marchandise-dangereuse | validerMarchandiseDangereuse | protect | Valider DG |
| GET | /marchandises-dangereuses | obtenirChargesAvecMarchandisesDangereuses | protect | Lister charges avec DG |

---

## Routes Statistiques Fret

| Methode | Chemin | Controller | Middlewares | Description |
|---------|--------|------------|-------------|-------------|
| GET | /crv/:crvId/statistiques-fret | obtenirStatistiquesFretCRV | protect | Stats fret par CRV |
| GET | /statistiques/fret | obtenirStatistiquesGlobalesFret | protect | Stats globales fret |

---

## Controle d'acces (Phase 1 RBAC)

| Middleware | Description | Routes concernees |
|------------|-------------|-------------------|
| protect | Authentification requise | Toutes |
| excludeQualite | QUALITE exclu des ecritures | PUT, POST, DELETE |

**Perimetre operationnel unifie** :
- AGENT_ESCALE, CHEF_EQUIPE, SUPERVISEUR, MANAGER : Acces total
- QUALITE : Lecture seule (statistiques uniquement)

---

## NON-REGRESSION

Ces routes sont NOUVELLES (Extensions 4 & 5).
- Si des routes /api/charges existaient deja, elles ne sont PAS affectees
- Ces routes ajoutent des endpoints pour la gestion des details

