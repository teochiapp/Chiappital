// hooks/useApi.js - Hook personalizado para manejar llamadas a la API
import { useState, useEffect } from 'react';
import ApiService from '../services/api';

const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiService = new ApiService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.get(endpoint);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (endpoint) {
      fetchData();
    }
  }, [endpoint]);

  return { data, loading, error };
};

export default useApi;
