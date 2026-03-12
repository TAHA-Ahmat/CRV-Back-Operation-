import mongoose from 'mongoose';
import Personne from './src/models/Personne.js';
import { connectDB } from './src/config/db.js';

const resetAdminPassword = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await connectDB();

    console.log('🔍 Recherche du compte ADMIN...');
    const admin = await Personne.findOne({ fonction: 'ADMIN' }).select('+password');

    if (!admin) {
      console.log('❌ Aucun compte ADMIN trouvé');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✏️  Réinitialisation du mot de passe...');
    admin.password = 'Admin123!';
    await admin.save();

    console.log('\n✅ Mot de passe réinitialisé avec succès!\n');
    console.log('📋 Informations de connexion:');
    console.log('   ┌─────────────────────────────────────');
    console.log(`   │ Email:    ${admin.email}`);
    console.log('   │ Password: Admin123!');
    console.log('   └─────────────────────────────────────');
    console.log('\n📌 Détails du compte:');
    console.log(`   - ID: ${admin._id}`);
    console.log(`   - Nom: ${admin.nom} ${admin.prenom}`);
    console.log(`   - Matricule: ${admin.matricule}`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Fonction: ${admin.fonction}`);

    await mongoose.connection.close();
    console.log('\n✅ Terminé!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetAdminPassword();
