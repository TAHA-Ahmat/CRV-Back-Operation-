import mongoose from 'mongoose';
import Personne from './src/models/Personne.js';
import { connectDB } from './src/config/db.js';

const createAdmin = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await connectDB();

    console.log('🔍 Vérification des comptes existants...');
    const existingAdmin = await Personne.findOne({ fonction: 'ADMIN' });

    if (existingAdmin) {
      console.log('⚠️  Un compte ADMIN existe déjà:');
      console.log(`   - Nom: ${existingAdmin.nom} ${existingAdmin.prenom}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Matricule: ${existingAdmin.matricule}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📝 Création du compte ADMIN...');
    const admin = await Personne.create({
      nom: 'Admin',
      prenom: 'Système',
      matricule: 'ADM001',
      email: 'admin@crv.com',
      password: 'Admin123!',
      fonction: 'ADMIN',
      statut: 'ACTIF',
      statutCompte: 'VALIDE',
      specialites: []
    });

    console.log('\n✅ Compte ADMIN créé avec succès!\n');
    console.log('📋 Informations de connexion:');
    console.log('   ┌─────────────────────────────────────');
    console.log('   │ Email:    admin@crv.com');
    console.log('   │ Password: Admin123!');
    console.log('   └─────────────────────────────────────');
    console.log('\n📌 ID:', admin._id);

    await mongoose.connection.close();
    console.log('\n✅ Terminé!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();
