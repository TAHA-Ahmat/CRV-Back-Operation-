/**
 * Référentiel central : type d'avion → catégorie SLA (narrow/wide).
 * Source alignée sur le miroir front (Front/src/composables/useSLA.js).
 * Utilisé par les routes /api/sla/aircraft-mapping et la résolution turnaround.
 */

const AIRCRAFT_MAP = {
  // Narrow-body
  A318: 'narrow',
  A319: 'narrow',
  A320: 'narrow',
  A321: 'narrow',
  A220: 'narrow',
  B717: 'narrow',
  B737: 'narrow',
  B738: 'narrow',
  B739: 'narrow',
  B73H: 'narrow',
  B73W: 'narrow',
  E170: 'narrow',
  E175: 'narrow',
  E190: 'narrow',
  E195: 'narrow',
  CRJ2: 'narrow',
  CRJ7: 'narrow',
  CRJ9: 'narrow',
  CRJX: 'narrow',
  AT72: 'narrow',
  AT76: 'narrow',
  DH8: 'narrow',
  DH4: 'narrow',
  SF34: 'narrow',

  // Wide-body
  A300: 'wide',
  A310: 'wide',
  A330: 'wide',
  A332: 'wide',
  A333: 'wide',
  A338: 'wide',
  A339: 'wide',
  A340: 'wide',
  A342: 'wide',
  A343: 'wide',
  A345: 'wide',
  A346: 'wide',
  A350: 'wide',
  A359: 'wide',
  A35K: 'wide',
  A380: 'wide',
  B747: 'wide',
  B748: 'wide',
  B74F: 'wide',
  B757: 'wide',
  B767: 'wide',
  B763: 'wide',
  B764: 'wide',
  B777: 'wide',
  B772: 'wide',
  B773: 'wide',
  B77L: 'wide',
  B77W: 'wide',
  B77F: 'wide',
  B787: 'wide',
  B788: 'wide',
  B789: 'wide',
  B78X: 'wide',

  // Cargo courants
  B737F: 'narrow',
  B738F: 'narrow',
  B744F: 'wide',
  B748F: 'wide',
  B77LF: 'wide',
};

// Préfixes utilisés en fallback quand le type exact n'est pas dans la map.
const PREFIX_MAP = [
  { prefix: 'A31', category: 'narrow' },
  { prefix: 'A32', category: 'narrow' },
  { prefix: 'A22', category: 'narrow' },
  { prefix: 'B73', category: 'narrow' },
  { prefix: 'B71', category: 'narrow' },
  { prefix: 'E17', category: 'narrow' },
  { prefix: 'E19', category: 'narrow' },
  { prefix: 'CRJ', category: 'narrow' },
  { prefix: 'AT7', category: 'narrow' },
  { prefix: 'DH', category: 'narrow' },
  { prefix: 'A30', category: 'wide' },
  { prefix: 'A33', category: 'wide' },
  { prefix: 'A34', category: 'wide' },
  { prefix: 'A35', category: 'wide' },
  { prefix: 'A38', category: 'wide' },
  { prefix: 'B74', category: 'wide' },
  { prefix: 'B75', category: 'wide' },
  { prefix: 'B76', category: 'wide' },
  { prefix: 'B77', category: 'wide' },
  { prefix: 'B78', category: 'wide' },
];

/**
 * Résout la catégorie SLA d'un type d'avion.
 * Retourne 'narrow' | 'wide' | null si inconnu.
 */
export function resolveAircraftCategory(typeAvion) {
  if (!typeAvion || typeof typeAvion !== 'string') return null;
  const clean = typeAvion.trim().toUpperCase().split(/[\s/]+/)[0];
  if (!clean) return null;
  if (AIRCRAFT_MAP[clean]) return AIRCRAFT_MAP[clean];
  for (const { prefix, category } of PREFIX_MAP) {
    if (clean.startsWith(prefix)) return category;
  }
  return null;
}

/**
 * Retourne la map complète (pour endpoint GET /api/sla/aircraft-mapping).
 */
export function getAircraftMapping() {
  return {
    total: Object.keys(AIRCRAFT_MAP).length,
    exact: { ...AIRCRAFT_MAP },
    prefixes: [...PREFIX_MAP],
  };
}

export default { resolveAircraftCategory, getAircraftMapping };
