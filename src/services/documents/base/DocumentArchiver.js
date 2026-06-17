// ============================================
// SERVICE D'ARCHIVAGE DOCUMENTS GÉNÉRIQUE
// ============================================
// Service unifié pour l'archivage de tous types de documents
// vers Google Drive avec gestion des dossiers et audit

import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from '../../../config/env.js';
import { getDocumentConfig, generateFilename, generateFolderPath } from '../../../config/documents.config.js';
import UserActivityLog from '../../../models/security/UserActivityLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================
//   CONFIGURATION DRIVE
// ============================

const CREDENTIALS_PATH = path.resolve(config.googleDriveCredentialsPath);
const DRIVE_ROOT_FOLDER_ID = config.googleDriveFolderId;
const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

let isConfigured = false;
let configError = null;
let drive = null;

// Validation configuration au démarrage
// Option 1: fichier local (dev)
// Option 2: JSON complet via GOOGLE_DRIVE_CREDENTIALS_JSON (Render — déjà configuré)
// Option 3: client_email + private_key séparés

const credentialsJson = config.googleDriveCredentialsJson;
const parsedCredentials = (() => {
  if (!credentialsJson) return null;
  try { return JSON.parse(credentialsJson); } catch { return null; }
})();

const useJsonCredentials = !fs.existsSync(CREDENTIALS_PATH) && parsedCredentials;
const useEnvCredentials = !fs.existsSync(CREDENTIALS_PATH) && !parsedCredentials &&
  config.googleClientEmail && config.googlePrivateKey;

try {
  if (!fs.existsSync(CREDENTIALS_PATH) && !useJsonCredentials && !useEnvCredentials) {
    configError = 'Aucune source credentials Drive configurée';
  } else if (!DRIVE_ROOT_FOLDER_ID || DRIVE_ROOT_FOLDER_ID === 'ID_DU_DOSSIER_DRIVE_RACINE') {
    configError = 'GOOGLE_DRIVE_FOLDER_ID non configuré';
  } else {
    isConfigured = true;
  }
} catch (err) {
  configError = `Erreur vérification config : ${err.message}`;
}

// Authentification Google Drive
if (isConfigured) {
  try {
    let auth;
    if (useJsonCredentials) {
      auth = new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } else if (useEnvCredentials) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.googleClientEmail,
          private_key: config.googlePrivateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } else {
      auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    }
    drive = google.drive({ version: 'v3', auth });
  } catch (err) {
    configError = `Erreur initialisation Google Drive : ${err.message}`;
    isConfigured = false;
  }
}

// ============================
//   UTILITAIRES
// ============================

