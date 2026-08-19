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
