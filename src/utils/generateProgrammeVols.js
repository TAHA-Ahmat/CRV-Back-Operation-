/**
 * Generateur de Programme General des Vols - Format PDF Officiel
 * Tchad Handling Services - Service des Operations
 * Format A4 Paysage
 */

import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des polices
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

// Couleurs
const COLORS = {
  BLUE: '#0066CC',
  RED: '#CC0000',
  GREEN: '#006600',
  BLACK: '#000000',
  GRAY_LIGHT: '#E8E8E8',
  GRAY_HEADER: '#D0D0D0'
};

// Donnees des vols - Programme HIVER 2025-2026
const volsData = {
  LUNDI: [
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'MS885',
      typeAvion: 'B737-800',
      version: '24C120Y',
      provenance: 'CAI',
      arrivee: '11H30',
      destination: 'CAI',
      depart: '12H45',
      observations: 'Du 27 Oct. 25 au 29 Mars 26'
    },
    {
      numVol: 'ET3620',
      typeAvion: 'B777F',
      version: 'CARGO',
      provenance: 'ADD',
      arrivee: '14H00',
      destination: 'LOS',
      depart: '16H00',
      observations: 'CARGO - Du 28 Oct. 25 au 30 Mars 26 ②',
      isCargo: true
    }
  ],
  MARDI: [
    {
      numVol: 'TK044',
      typeAvion: 'A330-300',
      version: '28C261Y',
      provenance: 'IST',
      arrivee: '04H50',
      destination: 'IST',
      depart: '06H15',
      observations: 'Du 29 Oct. 25 au 28 Mars 26 - NIGHT STOP',
      nightStop: true
    },
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'AF904',
      typeAvion: 'A350-900',
      version: '34J291Y',
      provenance: 'CDG',
      arrivee: '23H45',
      destination: 'CDG',
      depart: '01H30+1',
      observations: 'Du 27 Oct. 25 au 29 Mars 26'
    }
  ],
  MERCREDI: [
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'MS2961',
      typeAvion: 'A330F',
      version: 'CARGO',
      provenance: 'CAI',
      arrivee: '12H00',
      destination: 'LOS',
      depart: '14H30',
      observations: 'CARGO - Horaires variables ①',
      isCargo: true
    },
    {
      numVol: 'KP039',
      typeAvion: 'B737-700',
      version: '12C108Y',
      provenance: 'DLA',
      arrivee: '15H00',
      destination: 'DLA',
      depart: '16H30',
      observations: 'Du 30 Oct. 25 au 25 Mars 26'
    }
  ],
  JEUDI: [
    {
      numVol: 'TK044',
      typeAvion: 'A330-300',
      version: '28C261Y',
      provenance: 'IST',
      arrivee: '04H50',
      destination: 'IST',
      depart: '06H15',
      observations: 'Du 29 Oct. 25 au 28 Mars 26 - NIGHT STOP',
      nightStop: true
    },
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'MS885',
      typeAvion: 'B737-800',
      version: '24C120Y',
      provenance: 'CAI',
      arrivee: '11H30',
      destination: 'CAI',
      depart: '12H45',
      observations: 'Du 27 Oct. 25 au 29 Mars 26'
    },
    {
      numVol: 'ET3620',
      typeAvion: 'B777F',
      version: 'CARGO',
      provenance: 'ADD',
      arrivee: '14H00',
      destination: 'LOS',
      depart: '16H00',
      observations: 'CARGO - Du 28 Oct. 25 au 30 Mars 26 ②',
      isCargo: true
    }
  ],
  VENDREDI: [
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'AF904',
      typeAvion: 'A350-900',
      version: '34J291Y',
      provenance: 'CDG',
      arrivee: '23H45',
      destination: 'CDG',
      depart: '01H30+1',
      observations: 'Du 27 Oct. 25 au 29 Mars 26'
    }
  ],
  SAMEDI: [
    {
      numVol: 'TK044',
      typeAvion: 'A330-300',
      version: '28C261Y',
      provenance: 'IST',
      arrivee: '04H50',
      destination: 'IST',
      depart: '06H15',
      observations: 'Du 29 Oct. 25 au 28 Mars 26 - NIGHT STOP',
      nightStop: true
    },
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'MS2961',
      typeAvion: 'A330F',
      version: 'CARGO',
      provenance: 'CAI',
      arrivee: '12H00',
      destination: 'ABJ',
      depart: '14H30',
      observations: 'CARGO - Horaires variables ①',
      isCargo: true
    }
  ],
  DIMANCHE: [
    {
      numVol: 'ET939',
      typeAvion: 'B737-800',
      version: '16C135Y',
      provenance: 'ADD',
      arrivee: '09H15',
      destination: 'ADD',
      depart: '10H25',
      observations: 'Du 26 Oct. 25 au 28 Mars 26'
    },
    {
      numVol: 'MS885',
      typeAvion: 'B737-800',
      version: '24C120Y',
      provenance: 'CAI',
      arrivee: '11H30',
      destination: 'CAI',
      depart: '12H45',
      observations: 'Du 27 Oct. 25 au 29 Mars 26'
    }
  ]
};

