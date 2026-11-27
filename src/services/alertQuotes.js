// A recent fetch does not guarantee a recent trade. Validate provider timestamps.
export function canEvaluateAlertQuote(quote, now = Date.now()) {
  const time = new Date(quote?.quoteTime || '').getTime();
  return Number.isFinite(quote?.price) && quote.price > 0
    && quote.marketState === 'REGULAR'
    && quote.delayedMinutes != null && Number(quote.delayedMinutes) === 0
    && Number.isFinite(time) && now - time <= 120000 && time <= now + 30000;
}
