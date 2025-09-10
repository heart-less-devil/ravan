// Credit tracking utility
class CreditTracker {
  constructor() {
    this.listeners = [];
  }

  // Add a listener for credit changes
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of credit changes
  notifyListeners(credits) {
    this.listeners.forEach(listener => listener(credits));
  }

  // Use credits and notify listeners
  async useCredits(amount) {
    // Try to sync with backend first
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/auth/use-credit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Use backend credits if available
          if (data.remainingCredits !== undefined) {
            this.notifyListeners(data.remainingCredits);
            return data.remainingCredits;
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync credits with backend:', error);
      // Continue with local credits if backend fails
    }
    
    // Fallback to local calculation
    const currentCredits = this.getCurrentCredits();
    const newCredits = Math.max(0, currentCredits - amount);
    console.log(`Credits used: ${amount}, remaining: ${newCredits}`);
    this.notifyListeners(newCredits);
    
    return newCredits;
  }

  // Get current credits (fallback to 5 for new users)
  getCurrentCredits() {
    return 5; // Default fallback
  }

  // Get credits from backend without refreshing UI unnecessarily
  async getCreditsFromBackend() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/auth/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.currentCredits;
      }
    } catch (error) {
      console.error('Failed to fetch credits from backend:', error);
    }
    return null;
  }

  // Check if credits need refresh (only for paid users)
  shouldRefreshCredits() {
    // Always refresh credits from backend for real-time accuracy
    return true;
  }

  // Set credits (for admin or plan changes)
  setCredits(amount) {
    this.notifyListeners(amount);
  }
}

// Create a singleton instance
const creditTracker = new CreditTracker();

export default creditTracker;
