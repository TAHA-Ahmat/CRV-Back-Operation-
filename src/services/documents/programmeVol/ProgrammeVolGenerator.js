// ============================================
// GÉNÉRATEUR PDF - PROGRAMME DE VOL
// ============================================
// Implémentation spécifique du générateur de PDF
// pour les programmes de vols (Programme Général des Vols)
//
// HÉRITE DE: DocumentGenerator
// RÉUTILISE: Toute la logique métier de programmeVolPdf.service.js

import { DocumentGenerator } from '../base/DocumentGenerator.js';
import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import ProgrammeVol from '../../../models/flights/ProgrammeVol.js';
import VolProgramme from '../../../models/flights/VolProgramme.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES OPS
// ═══════════════════════════════════════════════════════════════════════════

const JOURS_SEMAINE = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_ORDRE_AFFICHAGE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
  GREEN: '#006600',
  GRAY_LIGHT: '#F0F0F0',
  GRAY_HEADER: '#E0E0E0',
  GRAY_BORDER: '#666666'
};

const CONFIG_THS = {
  responsable: 'ELHADJ M. SEIDNA',
  telephone: '(+235) 66 23 51 18',
  sita: 'NDJKOXH',
  email1: 'thsops@yahoo.fr',
  email2: 'operation@ths-aero.com',
  volsLocaux: 'PAM, RJM, AVMAX, MAF'
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

function formatHeure(heure) {
  if (!heure) return '-';
  return heure.replace(':', 'H');
}

function genererEdition(programme) {
  if (programme.edition) return programme.edition;
  const now = new Date();
  const mois = ['jan', 'fev', 'mars', 'avr', 'mai', 'juin', 'juil', 'aout', 'sept', 'oct', 'nov', 'dec'];
  return `N\u00B001/${now.getDate()}-${mois[now.getMonth()]}.-${now.getFullYear().toString().slice(-2)}`;
}

function estCargo(vol) {
  return vol.categorieVol === 'CARGO' ||
    (vol.version && vol.version.toUpperCase() === 'CARGO') ||
    (vol.typeAvion && (vol.typeAvion.includes('F') || vol.typeAvion.includes('CARGO')));
}

function estNightStop(vol) {
  return vol.observations && vol.observations.toUpperCase().includes('NIGHT STOP');
}

function getNoteOPS(vol) {
  const numVol = (vol.numeroVol || '').toUpperCase();
  const isCargo = estCargo(vol);
  if (isCargo && numVol.startsWith('MS')) return '\u2460';
  if (isCargo && numVol.startsWith('ET')) return '\u2461';
  return '';
}

function calculerTaillePolice(nombreLignesTableau) {
  if (nombreLignesTableau <= 40) return { base: 6.5, table: 6, obs: 5, titre: 9 };
  if (nombreLignesTableau <= 55) return { base: 6, table: 5.5, obs: 4.5, titre: 8.5 };
  if (nombreLignesTableau <= 70) return { base: 5.5, table: 5, obs: 4, titre: 8 };
  return { base: 5, table: 4.5, obs: 3.5, titre: 7 };
}

function calculerPadding(nombreLignesTableau) {
  if (nombreLignesTableau <= 40) return { h: 1.2, v: 0.3 };
  if (nombreLignesTableau <= 60) return { h: 1, v: 0.2 };
  return { h: 0.8, v: 0.15 };
}

function calculerMarges(nombreLignesTableau) {
  if (nombreLignesTableau <= 30) return [15, 10, 15, 12];
  if (nombreLignesTableau <= 50) return [12, 8, 12, 10];
  return [10, 6, 10, 8];
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE GÉNÉRATEUR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Générateur PDF pour les Programmes de Vols
 *
 * @extends DocumentGenerator
 */
export class ProgrammeVolGenerator extends DocumentGenerator {
  constructor(options = {}) {
    super(DOCUMENT_TYPES.PROGRAMME_VOL, options);
    this.thsConfig = { ...CONFIG_THS, ...options.thsConfig };
  }

  /**
   * Récupère les données nécessaires depuis MongoDB
   * @param {string} programmeId - ID du programme
   * @returns {Promise<{entity: Object, data: Object}>}
   */
  async fetchData(programmeId) {
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouvé');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    // Grouper les vols par jour
    const volsParJour = {};
    JOURS_SEMAINE.forEach((nom, index) => {
      volsParJour[nom] = vols.filter(v => v.joursSemaine.includes(index));
    });

    return {
      entity: programme,
      data: { volsParJour, vols }
    };
  }

  /**
   * Construit la définition du document pdfmake
   * @param {Object} programme - Entité programme
   * @param {Object} data - Données (volsParJour)
   * @returns {Object} Définition pdfmake
   */
  buildDocumentDefinition(programme, data) {
    const { volsParJour } = data;
    const cfg = this.thsConfig;
    const edition = genererEdition(programme);

    // Compter le nombre de lignes
    let nombreLignesTableau = 1;
    JOURS_ORDRE_AFFICHAGE.forEach(jour => {
      const vols = volsParJour[jour] || [];
      nombreLignesTableau += vols.length > 0 ? vols.length : 1;
    });

    const tailles = calculerTaillePolice(nombreLignesTableau);
    const padding = calculerPadding(nombreLignesTableau);
    const marges = calculerMarges(nombreLignesTableau);

    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: marges,
      pageBreakBefore: function() { return false; },

      defaultStyle: {
        font: 'DejaVuSans',
        fontSize: tailles.base
      },

      styles: {
        headerInstitution: {
          fontSize: tailles.base - 0.5,
          lineHeight: 1.05
        },
        headerEdition: {
          fontSize: tailles.base,
          color: COLORS.RED,
          bold: true,
          alignment: 'right'
        },
        notesOPS: {
          fontSize: tailles.base - 1,
          lineHeight: 1.05
        },
        mainTitle: {
          fontSize: tailles.titre,
          bold: true,
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fontSize: tailles.table,
          fillColor: COLORS.GRAY_HEADER,
          color: COLORS.BLUE
        },
        jourCell: {
          bold: true,
          fontSize: tailles.table
        }
      },

      content: [
        // EN-TETE INSTITUTIONNEL
        {
          columns: [
            {
              width: '60%',
              stack: [
                { text: 'DIRECTION GENERALE - SERVICE DES OPERATIONS', style: 'headerInstitution', bold: true },
                { text: 'Tchad Handling Services', style: 'headerInstitution' },
                { text: `Tel. ${cfg.telephone} - SITA: ${cfg.sita} - Email: ${cfg.email1}`, style: 'headerInstitution' }
              ]
            },
            {
              width: '40%',
              text: `EDITION ${edition}`,
              style: 'headerEdition'
            }
          ],
          margin: [0, 0, 0, 2]
        },

        // NOTES OPS
        {
          stack: [
            {
              text: [
                { text: '\u27A4 ', color: COLORS.RED },
                { text: 'HORAIRES en heure locale', color: COLORS.RED, bold: true },
                { text: ' | ' },
                { text: `Vols locaux (${cfg.volsLocaux}...) non inclus | Charters/speciaux via flash-info` }
              ],
              style: 'notesOPS'
            },
            {
              text: [
                { text: '\u2460 ', color: COLORS.RED, bold: true },
                { text: 'Egyptair Cargo: horaires selon disponibilites operationnelles' },
                { text: ' | ' },
                { text: '\u2461 ', color: COLORS.RED, bold: true },
                { text: 'Ethiopian Cargo: irregularites notifiees via flash-info' }
              ],
              style: 'notesOPS'
            }
          ],
          margin: [0, 0, 0, 2]
        },

        // TITRE PRINCIPAL
        {
          text: `PROGRAMME GENERAL DES VOLS - ${programme.nom}`,
          style: 'mainTitle',
          margin: [0, 1, 0, 2]
        },

        // TABLEAU DES VOLS
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: [44, 48, 54, 46, 52, 52, 52, 52, 84],
                body: this._buildTableBody(volsParJour, tailles)
              },
              layout: {
                hLineWidth: function() { return 0.4; },
                vLineWidth: function() { return 0.4; },
                hLineColor: function() { return COLORS.GRAY_BORDER; },
                vLineColor: function() { return COLORS.GRAY_BORDER; },
                paddingLeft: function() { return padding.h; },
                paddingRight: function() { return padding.h; },
                paddingTop: function() { return padding.v; },
                paddingBottom: function() { return padding.v; }
              }
            },
            { width: '*', text: '' }
          ]
        },

        // SIGNATURE
        {
          margin: [0, 6, 0, 0],
          columns: [
            { width: '55%', text: '' },
            {
              width: '45%',
              stack: [
                {
                  text: 'LE RESPONSABLE DES OPERATIONS',
                  alignment: 'right',
                  fontSize: tailles.base,
                  margin: [0, 0, 0, 1]
                },
                {
                  text: cfg.responsable,
                  alignment: 'right',
                  fontSize: tailles.base + 0.5,
                  bold: true
                }
              ]
            }
          ]
        }
      ],

      footer: (currentPage) => {
        if (currentPage !== 1) return null;
        return {
          text: `Tchad Handling Services - Service des Operations - Tel. ${cfg.telephone} - SITA: ${cfg.sita} - Email: ${cfg.email1} / ${cfg.email2}`,
          alignment: 'center',
          fontSize: 6,
          color: COLORS.BLACK,
          margin: [marges[0], 0, marges[2], 5]
        };
      }
    };
  }

  /**
   * Construit le corps du tableau des vols
   * @private
   */
  _buildTableBody(volsParJour, tailles) {
    const body = [];

    // EN-TETE
    body.push([
      { text: 'JOURS', style: 'tableHeader', alignment: 'center' },
      { text: 'N\u00B0 VOL', style: 'tableHeader', alignment: 'center' },
      { text: 'Type d\'avion', style: 'tableHeader', alignment: 'center' },
      { text: 'VERSION', style: 'tableHeader', alignment: 'center' },
      { text: 'PROVENANCE', style: 'tableHeader', alignment: 'center' },
      { text: 'Arrivee', style: 'tableHeader', alignment: 'center' },
      { text: 'DESTINATION', style: 'tableHeader', alignment: 'center' },
      { text: 'Depart', style: 'tableHeader', alignment: 'center' },
      { text: 'OBSERVATIONS', style: 'tableHeader', alignment: 'center' }
    ]);

    // LIGNES PAR JOUR
    JOURS_ORDRE_AFFICHAGE.forEach((jour) => {
      const vols = volsParJour[jour] || [];

      if (vols.length === 0) {
        body.push([
          { text: jour, style: 'jourCell', alignment: 'center', fillColor: COLORS.GRAY_LIGHT },
          { text: '-', alignment: 'center', colSpan: 8, fontSize: tailles.table },
          {}, {}, {}, {}, {}, {}, {}
        ]);
      } else {
        vols.forEach((vol, index) => {
          const row = [];
          const isCargo = estCargo(vol);
          const isNightStop = estNightStop(vol);
          const noteOPS = getNoteOPS(vol);

          // COLONNE 1: JOURS
          if (index === 0) {
            row.push({
              text: jour,
              style: 'jourCell',
              rowSpan: vols.length,
              alignment: 'center',
              fillColor: COLORS.GRAY_LIGHT
            });
          } else {
            row.push({});
          }

          // COLONNE 2: N° VOL
          const numVolText = noteOPS ? `${noteOPS} ${vol.numeroVol}` : vol.numeroVol;
          row.push({
            text: numVolText || '-',
            alignment: 'center',
            fontSize: tailles.table,
            color: isCargo ? COLORS.GREEN : COLORS.BLACK,
            bold: isCargo
          });

          // COLONNE 3: Type d'avion
          row.push({
            text: vol.typeAvion || '-',
            alignment: 'center',
            fontSize: tailles.table
          });

          // COLONNE 4: VERSION
          row.push({
            text: vol.version || 'TBN',
            alignment: 'center',
            fontSize: tailles.table,
            color: isCargo ? COLORS.GREEN : COLORS.BLACK
          });

          // COLONNE 5: PROVENANCE
          row.push({
            text: vol.provenance || '-',
            alignment: 'center',
            fontSize: tailles.table,
            bold: true
          });

          // COLONNE 6: Arrivee
          row.push({
            text: formatHeure(vol.heureArrivee),
            alignment: 'center',
            fontSize: tailles.table,
            color: COLORS.BLUE,
            bold: true
          });

          // COLONNE 7: DESTINATION
          row.push({
            text: vol.destination || '-',
            alignment: 'center',
            fontSize: tailles.table,
            bold: true
          });

          // COLONNE 8: Depart
          let heureDepart = formatHeure(vol.heureDepart);
          if (vol.departLendemain) heureDepart += '+1';
          row.push({
            text: heureDepart,
            alignment: 'center',
            fontSize: tailles.table,
            color: COLORS.BLUE,
            bold: true
          });

          // COLONNE 9: OBSERVATIONS
          let obsText = vol.observations || '';
          if (isCargo && !obsText.toUpperCase().includes('CARGO')) {
            obsText = 'CARGO' + (obsText ? ' - ' + obsText : '');
          }
          if (isNightStop) {
            obsText = obsText.replace(/night\s*stop/gi, 'NIGHT STOP');
          }

          row.push({
            text: obsText,
            alignment: 'left',
            fontSize: tailles.obs,
            color: isNightStop ? COLORS.RED : (isCargo ? COLORS.GREEN : COLORS.BLACK)
          });

          body.push(row);
        });
      }
    });

    return body;
  }

  /**
   * Retourne les données d'aperçu formatées
   * @param {string} programmeId - ID du programme
   * @returns {Promise<Object>}
   */
  async getPreviewData(programmeId) {
    const { entity: programme, data } = await this.fetchData(programmeId);
    const { volsParJour } = data;

    // Formater les vols pour l'aperçu
    const volsFormates = {};
    Object.keys(volsParJour).forEach(jour => {
      volsFormates[jour] = volsParJour[jour].map(v => ({
        numeroVol: v.numeroVol,
        typeAvion: v.typeAvion || '-',
        version: v.version || 'TBN',
        provenance: v.provenance || '-',
        arrivee: formatHeure(v.heureArrivee),
        destination: v.destination || '-',
        depart: formatHeure(v.heureDepart) + (v.departLendemain ? '+1' : ''),
        observations: v.observations || '',
        isCargo: estCargo(v),
        isNightStop: estNightStop(v),
        noteOPS: getNoteOPS(v)
      }));
    });

    return {
      documentType: this.documentType,
      label: this.config.label,
      filename: this.getFilename(programme),
      folderPath: this.getFolderPath(programme),
      programme: {
        id: programme._id,
        nom: programme.nom,
        edition: genererEdition(programme),
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin,
        statut: programme.statut,
        nombreVols: programme.nombreVols,
        compagnies: programme.compagnies,
        archivage: programme.archivage
      },
      volsParJour: volsFormates,
      config: this.thsConfig
    };
  }
}

export default ProgrammeVolGenerator;
