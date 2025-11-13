const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');
    const headers = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.reload();
    }

    // Handle 204 No Content responses (like DELETE)
    if (response.status === 204) {
      if (!response.ok) throw new Error('Request failed');
      return null; // No content to parse
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Request failed');
    return data;
  },

  // Auth
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async verify() {
    return this.request('/auth/admin/verify');
  },

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  },

  // Portfolios
  async getPortfolios() {
    return this.request('/portfolios');
  },

  async createPortfolio(data) {
    return this.request('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePortfolio(id, data) {
    return this.request(`/portfolios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deletePortfolio(id) {
    return this.request(`/portfolios/${id}`, { method: 'DELETE' });
  },

  // Candidates
  async getCandidates() {
    return this.request('/candidates?active_only=false');
  },

  async createCandidate(data) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCandidate(id, data) {
    return this.request(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCandidate(id) {
    return this.request(`/candidates/${id}`, { method: 'DELETE' });
  },

  // Image upload for candidates
  async uploadCandidateImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/candidates/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Image upload failed');
    }

    return response.json();
  },

  // Electorates
  async getElectorates(skip = 0, limit = 100) {
    return this.request(`/admin/voters?skip=${skip}&limit=${limit}`);
  },

  async createElectorate(data) {
    return this.request('/electorates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateElectorate(id, data) {
    return this.request(`/electorates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteElectorate(id) {
    return this.request(`/electorates/${id}`, { method: 'DELETE' });
  },

  async bulkCreateElectorates(data) {
    return this.request('/electorates/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bulk upload electorates from Excel file
  async bulkUploadElectorates(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/electorates/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Bulk upload failed');
    }

    return response.json();
  },

  // Token Generation
  async generateTokensForAll(options = {}) {
    return this.request('/admin/generate-tokens/all', {
      method: 'POST',
      body: JSON.stringify({
        election_name: options.election_name || 'Election',
        voting_url: options.voting_url || window.location.origin,
        send_notifications: options.send_notifications ?? true,
        notification_methods: options.notification_methods || ['email', 'sms'],
        exclude_voted: options.exclude_voted ?? true,
      }),
    });
  },

  async generateTokensForElectorates(electorate_ids, options = {}) {
    return this.request('/admin/generate-tokens/bulk', {
      method: 'POST',
      body: JSON.stringify({
        electorate_ids,
        election_name: options.election_name || 'Election',
        voting_url: options.voting_url || window.location.origin,
        send_notifications: options.send_notifications ?? true,
        notification_methods: options.notification_methods || ['email', 'sms'],
      }),
    });
  },

  async regenerateTokenForElectorate(electorate_id, options = {}) {
    return this.request(`/admin/regenerate-token/${electorate_id}`, {
      method: 'POST',
      body: JSON.stringify({
        election_name: options.election_name || 'Election',
        voting_url: options.voting_url || window.location.origin,
        send_notification: options.send_notification ?? true,
        notification_methods: options.notification_methods || ['email', 'sms'],
      }),
    });
  },

  // Statistics
  async getStatistics() {
    return this.request('/admin/statistics');
  },

  async getResults() {
    return this.request('/admin/results');
  },

  async getRecentActivity(limit = 50) {
    return this.request(`/admin/recent-activity?limit=${limit}`);
  },
};