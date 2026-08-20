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

  } else if (setupState === 'lateral_trend') {
    // ─── LATERAL TREND OP SCORE ───────────────────────────────────────────────
    // Filosofía: el Score responde "¿hay ventaja operativa dentro de este rango?"
    // No "¿qué tan buena es esta empresa en términos absolutos?"

    // 1. BASE SCORE
    rawScore = 40;
    pushConclusion('BASE_LATERAL:40');

    // 2. MICRO-RANGE POSITION
    // NOTA: recentCandles tiene 10 velas (~2 semanas). Esto es un microRange,
    // NO un rango lateral histórico real. Se usa como proxy de posición relativa.
    // En versiones futuras, recentCandles se extenderá a 30 velas.
    let rangePosition = 0.5; // default: centro
    let rangeLow = null;
    let rangeHigh = null;
    let rangeZone = 'RANGE_CENTER';

    if (data.recentCandles && data.recentCandles.length > 0) {
      rangeLow = Math.min(...data.recentCandles.map(c => c.low));
      rangeHigh = Math.max(...data.recentCandles.map(c => c.high));
      const rangeWidth = rangeHigh - rangeLow;

      if (rangeWidth > 0 && data.price) {
        rangePosition = (data.price - rangeLow) / rangeWidth;
        rangePosition = Math.max(0, Math.min(1, rangePosition)); // clamp 0–1
      }

      if (rangePosition <= 0.20)      rangeZone = 'RANGE_LOW';
      else if (rangePosition <= 0.40) rangeZone = 'RANGE_LOWER_HALF';
      else if (rangePosition <= 0.60) rangeZone = 'RANGE_CENTER';
      else if (rangePosition <= 0.80) rangeZone = 'RANGE_UPPER_HALF';
      else                            rangeZone = 'RANGE_HIGH';
    }
    pushConclusion(rangeZone);

    // 3. BONUS / PENALIZACIÓN POR ZONA
    let zoneScore = 0;
    if      (rangeZone === 'RANGE_LOW')         { zoneScore =  8; pushConclusion('LATERAL_LOW_ZONE:8'); }
    else if (rangeZone === 'RANGE_LOWER_HALF')  { zoneScore =  3; pushConclusion('LATERAL_LOW_ZONE:3'); }
    else if (rangeZone === 'RANGE_CENTER')      { pushConclusion('LATERAL_CENTER_WAIT'); }
    else if (rangeZone === 'RANGE_HIGH')        { zoneScore = -5; pushConclusion('LATERAL_HIGH_ZONE:-5'); }
    rawScore += zoneScore;

    // 4. CONFIRMACIONES ZONA BAJA (solo si rangePosition < 0.40)
    let reboundScore = 0;
    if (rangePosition < 0.40 && data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];

      // RSI en zona de recuperación (35–50: abajo sin estar colapsado)
      if (data.rsiDaily !== null && data.rsiDaily >= 35 && data.rsiDaily < 50) {
        reboundScore += 4;
        pushConclusion('LATERAL_REBOUND_RSI:4');
      }

      // MACD mejorando (histograma creciendo, bullish o bearish decel)
      if (data.macd && data.macd.hist !== null && data.macd.prevHist !== null) {
        if (data.macd.hist > data.macd.prevHist) {
          reboundScore += 4;
          pushConclusion('LATERAL_REBOUND_MACD:4');
        }
      }

      // Price action reinterpretada para lateral
      if (current) {
        const range    = current.high - current.low || 0.0001;
        const body     = Math.abs(current.close - current.open);
        const lowerWick = Math.min(current.open, current.close) - current.low;
        const upperWick = current.high - Math.max(current.open, current.close);

        // Hammer en lateral: no requiere close > EMA21 (precio puede estar bajo las medias)
        // Solo pide estructura de martillo + low cerca del piso del microRange
        const isHammer = lowerWick >= (2 * body) && upperWick < body && (body / range) < 0.5;
        const isNearRangeLow = rangeLow !== null && current.low <= rangeLow * 1.02;

        if (isHammer && isNearRangeLow) {
          reboundScore += 4;
          pushConclusion('LATERAL_REBOUND_HAMMER:4');

          // Bonus adicional si ADEMÁS el precio recupera la EMA21
          if (data.ema21 && current.close > data.ema21) {
            reboundScore += 2;
            pushConclusion('LATERAL_REBOUND_EMA21_RECOVERY:2');
          }
        } else {
          // Strong close sin hammer (señal más débil)
          const isStrongClose = (current.close - current.low) / range > 0.65;
          if (isStrongClose && current.isGreen) {
            reboundScore += 3;
            pushConclusion('LATERAL_REBOUND_PRICE_ACTION:3');
          }
        }

        // Volumen de rebote: vela verde con RVOL > 1.3
        if (current.isGreen && current.rvol !== null && current.rvol > 1.3) {
          reboundScore += 4;
          pushConclusion('LATERAL_REBOUND_VOLUME:4');
        }
      }

      // Cap duro de la sección de confirmaciones
      reboundScore = Math.min(reboundScore, 15);
    }
    rawScore += reboundScore;

    // 5. ZONA ALTA — señales de riesgo (solo si rangePosition >= 0.80)
    let highZonePenalty = 0;
    if (rangePosition >= 0.80 && data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];

      // RSI elevado en zona de resistencia → agotamiento posible
      if (data.rsiDaily !== null && data.rsiDaily > 60) {
        highZonePenalty -= 5;
        pushConclusion('LATERAL_RSI_OVERBOUGHT_FALLING:-5');
      }

      // MACD bajista acelerando cerca del techo
      if (data.macd && data.macd.hist !== null && data.macd.prevHist !== null) {
        if (data.macd.hist < 0 && data.macd.hist < data.macd.prevHist) {
          highZonePenalty -= 5;
          pushConclusion('LATERAL_MACD_BEARISH_ACCEL:-5');
        }
      }

      // Price action en zona alta
      if (current) {
        const range     = current.high - current.low || 0.0001;
        const upperWick = current.high - Math.max(current.open, current.close);
        const isUpperWick  = upperWick / range > 0.5;
        const isWeakClose  = (current.close - current.low) / range < 0.3;

        if (isUpperWick)   { highZonePenalty -= 5; pushConclusion('LATERAL_REJECTION_WICK:-5'); }
        if (isWeakClose)   { highZonePenalty -= 4; pushConclusion('LATERAL_WEAK_CLOSE_HIGH:-4'); }
        if (current.isRed && current.rvol !== null && current.rvol > 1.5) {
          highZonePenalty -= 5;
          pushConclusion('LATERAL_RVOL_REJECTION:-5');
        }
      }

      // Cap duro de penalización zona alta
      highZonePenalty = Math.max(highZonePenalty, -15);

      pushConclusion('LATERAL_HIGH_ZONE');
      pushConclusion('LATERAL_RESISTANCE_RISK');
    }
    rawScore += highZonePenalty;

    // 6. BREAKOUT PRESSURE (moderado, no convierte en breakout)
    // Requiere: precio en 75%+ del microRange Y realmente presionando el techo (<= 0.5 ATR)
    if (rangePosition >= 0.75 && data.atr14 && rangeHigh !== null && data.price) {
      const distanceToRangeHigh = rangeHigh - data.price;
      const isPressingHigh = distanceToRangeHigh <= 0.5 * data.atr14;

      if (isPressingHigh) {
        let bpSignals = 0;
        if (data.rsiDaily !== null && data.rsiDaily > 50) bpSignals++;
        if (data.macd && data.macd.hist !== null && data.macd.prevHist !== null && data.macd.hist > data.macd.prevHist) bpSignals++;
        const currentCandle = data.recentCandles[data.recentCandles.length - 1];
        if (currentCandle && currentCandle.isGreen && currentCandle.rvol !== null && currentCandle.rvol > 1.2) bpSignals++;

        if (bpSignals >= 2) {
          rawScore += 6;
          pushConclusion('LATERAL_BREAKOUT_PRESSURE:6');
        }
      }
    }

    // 7. RELATIVE STRENGTH — peso reducido (máx ±5 total)
    // En lateral el RS informa si el activo muestra algo de fortaleza relativa,
    // no reemplaza la ausencia de tendencia.
    let rsScore = 0;
    const rsState   = data.rsState || 'Neutral';
    const rsTrend   = (data.rsValue !== undefined && data.rsPrevious !== undefined &&
                       data.rsValue !== null     && data.rsPrevious !== null)
      ? (data.rsValue > data.rsPrevious ? 'IMPROVING' : (data.rsValue < data.rsPrevious ? 'DETERIORATING' : 'STABLE'))
      : 'STABLE';

    if      (rsState === 'Very Strong' || rsState === 'Strong & Rising')    rsScore += 4;
    else if (rsState === 'Strong'      || rsState === 'Strong but Weakening') rsScore += 3;
    else if (rsState === 'Positive')                                          rsScore += 2;
    else if (rsState === 'Weak'        || rsState === 'Weak but Recovering')  rsScore -= 2;
    else if (rsState === 'Very Weak'   || rsState === 'Weak & Falling')       rsScore -= 4;

    if      (rsTrend === 'IMPROVING')    rsScore += 1;
    else if (rsTrend === 'DETERIORATING') rsScore -= 1;

    rawScore += rsScore;
    if (rsScore !== 0) pushConclusion(`LATERAL_RS_BONUS:${rsScore}`);

    // Cap adicional por RS muy débil (encadenado con Math.min para no pisarse con otros caps)
    if ((rsState === 'Very Weak' || rsState === 'Weak & Falling') && rsTrend === 'DETERIORATING') {
      scoreCap = scoreCap === null ? 45 : Math.min(scoreCap, 45);
      pushConclusion('CAP_RS_WEAK_DETERIORATING');
    }

    // 8. SCORE CAPS ESPECÍFICOS PARA LATERAL
    // Se aplica el menor cap entre el de la zona y cualquier cap de riesgo ya asignado.
    let lateralZoneCap;
    if (rangeZone === 'RANGE_HIGH') {
      lateralZoneCap = 45;
    } else if (rangeZone === 'RANGE_LOW' || rangeZone === 'RANGE_LOWER_HALF') {
      // Zona baja con confirmaciones fuertes puede llegar a 65; sin ellas, 60
      lateralZoneCap = reboundScore > 8 ? 65 : 60;
    } else {
      // Centro y mitad alta: techo moderado
      lateralZoneCap = 52;
    }
    scoreCap = scoreCap === null ? lateralZoneCap : Math.min(scoreCap, lateralZoneCap);

    score = rawScore;

  } else if (setupState === 'late_bullish' || setupState === 'strong_uptrend_extended') {
    // ─── LATE BULLISH OP SCORE ─────────────────────────────────────────────────
    // Filosofía: "La tendencia es buena, pero la entrada ya está avanzada."
    // El Score mide "¿qué tan atractiva es la entrada AHORA?", no "¿qué tan buena es la tendencia?"
    // NOTA: 'late_bullish' y 'strong_uptrend_extended' se mapean al mismo cálculo.
    // Si el estado se renombra en marketSyncService, ambos siguen funcionando.

    // 1. BASE SCORE
    rawScore = 35;
    pushConclusion('BASE_LATE_BULLISH:35');

    // 2. EMA21 EXTENSION — factor principal
    // Representa cuánto se alejó el precio del soporte dinámico clave.
    const ema21Dist = (data.ema21Distance !== undefined && data.ema21Distance !== null)
      ? data.ema21Distance
      : 0;
    let ema21ExtScore = 0;

    if (ema21Dist < 5) {
      ema21ExtScore = 3;
      pushConclusion('LATE_NEAR_EMA:3');
    } else if (ema21Dist >= 5 && ema21Dist < 8) {
      // Zona moderada: sin penalización ni bonus
    } else if (ema21Dist >= 8 && ema21Dist < 12) {
      ema21ExtScore = -5;
      pushConclusion('LATE_MODERATELY_EXTENDED:-5');
    } else if (ema21Dist >= 12 && ema21Dist < 18) {
      ema21ExtScore = -10;
      pushConclusion('LATE_EXTENDED:-10');
    } else {
      ema21ExtScore = -15;
      pushConclusion('LATE_VERY_EXTENDED:-15');
    }
    rawScore += ema21ExtScore;

    // 3. SMA30 EXTENSION — confirmación secundaria
    // Solo penaliza si AMBAS medias están muy alejadas del precio para no duplicar la penalización leve.
    let sma30Score = 0;
    if (data.price && data.sma30 && data.sma30 > 0) {
      const sma30DistPct = ((data.price - data.sma30) / data.sma30) * 100;
      if (sma30DistPct > 15 && ema21Dist > 10) {
        sma30Score = -5;
        pushConclusion('LATE_SMA_EXTENSION:-5');
      }
    }
    rawScore += sma30Score;

    // 4. RSI — penaliza momentum maduro, no penaliza tendencia fuerte en zona saludable
    let rsiScore = 0;
    const rsiD = data.rsiDaily || null;
    let macdDeteriorating = false;

    if (rsiD !== null) {
      if (rsiD >= 70 && rsiD <= 75) {
        rsiScore = -3;
        pushConclusion('LATE_RSI_EXTENDED:-3');
      } else if (rsiD > 75 && rsiD <= 80) {
        rsiScore = -7;
        pushConclusion('LATE_RSI_OVERBOUGHT:-7');
      } else if (rsiD > 80) {
        rsiScore = -10;
        pushConclusion('LATE_RSI_OVERBOUGHT:-10');
      }
    }
    rawScore += rsiScore;

    // 5. MACD / MOMENTUM
    // En late_bullish, MACD positivo confirma que la tendencia vive.
    // La pregunta principal es si está perdiendo fuerza.
    let macdScore = 0;
    if (data.macd && data.macd.current !== null && data.macd.prevHist !== null) {
      const { current, signal, hist, prevMacd, prevSignal, prevHist } = data.macd;

      const isBullishCross  = prevMacd !== null && prevSignal !== null && prevMacd <= prevSignal && current > signal;
      const isBullishAccel  = current > signal && hist > prevHist;
      const isBullishDecel  = current > signal && hist <= prevHist;
      const isBearishAccel  = current < signal && hist < prevHist;
      const isBearish       = current < signal;

      if (isBullishCross || isBullishAccel) {
        // MACD saludable: neutral en este contexto (la tendencia sigue)
        pushConclusion('LATE_MACD_HEALTHY');
      } else if (isBullishDecel) {
        macdScore = -3;
        macdDeteriorating = true;
        pushConclusion('LATE_MACD_DECELERATING:-3');
      } else if (isBearishAccel) {
        macdScore = -8;
        macdDeteriorating = true;
        pushConclusion('LATE_MACD_BEARISH_ACCEL:-8');
      } else if (isBearish) {
        macdScore = -5;
        macdDeteriorating = true;
        pushConclusion('LATE_MACD_BEARISH:-5');
      }
    }
    rawScore += macdScore;

    // 6. DISTANCIA A 52W HIGH
    // drawdown52w: 0 = en máximos, negativo = alejado de máximos
    let highScore = 0;
    if (data.drawdown52w !== null && data.drawdown52w !== undefined) {
      const dd = data.drawdown52w;
      if (dd >= -3) {
        // Prácticamente en máximos de 52 semanas
        if (ema21Dist > 18) {
          highScore = -8;
          pushConclusion('LATE_52W_EXTENSION:-8');
        } else if (ema21Dist > 12) {
          highScore = -5;
          pushConclusion('LATE_AT_52W_HIGH:-5');
        } else {
          // Cerca de máximos pero no extendido → posible consolidación en marcha
          pushConclusion('LATE_NEAR_52W_HIGH');
        }
      } else if (dd >= -8) {
        // Moderadamente cerca de máximos: informativo
        pushConclusion('LATE_NEAR_52W_HIGH');
      }
    }
    rawScore += highScore;

    // 7. PRICE ACTION + VOLUME
    let paScore = 0;
    let exhaustionSignals = 0;
    // Pre-cargar señales de extensión para el contador de exhaustion
    if (ema21Dist > 12) exhaustionSignals++;
    if (rsiD !== null && rsiD > 70) exhaustionSignals++;
    if (macdDeteriorating) exhaustionSignals++;

    if (data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];
      if (current) {
        const range       = current.high - current.low || 0.0001;
        const upperWick   = current.high - Math.max(current.open, current.close);
        const isUpperWick  = upperWick / range > 0.5;
        const isWeakClose  = (current.close - current.low) / range < 0.3;
        const isStrongClose = (current.close - current.low) / range > 0.7;
        const isGiantCandle = data.atr14 && (current.high - current.low) > 1.5 * data.atr14;
        const rvol = current.rvol !== null ? current.rvol : (data.currentRVol || null);

        // Upper wick: rechazo en zona extendida
        if (isUpperWick) {
          paScore -= 5;
          exhaustionSignals++;
          pushConclusion('LATE_REJECTION_WICK:-5');
        }

        // Weak close: falta de convicción compradora
        if (isWeakClose && !isUpperWick) {
          paScore -= 4;
          exhaustionSignals++;
          pushConclusion('LATE_WEAK_CLOSE:-4');
        }

        // Strong close: pequeño bonus solo si el precio no está excesivamente extendido
        if (isStrongClose && current.isGreen && ema21Dist < 12 && !isUpperWick) {
          paScore += 2;
          pushConclusion('LATE_PRICE_ACTION_STRONG:2');
        }

        // Volume confirmation: solo cuando el precio no está muy alejado de la EMA21
        if (rvol !== null && rvol > 1.3 && current.isGreen && isStrongClose && ema21Dist < 8) {
          paScore += 2;
          pushConclusion('LATE_VOLUME_CONFIRMATION:2');
        }

        // Exhaustion candle: vela gigante + alto volumen en zona extendida
        // Precio ya alejado + volumen climático = posible climax de la subida
        if (isGiantCandle && rvol !== null && rvol > 1.5 && ema21Dist > 12) {
          if (isUpperWick || isWeakClose) {
            paScore -= 5; // adicional a la penalización ya aplicada arriba
            pushConclusion('LATE_EXHAUSTION_CANDLE:-5');
          } else {
            pushConclusion('LATE_VOLUME_EXHAUSTION');
          }
          exhaustionSignals++;
        } else if (rvol !== null && rvol > 1.5 && isUpperWick) {
          pushConclusion('LATE_VOLUME_REJECTION');
          exhaustionSignals++;
        }
      }
    }
    rawScore += paScore;

    // 8. RELATIVE STRENGTH — peso reducido (máx ±5)
    // El RS confirma si la tendencia todavía tiene fortaleza relativa.
    // No puede convertir un setup tardío en uno de alta calidad.
    let rsScore = 0;
    const rsState  = data.rsState || 'Neutral';
    const rsTrend  = (data.rsValue !== undefined && data.rsPrevious !== undefined &&
                      data.rsValue !== null     && data.rsPrevious !== null)
      ? (data.rsValue > data.rsPrevious ? 'IMPROVING' : (data.rsValue < data.rsPrevious ? 'DETERIORATING' : 'STABLE'))
      : 'STABLE';

    if      (rsState === 'Very Strong' || rsState === 'Strong & Rising')     rsScore += 4;
    else if (rsState === 'Strong'      || rsState === 'Strong but Weakening') rsScore += 3;
    else if (rsState === 'Positive')                                          rsScore += 2;
    else if (rsState === 'Weak'        || rsState === 'Weak but Recovering')  rsScore -= 2;
    else if (rsState === 'Very Weak'   || rsState === 'Weak & Falling')       rsScore -= 4;

    if      (rsTrend === 'IMPROVING')     rsScore += 1;
    else if (rsTrend === 'DETERIORATING') { rsScore -= 1; exhaustionSignals++; }

    rawScore += rsScore;
    if (rsScore !== 0) pushConclusion(`LATE_RS_BONUS:${rsScore}`);
    if (rsTrend === 'DETERIORATING') pushConclusion(`LATE_RS_DETERIORATING:${rsScore}`);

    // 9. CONSOLIDATION DETECTION
    // Caso especial: alcista tardía pero las medias se acercan al precio.
    // Las medias "alcanzan" al precio → la relación riesgo/beneficio mejora gradualmente.
    const isConsolidating = (
      data.drawdown52w !== null && data.drawdown52w !== undefined && data.drawdown52w >= -10 &&
      ema21Dist < 7 &&
      rsiD !== null && rsiD < 70 &&
      data.macd && data.macd.hist !== null && data.macd.hist > 0
    );
    if (isConsolidating) {
      rawScore += 3;
      pushConclusion('LATE_BULLISH_CONSOLIDATING:3');
    }

    // 10. RSI DETERIORATING COMBINADO
    // RSI alto + MACD perdiendo fuerza = señal conjunta de madurez avanzada.
    if (rsiD !== null && rsiD > 65 && macdDeteriorating) {
      rawScore -= 3;
      pushConclusion('LATE_RSI_DETERIORATING:-3');
    }

    // RSI extremo + extensión fuerte = flag de agotamiento técnico
    if (rsiD !== null && rsiD > 75 && ema21Dist > 15) {
      pushConclusion('LATE_RSI_EXHAUSTION');
    }

    // 11. EXHAUSTION FLAG — confluencia de señales negativas
    // Si se acumulan suficientes señales independientes de agotamiento,
    // penalización adicional que refleja la confluencia.
    if (exhaustionSignals >= 3) {
      rawScore -= 5;
      pushConclusion('LATE_BULLISH_EXHAUSTION:-5');
    }

    // 12. SCORE CAP
    scoreCap = 50;

    score = rawScore;

  } else if (setupState === 'bearish_trend' || setupState === 'bearish') {
    // ─── BEARISH OP SCORE ──────────────────────────────────────────────────────
    // Filosofía: "La estructura es mala. Solo interesa si hay señales de que está
    // dejando de ser bajista." No buscamos shorts — somos LONG-biased.
    // El Score mide: "¿Vale la pena vigilarla como futura reversión?"

    // 1. BASE SCORE
    rawScore = 5;
    pushConclusion('BASE_BEARISH:5');

    // ── Shortcuts a datos ──────────────────────────────────────────────────────
    const bPrice    = data.price    || 0;
    const bEma21    = data.ema21    || null;
    const bSma30    = data.sma30    || null;
    const bEma200   = data.ema200   || null;
    const bRsiD     = data.rsiDaily !== undefined ? data.rsiDaily : null;
    const bRsiW     = data.rsiWeekly !== undefined ? data.rsiWeekly : null;
    const bDrawdown = data.drawdown52w !== undefined ? data.drawdown52w : null;
    const bAtr14    = data.atr14    || null;
    const bMacd     = data.macd     || null;
    const bEma21Dist = data.ema21Distance !== undefined ? data.ema21Distance : null; // negativo en bearish

    // ── Proxies de slope de medias a partir de recentCandles ─────────────────
    // Los slopes reales están en marketSyncService pero no se pasan a opData.
    // Usamos la distancia precio–medias como proxy de estructura.
    const priceUnderEma21 = bEma21 !== null && bPrice < bEma21;
    const priceUnderSma30 = bSma30 !== null && bPrice < bSma30;
    const ema21UnderSma30 = (bEma21 !== null && bSma30 !== null) ? bEma21 < bSma30 : null;
    const priceUnderEma200 = bEma200 !== null && bPrice < bEma200;

    // 2. STRUCTURAL SEVERITY
    // Detectar en qué fase de la tendencia bajista está el activo.
    // Usaremos contadores de señales positivas/negativas para clasificar.
    let severityNegSignals = 0;
    let severityPosSignals = 0;

    // 2a. ESTRUCTURA DE MEDIAS
    if (priceUnderEma21)  pushConclusion('BEARISH_STRUCTURE');
    if (priceUnderEma21 && priceUnderSma30 && ema21UnderSma30) {
      if (priceUnderEma200) {
        rawScore -= 3;
        pushConclusion('BEARISH_STRONG_STRUCTURE:-3');
        severityNegSignals++;
      } else {
        pushConclusion('BEARISH_STRUCTURE');
      }
    }

    // Distancia relativa a EMA21 — aproximación de "approaching" via ema21Dist
    const absEma21Dist = bEma21Dist !== null ? Math.abs(bEma21Dist) : null;
    if (absEma21Dist !== null) {
      if (absEma21Dist <= 5) {
        // Precio acercándose a EMA21 = señal de mejora estructural
        rawScore += 3;
        pushConclusion('BEARISH_STRUCTURE_IMPROVING:3');
        pushConclusion('BEARISH_NEAR_EMA');
        severityPosSignals++;
      } else if (absEma21Dist > 10 && absEma21Dist <= 20) {
        pushConclusion('BEARISH_EXTENDED');
        rawScore += 1; // contexto: extendido, no bonus real
      } else if (absEma21Dist > 20) {
        pushConclusion('BEARISH_VERY_EXTENDED');
        rawScore += 2; // contexto: muy extendido, pequeño bonus de contexto
      }
    }

    // 3. RSI
    let rsiScore = 0;
    if (bRsiD !== null) {
      if (bRsiD < 25) {
        rsiScore += 2;
        pushConclusion('BEARISH_RSI_EXTREME:2');
        severityPosSignals++;
      } else if (bRsiD < 30) {
        rsiScore += 1;
        pushConclusion('BEARISH_RSI_EXTREME:1');
      }
      // RSI recovery: usamos proxy de MACD + candles (RSI previo no disponible directamente)
      // Detectamos recovery si RSI < 40 y el histograma MACD está mejorando
      if (bRsiD < 40 && bMacd && bMacd.hist !== null && bMacd.prevHist !== null && bMacd.hist > bMacd.prevHist) {
        rsiScore += 2;
        pushConclusion('BEARISH_RSI_RECOVERY:2');
        severityPosSignals++;
      } else if (bRsiD >= 40 && bRsiD <= 50 && bMacd && bMacd.hist !== null && bMacd.prevHist !== null && bMacd.hist > bMacd.prevHist) {
        rsiScore += 1;
        pushConclusion('BEARISH_RSI_RECOVERY:1');
        severityPosSignals++;
      }
    }
    rawScore += rsiScore;

    // 4. MACD / MOMENTUM — factor más importante para detectar cambio de fase
    let macdScore = 0;
    let macdIsBullishCross = false;
    let macdIsBullishAccel = false;
    let macdIsDeceleration = false;
    let macdIsAcceleration = false;

    if (bMacd && bMacd.current !== null && bMacd.prevHist !== null) {
      const { current, signal, hist, prevMacd, prevSignal, prevHist } = bMacd;

      const isBearishMacd = current < signal;
      const isBullishMacd = current >= signal;

      if (prevMacd !== null && prevSignal !== null && prevMacd <= prevSignal && current > signal) {
        // Bullish cross: primera señal de cambio de momentum
        macdScore += 6;
        macdIsBullishCross = true;
        severityPosSignals += 2;
        pushConclusion('BEARISH_MACD_BULLISH_CROSS:6');
      } else if (isBullishMacd && hist > prevHist) {
        // MACD bullish y acelerando
        macdScore += 5;
        macdIsBullishAccel = true;
        severityPosSignals++;
        pushConclusion('BEARISH_MACD_BULLISH_ACCELERATION:5');
      } else if (isBearishMacd && hist > prevHist) {
        // MACD bajista pero perdiendo aceleración (deceleration)
        macdScore += 3;
        macdIsDeceleration = true;
        severityPosSignals++;
        pushConclusion('BEARISH_MACD_DECELERATION:3');
      } else if (isBearishMacd && hist < prevHist) {
        // MACD bajista acelerando — peor escenario
        macdScore -= 5;
        macdIsAcceleration = true;
        severityNegSignals += 2;
        pushConclusion('BEARISH_MACD_ACCELERATION:-5');
      }
    }
    rawScore += macdScore;

    // 5. RELATIVE STRENGTH
    let bRsScore = 0;
    const bRsState = data.rsState || 'Neutral';
    const bRsTrend = (data.rsValue !== undefined && data.rsPrevious !== undefined &&
                      data.rsValue !== null     && data.rsPrevious !== null)
      ? (data.rsValue > data.rsPrevious ? 'IMPROVING' : (data.rsValue < data.rsPrevious ? 'DETERIORATING' : 'STABLE'))
      : 'STABLE';

    if      (bRsState === 'Very Strong')                bRsScore += 6;
    else if (bRsState === 'Strong & Rising')            bRsScore += 5;
    else if (bRsState === 'Strong' || bRsState === 'Strong but Weakening') bRsScore += 3;
    else if (bRsState === 'Positive')                   bRsScore += 2;
    else if (bRsState === 'Weak' || bRsState === 'Weak but Recovering')    bRsScore -= 3;
    else if (bRsState === 'Very Weak' || bRsState === 'Weak & Falling')    bRsScore -= 5;

    if      (bRsTrend === 'IMPROVING')    { bRsScore += 2; severityPosSignals++; }
    else if (bRsTrend === 'DETERIORATING') { bRsScore -= 2; severityNegSignals++; }

    rawScore += bRsScore;
    if (bRsScore !== 0) pushConclusion(`BEARISH_RS:${bRsScore}`);

    // Cap adicional por RS muy débil
    if ((bRsState === 'Very Weak' || bRsState === 'Weak & Falling') && bRsTrend === 'DETERIORATING') {
      scoreCap = scoreCap === null ? 15 : Math.min(scoreCap, 15);
      pushConclusion('CAP_RS_BEARISH_WEAK');
    }

    // 6. VOLUME / RVOL
    let volScore = 0;
    let hasSellingVolume = false;
    let hasReboundVolume = false;
    let sellingPressureWeak = false;

    if (data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];

      if (current) {
        const range      = current.high - current.low || 0.0001;
        const upperWick  = current.high - Math.max(current.open, current.close);
        const isWeakClose  = (current.close - current.low) / range < 0.3;
        const isStrongClose = (current.close - current.low) / range > 0.7;
        const rvol = current.rvol !== null ? current.rvol : (data.currentRVol || null);
        const isGiantCandle = bAtr14 && (current.high - current.low) > 1.5 * bAtr14;

        // Volumen vendedor fuerte
        if (current.isRed && rvol !== null && rvol > 1.5 && isWeakClose) {
          volScore -= 5;
          hasSellingVolume = true;
          severityNegSignals++;
          pushConclusion('BEARISH_SELLING_VOLUME:-5');
        }

        // Caída con volumen extremo — puede ser capitulación o aceleración
        if (current.isRed && rvol !== null && rvol > 2 && isGiantCandle) {
          volScore -= 5;
          severityNegSignals++;
          pushConclusion('BEARISH_CAPITULATION_OR_ACCELERATION:-5');
        }

        // Vela bajista gigante
        if (current.isRed && isGiantCandle) {
          volScore -= 5;
          severityNegSignals++;
          pushConclusion('BEARISH_GIANT_SELLING_CANDLE:-5');
          if (rvol !== null && rvol > 2 && isWeakClose) {
            volScore -= 5;
            pushConclusion('BEARISH_GIANT_SELLING_CANDLE_EXTREME:-5');
          }
        }

        // Volumen de rebote
        if (current.isGreen && rvol !== null && rvol > 1.5 && isStrongClose) {
          volScore += 4;
          hasReboundVolume = true;
          severityPosSignals++;
          pushConclusion('BEARISH_REBOUND_VOLUME:4');
        }
      }

      // Presión vendedora disminuyendo: días bajistas con RVOL promedio bajo
      const recentRedDays = data.recentCandles.filter(c => c.isRed && c.rvol !== null);
      if (recentRedDays.length >= 2) {
        const avgRedRvol = recentRedDays.reduce((s, c) => s + c.rvol, 0) / recentRedDays.length;
        if (avgRedRvol < 0.8) {
          volScore += 2;
          sellingPressureWeak = true;
          severityPosSignals++;
          pushConclusion('BEARISH_SELLING_PRESSURE_WEAKENING:2');
        }
      }
    }
    rawScore += volScore;

    // 7. PRICE ACTION
    let paScore = 0;
    if (data.recentCandles && data.recentCandles.length > 0) {
      const current = data.recentCandles[data.recentCandles.length - 1];
      if (current) {
        const range       = current.high - current.low || 0.0001;
        const body        = Math.abs(current.close - current.open);
        const lowerWick   = Math.min(current.open, current.close) - current.low;
        const upperWick   = current.high - Math.max(current.open, current.close);
        const isWeakClose  = (current.close - current.low) / range < 0.3;
        const isStrongClose = (current.close - current.low) / range > 0.7;
        const rvol = current.rvol !== null ? current.rvol : (data.currentRVol || null);

        // Hammer en zona de soporte
        const isHammer = lowerWick >= (2 * body) && upperWick < body && (body / range) < 0.5;
        const isNearRecent = data.recentCandles.length > 1 && current.low <=
          Math.min(...data.recentCandles.slice(0, -1).map(c => c.low)) * 1.02;

        if (isHammer && isNearRecent) {
          paScore += 4;
          severityPosSignals++;
          pushConclusion('BEARISH_HAMMER_SUPPORT:4');
        }

        // Strong close después de caída
        if (isStrongClose && current.isGreen && !isHammer) {
          paScore += 2;
          severityPosSignals++;
          pushConclusion('BEARISH_STRONG_REBOUND_CLOSE:2');
        }

        // Upper wick: rechazo en rebote
        if (upperWick / range > 0.6) {
          paScore -= 3;
          severityNegSignals++;
          pushConclusion('BEARISH_UPPER_REJECTION:-3');
        }

        // Weak close: sin convicción compradora
        if (isWeakClose && !current.isGreen) {
          paScore -= 3;
          severityNegSignals++;
          pushConclusion('BEARISH_WEAK_CLOSE:-3');
        }
      }
    }
    rawScore += paScore;

    // 8. LONG TERM HEALTH
    // Factor diferenciador clave: empresa de calidad en corrección vs empresa destruida.
    let ltScore = 0;
    if (bEma200 !== null) {
      if (!priceUnderEma200 && bDrawdown !== null && bDrawdown >= -15 &&
          (bRsiW === null || bRsiW > 55)) {
        // Empresa estructuralmente fuerte atravesando corrección de CP/MP
        ltScore += 8;
        pushConclusion('LT_BEARISH_CORRECTION_QUALITY:8');
      } else if (!priceUnderEma200 && bDrawdown !== null && bDrawdown >= -30) {
        ltScore += 4;
        pushConclusion('LT_HEALTHY_BEARISH_CORRECTION:4');
      } else if (priceUnderEma200 && bDrawdown !== null && bDrawdown < -35) {
        ltScore -= 5;
        pushConclusion('LT_BEARISH_WEAK:-5');
      }

      if (priceUnderEma200 && bDrawdown !== null && bDrawdown < -50 &&
          (bRsiW === null || bRsiW < 45)) {
        ltScore -= 10;
        scoreCap = scoreCap === null ? 20 : Math.min(scoreCap, 20);
        pushConclusion('LT_BEARISH_POOR:-10');
        pushConclusion('CAP_LT_BEARISH_POOR');
      }
    }
    rawScore += ltScore;

    // 9. CLASIFICACIÓN DE SEVERIDAD
    // Basada en el conteo de señales positivas/negativas acumuladas durante el cálculo.
    if (severityNegSignals >= 3 && severityPosSignals <= 1) {
      rawScore -= 5;
      scoreCap = scoreCap === null ? 15 : Math.min(scoreCap, 15);
      pushConclusion('BEARISH_ACCELERATION:-5');
    } else if (severityPosSignals >= 2 && severityNegSignals <= 1) {
      rawScore += 5;
      pushConclusion('BEARISH_LOSING_MOMENTUM:5');
    }

    // 10. BASE BUILDING
    // Detectar construcción de piso por confluencia (mínimo 3 señales independientes).
    const baseBuildingSignals = [
      absEma21Dist !== null && absEma21Dist <= 8,  // precio acercándose a EMA21
      macdIsDeceleration || macdIsBullishCross || macdIsBullishAccel,
      bRsiD !== null && bRsiD < 40 && bMacd && bMacd.hist > bMacd.prevHist,
      hasReboundVolume,
      sellingPressureWeak,
      bRsTrend === 'IMPROVING',
    ].filter(Boolean).length;

    if (baseBuildingSignals >= 3) {
      const baseBuildingBonus = Math.min(baseBuildingSignals * 2, 8);
      rawScore += baseBuildingBonus;
      pushConclusion(`BEARISH_BASE_BUILDING:${baseBuildingBonus}`);
    }

    // 11. REVERSAL ATTEMPT — señales confluentes fuertes sin llegar a ser early_reversal
    const reversalAttemptSignals = [
      macdIsBullishCross,
      macdIsBullishAccel,
      bRsiD !== null && bRsiD > 45,
      bRsTrend === 'IMPROVING' && (bRsState === 'Positive' || bRsState === 'Strong'),
      hasReboundVolume,
      absEma21Dist !== null && absEma21Dist <= 3, // precio recuperando EMA21
    ].filter(Boolean).length;

    if (reversalAttemptSignals >= 3) {
      rawScore += Math.min(reversalAttemptSignals * 1.5, 5);
      pushConclusion('BEARISH_REVERSAL_ATTEMPT:5');
    }

    // 12. GLOBAL CAP + FLOOR
    // Bearish nunca supera 35. Floor en 0: un score negativo no tiene significado
    // operativo en un sistema LONG-biased; representa "descartado" de igual forma.
    scoreCap = scoreCap === null ? 35 : Math.min(scoreCap, 35);
    score = Math.max(0, rawScore); // rawScore se preserva para debug

  } else {
    // Otros setups: sin cálculo por ahora
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