// Fonction pour construire les lignes du tableau
function buildTableBody() {
  const body = [];

  // En-tete du tableau
  body.push([
    { text: 'JOURS', style: 'tableHeader', alignment: 'center' },
    { text: 'N° VOL', style: 'tableHeader', alignment: 'center' },
    { text: 'Type d\'avion', style: 'tableHeader', alignment: 'center' },
    { text: 'VERSION', style: 'tableHeader', alignment: 'center' },
    { text: 'PROVENANCE', style: 'tableHeader', alignment: 'center' },
    { text: 'Arrivee', style: 'tableHeader', alignment: 'center' },
    { text: 'DESTINATION', style: 'tableHeader', alignment: 'center' },
    { text: 'Depart', style: 'tableHeader', alignment: 'center' },
    { text: 'OBSERVATIONS', style: 'tableHeader', alignment: 'center' }
  ]);

  const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

  jours.forEach((jour) => {
    const vols = volsData[jour] || [];

    vols.forEach((vol, index) => {
      const row = [];

      // Cellule jour (fusionnee verticalement)
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

      // Couleur pour les vols cargo
      const textColor = vol.isCargo ? COLORS.GREEN : COLORS.BLACK;
      const timeColor = COLORS.BLUE;

      row.push({ text: vol.numVol, alignment: 'center', color: textColor, bold: vol.isCargo });
      row.push({ text: vol.typeAvion, alignment: 'center', fontSize: 8 });
      row.push({ text: vol.version, alignment: 'center', fontSize: 8, color: vol.isCargo ? COLORS.GREEN : COLORS.BLACK });
      row.push({ text: vol.provenance, alignment: 'center', bold: true });
      row.push({ text: vol.arrivee, alignment: 'center', color: timeColor, bold: true });
      row.push({ text: vol.destination, alignment: 'center', bold: true });
      row.push({ text: vol.depart, alignment: 'center', color: timeColor, bold: true });

      // Observations avec mise en forme speciale
      let obsText = vol.observations;
      let obsColor = COLORS.BLACK;

      if (vol.nightStop) {
        obsColor = COLORS.RED;
      } else if (vol.isCargo) {
        obsColor = COLORS.GREEN;
      }

      row.push({
        text: obsText,
        alignment: 'left',
        fontSize: 7,
        color: obsColor
      });

      body.push(row);
    });
  });

  return body;
}

