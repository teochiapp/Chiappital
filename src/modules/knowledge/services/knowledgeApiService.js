// src/modules/knowledge/services/knowledgeApiService.js - API client para Knowledge Hub
import config from '../../../config/environment';

const BASE_URL = `${config.API_URL}/api/knowledge`;

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
    const err = new Error(data?.error?.message || 'Error en la solicitud');
    err.status = res.status;
    throw err;
  }
  return data;
}

const knowledgeApiService = {
  // Overview & Estadísticas
  getOverview: () => request('GET', '/overview'),

  // Áreas
  getAreas: () => request('GET', '/areas'),
  createArea: (data) => request('POST', '/areas', data),
  updateArea: (id, data) => request('PUT', `/areas/${id}`, data),
  deleteArea: (id) => request('DELETE', `/areas/${id}`),

  // Categorías
  getCategories: () => request('GET', '/categories'),
  createCategory: (data) => request('POST', '/categories', data),
  updateCategory: (id, data) => request('PUT', `/categories/${id}`, data),
  deleteCategory: (id) => request('DELETE', `/categories/${id}`),

  // Notas
  getNotes: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request('GET', `/notes${qs ? `?${qs}` : ''}`);
  },
  getNote: (id) => request('GET', `/notes/${id}`),
  createNote: (data) => request('POST', '/notes', data),
  updateNote: (id, data) => request('PUT', `/notes/${id}`, data),
  deleteNote: (id) => request('DELETE', `/notes/${id}`),
  toggleFavorite: (id) => request('POST', `/notes/${id}/favorite`),
  getNoteVersions: (id) => request('GET', `/notes/${id}/versions`),
  restoreNoteVersion: (id, versionId) => request('POST', `/notes/${id}/restore-version/${versionId}`),

  // Autocompletado de enlaces [[
  autocompleteNotes: (q = '') => request('GET', `/autocomplete-notes?q=${encodeURIComponent(q)}`),

  // Tags
  getTags: () => request('GET', '/tags'),

  // Relaciones
  getRelations: () => request('GET', '/relations'),
  createRelation: (data) => request('POST', '/relations', data),
  deleteRelation: (id) => request('DELETE', `/relations/${id}`),

  // Inbox & Captura
  getInbox: (status = 'inbox') => request('GET', `/inbox?status=${status}`),
  createInboxItem: (data) => request('POST', '/inbox', data),
  processInboxItem: (id, data) => request('POST', `/inbox/${id}/process`, data),
  deleteInboxItem: (id) => request('DELETE', `/inbox/${id}`),

  // Adjuntos
  uploadAttachment: async (formData) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Error al subir archivo');
    }
    return data;
  },

  // Grafo de conocimiento
  getGraph: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request('GET', `/graph${qs ? `?${qs}` : ''}`);
  },

  // Búsqueda global y contextual
  search: (q, filters = {}) => {
    const query = new URLSearchParams({ q, ...filters });
    return request('GET', `/search?${query.toString()}`);
  },

  // Exportador de Conocimiento
  getExportPreview: (data) => request('POST', '/export/preview', data),
  createExport: (data) => request('POST', '/export', data),
  downloadExportZip: async (downloadUrl, filename) => {
    const token = getToken();
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${config.API_URL}${downloadUrl}`;
    const res = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error('Error al descargar archivo de exportación');
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'knowledge-export.zip';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  },

  // Funciones de IA
  aiSummarize: (data) => request('POST', '/ai/summarize', data),
  aiClassify: (data) => request('POST', '/ai/classify', data),
  aiSuggestRelations: (noteId) => request('POST', '/ai/suggest-relations', { note_id: noteId }),
  aiChat: (message) => request('POST', '/ai/chat', { message }),
};

export default knowledgeApiService;
