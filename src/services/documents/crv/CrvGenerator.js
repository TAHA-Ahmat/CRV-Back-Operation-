// ============================================
// GÉNÉRATEUR PDF V3 — CRV REPORT AVIATION
// ============================================
// 6 pages : Synthèse, Trafic, Timeline, Événements, Observations, Validation
// 100% décisionnel aviation — aucun statut système affiché

import { DocumentGenerator } from '../base/DocumentGenerator.js';
import { DOCUMENT_TYPES } from '../../../config/documents.config.js';
import CRV from '../../../models/crv/CRV.js';
import ChronologiePhase from '../../../models/phases/ChronologiePhase.js';
import ChargeOperationnelle from '../../../models/charges/ChargeOperationnelle.js';
import EvenementOperationnel from '../../../models/transversal/EvenementOperationnel.js';
import Observation from '../../../models/crv/Observation.js';
import ValidationCRV from '../../../models/validation/ValidationCRV.js';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  // Aviation blue palette
  NAVY: '#0c2340',
  BLUE: '#1a56db',
  BLUE_LIGHT: '#3b82f6',
  BLUE_BG: '#eff6ff',

  // Status
  GREEN: '#059669',
  GREEN_BG: '#ecfdf5',
  ORANGE: '#d97706',
  ORANGE_BG: '#fffbeb',
  RED: '#dc2626',
  RED_BG: '#fef2f2',

  // Neutrals
  BLACK: '#111827',
  GRAY_900: '#1f2937',
  GRAY_700: '#374151',
  GRAY_500: '#6b7280',
  GRAY_400: '#9ca3af',
  GRAY_300: '#d1d5db',
  GRAY_200: '#e5e7eb',
  GRAY_100: '#f3f4f6',
  GRAY_50: '#f9fafb',
  WHITE: '#ffffff',
};

const THS = {
  organisation: 'TCHAD HANDLING SERVICES',
  departement: 'SERVICE DES OPERATIONS',
  adresse: 'Aeroport International Hassan Djamous - N\'Djamena',
  telephone: '(+235) 66 23 51 18',
  email: 'operation@ths-aero.com',
  sita: 'NDJKOXH',
};

// ═══════════════════════════════════════════════════════════════════════════
// LABELS
// ═══════════════════════════════════════════════════════════════════════════

const TYPE_OP_SHORT = { ARRIVEE: 'ARR', DEPART: 'DEP', TURN_AROUND: 'TAT' };
const TYPE_OP_LABEL = { ARRIVEE: 'Arrivee', DEPART: 'Depart', TURN_AROUND: 'Turn Around' };
const STATUT_PHASE = { NON_COMMENCE: 'Non commence', EN_COURS: 'En cours', TERMINE: 'Termine', NON_REALISE: 'Non realise', ANNULE: 'Annule' };
const GRAVITE_LABEL = { MINEURE: 'Mineure', MODEREE: 'Moderee', MAJEURE: 'Majeure', CRITIQUE: 'CRITIQUE' };
const TYPE_EVT = { PANNE_EQUIPEMENT: 'Panne equipement', ABSENCE_PERSONNEL: 'Absence personnel', RETARD: 'Retard', INCIDENT_SECURITE: 'Incident securite', INCIDENT_TECHNIQUE: 'Incident technique', PROBLEME_TECHNIQUE: 'Probleme technique', METEO: 'Meteo', AUTRE: 'Autre' };
const CAT_OBS = { GENERALE: 'Generale', TECHNIQUE: 'Technique', OPERATIONNELLE: 'Operationnelle', SECURITE: 'Securite', QUALITE: 'Qualite', SLA: 'SLA' };
const FONCTION_LABEL = { CHEF_ESCALE: 'Chef d\'escale', AGENT_TRAFIC: 'Agent trafic', AGENT_PISTE: 'Agent piste', AGENT_PASSAGE: 'Agent passage', MANUTENTIONNAIRE: 'Manutentionnaire', CHAUFFEUR: 'Chauffeur', AGENT_SECURITE: 'Agent securite', TECHNICIEN: 'Technicien', SUPERVISEUR: 'Superviseur', COORDINATEUR: 'Coordinateur', AUTRE: 'Autre' };
const ENGIN_LABEL = { TRACTEUR_PUSHBACK: 'Tracteur Pushback', PASSERELLE: 'Passerelle', TAPIS_BAGAGES: 'Tapis bagages', GPU: 'GPU', ASU: 'ASU', ESCALIER: 'Escalier', TRANSBORDEUR: 'Transbordeur', CAMION_AVITAILLEMENT: 'Camion avitaillement', CAMION_VIDANGE: 'Camion vidange', CAMION_EAU: 'Camion eau', ELEVATEUR: 'Elevateur', CHARIOT_BAGAGES: 'Chariot bagages', CONTENEUR_ULD: 'Conteneur ULD', DOLLY: 'Dolly', AUTRE: 'Autre' };

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

