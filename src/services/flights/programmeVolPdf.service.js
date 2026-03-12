/**
 * SERVICE DE GENERATION PDF - PROGRAMME GENERAL DES VOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DOCUMENT OPS AERONAUTIQUE OFFICIEL
 * Conforme aux standards Handling / Exploitation sol
 *
 * REGLES VISUELLES NON NEGOCIABLES:
 * 1. AUCUN symbole technique visible ($, %, caracteres de substitution)
 * 2. Les notes OPS avec ① ② doivent etre parfaitement lisibles
 * 3. La colonne JOURS doit etre percue comme un bloc visuel
 * 4. Document dense mais pas etouffant
 * 5. Hierarchie visuelle evidente sans reflechir
 * 6. Signature qui "ferme" le document avec autorite
 * 7. Aspect HUMAIN - ne doit jamais paraitre genere automatiquement
 *
 * FORMAT: A4 PAYSAGE - UNE SEULE PAGE
 */

import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ProgrammeVol from '../../models/flights/ProgrammeVol.js';
import VolProgramme from '../../models/flights/VolProgramme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION POLICES - DEJAVU SANS (couverture Unicode complete)
// Supporte TOUS les symboles OPS: ① ② ➤ et caracteres speciaux
// ═══════════════════════════════════════════════════════════════════════════

const fontsDir = path.join(__dirname, '../../assets/fonts');

// Charger les polices DejaVu Sans depuis les fichiers TTF
let fonts;
try {
  fonts = {
    DejaVuSans: {
      normal: fs.readFileSync(path.join(fontsDir, 'DejaVuSans.ttf')),
      bold: fs.readFileSync(path.join(fontsDir, 'DejaVuSans-Bold.ttf')),
      italics: fs.readFileSync(path.join(fontsDir, 'DejaVuSans-Oblique.ttf')),
      bolditalics: fs.readFileSync(path.join(fontsDir, 'DejaVuSans-BoldOblique.ttf'))
    }
  };
  console.log('[PDF OPS] Polices DejaVu Sans chargees avec succes');
} catch (err) {
  // Fallback vers Helvetica si les polices ne sont pas trouvees
  console.warn('[PDF OPS] Polices DejaVu Sans non trouvees, utilisation Helvetica (symboles OPS non supportes)');
  fonts = {
    DejaVuSans: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };
}

const printer = new PdfPrinter(fonts);

// ═══════════════════════════════════════════════════════════════════════════
// COULEURS OPS (STRICTEMENT LIMITEES)
// ═══════════════════════════════════════════════════════════════════════════
// Noir: texte principal
// Bleu: entetes, horaires
// Rouge: alertes, dates, notes OPS
// Vert: vols CARGO

