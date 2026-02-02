/**
 * API Client for QuranIQ Backend
 * Connects to Firebase Auth + Vercel Backend
 */

import { auth } from './firebase-config.js';

const API_BASE = 'https://api.quraniq.app/api';

class APIClient {
  constructor() {
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  /**
   * Get Firebase ID token for authenticated requests
   */
  async getToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Failed to get token:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    if (!this.isOnline) {
      throw new Error('No internet connection. Please check your network.');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add Firebase token if user is authenticated
    if (auth.currentUser) {
      try {
        const token = await this.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to attach auth token:', error);
      }
    }

    const config = {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw error;
    }
  }

  // ============================================
  // USER SYNC
  // ============================================

  async syncUser() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    return this.request('/user/sync', {
      method: 'POST',
      body: {
        name: user.displayName || user.email?.split('@')[0],
        email: user.email
      }
    });
  }

  // ============================================
  // CHAT
  // ============================================

  async askQuestion(question, chatHistory = []) {
    return this.request('/chat/ask', {
      method: 'POST',
      body: { question, chatHistory }
    });
  }

  // ============================================
  // CHAPTERS
  // ============================================

  async createChapter(title, content) {
    return this.request('/chapters/create', {
      method: 'POST',
      body: { title, content }
    });
  }

  async listChapters() {
    return this.request('/chapters/list');
  }

  // ============================================
  // JOURNEYS
  // ============================================

  async updateJourneyProgress(journeyId, stepId) {
    return this.request('/journeys/progress', {
      method: 'POST',
      body: { journeyId, stepId }
    });
  }

  async getJourneyProgress() {
    return this.request('/journeys/progress');
  }

  // ============================================
  // UTILITIES
  // ============================================

  isAuthenticated() {
    return !!auth.currentUser;
  }

  getConnectionStatus() {
    return this.isOnline ? 'online' : 'offline';
  }
}

const apiClient = new APIClient();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}

export default apiClient;
