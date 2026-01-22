// ============================================
// CLASSE DE BASE - GÉNÉRATEUR DE DOCUMENTS
// ============================================
// Interface/Classe abstraite que chaque générateur
// de document (PDF) doit implémenter

import PdfPrinter from 'pdfmake';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDocumentConfig } from '../../../config/documents.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Polices par défaut (DejaVu pour support Unicode)
const FONTS_PATH = path.join(__dirname, '../../../assets/fonts');
const DEFAULT_FONTS = {
  DejaVuSans: {
    normal: path.join(FONTS_PATH, 'DejaVuSans.ttf'),
    bold: path.join(FONTS_PATH, 'DejaVuSans-Bold.ttf'),
    italics: path.join(FONTS_PATH, 'DejaVuSans-Oblique.ttf'),
    bolditalics: path.join(FONTS_PATH, 'DejaVuSans-BoldOblique.ttf'),
  },
};

/**
 * Classe abstraite DocumentGenerator
 *
 * Chaque générateur de document spécifique doit étendre cette classe
 * et implémenter les méthodes abstraites.
 *
 * @abstract
 */
export class DocumentGenerator {
  /**
   * @param {string} documentType - Type de document (DOCUMENT_TYPES)
   * @param {Object} options - Options supplémentaires
   */
  constructor(documentType, options = {}) {
    if (this.constructor === DocumentGenerator) {
      throw new Error('DocumentGenerator est une classe abstraite');
    }

    this.documentType = documentType;
    this.config = getDocumentConfig(documentType);
    this.options = options;
    this.fonts = options.fonts || DEFAULT_FONTS;
    this.printer = new PdfPrinter(this.fonts);
  }

  /**
   * Génère la définition du document pdfmake
   * @abstract
   * @param {Object} entity - Entité source
   * @param {Object} data - Données supplémentaires
   * @returns {Object} Définition pdfmake
   */
  buildDocumentDefinition(entity, data = {}) {
    throw new Error('buildDocumentDefinition() doit être implémenté');
  }

  /**
   * Récupère les données nécessaires pour générer le document
   * @abstract
   * @param {string} entityId - ID de l'entité
   * @returns {Promise<{entity: Object, data: Object}>}
   */
  async fetchData(entityId) {
    throw new Error('fetchData() doit être implémenté');
  }

  /**
   * Génère un Buffer PDF
   * @param {string} entityId - ID de l'entité
   * @returns {Promise<Buffer>}
   */
  async generateBuffer(entityId) {
    const { entity, data } = await this.fetchData(entityId);
    const docDefinition = this.buildDocumentDefinition(entity, data);

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);

        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Génère un Stream PDF (pour téléchargement direct)
   * @param {string} entityId - ID de l'entité
   * @param {Object} res - Response Express
   * @param {Object} options - Options (filename, etc.)
   */
  async generateStream(entityId, res, options = {}) {
    const { entity, data } = await this.fetchData(entityId);
    const docDefinition = this.buildDocumentDefinition(entity, data);
    const filename = options.filename || this.getFilename(entity);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  /**
   * Génère un PDF en base64 (pour preview)
   * @param {string} entityId - ID de l'entité
   * @returns {Promise<string>}
   */
  async generateBase64(entityId) {
    const buffer = await this.generateBuffer(entityId);
    return buffer.toString('base64');
  }

  /**
   * Retourne le nom de fichier pour l'entité
   * @param {Object} entity - Entité source
   * @returns {string}
   */
  getFilename(entity) {
    return this.config.naming.getFilename(entity);
  }

  /**
   * Retourne le chemin des dossiers Drive
   * @param {Object} entity - Entité source
   * @returns {string[]}
   */
  getFolderPath(entity) {
    const dossierRacine = this.config.drive.dossierRacine;
    const sousDossiers = this.config.drive.getFolderPath(entity);
    return [dossierRacine, ...sousDossiers];
  }

  /**
   * Retourne les données pour aperçu (JSON)
   * @param {string} entityId - ID de l'entité
   * @returns {Promise<Object>}
   */
  async getPreviewData(entityId) {
    const { entity, data } = await this.fetchData(entityId);
    return {
      documentType: this.documentType,
      label: this.config.label,
      filename: this.getFilename(entity),
      folderPath: this.getFolderPath(entity),
      entity,
      data,
      config: {
        format: this.config.pdf.format,
        orientation: this.config.pdf.orientation,
      },
    };
  }

  // ============================
  //   HELPERS POUR PDFMAKE
  // ============================

  /**
   * Configuration page par défaut
   */
  getDefaultPageConfig() {
    return {
      pageSize: this.config.pdf.format,
      pageOrientation: this.config.pdf.orientation,
      pageMargins: [20, 20, 20, 20],
      defaultStyle: {
        font: 'DejaVuSans',
        fontSize: 8,
      },
    };
  }

  /**
   * Style d'en-tête standard THS
   */
  getHeaderStyle() {
    return {
      header: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 10,
        alignment: 'center',
        margin: [0, 0, 0, 5],
      },
    };
  }

  /**
   * Style de tableau standard
   */
  getTableStyle() {
    return {
      tableHeader: {
        bold: true,
        fontSize: 8,
        fillColor: '#2c3e50',
        color: 'white',
        alignment: 'center',
      },
      tableCell: {
        fontSize: 7,
        alignment: 'center',
      },
    };
  }

  /**
   * Layout de tableau avec bordures
   */
  getTableLayout() {
    return {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 2,
      paddingBottom: () => 2,
    };
  }
}

/**
 * Interface IDocumentGenerator (pour documentation)
 *
 * Méthodes à implémenter :
 * - buildDocumentDefinition(entity, data) : Object
 * - fetchData(entityId) : Promise<{entity, data}>
 *
 * Méthodes héritées disponibles :
 * - generateBuffer(entityId) : Promise<Buffer>
 * - generateStream(entityId, res, options) : void
 * - generateBase64(entityId) : Promise<string>
 * - getFilename(entity) : string
 * - getFolderPath(entity) : string[]
 * - getPreviewData(entityId) : Promise<Object>
 */

export default DocumentGenerator;
