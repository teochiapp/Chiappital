import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import alertService from '../services/alertService';
import priceService from '../services/priceService';
import { useStrapiAuth } from '../hooks/useApiTrades'; // Provides the user auth

const AlertsContext = createContext();

export const useAlerts = () => useContext(AlertsContext);

export const AlertsProvider = ({ children }) => {
  const { user } = useStrapiAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts in context:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run the check logic
  const checkAlertPrices = async () => {
    if (!user) return;
    try {
      // 1. Fetch latest active alerts
      const currentAlerts = await alertService.getAlerts();
      setAlerts(currentAlerts);

      const activeAlerts = currentAlerts.filter(a => a.is_active === 1);
      if (activeAlerts.length === 0) return;

      // 2. Extract unique symbols
      const symbols = [...new Set(activeAlerts.map(a => a.symbol))];

      // 3. Fetch prices for these symbols
      const pricesMap = await priceService.getMultiplePrices(symbols);
      setCurrentPrices(prev => ({ ...prev, ...pricesMap }));

      // 4. Check conditions
      const newTriggered = [];
      for (const alert of activeAlerts) {
        const currentPrice = pricesMap[alert.symbol];
        if (!currentPrice || currentPrice <= 0) continue;

        let isTriggered = false;
        if (alert.condition_type === 'above' && currentPrice >= alert.target_price) {
          isTriggered = true;
        } else if (alert.condition_type === 'below' && currentPrice <= alert.target_price) {
          isTriggered = true;
        }

        if (isTriggered) {
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
        fetchAlerts(); // Refresh to update active status in UI
      }

    } catch (error) {
      console.error('Error during alert price check:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
      checkAlertPrices(); // Initial check on load

      // Set up 15 minute interval
      const INTERVAL_MS = 15 * 60 * 1000;
      intervalRef.current = setInterval(checkAlertPrices, INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAlerts([]);
      setTriggeredAlerts([]);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

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
      triggeredAlerts,
      dismissTriggeredAlert
    }}>
      {children}
    </AlertsContext.Provider>
  );
};
