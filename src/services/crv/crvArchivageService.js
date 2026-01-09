// ✅ SERVICE D'ARCHIVAGE CRV - GOOGLE DRIVE
// Service isolé pour l'archivage des PDF CRV dans Google Drive
// Projet : THS CRV Operations
// Dossier cible : THS_CRV_ARCHIVES

import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from '../../config/env.js';
import UserActivityLog from '../../models/security/UserActivityLog.js';

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================
//   CONFIGURATION
// ============================

const CREDENTIALS_PATH = path.resolve(config.googleDriveCredentialsPath);
const DRIVE_FOLDER_ID = config.googleDriveFolderId;

// Validation de la configuration au démarrage
let isConfigured = false;
let configError = null;

try {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    configError = `Fichier credentials non trouvé : ${CREDENTIALS_PATH}`;
  } else if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID === 'ID_DU_DOSSIER_DRIVE_RACINE') {
    configError = 'GOOGLE_DRIVE_FOLDER_ID non configuré dans .env';
  } else {
    isConfigured = true;
  }
} catch (err) {
  configError = `Erreur vérification config : ${err.message}`;
}

// Authentification Google Drive
let drive = null;

if (isConfigured) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    drive = google.drive({ version: 'v3', auth });
  } catch (err) {
    configError = `Erreur initialisation Google Drive : ${err.message}`;
    isConfigured = false;
  }
}

// ============================
//   UTILITAIRES
// ============================

/**
 * Retry simple avec backoff exponentiel
 */
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

/**
 * Validation du nom de fichier
 */
