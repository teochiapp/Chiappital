import apiService from './apiService';

/**
 * Servicio para conectarse al motor de backtesting unitario (Fase 1).
 */
class BacktestingService {
  /**
   * Ejecuta el backtest para un ticker.
   *
   * @param {string} ticker
   * @param {Object} config - Parámetros del backtest
   * @param {string} config.startDate - YYYY-MM-DD
   * @param {string} config.endDate - YYYY-MM-DD
   * @param {number} config.initialCapital
   * @param {number} config.positionSizePct
   * @param {number} config.commission
   * @param {number} config.slippage
   * @param {number} config.entryScoreThreshold
   * @param {number} config.exitScoreThreshold
   * @param {number} config.stopLossPct
   * @param {number} config.takeProfitPct
   * @param {boolean} config.debug
   */
  async runBacktest(ticker, config = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar solo los parámetros definidos
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = `${apiService.baseURL}/backtesting/${ticker}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: apiService.getHeaders()
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}: Error al ejecutar el backtest`);
      }

      return await response.json();
    } catch (error) {
      console.error(`BacktestingService Error (${ticker}):`, error);
      throw error;
    }
  }
}

const backtestingService = new BacktestingService();
export default backtestingService;
