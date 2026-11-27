function maxDrawdown52w(closes) {
  let peak = 0;
  let worst = 0;
  let count = 0;
  for (const close of closes) {
    if (!(close > 0) || !Number.isFinite(close)) continue;
    count++;
    peak = Math.max(peak, close);
    worst = Math.min(worst, (close / peak - 1) * 100);
  }
  return count >= 52 ? worst : null;
}
module.exports = { maxDrawdown52w };
