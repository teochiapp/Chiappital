import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import alertService from '../services/alertService';
import { canEvaluateAlertQuote } from '../services/alertQuotes';
import { unlockAlertSound, stopAlertSound } from '../services/alertSoundService';
import { useStrapiAuth } from '../hooks/useApiTrades'; // Provides the user auth

const AlertsContext = createContext();

export const useAlerts = () => useContext(AlertsContext);

export const AlertsProvider = ({ children }) => {
  const { user } = useStrapiAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [currentQuotes, setCurrentQuotes] = useState({});
  const [emaChecks, setEmaChecks] = useState({});
  const [checkError, setCheckError] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const checkingRef = useRef(false);
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    const unlock = () => {
      unlockAlertSound().then(cleanup).catch(() => {});
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => { cleanup(); stopAlertSound(); };
  }, []);

  const fetchAlerts = async () => {
    if (!user) return;
    const userId = user.id;
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      if (userIdRef.current !== userId) return;
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts in context:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run the check logic
  const checkAlertPrices = async ({ force = false } = {}) => {
    if (!user || checkingRef.current) return;
    const userId = user.id;
    checkingRef.current = true;
    try {
      // 1. Fetch latest active alerts
      const currentAlerts = await alertService.getAlerts();
      if (userIdRef.current !== userId) return;
      setAlerts(currentAlerts);

      const activeAlerts = currentAlerts.filter(a => a.is_active === 1);

      const newTriggered = [];
      // The same short-lived server quotes feed the table, fixed targets and EMA checks.
      const { quotes } = await alertService.getQuotes({ force });
      if (userIdRef.current !== userId) return;
      const prices = Object.fromEntries(currentAlerts.map(alert => [
        alert.symbol, quotes[alert.symbol]?.price > 0 ? quotes[alert.symbol].price : null
      ]));
      setCurrentPrices(prices);
      setCurrentQuotes(quotes);
      setCheckError(activeAlerts.some(alert => !quotes[alert.symbol])
        ? 'Hay cotizaciones no disponibles. Se volverá a intentar en un minuto.' : '');
      if (activeAlerts.some(a => a.condition_type === 'ema21_above')) {
        try {
          const result = await alertService.checkEma21Alerts();
          if (userIdRef.current !== userId) return;
          setEmaChecks(result.checks);
          setCurrentPrices(prev => ({ ...prev, ...result.prices }));
          if (result.triggered.length) {
            setTriggeredAlerts(prev => [...prev, ...result.triggered]);
            const triggeredIds = new Set(result.triggered.map(alert => alert.id));
            setAlerts(prev => prev.map(alert => triggeredIds.has(alert.id) ? { ...alert, is_active: 0 } : alert));
          }
        } catch (error) {
          setCheckError('No se pudo comprobar la EMA21. Se volverá a intentar en un minuto.');
          console.error('Error checking EMA21 alerts:', error);
        }
      }

      const fixedAlerts = activeAlerts.filter(a => a.condition_type !== 'ema21_above');

      // 4. Check conditions
      for (const alert of fixedAlerts) {
        const quote = quotes[alert.symbol];
        if (!canEvaluateAlertQuote(quote)) continue;
        const currentPrice = quote.price;

        let isTriggered = false;
        if (alert.condition_type === 'above' && currentPrice >= alert.target_price) {
          isTriggered = true;
        } else if (alert.condition_type === 'below' && currentPrice <= alert.target_price) {
          isTriggered = true;
        }

        if (isTriggered) {
          // Trigger alert actions (like sending emails) before deactivating
          try {
            if (alert.email_enabled === 1 || alert.email_enabled === true) {
              // Pass the current price, backend will resolve the rest of the dynamic variables
              await alertService.triggerAlertActions(alert.id, { price: currentPrice, triggerTime: new Date().toISOString() });
            }
          } catch (e) {
            console.error('Error triggering alert actions:', e);
          }

          // Deactivate it in DB
          await alertService.deactivateAlert(alert.id);
          
          newTriggered.push({
            ...alert,
            triggered_price: currentPrice
          });
        }
      }

      // 5. Update local state if we triggered something
      if (newTriggered.length > 0) {
        setTriggeredAlerts(prev => [...prev, ...newTriggered]);
        await fetchAlerts(); // Refresh to update active status in UI
      }

    } catch (error) {
      if (userIdRef.current !== userId) return;
      setCurrentPrices({});
      setCurrentQuotes({});
      console.error('Error during alert price check:', error);
      setCheckError('No se pudieron comprobar las alertas. Se volverá a intentar en un minuto.');
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
      checkAlertPrices(); // Initial check on load

      intervalRef.current = setInterval(() => checkAlertPrices(), 60 * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAlerts([]);
      setTriggeredAlerts([]);
      setCurrentPrices({});
      setCurrentQuotes({});
      setEmaChecks({});
      setCheckError('');
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id]);

  const dismissTriggeredAlert = (id) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AlertsContext.Provider value={{
      alerts,
      loading,
      fetchAlerts,
      checkAlertPrices,
      currentPrices,
      currentQuotes,
      emaChecks,
      checkError,
      triggeredAlerts,
      dismissTriggeredAlert
    }}>
      {children}
    </AlertsContext.Provider>
  );
};
