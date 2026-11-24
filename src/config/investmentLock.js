// config/investmentLock.js
// Configuración de bloqueo temporal para la sección de Inversiones (vacaciones / pausa de liquidez)
// ─────────────────────────────────────────────────────────────────────────────
// ⚡ FORMA RÁPIDA DE ACTIVAR / DESACTIVAR:
// 1. Por código: Cambia `IS_INVESTMENT_LOCKED_DEFAULT` a `true` (o `VITE_INVESTMENT_LOCKED=true` en .env)
// 2. Desde el navegador / UI:
//    - Atajo de teclado: Presiona `Ctrl + Shift + L` en cualquier pantalla
//    - Por URL: Agrega `?lock=1` para bloquear o `?lock=0` para desbloquear
//    - En consola: Ejecuta `window.toggleInvestmentLock()`
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'chiappital_investment_locked';

// Valor por defecto (cambiar a `true` aquí si querés dejarlo bloqueado fijo en el código)
export const IS_INVESTMENT_LOCKED_DEFAULT = import.meta.env.VITE_INVESTMENT_LOCKED === 'true' ? true : false;

// Función para consultar el estado actual del bloqueo
export const getInvestmentLockState = () => {
  if (typeof window !== 'undefined') {
    // Permitir activar/desactivar rápidamente por parámetro en la URL (?lock=1 o ?lock=0)
    const params = new URLSearchParams(window.location.search);
    if (params.has('lock')) {
      const val = params.get('lock');
      if (val === '1' || val === 'true') {
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      }
      if (val === '0' || val === 'false') {
        localStorage.setItem(STORAGE_KEY, 'false');
        return false;
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return IS_INVESTMENT_LOCKED_DEFAULT;
};

// Función para cambiar el estado y notificar a toda la app en tiempo real
export const setInvestmentLockState = (locked) => {
  if (typeof window !== 'undefined') {
    const boolVal = Boolean(locked);
    localStorage.setItem(STORAGE_KEY, String(boolVal));
    window.dispatchEvent(new CustomEvent('investment-lock-change', { detail: boolVal }));
    return boolVal;
  }
  return false;
};

export const toggleInvestmentLockState = () => {
  const next = !getInvestmentLockState();
  return setInvestmentLockState(next);
};

// Exponer helper global en consola para activación rápida
if (typeof window !== 'undefined') {
  window.toggleInvestmentLock = toggleInvestmentLockState;
  window.setInvestmentLock = setInvestmentLockState;
}

// Export estático por compatibilidad (evalúa el estado inicial)
export const IS_INVESTMENT_LOCKED = getInvestmentLockState();

export const INVESTMENT_LOCK_CONFIG = {
  cartelText: "Nos quedamos sin liquidez y estamos en pausa, vuelva a fin de año",
  badge: "MODO VACACIONES 🌴 • EN PAUSA",
  title: "Inversiones Temporalmente Bloqueadas",
  subtitle: "El acceso al módulo de trading, finanzas y portafolio está temporalmente suspendido para descansar la mente y no perder tiempo ni energía durante las vacaciones.",
};

