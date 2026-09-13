// services/apiService.js - Servicio para conectar con el backend Express
import config from '../config/environment';

class ApiService {
  constructor() {
    this.baseURL = `${config.API_URL}/api`;
    this.token = null;
    this.initializeToken();
  }

  // Inicializar token desde localStorage
  initializeToken() {
    try {
      const storedToken = localStorage.getItem('st_token');
      const tokenExpiry = localStorage.getItem('st_token_expiry');

      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        if (tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10);
          if (Date.now() >= expiryTime) {
            console.log('🔓 Token expirado, limpiando...');
            this.clearToken();
            return;
          }
        }
        this.token = storedToken;
        console.log('🔐 Token cargado desde localStorage');
      } else {
        this.token = null;
      }
    } catch (error) {
      console.error('Error cargando token:', error);
      this.token = null;
    }
  }

  // Guardar token en localStorage
  setToken(token) {
    this.token = token;
    localStorage.setItem('st_token', token);
    // Expiración: 7 días
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('st_token_expiry', expiryTime.toString());
    console.log('🔐 Token guardado');
  }

  // Limpiar token y datos de sesión
  clearToken() {
    this.token = null;
    localStorage.removeItem('st_token');
    localStorage.removeItem('st_token_expiry');
    localStorage.removeItem('st_user');
    // También limpiar claves viejas de Strapi por si quedan
    localStorage.removeItem('strapi_token');
    localStorage.removeItem('strapi_token_expiry');
    localStorage.removeItem('strapi_user');
    console.log('🔓 Sesión cerrada');
  }

  // Headers por defecto
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // ─── Autenticación ──────────────────────────────────────────────────────────

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (data.jwt) {
        this.setToken(data.jwt);
        localStorage.setItem('st_user', JSON.stringify(data.user));
        return { success: true, user: data.user, token: data.jwt };
      }

      return {
        success: false,
        error: data.error?.message || data.message || 'Credenciales incorrectas'
      };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }

  async familyLogin(answer) {
    console.log('🚀 Iniciando petición familyLogin...');
    console.log('🌍 Base URL configurada:', this.baseURL);
    console.log('🔗 URL completa de la petición:', `${this.baseURL}/auth/family`);

    try {
      const response = await fetch(`${this.baseURL}/auth/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });


      const data = await response.json();

      if (data.jwt) {
        this.setToken(data.jwt);
        localStorage.setItem('st_user', JSON.stringify(data.user));
        return { success: true, user: data.user, token: data.jwt };
      }

      return {
        success: false,
        error: data.error?.message || data.message || 'Respuesta incorrecta'
      };
    } catch (error) {
      console.error('❌ Error en petición familyLogin:', error.message || error);
      console.log('ℹ️ NOTA: Si el error es TypeError: Failed to fetch y en consola ves ERR_CERT_COMMON_NAME_INVALID, significa que el certificado SSL no es válido para ese dominio (posiblemente al usar un sub-subdominio en Hostinger sin un certificado SSL configurado para el mismo).');
      console.log('URL intentada:', `${this.baseURL}/auth/family`);
      console.dir(error); // Muestra las propiedades del error en más detalle
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }

  // ─── CRUD de Trades ─────────────────────────────────────────────────────────

  async getTrades(accountType = 'propia') {
    if (!this.token) throw new Error('Usuario no autenticado. Por favor inicia sesión.');

    const response = await fetch(`${this.baseURL}/trades?account_type=${accountType}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      throw new Error(errorData.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async createTrade(tradeData, accountType = 'propia') {
    if (!this.token) throw new Error('Usuario no autenticado. Por favor inicia sesión.');

    const dataWithAccount = { ...tradeData, account_type: accountType };

    const response = await fetch(`${this.baseURL}/trades`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ data: dataWithAccount }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async updateTrade(tradeId, tradeData) {
    if (!this.token) throw new Error('No estás autenticado. Por favor, inicia sesión.');

    const response = await fetch(`${this.baseURL}/trades/${tradeId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ data: tradeData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
      }
      throw new Error(errorData.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async deleteTrade(tradeId) {
    if (!this.token) throw new Error('Usuario no autenticado. Por favor inicia sesión.');

    const response = await fetch(`${this.baseURL}/trades/${tradeId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar trade: ${response.status}`);
    }

    return true;
  }

  // Cerrar trade (apoyo para venta total o venta parcial)
  async closeTrade(tradeId, exitPrice, result, notes = '', partialData = null) {
    if (partialData && partialData.isPartial && partialData.originalTrade) {
      const origTrade = partialData.originalTrade;
      const getAttr = (attr) => (origTrade.attributes ? origTrade.attributes[attr] : origTrade[attr]);

      const origPctVal = getAttr('portfolio_percentage');
      const origPct = origPctVal !== null && origPctVal !== undefined && !isNaN(parseFloat(origPctVal))
        ? parseFloat(origPctVal)
        : null;

      const soldPositionPercent = parseFloat(partialData.soldPositionPercent) || 100;
      
      let soldPct = null;
      let remPct = null;

      if (origPct !== null) {
        soldPct = parseFloat((origPct * (soldPositionPercent / 100)).toFixed(4));
        remPct = parseFloat((origPct - soldPct).toFixed(4));
      }

      // 1. Actualizar la posición abierta existente con el % de cartera remanente
      await this.updateTrade(tradeId, {
        portfolio_percentage: remPct,
      });

      // 2. Registrar el nuevo trade cerrado por la porción vendida
      const closedNotes = notes 
        ? `${notes} (Venta parcial ${soldPositionPercent}% de la posición)`
        : `Venta parcial (${soldPositionPercent}% de la posición)`;

      const closedTradeData = {
        symbol: getAttr('symbol'),
        type: getAttr('type'),
        account_type: getAttr('account_type') || 'propia',
        entry_price: parseFloat(getAttr('entry_price')),
        entry_price_ars: getAttr('entry_price_ars') ? parseFloat(getAttr('entry_price_ars')) : null,
        exit_price: parseFloat(exitPrice),
        portfolio_percentage: soldPct,
        stop_loss: getAttr('stop_loss') ? parseFloat(getAttr('stop_loss')) : null,
        take_profit: getAttr('take_profit') ? parseFloat(getAttr('take_profit')) : null,
        strategy: getAttr('strategy') || null,
        emotions: getAttr('emotions') || null,
        custom_country: getAttr('custom_country') || null,
        custom_sector: getAttr('custom_sector') || null,
        status: 'closed',
        result: parseFloat(result),
        closed_at: new Date().toISOString(),
        notes: closedNotes,
      };

      return await this.createTrade(closedTradeData, getAttr('account_type') || 'propia');
    }

    return this.updateTrade(tradeId, {
      exit_price: exitPrice,
      result: result,
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes: notes || null,
    });
  }

  // Estadísticas calculadas del lado del cliente
  async getTradeStats(accountType = 'propia') {
    const trades = await this.getTrades(accountType);

    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0, openTrades: 0, closedTrades: 0,
        winningTrades: 0, losingTrades: 0, winRate: 0,
        totalProfit: 0, averageWin: 0, averageLoss: 0, profitFactor: 0
      };
    }

    const calculateTradeResult = (trade) => {
      const entryPrice = parseFloat(trade.entry_price);
      const exitPrice = parseFloat(trade.exit_price);
      if (!entryPrice || !exitPrice) return 0;
      return trade.type === 'buy'
        ? ((exitPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - exitPrice) / entryPrice) * 100;
    };

    const closedTrades = trades.filter(t => t.status === 'closed');
    const openTrades = trades.filter(t => t.status === 'open');
    const tradesWithResults = closedTrades.map(t => ({
      ...t,
      calculatedResult: calculateTradeResult(t)
    }));

    const winningTrades = tradesWithResults.filter(t => t.calculatedResult > 0);
    const losingTrades = tradesWithResults.filter(t => t.calculatedResult < 0);
    const totalProfit = tradesWithResults.reduce((sum, t) => sum + t.calculatedResult, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.calculatedResult, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.calculatedResult, 0));

    return {
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalProfit,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0
    };
  }

  // Verificar autenticación
  async checkAuth() {
    if (!this.token) {
      this.initializeToken();
    }
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseURL}/users/me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) this.clearToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verificando auth:', error);
      this.clearToken();
      return false;
    }
  }

  // Obtener perfil del usuario autenticado
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/users/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo perfil: ${response.status}`);
    }

    return response.json();
  }

  // ─── BALANCES ────────────────────────────────────────────────────────────

  async getBalance(accountType = 'propia') {
    if (!this.token) throw new Error('Usuario no autenticado.');
    const response = await fetch(`${this.baseURL}/balances?account_type=${accountType}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching balance');
    return response.json();
  }

  async updateBalance(accountType, totalUsd) {
    if (!this.token) throw new Error('Usuario no autenticado.');
    const response = await fetch(`${this.baseURL}/balances`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ account_type: accountType, total_usd: totalUsd })
    });
    if (!response.ok) throw new Error('Error updating balance');
    return response.json();
  }

  // ─── LAB PREFERENCES ──────────────────────────────────────────────────────

  async getLabPreferences() {
    if (!this.token) throw new Error('Usuario no autenticado.');
    const response = await fetch(`${this.baseURL}/lab/preferences`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching lab preferences');
    return response.json();
  }

  async updateLabPreferences(preferences) {
    if (!this.token) throw new Error('Usuario no autenticado.');
    const response = await fetch(`${this.baseURL}/lab/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Error updating lab preferences');
    return response.json();
  }
}

// Singleton
const apiService = new ApiService();

export default apiService;