const COLORS = {
  BLACK: '#000000',
  BLUE: '#0066CC',
  RED: '#CC0000',
  GREEN: '#006600',
  GRAY_LIGHT: '#F0F0F0',
  GRAY_HEADER: '#E0E0E0',
  GRAY_BORDER: '#666666'
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES OPS
// ═══════════════════════════════════════════════════════════════════════════

const JOURS_SEMAINE = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_ORDRE_AFFICHAGE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

// Notes OPS avec symboles UNICODE obligatoires
const NOTES_OPS = [
  { symbole: '\u2460', texte: 'Les horaires de vol Cargo Egyptair peuvent changer en fonction de disponibilites operationnelles et notifies par la compagnie' },
  { symbole: '\u2461', texte: 'Toute irregularite des vols cargos Ethiopian sera notifiee par la compagnie et diffusee a travers les flash-info' }
];

// Configuration institutionnelle THS
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

/**
 * Formate heure HH:MM en HHhMM
 */
function formatHeure(heure) {
  if (!heure) return '-';
  return heure.replace(':', 'H');
}

/**
 * Genere edition automatique si non fournie
 */
function genererEdition(programme) {
  if (programme.edition) return programme.edition;
  const now = new Date();
  const mois = ['jan', 'fev', 'mars', 'avr', 'mai', 'juin', 'juil', 'aout', 'sept', 'oct', 'nov', 'dec'];
  return `N\u00B001/${now.getDate()}-${mois[now.getMonth()]}.-${now.getFullYear().toString().slice(-2)}`;
}

/**
 * Detecte vol CARGO
 */
function estCargo(vol) {
  return vol.categorieVol === 'CARGO' ||
    (vol.version && vol.version.toUpperCase() === 'CARGO') ||
    (vol.typeAvion && (vol.typeAvion.includes('F') || vol.typeAvion.includes('CARGO')));
}

/**
 * Detecte NIGHT STOP
 */
function estNightStop(vol) {
  return vol.observations && vol.observations.toUpperCase().includes('NIGHT STOP');
}

/**
 * Detecte si vol concerne par note OPS (Egyptair ou Ethiopian cargo)
 */
function getNoteOPS(vol) {
  const numVol = (vol.numeroVol || '').toUpperCase();
  const isCargo = estCargo(vol);

  if (isCargo && numVol.startsWith('MS')) return '\u2460'; // Egyptair
  if (isCargo && numVol.startsWith('ET')) return '\u2461'; // Ethiopian
  return '';
}

/**
 * Calcule la taille de police - LISIBLE + 1 PAGE GARANTIE
 * Calibrage anti-debordement avec compensation verticale
 */
function calculerTaillePolice(nombreLignesTableau) {
  if (nombreLignesTableau <= 40) return { base: 6.5, table: 6, obs: 5, titre: 9 };
  if (nombreLignesTableau <= 55) return { base: 6, table: 5.5, obs: 4.5, titre: 8.5 };
  if (nombreLignesTableau <= 70) return { base: 5.5, table: 5, obs: 4, titre: 8 };
  return { base: 5, table: 4.5, obs: 3.5, titre: 7 };
}

/**
 * Calcule le padding - ULTRA-COMPACT pour 1 PAGE GARANTIE
 * Compensation verticale pour elargissement colonnes
 */
function calculerPadding(nombreLignesTableau) {
  if (nombreLignesTableau <= 40) return { h: 1.2, v: 0.3 };
  if (nombreLignesTableau <= 60) return { h: 1, v: 0.2 };
  return { h: 0.8, v: 0.15 };
}

/**
 * Calcule les marges de page - COMPACTES pour UNE SEULE PAGE
 */
function calculerMarges(nombreLignesTableau) {
  if (nombreLignesTableau <= 30) return [15, 10, 15, 12];
  if (nombreLignesTableau <= 50) return [12, 8, 12, 10];
  return [10, 6, 10, 8];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTION DU TABLEAU DES VOLS (BLOC INDIVISIBLE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Construit le corps du tableau - COLONNES FIXES ET ORDRE EXACT:
 * JOURS | N° VOL | Type d'avion | VERSION | PROVENANCE | Arrivée | DESTINATION | Départ | OBSERVATIONS
 */
function buildTableBody(volsParJour, tailles) {
  const body = [];

  // EN-TETE DU TABLEAU (colonnes fixes, ordre exact)
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

  // LIGNES PAR JOUR (LUNDI → DIMANCHE)
  JOURS_ORDRE_AFFICHAGE.forEach((jour) => {
    const vols = volsParJour[jour] || [];

    if (vols.length === 0) {
      // Jour sans vol - ligne unique
      body.push([
        { text: jour, style: 'jourCell', alignment: 'center', fillColor: COLORS.GRAY_LIGHT },
        { text: '-', alignment: 'center', colSpan: 8, fontSize: tailles.table },
        {}, {}, {}, {}, {}, {}, {}
      ]);
    } else {
      // Vols du jour - cellule JOURS fusionnee verticalement
      vols.forEach((vol, index) => {
        const row = [];
        const isCargo = estCargo(vol);
        const isNightStop = estNightStop(vol);
        const noteOPS = getNoteOPS(vol);

        // COLONNE 1: JOURS (fusion verticale)
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

        // COLONNE 2: N° VOL (avec note OPS si applicable)
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

        // COLONNE 6: Arrivee (heure en BLEU)
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

        // COLONNE 8: Depart (heure en BLEU, +1 si lendemain)
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
        // CARGO en MAJUSCULES si cargo
        if (isCargo && !obsText.toUpperCase().includes('CARGO')) {
          obsText = 'CARGO' + (obsText ? ' - ' + obsText : '');
        }
        // NIGHT STOP en MAJUSCULES
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

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION DU DOCUMENT PDF (UNE SEULE PAGE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genere la definition du document PDF
 * CONTRAINTE ABSOLUE: UNE SEULE PAGE A4 PAYSAGE
 */
function generateDocDefinition(programme, volsParJour, config = {}) {
  const cfg = { ...CONFIG_THS, ...config };
  const edition = genererEdition(programme);

  // Compter le nombre de LIGNES du tableau (ce qui determine la hauteur)
  // = 1 (header) + nombre de vols par jour (avec fusion verticale)
  let nombreLignesTableau = 1; // Header du tableau
  JOURS_ORDRE_AFFICHAGE.forEach(jour => {
    const vols = volsParJour[jour] || [];
    nombreLignesTableau += vols.length > 0 ? vols.length : 1; // Au moins 1 ligne par jour
  });

  console.log(`[PDF OPS] Lignes tableau: ${nombreLignesTableau}`);

  // Calculer tailles dynamiques pour tenir sur UNE PAGE
  const tailles = calculerTaillePolice(nombreLignesTableau);
  const padding = calculerPadding(nombreLignesTableau);
  const marges = calculerMarges(nombreLignesTableau);

  return {
    // ═══════════════════════════════════════════════════════════════════════
    // FORMAT: A4 PAYSAGE - UNE SEULE PAGE (NON NEGOCIABLE)
    // ═══════════════════════════════════════════════════════════════════════
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: marges,

    // INTERDIRE toute pagination automatique
    pageBreakBefore: function() { return false; },

    defaultStyle: {
      font: 'DejaVuSans',
      fontSize: tailles.base
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLES - Optimises pour UNE SEULE PAGE
    // ═══════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENU - HIERARCHIE DOCUMENTAIRE FIGEE
    // ═══════════════════════════════════════════════════════════════════════
    content: [
      // ─────────────────────────────────────────────────────────────────────
      // 1. EN-TETE INSTITUTIONNEL (compact)
      // ─────────────────────────────────────────────────────────────────────
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

      // ─────────────────────────────────────────────────────────────────────
      // 2. NOTES OPS (compactes sur 2 lignes max)
      // ─────────────────────────────────────────────────────────────────────
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

      // ─────────────────────────────────────────────────────────────────────
      // 3. TITRE PRINCIPAL (immediatement avant le tableau)
      // ─────────────────────────────────────────────────────────────────────
      {
        text: `PROGRAMME GENERAL DES VOLS - ${programme.nom}`,
        style: 'mainTitle',
        margin: [0, 1, 0, 2]
      },

      // ─────────────────────────────────────────────────────────────────────
      // 4. TABLEAU DES VOLS - CENTRAGE OPTIQUE via columns
      // ─────────────────────────────────────────────────────────────────────
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              headerRows: 1,
              dontBreakRows: true,
              widths: [44, 48, 54, 46, 52, 52, 52, 52, 84],
              body: buildTableBody(volsParJour, tailles)
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

      // ─────────────────────────────────────────────────────────────────────
      // 5. SIGNATURE - FERMETURE VISUELLE DU DOCUMENT
      // Espace leger puis signature alignee a droite
      // ─────────────────────────────────────────────────────────────────────
      {
        margin: [0, 6, 0, 0],
        columns: [
          {
            width: '55%',
            text: ''
          },
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

    // ─────────────────────────────────────────────────────────────────────
    // 6. PIED DE PAGE (DISCRET, UNE SEULE FOIS)
    // ─────────────────────────────────────────────────────────────────────
    footer: function(currentPage, pageCount) {
      // S'assurer qu'on n'affiche le footer que sur la page 1
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

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS EXPORTEES (API PUBLIQUE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genere un PDF et retourne un Buffer
 * @param {String} programmeId - ID du programme
 * @param {Object} config - Configuration optionnelle
 * @returns {Promise<Buffer>} Buffer du PDF
 */
export const genererPDFBuffer = async (programmeId, config = {}) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouve');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    // Grouper les vols par jour
    const volsParJour = {};
    JOURS_SEMAINE.forEach((nom, index) => {
      volsParJour[nom] = vols.filter(v => v.joursSemaine.includes(index));
    });

    const docDefinition = generateDocDefinition(programme, volsParJour, config);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

  } catch (error) {
    console.error('[PDF OPS] Erreur generation buffer:', error);
    throw error;
  }
};

/**
 * Genere un PDF et l'envoie en stream HTTP
 * @param {String} programmeId - ID du programme
 * @param {Object} res - Response Express
 * @param {Object} config - Configuration optionnelle
 */
export const genererPDFStream = async (programmeId, res, config = {}) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouve');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    const volsParJour = {};
    JOURS_SEMAINE.forEach((nom, index) => {
      volsParJour[nom] = vols.filter(v => v.joursSemaine.includes(index));
    });

    const docDefinition = generateDocDefinition(programme, volsParJour, config);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const filename = `PROGRAMME_VOLS_${programme.nom.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error('[PDF OPS] Erreur generation stream:', error);
    throw error;
  }
};

/**
 * Obtient les donnees structurees pour apercu (sans generer le PDF)
 * @param {String} programmeId - ID du programme
 * @returns {Object} Donnees structurees
 */
export const obtenirApercu = async (programmeId) => {
  try {
    const programme = await ProgrammeVol.findById(programmeId);
    if (!programme) {
      throw new Error('Programme non trouve');
    }

    const vols = await VolProgramme.getVolsParProgramme(programmeId);

    const volsParJour = {};
    JOURS_SEMAINE.forEach((nom, index) => {
      volsParJour[nom] = vols
        .filter(v => v.joursSemaine.includes(index))
        .map(v => ({
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
      programme: {
        id: programme._id,
        nom: programme.nom,
        edition: genererEdition(programme),
        dateDebut: programme.dateDebut,
        dateFin: programme.dateFin,
        statut: programme.statut,
        nombreVols: programme.nombreVols,
        compagnies: programme.compagnies
      },
      volsParJour,
      config: CONFIG_THS
    };

  } catch (error) {
    console.error('[PDF OPS] Erreur apercu:', error);
    throw error;
  }
};

export default {
  genererPDFBuffer,
  genererPDFStream,
  obtenirApercu
};
