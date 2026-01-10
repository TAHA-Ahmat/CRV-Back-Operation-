# MVS-4-Charges - CONTROLLERS

## Date d'audit : 2026-01-10

---

## passager.controller.js

### Emplacement
`src/controllers/charges/passager.controller.js`

### Description
Controleur NOUVEAU pour les requetes HTTP liees aux categories detaillees de passagers (Extension 4).

---

### mettreAJourCategoriesDetaillees

| Element | Detail |
|---------|--------|
| Route | PUT /api/charges/:id/categories-detaillees |
| Middlewares | protect, excludeQualite |
| Body | { bebes, enfants, adolescents, adultes, seniors, pmr*, transit*, vip, equipage, deportes } |
| Reponse 200 | { success: true, message, data: charge } |
| Reponse 404 | Charge non trouvee |
| Reponse 500 | Erreur serveur |

---

### mettreAJourClassePassagers

| Element | Detail |
|---------|--------|
| Route | PUT /api/charges/:id/classes |
| Middlewares | protect, excludeQualite |
| Body | { premiere, affaires, economique } |
| Reponse 200 | { success: true, message, data: charge } |
| Reponse 404 | Charge non trouvee |

---

### mettreAJourBesoinsMedicaux

| Element | Detail |
|---------|--------|
| Route | PUT /api/charges/:id/besoins-medicaux |
| Middlewares | protect, excludeQualite |
| Body | { oxygeneBord, brancardier, accompagnementMedical } |
| Reponse 200 | { success: true, message, data: charge } |

---

### mettreAJourMineurs

| Element | Detail |
|---------|--------|
| Route | PUT /api/charges/:id/mineurs |
| Middlewares | protect, excludeQualite |
| Body | { mineurNonAccompagne, bebeNonAccompagne } |
| Reponse 200 | { success: true, message, data: charge } |

---

### obtenirStatistiquesPassagersCRV

| Element | Detail |
|---------|--------|
| Route | GET /api/charges/crv/:crvId/statistiques-passagers |
| Middlewares | protect |
| Reponse 200 | { success: true, data: statistiques } |

---

### obtenirStatistiquesGlobalesPassagers

| Element | Detail |
|---------|--------|
| Route | GET /api/charges/statistiques/passagers |
| Middlewares | protect |
| Query | dateDebut, dateFin, compagnie (optionnels) |
| Reponse 200 | { success: true, data: statistiques } |

---

### convertirVersCategoriesDetaillees

| Element | Detail |
|---------|--------|
| Route | POST /api/charges/:id/convertir-categories-detaillees |
| Middlewares | protect, excludeQualite |
| Body | { mapping?: object } (optionnel) |
| Reponse 200 | { success: true, message, data: charge } |
| Reponse 400 | Deja en categories detaillees |
| Reponse 404 | Charge non trouvee |

---

## fret.controller.js

### Emplacement
`src/controllers/charges/fret.controller.js`

### Description
Controleur NOUVEAU pour les requetes HTTP liees au fret detaille (Extension 5).

---

### mettreAJourFretDetaille

| Element | Detail |
|---------|--------|
| Route | PUT /api/charges/:id/fret-detaille |
| Middlewares | protect, excludeQualite |
| Body | { categoriesFret, marchandisesDangereuses, logistique, douanes, conditionsTransport } |
| Reponse 200 | { success: true, message, data: charge } |
| Reponse 400 | Charge pas de type FRET |
| Reponse 404 | Charge non trouvee |

---

### ajouterMarchandiseDangereuse

| Element | Detail |
|---------|--------|
| Route | POST /api/charges/:id/marchandises-dangereuses |
| Middlewares | protect, excludeQualite |
| Body | { codeONU, classeONU, designationOfficielle, quantite, unite, groupeEmballage } |
| Reponse 201 | { success: true, message, data: charge } |
| Reponse 400 | Champs requis manquants ou pas de type FRET |
| Reponse 404 | Charge non trouvee |

---

### retirerMarchandiseDangereuse

| Element | Detail |
|---------|--------|
| Route | DELETE /api/charges/:id/marchandises-dangereuses/:marchandiseId |
| Middlewares | protect, excludeQualite |
| Reponse 200 | { success: true, message, data: charge } |
| Reponse 404 | Charge non trouvee |

---

### obtenirStatistiquesFretCRV

| Element | Detail |
|---------|--------|
| Route | GET /api/charges/crv/:crvId/statistiques-fret |
| Middlewares | protect |
| Reponse 200 | { success: true, data: statistiques } |

---

### obtenirChargesAvecMarchandisesDangereuses

| Element | Detail |
|---------|--------|
| Route | GET /api/charges/marchandises-dangereuses |
| Middlewares | protect |
| Query | crvId (optionnel) |
| Reponse 200 | { success: true, count, data: charges } |

---

### validerMarchandiseDangereuse

| Element | Detail |
|---------|--------|
| Route | POST /api/charges/valider-marchandise-dangereuse |
| Middlewares | protect |
| Body | Details de la marchandise a valider |
| Reponse 200 | { success: true, data: validation } |

---

### obtenirStatistiquesGlobalesFret

| Element | Detail |
|---------|--------|
| Route | GET /api/charges/statistiques/fret |
| Middlewares | protect |
| Query | dateDebut, dateFin, compagnie (optionnels) |
| Reponse 200 | { success: true, data: statistiques } |

---

## SYNTHESE

| Handler | Route | Role |
|---------|-------|------|
| mettreAJourCategoriesDetaillees | PUT /:id/categories-detaillees | Modifier categories passagers |
| mettreAJourClassePassagers | PUT /:id/classes | Modifier classes passagers |
| mettreAJourBesoinsMedicaux | PUT /:id/besoins-medicaux | Modifier besoins medicaux |
| mettreAJourMineurs | PUT /:id/mineurs | Modifier mineurs |
| convertirVersCategoriesDetaillees | POST /:id/convertir | Convertir basique vers detaille |
| obtenirStatistiquesPassagersCRV | GET /crv/:crvId/statistiques-passagers | Stats passagers CRV |
| obtenirStatistiquesGlobalesPassagers | GET /statistiques/passagers | Stats passagers global |
| mettreAJourFretDetaille | PUT /:id/fret-detaille | Modifier fret detaille |
| ajouterMarchandiseDangereuse | POST /:id/marchandises-dangereuses | Ajouter DG |
| retirerMarchandiseDangereuse | DELETE /:id/marchandises-dangereuses/:id | Retirer DG |
| validerMarchandiseDangereuse | POST /valider-marchandise-dangereuse | Valider DG |
| obtenirChargesAvecMarchandisesDangereuses | GET /marchandises-dangereuses | Lister charges DG |
| obtenirStatistiquesFretCRV | GET /crv/:crvId/statistiques-fret | Stats fret CRV |
| obtenirStatistiquesGlobalesFret | GET /statistiques/fret | Stats fret global |

