// services/loggerService.js - Servicio centralizado para logs y diagnóstico
class LoggerService {
  constructor() {
    this.logs = [];
    this.maxLogs = 300;
    this.listeners = new Set();
    
    // Métricas del sistema en tiempo real
    this.metrics = {
      twelveDataCalls: 0,
      twelveDataLimitReached: 0,
      cacheHits: 0,
      cacheMisses: 0,
      proxyStats: {} // { proxyIndex: { success: 0, fail: 0, totalTime: 0 } }
    };
  }

  // Suscribirse a nuevos logs
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notificar a todos los listeners
  notify() {
    this.listeners.forEach(listener => listener(this.logs, { ...this.metrics }));
  }

  // Registrar un log general
  log(level, message, category = 'SYSTEM', metadata = null) {
    const logEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level, // 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
      message,
      category, // 'API' | 'CACHE' | 'PROXY' | 'SYSTEM'
      metadata
    };

    this.logs.unshift(logEntry); // Más nuevo primero
    
    // Limitar tamaño
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Imprimir en consola de desarrollo normal también
    const formattedMsg = `[${logEntry.timestamp}][${level}][${category}] ${message}`;
    if (level === 'ERROR') {
      console.error(formattedMsg, metadata || '');
    } else if (level === 'WARNING') {
      console.warn(formattedMsg, metadata || '');
    } else {
      console.log(formattedMsg, metadata || '');
    }

    this.notify();
  }

  info(message, category = 'SYSTEM', metadata = null) {
    this.log('INFO', message, category, metadata);
  }

  success(message, category = 'SYSTEM', metadata = null) {
    this.log('SUCCESS', message, category, metadata);
  }

  warn(message, category = 'SYSTEM', metadata = null) {
    this.log('WARNING', message, category, metadata);
  }

  error(message, category = 'SYSTEM', metadata = null) {
    this.log('ERROR', message, category, metadata);
  }

  // ── Métricas y Analíticas ───────────────────────────────────────────────────
  
  incrementTwelveData() {
    this.metrics.twelveDataCalls++;
    this.notify();
  }

  incrementTwelveDataLimit() {
    this.metrics.twelveDataLimitReached++;
    this.notify();
  }

  incrementCacheHit() {
    this.metrics.cacheHits++;
    this.notify();
  }

  incrementCacheMiss() {
    this.metrics.cacheMisses++;
    this.notify();
  }

  recordProxyCall(proxyIndex, proxyName, isSuccess, timeMs) {
    if (!this.metrics.proxyStats[proxyIndex]) {
      this.metrics.proxyStats[proxyIndex] = {
        name: proxyName,
        success: 0,
        fail: 0,
        totalCalls: 0,
        totalTime: 0
      };
    }
    const stat = this.metrics.proxyStats[proxyIndex];
    stat.totalCalls++;
    stat.totalTime += timeMs;
    if (isSuccess) {
      stat.success++;
    } else {
      stat.fail++;
    }
    this.notify();
  }

  // Limpiar logs en pantalla
  clearLogs() {
    this.logs = [];
    this.notify();
  }

  // Obtener reporte completo para copiar y pegar
  getDiagnosticReport() {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics: this.metrics,
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('price_') || k.startsWith('ema21_')),
      sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.startsWith('yf_')),
      recentLogs: this.logs
    }, null, 2);
  }

  // --- Backend Sync ---
  async fetchBackendLogs() {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/market/logs`);
      if (response.ok) {
        const data = await response.json();
        if (data.metrics) {
           this.backendMetrics = data.metrics;
        }
        if (data.logs && Array.isArray(data.logs)) {
           // Fusionar logs del backend en la memoria local, evitando duplicados por ID
           const existingIds = new Set(this.logs.map(l => l.id));
           let added = false;
           // Los logs del backend vienen del más reciente al más antiguo.
           // Los damos vuelta para insertarlos en el orden cronológico adecuado, 
           // o simplemente iteramos y hacemos unshift/push según corresponda.
           // La API ya los manda en unshift (reciente primero).
           
           data.logs.forEach(bLog => {
             if (!existingIds.has(bLog.id)) {
               this.logs.push({
                 ...bLog,
                 isBackend: true
               });
               added = true;
             }
           });

           if (added) {
             // Ordenamos de nuevo por id (si el id o timestamp sirviera, acá simplificamos)
             // Como el timestamp es de texto y formato simple HH:MM:SS, podemos ordenar
             this.logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
             
             if (this.logs.length > this.maxLogs) {
               this.logs = this.logs.slice(0, this.maxLogs);
             }
           }
        }
        this.notify();
      }
    } catch (error) {
      console.warn('No se pudo conectar a los logs del backend', error);
    }
  }
}

const loggerService = new LoggerService();
export default loggerService;
