import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🛫  API CRV - Compte Rendu de Vol  🛬              ║
║                                                            ║
║        Environment: ${config.nodeEnv.padEnd(43)}║
║        Port: ${config.port.toString().padEnd(50)}║
║        Status: ✅ Serveur démarré                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM reçu, arrêt du serveur...');
      server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT reçu, arrêt du serveur...');
      server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