function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Nom de fichier invalide');
  }
  // Remplacer les caractères dangereux
  return filename.replace(/[<>:"|?*]/g, '_');
}

// ============================
//   FONCTION PRINCIPALE
// ============================

/**
 * archiveCRVPdf - Archive un PDF CRV dans Google Drive
 *
 * @param {Object} params - Paramètres d'archivage
 * @param {Buffer} params.buffer - Buffer du PDF généré
 * @param {string} params.filename - Nom normalisé du fichier
 * @param {string} params.mimeType - Type MIME (application/pdf)
 * @param {string} params.crvId - Identifiant du CRV
 * @param {string} params.userId - Identifiant de l'utilisateur déclencheur
 *
 * @returns {Promise<Object>} Résultat de l'archivage
 * @returns {string} return.fileId - ID Google Drive du fichier
 * @returns {string} return.webViewLink - URL de visualisation Drive
 * @returns {string} return.filename - Nom du fichier archivé
 * @returns {number} return.size - Taille du fichier en octets
 *
 * @throws {Error} Si configuration manquante ou upload échoué
 */
export async function archiveCRVPdf({ buffer, filename, mimeType = 'application/pdf', crvId, userId }) {
  const startTime = Date.now();

  // ============================
  //   VALIDATIONS PRÉLIMINAIRES
  // ============================

  console.log(`[CRV-ARCHIVE] Début archivage : ${filename}`);
  console.log(`[CRV-ARCHIVE] CRV ID: ${crvId}, User ID: ${userId}`);

  // Vérification configuration
  if (!isConfigured) {
    const error = new Error(`Google Drive non configuré : ${configError}`);
    error.status = 500;
    console.error(`[CRV-ARCHIVE] ❌ ERREUR CONFIG : ${configError}`);

    // Log audit d'échec
    try {
      await UserActivityLog.write({
        type: 'system',
        action: 'crv_archive_failed',
        utilisateurId: userId || null,
        context: {
          entityType: 'CRV',
          entityId: crvId,
        },
        meta: {
          error: 'Configuration Google Drive manquante',
          filename,
          configError,
        },
        details: `Échec archivage CRV ${crvId} - Configuration manquante`,
      });
    } catch (logErr) {
      console.error(`[CRV-ARCHIVE] Erreur log audit :`, logErr.message);
    }

    throw error;
  }

  // Validation paramètres
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const error = new Error('Buffer PDF invalide');
    error.status = 400;
    console.error(`[CRV-ARCHIVE] ❌ ERREUR : Buffer invalide`);
    throw error;
  }

  if (!filename) {
    const error = new Error('Nom de fichier requis');
    error.status = 400;
    console.error(`[CRV-ARCHIVE] ❌ ERREUR : Nom de fichier manquant`);
    throw error;
  }

  if (!crvId) {
    const error = new Error('CRV ID requis');
    error.status = 400;
    console.error(`[CRV-ARCHIVE] ❌ ERREUR : CRV ID manquant`);
    throw error;
  }

  // Normalisation du nom de fichier
  const safeFilename = validateFilename(filename);
  console.log(`[CRV-ARCHIVE] Nom de fichier normalisé : ${safeFilename}`);
  console.log(`[CRV-ARCHIVE] Taille du PDF : ${buffer.length} octets`);

  // ============================
  //   UPLOAD VERS GOOGLE DRIVE
  // ============================

  try {
    const fileMetadata = {
      name: safeFilename,
      parents: [DRIVE_FOLDER_ID],
      mimeType,
    };

    const media = {
      mimeType,
      body: stream.Readable.from(buffer),
    };

    console.log(`[CRV-ARCHIVE] 📤 Upload vers Google Drive...`);
    console.log(`[CRV-ARCHIVE] Dossier cible : ${DRIVE_FOLDER_ID}`);

    const response = await withRetry(
      async () =>
        await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, webViewLink, size, createdTime',
          supportsAllDrives: true,
        }),
      'CRV_ARCHIVE_UPLOAD'
    );

    const uploadDuration = Date.now() - startTime;
    const result = {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      filename: response.data.name,
      size: response.data.size ? Number(response.data.size) : buffer.length,
      createdTime: response.data.createdTime,
    };

    console.log(`[CRV-ARCHIVE] ✅ SUCCÈS : PDF archivé`);
    console.log(`[CRV-ARCHIVE] File ID : ${result.fileId}`);
    console.log(`[CRV-ARCHIVE] URL : ${result.webViewLink}`);
    console.log(`[CRV-ARCHIVE] Durée : ${uploadDuration}ms`);

    // ============================
    //   LOG AUDIT SUCCÈS
    // ============================

    try {
      await UserActivityLog.write({
        type: 'action',
        action: 'crv_archive_success',
        utilisateurId: userId || null,
        context: {
          entityType: 'CRV',
          entityId: crvId,
          refs: {
            crvId,
          },
        },
        meta: {
          filename: result.filename,
          fileId: result.fileId,
          size: result.size,
          webViewLink: result.webViewLink,
          durationMs: uploadDuration,
        },
        details: `CRV ${crvId} archivé : ${result.filename}`,
      });
    } catch (logErr) {
      console.error(`[CRV-ARCHIVE] Erreur log audit succès :`, logErr.message);
    }

    return result;

  } catch (uploadError) {
    const uploadDuration = Date.now() - startTime;

    console.error(`[CRV-ARCHIVE] ❌ ERREUR UPLOAD :`, uploadError.message);
    console.error(`[CRV-ARCHIVE] Code erreur :`, uploadError.code);
    console.error(`[CRV-ARCHIVE] Durée avant échec : ${uploadDuration}ms`);

    // ============================
    //   LOG AUDIT ÉCHEC
    // ============================

    try {
      await UserActivityLog.write({
        type: 'system',
        action: 'crv_archive_failed',
        utilisateurId: userId || null,
        context: {
          entityType: 'CRV',
          entityId: crvId,
        },
        meta: {
          error: uploadError.message,
          errorCode: uploadError.code,
          filename: safeFilename,
          size: buffer.length,
          durationMs: uploadDuration,
        },
        details: `Échec archivage CRV ${crvId} : ${uploadError.message}`,
      });
    } catch (logErr) {
      console.error(`[CRV-ARCHIVE] Erreur log audit échec :`, logErr.message);
    }

    // Erreur spécifique selon le code
    if (uploadError.code === 404) {
      const error = new Error('Dossier Google Drive non accessible. Vérifier GOOGLE_DRIVE_FOLDER_ID et permissions.');
      error.status = 500;
      throw error;
    }

    if (uploadError.code === 403) {
      const error = new Error('Permissions insuffisantes sur le dossier Google Drive.');
      error.status = 500;
      throw error;
    }

    // Erreur générique
    const error = new Error(`Échec archivage Google Drive : ${uploadError.message}`);
    error.status = 500;
    throw error;
  }
}

// ============================
//   FONCTION DE VÉRIFICATION
// ============================

/**
 * Vérifie que le service d'archivage est opérationnel
 *
 * @returns {Promise<Object>} État du service
 */
export async function checkArchivageStatus() {
  const status = {
    configured: isConfigured,
    credentialsPath: CREDENTIALS_PATH,
    credentialsExists: fs.existsSync(CREDENTIALS_PATH),
    folderId: DRIVE_FOLDER_ID,
    error: configError,
  };

  if (isConfigured && drive) {
    try {
      // Test de connexion : récupérer les métadonnées du dossier
      const folder = await drive.files.get({
        fileId: DRIVE_FOLDER_ID,
        fields: 'id, name, mimeType, driveId',
        supportsAllDrives: true,
      });

      status.folderAccessible = true;
      status.folderName = folder.data.name;

      // Vérification critique: My Drive vs Shared Drive
      if (!folder.data.driveId) {
        status.folderAccessible = false;
        status.folderError = 'ERREUR: Dossier My Drive détecté. Service Account nécessite un Shared Drive (ID commençant par 0A).';
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

// ============================
//   EXPORT
// ============================

export default {
  archiveCRVPdf,
  checkArchivageStatus,
};
