/**
 * opScoreService.js
 * 
 * Servicio principal de cálculo del OP Score.
 */
const { generateConclusions } = require('./opScoreConclusions');

function calculateOpScore(setupState, data) {
  let score = 0;
  let rawScore = 0;
  let scoreCap = null;
  let isValid = true; // Assume valid unless structure breaks
  const conclusions = []; // Collect internal flags for conclusions
  const pushConclusion = (text) => conclusions.push(text);

  if (setupState === 'bullish_pullback') {
    // 1. BASE SCORE
    rawScore = 60;
    pushConclusion('BASE_PULLBACK:60');

    // 2. RELATIVE STRENGTH
    let rsScore = 0;
    const rsState = data.rsState || 'Neutral';
    const rsTrend = (data.rsValue !== undefined && data.rsPrevious !== undefined && data.rsValue !== null && data.rsPrevious !== null) 
                    ? (data.rsValue > data.rsPrevious ? 'IMPROVING' : (data.rsValue < data.rsPrevious ? 'DETERIORATING' : 'STABLE'))
                    : 'STABLE';
    
    if (rsState === 'Very Strong' || rsState === 'Strong & Rising') rsScore += 15;
    else if (rsState === 'Strong' || rsState === 'Strong but Weakening') rsScore += 10;
    else if (rsState === 'Positive') rsScore += 5;
    else if (rsState === 'Weak' || rsState === 'Weak but Recovering') rsScore -= 8;
    else if (rsState === 'Very Weak') rsScore -= 15;

    if (rsTrend === 'IMPROVING') rsScore += 5;
    else if (rsTrend === 'DETERIORATING') rsScore -= 5;
    
    rawScore += rsScore;
    pushConclusion(`RS:${rsScore}`);

    if (rsState === 'Very Weak') {
      if (rsTrend === 'DETERIORATING') {
        scoreCap = scoreCap === null ? 50 : Math.min(scoreCap, 50);
        pushConclusion('CAP_RS_WEAK_DETERIORATING');
      } else {
        scoreCap = scoreCap === null ? 60 : Math.min(scoreCap, 60);
        pushConclusion('CAP_RS_WEAK');
      }
    }

    // 3. VOLUME QUALITY
    let volScore = 0;
    let reboundVolScore = 0;
    if (data.recentCandles && data.recentCandles.length > 0) {
      // Pullback Volume
      const downDays = data.recentCandles.filter(c => c.isRed && c.rvol !== null);
      if (downDays.length > 0) {
        const avgRvol = downDays.reduce((sum, c) => sum + c.rvol, 0) / downDays.length;
        const maxRvol = Math.max(...downDays.map(c => c.rvol));
        
        let hasHeavyDrop = false;
        downDays.forEach(c => {
          const bodySize = Math.abs(c.close - c.open);
          if (c.rvol > 2 && data.atr14 && (bodySize / data.atr14) > 1.2) hasHeavyDrop = true; 
        });

        if (avgRvol < 0.8 && maxRvol < 1.3) { volScore += 7; pushConclusion('VOL_DRY:7'); }
        else if (avgRvol >= 0.8 && avgRvol < 1.2) { volScore += 2; pushConclusion('VOL_NORMAL:2'); }
        else if (avgRvol >= 1.2 && avgRvol < 1.5) { volScore -= 5; pushConclusion('VOL_ELEVATED:-5'); }
        else if (avgRvol >= 1.5 || hasHeavyDrop) { volScore -= 12; pushConclusion('VOL_HEAVY:-12'); }
      }

      // Rebound RVOL (current day)
      const current = data.recentCandles[data.recentCandles.length - 1];
      if (current && current.rvol !== null) {
        const isStrongClose = (current.close - current.low) / (current.high - current.low) > 0.7;
        if (current.rvol > 1.8) {
          if (current.isGreen && isStrongClose) { reboundVolScore += 8; pushConclusion('REBOUND_STRONG:8'); }
          else { reboundVolScore -= 2; pushConclusion('REBOUND_REJECTED:-2'); }
        } else if (current.rvol >= 1.2 && current.rvol <= 1.8) {
          if (current.isGreen) { reboundVolScore += 5; pushConclusion('REBOUND_POSITIVE:5'); }
        } else if (current.rvol < 0.8) {
          reboundVolScore -= 2; pushConclusion('REBOUND_WEAK:-2');
        }
      }
    }
    rawScore += volScore + reboundVolScore;

    // 4. MACD (Mutually Exclusive States)
    let macdScore = 0;
    if (data.macd && data.macd.current !== null && data.macd.prevMacd !== null) {
      const { current, signal, hist, prevMacd, prevSignal, prevHist } = data.macd;
      
      const isBullishCross = prevMacd <= prevSignal && current > signal;
      const isBullishAccel = current > signal && hist > prevHist;
      const isBullishDecel = current > signal && hist < prevHist;
      const isBearishDecel = current < signal && hist > prevHist;
      const isBearishAccel = current < signal && hist < prevHist;

      if (isBullishCross) { macdScore = 12; pushConclusion('MACD_BULLISH_CROSS:12'); }
      else if (isBullishAccel) { macdScore = 10; pushConclusion('MACD_BULLISH_ACCEL:10'); }
      else if (isBullishDecel) { macdScore = 5; pushConclusion('MACD_BULLISH_DECEL:5'); }
      else if (isBearishDecel) { macdScore = 3; pushConclusion('MACD_BEARISH_DECEL:3'); }
      else if (isBearishAccel) { macdScore = -10; pushConclusion('MACD_BEARISH_ACCEL:-10'); }
    }
    rawScore += macdScore;

    // 5. RSI HEALTH
    let rsiScore = 0;
    if (data.rsiDaily) {
      if (data.rsiDaily >= 50 && data.rsiDaily <= 70) rsiScore += 3;
      else if (data.rsiDaily >= 30 && data.rsiDaily < 40) rsiScore -= 2;
      else if (data.rsiDaily >= 75 && data.rsiDaily <= 80) rsiScore -= 5;
      else if (data.rsiDaily > 80) {
        rsiScore -= 10;
        pushConclusion('WARN_RSI_EXTENDED');
      }
    }
    rawScore += rsiScore;
    if (rsiScore !== 0) pushConclusion(`RSI:${rsiScore}`);

    // 6. LONG TERM HEALTH
    let ltScore = 0;
    if (data.price && data.ema200 && data.drawdown52w !== null && data.drawdown52w !== undefined) {
      if (data.price > data.ema200 && data.drawdown52w >= -10 && (data.rsiWeekly > 55 || !data.rsiWeekly)) { ltScore = 12; pushConclusion('LT_EXCELLENT:12'); }
      else if (data.price > data.ema200 && data.drawdown52w >= -25) { ltScore = 6; pushConclusion('LT_HEALTHY:6'); }
      else if (data.price < data.ema200 && data.drawdown52w < -50 && (data.rsiWeekly < 45 || !data.rsiWeekly)) { 
        ltScore = -15; 
        scoreCap = scoreCap === null ? 45 : Math.min(scoreCap, 45);
        pushConclusion('LT_POOR:-15'); 
        pushConclusion('CAP_LT_POOR');
      }
      else if (data.price < data.ema200 && data.drawdown52w < -35) { ltScore = -8; pushConclusion('LT_WEAK:-8'); }
      else { ltScore = 0; pushConclusion('LT_NEUTRAL:0'); }
    }
    rawScore += ltScore;

    // 7. PRICE ACTION, FLAGS & DEEP PULLBACK
    let paScore = 0;
    if (data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];
      const range = current.high - current.low || 0.0001;
      const body = Math.abs(current.close - current.open);
      const lowerWick = Math.min(current.open, current.close) - current.low;
      const upperWick = current.high - Math.max(current.open, current.close);
      
      const isHammer = lowerWick >= (2 * body) && upperWick < body && (body / range) < 0.4 && current.low <= data.ema21 && current.close > data.ema21;
      const isUpperWick = upperWick / range > 0.6;
      const isWeakClose = (current.close - current.low) / range < 0.3;
      const isStrongClose = (current.close - current.low) / range > 0.7;
      const isGiantBear = current.isRed && data.atr14 && range > (1.5 * data.atr14);

      if (isHammer) { paScore += 3; pushConclusion('FLAG_HAMMER:3'); }
      if (isStrongClose) { paScore += 3; pushConclusion('FLAG_STRONG_CLOSE:3'); }
      
      if (isUpperWick && !isWeakClose) { paScore -= 5; pushConclusion('FLAG_UPPER_WICK:-5'); }
      if (isWeakClose) { paScore -= 5; pushConclusion('FLAG_WEAK_CLOSE:-5'); }
      
      if (isGiantBear) {
        if (isWeakClose) {
          paScore -= 10; pushConclusion('FLAG_GIANT_BEAR:-10');
          if (current.rvol > 2) {
            scoreCap = scoreCap === null ? 50 : Math.min(scoreCap, 50);
            pushConclusion('CAP_DISTRIBUTION');
          }
        }
      }

      // Confluencia EMA21 y SMA30
      if (data.ema21AboveSma30Pct !== null && Math.abs(data.ema21AboveSma30Pct) < 0.5 && isStrongClose && current.low <= data.ema21 && current.close > data.ema21) {
        paScore += 5; pushConclusion('FLAG_CONFLUENCE_SUPPORT:5');
      }

      // Profundidad real del Pullback (Lowest Low vs EMA21)
      const lowestLow = Math.min(...data.recentCandles.map(c => c.low));
      if (data.atr14 && data.ema21 && lowestLow < data.ema21) {
        const atrDepth = (data.ema21 - lowestLow) / data.atr14;
        if (atrDepth >= 1.5 && atrDepth <= 2) {
           paScore -= 10; pushConclusion('FLAG_DEEP_PULLBACK_ATR:-10');
        } else if (atrDepth > 2) {
           scoreCap = scoreCap === null ? 50 : Math.min(scoreCap, 50);
           pushConclusion('CAP_DEEP_PULLBACK');
        }
      }

      // Invalidación (Breakout de medias)
      if (current.close < data.ema21 && current.close < data.sma30) {
        const distanceToMedia = Math.min(data.ema21, data.sma30) - current.close;
        if (data.atr14 && distanceToMedia > (0.5 * data.atr14)) {
          isValid = false;
          pushConclusion('INVALID_BREAK_SUPPORT');
        }
      }
    }
    rawScore += paScore;

    score = rawScore;
  } else {
    // Otros setups por defecto... 0
  }

  // APPLY CAPS
  if (scoreCap !== null && score > scoreCap) {
    pushConclusion(`CAPPED_AT:${scoreCap}`);
    score = scoreCap;
  }

  // Generar conclusiones legibles pasándole los internal flags generados
  const finalConclusions = generateConclusions(setupState, data, conclusions, isValid);

  return {
    valid: isValid,
    rawScore: Math.round(rawScore),
    scoreCap: scoreCap,
    score: Math.round(score), // finalScore
    conclusions: finalConclusions
  };
}

module.exports = {
  calculateOpScore
};
