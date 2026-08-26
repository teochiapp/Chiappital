// services/personalApiService.js — Llamadas al backend del Personal Hub
import config from '../../../config/environment';

const BASE_URL = `${config.API_URL}/api/personal`;

function getToken() {
  return localStorage.getItem('st_token');
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Error de red');
    err.status = res.status;
    throw err;
  }
  return data;
}

const personalApiService = {
  // Features
  getFeatures: () => request('GET', '/features'),
  updateFeature: (feature_name, enabled) => request('PUT', '/features', { feature_name, enabled }),

  // Habits
  getHabits: () => request('GET', '/habits'),
  createHabit: (habit) => request('POST', '/habits', habit),
  updateHabit: (id, habit) => request('PUT', `/habits/${id}`, habit),
  deleteHabit: (id) => request('DELETE', `/habits/${id}`),
  toggleHabit: (id, date) => request('POST', `/habits/${id}/toggle`, { date }),

  // Goals
  getGoals: () => request('GET', '/goals'),
  createGoal: (goal) => request('POST', '/goals', goal),
  updateGoal: (id, goal) => request('PUT', `/goals/${id}`, goal),
  deleteGoal: (id) => request('DELETE', `/goals/${id}`),

  // Vocabulary
  getVocabulary: () => request('GET', '/vocabulary'),
  createVocabulary: (data) => request('POST', '/vocabulary', data),
  updateVocabulary: (id, data) => request('PUT', `/vocabulary/${id}`, data),
  reviewVocabulary: (id, quality) => request('PUT', `/vocabulary/${id}/review`, { quality }),
  deleteVocabulary: (id) => request('DELETE', `/vocabulary/${id}`),

  // Mental Models
  getMentalModels: () => request('GET', '/mental-models'),
  createMentalModel: (data) => request('POST', '/mental-models', data),
  updateMentalModel: (id, data) => request('PUT', `/mental-models/${id}`, data),
  reviewMentalModel: (id, quality) => request('PUT', `/mental-models/${id}/review`, { quality }),
  deleteMentalModel: (id) => request('DELETE', `/mental-models/${id}`),

  // Fitness
  getFitness: () => request('GET', '/fitness'),
  updateFitnessPr: (exercise, record_value) => request('PUT', '/fitness/pr', { exercise, record_value }),
  logWorkout: () => request('POST', '/fitness/workout'),

  // Journal
  getJournals: () => request('GET', '/journals'),
  createJournal: (journalData) => request('POST', '/journals', journalData),
  updateJournal: (id, journalData) => request('PUT', `/journals/${id}`, journalData),

  // Focus Sessions
  getFocusSessions: () => request('GET', '/focus-sessions'),
  createFocusSession: (sessionData) => request('POST', '/focus-sessions', sessionData),
  updateFocusSession: (id, sessionData) => request('PUT', `/focus-sessions/${id}`, sessionData),
  deleteFocusSession: (id) => request('DELETE', `/focus-sessions/${id}`),

  // ─── Mediterranean Recipes ─────────────────────────────────────────────────
  getMedRecipes: () => request('GET', '/mediterranean/recipes'),
  getMedRecipe: (id) => request('GET', `/mediterranean/recipes/${id}`),
  createMedRecipe: (data) => request('POST', '/mediterranean/recipes', data),
  updateMedRecipe: (id, data) => request('PUT', `/mediterranean/recipes/${id}`, data),
  deleteMedRecipe: (id) => request('DELETE', `/mediterranean/recipes/${id}`),

  // Mediterranean History
  addMedHistory: (data) => request('POST', '/mediterranean/history', data),
  getMedStats: () => request('GET', '/mediterranean/stats'),

  // Mediterranean Shopping
  getMedShopping: () => request('GET', '/mediterranean/shopping'),
  addMedShoppingItems: (items) => request('POST', '/mediterranean/shopping', { items }),
  toggleMedShoppingItem: (id, checked) => request('PUT', `/mediterranean/shopping/${id}`, { checked }),
  deleteMedShoppingItem: (id) => request('DELETE', `/mediterranean/shopping/${id}`),
  clearMedShopping: (onlyChecked = false) => {
    const token = localStorage.getItem('st_token');
    return fetch(`${BASE_URL}/mediterranean/shopping/clear?onlyChecked=${onlyChecked}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
  },

  // Mediterranean Weekly Goals
  getMedWeeklyGoals: () => request('GET', '/mediterranean/weekly-goals'),
  updateMedWeeklyGoals: (data) => request('PUT', '/mediterranean/weekly-goals', data),
};

export default personalApiService;
