// ============================================
// GENERATEUR PDF - BULLETIN DE MOUVEMENT
// ============================================
// Implementation specifique du generateur de PDF
// pour les bulletins de mouvement (3-4 jours)
//
// HERITE DE: DocumentGenerator

import { DocumentGenerator } from '../base/DocumentGenerator.js';
import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import BulletinMouvement from '../../../models/bulletin/BulletinMouvement.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
  GREEN: '#006600',
  ORANGE: '#CC6600',
  GRAY_LIGHT: '#F0F0F0',
  GRAY_HEADER: '#E0E0E0',
  GRAY_BORDER: '#666666'
};

const CONFIG_THS = {
  responsable: 'ELHADJ M. SEIDNA',
  telephone: '(+235) 66 23 51 18',
  sita: 'NDJKOXH',
  email1: 'thsops@yahoo.fr',
  email2: 'operation@ths-aero.com'
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

function formatHeure(date) {
  if (!date) return '-';
  const d = new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}H${m}`;
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateComplete(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getOrigineColor(origine) {
  switch (origine) {
    case 'PROGRAMME': return COLORS.BLACK;
    case 'HORS_PROGRAMME': return COLORS.RED;
    case 'AJUSTEMENT': return COLORS.ORANGE;
    default: return COLORS.BLACK;
  }
}

function getOrigineLabel(origine) {
  switch (origine) {
    case 'PROGRAMME': return '';
    case 'HORS_PROGRAMME': return 'HP';
    case 'AJUSTEMENT': return 'AJ';
    default: return '';
  }
}

function getStatutColor(statut) {
  switch (statut) {
    case 'PREVU': return COLORS.BLACK;
    case 'CONFIRME': return COLORS.GREEN;
    case 'MODIFIE': return COLORS.ORANGE;
    case 'ANNULE': return COLORS.RED;
    default: return COLORS.BLACK;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE GENERATEUR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generateur PDF pour les Bulletins de Mouvement
 *
 * @extends DocumentGenerator
 */
export class BulletinMouvementGenerator extends DocumentGenerator {
  constructor(options = {}) {
    super(DOCUMENT_TYPES.BULLETIN_MOUVEMENT, options);
    this.thsConfig = { ...CONFIG_THS, ...options.thsConfig };
  }

  /**
   * Recupere les donnees necessaires depuis MongoDB
   * @param {string} bulletinId - ID du bulletin
   * @returns {Promise<{entity: Object, data: Object}>}
   */
  async fetchData(bulletinId) {
    const bulletin = await BulletinMouvement.findById(bulletinId)
      .populate('programmeVolSource', 'nom')
      .populate('creePar', 'nom prenom')
      .populate('publiePar', 'nom prenom');

    if (!bulletin) {
      throw new Error('Bulletin non trouve');
    }

    // Grouper les mouvements par jour
    const mouvementsParJour = {};
    const dateDebut = new Date(bulletin.dateDebut);
    const dateFin = new Date(bulletin.dateFin);

    for (let date = new Date(dateDebut); date <= dateFin; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      mouvementsParJour[dateKey] = bulletin.getMouvementsParJour(date);
    }

    return {
      entity: bulletin,
      data: { mouvementsParJour }
    };
  }

  /**
   * Construit la definition du document pdfmake
   * @param {Object} bulletin - Entite bulletin
   * @param {Object} data - Donnees (mouvementsParJour)
   * @returns {Object} Definition pdfmake
   */
  buildDocumentDefinition(bulletin, data) {
    const { mouvementsParJour } = data;
    const cfg = this.thsConfig;

    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [15, 15, 15, 30],

      defaultStyle: {
        font: 'DejaVuSans',
        fontSize: 7
      },

      styles: {
        headerInstitution: {
          fontSize: 7,
          lineHeight: 1.1
        },
        mainTitle: {
          fontSize: 11,
          bold: true,
          alignment: 'center'
        },
        subTitle: {
          fontSize: 9,
          alignment: 'center'
        },
        tableHeader: {
          bold: true,
          fontSize: 6.5,
          fillColor: COLORS.GRAY_HEADER,
          color: COLORS.BLUE
        },
        dayHeader: {
          bold: true,
          fontSize: 8,
          fillColor: COLORS.GRAY_LIGHT,
          color: COLORS.BLUE
        },
        legend: {
          fontSize: 6,
          lineHeight: 1.1
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
                { text: `Tel. ${cfg.telephone} - SITA: ${cfg.sita}`, style: 'headerInstitution' }
              ]
            },
            {
              width: '40%',
              stack: [
                { text: `Bulletin: ${bulletin.numeroBulletin}`, alignment: 'right', bold: true, fontSize: 8 },
                { text: `Escale: ${bulletin.escale}`, alignment: 'right', fontSize: 7 },
                { text: `Statut: ${bulletin.statut}`, alignment: 'right', fontSize: 7, color: bulletin.statut === 'PUBLIE' ? COLORS.GREEN : COLORS.BLACK }
              ]
            }
          ],
          margin: [0, 0, 0, 5]
        },

        // TITRE PRINCIPAL
        {
          text: `BULLETIN DE MOUVEMENT - SEMAINE ${bulletin.semaine}/${bulletin.annee}`,
          style: 'mainTitle',
          margin: [0, 2, 0, 2]
        },

        // SOUS-TITRE PERIODE
        {
          text: `Du ${formatDateComplete(bulletin.dateDebut)} au ${formatDateComplete(bulletin.dateFin)}`,
          style: 'subTitle',
          margin: [0, 0, 0, 5]
        },

        // STATISTIQUES
        {
          columns: [
            {
              width: '33%',
              text: `Total mouvements: ${bulletin.nombreMouvements}`,
              fontSize: 7
            },
            {
              width: '33%',
              text: `Programme: ${bulletin.nombreMouvementsProgramme}`,
              fontSize: 7,
              alignment: 'center'
            },
            {
              width: '33%',
              text: [
                { text: `Hors programme: ${bulletin.nombreMouvementsHorsProgramme}`, color: COLORS.RED }
              ],
              fontSize: 7,
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 5]
        },

        // TABLEAU DES MOUVEMENTS
        ...this._buildDaysContent(mouvementsParJour),

        // LEGENDE
        {
          margin: [0, 8, 0, 0],
          stack: [
            {
              text: [
                { text: 'Legende: ', bold: true },
                { text: 'HP', color: COLORS.RED, bold: true },
                { text: ' = Hors Programme | ' },
                { text: 'AJ', color: COLORS.ORANGE, bold: true },
                { text: ' = Ajustement | ' },
                { text: 'ANNULE', color: COLORS.RED },
                { text: ' = Vol annule' }
              ],
              style: 'legend'
            },
            {
              text: `Programme source: ${bulletin.programmeVolSource?.nom || 'N/A'}`,
              style: 'legend',
              margin: [0, 2, 0, 0]
            }
          ]
        }
      ],

      footer: (currentPage, pageCount) => {
        return {
          columns: [
            {
              text: `Publie le: ${bulletin.datePublication ? formatDateComplete(bulletin.datePublication) : 'Non publie'}`,
              fontSize: 6,
              margin: [15, 0, 0, 0]
            },
            {
              text: `Page ${currentPage}/${pageCount}`,
              alignment: 'center',
              fontSize: 6
            },
            {
              text: `${cfg.email1}`,
              alignment: 'right',
              fontSize: 6,
              margin: [0, 0, 15, 0]
            }
          ],
          margin: [0, 5, 0, 0]
        };
      }
    };
  }

  /**
   * Construit le contenu pour chaque jour
   * @private
   */
  _buildDaysContent(mouvementsParJour) {
    const content = [];

    Object.keys(mouvementsParJour).sort().forEach((dateKey, index) => {
      const mouvements = mouvementsParJour[dateKey];
      const date = new Date(dateKey);
      const jourNom = JOURS_SEMAINE[date.getDay()];

      // En-tete du jour
      content.push({
        text: `${jourNom} ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
        style: 'dayHeader',
        margin: [0, index > 0 ? 6 : 0, 0, 2]
      });

      if (mouvements.length === 0) {
        content.push({
          text: 'Aucun mouvement prevu',
          fontSize: 7,
          italics: true,
          color: COLORS.GRAY_BORDER,
          margin: [10, 2, 0, 2]
        });
      } else {
        // Tableau des mouvements
        content.push({
          table: {
            headerRows: 1,
            widths: [8, 50, 30, 50, 50, 35, 35, 50, '*'],
            body: this._buildTableBody(mouvements)
          },
          layout: {
            hLineWidth: function() { return 0.3; },
            vLineWidth: function() { return 0.3; },
            hLineColor: function() { return COLORS.GRAY_BORDER; },
            vLineColor: function() { return COLORS.GRAY_BORDER; },
            paddingLeft: function() { return 2; },
            paddingRight: function() { return 2; },
            paddingTop: function() { return 1; },
            paddingBottom: function() { return 1; }
          }
        });
      }
    });

    return content;
  }

  /**
   * Construit le corps du tableau des mouvements
   * @private
   */
  _buildTableBody(mouvements) {
    const body = [];

    // En-tete
    body.push([
      { text: '', style: 'tableHeader' },
      { text: 'N VOL', style: 'tableHeader', alignment: 'center' },
      { text: 'CIE', style: 'tableHeader', alignment: 'center' },
      { text: 'PROVENANCE', style: 'tableHeader', alignment: 'center' },
      { text: 'DESTINATION', style: 'tableHeader', alignment: 'center' },
      { text: 'ARR', style: 'tableHeader', alignment: 'center' },
      { text: 'DEP', style: 'tableHeader', alignment: 'center' },
      { text: 'TYPE', style: 'tableHeader', alignment: 'center' },
      { text: 'REMARQUES', style: 'tableHeader', alignment: 'center' }
    ]);

    // Lignes
    mouvements.forEach(mvt => {
      const origineLabel = getOrigineLabel(mvt.origine);
      const origineColor = getOrigineColor(mvt.origine);
      const statutColor = getStatutColor(mvt.statutMouvement);

      body.push([
        // Origine (HP, AJ)
        {
          text: origineLabel,
          alignment: 'center',
          fontSize: 5,
          bold: true,
          color: origineColor
        },
        // Numero de vol
        {
          text: mvt.numeroVol || '-',
          alignment: 'center',
          fontSize: 6.5,
          color: statutColor,
          decoration: mvt.statutMouvement === 'ANNULE' ? 'lineThrough' : null
        },
        // Compagnie
        {
          text: mvt.codeCompagnie || '-',
          alignment: 'center',
          fontSize: 6.5
        },
        // Provenance
        {
          text: mvt.provenance || '-',
          alignment: 'center',
          fontSize: 6.5,
          bold: true
        },
        // Destination
        {
          text: mvt.destination || '-',
          alignment: 'center',
          fontSize: 6.5,
          bold: true
        },
        // Heure arrivee
        {
          text: formatHeure(mvt.heureArriveePrevue),
          alignment: 'center',
          fontSize: 6.5,
          color: COLORS.BLUE,
          bold: true
        },
        // Heure depart
        {
          text: formatHeure(mvt.heureDepartPrevue),
          alignment: 'center',
          fontSize: 6.5,
          color: COLORS.BLUE,
          bold: true
        },
        // Type avion
        {
          text: mvt.typeAvion || '-',
          alignment: 'center',
          fontSize: 6
        },
        // Remarques
        {
          text: this._buildRemarques(mvt),
          alignment: 'left',
          fontSize: 5.5,
          color: mvt.statutMouvement === 'ANNULE' ? COLORS.RED : COLORS.BLACK
        }
      ]);
    });

    return body;
  }

  /**
   * Construit le texte des remarques
   * @private
   */
  _buildRemarques(mvt) {
    const parts = [];

    if (mvt.origine === 'HORS_PROGRAMME' && mvt.typeHorsProgramme) {
      parts.push(`[${mvt.typeHorsProgramme}]`);
    }

    if (mvt.raisonHorsProgramme) {
      parts.push(mvt.raisonHorsProgramme);
    }

    if (mvt.statutMouvement === 'ANNULE') {
      parts.push('ANNULE');
    }

    if (mvt.remarques) {
      parts.push(mvt.remarques);
    }

    return parts.join(' - ');
  }

  /**
   * Retourne les donnees d'apercu formatees
   * @param {string} bulletinId - ID du bulletin
   * @returns {Promise<Object>}
   */
  async getPreviewData(bulletinId) {
    const { entity: bulletin, data } = await this.fetchData(bulletinId);
    const { mouvementsParJour } = data;

    // Formater les mouvements pour l'apercu
    const mouvementsFormates = {};
    Object.keys(mouvementsParJour).forEach(dateKey => {
      mouvementsFormates[dateKey] = mouvementsParJour[dateKey].map(mvt => ({
        numeroVol: mvt.numeroVol,
        codeCompagnie: mvt.codeCompagnie || '-',
        provenance: mvt.provenance || '-',
        destination: mvt.destination || '-',
        heureArrivee: formatHeure(mvt.heureArriveePrevue),
        heureDepart: formatHeure(mvt.heureDepartPrevue),
        typeAvion: mvt.typeAvion || '-',
        origine: mvt.origine,
        statutMouvement: mvt.statutMouvement,
        remarques: mvt.remarques || ''
      }));
    });

    return {
      documentType: this.documentType,
      label: this.config.label,
      filename: this.getFilename(bulletin),
      folderPath: this.getFolderPath(bulletin),
      bulletin: {
        id: bulletin._id,
        numeroBulletin: bulletin.numeroBulletin,
        escale: bulletin.escale,
        semaine: bulletin.semaine,
        annee: bulletin.annee,
        dateDebut: bulletin.dateDebut,
        dateFin: bulletin.dateFin,
        statut: bulletin.statut,
        nombreMouvements: bulletin.nombreMouvements,
        nombreMouvementsProgramme: bulletin.nombreMouvementsProgramme,
        nombreMouvementsHorsProgramme: bulletin.nombreMouvementsHorsProgramme,
        compagnies: bulletin.compagnies,
        archivage: bulletin.archivage
      },
      mouvementsParJour: mouvementsFormates,
      config: this.thsConfig
    };
  }
}

export default BulletinMouvementGenerator;
