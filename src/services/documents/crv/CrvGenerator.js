// ============================================
// GÉNÉRATEUR PDF - COMPTE RENDU DE VOL (CRV)
// ============================================
// Génère le PDF officiel du CRV avec toutes les sections :
// - Informations vol
// - Personnel affecté
// - Matériel utilisé
// - Chronologie/Phases
// - Observations

import { DocumentGenerator } from '../base/DocumentGenerator.js';
import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import CRV from '../../../models/crv/CRV.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  PRIMARY: '#1a365d',      // Bleu foncé
  SECONDARY: '#2c5282',    // Bleu moyen
  ACCENT: '#3182ce',       // Bleu clair
  SUCCESS: '#276749',      // Vert
  WARNING: '#c05621',      // Orange
  DANGER: '#c53030',       // Rouge
  GRAY_DARK: '#2d3748',
  GRAY_MEDIUM: '#718096',
  GRAY_LIGHT: '#e2e8f0',
  WHITE: '#ffffff',
  BLACK: '#000000'
};

const CONFIG_THS = {
  organisation: 'TCHAD HANDLING SERVICES',
  departement: 'SERVICE DES OPERATIONS',
  adresse: 'Aéroport International Hassan Djamous - N\'Djamena',
  telephone: '(+235) 66 23 51 18',
  email: 'operation@ths-aero.com',
  sita: 'NDJKOXH'
};

const FONCTIONS_LABELS = {
  'CHEF_ESCALE': 'Chef d\'escale',
  'AGENT_TRAFIC': 'Agent trafic',
  'AGENT_PISTE': 'Agent piste',
  'AGENT_PASSAGE': 'Agent passage',
  'MANUTENTIONNAIRE': 'Manutentionnaire',
  'CHAUFFEUR': 'Chauffeur',
  'AGENT_SECURITE': 'Agent sécurité',
  'TECHNICIEN': 'Technicien',
  'SUPERVISEUR': 'Superviseur',
  'COORDINATEUR': 'Coordinateur',
  'AUTRE': 'Autre'
};

const ENGINS_LABELS = {
  'TRACTEUR_PUSHBACK': 'Tracteur Pushback',
  'PASSERELLE': 'Passerelle',
  'TAPIS_BAGAGES': 'Tapis bagages',
  'GPU': 'GPU',
  'ASU': 'ASU',
  'ESCALIER': 'Escalier',
  'TRANSBORDEUR': 'Transbordeur',
  'CAMION_AVITAILLEMENT': 'Camion avitaillement',
  'CAMION_VIDANGE': 'Camion vidange',
  'CAMION_EAU': 'Camion eau',
  'ELEVATEUR': 'Élévateur',
  'CHARIOT_BAGAGES': 'Chariot bagages',
  'CONTENEUR_ULD': 'Conteneur ULD',
  'DOLLY': 'Dolly',
  'AUTRE': 'Autre'
};

