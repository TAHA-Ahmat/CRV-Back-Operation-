// ============================================
// INDEX - SERVICES DOCUMENTS BULLETIN
// ============================================

export { BulletinMouvementGenerator } from './BulletinMouvementGenerator.js';
export * from './bulletinArchivage.service.js';

export default {
  BulletinMouvementGenerator: (await import('./BulletinMouvementGenerator.js')).BulletinMouvementGenerator,
  ...await import('./bulletinArchivage.service.js')
};
