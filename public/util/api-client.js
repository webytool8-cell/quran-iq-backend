/**
 * API Client for QuranIQ Backend
 * Handles all HTTP requests to Vercel backend
 * 
 * Mobile-Ready: Works in WebView and Progressive Web App contexts
 */

const API_BASE = 'https://quraniq.app/api';

class APIClient {
  constructor() {
    this.token = this.getStoredToken();
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events (important for mobile)
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  getStoredToken() {
    try {
      return localStorage.getItem('quran_iq_token');
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  setToken(token) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('quran_iq_token', token);
      } else {
        localStorage.removeItem('quran_iq_token');
      }
    } catch (e) {
      console.warn('Failed to store token:', e);
    }
  }

  async request(endpoint, options = {}) {
    // Offline check (critical for mobile apps)
    if (!this.isOnline) {
      throw new Error('No internet connection. Please check your network.');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
      // Mobile timeout: 15 seconds (slower mobile networks)
      signal: AbortSignal.timeout(15000)
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      // Use Trickle Proxy to avoid CORS errors and ensure connectivity
      const targetUrl = `${API_BASE}${endpoint}`;
      // Note: We route through the proxy to handle cross-origin restrictions in the web view
      const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Network error handling for mobile
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    
    this.setToken(data.token);
    return data.user;
  }

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
    
    this.setToken(data.token);
    return data.user;
  }

  async verifySession() {
    if (!this.token) return null;

    try {
      const data = await this.request('/auth/verify', {
        method: 'POST',
        body: { token: this.token }
      });
      return data.user;
    } catch (error) {
      console.warn('Session verification failed:', error);
      this.setToken(null);
      return null;
    }
  }

  logout() {
    this.setToken(null);
  }

  // ============================================
  // CHAT ENDPOINTS
  // ============================================

  async askQuestion(question, chatHistory = []) {
    return this.request('/chat/ask', {
      method: 'POST',
      body: { question, chatHistory }
    });
  }

  // ============================================
  // CHAPTERS ENDPOINTS
  // ============================================

  async createChapter(userId, title, content) {
    return this.request('/chapters/create', {
      method: 'POST',
      body: { userId, title, content }
    });
  }

  async listChapters(userId) {
    return this.request(`/chapters/list?userId=${userId}`);
  }

  async deleteChapter(chapterId) {
    return this.request('/chapters/delete', {
      method: 'DELETE',
      body: { chapterId }
    });
  }

  // ============================================
  // JOURNEYS ENDPOINTS
  // ============================================

  async updateJourneyProgress(userId, journeyId, stepId) {
    return this.request('/journeys/progress', {
      method: 'POST',
      body: { userId, journeyId, stepId }
    });
  }

  async getJourneyProgress(userId) {
    return this.request(`/journeys/progress?userId=${userId}`);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  isAuthenticated() {
    return !!this.token;
  }

  getConnectionStatus() {
    return this.isOnline ? 'online' : 'offline';
  }
}

// Export singleton instance
const apiClient = new APIClient();

// Make available globally for debugging in mobile WebView
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}