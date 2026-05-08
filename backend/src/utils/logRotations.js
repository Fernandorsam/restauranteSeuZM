// src/utils/logRotation.js
import { readdir, stat, unlink } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { info, error as _error, warn } from '../middlewares/logger.js';

class LogRotation {
  constructor(logDir = join(__dirname, '../../logs')) {
    this.logDir = logDir;
    this.maxAge = 30; // dias
    this.maxSize = 100 * 1024 * 1024; // 100MB total
  }

  // Verificar e rotacionar logs antigos
  async rotate() {
    try {
      const files = await this.getLogFiles();
      
      for (const file of files) {
        await this.checkFile(file);
      }
      
      info('Rotação de logs concluída');
    } catch (error) {
      _error('Erro na rotação de logs:', error);
    }
  }

  // Obter arquivos de log
  async getLogFiles() {
    return new Promise((resolve, reject) => {
      readdir(this.logDir, (err, files) => {
        if (err) reject(err);
        resolve(files.filter(f => f.endsWith('.log')));
      });
    });
  }

  // Verificar arquivo individual
  async checkFile(filename) {
    const filePath = join(this.logDir, filename);
    
    try {
      const stats = await this.getFileStats(filePath);
      const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      // Remover arquivos muito antigos
      if (fileAge > this.maxAge) {
        await this.deleteFile(filePath);
        info(`Log removido por idade: ${filename} (${Math.round(fileAge)} dias)`);
        return;
      }
      
      // Comprimir arquivos grandes (mais de 7 dias)
      if (fileAge > 7 && !filename.endsWith('.gz')) {
        await this.compressFile(filePath);
        info(`Log comprimido: ${filename}`);
      }
    } catch (error) {
      _error(`Erro ao verificar arquivo ${filename}:`, error);
    }
  }

  // Obter estatísticas do arquivo
  getFileStats(filePath) {
    return new Promise((resolve, reject) => {
      stat(filePath, (err, stats) => {
        if (err) reject(err);
        resolve(stats);
      });
    });
  }

  // Deletar arquivo
  deleteFile(filePath) {
    return new Promise((resolve, reject) => {
      unlink(filePath, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  // Comprimir arquivo
  compressFile(filePath) {
    return new Promise((resolve, reject) => {
      exec(`gzip ${filePath}`, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  // Verificar tamanho total dos logs
  async checkTotalSize() {
    const files = await this.getLogFiles();
    let totalSize = 0;
    
    for (const file of files) {
      const stats = await this.getFileStats(join(this.logDir, file));
      totalSize += stats.size;
    }
    
    if (totalSize > this.maxSize) {
      warn('Tamanho total de logs excedeu o limite', {
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(this.maxSize / 1024 / 1024).toFixed(2)}MB`
      });
      
      // Remover logs mais antigos até atingir o limite
      await this.cleanupOldLogs();
    }
    
    return totalSize;
  }

  // Limpar logs antigos
  async cleanupOldLogs() {
    const files = await this.getLogFiles();
    const filesWithStats = await Promise.all(
      files.map(async (file) => ({
        name: file,
        path: join(this.logDir, file),
        stats: await this.getFileStats(join(this.logDir, file))
      }))
    );
    
    // Ordenar por data (mais antigos primeiro)
    filesWithStats.sort((a, b) => a.stats.mtime - b.stats.mtime);
    
    let currentSize = filesWithStats.reduce((total, file) => total + file.stats.size, 0);
    
    // Remover arquivos até atingir o limite
    for (const file of filesWithStats) {
      if (currentSize <= this.maxSize) break;
      
      await this.deleteFile(file.path);
      currentSize -= file.stats.size;
      info(`Log removido para liberar espaço: ${file.name}`);
    }
  }
}

// Agendar rotação de logs (executar diariamente)
const logRotation = new LogRotation();

// Executar rotação diariamente
setInterval(() => {
  logRotation.rotate();
}, 24 * 60 * 60 * 1000);

// Executar verificação de tamanho a cada hora
setInterval(() => {
  logRotation.checkTotalSize();
}, 60 * 60 * 1000);

export default logRotation;