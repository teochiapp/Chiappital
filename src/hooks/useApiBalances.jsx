import { useState, useCallback, useEffect } from 'react';
import apiService from '../services/apiService';
import { useAccount } from '../context/AccountContext';

export const useApiBalances = () => {
  const { accountType } = useAccount();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getBalance(accountType);
      
      if (res.data) {
        setBalance(res.data.total_usd);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err.message || 'Error al obtener balance');
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  const updateBalance = useCallback(async (newTotalUsd) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.updateBalance(accountType, newTotalUsd);
      
      if (res.data) {
        setBalance(res.data.total_usd);
        return true;
      }
    } catch (err) {
      console.error('Error updating balance:', err);
      setError(err.message || 'Error al actualizar balance');
      return false;
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    updateBalance,
    refreshBalance: fetchBalance
  };
};
