// services/rsiService.js - Servicio para obtener el RSI del backend


class RsiService {
  constructor() {
    this.snapshotCache = null;
    this.snapshotCacheTime = 0;
  }

  /**
   * Obtiene el snapshot del mercado desde el backend.
   * Utiliza un caché en memoria de 1 minuto para evitar llamadas duplicadas
   * cuando los componentes montan y piden el RSI casi simultáneamente.
   */
  async getSnapshot() {
    if (this.snapshotCache && Date.now() - this.snapshotCacheTime < 60000) {
      return this.snapshotCache;
    }

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/market/snapshot`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.snapshotCache = data.snapshot || {};
      this.snapshotCacheTime = Date.now();
      return this.snapshotCache;
    } catch (error) {
      console.warn('Error fetching market snapshot for RSI:', error);
      return {};
    }
  }

  /**
   * Obtiene el RSI semanal (y su delta) para un símbolo.
   * Ahora los lee directamente de la base de datos a través de la API.
   * @param {string} symbol - Símbolo (ticker).
   * @returns {Promise<Object>} { current, previous, delta } o nulls en caso de error.
   */
  async getWeeklyRsi(symbol) {
    const emptyResult = { current: null, previous: null, delta: null };
    try {
      const snapshot = await this.getSnapshot();
      const symbolData = snapshot[symbol];

      if (symbolData && symbolData.rsiWeekly !== undefined && symbolData.rsiWeekly !== null) {
        return {
          current: symbolData.rsiWeekly,
          previous: symbolData.rsiPrevious,
          delta: symbolData.rsiDelta
        };
      }

      return emptyResult;
    } catch (error) {
      console.warn(`[RSI Service] No se pudo obtener RSI Semanal de ${symbol}:`, error.message);
      return emptyResult;
    }
  }

  /**
   * Obtiene el RSI para múltiples símbolos, reportando progreso.
   * Al leer del snapshot, esto es ahora prácticamente instantáneo y no satura APIs externas.
   */
  async getMultipleWeeklyRsi(symbols, onProgress) {
    const results = {};
    const snapshot = await this.getSnapshot();

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const symbolData = snapshot[symbol];
      
      let rsiData = { current: null, previous: null, delta: null };
      
      if (symbolData && symbolData.rsiWeekly !== undefined && symbolData.rsiWeekly !== null) {
        rsiData = {
          current: symbolData.rsiWeekly,
          previous: symbolData.rsiPrevious,
          delta: symbolData.rsiDelta
        };
      }

      results[symbol] = rsiData;
      
      if (onProgress) {
        // Simulamos asincronía mínima para que la UI de carga pueda renderizar el progreso suavemente si lo espera
        await new Promise(res => setTimeout(res, 10)); 
        onProgress(symbol, rsiData);
      }
    }
    return results;
  }
}

const rsiService = new RsiService();
export default rsiService;
