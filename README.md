# Backend CRV - Compte Rendu de Vol

API Backend pour la gestion des Comptes Rendus de Vol (CRV) THS.

## 🎯 Philosophie du projet

Ce backend est construit en **s'alignant sur les standards éprouvés** du backend **Gestion de Stock THS**.

**Principe** : On capitalise sur ce qui fonctionne, on n'invente pas ce qui existe déjà.

---

## 📘 Documentation

### Document principal
👉 **[CATALOGUE_STANDARDS_BACKEND_CRV.md](./CATALOGUE_STANDARDS_BACKEND_CRV.md)**

Ce catalogue contient :
- ✅ Standards à **COPIER** du backend Magasin
- 🔧 Standards à **ADAPTER** pour CRV
- 🆕 Éléments **SPÉCIFIQUES** à créer
- ✅ Checklist d'implémentation (14 jours)
- 📋 Code exemples pour chaque section

---

## 🚀 Quick Start

### 1. Lire la documentation
```bash
# Ouvrir le catalogue de décisions
cat CATALOGUE_STANDARDS_BACKEND_CRV.md
```

### 2. Vérifier les prérequis
- Node.js v18+
- MongoDB
- Accès au backend Magasin (référence)

### 3. Configuration
```bash
# Copier .env.example
cp .env.example .env

# Variables requises (mêmes que Magasin)
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key
GOOGLE_DRIVE_FOLDER_ID=...
```

### 4. Installation
```bash
npm install
npm run dev
```

---

## 📁 Structure du projet

```
Back/
├── src/
│   ├── models/
│   │   ├── User/              ✅ Réutilisé de Magasin
│   │   └── CRV/               🆕 Nouveau métier CRV
│   ├── controllers/
│   │   ├── Auth/              ✅ Réutilisé de Magasin
│   │   └── CRV/               🆕 Nouveau métier CRV
│   ├── routes/
│   │   ├── Auth/              ✅ Réutilisé de Magasin
│   │   └── CRV/               🆕 Nouveau métier CRV
│   ├── services/
│   │   ├── Pdf/               ✅ Adapté de Magasin
│   │   └── Google/            ✅ Réutilisé de Magasin
│   └── middlewares/
│       └── Auth/              ✅ Réutilisé de Magasin
├── server.js
└── package.json
```

---

## 🔑 Principes clés

### ✅ À FAIRE
1. Réutiliser les middlewares Auth du backend Magasin
2. Utiliser UserActivityLog pour l'audit
3. Utiliser googleDriveService pour l'archivage
4. Respecter le format de réponse `{ success, message, error }`
5. Suivre les mêmes codes HTTP (200, 201, 400, 401, 403, 404, 500)

### ❌ À NE PAS FAIRE
1. Créer un système d'auth parallèle
2. Créer une collection User séparée
3. Utiliser un autre JWT_SECRET
4. Créer un service PDF from scratch
5. Changer le format de réponse API

---

## 📞 Ressources

**Code source référence** :
- Backend Magasin : `C:\Users\ahmat\code\Magasin\magasin_Back`

**Documents** :
- [CATALOGUE_STANDARDS_BACKEND_CRV.md](./CATALOGUE_STANDARDS_BACKEND_CRV.md) - Document principal

---

## 🛠️ Technologies

- **Runtime** : Node.js v18+
- **Framework** : Express.js
- **Base de données** : MongoDB + Mongoose
- **Authentification** : JWT (partagé avec Magasin)
- **PDF** : pdfmake (même lib que Magasin)
- **Archivage** : Google Drive API

---

## 📊 Statut du projet

🚧 **En développement**

Suivre la checklist du CATALOGUE pour l'implémentation.

---

**Version** : 1.0.0
**Date** : 01/01/2026