// Definition du document
function generateDocDefinition() {
  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [20, 20, 20, 30],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 9
    },
    styles: {
      headerLeft: {
        fontSize: 8,
        lineHeight: 1.2
      },
      headerRight: {
        fontSize: 10,
        color: COLORS.RED,
        bold: true,
        alignment: 'right'
      },
      mainTitle: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 5, 0, 5]
      },
      notes: {
        fontSize: 8,
        lineHeight: 1.3
      },
      notesBold: {
        fontSize: 8,
        bold: true
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        fillColor: COLORS.GRAY_HEADER,
        color: COLORS.BLUE
      },
      jourCell: {
        bold: true,
        fontSize: 9
      },
      footer: {
        fontSize: 7,
        alignment: 'center'
      }
    },
    content: [
      // En-tete
      {
        columns: [
          {
            width: '60%',
            stack: [
              { text: 'DIRECTION GENERALE', style: 'headerLeft', bold: true },
              { text: 'SERVICE DES OPERATIONS', style: 'headerLeft', bold: true },
              { text: 'Tchad Handling Services - Service des Operations', style: 'headerLeft' },
              { text: 'Tel. (+235) 66 23 51 18 - SITA: NDJKOXH', style: 'headerLeft' },
              { text: 'Email: thsops@yahoo.fr / operation@ths-aero.com', style: 'headerLeft' }
            ]
          },
          {
            width: '40%',
            text: 'EDITION N°01/17-dec.-25',
            style: 'headerRight'
          }
        ]
      },
      { text: '', margin: [0, 5, 0, 0] },

      // Notes introductives
      {
        stack: [
          { text: '> HORAIRES en heure locale', style: 'notes', color: COLORS.RED },
          { text: '> LE RESPONSABLE DES OPERATIONS', style: 'notes' },
          { text: '> Les vols locaux (PAM, RJM, AVMAX, MAF...) ne figurent pas sur ce programme (Vols a la demande).', style: 'notes' },
          { text: '> Les vols charters ou speciaux, si notifies, sont integres dans les bulletins de mouvement tous les lundis et jeudis ou transmis a travers les flash-info', style: 'notes' },
          { text: '', margin: [0, 2, 0, 0] },
          { text: 'ELHADJ M. SEIDNA', style: 'notesBold' },
          { text: '', margin: [0, 3, 0, 0] },
          {
            text: [
              { text: '① ', color: COLORS.RED },
              { text: 'Les horaires de vol Cargo Egyptair peuvent changer en fonction de disponibilites operationnelles et notifies par la compagnie' }
            ],
            style: 'notes'
          },
          {
            text: [
              { text: '② ', color: COLORS.RED },
              { text: 'Toute irregularite des vols cargos Ethiopian sera notifiee par la compagnie et diffusee a travers les flash-info' }
            ],
            style: 'notes'
          }
        ],
        margin: [0, 0, 0, 5]
      },

      // Titre principal
      {
        text: 'PROGRAMME GENERAL DES VOLS - HIVER_2025_2026',
        style: 'mainTitle'
      },

      // Tableau principal
      {
        table: {
          headerRows: 1,
          widths: [55, 45, 55, 50, 55, 40, 60, 40, '*'],
          body: buildTableBody()
        },
        layout: {
          hLineWidth: function(i, node) {
            return 0.5;
          },
          vLineWidth: function(i, node) {
            return 0.5;
          },
          hLineColor: function(i, node) {
            return '#666666';
          },
          vLineColor: function(i, node) {
            return '#666666';
          },
          paddingLeft: function(i, node) { return 3; },
          paddingRight: function(i, node) { return 3; },
          paddingTop: function(i, node) { return 2; },
          paddingBottom: function(i, node) { return 2; }
        }
      },

      // Rappel horaires
      {
        text: 'HORAIRES en heure locale',
        color: COLORS.RED,
        fontSize: 8,
        bold: true,
        margin: [0, 10, 0, 5]
      },

      // Responsable
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: 'LE RESPONSABLE DES OPERATIONS', alignment: 'right', fontSize: 8 },
              { text: 'ELHADJ M. SEIDNA', alignment: 'right', fontSize: 9, bold: true, margin: [0, 3, 0, 0] }
            ]
          }
        ]
      }
    ],
    footer: function(currentPage, pageCount) {
      return {
        text: 'Tchad Handling Services - Service des Operations - Tel. (+235) 66 23 51 18',
        alignment: 'center',
        fontSize: 7,
        margin: [20, 0, 20, 10]
      };
    }
  };
}

// Fonction principale de generation
async function generateProgrammeVolsPDF(outputPath = null) {
  const docDefinition = generateDocDefinition();
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  // Chemin de sortie par defaut
  if (!outputPath) {
    outputPath = path.join(__dirname, '../../exports/PROGRAMME_VOLS_HIVER_2025_2026.pdf');
  }

  // Creer le dossier exports s'il n'existe pas
  const exportDir = path.dirname(outputPath);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);

    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    writeStream.on('finish', () => {
      console.log(`PDF genere avec succes: ${outputPath}`);
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      console.error('Erreur lors de la generation du PDF:', err);
      reject(err);
    });
  });
}

// Export pour utilisation comme module
export { generateProgrammeVolsPDF, volsData };

// Execution directe
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateProgrammeVolsPDF()
    .then((path) => {
      console.log('Generation terminee!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Echec de la generation:', err);
      process.exit(1);
    });
}
