// src/config/database.js
import { connect, connection } from 'mongoose';
import { info, error as _error, warn } from '../middlewares/logger.js';

const connectDB = async () => {
  try {
    const conn = await connect(process.env.MONGODB_URI);
    
    info(`MongoDB conectado: ${conn.connection.host}`);
    
    // Eventos de conexão
    connection.on('error', (err) => {
      _error('Erro na conexão MongoDB:', err);
    });

    connection.on('disconnected', () => {
      warn('MongoDB desconectado');
    });

  } catch (error) {
    _error('Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;