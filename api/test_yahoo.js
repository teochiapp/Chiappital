const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance({ validation: { logErrors: false } });

async function searchYahoo() {
  try {
    const results = await yahooFinance.chart('EA.BA', { period1: '2024-01-01', interval: '1d' });
    console.log("Quotes EA.BA count:", results.quotes.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

searchYahoo();
