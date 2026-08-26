// context/PersonalHubContext.js — Estado global del Personal Hub
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import personalApiService from '../modules/personal/services/personalApiService';

const PersonalHubContext = createContext();

export const usePersonalHub = () => useContext(PersonalHubContext);

export const PersonalHubProvider = ({ children }) => {
  const [features, setFeatures] = useState({ personal_hub: false, investment_hub: true });
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const [mentalModels, setMentalModels] = useState([]);
  const [fitness, setFitness] = useState({ prs: [], weekly_workouts: 0 });
  const [journals, setJournals] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [featData, habitsData, goalsData, vocabData, fitnessData, journalsData, focusData, mentalModelsData] = await Promise.all([
        personalApiService.getFeatures(),
        personalApiService.getHabits(),
        personalApiService.getGoals(),
        personalApiService.getVocabulary(),
        personalApiService.getFitness(),
        personalApiService.getJournals().catch(() => ({ journals: [] })), // Fallback si no existe
        personalApiService.getFocusSessions().catch(() => ({ sessions: [] })),
        personalApiService.getMentalModels().catch(() => ({ models: [] })),
      ]);
      setFeatures(featData.features || { personal_hub: false, investment_hub: true });
      setHabits(habitsData.habits || []);
      setGoals(goalsData.goals || []);
      setVocabulary(vocabData.vocabulary || []);
      setMentalModels(mentalModelsData.models || []);
      setFitness(fitnessData || { prs: [], weekly_workouts: 0 });
      setJournals(journalsData.journals || []);
      setFocusSessions(focusData.sessions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Alert check interval for Focus Sessions
  useEffect(() => {
    const checkFocusSessions = () => {
      const now = new Date();
      const currentActive = focusSessions.find(session => {
        if (session.status === 'completed' || session.status === 'cancelled') return false;
        
        const sessionDate = new Date(session.session_date);
        const diffMs = sessionDate - now;
        const diffMins = diffMs / 1000 / 60;
        
        // Active if it's within 30 minutes before, OR during the session (up to sessionDate + duration)
        const durationMins = session.duration || 0;
        return diffMins <= 30 && diffMins >= -durationMins;
      });
      
      setActiveFocusSession(currentActive || null);
    };

    // Check immediately and then every minute
    checkFocusSessions();
    const interval = setInterval(checkFocusSessions, 60000);
    return () => clearInterval(interval);
  }, [focusSessions]);

  // ─── Habits ────────────────────────────────────────────────────────────────

  const createHabit = async (habit) => {
    const data = await personalApiService.createHabit(habit);
    setHabits(prev => [...prev, data.habit]);
    return data.habit;
  };

  const updateHabit = async (id, updates) => {
    await personalApiService.updateHabit(id, updates);
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = async (id) => {
    await personalApiService.deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const toggleHabit = async (id, date) => {
    const data = await personalApiService.toggleHabit(id, date);
    const completedOn = data.date;
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const completions = data.completed
        ? [...(h.completions || []), completedOn]
        : (h.completions || []).filter(d => d !== completedOn);
      return { ...h, completions };
    }));
    return data;
  };

  // ─── Goals ─────────────────────────────────────────────────────────────────

  const createGoal = async (goal) => {
    const data = await personalApiService.createGoal(goal);
    setGoals(prev => [data.goal, ...prev]);
    return data.goal;
  };

  const updateGoal = async (id, updates) => {
    const data = await personalApiService.updateGoal(id, updates);
    setGoals(prev => prev.map(g => g.id === id ? data.goal : g));
    return data.goal;
  };

  const deleteGoal = async (id) => {
    await personalApiService.deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // ─── Vocabulary ────────────────────────────────────────────────────────────

  const createVocabulary = async (wordData) => {
    const data = await personalApiService.createVocabulary(wordData);
    setVocabulary(prev => [data.word, ...prev]);
    return data.word;
  };

  const updateVocabulary = async (id, wordData) => {
    const data = await personalApiService.updateVocabulary(id, wordData);
    setVocabulary(prev => prev.map(w => w.id === id ? data.word : w));
    return data.word;
  };

  const reviewVocabulary = async (id, quality) => {
    const data = await personalApiService.reviewVocabulary(id, quality);
    setVocabulary(prev => prev.map(w => w.id === id ? data.word : w));
    return data.word;
  };

  const deleteVocabulary = async (id) => {
    await personalApiService.deleteVocabulary(id);
    setVocabulary(prev => prev.filter(w => w.id !== id));
  };

  // ─── Mental Models ─────────────────────────────────────────────────────────

  const createMentalModel = async (modelData) => {
    const data = await personalApiService.createMentalModel(modelData);
    setMentalModels(prev => [data.model, ...prev]);
    return data.model;
  };

  const updateMentalModel = async (id, modelData) => {
    const data = await personalApiService.updateMentalModel(id, modelData);
    setMentalModels(prev => prev.map(m => m.id === id ? data.model : m));
    return data.model;
  };

  const reviewMentalModel = async (id, quality) => {
    const data = await personalApiService.reviewMentalModel(id, quality);
    setMentalModels(prev => prev.map(m => m.id === id ? data.model : m));
    return data.model;
  };

  const deleteMentalModel = async (id) => {
    await personalApiService.deleteMentalModel(id);
    setMentalModels(prev => prev.filter(m => m.id !== id));
  };

  // ─── Fitness ───────────────────────────────────────────────────────────────

  const updateFitnessPr = async (exercise, record_value) => {
    await personalApiService.updateFitnessPr(exercise, record_value);
    await fetchAll(); // Refresh todo para actualizar el PR y el "Último PR"
  };

  const logWorkout = async () => {
    await personalApiService.logWorkout();
    await fetchAll();
  };

  // ─── Journals ──────────────────────────────────────────────────────────────

  const createJournal = async (journalData) => {
    try {
      const data = await personalApiService.createJournal(journalData);
      setJournals(prev => [data.journal, ...prev]);
      return data.journal;
    } catch (err) {
      // Si ya existe un journal para esa fecha (409), hacer upsert
      if (err.status === 409) {
        // Buscar la entrada existente por fecha en el estado local
        const existing = journals.find(j => j.date === journalData.date);
        if (existing) {
          return updateJournal(existing.id, { content: journalData.content });
        }
        // Si no está en el estado local, refrescar y reintentar
        await fetchAll();
        const updated = journals.find(j => j.date === journalData.date);
        if (updated) {
          return updateJournal(updated.id, { content: journalData.content });
        }
      }
      throw err;
    }
  };

  const updateJournal = async (id, journalData) => {
    const data = await personalApiService.updateJournal(id, journalData);
    setJournals(prev => prev.map(j => j.id === id ? data.journal : j));
    return data.journal;
  };

  // ─── Focus Sessions ────────────────────────────────────────────────────────

  const createFocusSession = async (sessionData) => {
    const data = await personalApiService.createFocusSession(sessionData);
    setFocusSessions(prev => [data.session, ...prev]);
    return data.session;
  };

  const updateFocusSession = async (id, updates) => {
    const data = await personalApiService.updateFocusSession(id, updates);
    setFocusSessions(prev => prev.map(s => s.id === id ? data.session : s));
    return data.session;
  };

  const deleteFocusSession = async (id) => {
    await personalApiService.deleteFocusSession(id);
    setFocusSessions(prev => prev.filter(s => s.id !== id));
  };

  // ─── Feature flags ─────────────────────────────────────────────────────────

  const isPersonalHubEnabled = features.personal_hub === true;

  return (
    <PersonalHubContext.Provider
      value={{
        features,
        isPersonalHubEnabled,
        habits,
        goals,
        vocabulary,
        fitness,
        journals,
        loading,
        error,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        createGoal,
        updateGoal,
        deleteGoal,
        createVocabulary,
        updateVocabulary,
        reviewVocabulary,
        deleteVocabulary,
        mentalModels,
        createMentalModel,
        updateMentalModel,
        reviewMentalModel,
        deleteMentalModel,
        updateFitnessPr,
        logWorkout,
        createJournal,
        updateJournal,
        focusSessions,
        activeFocusSession,
        setActiveFocusSession,
        createFocusSession,
        updateFocusSession,
        deleteFocusSession,
        refresh: fetchAll,
      }}
    >
      {children}
    </PersonalHubContext.Provider>
  );
};
