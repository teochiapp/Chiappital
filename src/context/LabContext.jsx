import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const LabContext = createContext();

export const useLabData = () => useContext(LabContext);

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEYS = {
  sector: 'chiappital_sectorAnalysis',
  country: 'chiappital_countryAnalysis',
  checklist: 'chiappital_checklistHistory',
  marketStrategy: 'chiappital_marketStrategy',
};

const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const lsSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─── Defensive server-response parser ────────────────────────────────────────
const safeParse = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return val;
};

export const LabProvider = ({ children }) => {
  // Initialize immediately from localStorage — no loading delay
  const [sectorData, setSectorData] = useState(() => lsGet(LS_KEYS.sector, {}));
  const [countryData, setCountryData] = useState(() => lsGet(LS_KEYS.country, {}));
  const [checklistHistory, setChecklistHistory] = useState(() => lsGet(LS_KEYS.checklist, []));
  const [marketStrategy, setMarketStrategy] = useState(() => lsGet(LS_KEYS.marketStrategy, { text: '', lastUpdated: null }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Try to sync from server on mount (non-blocking)
  const fetchLabData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getLabPreferences();
      const serverSector = safeParse(data.sectorAnalysis, null);
      const serverCountry = safeParse(data.countryAnalysis, null);
      const serverChecklist = safeParse(data.checklistHistory, null);
      const serverMarketStrategy = safeParse(data.marketStrategy, null);

      // Only update if server has data (don't overwrite local with empty)
      if (serverSector && Object.keys(serverSector).length > 0) {
        setSectorData(serverSector);
        lsSet(LS_KEYS.sector, serverSector);
      }
      if (serverCountry && Object.keys(serverCountry).length > 0) {
        setCountryData(serverCountry);
        lsSet(LS_KEYS.country, serverCountry);
      }
      if (serverChecklist && serverChecklist.length > 0) {
        setChecklistHistory(serverChecklist);
        lsSet(LS_KEYS.checklist, serverChecklist);
      }
      if (serverMarketStrategy) {
        setMarketStrategy(serverMarketStrategy);
        lsSet(LS_KEYS.marketStrategy, serverMarketStrategy);
      }
      setError(null);
    } catch (err) {
      // Server unavailable — localStorage data already loaded, just log silently
      console.warn('Lab sync: usando datos locales (servidor no disponible):', err.message);
      setError(null); // Don't surface error to UI, localStorage has the data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // ─── Update functions: localStorage FIRST, then try server ────────────────

  const updateSectorData = async (newSectorData) => {
    // 1. Save to state + localStorage immediately (instant persistence)
    setSectorData(newSectorData);
    lsSet(LS_KEYS.sector, newSectorData);
    // 2. Try to sync to server (non-blocking, best-effort)
    try {
      await apiService.updateLabPreferences({ sectorAnalysis: newSectorData });
    } catch (err) {
      console.warn('Lab sync: sector guardado localmente, fallo en servidor:', err.message);
      throw err; // Re-throw so SaveButton shows error state
    }
  };

  const updateCountryData = async (newCountryData) => {
    setCountryData(newCountryData);
    lsSet(LS_KEYS.country, newCountryData);
    try {
      await apiService.updateLabPreferences({ countryAnalysis: newCountryData });
    } catch (err) {
      console.warn('Lab sync: country guardado localmente, fallo en servidor:', err.message);
      throw err;
    }
  };

  const updateChecklistHistory = async (newHistory) => {
    setChecklistHistory(newHistory);
    lsSet(LS_KEYS.checklist, newHistory);
    try {
      await apiService.updateLabPreferences({ checklistHistory: newHistory });
    } catch (err) {
      console.warn('Lab sync: checklist guardado localmente, fallo en servidor:', err.message);
    }
  };

  const updateMarketStrategy = async (newStrategy) => {
    setMarketStrategy(newStrategy);
    lsSet(LS_KEYS.marketStrategy, newStrategy);
    try {
      await apiService.updateLabPreferences({ marketStrategy: newStrategy });
    } catch (err) {
      console.warn('Lab sync: market strategy guardado localmente, fallo en servidor:', err.message);
      throw err;
    }
  };

  return (
    <LabContext.Provider
      value={{
        sectorData,
        updateSectorData,
        countryData,
        updateCountryData,
        checklistHistory,
        updateChecklistHistory,
        marketStrategy,
        updateMarketStrategy,
        loading,
        error,
        refreshLabData: fetchLabData
      }}
    >
      {children}
    </LabContext.Provider>
  );
};
