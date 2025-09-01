# Credit System Guide - BioPing

## Overview
The credit system has been completely overhauled to prevent unnecessary refreshes and properly track credit usage from MongoDB. Credits are now managed intelligently based on subscription status and usage patterns.

## Key Improvements

### 1. **No More Unnecessary Refreshes**
- Credits are only fetched from the server when the user has a paid plan
- Free users' credits are managed locally to prevent server calls
- Manual refresh button only updates credits for paid users

### 2. **Proper MongoDB Integration**
- All credit transactions are stored in MongoDB with timestamps
- Credit usage history is tracked for monitoring
- Server-side credit enforcement prevents manipulation

### 3. **Smart Credit Management**
- Credits are deducted immediately when searching
- Backend sync happens in the background
- Fallback to local storage if server is unavailable

## How It Works

### For Free Users (Trial)
- Start with 5 credits
- Credits expire after 3 days
- No server calls for credit updates
- Local storage manages credit state

### For Paid Users
- Credits are fetched from MongoDB
- Automatic renewal based on plan type
- Real-time credit tracking
- Server-side credit validation

## API Endpoints

### 1. **GET /api/auth/subscription**
- Returns current subscription status
- Includes current credits and renewal dates
- Used by frontend to sync credit state

### 2. **POST /api/auth/use-credit**
- Deducts 1 credit when searching
- Tracks usage history with timestamps
- Returns remaining credits
- Enforces trial expiry rules

### 3. **GET /api/admin/credit-monitoring**
- Admin endpoint for monitoring credit usage
- Shows all users' credit status
- Includes usage history and statistics

## Credit Usage Flow

```
User Searches → Check Credits → Deduct Credit → Update MongoDB → Sync Frontend
     ↓              ↓           ↓           ↓           ↓
  Search Query   > 0?      -1 Credit   Save Usage   Update UI
```

## Credit Plans

| Plan | Credits | Renewal |
|------|---------|---------|
| Free | 5 (3 days) | No renewal |
| Test | 1 | No renewal |
| Monthly | 50 | Manual renewal |
| Annual | 100 | Monthly EMI renewal |

## Monitoring & Analytics

### Credit Usage Tracking
- Every credit usage is logged with timestamp
- Action type (search, contact view, etc.)
- Credits used and remaining
- User identification

### Admin Dashboard
- Total credits used across all users
- User-by-user credit breakdown
- Usage patterns and trends
- Payment status correlation

## Frontend Implementation

### Credit Display
```javascript
// Credits are shown in the top-right corner
// Format: "5 / 0 days" for free users
// Format: "50" for paid users
```

### Credit Consumption
```javascript
// Credits are consumed when:
// 1. Performing searches
// 2. Viewing contact details
// 3. Accessing premium features
```

### Refresh Button
```javascript
// Only fetches from server for paid users
// Free users get local storage update
// Prevents unnecessary API calls
```

## Troubleshooting

### Common Issues

1. **Credits Not Updating**
   - Check if user has paid plan
   - Verify MongoDB connection
   - Check browser console for errors

2. **Credits Refreshing Unnecessarily**
   - Ensure user is on free plan
   - Check localStorage for userCurrentPlan
   - Verify fetchUserData logic

3. **Credit Usage Not Tracked**
   - Check use-credit endpoint
   - Verify MongoDB save operations
   - Check server logs for errors

### Debug Commands

```bash
# Test credit endpoints
node test-credit-system.js

# Check MongoDB data
node server/check-data.js

# Monitor credit usage
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:5000/api/admin/credit-monitoring
```

## Best Practices

1. **Always check subscription status before fetching credits**
2. **Use local storage for free users to reduce server load**
3. **Log all credit transactions for audit purposes**
4. **Implement proper error handling for credit operations**
5. **Monitor credit usage patterns for business insights**

## Future Enhancements

- Credit purchase system
- Bulk credit packages
- Credit sharing between team members
- Advanced usage analytics
- Credit expiration notifications
- Automated credit renewal

---

**Note**: This system ensures that credits are properly managed, tracked, and don't refresh unnecessarily while maintaining data integrity in MongoDB.
