// src/config/database.js
import mongoose from 'mongoose';
import { info, error as _error, warn } from '../middlewares/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    info(`MongoDB conectado: ${conn.connection.host}`);
    
    // Eventos de conexão
    mongoose.connection.on('error', (err) => {
      _error('Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      warn('MongoDB desconectado');
    });

  } catch (error) {
    _error('Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;