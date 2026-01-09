// ✅ COPIÉ DEPUIS MAGASIN : Service de génération PDF avec pdfmake
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import fs from 'fs';
import path from 'path';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// ✅ ADAPTÉ POUR CRV : Charger le logo de l'organisation
const getLogoBase64 = () => {
  try {
    // À personnaliser selon le logo de votre organisation
    const logoPath = path.resolve('assets/images/logo.png');
    const imageBuffer = fs.readFileSync(logoPath);
    return 'data:image/png;base64,' + imageBuffer.toString('base64');
  } catch (error) {
    console.warn('Logo non trouvé, utilisation du placeholder:', error.message);
    return null;
  }
};

// Définition des constantes
const COLORS = {
  primary: '#333333',
  secondary: '#777777',
  light: '#EEEEEE',
  border: '#DDDDDD'
};

const CONFIGS = {
  PAGE_MARGINS: [40, 40, 40, 60]
};

const formatNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const convertirNombreEnLettres = (nombre) => {
  const unite = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const dix = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const dizaine = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

  const convertirGroupe = (n) => {
    let resultat = "";

    if (n >= 1000000000) {
      const milliards = Math.floor(n / 1000000000);
      if (milliards === 1) resultat += "un milliard ";
      else resultat += convertirGroupe(milliards) + " milliards ";
      n = n % 1000000000;
      if (n > 0) resultat += convertirGroupe(n);
      return resultat.trim();
    }

    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      if (millions === 1) resultat += "un million ";
      else resultat += convertirGroupe(millions) + " millions ";
      n = n % 1000000;
      if (n > 0) resultat += convertirGroupe(n);
      return resultat.trim();
    }

    if (n >= 1000) {
      const milliers = Math.floor(n / 1000);
      if (milliers === 1) resultat += "mille ";
      else resultat += convertirGroupe(milliers) + " mille ";
      n = n % 1000;
      if (n > 0) resultat += convertirGroupe(n);
      return resultat.trim();
    }

    if (n >= 100) {
      const centaines = Math.floor(n / 100);
      if (centaines === 1) resultat += "cent ";
      else resultat += unite[centaines] + " cent ";
      n = n % 100;
      if (n > 0) resultat += convertirGroupe(n);
      return resultat.trim();
    }

    if (n >= 20) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      resultat += dizaine[d];
      if (u > 0) {
        if (d === 7 || d === 9) {
          resultat = resultat.slice(0, -1) + "-" + dix[u];
        } else {
          resultat += "-" + unite[u];
        }
      }
      return resultat;
    }

    if (n >= 10) return dix[n - 10];
    return unite[n];
  };

  if (nombre === 0) return "zéro";
  return convertirGroupe(nombre);
};

// ✅ ADAPTÉ POUR CRV : En-tête avec logo et nom de l'organisation
const createHeader = (organizationName = 'ORGANISATION', organizationSubname = '') => {
  const logoBase64 = getLogoBase64();

  return [
    {
      columns: [
        {
          width: 'auto',
          stack: [
            logoBase64 ? {
              image: logoBase64,
              width: 50,
              height: 50,
              alignment: 'left'
            } : {
              // Fallback si logo non disponible
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 50,
                  h: 50,
                  color: COLORS.light,
                  r: 4
                }
              ]
            }
          ]
        },
        {
          stack: [
            {
              text: organizationName,
              style: 'companyName',
              margin: [15, 5, 0, 0]
            },
            organizationSubname ? {
              text: organizationSubname,
              style: 'companySubName',
              margin: [15, 2, 0, 0]
            } : {}
          ]
        }
      ],
      margin: [0, 0, 0, 15]
    },
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: COLORS.border
        }
      ],
      margin: [0, 0, 0, 15]
    }
  ];
};

// Styles par défaut réutilisables
const DEFAULT_STYLES = {
  companyName: {
    fontSize: 16,
    bold: true,
    color: COLORS.primary
  },
  companySubName: {
    fontSize: 12,
    color: COLORS.secondary
  },
  companyDept: {
    fontSize: 10,
    color: COLORS.secondary,
    italics: true
  },
  docTitle: {
    fontSize: 14,
    bold: true,
    color: COLORS.primary
  },
  docNumber: {
    fontSize: 11,
    color: COLORS.secondary
  },
  sectionHeader: {
    fontSize: 11,
    bold: true,
    color: COLORS.primary,
    margin: [0, 10, 0, 5]
  },
  tableHeader: {
    fontSize: 9,
    bold: true,
    color: COLORS.primary,
    fillColor: COLORS.light,
    margin: [5, 7]
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.primary,
    margin: [5, 5]
  },
  tableCellRight: {
    fontSize: 9,
    color: COLORS.primary,
    alignment: 'right',
    margin: [5, 5]
  },
  tableCellCenter: {
    fontSize: 9,
    color: COLORS.primary,
    alignment: 'center',
    margin: [5, 5]
  },
  footer: {
    fontSize: 8,
    color: COLORS.secondary
  }
};

/**
 * ✅ FONCTION GÉNÉRIQUE : Génération de PDF CRV
 * À personnaliser selon les besoins spécifiques du CRV
 *
 * @param {Object} crv - Objet CRV complet avec toutes les données
 * @param {Object} options - Options de génération (organizationName, etc.)
 * @returns {Promise<Buffer>} Buffer du PDF généré
 */
export const generateCRVPDF = (crv, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        organizationName = 'ORGANISATION',
        organizationSubname = '',
        documentTitle = 'COMPTE RENDU DE VOL'
      } = options;

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: CONFIGS.PAGE_MARGINS,
        footer: function(currentPage, pageCount) {
          return {
            columns: [
              {
                text: crv.numero_crv || 'CRV-XXX',
                style: 'footer',
                alignment: 'left',
                margin: [40, 0]
              },
              {
                text: 'Page ' + currentPage + '/' + pageCount,
                style: 'footer',
                alignment: 'right',
                margin: [0, 0, 40, 0]
              }
            ],
            margin: [0, 20]
          };
        },
        content: [
          ...createHeader(organizationName, organizationSubname),
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'INFORMATIONS MISSION', style: 'sectionHeader' }
                  // TODO: Ajouter les détails de la mission
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: documentTitle, style: 'docTitle', alignment: 'right' },
                  {
                    text: crv.numero_crv || 'N/A',
                    style: 'docNumber',
                    alignment: 'right'
                  },
                  {
                    text: 'Date : ' + new Date(crv.date_creation || Date.now()).toLocaleDateString('fr-FR'),
                    style: 'docNumber',
                    alignment: 'right',
                    margin: [0, 5, 0, 0]
                  }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },
          // TODO: Ajouter les sections spécifiques au CRV
          // - Informations vol (départ, arrivée, heures)
          // - Équipage
          // - Observations
          // - Incidents éventuels
          // - Signatures
          {
            text: 'CONTENU À PERSONNALISER',
            style: 'sectionHeader',
            alignment: 'center',
            margin: [0, 50, 0, 0]
          },
          {
            text: 'Cette fonction doit être adaptée selon la structure exacte du CRV',
            style: 'tableCell',
            alignment: 'center',
            italics: true
          }
        ],
        styles: DEFAULT_STYLES
      };

      pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
        resolve(Buffer.from(buffer));
      });
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateCRVPDF,
  formatNumber,
  convertirNombreEnLettres,
  createHeader,
  COLORS,
  DEFAULT_STYLES
};
