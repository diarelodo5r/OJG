# Fix Google Drive API 401 Unauthorized Error

## Problem
The Angular application receives a 401 Unauthorized error when calling Google Drive API because OAuth access tokens expire after ~1 hour and are not being automatically refreshed.

## Root Cause
- Access tokens have a short lifespan (typically 3600 seconds / 1 hour)
- The current implementation doesn't automatically refresh expired tokens
- When a token expires, API calls fail with 401 status

## Solution Overview
Implement an HTTP interceptor that:
1. Detects 401 errors from Google Drive API
2. Automatically refreshes the access token
3. Retries the failed request with the new token
4. Prevents multiple simultaneous refresh attempts

## Implementation Steps

### Step 1: Update GoogleAuthService

Replace your current `google-auth.service.ts` with the improved version in `google-auth.service.updated.ts`.

**Key improvements:**
- Added `refreshPromise` to prevent concurrent refresh attempts
- Improved `hasValidToken()` with configurable buffer (default 5 minutes)
- Enhanced `getAccessToken()` to automatically refresh when token is near expiration
- Better error handling and token state management

**Changes:**
```typescript
// Added property
private refreshPromise: Promise<string> | null = null;

// Improved method with 5-minute buffer
private hasValidToken(bufferSeconds = 60): boolean {
  const now = Date.now();
  const buffer = bufferSeconds * 1000;
  return !!(this.tokenInfo && this.tokenInfo.accessToken && this.tokenInfo.expiresAt > (now + buffer));
}

// Enhanced getAccessToken with automatic refresh
async getAccessToken(forceRefresh = false): Promise<string | null> {
  // If already refreshing, wait for that to complete
  if (this.refreshPromise && !forceRefresh) {
    try {
      return await this.refreshPromise;
    } catch {
      this.refreshPromise = null;
    }
  }
  
  // Check if token is valid with a 5-minute buffer
  if (!forceRefresh && this.hasValidToken(300)) {
    const token = this.tokenInfo!.accessToken;
    return token;
  }
  
  // Token is expired or will expire soon, refresh it
  this.refreshPromise = this.requestAccessToken(false);
  const token = await this.refreshPromise;
  this.refreshPromise = null;
  return token;
}
```

### Step 2: Create HTTP Interceptor

Copy `google-drive-auth.interceptor.ts` to your Angular project's appropriate directory (e.g., `src/app/core/interceptors/` or `src/app/services/`).

**What it does:**
- Intercepts all HTTP requests to Google Drive API
- Catches 401 errors
- Refreshes the access token
- Retries the original request with the new token
- Handles concurrent requests during token refresh

### Step 3: Register the Interceptor

In your `app.config.ts` or `app.module.ts`, register the interceptor:

**For standalone apps (app.config.ts):**
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GoogleDriveAuthInterceptor } from './path/to/google-drive-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GoogleDriveAuthInterceptor,
      multi: true
    }
  ]
};
```

**For module-based apps (app.module.ts):**
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GoogleDriveAuthInterceptor } from './path/to/google-drive-auth.interceptor';

@NgModule({
  // ... other config
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GoogleDriveAuthInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }
```

### Step 4: Update LibraryService (Optional Enhancement)

Your `library.service.ts` already calls `getAccessToken()`, but you can add better error handling:

```typescript
async chargerContenuDossierOAuth(options: ListOptions = {}): Promise<DriveFileResult> {
  try {
    await this.googleAuthService.ensureSignedIn();
    const token = await this.googleAuthService.getAccessToken();
    if (!token) {
      throw new Error('Impossible d\'obtenir le jeton d\'accès Google.');
    }

    // ... rest of your code
  } catch (error) {
    console.error('Erreur lors du chargement du contenu:', error);
    throw error;
  }
}
```

## How It Works

### Token Lifecycle
1. **Initial Sign-In**: User signs in, token stored with expiration time
2. **API Calls**: Token included in Authorization header
3. **Token Expiration**: Token expires after ~1 hour
4. **401 Error**: Google API returns 401 Unauthorized
5. **Interceptor Catches**: HTTP interceptor detects 401
6. **Token Refresh**: Interceptor calls `getAccessToken(true)` to refresh
7. **Retry Request**: Original request retried with new token
8. **Success**: User continues working without interruption

### Token Refresh Strategy
- **Proactive**: Token refreshed 5 minutes before expiration
- **Reactive**: If 401 occurs, token refreshed immediately
- **Concurrent Protection**: Multiple requests wait for single refresh

## Testing

### Test Scenarios
1. **Normal Operation**: Make API calls with valid token
2. **Token Expiration**: Wait for token to expire, make API call
3. **Concurrent Requests**: Make multiple API calls simultaneously
4. **Sign Out/In**: Sign out and back in, verify token refresh

### Manual Testing
```typescript
// In browser console
// 1. Check current token
localStorage.getItem('google_token_info');

// 2. Force token expiration (in service)
this.tokenInfo.expiresAt = Date.now() - 1000;

// 3. Make API call and observe automatic refresh
await libraryService.afficherFichiers();
```

## Troubleshooting

### Issue: Still getting 401 errors
**Solution**: 
- Check that interceptor is properly registered
- Verify `getAccessToken(true)` is being called on 401
- Check browser console for error messages

### Issue: Popup blocked during token refresh
**Solution**:
- Token refresh should use `prompt: ''` (not `consent`)
- Only initial sign-in should show popup
- Refresh happens silently in background

### Issue: Multiple refresh attempts
**Solution**:
- Verify `refreshPromise` is being used correctly
- Check that `isRefreshing` flag prevents concurrent refreshes

### Issue: Token not persisting across page reloads
**Solution**:
- Current implementation uses in-memory storage
- Consider adding localStorage persistence if needed:

```typescript
// Save token
private saveTokenToStorage(): void {
  if (this.tokenInfo) {
    localStorage.setItem('google_token_info', JSON.stringify(this.tokenInfo));
  }
}

// Load token on init
private loadTokenFromStorage(): void {
  const stored = localStorage.getItem('google_token_info');
  if (stored) {
    this.tokenInfo = JSON.parse(stored);
    if (this.hasValidToken()) {
      this.updateSigninStatus(true);
    }
  }
}
```

## Security Considerations

1. **Token Storage**: Tokens stored in memory (cleared on page reload)
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Expiration**: Tokens automatically expire after 1 hour
4. **Scope Limitation**: Only request necessary Google Drive scopes
5. **Token Revocation**: Implement sign-out to revoke tokens

## Additional Improvements

### Add Loading State
```typescript
// In library.component.ts
isRefreshingToken = false;

this.googleAuthService.status$.subscribe(status => {
  this.isRefreshingToken = !status.isSignedIn;
});
```

### Add Error Notification
```typescript
// In interceptor
private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return this.refreshToken().pipe(
    catchError((err) => {
      // Show user-friendly message
      this.notificationService.error('Session expirée. Veuillez vous reconnecter.');
      return throwError(() => err);
    })
  );
}
```

### Add Token Refresh Monitoring
```typescript
// Track refresh events
private logTokenRefresh(): void {
  console.log('[GoogleAuth] Token refreshed at', new Date().toISOString());
  // Send to analytics if needed
}
```

## Summary

This implementation provides:
- ✅ Automatic token refresh on 401 errors
- ✅ Proactive token refresh before expiration
- ✅ Prevention of concurrent refresh attempts
- ✅ Seamless user experience (no interruptions)
- ✅ Proper error handling and recovery
- ✅ Type-safe TypeScript implementation

The user will no longer see 401 errors when working with Google Drive API, as tokens are automatically refreshed in the background.
