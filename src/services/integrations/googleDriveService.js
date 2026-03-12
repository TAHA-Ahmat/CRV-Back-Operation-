// ✅ COPIÉ DEPUIS MAGASIN : Service Google Drive pour archivage PDF
import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================
//   CONFIG & AUTHENTICATION
// ============================
const CREDENTIALS_PATH =
  process.env.GOOGLE_DRIVE_CREDENTIALS_PATH ||
  path.join(__dirname, '../../config/archivagebonsdecommande.json');

// ⚠️ Scope élargi à "drive" (permet move/list/metadata sur des fichiers non créés par le service)
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Racine métier (obligatoire)
const DRIVE_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Petite aide pour IDs Drive (validation soft)
const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

// Retry simple (3 essais) sur 429/5xx
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

// ============================
//   PRIMITIVES P0
// ============================

/**
 * ensureFolder(parentId, name)
 * - Idempotent : retourne le folder existant si déjà présent, sinon le crée.
 * - Retour : { folderId, name }
 */
export const ensureFolder = async (parentId, name) => {
  console.log(`[DEBUG-ENSURE] ensureFolder called with parentId="${parentId}", name="${name}"`);

  if (!parentId || !name) {
    const e = new Error('parentId et name sont requis');
    e.status = 400;
    throw e;
  }
  if (!DRIVE_ID_RE.test(parentId)) {
    const e = new Error('parentId Drive invalide');
    e.status = 400;
    throw e;
  }

  // 1) Recherche d'un dossier existant
  const query =
    `'${parentId}' in parents and name = '${name.replaceAll("'", "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const found = await withRetry(
    async () =>
      await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 1,
      }),
    'ENSURE_FOLDER:LIST'
  );

  if (found?.data?.files?.length) {
    const existing = found.data.files[0];
    console.log(`[DEBUG-ENSURE] Found existing folder: "${existing.name}" (${existing.id})`);
    return { folderId: existing.id, name: existing.name };
  }

  // 2) Création si absent
  console.log(`[DEBUG-ENSURE] Creating new folder: "${name}"`);
  const created = await withRetry(
    async () =>
      await drive.files.create({
        requestBody: {
          name,
          parents: [parentId],
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id, name',
      }),
    'ENSURE_FOLDER:CREATE'
  );

  console.log(`[DEBUG-ENSURE] Created folder: "${created.data.name}" (${created.data.id})`);
  return { folderId: created.data.id, name: created.data.name };
};

/**
 * moveFileToFolder(fileId, folderId)
 * - Idempotent : si déjà dans folderId, ne fait rien.
 */
export const moveFileToFolder = async (fileId, folderId) => {
  if (!fileId || !folderId) {
    const e = new Error('fileId et folderId sont requis');
    e.status = 400;
    throw e;
  }
  if (!DRIVE_ID_RE.test(fileId) || !DRIVE_ID_RE.test(folderId)) {
    const e = new Error('fileId ou folderId Drive invalide');
    e.status = 400;
    throw e;
  }

  // Lire les parents actuels
  const meta = await withRetry(
    async () =>
      await drive.files.get({
        fileId,
        fields: 'id, parents',
      }),
    'MOVE_FILE:GET_PARENTS'
  );

  const currentParents = meta?.data?.parents || [];
  const alreadyInside = currentParents.includes(folderId);
  if (alreadyInside) {
    // idempotent: OK
    return { moved: false, reason: 'already_in_folder' };
  }

  const removeParents = currentParents.join(',');

  await withRetry(
    async () =>
      await drive.files.update({
        fileId,
        addParents: folderId,
        removeParents: removeParents || undefined,
        fields: 'id, parents',
      }),
    'MOVE_FILE:UPDATE'
  );

  return { moved: true };
};

/**
 * deleteFolderAndContents(folderName)
 * - Recherche et supprime un dossier par nom avec tout son contenu
 */
export const deleteFolderAndContents = async (folderName) => {
  if (!folderName) {
    const e = new Error('folderName requis');
    e.status = 400;
    throw e;
  }

  // 1) Recherche du dossier par nom dans le dossier racine
  const rootFolderId = DRIVE_ROOT_FOLDER_ID;
  const query =
    `'${rootFolderId}' in parents and name = '${folderName.replaceAll("'", "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const found = await withRetry(
    async () =>
      await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 1,
      }),
    'DELETE_FOLDER:SEARCH'
  );

  if (!found?.data?.files?.length) {
    // Dossier n'existe pas, c'est OK (idempotent)
    return { deleted: false, reason: 'folder_not_found' };
  }

  const folderId = found.data.files[0].id;

  // 2) Suppression du dossier (Drive supprime automatiquement le contenu)
  await withRetry(
    async () =>
      await drive.files.delete({
        fileId: folderId,
      }),
    'DELETE_FOLDER:DELETE'
  );

  return { deleted: true, folderId, folderName };
};

