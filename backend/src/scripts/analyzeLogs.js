// src/scripts/analyzeLogs.js
import { existsSync, createReadStream } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

class LogAnalyzer {
  constructor(logDir = join(__dirname, '../../logs')) {
    this.logDir = logDir;
  }

  async analyzeErrorLogs() {
    const errors = await this.parseLogFile('error.log');
    
    const analysis = {
      totalErrors: errors.length,
      byType: {},
      byTime: {},
      topErrors: []
    };

    errors.forEach(error => {
      // Agrupar por tipo de erro
      const errorType = this.extractErrorType(error);
      analysis.byType[errorType] = (analysis.byType[errorType] || 0) + 1;

      // Agrupar por hora
      const hour = this.extractHour(error);
      analysis.byTime[hour] = (analysis.byTime[hour] || 0) + 1;
    });

    // Top 10 erros mais frequentes
    analysis.topErrors = Object.entries(analysis.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    return analysis;
  }

  async analyzePerformanceLogs() {
    const logs = await this.parseLogFile('combined.log');
    const slowRequests = logs.filter(log => {
      const responseTime = this.extractResponseTime(log);
      return responseTime && responseTime > 1000;
    });

    return {
      totalSlowRequests: slowRequests.length,
      averageResponseTime: this.calculateAverageResponseTime(logs),
      slowestEndpoints: this.findSlowestEndpoints(slowRequests),
      timeDistribution: this.analyzeTimeDistribution(slowRequests)
    };
  }

  async analyzeAuditLogs() {
    const auditLog = await this.parseLogFile('audit.log', true);
    
    return {
      totalActions: auditLog.length,
      actionsByUser: this.groupByUser(auditLog),
      actionsByType: this.groupByAction(auditLog),
      recentActivity: auditLog.slice(-20)
    };
  }

  async generateReport() {
    console.log('🔍 Gerando relatório de análise de logs...\n');

    const errorAnalysis = await this.analyzeErrorLogs();
    console.log('📊 Erros:');
    console.log(`  Total: ${errorAnalysis.totalErrors}`);
    console.log('  Top 5:');
    errorAnalysis.topErrors.slice(0, 5).forEach((error, index) => {
      console.log(`    ${index + 1}. ${error.type}: ${error.count} ocorrências`);
    });
    console.log('');

    const performanceAnalysis = await this.analyzePerformanceLogs();
    console.log('⚡ Performance:');
    console.log(`  Requisições lentas: ${performanceAnalysis.totalSlowRequests}`);
    console.log(`  Tempo médio de resposta: ${performanceAnalysis.averageResponseTime}ms`);
    console.log('');

    const auditAnalysis = await this.analyzeAuditLogs();
    console.log('🔐 Auditoria:');
    console.log(`  Total de ações: ${auditAnalysis.totalActions}`);
    console.log(`  Usuários ativos: ${Object.keys(auditAnalysis.actionsByUser).length}`);
  }

  // Métodos auxiliares
  async parseLogFile(filename, isJson = false) {
    const filePath = join(this.logDir, filename);
    
    if (!existsSync(filePath)) {
      return [];
    }

    const lines = [];
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        lines.push(isJson ? JSON.parse(line) : line);
      }
    }

    return lines;
  }

  extractErrorType(logLine) {
    const match = logLine.match(/\[ERROR\].*?:\s*(.+)/);
    return match ? match[1].split(' ').slice(0, 3).join(' ') : 'Unknown';
  }

  extractHour(logLine) {
    const match = logLine.match(/(\d{4}-\d{2}-\d{2})\s(\d{2}):/);
    return match ? match[2] : '00';
  }

  extractResponseTime(logLine) {
    const match = logLine.match(/(\d+)ms/);
    return match ? parseInt(match[1]) : null;
  }

  calculateAverageResponseTime(logs) {
    const times = logs
      .map(log => this.extractResponseTime(log))
      .filter(time => time !== null);
    
    if (times.length === 0) return 0;
    
    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
  }

  findSlowestEndpoints(logs) {
    const endpoints = {};
    
    logs.forEach(log => {
      const match = log.match(/GET|POST|PUT|DELETE\s+(.+?)\s/);
      if (match) {
        const endpoint = match[0].trim();
        const responseTime = this.extractResponseTime(log);
        endpoints[endpoint] = Math.max(endpoints[endpoint] || 0, responseTime || 0);
      }
    });

    return Object.entries(endpoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  analyzeTimeDistribution(logs) {
    const distribution = {};
    
    logs.forEach(log => {
      const hour = this.extractHour(log);
      distribution[hour] = (distribution[hour] || 0) + 1;
    });

    return distribution;
  }

  groupByUser(logs) {
    return logs.reduce((acc, log) => {
      const userId = log.userId || 'anonymous';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});
  }

  groupByAction(logs) {
    return logs.reduce((acc, log) => {
      const action = log.action || 'unknown';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});
  }
}

// Executar análise se chamado diretamente
if (require.main === module) {
  const analyzer = new LogAnalyzer();
  analyzer.generateReport()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erro na análise:', error);
      process.exit(1);
    });
}

export default LogAnalyzer;