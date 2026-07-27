import config from '../config/environment';

const API_URL = `${config.API_URL}/api/alerts`; 

const getAuthHeaders = () => {
  const token = localStorage.getItem('st_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
};

const alertService = {
  /**
   * Obtiene todas las alertas del usuario
   * @returns {Promise<Array>} Lista de alertas
   */
  getAlerts: async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva alerta
   * @param {Object} alertData - { symbol, target_price, condition_type, notes }
   * @returns {Promise<Object>} La alerta creada
   */
  createAlert: async (alertData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(alertData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  },

  /**
   * Actualiza una alerta existente
   * @param {number|string} id - ID de la alerta
   * @param {Object} alertData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  updateAlert: async (id, alertData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(alertData),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  },

  /**
   * Elimina una alerta
   * @param {number|string} id - ID de la alerta
   * @returns {Promise<Object>}
   */
  deleteAlert: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  /**
   * Desactiva una alerta (por ejemplo, después de ser disparada)
   * @param {number|string} id - ID de la alerta
   * @returns {Promise<Object>}
   */
  deactivateAlert: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/deactivate`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error deactivating alert:', error);
      throw error;
    }
  },
};

export default alertService;