/**
 * getFileMetadata(fileId)
 * - Retourne les métadonnées utiles pour synchroniser la base.
 */
export const getFileMetadata = async (fileId) => {
  if (!fileId) {
    const e = new Error('fileId requis');
    e.status = 400;
    throw e;
  }
  if (!DRIVE_ID_RE.test(fileId)) {
    const e = new Error('fileId Drive invalide');
    e.status = 400;
    throw e;
  }

  const res = await withRetry(
    async () =>
      await drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, size, md5Checksum, parents, webViewLink, webContentLink, iconLink, appProperties',
      }),
    'GET_METADATA'
  );

  const d = res.data || {};
  return {
    fileId: d.id,
    name: d.name,
    mimeType: d.mimeType,
    size: d.size ? Number(d.size) : undefined,
    md5Checksum: d.md5Checksum,
    parents: d.parents || [],
    webViewLink: d.webViewLink,
    webContentLink: d.webContentLink,
    iconLink: d.iconLink,
    appProperties: d.appProperties || undefined,
  };
};

// ============================
//   FONCTIONS D'UPLOAD
// ============================

/**
 * ✅ FONCTION ANTI-DUPLICATION : Vérifie si un fichier existe déjà dans un dossier
 */
export const checkFileExists = async (fileName, parentId) => {
  try {
    if (!fileName || !parentId) {
      return null;
    }

    const query = `name='${fileName}' and '${parentId}' in parents and trashed = false`;

    const response = await withRetry(
      async () =>
        await drive.files.list({
          q: query,
          fields: 'files(id, name, createdTime, mimeType, size, appProperties, webViewLink)',
          pageSize: 1,
        }),
      'CHECK_FILE_EXISTS'
    );

    const files = response.data.files || [];
    return files.length > 0 ? files[0] : null;
  } catch (error) {
    console.error(`[CHECK_FILE_EXISTS] Erreur vérification "${fileName}":`, error.message);
    return null;
  }
};

/**
 * ✅ ADAPTÉ POUR CRV : Upload générique sans logique métier spécifique
 * - Permet de cibler un dossier parent spécifique
 * - Accepte appProperties explicites (pour métadonnées CRV)
 * - mime configurable (par défaut application/pdf)
 * - Anti-duplication activée par défaut
 */
export const uploadFileToDriveAdvanced = async (
  fileName,
  dataStreamOrBuffer,
  {
    mime = 'application/pdf',
    parentId = DRIVE_ROOT_FOLDER_ID,
    appProperties = undefined,
    preventDuplication = true,
  } = {}
) => {
  if (!fileName || !dataStreamOrBuffer) {
    const e = new Error('fileName et dataStreamOrBuffer sont requis');
    e.status = 400;
    throw e;
  }
  if (!DRIVE_ID_RE.test(parentId)) {
    const e = new Error('parentId Drive invalide');
    e.status = 400;
    throw e;
  }

  // ✅ VÉRIFICATION ANTI-DUPLICATION
  if (preventDuplication) {
    const existingFile = await checkFileExists(fileName, parentId);
    if (existingFile) {
      console.warn(`[ANTI-DUPLICATION] Fichier "${fileName}" existe déjà dans ${parentId}`);
      console.warn(`[ANTI-DUPLICATION] ID existant: ${existingFile.id}`);

      return {
        fileId: existingFile.id,
        name: existingFile.name,
        webViewLink: existingFile.webViewLink,
        mimeType: existingFile.mimeType,
        size: existingFile.size ? Number(existingFile.size) : undefined,
        appProperties: existingFile.appProperties || undefined,
        isDuplicate: true
      };
    }
  }

  const requestBody = {
    name: fileName,
    parents: [parentId],
  };
  if (appProperties && typeof appProperties === 'object') {
    requestBody.appProperties = appProperties;
  }

  const media =
    Buffer.isBuffer(dataStreamOrBuffer)
      ? { mimeType: mime, body: stream.Readable.from(dataStreamOrBuffer) }
      : { mimeType: mime, body: dataStreamOrBuffer };

  const response = await withRetry(
    async () =>
      await drive.files.create({
        requestBody,
        media,
        fields: 'id, name, webViewLink, mimeType, size, appProperties',
      }),
    'UPLOAD_FILE_ADV:CREATE'
  );

  // Partage public (anyone + reader) pour accès via lien
  try {
    await withRetry(
      async () =>
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        }),
      'UPLOAD_FILE_ADV:SHARE'
    );
    console.log(`[UPLOAD_FILE_ADV] 🔓 Partage public activé pour ${response.data.id}`);
  } catch (shareError) {
    console.warn(`[UPLOAD_FILE_ADV] ⚠️ Partage public échoué:`, shareError.message);
  }

  const d = response.data || {};
  return {
    fileId: d.id,
    name: d.name,
    webViewLink: d.webViewLink,
    mimeType: d.mimeType,
    size: d.size ? Number(d.size) : undefined,
    appProperties: d.appProperties || undefined,
    publicAccess: true,
  };
};

