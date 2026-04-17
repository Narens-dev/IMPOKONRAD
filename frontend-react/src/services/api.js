// api.js - Backend Connection (REST API)
const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};


export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    // Guardar con la clave 'access_token' (igual que en ProtectedRoute)
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export const bodegasAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/bodegas/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error fetch');
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/bodegas/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error create');
    return res.json();
  }
};

export const contenedoresAPI = {
  getAll: async (estado = null) => {
    let url = `${API_BASE_URL}/contenedores/`;
    if (estado) url += `?estado=${estado}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error fetch');
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/contenedores/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      let msg = 'Error desconocido al registrar';
      if (err.detail) {
        msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      }
      throw new Error(msg);
    }
    return res.json();
  },
};

export const manifiestosAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/manifiestos/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error fetch');
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/manifiestos/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error create');
    return res.json();
  }
};

export const facturasAPI = {
  getAll: async (estado = null) => {
    let url = `${API_BASE_URL}/facturas/`;
    if (estado) url += `?estado=${estado}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error fetch');
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/facturas/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },
  patch: async (facturaId, data) => {
    const res = await fetch(`${API_BASE_URL}/facturas/${facturaId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }
};

export const trackingAPI = {
  getLatest: async (contenedorId) => {
    const res = await fetch(`${API_BASE_URL}/tracking/latest/${contenedorId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('No tracking');
    return res.json();
  },
  getHistory: async (contenedorId) => {
    const res = await fetch(`${API_BASE_URL}/tracking/${contenedorId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error tracking array');
    return res.json();
  }
};

export const dashboardAPI = {
  getResumen: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/resumen`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error dashboard');
    return res.json();
  }
};

export const iaAPI = {
  /**
   * Procesa una factura (imagen o PDF) usando Gemini Vision.
   * Envía el archivo como multipart/form-data para evitar límites de tamaño en base64.
   * @param {File} archivoFile - El objeto File nativo del navegador.
   * @param {string} nombreArchivo - Nombre original del archivo.
   * @returns {Promise<{factura: object, datos_ia: object, mensaje: string}>}
   */
  procesarFactura: async (archivoFile, nombreArchivo = "factura.jpg") => {
    const formData = new FormData();
    formData.append('archivo', archivoFile, nombreArchivo);

    // Para FormData NO incluir Content-Type (el browser lo pone automáticamente con el boundary)
    const token = localStorage.getItem('access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/ia/procesar-factura/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error al procesar la factura (HTTP ${res.status})`);
    }

    return res.json();
  },

};


export default API_BASE_URL;
