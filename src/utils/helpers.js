// utils/helpers.js - Funciones de utilidad
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

export const getUTC3DateString = (date = new Date()) => {
  const tzOffset = 3 * 60 * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

// Parsea el campo days_of_week que puede venir como string JSON anidado
export const parseHabitDays = (days) => {
  let parsed = days;
  while (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch(e) { break; }
  }
  return Array.isArray(parsed) ? parsed : [0,1,2,3,4,5,6];
};