/**
 * ✅ ADAPTÉ POUR CRV : Version simple pour compatibilité
 */
export const uploadFileToDrive = async (fileName, fileBuffer, metadata = null) => {
  try {
    const parents = [DRIVE_ROOT_FOLDER_ID];
    const fileMetadata = { name: fileName, parents };

    // ✅ Métadonnées génériques pour CRV
    if (metadata && typeof metadata === 'object') {
      fileMetadata.appProperties = metadata;
    }

    const media = {
      mimeType: 'application/pdf',
      body: stream.Readable.from(fileBuffer),
    };

    const response = await withRetry(
      async () =>
        await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, appProperties',
        }),
      'UPLOAD_FILE:CREATE'
    );

    // Partage public (anyone + reader) pour accès via lien
    try {
      await withRetry(
        async () =>
          await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          }),
        'UPLOAD_FILE:SHARE'
      );
      console.log(`[UPLOAD_FILE] 🔓 Partage public activé pour ${response.data.id}`);
    } catch (shareError) {
      console.warn(`[UPLOAD_FILE] ⚠️ Partage public échoué:`, shareError.message);
    }

    return response.data.id;
  } catch (error) {
    console.error("Erreur lors de l'upload sur Google Drive:", error.message);
    const e = new Error("Erreur lors de l'upload sur Google Drive");
    e.status = error?.response?.status || 500;
    throw e;
  }
};

// ============================
//   AUTRES FONCTIONS UTILES
// ============================

export const listFilesInFolder = async (folderId = DRIVE_ROOT_FOLDER_ID) => {
  try {
    if (!DRIVE_ID_RE.test(folderId)) {
      const e = new Error('folderId Drive invalide');
      e.status = 400;
      throw e;
    }
    const response = await withRetry(
      async () =>
        await drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'files(id, name, createdTime, mimeType, size, appProperties, webViewLink)',
        }),
      'LIST_FOLDER'
    );
    return response.data.files || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers :', error.message);
    const e = new Error('Erreur lors de la récupération des fichiers depuis Google Drive');
    e.status = error?.response?.status || 500;
    throw e;
  }
};

export const downloadFileFromDrive = async (fileId) => {
  try {
    if (!DRIVE_ID_RE.test(fileId)) {
      const e = new Error('fileId Drive invalide');
      e.status = 400;
      throw e;
    }
    const response = await withRetry(
      async () =>
        await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' }),
      'DOWNLOAD_FILE'
    );

    const buffer = await new Promise((resolve, reject) => {
      const buf = [];
      response.data
        .on('data', (chunk) => buf.push(chunk))
        .on('end', () => resolve(Buffer.concat(buf)))
        .on('error', (error) => reject(error));
    });
    return buffer;
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier depuis Google Drive :', error.message);
    const e = new Error('Erreur lors du téléchargement du fichier depuis Google Drive');
    e.status = error?.response?.status || 500;
    throw e;
  }
};

export const deleteFile = async (fileId) => {
  if (!fileId) {
    const e = new Error('fileId requis');
    e.status = 400;
    throw e;
  }

  if (!DRIVE_ID_RE.test(fileId)) {
    const e = new Error('fileId Drive invalide');
    e.status = 400;
    throw e;
  }

  try {
    console.log(`[DELETE_FILE] Suppression fichier: ${fileId}`);

    await withRetry(
      async () => await drive.files.delete({ fileId }),
      'DELETE_FILE'
    );

    console.log(`[DELETE_FILE] ✅ Fichier ${fileId} supprimé avec succès`);
    return { success: true, fileId };

  } catch (error) {
    console.error(`[DELETE_FILE] ❌ Erreur suppression ${fileId}:`, error.message);

    if (error?.code === 404 || error?.response?.status === 404) {
      console.log(`[DELETE_FILE] ✅ Fichier ${fileId} déjà supprimé`);
      return { success: true, fileId, already_deleted: true };
    }

    throw new Error(`Suppression fichier échouée: ${error.message}`);
  }
};

export default {
  // Primitives P0
  ensureFolder,
  moveFileToFolder,
  deleteFolderAndContents,
  deleteFile,
  getFileMetadata,
  checkFileExists,

  // Upload
  uploadFileToDrive,
  uploadFileToDriveAdvanced,

  // List/Download
  listFilesInFolder,
  downloadFileFromDrive,
};
