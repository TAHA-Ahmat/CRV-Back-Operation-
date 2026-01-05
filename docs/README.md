# 📚 Documentation Backend CRV - Référence officielle

**Version** : 2.0.0 (Verrouillage métier)
**Date** : 2024-01-15
**Statut** : ✅ Documents officiels validés

---

## 🎯 BIENVENUE

Ce dossier contient **tous les documents de référence officiels** du backend CRV.

Ces documents constituent le **contrat backend ↔ frontend** et sont la **source de vérité** pour l'alignement.

---

## 🚀 PAR OÙ COMMENCER ?

### 👨‍💻 Développeur Frontend
**Commencez par** : [`CONTRAT_FRONTEND.md`](./CONTRAT_FRONTEND.md)
**Temps** : 10 minutes
**Contenu** : Résumé exécutif des 7 règles critiques + endpoints principaux

**Ensuite** :
1. [`REGLES_METIER.md`](./REGLES_METIER.md) - Règles métier détaillées
2. [`API_REFERENCE.md`](./API_REFERENCE.md) - Référence API complète

---

### 🧪 QA / Testeur
**Commencez par** : [`RECETTE_METIER.md`](./RECETTE_METIER.md)
**Temps** : 30 minutes
**Contenu** : 8 scénarios de tests complets avec résultats attendus

**Ensuite** :
1. [`REGLES_METIER.md`](./REGLES_METIER.md) - Comprendre les règles
2. [`API_REFERENCE.md`](./API_REFERENCE.md) - Endpoints à tester

---

### 👔 Product Owner / Manager
**Commencez par** : [`REGLES_METIER.md`](./REGLES_METIER.md)
**Temps** : 20 minutes
**Contenu** : Règles métier non négociables implémentées

**Ensuite** :
1. [`RECETTE_METIER.md`](./RECETTE_METIER.md) - Validation métier
2. [`CHANGELOG_VERROUILLAGE.md`](./CHANGELOG_VERROUILLAGE.md) - Changements

---

### 🔧 Tech Lead / Architecte
**Commencez par** : [`CHANGELOG_VERROUILLAGE.md`](./CHANGELOG_VERROUILLAGE.md)
**Temps** : 15 minutes
**Contenu** : Traçabilité complète des renforcements métier

**Ensuite** :
1. [`REGLES_METIER.md`](./REGLES_METIER.md) - Règles implémentées
2. [`API_REFERENCE.md`](./API_REFERENCE.md) - Architecture API

---

## 📋 LISTE DES DOCUMENTS

| Document | Description | Lecteur cible |
|----------|-------------|---------------|
| **[CONTRAT_FRONTEND.md](./CONTRAT_FRONTEND.md)** | 🤝 Point d'entrée frontend | Frontend |
| **[INDEX.md](./INDEX.md)** | 📚 Navigation complète | Tous |
| **[REGLES_METIER.md](./REGLES_METIER.md)** | 🔒 14 règles métier officielles | Tous |
| **[API_REFERENCE.md](./API_REFERENCE.md)** | 📡 30+ endpoints documentés | Frontend |
| **[RECETTE_METIER.md](./RECETTE_METIER.md)** | 🧪 8 scénarios de tests | QA |
| **[CHANGELOG_VERROUILLAGE.md](./CHANGELOG_VERROUILLAGE.md)** | 📝 Historique changements | Tech Lead |

---

## ⚡ ACCÈS RAPIDE

### 🔒 Règles critiques non négociables
1. CRV validé = totalement immuable
2. Cohérence phase ↔ type vol
3. Phase non réalisée = justification obligatoire
4. Distinction 0 vs champ absent
5. Cohérence charges opérationnelles
6. Calculs durées centralisés
7. Audit trail automatique

👉 **Détails** : [`REGLES_METIER.md`](./REGLES_METIER.md)

---

### 📡 Endpoints principaux

**Authentification**
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil

**CRV**
- `POST /api/crv` - Créer CRV
- `GET /api/crv/:id` - CRV complet
- `PATCH /api/crv/:id` - Modifier

**Phases**
- `POST /api/phases/:id/demarrer` - Démarrer
- `POST /api/phases/:id/terminer` - Terminer
- `POST /api/phases/:id/non-realise` - Non réalisée

**Validation**
- `POST /api/validation/:id/valider` - Valider
- `POST /api/validation/:id/deverrouiller` - Déverrouiller

👉 **Détails** : [`API_REFERENCE.md`](./API_REFERENCE.md)

---

### 🚨 Codes erreur métier

| Code | Action |
|------|--------|
| `CRV_VERROUILLE` | Désactiver UI |
| `INCOHERENCE_TYPE_OPERATION` | Filtrer phases |
| `DETAIL_MOTIF_REQUIS` | Forcer saisie |
| `VALEURS_EXPLICITES_REQUISES` | Forcer 0 explicite |

👉 **Tous les codes** : [`API_REFERENCE.md`](./API_REFERENCE.md)

---

## ✅ GARANTIES

Ces documents :
- ✅ Reflètent **exactement** le comportement du backend
- ✅ Ne contiennent **aucune règle non implémentée**
- ✅ Sont **versionnés** et **maintenus**
- ✅ Sont **testés** (scénarios validés)
- ✅ Constituent la **source de vérité**

---

## 🔄 MAINTENANCE

### Mise à jour
- À chaque changement de règle métier
- À chaque modification d'endpoint
- À chaque nouvelle version backend

### Responsable
- Tech Lead backend
- Après validation Product Owner

### Validation
- Vérifier cohérence entre documents
- Vérifier alignement avec code
- Exécuter scénarios de `RECETTE_METIER.md`

---

## 📞 SUPPORT

**Questions métier** → Consulter `REGLES_METIER.md`
**Questions API** → Consulter `API_REFERENCE.md`
**Questions tests** → Consulter `RECETTE_METIER.md`
**Questions changements** → Consulter `CHANGELOG_VERROUILLAGE.md`

**Contact équipe backend** : [À compléter]

---

## 🔗 LIENS UTILES

### Backend
- [README général](../README.md)
- [Démarrage rapide](../QUICKSTART.md)
- [Déploiement](../DEPLOYMENT.md)

### Code source
- [Modèles](../src/models/)
- [Routes](../src/routes/)
- [Controllers](../src/controllers/)
- [Services](../src/services/)
- [Middlewares](../src/middlewares/)

---

**Version** : 2.0.0 (Verrouillage métier)
**Dernière mise à jour** : 2024-01-15
**Statut** : ✅ Documentation officielle validée
