import mongoose from 'mongoose';
import Personne from '../models/security/Personne.js';
import { connectDB } from '../config/db.js';

/**
 * Script d'initialisation du premier compte ADMIN
 * À utiliser UNIQUEMENT pour la première installation
 *
 * Usage: node src/utils/seedAdmin.js
 */

const adminData = {
  nom: 'Admin',
  prenom: 'Système',
  matricule: 'ADM001',
  email: 'admin@crv.com',
  password: 'Admin123!', // ⚠️ À CHANGER après première connexion
  fonction: 'ADMIN',
  statut: 'ACTIF',
  statutCompte: 'VALIDE',
  specialites: []
};

export const seedAdmin = async () => {
  try {
    await connectDB();

    // Vérifier si un admin existe déjà
    const existingAdmin = await Personne.findOne({ fonction: 'ADMIN' });

    if (existingAdmin) {
      console.log('⚠️  Un compte ADMIN existe déjà:');
      console.log(`   - Nom: ${existingAdmin.nom} ${existingAdmin.prenom}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Matricule: ${existingAdmin.matricule}`);
      console.log('\n💡 Pour créer un autre admin, utilisez la route POST /api/personnes avec un token admin existant.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Vérifier si email ou matricule existe déjà
    const existingUser = await Personne.findOne({
      $or: [
        { email: adminData.email },
        { matricule: adminData.matricule }
      ]
    });

    if (existingUser) {
      console.log('❌ Erreur: Email ou matricule déjà utilisé par un autre compte');
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Matricule: ${existingUser.matricule}`);
      console.log(`   - Fonction: ${existingUser.fonction}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Créer le compte admin
    const admin = await Personne.create(adminData);

    console.log('✅ Compte ADMIN créé avec succès!\n');
    console.log('📋 Informations de connexion:');
    console.log('   ┌─────────────────────────────────────');
    console.log(`   │ Email:    ${adminData.email}`);
    console.log(`   │ Password: ${adminData.password}`);
    console.log('   └─────────────────────────────────────');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n');
    console.log('📌 Détails du compte:');
    console.log(`   - ID: ${admin._id}`);
    console.log(`   - Nom: ${admin.nom} ${admin.prenom}`);
    console.log(`   - Matricule: ${admin.matricule}`);
    console.log(`   - Fonction: ${admin.fonction}`);
    console.log(`   - Statut: ${admin.statut}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte ADMIN:', error.message);
    if (error.errors) {
      console.error('\n📋 Détails des erreurs de validation:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin();
}