const STATUT_LABELS = {
  'BROUILLON': 'Brouillon',
  'EN_COURS': 'En cours',
  'TERMINE': 'Terminé',
  'VALIDE': 'Validé',
  'VERROUILLE': 'Verrouillé',
  'ANNULE': 'Annulé'
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatHeure(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE GÉNÉRATEUR
// ═══════════════════════════════════════════════════════════════════════════

export class CrvGenerator extends DocumentGenerator {
  constructor(options = {}) {
    super(DOCUMENT_TYPES.CRV, options);
    this.thsConfig = { ...CONFIG_THS, ...options.thsConfig };
  }

  /**
   * Récupère les données du CRV depuis MongoDB
   */
  async fetchData(crvId) {
    const crv = await CRV.findById(crvId)
      .populate('vol')
      .populate('creePar', 'nom prenom')
      .populate('responsableVol', 'nom prenom')
      .populate('verrouillePar', 'nom prenom')
      .populate('archivage.archivedBy', 'nom prenom');

    if (!crv) {
      throw new Error('CRV non trouvé');
    }

    return {
      entity: crv,
      data: {
        vol: crv.vol,
        personnel: crv.personnelAffecte || [],
        materiel: crv.materielUtilise || []
      }
    };
  }

  /**
   * Construit la définition du document PDF
   */
  buildDocumentDefinition(crv, data) {
    const { vol, personnel, materiel } = data;

    return {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [30, 30, 30, 50],

      defaultStyle: {
        font: 'DejaVuSans',
        fontSize: 9
      },

      styles: this._getStyles(),

      header: this._buildHeader(crv, vol),

      footer: (currentPage, pageCount) => this._buildFooter(crv, currentPage, pageCount),

      content: [
        // Titre
        this._buildTitle(crv),

        // Infos vol
        this._buildVolInfo(crv, vol),

        // Statut et dates
        this._buildStatutInfo(crv),

        // Personnel affecté
        this._buildPersonnelSection(personnel),

        // Matériel utilisé
        this._buildMaterielSection(materiel),

        // Signature
        this._buildSignature(crv)
      ]
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTIONS DU DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════

  _getStyles() {
    return {
      header: {
        fontSize: 10,
        color: COLORS.GRAY_MEDIUM
      },
      title: {
        fontSize: 16,
        bold: true,
        color: COLORS.PRIMARY,
        alignment: 'center'
      },
      subtitle: {
        fontSize: 11,
        color: COLORS.SECONDARY,
        alignment: 'center'
      },
      sectionTitle: {
        fontSize: 11,
        bold: true,
        color: COLORS.PRIMARY,
        margin: [0, 15, 0, 8],
        fillColor: COLORS.GRAY_LIGHT,
        padding: 5
      },
      label: {
        fontSize: 8,
        color: COLORS.GRAY_MEDIUM,
        bold: true
      },
      value: {
        fontSize: 9,
        color: COLORS.BLACK
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: COLORS.WHITE,
        fillColor: COLORS.PRIMARY,
        alignment: 'center'
      },
      tableCell: {
        fontSize: 8,
        color: COLORS.BLACK,
        alignment: 'center'
      },
      footer: {
        fontSize: 7,
        color: COLORS.GRAY_MEDIUM
      }
    };
  }

  _buildHeader(crv, vol) {
    return {
      columns: [
        {
          width: '50%',
          stack: [
            { text: this.thsConfig.organisation, fontSize: 10, bold: true, color: COLORS.PRIMARY },
            { text: this.thsConfig.departement, fontSize: 8, color: COLORS.GRAY_MEDIUM }
          ],
          margin: [30, 15, 0, 0]
        },
        {
          width: '50%',
          stack: [
            { text: crv.numeroCRV || 'N/A', fontSize: 10, bold: true, alignment: 'right', color: COLORS.PRIMARY },
            { text: `Escale: ${crv.escale || 'N/A'}`, fontSize: 8, alignment: 'right', color: COLORS.GRAY_MEDIUM }
          ],
          margin: [0, 15, 30, 0]
        }
      ]
    };
  }

  _buildFooter(crv, currentPage, pageCount) {
    return {
      columns: [
        {
          text: `${this.thsConfig.organisation} - ${this.thsConfig.telephone}`,
          style: 'footer',
          margin: [30, 0, 0, 0]
        },
        {
          text: `${crv.numeroCRV} - Page ${currentPage}/${pageCount}`,
          style: 'footer',
          alignment: 'right',
          margin: [0, 0, 30, 0]
        }
      ],
      margin: [0, 20, 0, 0]
    };
  }

  _buildTitle(crv) {
    return {
      stack: [
        { text: 'COMPTE RENDU DE VOL', style: 'title', margin: [0, 20, 0, 5] },
        { text: crv.numeroCRV || '', style: 'subtitle', margin: [0, 0, 0, 15] },
        {
          canvas: [{
            type: 'line',
            x1: 0, y1: 0,
            x2: 535, y2: 0,
            lineWidth: 1,
            lineColor: COLORS.GRAY_LIGHT
          }]
        }
      ]
    };
  }

  _buildVolInfo(crv, vol) {
    const volData = vol || {};

    return {
      stack: [
        { text: 'INFORMATIONS VOL', style: 'sectionTitle' },
        {
          columns: [
            {
              width: '50%',
              table: {
                widths: ['40%', '60%'],
                body: [
                  [{ text: 'N° Vol', style: 'label' }, { text: volData.numeroVol || '-', style: 'value' }],
                  [{ text: 'Compagnie', style: 'label' }, { text: volData.compagnieAerienne || '-', style: 'value' }],
                  [{ text: 'Code IATA', style: 'label' }, { text: volData.codeIATA || '-', style: 'value' }],
                  [{ text: 'Type opération', style: 'label' }, { text: volData.typeOperation || '-', style: 'value' }]
                ]
              },
              layout: 'noBorders'
            },
            {
              width: '50%',
              table: {
                widths: ['40%', '60%'],
                body: [
                  [{ text: 'Date vol', style: 'label' }, { text: formatDate(volData.dateVol), style: 'value' }],
                  [{ text: 'Origine', style: 'label' }, { text: volData.aeroportOrigine || '-', style: 'value' }],
                  [{ text: 'Destination', style: 'label' }, { text: volData.aeroportDestination || '-', style: 'value' }],
                  [{ text: 'Escale CRV', style: 'label' }, { text: crv.escale || '-', style: 'value', bold: true }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        }
      ]
    };
  }

  _buildStatutInfo(crv) {
    const statutColor = crv.statut === 'VALIDE' || crv.statut === 'VERROUILLE' ? COLORS.SUCCESS :
                       crv.statut === 'ANNULE' ? COLORS.DANGER :
                       crv.statut === 'EN_COURS' ? COLORS.WARNING : COLORS.GRAY_MEDIUM;

    return {
      stack: [
        { text: 'STATUT ET SUIVI', style: 'sectionTitle' },
        {
          columns: [
            {
              width: '33%',
              table: {
                widths: ['100%'],
                body: [
                  [{ text: 'Statut', style: 'label', alignment: 'center' }],
                  [{ text: STATUT_LABELS[crv.statut] || crv.statut, fontSize: 11, bold: true, color: statutColor, alignment: 'center' }]
                ]
              },
              layout: 'noBorders'
            },
            {
              width: '33%',
              table: {
                widths: ['100%'],
                body: [
                  [{ text: 'Complétude', style: 'label', alignment: 'center' }],
                  [{ text: `${crv.completude || 0}%`, fontSize: 11, bold: true, color: COLORS.ACCENT, alignment: 'center' }]
                ]
              },
              layout: 'noBorders'
            },
            {
              width: '33%',
              table: {
                widths: ['100%'],
                body: [
                  [{ text: 'Création', style: 'label', alignment: 'center' }],
                  [{ text: formatDate(crv.dateCreation), fontSize: 9, alignment: 'center' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        }
      ]
    };
  }

  _buildPersonnelSection(personnel) {
    if (!personnel || personnel.length === 0) {
      return {
        stack: [
          { text: 'PERSONNEL AFFECTÉ', style: 'sectionTitle' },
          { text: 'Aucun personnel affecté', italics: true, color: COLORS.GRAY_MEDIUM, margin: [0, 0, 0, 10] }
        ]
      };
    }

    const tableBody = [
      [
        { text: 'Nom', style: 'tableHeader' },
        { text: 'Prénom', style: 'tableHeader' },
        { text: 'Fonction', style: 'tableHeader' },
        { text: 'Matricule', style: 'tableHeader' },
        { text: 'Remarques', style: 'tableHeader' }
      ]
    ];

    personnel.forEach(p => {
      tableBody.push([
        { text: p.nom || '-', style: 'tableCell' },
        { text: p.prenom || '-', style: 'tableCell' },
        { text: FONCTIONS_LABELS[p.fonction] || p.fonction || '-', style: 'tableCell' },
        { text: p.matricule || '-', style: 'tableCell' },
        { text: p.remarques || '-', style: 'tableCell', alignment: 'left' }
      ]);
    });

    return {
      stack: [
        { text: 'PERSONNEL AFFECTÉ', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['18%', '18%', '22%', '15%', '27%'],
            body: tableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => COLORS.GRAY_LIGHT,
            vLineColor: () => COLORS.GRAY_LIGHT
          }
        }
      ]
    };
  }

  _buildMaterielSection(materiel) {
    if (!materiel || materiel.length === 0) {
      return {
        stack: [
          { text: 'MATÉRIEL UTILISÉ', style: 'sectionTitle' },
          { text: 'Aucun matériel enregistré', italics: true, color: COLORS.GRAY_MEDIUM, margin: [0, 0, 0, 10] }
        ]
      };
    }

    const tableBody = [
      [
        { text: 'Type', style: 'tableHeader' },
        { text: 'Identifiant', style: 'tableHeader' },
        { text: 'Début', style: 'tableHeader' },
        { text: 'Fin', style: 'tableHeader' },
        { text: 'Opérateur', style: 'tableHeader' }
      ]
    ];

    materiel.forEach(m => {
      tableBody.push([
        { text: ENGINS_LABELS[m.typeEngin] || m.typeEngin || '-', style: 'tableCell' },
        { text: m.identifiant || '-', style: 'tableCell' },
        { text: formatHeure(m.heureDebutUtilisation), style: 'tableCell' },
        { text: formatHeure(m.heureFinUtilisation), style: 'tableCell' },
        { text: m.operateur || '-', style: 'tableCell' }
      ]);
    });

    return {
      stack: [
        { text: 'MATÉRIEL UTILISÉ', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '20%', '15%', '15%', '25%'],
            body: tableBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => COLORS.GRAY_LIGHT,
            vLineColor: () => COLORS.GRAY_LIGHT
          }
        }
      ]
    };
  }

  _buildSignature(crv) {
    const responsable = crv.responsableVol;
    const responsableNom = responsable ? `${responsable.prenom || ''} ${responsable.nom || ''}`.trim() : '-';

    return {
      stack: [
        { text: '', margin: [0, 30, 0, 0] },
        {
          columns: [
            { width: '50%', text: '' },
            {
              width: '50%',
              stack: [
                { text: 'Le Responsable du Vol', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 5] },
                { text: responsableNom, fontSize: 10, bold: true, alignment: 'center' },
                { text: '', margin: [0, 30, 0, 0] },
                {
                  canvas: [{
                    type: 'line',
                    x1: 50, y1: 0,
                    x2: 200, y2: 0,
                    lineWidth: 0.5,
                    lineColor: COLORS.GRAY_MEDIUM
                  }]
                },
                { text: 'Signature', fontSize: 7, color: COLORS.GRAY_MEDIUM, alignment: 'center', margin: [0, 2, 0, 0] }
              ]
            }
          ]
        },
        {
          text: `Document généré le ${formatDateTime(new Date())}`,
          fontSize: 7,
          color: COLORS.GRAY_MEDIUM,
          alignment: 'center',
          margin: [0, 30, 0, 0]
        }
      ]
    };
  }

  /**
   * Retourne les données d'aperçu
   */
  async getPreviewData(crvId) {
    const { entity: crv, data } = await this.fetchData(crvId);

    return {
      documentType: this.documentType,
      label: this.config.label,
      filename: this.getFilename(crv),
      folderPath: this.getFolderPath(crv),
      crv: {
        id: crv._id,
        numeroCRV: crv.numeroCRV,
        escale: crv.escale,
        statut: crv.statut,
        completude: crv.completude,
        dateCreation: crv.dateCreation,
        archivage: crv.archivage
      },
      vol: data.vol ? {
        numeroVol: data.vol.numeroVol,
        compagnie: data.vol.compagnieAerienne,
        dateVol: data.vol.dateVol,
        typeOperation: data.vol.typeOperation
      } : null,
      personnelCount: data.personnel.length,
      materielCount: data.materiel.length
    };
  }
}

export default CrvGenerator;