const fmtDate = (d) => { if (!d) return '-'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
const fmtTime = (d) => { if (!d) return '-'; return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
const fmtDateTime = (d) => { if (!d) return '-'; return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const n = (v) => v !== null && v !== undefined ? v : '-';

function ecartColor(minutes) {
  if (minutes === null || minutes === undefined) return C.GRAY_500;
  const abs = Math.abs(minutes);
  if (abs <= 5) return C.GREEN;
  if (abs <= 15) return C.ORANGE;
  return C.RED;
}

function ecartText(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes === 0) return '0 min';
  return `${minutes > 0 ? '+' : ''}${minutes} min`;
}

function graviteColor(g) {
  if (g === 'CRITIQUE') return C.RED;
  if (g === 'MAJEURE') return C.RED;
  if (g === 'MODEREE') return C.ORANGE;
  return C.GRAY_700;
}

function statutPhaseColor(s) {
  if (s === 'TERMINE') return C.GREEN;
  if (s === 'EN_COURS') return C.BLUE;
  if (s === 'NON_REALISE' || s === 'ANNULE') return C.ORANGE;
  return C.GRAY_500;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSE GENERATEUR CRV — V3 (6 pages aviation report, 100% décisionnel)
// ═══════════════════════════════════════════════════════════════════════════

function incidentColor(count) {
  if (count === 0) return C.GREEN;
  if (count <= 2) return C.ORANGE;
  return C.RED;
}

function incidentBg(count) {
  if (count === 0) return C.GREEN_BG;
  if (count <= 2) return C.ORANGE_BG;
  return C.RED_BG;
}

export class CrvGenerator extends DocumentGenerator {
  constructor(options = {}) {
    super(DOCUMENT_TYPES.CRV, options);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH DATA — charge TOUTES les collections
  // ─────────────────────────────────────────────────────────────────────────
  async fetchData(crvId) {
    const crv = await CRV.findById(crvId)
      .populate('vol')
      .populate('creePar', 'nom prenom')
      .populate('responsableVol', 'nom prenom')
      .populate('verrouillePar', 'nom prenom')
      .populate('archivage.archivedBy', 'nom prenom');

    if (!crv) throw new Error('CRV non trouve');

    const [phases, charges, evenements, observations, validation] = await Promise.all([
      ChronologiePhase.find({ crv: crvId }).populate('phase').populate('responsable', 'nom prenom').sort({ 'phase.ordre': 1 }),
      ChargeOperationnelle.find({ crv: crvId }),
      EvenementOperationnel.find({ crv: crvId }).populate('declarePar', 'nom prenom').sort({ dateHeureDebut: 1 }),
      Observation.find({ crv: crvId }).populate('auteur', 'nom prenom').sort({ dateHeure: -1 }),
      ValidationCRV.findOne({ crv: crvId }).populate('validePar', 'nom prenom'),
    ]);

    return {
      entity: crv,
      data: {
        vol: crv.vol,
        personnel: crv.personnelAffecte || [],
        materiel: crv.materielUtilise || [],
        phases,
        charges,
        evenements,
        observations,
        validation,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD DOCUMENT
  // ─────────────────────────────────────────────────────────────────────────
  buildDocumentDefinition(crv, data) {
    return {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [28, 55, 28, 45],
      defaultStyle: { font: 'DejaVuSans', fontSize: 8, color: C.GRAY_900 },
      styles: this._styles(),
      header: (page) => this._header(crv, data.vol, page),
      footer: (page, count) => this._footer(crv, page, count),
      content: [
        // PAGE 1 — SYNTHESE OPERATIONNELLE
        this._page1_synthese(crv, data),

        // PAGE 2 — STATISTIQUES TRAFIC
        { text: '', pageBreak: 'before' },
        this._page2_trafic(data.charges),

        // PAGE 3 — TIMELINE + RESSOURCES
        { text: '', pageBreak: 'before' },
        this._page3_timeline(data.phases, data.personnel, data.materiel),

        // PAGE 4 — EVENEMENTS
        { text: '', pageBreak: 'before' },
        this._page4_evenements(data.evenements),

        // PAGE 5 — OBSERVATIONS
        this._page5_observations(data.observations),

        // PAGE 6 — VALIDATION + SIGNATURE
        { text: '', pageBreak: 'before' },
        this._page6_validation(crv, data.validation),
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER / FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  _header(crv, vol, page) {
    const typeOp = TYPE_OP_SHORT[vol?.typeOperation] || '-';
    return {
      margin: [28, 12, 28, 0],
      columns: [
        { stack: [
          { text: THS.organisation, fontSize: 9, bold: true, color: C.NAVY },
          { text: THS.departement, fontSize: 7, color: C.GRAY_500 },
        ]},
        { stack: [
          { text: `${crv.numeroCRV}  |  ${typeOp}  |  ${crv.escale || ''}`, fontSize: 9, bold: true, alignment: 'right', color: C.NAVY },
          { text: `Vol ${vol?.numeroVol || '-'}  —  ${fmtDate(vol?.dateVol)}`, fontSize: 7, alignment: 'right', color: C.GRAY_500 },
        ]},
      ],
    };
  }

  _footer(crv, page, count) {
    return {
      margin: [28, 8, 28, 0],
      columns: [
        { text: `${THS.organisation}  —  ${THS.telephone}  —  ${THS.sita}`, fontSize: 6, color: C.GRAY_400 },
        { text: `${crv.numeroCRV}  —  Page ${page}/${count}`, fontSize: 6, color: C.GRAY_400, alignment: 'right' },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════════════════════

  _styles() {
    return {
      pageTitle: { fontSize: 14, bold: true, color: C.NAVY, margin: [0, 0, 0, 12] },
      sectionTitle: { fontSize: 10, bold: true, color: C.NAVY, margin: [0, 14, 0, 6] },
      sectionBar: { fontSize: 10, bold: true, color: C.WHITE, fillColor: C.NAVY, margin: [0, 14, 0, 6] },
      kpiValue: { fontSize: 18, bold: true, alignment: 'center' },
      kpiLabel: { fontSize: 7, color: C.GRAY_500, alignment: 'center' },
      th: { fontSize: 7, bold: true, color: C.WHITE, fillColor: C.NAVY, alignment: 'center', margin: [0, 3, 0, 3] },
      td: { fontSize: 7, color: C.GRAY_900, alignment: 'center', margin: [0, 2, 0, 2] },
      tdLeft: { fontSize: 7, color: C.GRAY_900, alignment: 'left', margin: [2, 2, 2, 2] },
      label: { fontSize: 7, color: C.GRAY_500, bold: true },
      value: { fontSize: 8, color: C.BLACK },
      small: { fontSize: 6, color: C.GRAY_400 },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  _sectionBar(text) {
    return {
      table: { widths: ['*'], body: [[{ text: `  ${text}`, style: 'sectionBar', border: [false, false, false, false] }]] },
      layout: 'noBorders',
      margin: [0, 14, 0, 6],
    };
  }

  _kpiCard(label, value, color, bgColor) {
    return {
      table: {
        widths: ['*'],
        body: [
          [{ text: value, style: 'kpiValue', color, fillColor: bgColor, margin: [0, 8, 0, 2] }],
          [{ text: label, style: 'kpiLabel', fillColor: bgColor, margin: [0, 0, 0, 6] }],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 4, paddingRight: () => 4 },
    };
  }

  _thinTable() {
    return {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
      vLineWidth: () => 0.3,
      hLineColor: (i) => i === 1 ? C.NAVY : C.GRAY_200,
      vLineColor: () => C.GRAY_200,
      paddingLeft: () => 4, paddingRight: () => 4,
      paddingTop: () => 2, paddingBottom: () => 2,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — SYNTHESE OPERATIONNELLE
  // ═══════════════════════════════════════════════════════════════════════════

  _page1_synthese(crv, data) {
    const vol = data.vol || {};
    const phases = data.phases || [];
    const validation = data.validation;
    const evenements = data.evenements || [];

    // Ecarts phases
    const phasesArr = phases.filter(p => p.phase?.typeOperation === 'ARRIVEE' || p.phase?.typeOperation === 'COMMUN');
    const phasesDep = phases.filter(p => p.phase?.typeOperation === 'DEPART' || p.phase?.typeOperation === 'COMMUN');
    const maxEcartArr = phasesArr.reduce((max, p) => Math.max(max, p.ecartMinutes || 0), 0);
    const maxEcartDep = phasesDep.reduce((max, p) => Math.max(max, p.ecartMinutes || 0), 0);

    // SLA
    const slaOk = validation?.conformiteSLA !== false;
    const slaColor = slaOk ? C.GREEN : C.RED;
    const slaBg = slaOk ? C.GREEN_BG : C.RED_BG;

    // Incidents
    const nbIncidents = evenements.length;

    return {
      stack: [
        // Titre page
        { text: 'COMPTE RENDU DE VOL', style: 'pageTitle', alignment: 'center' },
        { text: `${crv.numeroCRV}`, fontSize: 11, color: C.BLUE, alignment: 'center', margin: [0, 0, 0, 4] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 1, lineColor: C.GRAY_200 }], margin: [0, 4, 0, 10] },

        // INFORMATIONS VOL
        this._sectionBar('INFORMATIONS VOL'),
        {
          columns: [
            { width: '50%', table: { widths: ['35%', '65%'], body: [
              [{ text: 'N. Vol', style: 'label' }, { text: vol.numeroVol || '-', style: 'value', bold: true }],
              [{ text: 'Compagnie', style: 'label' }, { text: `${vol.compagnieAerienne || '-'} (${vol.codeIATA || '-'})`, style: 'value' }],
              [{ text: 'Type', style: 'label' }, { text: TYPE_OP_LABEL[vol.typeOperation] || '-', style: 'value' }],
              [{ text: 'Date vol', style: 'label' }, { text: fmtDate(vol.dateVol), style: 'value' }],
            ]}, layout: 'noBorders' },
            { width: '50%', table: { widths: ['35%', '65%'], body: [
              [{ text: 'Escale', style: 'label' }, { text: crv.escale || '-', style: 'value', bold: true }],
              [{ text: 'Origine', style: 'label' }, { text: vol.aeroportOrigine || '-', style: 'value' }],
              [{ text: 'Destination', style: 'label' }, { text: vol.aeroportDestination || '-', style: 'value' }],
              [{ text: 'Poste', style: 'label' }, { text: vol.posteStationnement || '-', style: 'value' }],
            ]}, layout: 'noBorders' },
          ],
        },

        // AERONEF
        this._sectionBar('AERONEF'),
        {
          columns: [
            { width: '50%', table: { widths: ['35%', '65%'], body: [
              [{ text: 'Type avion', style: 'label' }, { text: vol.typeAppareil || vol.typeAvion || '-', style: 'value', bold: true }],
            ]}, layout: 'noBorders' },
            { width: '50%', table: { widths: ['35%', '65%'], body: [
              [{ text: 'Immatriculation', style: 'label' }, { text: vol.immatriculation || '-', style: 'value', bold: true }],
            ]}, layout: 'noBorders' },
          ],
        },

        // PERFORMANCE DU VOL
        this._sectionBar('PERFORMANCE DU VOL'),
        {
          columns: [
            this._kpiCard('RETARD ARR', ecartText(maxEcartArr), ecartColor(maxEcartArr), C.GRAY_50),
            this._kpiCard('RETARD DEP', ecartText(maxEcartDep), ecartColor(maxEcartDep), C.GRAY_50),
            this._kpiCard('SLA', slaOk ? 'CONFORME' : 'NON CONFORME', slaColor, slaBg),
            this._kpiCard('INCIDENTS', String(nbIncidents), incidentColor(nbIncidents), incidentBg(nbIncidents)),
          ],
          columnGap: 8,
          margin: [0, 0, 0, 6],
        },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — STATISTIQUES TRAFIC
  // ═══════════════════════════════════════════════════════════════════════════

  _page2_trafic(charges) {
    const paxEmb = charges.find(c => c.typeCharge === 'PASSAGERS' && c.sensOperation === 'EMBARQUEMENT');
    const paxDeb = charges.find(c => c.typeCharge === 'PASSAGERS' && c.sensOperation === 'DEBARQUEMENT');
    const bagEmb = charges.find(c => c.typeCharge === 'BAGAGES' && c.sensOperation === 'EMBARQUEMENT');
    const bagDeb = charges.find(c => c.typeCharge === 'BAGAGES' && c.sensOperation === 'DEBARQUEMENT');
    const fretEmb = charges.find(c => c.typeCharge === 'FRET' && c.sensOperation === 'EMBARQUEMENT');
    const fretDeb = charges.find(c => c.typeCharge === 'FRET' && c.sensOperation === 'DEBARQUEMENT');

    const totalPax = (field, charge) => {
      if (!charge) return '-';
      const v = charge[field];
      return v !== null && v !== undefined ? String(v) : '-';
    };

    const paxRow = (label, field) => [
      { text: label, style: 'tdLeft' },
      { text: totalPax(field, paxDeb), style: 'td' },
      { text: totalPax(field, paxEmb), style: 'td' },
    ];

    return {
      stack: [
        { text: 'STATISTIQUES TRAFIC', style: 'pageTitle' },

        // PASSAGERS
        this._sectionBar('PASSAGERS'),
        charges.some(c => c.typeCharge === 'PASSAGERS') ? {
          table: {
            headerRows: 1,
            widths: ['40%', '30%', '30%'],
            body: [
              [{ text: 'Categorie', style: 'th' }, { text: 'Debarquement', style: 'th' }, { text: 'Embarquement', style: 'th' }],
              paxRow('Adultes', 'passagersAdultes'),
              paxRow('Enfants', 'passagersEnfants'),
              paxRow('Bebes', 'passagersBebes'),
              paxRow('PMR', 'passagersPMR'),
              paxRow('Transit', 'passagersTransit'),
              [
                { text: 'TOTAL', style: 'tdLeft', bold: true },
                { text: paxDeb?.totalPassagers !== null && paxDeb?.totalPassagers !== undefined ? String(paxDeb.totalPassagers) : '-', style: 'td', bold: true },
                { text: paxEmb?.totalPassagers !== null && paxEmb?.totalPassagers !== undefined ? String(paxEmb.totalPassagers) : '-', style: 'td', bold: true },
              ],
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucune donnee passagers', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },

        // BAGAGES
        this._sectionBar('BAGAGES'),
        (bagEmb || bagDeb) ? {
          table: {
            headerRows: 1,
            widths: ['40%', '30%', '30%'],
            body: [
              [{ text: '', style: 'th' }, { text: 'Debarquement', style: 'th' }, { text: 'Embarquement', style: 'th' }],
              [{ text: 'Nombre soute', style: 'tdLeft' }, { text: n(bagDeb?.nombreBagagesSoute), style: 'td' }, { text: n(bagEmb?.nombreBagagesSoute), style: 'td' }],
              [{ text: 'Poids soute (kg)', style: 'tdLeft' }, { text: n(bagDeb?.poidsBagagesSouteKg), style: 'td' }, { text: n(bagEmb?.poidsBagagesSouteKg), style: 'td' }],
              [{ text: 'Cabine', style: 'tdLeft' }, { text: n(bagDeb?.nombreBagagesCabine), style: 'td' }, { text: n(bagEmb?.nombreBagagesCabine), style: 'td' }],
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucune donnee bagages', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },

        // FRET
        this._sectionBar('FRET'),
        (fretEmb || fretDeb) ? {
          table: {
            headerRows: 1,
            widths: ['40%', '30%', '30%'],
            body: [
              [{ text: '', style: 'th' }, { text: 'Debarquement', style: 'th' }, { text: 'Embarquement', style: 'th' }],
              [{ text: 'Nombre', style: 'tdLeft' }, { text: n(fretDeb?.nombreFret), style: 'td' }, { text: n(fretEmb?.nombreFret), style: 'td' }],
              [{ text: 'Poids (kg)', style: 'tdLeft' }, { text: n(fretDeb?.poidsFretKg), style: 'td' }, { text: n(fretEmb?.poidsFretKg), style: 'td' }],
              [{ text: 'Type', style: 'tdLeft' }, { text: n(fretDeb?.typeFret), style: 'td' }, { text: n(fretEmb?.typeFret), style: 'td' }],
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucune donnee fret', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3 — TIMELINE + RESSOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  _page3_timeline(phases, personnel, materiel) {
    // PHASES TABLE
    const phaseRows = phases.map(p => [
      { text: p.phase?.libelle || '-', style: 'tdLeft', fontSize: 6 },
      { text: fmtTime(p.heureDebutPrevue), style: 'td', fontSize: 6 },
      { text: fmtTime(p.heureDebutReelle), style: 'td', fontSize: 6 },
      { text: fmtTime(p.heureFinReelle), style: 'td', fontSize: 6 },
      { text: p.dureeReelleMinutes !== null && p.dureeReelleMinutes !== undefined ? `${p.dureeReelleMinutes}'` : '-', style: 'td', fontSize: 6 },
      { text: ecartText(p.ecartMinutes), style: 'td', fontSize: 6, color: ecartColor(p.ecartMinutes) },
      { text: STATUT_PHASE[p.statut] || p.statut, style: 'td', fontSize: 6, color: statutPhaseColor(p.statut) },
    ]);

    // PERSONNEL TABLE
    const persRows = personnel.map(p => [
      { text: `${p.nom || ''} ${p.prenom || ''}`.trim() || '-', style: 'tdLeft' },
      { text: FONCTION_LABEL[p.fonction] || p.fonction || '-', style: 'td' },
      { text: p.matricule || '-', style: 'td' },
    ]);

    // MATERIEL TABLE
    const matRows = materiel.map(m => [
      { text: ENGIN_LABEL[m.typeEngin] || m.typeEngin || '-', style: 'tdLeft' },
      { text: m.identifiant || '-', style: 'td' },
      { text: fmtTime(m.heureDebutUtilisation), style: 'td' },
      { text: fmtTime(m.heureFinUtilisation), style: 'td' },
      { text: m.operateur || '-', style: 'td' },
    ]);

    return {
      stack: [
        { text: 'CHRONOLOGIE & RESSOURCES', style: 'pageTitle' },

        // CHRONOLOGIE
        this._sectionBar('CHRONOLOGIE DES OPERATIONS'),
        phases.length > 0 ? {
          table: {
            headerRows: 1,
            widths: ['24%', '11%', '11%', '11%', '10%', '14%', '19%'],
            body: [
              [
                { text: 'Phase', style: 'th' },
                { text: 'Prevu', style: 'th' },
                { text: 'Debut', style: 'th' },
                { text: 'Fin', style: 'th' },
                { text: 'Duree', style: 'th' },
                { text: 'Ecart', style: 'th' },
                { text: 'Statut', style: 'th' },
              ],
              ...phaseRows,
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucune phase enregistree', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },

        // PERSONNEL
        this._sectionBar('PERSONNEL AFFECTE'),
        personnel.length > 0 ? {
          table: {
            headerRows: 1,
            widths: ['45%', '35%', '20%'],
            body: [
              [{ text: 'Nom', style: 'th' }, { text: 'Fonction', style: 'th' }, { text: 'Matricule', style: 'th' }],
              ...persRows,
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucun personnel affecte', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },

        // MATERIEL
        this._sectionBar('MATERIEL UTILISE'),
        materiel.length > 0 ? {
          table: {
            headerRows: 1,
            widths: ['25%', '20%', '15%', '15%', '25%'],
            body: [
              [{ text: 'Type', style: 'th' }, { text: 'ID', style: 'th' }, { text: 'Debut', style: 'th' }, { text: 'Fin', style: 'th' }, { text: 'Operateur', style: 'th' }],
              ...matRows,
            ],
          },
          layout: this._thinTable(),
        } : { text: 'Aucun materiel enregistre', italics: true, color: C.GRAY_400, margin: [0, 0, 0, 8] },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4 — EVENEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  _page4_evenements(evenements) {
    const evtRows = evenements.map(e => [
      { text: TYPE_EVT[e.typeEvenement] || e.typeEvenement || '-', style: 'tdLeft' },
      { text: GRAVITE_LABEL[e.gravite] || e.gravite || '-', style: 'td', color: graviteColor(e.gravite), bold: true },
      { text: (e.description || '-').substring(0, 70), style: 'tdLeft', fontSize: 6 },
      { text: e.delayCode || '-', style: 'td', fontSize: 6 },
      { text: e.dureeImpactMinutes ? `${e.dureeImpactMinutes}'` : '-', style: 'td' },
      { text: (e.actionsCorrectives || '-').substring(0, 50), style: 'tdLeft', fontSize: 6 },
    ]);

    return {
      stack: [
        { text: 'EVENEMENTS & INCIDENTS', style: 'pageTitle' },

        this._sectionBar(`EVENEMENTS OPERATIONNELS (${evenements.length})`),
        evenements.length > 0 ? {
          table: {
            headerRows: 1,
            widths: ['16%', '10%', '26%', '10%', '8%', '30%'],
            body: [
              [
                { text: 'Type', style: 'th' },
                { text: 'Gravite', style: 'th' },
                { text: 'Description', style: 'th' },
                { text: 'Delay', style: 'th' },
                { text: 'Impact', style: 'th' },
                { text: 'Action corrective', style: 'th' },
              ],
              ...evtRows,
            ],
          },
          layout: this._thinTable(),
        } : {
          table: { widths: ['*'], body: [[{
            text: 'Aucun evenement — Vol nominal',
            fontSize: 10, bold: true, color: C.GREEN, alignment: 'center',
            fillColor: C.GREEN_BG, margin: [0, 15, 0, 15],
          }]]},
          layout: 'noBorders',
        },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5 — OBSERVATIONS (inline, pas de pageBreak dédié)
  // ═══════════════════════════════════════════════════════════════════════════

  _page5_observations(observations) {
    if (observations.length === 0) {
      return {
        stack: [
          this._sectionBar('OBSERVATIONS TERRAIN'),
          { text: 'Aucune observation — Rien de particulier a signaler', italics: true, color: C.GRAY_400, margin: [0, 4, 0, 8] },
        ],
      };
    }

    const obsCards = observations.map(o => ({
      table: {
        widths: ['100%'],
        body: [[{
          stack: [
            { columns: [
              { text: CAT_OBS[o.categorie] || o.categorie, fontSize: 7, bold: true, color: C.BLUE },
              { text: fmtDateTime(o.dateHeure), fontSize: 6, color: C.GRAY_400, alignment: 'right' },
            ]},
            { text: o.contenu || '', fontSize: 8, color: C.GRAY_900, margin: [0, 3, 0, 2] },
            { text: o.auteur ? `— ${o.auteur.prenom || ''} ${o.auteur.nom || ''}`.trim() : '', fontSize: 6, color: C.GRAY_500, italics: true },
          ],
          margin: [6, 4, 6, 4],
          fillColor: C.GRAY_50,
        }]],
      },
      layout: { hLineWidth: () => 0, vLineWidth: (i) => i === 0 ? 2 : 0, vLineColor: () => C.BLUE, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
      margin: [0, 0, 0, 6],
    }));

    return {
      stack: [
        this._sectionBar(`OBSERVATIONS TERRAIN (${observations.length})`),
        ...obsCards,
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 6 — VALIDATION + SIGNATURE
  // ═══════════════════════════════════════════════════════════════════════════

  _page6_validation(crv, validation) {
    const responsable = crv.responsableVol;
    const respNom = responsable ? `${responsable.prenom || ''} ${responsable.nom || ''}`.trim() : '-';
    const creePar = crv.creePar ? `${crv.creePar.prenom || ''} ${crv.creePar.nom || ''}`.trim() : '-';
    const validePar = validation?.validePar ? `${validation.validePar.prenom || ''} ${validation.validePar.nom || ''}`.trim() : '-';

    const anomalies = validation?.anomaliesDetectees || [];

    return {
      stack: [
        { text: 'VALIDATION OFFICIELLE', style: 'pageTitle' },

        this._sectionBar('INFORMATIONS VALIDATION'),
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [{ text: 'CRV cree par', style: 'label' }, { text: creePar, style: 'value' }],
              [{ text: 'Responsable vol', style: 'label' }, { text: respNom, style: 'value', bold: true }],
              [{ text: 'Valide par', style: 'label' }, { text: validePar, style: 'value' }],
              [{ text: 'Date validation', style: 'label' }, { text: fmtDateTime(validation?.dateValidation), style: 'value' }],
              [{ text: 'Score completude', style: 'label' }, { text: `${validation?.scoreCompletude || crv.completude || 0}%`, style: 'value',
                 color: (validation?.scoreCompletude || crv.completude || 0) >= 80 ? C.GREEN : C.ORANGE }],
              [{ text: 'Conformite SLA', style: 'label' }, { text: validation?.conformiteSLA ? 'CONFORME' : 'NON CONFORME', style: 'value',
                 color: validation?.conformiteSLA ? C.GREEN : C.RED, bold: true }],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10],
        },

        // Anomalies
        anomalies.length > 0 ? {
          stack: [
            this._sectionBar(`ANOMALIES DETECTEES (${anomalies.length})`),
            ...anomalies.map(a => ({
              text: `  •  ${a}`, fontSize: 7, color: C.RED, margin: [4, 1, 0, 1],
            })),
          ],
        } : { text: '' },

        // Commentaires validation
        validation?.commentaires ? {
          stack: [
            this._sectionBar('COMMENTAIRES VALIDATION'),
            { text: validation.commentaires, fontSize: 8, color: C.GRAY_700, margin: [4, 2, 4, 10] },
          ],
        } : { text: '' },

        // SIGNATURE
        this._sectionBar('SIGNATURES'),
        { text: '', margin: [0, 10, 0, 0] },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Le Responsable du Vol', fontSize: 8, alignment: 'center', color: C.GRAY_500 },
                { text: respNom, fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
                { text: '', margin: [0, 25, 0, 0] },
                { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: C.GRAY_300 }] },
                { text: 'Signature', fontSize: 6, color: C.GRAY_400, alignment: 'center', margin: [0, 2, 0, 0] },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: 'Le Superviseur', fontSize: 8, alignment: 'center', color: C.GRAY_500 },
                { text: validePar, fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
                { text: '', margin: [0, 25, 0, 0] },
                { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: C.GRAY_300 }] },
                { text: 'Signature', fontSize: 6, color: C.GRAY_400, alignment: 'center', margin: [0, 2, 0, 0] },
              ],
            },
          ],
        },

        // Generated
        { text: `Document genere le ${fmtDateTime(new Date())}`, fontSize: 6, color: C.GRAY_400, alignment: 'center', margin: [0, 30, 0, 0] },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW DATA
  // ─────────────────────────────────────────────────────────────────────────
  async getPreviewData(crvId) {
    const { entity: crv, data } = await this.fetchData(crvId);
    return {
      documentType: this.documentType,
      version: 'V3',
      label: this.config.label,
      filename: this.getFilename(crv),
      folderPath: this.getFolderPath(crv),
      crv: {
        id: crv._id, numeroCRV: crv.numeroCRV, escale: crv.escale,
        statut: crv.statut, completude: crv.completude, dateCreation: crv.dateCreation,
      },
      vol: data.vol ? {
        numeroVol: data.vol.numeroVol, compagnie: data.vol.compagnieAerienne,
        dateVol: data.vol.dateVol, typeOperation: data.vol.typeOperation,
      } : null,
      counts: {
        personnel: data.personnel.length,
        materiel: data.materiel.length,
        phases: data.phases.length,
        charges: data.charges.length,
        evenements: data.evenements.length,
        observations: data.observations.length,
        hasValidation: !!data.validation,
      },
    };
  }
}

export default CrvGenerator;
