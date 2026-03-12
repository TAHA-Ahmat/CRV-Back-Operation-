# 📁 Configuration Google Drive - CRV Operations

Ce dossier contient les credentials Google Cloud pour le projet **THS CRV Operations**.

## 🔑 Fichier requis

**Nom du fichier** : `ths-crv-operations.json`

**Type** : Service Account Key JSON

**Projet Google Cloud** : THS CRV Operations (dédié au module CRV)

## 📝 Comment obtenir le fichier

Si vous n'avez pas encore le fichier de credentials :

### 1. Accéder à Google Cloud Console

```
https://console.cloud.google.com/
```

Sélectionner le projet : **THS CRV Operations**

### 2. Accéder aux Service Accounts

Navigation : **IAM & Admin** > **Service Accounts**

### 3. Créer ou utiliser le Service Account existant

- Nom suggéré : `crv-archivage`
- Email : `crv-archivage@ths-crv-operations.iam.gserviceaccount.com`

### 4. Créer une clé JSON

1. Cliquer sur le Service Account
2. Onglet **Keys**
3. **Add Key** > **Create new key**
4. Format : **JSON**
5. Télécharger le fichier

### 5. Placer le fichier dans ce dossier

Renommer le fichier téléchargé en :
```
ths-crv-operations.json
```

Le placer exactement ici :
```
config/json/ths-crv-operations.json
```

## 🗂️ Dossier Google Drive cible

**Nom du dossier** : `THS_CRV_ARCHIVES`

**Permissions requises** :
- Le Service Account doit être ajouté comme **Éditeur** sur ce dossier

### Partager le dossier avec le Service Account

1. Ouvrir le dossier `THS_CRV_ARCHIVES` dans Google Drive
2. Clic droit > **Partager**
3. Ajouter l'email du Service Account (ex: `crv-archivage@ths-crv-operations.iam.gserviceaccount.com`)
4. Permissions : **Éditeur**
5. Cliquer sur **Partager**

### Récupérer l'ID du dossier

L'ID du dossier se trouve dans l'URL :
```
https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
                                          ^^^^^^^^^^^^^^^^^^^^
                                          ID du dossier
```

Copier cet ID et le mettre dans `.env` :
```env
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

## 🔒 Sécurité

⚠️ **IMPORTANT** :

- ❌ Ne JAMAIS committer ce fichier sur Git
- ❌ Ne JAMAIS partager publiquement
- ✅ Le fichier est automatiquement ignoré par `.gitignore`
- ✅ Stocker une copie de backup dans un endroit sécurisé

## ✅ Vérification

Pour vérifier que tout est bien configuré :

```bash
# Vérifier que le fichier existe
ls config/json/ths-crv-operations.json

# Vérifier que le .env est configuré
cat .env | grep GOOGLE_DRIVE
```

Les variables doivent être :
```env
GOOGLE_DRIVE_CREDENTIALS_PATH=config/json/ths-crv-operations.json
GOOGLE_DRIVE_FOLDER_ID=<ID_RÉEL_DU_DOSSIER>
```

## 🧪 Test de connexion

Une fois le fichier en place, tester la connexion :

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester le status
curl http://localhost:3001/api/crv/archive/status
```

Réponse attendue :
```json
{
  "configured": true,
  "credentialsExists": true,
  "folderAccessible": true,
  "folderName": "THS_CRV_ARCHIVES"
}
```

## 🆘 Problèmes fréquents

### Erreur : "Fichier credentials non trouvé"

**Cause** : Le fichier n'est pas au bon endroit

**Solution** :
```bash
# Vérifier le chemin exact
pwd
ls -la config/json/
```

Le fichier doit être exactement à :
```
config/json/ths-crv-operations.json
```

### Erreur : "Dossier Google Drive non accessible"

**Cause** : Le Service Account n'a pas les permissions sur le dossier

**Solution** :
1. Ouvrir le dossier `THS_CRV_ARCHIVES` dans Google Drive
2. Vérifier que le Service Account est bien partagé avec permissions **Éditeur**
3. Vérifier que l'ID dans `.env` correspond bien au dossier

### Erreur : "Invalid credentials"

**Cause** : Le fichier JSON est corrompu ou invalide

**Solution** :
1. Télécharger à nouveau une clé depuis Google Cloud Console
2. Remplacer le fichier existant
3. Redémarrer le serveur

## 📚 Documentation

Pour plus d'informations :
- `../../CONFIGURATION.md` - Guide complet de configuration
- `../../README.md` - Documentation générale du projet
