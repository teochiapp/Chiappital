const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    const result = await yahooFinance.quote(['LMND', 'AAPL']);
    console.log(result.map(r => ({
      symbol: r.symbol,
      marketCap: r.marketCap,
      averageVolume: r.averageVolume,
      regularMarketVolume: r.regularMarketVolume
    })));
  } catch (e) {
    console.error(e);
  }
}
test();
