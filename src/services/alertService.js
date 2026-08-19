import config from '../config/environment';

const API_URL = `${config.API_URL}/api/alerts`; 

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('st_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
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

  /**
   * Actualiza la configuración de email de una alerta
   * @param {number|string} id - ID de la alerta
   * @param {Object} config - Configuración (email_enabled, email_recipient, email_subject, email_template, email_includes, image, remove_image)
   */
  updateAlertEmailConfig: async (id, config) => {
    try {
      let body, isFormData = false;
      
      if (config.image instanceof File || config.remove_image) {
        isFormData = true;
        body = new FormData();
        Object.keys(config).forEach(key => {
          if (config[key] !== undefined && config[key] !== null) {
            body.append(key, typeof config[key] === 'object' && !(config[key] instanceof File) ? JSON.stringify(config[key]) : config[key]);
          }
        });
      } else {
        body = JSON.stringify(config);
      }

      const response = await fetch(`${API_URL}/${id}/email-config`, {
        method: 'PUT',
        headers: getAuthHeaders(isFormData),
        body: body,
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating email config:', error);
      throw error;
    }
  },

  /**
   * Dispara las acciones configuradas de una alerta (ej: enviar email)
   * @param {number|string} id - ID de la alerta
   * @param {Object} triggerData - Datos del mercado al momento de disparar
   */
  triggerAlertActions: async (id, triggerData) => {
    try {
      const response = await fetch(`${API_URL}/${id}/trigger-actions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ triggerData }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error triggering alert actions:', error);
      throw error;
    }
  },

  /**
   * Envía un email de prueba con la configuración dada
   */
  sendTestEmail: async (id, config) => {
    try {
      let body, isFormData = false;
      
      if (config.image instanceof File) {
        isFormData = true;
        body = new FormData();
        Object.keys(config).forEach(key => {
          if (config[key] !== undefined && config[key] !== null) {
            body.append(key, typeof config[key] === 'object' && !(config[key] instanceof File) ? JSON.stringify(config[key]) : config[key]);
          }
        });
      } else {
        body = JSON.stringify(config);
      }

      const response = await fetch(`${API_URL}/${id}/test-email`, {
        method: 'POST',
        headers: getAuthHeaders(isFormData),
        body: body,
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },
};

export default alertService;
