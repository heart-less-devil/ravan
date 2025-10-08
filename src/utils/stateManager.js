// Centralized state management that uses MongoDB as primary source
// and sessionStorage only for temporary data like tokens

import { API_BASE_URL } from '../config';

class StateManager {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  // Get data from cache, sessionStorage, or fetch from MongoDB
  async get(key, fetchFromAPI = null) {
    // First check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Then check sessionStorage for temporary data
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        this.cache.set(key, parsed);
        return parsed;
      } catch (e) {
        console.warn(`Invalid sessionStorage data for ${key}`);
      }
    }

    // Finally fetch from API if provided
    if (fetchFromAPI) {
      try {
        const data = await fetchFromAPI();
        this.cache.set(key, data);
        return data;
      } catch (error) {
        console.error(`Error fetching ${key} from API:`, error);
        return null;
      }
    }

    return null;
  }

  // Set data in cache and optionally in sessionStorage
  set(key, value, persistInSession = false) {
    this.cache.set(key, value);
    
    if (persistInSession) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Could not save ${key} to sessionStorage:`, e);
      }
    }

    // Notify listeners
    this.notifyListeners(key, value);
  }

  // Remove data from cache and sessionStorage
  remove(key) {
    this.cache.delete(key);
    sessionStorage.removeItem(key);
    this.notifyListeners(key, null);
  }

  // Clear all data
  clear() {
    this.cache.clear();
    sessionStorage.clear();
    this.notifyListeners('*', null);
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(callback);
      }
    };
  }

  // Notify listeners of state changes
  notifyListeners(key, value) {
    // Notify specific key listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(value);
        } catch (e) {
          console.error(`Error in listener for ${key}:`, e);
        }
      });
    }

    // Notify global listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => {
        try {
          callback(key, value);
        } catch (e) {
          console.error('Error in global listener:', e);
        }
      });
    }
  }

  // User-specific methods
  async getUserData() {
    return await this.get('user', async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    });
  }

  async getUserCredits() {
    const user = await this.getUserData();
    return user ? user.currentCredits : 0;
  }

  async updateUserCredits(newCredits) {
    const user = await this.getUserData();
    if (user) {
      user.currentCredits = newCredits;
      this.set('user', user, true);
    }
  }

  // BD Tracker specific methods
  async getBDTrackerColumnHeadings() {
    const token = sessionStorage.getItem('token');
    if (!token) return {};

    try {
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/column-headings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.columnHeadings || {};
      }
      return {};
    } catch (error) {
      console.error('Error fetching column headings:', error);
      return {};
    }
  }

  async saveBDTrackerColumnHeadings(headings) {
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    try {
      console.log('Saving column headings:', headings);
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/column-headings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ columnHeadings: headings })
      });

      console.log('Save response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Save response data:', data);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error saving BD Tracker column headings:', error);
      return false;
    }
  }
}

// Create singleton instance
const stateManager = new StateManager();

export default stateManager;
