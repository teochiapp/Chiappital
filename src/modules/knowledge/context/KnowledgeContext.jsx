// src/modules/knowledge/context/KnowledgeContext.jsx - Contexto global para Knowledge Hub
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import knowledgeApiService from '../services/knowledgeApiService';

const KnowledgeContext = createContext(null);

export const KnowledgeProvider = ({ children }) => {
  const [overview, setOverview] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureType, setQuickCaptureType] = useState('note'); // 'note' | 'url' | 'idea'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalCategory, setExportModalCategory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const data = await knowledgeApiService.getOverview();
      setOverview(data);
      setInboxCount(data.metrics?.inboxCount || 0);
    } catch (err) {
      console.error('Error cargando overview de Knowledge Hub:', err);
    }
  }, []);

  const loadAreas = useCallback(async () => {
    try {
      const data = await knowledgeApiService.getAreas();
      setAreas(data.areas || []);
    } catch (err) {
      console.error('Error cargando áreas:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadOverview(), loadAreas()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadAreas]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openQuickCapture = (type = 'note') => {
    setQuickCaptureType(type);
    setIsQuickCaptureOpen(true);
  };

  const closeQuickCapture = () => {
    setIsQuickCaptureOpen(false);
  };

  const openExportModal = (category = null) => {
    setExportModalCategory(category);
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
    setExportModalCategory(null);
  };

  return (
    <KnowledgeContext.Provider
      value={{
        overview,
        areas,
        loading,
        error,
        inboxCount,
        refreshAll,
        loadOverview,
        loadAreas,
        isQuickCaptureOpen,
        quickCaptureType,
        openQuickCapture,
        closeQuickCapture,
        isExportModalOpen,
        exportModalCategory,
        openExportModal,
        closeExportModal,
        showToast,
        toastMessage,
      }}
    >
      {children}
    </KnowledgeContext.Provider>
  );
};

export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge debe usarse dentro de un KnowledgeProvider');
  }
  return context;
};

export default KnowledgeContext;
