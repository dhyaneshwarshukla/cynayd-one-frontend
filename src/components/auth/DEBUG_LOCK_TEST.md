# Debug Lock Screen Test

## Quick Test (30 seconds)

To test the lock screen quickly, temporarily change the timeout in `SessionLockProvider.tsx`:

```typescript
// Change this line:
inactivityTimeout: 5 * 60 * 1000, // 5 minutes

// To this (30 seconds for testing):
inactivityTimeout: 30 * 1000, // 30 seconds
```

Then:
1. Login to the portal
2. Set up a PIN (if not already set)
3. Wait 30 seconds without moving mouse/keyboard
4. Lock screen should appear

## Browser Console Test

Open browser console and run:

```javascript
// Check if inactivity lock is active
console.log('Last Activity:', localStorage.getItem('lastActivity'));

// Manually trigger lock (for testing)
// This will lock the screen immediately
window.dispatchEvent(new Event('test-lock'));
```

## Verify Activity Detection

Check if events are being captured:

```javascript
// Monitor activity
let activityCount = 0;
document.addEventListener('mousemove', () => {
  activityCount++;
  console.log('Activity detected:', activityCount);
});
```

## Check Lock State

```javascript
// In browser console, check localStorage
console.log('Last Activity:', localStorage.getItem('lastActivity'));
console.log('Time since activity:', Date.now() - parseInt(localStorage.getItem('lastActivity') || '0'));
```

## Force Lock (for testing)

Add this to browser console:

```javascript
// Force lock screen
localStorage.setItem('lastActivity', (Date.now() - 6 * 60 * 1000).toString());
window.location.reload();
```

This sets last activity to 6 minutes ago, so on reload it will lock immediately.