const shouldRetry = (err) => {
  const code = err?.code || err?.response?.status;
  return code === 429 || (code >= 500 && code < 600);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label = 'DRIVE', attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!shouldRetry(err) || i === attempts) break;
      const backoff = Math.floor(300 * Math.pow(2, i - 1) + Math.random() * 200);
      console.warn(`[${label}] tentative ${i}/${attempts} échouée, retry dans ${backoff}ms…`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Nom de fichier invalide');
  }
  return filename.replace(/[<>:"|?*]/g, '_');
}

// ============================
//   GESTION DES DOSSIERS
// ============================

/**
 * Assure l'existence d'un dossier (crée si absent)
 * @param {string} parentId - ID du dossier parent
 * @param {string} name - Nom du dossier
 * @returns {Promise<{folderId: string, name: string}>}
 */
async function ensureFolder(parentId, name) {
  if (!parentId || !name) {
    throw new Error('parentId et name sont requis');
  }

  // Recherche dossier existant
  const query = `'${parentId}' in parents and name = '${name.replaceAll("'", "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const found = await withRetry(
    async () =>
      await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }),
    'ENSURE_FOLDER:LIST'
  );

  if (found?.data?.files?.length) {
    return { folderId: found.data.files[0].id, name: found.data.files[0].name };
  }

  // Création si absent
  const created = await withRetry(
    async () =>
      await drive.files.create({
        requestBody: {
          name,
          parents: [parentId],
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id, name',
        supportsAllDrives: true,
      }),
    'ENSURE_FOLDER:CREATE'
  );

  console.log(`[DOC-ARCHIVER] Dossier créé: ${name} (${created.data.id})`);
  return { folderId: created.data.id, name: created.data.name };
}

/**
 * Assure l'existence de toute l'arborescence de dossiers
 * @param {string[]} folderPath - Tableau des noms de dossiers
 * @returns {Promise<string>} ID du dossier final
 */
async function ensureFolderPath(folderPath) {
  if (!Array.isArray(folderPath) || folderPath.length === 0) {
    return DRIVE_ROOT_FOLDER_ID;
  }

  let currentParentId = DRIVE_ROOT_FOLDER_ID;

  for (const folderName of folderPath) {
    const { folderId } = await ensureFolder(currentParentId, folderName);
    currentParentId = folderId;
  }

  return currentParentId;
}

// ============================
//   FONCTION PRINCIPALE
// ============================

/**
 * Archive un document dans Google Drive
 *
 * @param {Object} params - Paramètres d'archivage
 * @param {string} params.documentType - Type de document (DOCUMENT_TYPES)
 * @param {Buffer} params.buffer - Buffer du PDF généré
 * @param {Object} params.entity - Entité source (pour nommage et dossiers)
 * @param {string} params.entityId - ID de l'entité
 * @param {string} params.userId - ID de l'utilisateur déclencheur
 * @param {string} [params.customFilename] - Nom de fichier personnalisé (optionnel)
 * @param {Object} [params.metadata] - Métadonnées supplémentaires (optionnel)
 *
 * @returns {Promise<Object>} Résultat de l'archivage
 */
export async function archiveDocument({
  documentType,
  buffer,
  entity,
  entityId,
  userId,
  customFilename = null,
  metadata = {},
}) {
  const startTime = Date.now();
  const docConfig = getDocumentConfig(documentType);
  const logPrefix = `[DOC-ARCHIVER:${docConfig.label}]`;

  console.log(`${logPrefix} Début archivage pour entity ${entityId}`);

  // ============================
  //   VALIDATIONS
  // ============================

  if (!isConfigured) {
    const error = new Error(`Google Drive non configuré : ${configError}`);
    error.status = 500;
    console.error(`${logPrefix} ❌ ERREUR CONFIG : ${configError}`);

    await logAudit({
      action: `${documentType}_archive_failed`,
      userId,
      entityType: docConfig.label,
      entityId,
      meta: { error: 'Configuration Google Drive manquante', configError },
      details: `Échec archivage ${docConfig.label} ${entityId} - Configuration manquante`,
      success: false,
    });

    throw error;
  }

  if (!buffer || !Buffer.isBuffer(buffer)) {
    const error = new Error('Buffer PDF invalide');
    error.status = 400;
    throw error;
  }

  if (!entity || !entityId) {
    const error = new Error('Entity et entityId requis');
    error.status = 400;
    throw error;
  }

  // ============================
  //   GÉNÉRATION NOM ET CHEMIN
  // ============================

  const filename = customFilename || generateFilename(documentType, entity);
  const safeFilename = sanitizeFilename(filename);
  const folderPath = generateFolderPath(documentType, entity);

  console.log(`${logPrefix} Fichier: ${safeFilename}`);
  console.log(`${logPrefix} Chemin: ${folderPath.join(' / ')}`);
  console.log(`${logPrefix} Taille: ${buffer.length} octets`);

  // ============================
  //   CRÉATION ARBORESCENCE
  // ============================

  let targetFolderId;
  try {
    targetFolderId = await ensureFolderPath(folderPath);
    console.log(`${logPrefix} Dossier cible: ${targetFolderId}`);
  } catch (folderError) {
    console.error(`${logPrefix} ❌ ERREUR création dossiers:`, folderError.message);

    await logAudit({
      action: `${documentType}_archive_failed`,
      userId,
      entityType: docConfig.label,
      entityId,
      meta: { error: folderError.message, step: 'folder_creation' },
      details: `Échec archivage ${docConfig.label} ${entityId} - Création dossiers`,
      success: false,
    });

    throw folderError;
  }

  // ============================
  //   UPLOAD VERS DRIVE
  // ============================

  try {
    const fileMetadata = {
      name: safeFilename,
      parents: [targetFolderId],
      appProperties: {
        documentType,
        entityId,
        archivedAt: new Date().toISOString(),
        ...metadata,
      },
    };

    const media = {
      mimeType: docConfig.pdf.mimeType,
      body: stream.Readable.from(buffer),
    };

    console.log(`${logPrefix} 📤 Upload vers Google Drive...`);

    const response = await withRetry(
      async () =>
        await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, webViewLink, size, createdTime',
          supportsAllDrives: true,
        }),
      `${documentType.toUpperCase()}_ARCHIVE_UPLOAD`
    );

    // ============================
    //   PARTAGE PUBLIC (anyone + reader)
    // ============================
    // Rendre le fichier accessible à toute personne disposant du lien
    // Permet aux utilisateurs de l'app de visualiser sans compte Google entreprise
    try {
      await withRetry(
        async () =>
          await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
          }),
        `${documentType.toUpperCase()}_ARCHIVE_SHARE`
      );
      console.log(`${logPrefix} 🔓 Partage public activé`);
    } catch (shareError) {
      // Log l'erreur mais ne bloque pas l'archivage
      console.warn(`${logPrefix} ⚠️ Partage public échoué (fichier archivé quand même):`, shareError.message);
    }

    const uploadDuration = Date.now() - startTime;
    const result = {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      filename: response.data.name,
      size: response.data.size ? Number(response.data.size) : buffer.length,
      createdTime: response.data.createdTime,
      folderPath: folderPath.join('/'),
      folderId: targetFolderId,
      documentType,
      publicAccess: true,
    };

    console.log(`${logPrefix} ✅ SUCCÈS : Document archivé (accès public)`);
    console.log(`${logPrefix} File ID: ${result.fileId}`);
    console.log(`${logPrefix} URL: ${result.webViewLink}`);
    console.log(`${logPrefix} Durée: ${uploadDuration}ms`);

    // Log audit succès
    await logAudit({
      action: `${documentType}_archive_success`,
      userId,
      entityType: docConfig.label,
      entityId,
      meta: {
        filename: result.filename,
        fileId: result.fileId,
        size: result.size,
        webViewLink: result.webViewLink,
        folderPath: result.folderPath,
        durationMs: uploadDuration,
      },
      details: `${docConfig.label} ${entityId} archivé : ${result.filename}`,
      success: true,
    });

    return result;

  } catch (uploadError) {
    const uploadDuration = Date.now() - startTime;
    console.error(`${logPrefix} ❌ ERREUR UPLOAD:`, uploadError.message);

    await logAudit({
      action: `${documentType}_archive_failed`,
      userId,
      entityType: docConfig.label,
      entityId,
      meta: {
        error: uploadError.message,
        errorCode: uploadError.code,
        filename: safeFilename,
        size: buffer.length,
        durationMs: uploadDuration,
      },
      details: `Échec archivage ${docConfig.label} ${entityId} : ${uploadError.message}`,
      success: false,
    });

    // Erreurs spécifiques
    if (uploadError.code === 404) {
      const error = new Error('Dossier Google Drive non accessible');
      error.status = 500;
      throw error;
    }

    if (uploadError.code === 403) {
      const error = new Error('Permissions insuffisantes sur Google Drive');
      error.status = 500;
      throw error;
    }

    const error = new Error(`Échec archivage Google Drive : ${uploadError.message}`);
    error.status = 500;
    throw error;
  }
}

// ============================
//   FONCTIONS UTILITAIRES
// ============================

/**
 * Log d'audit unifié
 */
async function logAudit({ action, userId, entityType, entityId, meta, details, success }) {
  try {
    await UserActivityLog.write({
      type: success ? 'action' : 'system',
      action,
      utilisateurId: userId || null,
      context: {
        entityType,
        entityId,
        refs: { entityId },
      },
      meta,
      details,
    });
  } catch (logErr) {
    console.error(`[DOC-ARCHIVER] Erreur log audit:`, logErr.message);
  }
}

/**
 * Vérifie le statut du service d'archivage
 * @returns {Promise<Object>} État du service
 */
export async function checkArchiveStatus() {
  const status = {
    configured: isConfigured,
    credentialsPath: CREDENTIALS_PATH,
    credentialsExists: fs.existsSync(CREDENTIALS_PATH),
    folderId: DRIVE_ROOT_FOLDER_ID,
    error: configError,
  };

  if (isConfigured && drive) {
    try {
      const folder = await drive.files.get({
        fileId: DRIVE_ROOT_FOLDER_ID,
        fields: 'id, name, mimeType, driveId',
        supportsAllDrives: true,
      });

      status.folderAccessible = true;
      status.folderName = folder.data.name;

      if (!folder.data.driveId) {
        status.folderAccessible = false;
        status.folderError = 'ERREUR: Dossier My Drive détecté. Service Account nécessite un Shared Drive.';
      } else {
        status.sharedDrive = true;
        status.driveId = folder.data.driveId;
      }
    } catch (err) {
      status.folderAccessible = false;
      status.folderError = err.message;
    }
  }

  return status;
}

/**
 * Récupère les infos d'archivage d'un fichier
 * @param {string} fileId - ID du fichier Drive
 * @returns {Promise<Object>} Métadonnées du fichier
 */
export async function getArchivedFileInfo(fileId) {
  if (!isConfigured) {
    throw new Error('Google Drive non configuré');
  }

  if (!fileId || !DRIVE_ID_RE.test(fileId)) {
    throw new Error('fileId invalide');
  }

  const response = await withRetry(
    async () =>
      await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, createdTime, appProperties',
        supportsAllDrives: true,
      }),
    'GET_FILE_INFO'
  );

  return {
    fileId: response.data.id,
    filename: response.data.name,
    mimeType: response.data.mimeType,
    size: response.data.size ? Number(response.data.size) : null,
    webViewLink: response.data.webViewLink,
    createdTime: response.data.createdTime,
    metadata: response.data.appProperties || {},
  };
}

/**
 * Supprime un fichier archivé
 * @param {string} fileId - ID du fichier Drive
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteArchivedFile(fileId) {
  if (!isConfigured) {
    throw new Error('Google Drive non configuré');
  }

  if (!fileId || !DRIVE_ID_RE.test(fileId)) {
    throw new Error('fileId invalide');
  }

  try {
    await withRetry(
      async () =>
        await drive.files.delete({
          fileId,
          supportsAllDrives: true,
        }),
      'DELETE_FILE'
    );
    return { success: true, fileId };
  } catch (err) {
    if (err.code === 404) {
      return { success: true, fileId, alreadyDeleted: true };
    }
    throw err;
  }
}

// ============================
//   EXPORT
// ============================

export default {
  archiveDocument,
  checkArchiveStatus,
  getArchivedFileInfo,
  deleteArchivedFile,
  ensureFolderPath,
};
