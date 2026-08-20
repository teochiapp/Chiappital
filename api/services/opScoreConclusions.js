/**
 * opScoreConclusions.js
 * 
 * Generador de conclusiones legibles por humanos para el OP Score.
 * Toma el estado técnico y las métricas, y devuelve un array de conclusiones.
 */

function generateConclusions(setupState, data, internalFlags = [], isValid = true) {
  const conclusions = [];

  if (!isValid) {
    conclusions.push("⛔ SETUP INVALIDADO: Se ha roto la estructura técnica fundamental de este setup.");
  }

  // Conclusión base sobre la estructura actual
  switch (setupState) {
    case 'bullish_breakout': conclusions.push("🚀 Breakout detectado: El activo acaba de romper un letargo previo con convicción."); break;
    case 'strong_uptrend': conclusions.push("📈 Fuerte tendencia alcista: El precio está sólidamente por encima de sus medias."); break;
    case 'strong_uptrend_extended': conclusions.push("⏰ Alcista Tardío: Tendencia alcista sólida pero el precio está muy extendido respecto a la EMA21. Alto riesgo de entrada en este punto."); break;
    case 'bullish_pullback': conclusions.push("📉 Pullback saludable: Descanso técnico cerca de la EMA21 en tendencia alcista."); break;
    case 'bullish_reversal_confirmed': conclusions.push("✅ Reversión confirmada: La estructura bajista previa se ha revertido."); break;
    case 'early_bullish_reversal': conclusions.push("🔍 Reversión temprana: Signos de mejora en momentum, requiere confirmación."); break;
    case 'lateral_trend': conclusions.push("➖ Tendencia lateral: El activo se encuentra comprimido sin dirección clara."); break;
    case 'bearish_trend': conclusions.push("⚠️ Tendencia bajista: Estructura débil por debajo de sus principales medias."); break;
    default: conclusions.push("ℹ️ Estructura neutra o sin definir.");
  }

  // Parse internal flags
  internalFlags.forEach(flag => {
    const [key, valueStr] = flag.split(':');
    const val = valueStr ? parseInt(valueStr, 10) : 0;
    
    switch (key) {
      case 'RS':
        if (val > 0) conclusions.push(`💪 Fuerza Relativa Positiva (+${val} pts).`);
        else if (val < 0) conclusions.push(`🔻 Fuerza Relativa Negativa (${val} pts).`);
        break;
      case 'CAP_RS_WEAK_DETERIORATING':
        conclusions.push("⛔ RIESGO ESTRUCTURAL: RS Muy Débil y deteriorándose. Puntaje máximo limitado a 50.");
        break;
      case 'CAP_RS_WEAK':
        conclusions.push("⚠️ PRECAUCIÓN: RS Muy Débil. Puntaje máximo limitado a 60.");
        break;
      case 'VOL_DRY':
        conclusions.push(`✅ Volumen de caída muy seco (+${val} pts): Falta de presión vendedora institucional.`);
        break;
      case 'VOL_NORMAL':
        conclusions.push(`ℹ️ Volumen de caída normal (+${val} pts).`);
        break;
      case 'VOL_ELEVATED':
        conclusions.push(`⚠️ Volumen de caída elevado (${val} pts): Cierta distribución en el retroceso.`);
        break;
      case 'VOL_HEAVY':
        conclusions.push(`🚨 Volumen de caída pesado (${val} pts): Fuerte presión vendedora y peligro de distribución.`);
        break;
      case 'REBOUND_STRONG':
        conclusions.push(`🔥 Excelente rebote con altísimo volumen y buen cierre (+${val} pts).`);
        break;
      case 'REBOUND_POSITIVE':
        conclusions.push(`✅ Rebote constructivo con volumen superior a la media (+${val} pts).`);
        break;
      case 'REBOUND_WEAK':
        conclusions.push(`⚠️ Rebote con volumen muy bajo (${val} pts).`);
        break;
      case 'REBOUND_REJECTED':
        conclusions.push(`🔴 Rebote rechazado o cierre débil pese al alto volumen (${val} pts).`);
        break;
      case 'MACD_BULLISH_CROSS':
        conclusions.push(`📈 Cruce Alcista en MACD (+${val} pts).`);
        break;
      case 'MACD_BULLISH_ACCEL':
        conclusions.push(`📈 MACD Alcista Acelerando (+${val} pts).`);
        break;
      case 'MACD_BULLISH_DECEL':
        conclusions.push(`⚖️ MACD Alcista Desacelerando (+${val} pts).`);
        break;
      case 'MACD_BEARISH_DECEL':
        conclusions.push(`⚖️ MACD Bajista Desacelerando (+${val} pts).`);
        break;
      case 'MACD_BEARISH_ACCEL':
        conclusions.push(`📉 MACD Bajista Acelerando (${val} pts).`);
        break;
      case 'RSI':
        if (val > 0) conclusions.push(`✅ RSI en zona constructiva (+${val} pts).`);
        else if (val < 0) conclusions.push(`⚠️ RSI fuera de zona óptima (${val} pts).`);
        break;
      case 'WARN_RSI_EXTENDED':
        conclusions.push("🚨 ALERTA: RSI Diario > 80. Probable extensión y alto riesgo de retroceso profundo.");
        break;
      case 'LT_EXCELLENT':
        conclusions.push(`🏆 Salud a Largo Plazo Excelente (+${val} pts): En zona de máximos y firme tendencia secular.`);
        break;
      case 'LT_HEALTHY':
        conclusions.push(`✅ Salud a Largo Plazo Buena (+${val} pts): Tendencia de fondo alcista.`);
        break;
      case 'LT_POOR':
        conclusions.push(`💀 Salud a Largo Plazo Pésima (${val} pts): Tendencia secular destruida o muy lejos de máximos.`);
        break;
      case 'CAP_LT_POOR':
        conclusions.push("⛔ RIESGO ESTRUCTURAL: Salud macro pésima. Puntaje máximo limitado a 45.");
        break;
      case 'FLAG_HAMMER':
        conclusions.push(`🔨 Martillo en zona de soporte (+${val} pts).`);
        break;
      case 'FLAG_STRONG_CLOSE':
        conclusions.push(`💪 Fuerte cierre cerca de los máximos del día (+${val} pts).`);
        break;
      case 'FLAG_UPPER_WICK':
        conclusions.push(`🔴 Mecha superior larga (${val} pts): Evidencia fuerte presión vendedora al subir.`);
        break;
      case 'FLAG_WEAK_CLOSE':
        conclusions.push(`🔴 Cierre débil (${val} pts).`);
        break;
      case 'FLAG_GIANT_BEAR':
        conclusions.push(`🚨 Vela bajista anómala y gigante (${val} pts). Riesgo de cambio de carácter.`);
        break;
      case 'CAP_DISTRIBUTION':
        conclusions.push("⛔ RIESGO INSTITUCIONAL: Vela gigante con alto volumen (Distribución). Puntaje máximo limitado a 50.");
        break;
      case 'FLAG_CONFLUENCE_SUPPORT':
        conclusions.push(`🎯 Confluencia de Medias y Soporte (+${val} pts).`);
        break;
      case 'FLAG_DEEP_PULLBACK_ATR':
        conclusions.push(`⚠️ Pullback profundo según volatilidad ATR (${val} pts).`);
        break;
      case 'CAP_DEEP_PULLBACK':
        conclusions.push("⛔ RIESGO ESTRUCTURAL: Pullback excesivamente profundo. Puntaje máximo limitado a 50.");
        break;
      case 'INVALID_BREAK_SUPPORT':
        conclusions.push("💀 RUPTURA GRAVE: El precio ha roto la EMA21 y SMA30 por un margen amplio.");
        break;

      // ─── LATERAL FLAGS ──────────────────────────────────────────────────────
      case 'RANGE_LOW':
        conclusions.push("📍 Precio en la zona baja del rango. Existe potencial de rebote, pero requiere confirmación.");
        break;
      case 'RANGE_LOWER_HALF':
        conclusions.push("📍 Precio en la mitad baja del rango. La relación riesgo/beneficio mejora si aparece confirmación de rebote.");
        break;
      case 'RANGE_CENTER':
        conclusions.push("📍 Precio en el centro del rango. No hay una ventaja clara en este punto.");
        break;
      case 'RANGE_UPPER_HALF':
        conclusions.push("📍 Precio en la mitad alta del rango. La relación riesgo/beneficio se deteriora.");
        break;
      case 'RANGE_HIGH':
        conclusions.push("📍 Precio cerca de la resistencia del rango. Zona poco atractiva para nuevas compras.");
        break;
      case 'LATERAL_CENTER_WAIT':
        conclusions.push("⏸️ Lateral en el centro del rango. La mejor acción es esperar un extremo del rango.");
        break;
      case 'LATERAL_LOW_ZONE':
        if (val > 5) conclusions.push(`📉 El precio se encuentra en la parte baja del rango (+${val} pts).`);
        else conclusions.push(`📉 El precio se acerca a la zona baja del rango (+${val} pts).`);
        break;
      case 'LATERAL_HIGH_ZONE':
        conclusions.push("📈 El precio está cerca del techo del rango.");
        break;
      case 'LATERAL_RESISTANCE_RISK':
        conclusions.push("⚠️ El precio está en zona de resistencia. El riesgo de rechazo es elevado.");
        break;
      case 'LATERAL_REBOUND_RSI':
        conclusions.push(`✅ RSI recuperándose desde zona baja: impulso incipiente en el rebote (+${val} pts).`);
        break;
      case 'LATERAL_REBOUND_MACD':
        conclusions.push(`✅ MACD mejorando: el momentum acompaña el rebote desde el soporte (+${val} pts).`);
        break;
      case 'LATERAL_REBOUND_VOLUME':
        conclusions.push(`✅ Volumen de rebote favorable: hay presión compradora visible en la zona de soporte (+${val} pts).`);
        break;
      case 'LATERAL_REBOUND_HAMMER':
        conclusions.push(`🔨 Martillo en la zona baja del rango: el precio rechazó los mínimos con fuerza (+${val} pts).`);
        break;
      case 'LATERAL_REBOUND_EMA21_RECOVERY':
        conclusions.push(`💪 El precio recuperó la EMA21 desde la zona baja. Señal de rebote más sólida (+${val} pts).`);
        break;
      case 'LATERAL_REBOUND_PRICE_ACTION':
        conclusions.push(`✅ Cierre fuerte en zona baja: price action constructiva sobre el soporte del rango (+${val} pts).`);
        break;
      case 'LATERAL_RS_BONUS':
        if (val > 0) conclusions.push(`💪 Fortaleza relativa ligeramente positiva (+${val} pts).`);
        else conclusions.push(`🔻 Debilidad relativa en el contexto lateral (${val} pts).`);
        break;
      case 'LATERAL_RSI_OVERBOUGHT_FALLING':
        conclusions.push(`🔻 RSI elevado cerca de la resistencia: posible señal de agotamiento (${val} pts).`);
        break;
      case 'LATERAL_MACD_BEARISH_ACCEL':
        conclusions.push(`📉 MACD bajista acelerando cerca del techo del rango: presión vendedora (${val} pts).`);
        break;
      case 'LATERAL_REJECTION_WICK':
        conclusions.push(`🕯️ Mecha superior en zona de resistencia: el precio fue rechazado al intentar subir (${val} pts).`);
        break;
      case 'LATERAL_WEAK_CLOSE_HIGH':
        conclusions.push(`🔴 Cierre débil cerca de la resistencia: falta de convicción compradora en el techo (${val} pts).`);
        break;
      case 'LATERAL_RVOL_REJECTION':
        conclusions.push(`📊 Alto volumen vendedor en zona de resistencia: posible distribución (${val} pts).`);
        break;
      case 'LATERAL_BREAKOUT_PRESSURE':
        conclusions.push(`🔔 Presión alcista acumulándose cerca del techo del rango (+${val} pts). Vigilar un posible breakout, pero sin anticiparlo.`);
        break;
      case 'CAPPED_LATERAL':
        conclusions.push("🚧 Puntaje máximo limitado: el setup es lateral y su ventaja operativa es moderada por definición.");
        break;

      // ─── LATE BULLISH FLAGS (también: strong_uptrend_extended) ─────────────
      case 'BASE_LATE_BULLISH':
        conclusions.push("📈 Setup alcista tardío: la tendencia es positiva, pero la entrada ya está avanzada.");
        break;
      case 'LATE_NEAR_EMA':
        if (val > 0) conclusions.push(`✅ El precio permanece relativamente cerca de la EMA21. La entrada todavía no está excesivamente extendida (+${val} pts).`);
        break;
      case 'LATE_MODERATELY_EXTENDED':
        conclusions.push(`⚠️ El precio comienza a alejarse de su zona de soporte dinámico. La entrada requiere mayor precaución (${val} pts).`);
        break;
      case 'LATE_EXTENDED':
        conclusions.push(`⚠️ El precio está bastante extendido respecto de EMA21. Esperar un pullback podría ofrecer una mejor entrada (${val} pts).`);
        break;
      case 'LATE_VERY_EXTENDED':
        conclusions.push(`🔴 El precio está muy alejado de EMA21. Perseguir la subida presenta una relación riesgo/beneficio desfavorable (${val} pts).`);
        break;
      case 'LATE_SMA_EXTENSION':
        conclusions.push(`⚠️ Tanto EMA21 como SMA30 quedan lejos del precio: extensión confirmada por múltiples medias (${val} pts).`);
        break;
      case 'LATE_RSI_EXTENDED':
        conclusions.push(`⚠️ RSI elevado: el movimiento alcista está avanzado. Precaución para nuevas entradas (${val} pts).`);
        break;
      case 'LATE_RSI_OVERBOUGHT':
        conclusions.push(`🔴 RSI en zona de sobrecompra. La acción está muy madura para una nueva entrada (${val} pts).`);
        break;
      case 'LATE_RSI_DETERIORATING':
        conclusions.push(`🔻 RSI perdiendo fuerza mientras la tendencia sigue avanzada: señal combinada de madurez (${val} pts).`);
        break;
      case 'LATE_RSI_EXHAUSTION':
        conclusions.push("⛔ RSI en zona extrema con precio muy extendido: señal técnica de agotamiento potencial.");
        break;
      case 'LATE_MACD_HEALTHY':
        conclusions.push("✅ MACD saludable: la tendencia alcista sigue vigente por ahora.");
        break;
      case 'LATE_MACD_DECELERATING':
        conclusions.push(`📉 El momentum alcista continúa, pero está perdiendo aceleración. Señal de advertencia temprana (${val} pts).`);
        break;
      case 'LATE_MACD_BEARISH':
        conclusions.push(`📉 MACD debilitándose: el impulso alcista empieza a deteriorarse (${val} pts).`);
        break;
      case 'LATE_MACD_BEARISH_ACCEL':
        conclusions.push(`📉 MACD bajista con aceleración: el deterioro del momentum se está profundizando (${val} pts).`);
        break;
      case 'LATE_NEAR_52W_HIGH':
        conclusions.push("📍 Precio cercano a los máximos de 52 semanas. Prestar atención a posibles resistencias históricas.");
        break;
      case 'LATE_AT_52W_HIGH':
        conclusions.push(`⚠️ Precio en zona de máximos de 52 semanas con extensión moderada respecto a EMA21. El riesgo de entrada es elevado (${val} pts).`);
        break;
      case 'LATE_52W_EXTENSION':
        conclusions.push(`🔴 Precio en máximos históricos recientes y muy extendido respecto a EMA21. Confluencia de riesgo de entrada (${val} pts).`);
        break;
      case 'LATE_PRICE_ACTION_STRONG':
        conclusions.push(`✅ Cierre fuerte: el momentum de corto plazo sigue siendo comprador (+${val} pts).`);
        break;
      case 'LATE_REJECTION_WICK':
        conclusions.push(`🕯️ Mecha superior cerca de máximos: aparece rechazo después de la subida. Señal de presión vendedora (${val} pts).`);
        break;
      case 'LATE_WEAK_CLOSE':
        conclusions.push(`🔴 Cierre débil después de una subida extendida: falta de convicción compradora en el máximo (${val} pts).`);
        break;
      case 'LATE_VOLUME_CONFIRMATION':
        conclusions.push(`✅ Volumen elevado con cierre fuerte: la subida todavía tiene respaldo de demanda (+${val} pts).`);
        break;
      case 'LATE_VOLUME_EXHAUSTION':
        conclusions.push("📊 Volumen elevado en una acción muy extendida: posible señal de climax. No asumir continuación.");
        break;
      case 'LATE_VOLUME_REJECTION':
        conclusions.push("📊 Alto volumen vendedor con mecha superior: distribución posible en zona de máximos.");
        break;
      case 'LATE_EXHAUSTION_CANDLE':
        conclusions.push(`🕯️ Vela de exhaustion: precio muy extendido, vela gigante con volumen climático y cierre débil o rechazo (${val} pts).`);
        break;
      case 'LATE_RS_BONUS':
        if (val > 0) conclusions.push(`💪 La tendencia todavía muestra fortaleza relativa frente al mercado (+${val} pts).`);
        else conclusions.push(`🔻 La fortaleza relativa está cediendo en el contexto de una tendencia tardía (${val} pts).`);
        break;
      case 'LATE_RS_DETERIORATING':
        conclusions.push("🔻 La fortaleza relativa está deteriorándose: la ventaja frente al mercado se está reduciendo.");
        break;
      case 'LATE_BULLISH_CONSOLIDATING':
        conclusions.push("📈 Tendencia alcista avanzada, pero el precio está consolidando cerca de máximos. La estructura podría estar preparando una nueva continuación.");
        break;
      case 'LATE_BULLISH_EXHAUSTION':
        conclusions.push("⚠️ Múltiples señales de agotamiento confluyen: tendencia muy extendida, momentum deteriorándose y/o price action débil. El riesgo/beneficio para una nueva entrada es desfavorable.");
        break;
      case 'CAPPED_LATE_BULLISH':
        conclusions.push("🚧 Puntaje máximo limitado: la tendencia es alcista, pero el setup es tardío y no representa una entrada de alta calidad.");
        break;

      // ─── BEARISH FLAGS ──────────────────────────────────────────────────────
      case 'BASE_BEARISH':
        conclusions.push("🔴 Setup bajista: la estructura no ofrece condiciones para una entrada LONG en este momento.");
        break;
      case 'BEARISH_STRUCTURE':
        conclusions.push("🔴 La estructura sigue siendo bajista: el precio permanece por debajo de sus medias principales.");
        break;
      case 'BEARISH_STRONG_STRUCTURE':
        conclusions.push(`🔴 Tendencia bajista estructural fuerte: precio por debajo de EMA21, SMA30 y EMA200 (${val} pts).`);
        break;
      case 'BEARISH_STRUCTURE_IMPROVING':
        conclusions.push(`📍 El precio comienza a acercarse a EMA21. Una recuperación de esta media sería la primera señal estructural relevante (+${val} pts).`);
        break;
      case 'BEARISH_NEAR_EMA':
        conclusions.push("📍 El precio comienza a acercarse a EMA21. Una recuperación de esta media sería importante para confirmar un cambio de estructura.");
        break;
      case 'BEARISH_EXTENDED':
        conclusions.push("⚠️ El precio está muy alejado de EMA21. La sobreventa por sí sola no confirma una oportunidad de entrada.");
        break;
      case 'BEARISH_VERY_EXTENDED':
        conclusions.push("⚠️ El precio está extremadamente extendido por debajo de EMA21. Podría haber un rebote técnico, pero no implica reversión.");
        break;
      case 'BEARISH_ACCELERATION':
        conclusions.push(`🔴 La presión bajista se está acelerando. No hay evidencia suficiente para considerar una entrada (${val} pts).`);
        break;
      case 'BEARISH_LOSING_MOMENTUM':
        conclusions.push(`🟡 La caída está perdiendo fuerza. Todavía es bajista, pero comienza a ser interesante para vigilancia (+${val} pts).`);
        break;
      case 'BEARISH_BASE_BUILDING':
        conclusions.push(`🟡 Aparecen señales de construcción de un piso. Todavía no existe confirmación de reversión (+${val} pts).`);
        break;
      case 'BEARISH_REVERSAL_ATTEMPT':
        conclusions.push("🔔 Aparecen varias señales iniciales de reversión, pero todavía falta confirmación estructural. Seguimiento recomendado.");
        break;
      case 'BEARISH_RSI_EXTREME':
        conclusions.push(`📉 RSI extremadamente bajo: existe sobreventa, pero todavía no hay confirmación de reversión (+${val} pts de contexto).`);
        break;
      case 'BEARISH_RSI_RECOVERY':
        conclusions.push(`📈 RSI recuperándose desde niveles bajos con mejora de momentum: señal de recuperación incipiente (+${val} pts).`);
        break;
      case 'BEARISH_MACD_ACCELERATION':
        conclusions.push(`🔴 MACD bajista acelerando: la presión vendedora continúa aumentando (${val} pts).`);
        break;
      case 'BEARISH_MACD_DECELERATION':
        conclusions.push(`🟡 MACD bajista perdiendo aceleración: la presión vendedora comienza a debilitarse (+${val} pts).`);
        break;
      case 'BEARISH_MACD_BULLISH_CROSS':
        conclusions.push(`📈 MACD acaba de cruzar al alza. Primera señal de cambio de momentum dentro de una estructura todavía bajista (+${val} pts).`);
        break;
      case 'BEARISH_MACD_BULLISH_ACCELERATION':
        conclusions.push(`📈 MACD bullish y acelerando: el momentum está cambiando de dirección. Señal relevante dentro del contexto bajista (+${val} pts).`);
        break;
      case 'BEARISH_RS':
        if (val > 0) conclusions.push(`💪 La acción muestra fortaleza relativa dentro del contexto bajista. Señal de posible acumulación temprana (+${val} pts).`);
        else conclusions.push(`🔻 La debilidad relativa del activo acompaña la estructura bajista. Señal negativa adicional (${val} pts).`);
        break;
      case 'BEARISH_SELLING_VOLUME':
        conclusions.push(`🔴 Volumen vendedor elevado acompañado de debilidad de precio: la presión vendedora sigue presente (${val} pts).`);
        break;
      case 'BEARISH_SELLING_PRESSURE_WEAKENING':
        conclusions.push(`🟡 El volumen vendedor se está reduciendo: la presión bajista podría estar agotándose (+${val} pts).`);
        break;
      case 'BEARISH_REBOUND_VOLUME':
        conclusions.push(`📊 Rebote acompañado por volumen: aparece participación compradora en los mínimos. Señal constructiva (+${val} pts).`);
        break;
      case 'BEARISH_CAPITULATION_OR_ACCELERATION':
        conclusions.push(`⚠️ Vela de alto volumen en caída: puede ser capitulación o aceleración de la baja. Sin confirmación, asumir aceleración (${val} pts).`);
        break;
      case 'BEARISH_GIANT_SELLING_CANDLE':
        conclusions.push(`🔴 Vela bajista de gran amplitud: la presión vendedora es intensa (${val} pts).`);
        break;
      case 'BEARISH_GIANT_SELLING_CANDLE_EXTREME':
        conclusions.push(`🔴 Vela bajista extrema con alto volumen y cierre débil: señal de pánico vendedor (${val} pts).`);
        break;
      case 'BEARISH_HAMMER_SUPPORT':
        conclusions.push(`🕯️ Rechazo de mínimos con cierre fuerte: señal constructiva dentro de una estructura todavía bajista (+${val} pts).`);
        break;
      case 'BEARISH_STRONG_REBOUND_CLOSE':
        conclusions.push(`📈 Cierre fuerte después de la caída: el precio recuperó terreno intradía. Señal positiva incipiente (+${val} pts).`);
        break;
      case 'BEARISH_UPPER_REJECTION':
        conclusions.push(`🕯️ Mecha superior: el rebote fue rechazado. Todavía hay presión vendedora arriba (${val} pts).`);
        break;
      case 'BEARISH_WEAK_CLOSE':
        conclusions.push(`🔴 Cierre débil: la jornada terminó sin convicción compradora. Señal negativa de corto plazo (${val} pts).`);
        break;
      case 'LT_BEARISH_CORRECTION_QUALITY':
        conclusions.push(`💎 La acción mantiene una estructura de largo plazo saludable. La debilidad actual podría ser una corrección dentro de una tendencia mayor (+${val} pts).`);
        break;
      case 'LT_HEALTHY_BEARISH_CORRECTION':
        conclusions.push(`✅ La estructura de largo plazo es relativamente sana a pesar de la corrección actual (+${val} pts).`);
        break;
      case 'LT_BEARISH_WEAK':
        conclusions.push(`🔴 La estructura de largo plazo es débil: la caída no parece simplemente una corrección dentro de una tendencia saludable (${val} pts).`);
        break;
      case 'LT_BEARISH_POOR':
        conclusions.push(`🔴 Empresa con estructura de largo plazo muy deteriorada. El riesgo de una recuperación sostenida es alto (${val} pts).`);
        break;
      case 'CAP_LT_BEARISH_POOR':
        conclusions.push("⛔ Puntaje máximo limitado a 20: la estructura de largo plazo es demasiado débil para una potencial reversión relevante.");
        break;
      case 'CAP_RS_BEARISH_WEAK':
        conclusions.push("⛔ Puntaje máximo limitado a 15: RS muy débil y deteriorándose. El activo está perdiendo fuerza relativa activamente.");
        break;
      case 'CAPPED_BEARISH':
        conclusions.push("🚧 Puntaje limitado: la estructura sigue siendo bajista y no debe competir con setups de entrada confirmados.");
        break;
    }
  });

  const debugInfo = [
    `[⚙️ DEBUG VARIABLES DE ENTRADA]`,
    `• Precio: $${parseFloat(data.price)?.toFixed(2)}`,
    `• RS: ${data.rsValue !== undefined && data.rsValue !== null ? data.rsValue + '%' : 'N/A'} (Prev: ${data.rsPrevious !== undefined && data.rsPrevious !== null ? data.rsPrevious + '%' : 'N/A'}) - Estado: ${data.rsState || 'N/A'}`,
    `• MACD: ${data.macd && data.macd.current !== null ? `Curr: ${data.macd.current}, Signal: ${data.macd.signal}, Hist: ${data.macd.hist}` : 'N/A'}`,
    `• Drawdown 52W: ${data.drawdown52w !== undefined && data.drawdown52w !== null ? data.drawdown52w + '%' : 'N/A'}`,
    `• Medias: EMA21=${parseFloat(data.ema21)?.toFixed(2) || 'N/A'}, SMA30=${parseFloat(data.sma30)?.toFixed(2) || 'N/A'}, EMA200=${parseFloat(data.ema200)?.toFixed(2) || 'N/A'}`,
    `• ATR(14): ${parseFloat(data.atr14)?.toFixed(2) || 'N/A'}`,
    `• RVol Actual: ${parseFloat(data.currentRVol)?.toFixed(2) || 'N/A'}`,
    `• RSI Diario: ${parseFloat(data.rsiDaily)?.toFixed(2) || 'N/A'}`,
    `• RSI Semanal: ${parseFloat(data.rsiWeekly)?.toFixed(2) || 'N/A'}`
  ].join('\n');
  
  conclusions.push(debugInfo);

  return conclusions;
}

module.exports = {
  generateConclusions
};
