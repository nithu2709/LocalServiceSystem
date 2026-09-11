const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth header
const getHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('localservice_token');
  const userId = localStorage.getItem('localservice_user_id');

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }

  return headers;
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // 15-second request timeout controller to prevent infinite pending state
  const controller = new AbortController();
  const timeoutMs = options.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    signal: options.signal || controller.signal,
    headers: getHeaders(options.headers),
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
        data?.message ||
        data?.error_description ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. The server may be waking up, please try again.');
      timeoutErr.status = 408;
      console.error(`API [${config.method || 'GET'} ${endpoint}] timeout error`);
      throw timeoutErr;
    }
    console.error(`API [${config.method || 'GET'} ${endpoint}] error:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      localStorage.setItem('localservice_token', data.token);
      localStorage.setItem('localservice_user', JSON.stringify(data.user));
      localStorage.setItem('localservice_user_id', data.user.id);
    }
    return data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    if (data.token) {
      localStorage.setItem('localservice_token', data.token);
      localStorage.setItem('localservice_user', JSON.stringify(data.user));
      localStorage.setItem('localservice_user_id', data.user.id);
    }
    return data;
  },

  verifyEmail: async (token) => {
    return request('/auth/verify-email', {
      method: 'POST',
      body: { token },
    });
  },

  resendVerification: async (email) => {
    return request('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  },

  getCurrentUser: async () => {
    return request('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('localservice_token');
    localStorage.removeItem('localservice_user');
    localStorage.removeItem('localservice_user_id');
  },

  getStoredUser: () => {
    try {
      const raw = localStorage.getItem('localservice_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Categories (strictly 3 allowed)
  getCategories: async () => {
    return request('/categories');
  },

  // Service Requests
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_id) params.append('category_id', filters.category_id);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return request(`/requests${queryStr}`);
  },

  getRequestById: async (id) => {
    return request(`/requests/${id}`);
  },

  createRequest: async (requestData) => {
    return request('/requests', {
      method: 'POST',
      body: requestData,
    });
  },

  updateRequest: async (id, requestData) => {
    return request(`/requests/${id}`, {
      method: 'PUT',
      body: requestData,
    });
  },

  deleteRequest: async (id) => {
    return request(`/requests/${id}`, {
      method: 'DELETE',
    });
  },

  updateRequestStatus: async (id, status) => {
    return request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  confirmCompletion: async (id) => {
    return request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: { status: 'COMPLETED' },
    });
  },

  assignProvider: async (id, providerId) => {
    return request(`/requests/${id}/assign`, {
      method: 'POST',
      body: { provider_id: providerId },
    });
  },

  // Providers
  getProviders: async (categoryId = null) => {
    const endpoint = categoryId ? `/providers?category_id=${categoryId}` : '/providers';
    return request(endpoint);
  },

  toggleAvailability: async (availability) => {
    return request('/providers/availability', {
      method: 'PATCH',
      body: { availability },
    });
  },

  // Reviews
  submitReview: async (reviewData) => {
    return request('/reviews', {
      method: 'POST',
      body: reviewData,
    });
  },

  getReviews: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.provider_id) params.append('provider_id', filters.provider_id);
    if (filters.request_id) params.append('request_id', filters.request_id);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return request(`/reviews${queryStr}`);
  },

  // Admin
  getAdminStats: async () => {
    return request('/admin/stats');
  },

  getAdminActivity: async () => {
    return request('/admin/activity');
  },

  getAdminUsers: async () => {
    return request('/admin/users');
  },

  // Reseed
  triggerSeed: async () => {
    return request('/seed', { method: 'POST' });
  },
};
