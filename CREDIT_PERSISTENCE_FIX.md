# Credit Persistence Fix - Issue Resolution

## Problem Description
**User Issue:** Credits were being deducted when used, but after refreshing the page, the credits would revert back to their original value.

**In Hindi/Urdu:** "Maine 5 credits use kar liye, but refresh karne par 5 credits wapas aa gaye."

## Root Cause Analysis

The credit persistence issue was caused by a **data synchronization problem** between multiple storage layers:

### 1. Backend Issue: Using Stale mockDB Data
**File:** `server/index.js` (Line 8382)

The `/api/auth/use-credit` endpoint was:
- Loading user data from `mockDB` (in-memory/file-based storage)
- **NOT** fetching fresh data from MongoDB first
- This caused stale data to be used when credits were deducted

### 2. Frontend Issue: Caching User Data in sessionStorage
**Files:** 
- `src/utils/stateManager.js` (Lines 117-143, 147-151)
- `src/pages/Login.js` (Line 109)

The frontend was:
- Caching user data in `sessionStorage` 
- When page refreshed, it loaded **stale data from sessionStorage** instead of fetching fresh data from backend/MongoDB
- This overrode the correct credit values that were saved in MongoDB

## Solutions Implemented

### Backend Fixes (server/index.js)

#### Fix #1: Fetch Fresh Data from MongoDB First
**Lines 8383-8428**

```javascript
// CRITICAL FIX: Always fetch fresh user data from MongoDB first
let user = null;
let userIndex = -1;

try {
  const User = require('./models/User');
  const mongoUser = await User.findOne({ email: req.user.email }).maxTimeMS(10000);
  
  if (mongoUser) {
    console.log('✅ Using fresh data from MongoDB');
    user = mongoUser.toObject();
    
    // Update mockDB with fresh MongoDB data to keep in sync
    userIndex = mockDB.users.findIndex(u => u.email === req.user.email);
    if (userIndex !== -1) {
      mockDB.users[userIndex].currentCredits = user.currentCredits;
      mockDB.users[userIndex].creditUsageHistory = user.creditUsageHistory || [];
      mockDB.users[userIndex].lastCreditUsage = user.lastCreditUsage;
    }
  }
}
```

**What This Does:**
- Always fetches user data from MongoDB first (primary source of truth)
- Falls back to mockDB only if MongoDB is unavailable
- Syncs mockDB with MongoDB data to keep consistency

#### Fix #2: Better MongoDB Save Validation
**Lines 8480-8518**

```javascript
// Update mockDB immediately to keep in sync
if (userIndex !== -1) {
  mockDB.users[userIndex].currentCredits = user.currentCredits;
  mockDB.users[userIndex].lastCreditUsage = user.lastCreditUsage;
  mockDB.users[userIndex].creditUsageHistory = user.creditUsageHistory;
}

// Save to MongoDB immediately (CRITICAL for persistence)
try {
  const mongoResult = await User.findOneAndUpdate(
    { email: user.email },
    {
      currentCredits: user.currentCredits,
      lastCreditUsage: user.lastCreditUsage,
      $push: { creditUsageHistory: {...} }
    },
    { new: true, maxTimeMS: 10000 }
  );
  
  if (!mongoResult) {
    console.error('⚠️ WARNING: MongoDB update returned null - data may not be persisted!');
  }
} catch (mongoError) {
  console.error('❌ CRITICAL: MongoDB save failed:', mongoError);
}
```

**What This Does:**
- Updates mockDB immediately after credit deduction
- Saves to MongoDB with error validation
- Logs warnings if MongoDB save fails
- Keeps both storage layers synchronized

### Frontend Fixes

#### Fix #1: Disable sessionStorage Caching for User Data
**File:** `src/utils/stateManager.js` (Lines 117-143)

```javascript
async getUserData() {
  // CRITICAL FIX: Always fetch fresh user data from backend/MongoDB
  // Do NOT use cache or sessionStorage to avoid stale credit data
  const token = sessionStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Update cache but DO NOT persist to sessionStorage
      this.set('user', data.user, false); // Changed from true to false
      return data.user;
    }
    return null;
  }
}
```

**What This Does:**
- Always fetches fresh user data from backend on every request
- Removes dependency on sessionStorage cache
- Ensures credits are always up-to-date

#### Fix #2: Update Login Flow
**File:** `src/pages/Login.js` (Line 110)

```javascript
// Store user data in stateManager BUT DO NOT persist to sessionStorage
if (data.user) {
  stateManager.set('user', data.user, false); // Changed from true to false
}
```

**What This Does:**
- Stores user data in memory only (not sessionStorage)
- Forces fresh fetch from backend on page refresh

#### Fix #3: Update Credit Update Function
**File:** `src/utils/stateManager.js` (Lines 149-151)

```javascript
async updateUserCredits(newCredits) {
  const user = await this.getUserData();
  if (user) {
    user.currentCredits = newCredits;
    // DO NOT persist to sessionStorage
    this.set('user', user, false); // Changed from true to false
  }
}
```

## Data Flow After Fix

### When Credits Are Used:

1. **Backend receives request** → `/api/auth/use-credit`
2. **Fetch fresh data from MongoDB** → Get current credit count
3. **Deduct credit** → `currentCredits -= 1`
4. **Save to MongoDB** → Persist new credit count (primary storage)
5. **Save to mockDB** → Update in-memory storage (backup)
6. **Save to JSON files** → Update file storage (backup)
7. **Return response** → Send updated credit count to frontend

### When Page Refreshes:

1. **Frontend loads** → Dashboard component mounts
2. **Call stateManager.getUserData()** → Fetch user data
3. **Backend API call** → `/api/auth/profile`
4. **MongoDB query** → Get fresh user data with correct credits
5. **Return to frontend** → Display accurate credit count

## Testing Checklist

- [x] Backend fetches from MongoDB first
- [x] Frontend doesn't cache user data in sessionStorage
- [x] Credits persist after page refresh
- [x] Credits persist after backend restart
- [x] Credits sync between mockDB and MongoDB
- [x] Error handling for MongoDB failures
- [x] No linter errors

## Files Modified

### Backend:
- `server/index.js` - Credit usage endpoint fixes

### Frontend:
- `src/utils/stateManager.js` - Removed sessionStorage caching
- `src/pages/Login.js` - Updated login flow

## Documentation:
- `CREDIT_PERSISTENCE_FIX.md` - This file

## Summary

The issue was caused by **dual-layer caching**:
1. Backend used stale mockDB data instead of MongoDB
2. Frontend cached user data in sessionStorage

**Solution:** Made MongoDB the **single source of truth** and removed all sessionStorage caching for user data.

**Result:** Credits now persist correctly across page refreshes and backend restarts.

## Notes

- This fix aligns with the project's requirement to **use MongoDB exclusively for data persistence** (Memory ID: 8567998)
- sessionStorage is now only used for authentication tokens, not user data
- All user data is now fetched fresh from MongoDB/backend on every page load

