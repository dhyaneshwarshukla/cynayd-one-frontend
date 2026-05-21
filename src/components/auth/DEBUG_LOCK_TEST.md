# Debug Lock Screen Test

## Quick Test (30 seconds)

Temporarily change the timeout in `SessionLockProvider.tsx`:

```typescript
const INACTIVITY_TIMEOUT_MS = 30 * 1000; // 30 seconds for testing
```

Then: login, set PIN, wait 30s without input — lock screen should appear.

## Force lock (no PIN / persisted session lock)

Browser console:

```javascript
sessionStorage.setItem('sessionLocked', 'true');
location.reload();
```

## Force lock timing (inactivity)

Set last user interaction to 6 minutes ago:

```javascript
localStorage.setItem('lastUserInteraction', (Date.now() - 6 * 60 * 1000).toString());
location.reload();
```

If PIN is enabled, lock screen still appears on reload even without the above (always require PIN on refresh).

## Check storage

```javascript
console.log('sessionLocked', sessionStorage.getItem('sessionLocked'));
console.log('lastUserInteraction', localStorage.getItem('lastUserInteraction'));
```

## Verify activity detection

```javascript
let n = 0;
document.addEventListener('mousemove', () => { n++; console.log('activity', n); });
```
