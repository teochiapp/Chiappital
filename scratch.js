const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance({ validation: { logErrors: false } });

function calculateSMAArray(data, period) {
  if (!data || data.length < period) return [];
  let smaArray = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      smaArray[i] = sum / period;
    }
  }
  return smaArray;
}

async function run() {
  const data = await yahooFinance.chart('PANW', { period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], interval: '1d' });
  const closes = data.quotes.map(q => q.close).filter(c => c !== null);
  
  const sma30 = calculateSMAArray(closes, 30).pop();
  const sma50 = calculateSMAArray(closes, 50).pop();
  
  const wData = await yahooFinance.chart('PANW', { period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], interval: '1wk' });
  const wCloses = wData.quotes.map(q => q.close).filter(c => c !== null);
  const wSma30 = calculateSMAArray(wCloses, 30).pop();
  
  console.log("Daily SMA30:", sma30);
  console.log("Daily SMA50:", sma50);
  console.log("Weekly SMA30:", wSma30);
}
run();
