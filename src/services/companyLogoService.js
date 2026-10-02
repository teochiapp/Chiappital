// services/companyLogoService.js - Servicio para obtener logos de empresas
// Migrado de Clearbit (discontinuado dic 2025) a logo.dev + logostream.dev

class CompanyLogoService {
  constructor() {
    this.logoCache = new Map();

    // Mapeo simbolo a dominio para logo.dev
    this.symbolToDomain = {
      // ETFs
      'SPY': 'ssga.com',
      'QQQ': 'invesco.com',
      'DIA': 'ssga.com',
      'IWM': 'ishares.com',
      'VTI': 'vanguard.com',
      'VOO': 'vanguard.com',
      'ARKK': 'ark-invest.com',
      'GLD': 'spdrgoldshares.com',
      'TLT': 'ishares.com',
      'XLF': 'sectorspdrs.com',
      'XLE': 'sectorspdrs.com',
      'XLK': 'sectorspdrs.com',
      // Big Tech US
      'AAPL': 'apple.com',
      'GOOGL': 'google.com',
      'GOOG': 'google.com',
      'MSFT': 'microsoft.com',
      'AMZN': 'amazon.com',
      'TSLA': 'tesla.com',
      'META': 'meta.com',
      'FB': 'meta.com',
      'NFLX': 'netflix.com',
      'NVDA': 'nvidia.com',
      // Finanzas US
      'JPM': 'jpmorganchase.com',
      'BAC': 'bankofamerica.com',
      'WFC': 'wellsfargo.com',
      'GS': 'goldmansachs.com',
      'MS': 'morganstanley.com',
      'V': 'visa.com',
      'MA': 'mastercard.com',
      'PYPL': 'paypal.com',
      'SQ': 'squareup.com',
      // Otros US
      'BABA': 'alibaba.com',
      'JNJ': 'jnj.com',
      'WMT': 'walmart.com',
      'PG': 'pg.com',
      'UNH': 'unitedhealthgroup.com',
      'HD': 'homedepot.com',
      'DIS': 'disney.com',
      'ADBE': 'adobe.com',
      'CRM': 'salesforce.com',
      'ORCL': 'oracle.com',
      'NKE': 'nike.com',
      'INTC': 'intel.com',
      'AMD': 'amd.com',
      'UBER': 'uber.com',
      'SPOT': 'spotify.com',
      'SNAP': 'snap.com',
      'SHOP': 'shopify.com',
      'ROKU': 'roku.com',
      'PINS': 'pinterest.com',
      'COIN': 'coinbase.com',
      'HOOD': 'robinhood.com',
      'PLTR': 'palantir.com',
      'SOFI': 'sofi.com',
      'RIVN': 'rivian.com',
      'DDOG': 'datadoghq.com',
      'NET': 'cloudflare.com',
      'SNOW': 'snowflake.com',
      'ZM': 'zoom.us',
      'TWLO': 'twilio.com',
      'OKTA': 'okta.com',
      'MDB': 'mongodb.com',
      'CRWD': 'crowdstrike.com',
      'PANW': 'paloaltonetworks.com',
      'HUBS': 'hubspot.com',
      'ABNB': 'airbnb.com',
      'LYFT': 'lyft.com',
      'DASH': 'doordash.com',
      'MELI': 'mercadolibre.com',
      // Empresas argentinas (NYSE ADRs)
      'YPF': 'ypf.com',
      'YPFD': 'ypf.com',
      'GGAL': 'grupogalicia.com',
      'BMA': 'macro.com.ar',
      'TEO': 'telecom.com.ar',
      'TX': 'ternium.com',
      'PAM': 'pampaenergia.com',
      'PAMP': 'pampaenergia.com',
      'SUPV': 'supervielle.com.ar',
      'CEPU': 'centralpuerto.com',
      'LOMA': 'lomanegra.com',
      'IRCP': 'irsa.com.ar',
      // Empresas argentinas BYMA
      'GGAL.BA': 'grupogalicia.com',
      'YPF.BA': 'ypf.com',
      'PAMP.BA': 'pampaenergia.com',
      'ALUA.BA': 'aluar.com.ar',
      'TRAN.BA': 'transener.com.ar',
      'EDN.BA': 'edenor.com.ar',
      'TXAR.BA': 'ternium.com',
      'MIRG.BA': 'mirgor.com.ar',
      'LOMA.BA': 'lomanegra.com',
      'BYMA.BA': 'byma.com.ar',
      // Brasil
      'VALE': 'vale.com',
      'ITUB': 'itau.com.br',
      'ABEV': 'ambev.com.br',
      'BBD': 'bb.com.br',
      'PBR': 'petrobras.com.br',
      'NU': 'nu.com.br',
      // China
      'JD': 'jd.com',
      'BILI': 'bilibili.com',
      'NIO': 'nio.com',
      'XPEV': 'xiaopeng.com',
      'PDD': 'pdd.com',
    };
  }

  _buildCandidateUrls(symbol) {
    const upper = symbol.toUpperCase();
    const baseSymbol = upper.split('.')[0];
    const domain = this.symbolToDomain[upper];
    const urls = [];

    if (domain) {
      // logo.dev - sucesor oficial de clearbit (free tier sin key para uso basico)
      urls.push('https://img.logo.dev/' + domain + '?token=pk_public&size=128&format=png');
    }

    // logostream.dev - especializado en fintech/tickers
    urls.push('https://storage.googleapis.com/logostream-prod/' + upper + '.png');
    if (baseSymbol !== upper) {
      urls.push('https://storage.googleapis.com/logostream-prod/' + baseSymbol + '.png');
    }

    // financialmodelingprep CDN - sin key, imagenes publicas
    urls.push('https://financialmodelingprep.com/image-stock/' + upper + '.png');
    if (baseSymbol !== upper) {
      urls.push('https://financialmodelingprep.com/image-stock/' + baseSymbol + '.png');
    }

    // logo.dev con dominio inferido como ultimo recurso
    if (!domain) {
      urls.push('https://img.logo.dev/' + baseSymbol.toLowerCase() + '.com?token=pk_public&size=128&format=png');
    }

    return [...new Set(urls)];
  }

  _validateImageUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.src = '';
        resolve(false);
      }, 4000);

      img.onload = () => {
        clearTimeout(timer);
        // Rechazar pixeles placeholder 1x1
        resolve(img.naturalWidth > 1 && img.naturalHeight > 1);
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };

      img.src = url;
    });
  }

  async getCompanyLogo(symbol) {
    if (!symbol) return null;
    const upper = symbol.toUpperCase();

    if (this.logoCache.has(upper)) {
      return this.logoCache.get(upper);
    }

    try {
      const candidates = this._buildCandidateUrls(upper);

      for (const url of candidates) {
        const valid = await this._validateImageUrl(url);
        if (valid) {
          this.logoCache.set(upper, url);
          return url;
        }
      }

      this.logoCache.set(upper, null);
      return null;
    } catch (err) {
      console.warn('[LogoService] Error obteniendo logo para ' + symbol + ':', err);
      this.logoCache.set(upper, null);
      return null;
    }
  }

  clearCache() {
    this.logoCache.clear();
  }

  getCacheStats() {
    return {
      size: this.logoCache.size,
      entries: Array.from(this.logoCache.entries()),
    };
  }
}

const companyLogoService = new CompanyLogoService();
export default companyLogoService;
