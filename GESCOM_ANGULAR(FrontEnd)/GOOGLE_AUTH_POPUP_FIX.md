# Google Auth Popup Blocking Fix

## Problem
Browser popup blockers were preventing the Google OAuth consent popup from opening, showing the error:
```
[GSI_LOGGER]: Failed to open popup window... Maybe blocked by the browser?
```

## Root Cause
The popup was being triggered after async operations (`await this.initClient()`), which broke the **user gesture chain**. Browsers only allow popups when they're opened **synchronously** from a user action (like a button click).

## Solution Overview

### 1. Early Initialization
Initialize the Google OAuth client in the service constructor, **before** any user interaction:

```typescript
constructor(private readonly zone: NgZone) {
  // Initialize client early to avoid popup blocking
  this.initClient().catch(err => console.error('Failed to initialize Google client:', err));
}
```

### 2. Synchronous Sign-In
Remove async operations from the sign-in flow. Throw an error if the client isn't ready instead of awaiting:

```typescript
signIn(): Promise<void> {
  // Client MUST be ready before user clicks - initialized in constructor
  if (!this.tokenClient) {
    throw new Error('Google client not initialized yet. Please wait a moment and try again.');
  }
  
  // Call requestAccessToken SYNCHRONOUSLY to preserve user gesture
  // Do NOT await here - return the promise directly
  return this.requestAccessToken(true).then(() => {});
}
```

**CRITICAL**: The method must NOT be `async` and must NOT `await` the result. It should return the promise directly to preserve the synchronous call chain from the user gesture.

### 3. Token Refresh Optimization
Added `refreshPromise` to prevent multiple simultaneous token refreshes:

```typescript
private refreshPromise: Promise<string> | null = null;

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
    return this.tokenInfo!.accessToken;
  }
  
  // Token is expired or will expire soon, refresh it
  try {
    this.refreshPromise = this.requestAccessToken(false);
    const token = await this.refreshPromise;
    this.refreshPromise = null;
    return token;
  } catch (error) {
    this.refreshPromise = null;
    return null;
  }
}
```

### 4. Client Readiness Check
Added a method to check if the client is ready for user interaction:

```typescript
isClientReady(): boolean {
  return this.tokenClient !== null;
}
```

### 5. UI Integration
Updated components to check client readiness and call sign-in BEFORE any state changes:

```typescript
async connectGoogle(): Promise<void> {
  // Check if Google client is ready FIRST, before any state changes
  if (!this.googleAuthService.isClientReady()) {
    alert('Google client is still initializing. Please wait a moment and try again.');
    return;
  }
  
  // Call signIn() IMMEDIATELY to preserve user gesture chain
  // Do NOT set any state or await anything before this call
  const signInPromise = this.googleAuthService.signIn();
  
  // Now we can set loading state and await the result
  try {
    this.isLoading = true;
    await signInPromise;
    await this.checkAndInitializeLibrary();
  } catch (error: any) {
    console.error('Error connecting to Google:', error);
    alert(error?.message || 'Failed to connect to Google. Please try again.');
  } finally {
    this.isLoading = false;
  }
}
```

**CRITICAL**: The `signIn()` call must happen BEFORE any state changes (like `this.isLoading = true`). Even setting a simple boolean can trigger Angular change detection and break the user gesture chain.

### 6. HTTP Interceptor
Added an interceptor to automatically handle 401 errors from Google Drive API:

```typescript
@Injectable()
export class GoogleDriveAuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept Google Drive API requests
    if (!this.isGoogleDriveRequest(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }
}
```

## Key Improvements

### ✅ Popup Blocking Fixed
- Client initializes in background when service loads
- Sign-in calls `requestAccessToken()` synchronously
- No async delays break the user gesture chain

### ✅ Token Refresh Optimization
- 5-minute buffer for proactive token refresh
- Prevents "token refresh storm" with `refreshPromise` deduplication
- Automatic retry on 401 errors via interceptor

### ✅ Better Error Handling
- Clear error messages when client isn't ready
- Graceful fallback if initialization fails
- User-friendly alerts in the UI

## Flow Diagram

**Before (❌ Popup Blocked):**
```
User clicks → setState() → async initClient() → await → requestAccessToken() → ❌ Blocked
```

**After (✅ Popup Allowed):**
```
Service loads → initClient() in background
User clicks → isReady? → signIn() (no await) → requestAccessToken() → ✅ Works!
                      ↓
                  setState() → await signInPromise
```

**Key Points:**
1. `signIn()` is NOT async - returns Promise directly
2. `signIn()` is called BEFORE any state changes
3. `requestAccessToken()` is called synchronously inside `signIn()`
4. State changes happen AFTER the popup is triggered

## Files Modified

1. **google-auth.service.ts**
   - Added early initialization in constructor
   - Added `refreshPromise` for token refresh deduplication
   - Added `isClientReady()` method
   - Made `signIn()` and `ensureSignedIn()` throw errors if client not ready
   - Enhanced `getAccessToken()` with 5-minute buffer and deduplication

2. **google-drive-auth.interceptor.ts** (new)
   - Intercepts Google Drive API requests
   - Automatically refreshes token on 401 errors
   - Retries failed requests with new token

3. **app.config.ts**
   - Registered `GoogleDriveAuthInterceptor` in HTTP_INTERCEPTORS

4. **library.component.ts**
   - Added client readiness check before sign-in
   - Added error handling with user-friendly messages

## Testing

1. **Clear browser cache and reload**
2. **Click "Connect to Google" button**
3. **Verify popup opens immediately** without blocking
4. **Complete OAuth flow**
5. **Test token refresh** by waiting for expiration or forcing refresh

## Notes

- The Google client typically initializes in < 1 second
- If user clicks too quickly, they'll see a helpful message
- Token refresh happens proactively 5 minutes before expiration
- Multiple simultaneous API calls share the same token refresh
