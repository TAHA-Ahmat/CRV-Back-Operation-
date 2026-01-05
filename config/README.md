# 📁 Dossier de Configuration

Ce dossier contient les fichiers de configuration sensibles pour les services externes.

## 📋 Fichiers requis

### Google Drive

**Fichier** : `archivagebonsdecommande.json`

Ce fichier contient les credentials du Service Account Google Cloud pour l'archivage des PDF CRV sur Google Drive.

#### Comment l'obtenir :

1. Créer un projet sur https://console.cloud.google.com/
2. Activer l'API Google Drive
3. Créer un Service Account
4. Télécharger la clé JSON
5. Renommer le fichier en `archivagebonsdecommande.json`
6. Le placer dans ce dossier

#### Format attendu :

```json
{
  "type": "service_account",
  "project_id": "votre-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ces fichiers contiennent des informations sensibles !

- ❌ Ne jamais commit ces fichiers sur Git
- ❌ Ne jamais partager ces fichiers publiquement
- ✅ Ces fichiers sont automatiquement ignorés par `.gitignore`
- ✅ Seul le fichier `.json.example` est versionné

## 📚 Documentation complète

Pour plus d'informations sur la configuration, consultez :

- `../CONFIGURATION.md` - Guide complet de configuration
- `../README.md` - Documentation générale du projet

## 🆘 Aide

Si le fichier de credentials est manquant ou invalide, vous verrez cette erreur :

```
Error: ENOENT: no such file or directory, open './config/archivagebonsdecommande.json'
```

**Solution** :

1. Copier le template :
   ```bash
   cp archivagebonsdecommande.json.example archivagebonsdecommande.json
   ```

2. Remplacer les valeurs par vos vraies credentials

3. Vérifier que le fichier existe :
   ```bash
   ls archivagebonsdecommande.json    # Linux/Mac
   dir archivagebonsdecommande.json   # Windows
   ```
