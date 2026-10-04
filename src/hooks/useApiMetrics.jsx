import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useAccount } from '../context/AccountContext';

export const useApiMetrics = () => {
  const { accountType } = useAccount();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiService.baseURL}/historical-metrics?account_type=${accountType}`, {
        headers: apiService.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error fetching historical metrics');
      }
      
      const data = await response.json();
      setMetrics(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  const updateMetric = async (id, updatedData) => {
    try {
      const response = await fetch(`${apiService.baseURL}/historical-metrics/${id}`, {
        method: 'PUT',
        headers: apiService.getHeaders(),
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        throw new Error('Error updating metric');
      }
      
      // Update local state
      setMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updatedData } : m));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const addMetric = async (month_year, account_type) => {
    try {
      const response = await fetch(`${apiService.baseURL}/historical-metrics`, {
        method: 'POST',
        headers: apiService.getHeaders(),
        body: JSON.stringify({ month_year, account_type })
      });

      if (!response.ok) {
        throw new Error('Error al agregar métrica');
      }

      const data = await response.json();
      if (data && data.data) {
        setMetrics(prev => [...prev, data.data]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al agregar métrica:', err);
      // Podrías setear el error global aquí si quieres, o manejarlo donde se llame
      return false;
    }
  };

  const sendHistoricalSummary = async (payload) => {
    try {
      const response = await fetch(`${apiService.baseURL}/historical-metrics/send-summary`, {
        method: 'POST',
        headers: apiService.getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar el resumen');
      }
      
      return await response.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { metrics, loading, error, updateMetric, addMetric, refreshMetrics: fetchMetrics, sendHistoricalSummary };
};
