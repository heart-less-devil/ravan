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
  useCredits(amount) {
    const currentCredits = parseInt(localStorage.getItem('userCredits') || '5');
    const newCredits = Math.max(0, currentCredits - amount);
    localStorage.setItem('userCredits', newCredits.toString());
    
    console.log(`Credits used: ${amount}, remaining: ${newCredits}`);
    this.notifyListeners(newCredits);
    
    return newCredits;
  }

  // Get current credits
  getCurrentCredits() {
    return parseInt(localStorage.getItem('userCredits') || '5');
  }

  // Set credits (for admin or plan changes)
  setCredits(amount) {
    localStorage.setItem('userCredits', amount.toString());
    this.notifyListeners(amount);
  }
}

// Create a singleton instance
const creditTracker = new CreditTracker();

export default creditTracker;
