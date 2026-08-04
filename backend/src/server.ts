import app from './app';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize Database
    await initDatabase();

    const portNumber = Number(PORT);
    app.listen(portNumber, '0.0.0.0', () => {
      console.log(`[server]: Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${portNumber}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
