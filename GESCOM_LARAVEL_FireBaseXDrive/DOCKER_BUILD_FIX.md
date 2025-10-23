# Docker Build Error Fixes

## Issues Identified

### 1. PSR-4 Autoloading Violation
**Error:** `Class App\Http\Controllers\Api\StockController located in ./app/Http/Controllers/StockController.php does not comply with psr-4 autoloading standard`

**Cause:** There are two `StockController.php` files:
- ✅ Correct: `app/Http/Controllers/Api/StockController.php` (uses FirestoreService)
- ❌ Duplicate: `app/Http/Controllers/StockController.php` (uses StockRepositoryInterface)

Both files have the namespace `App\Http\Controllers\Api`, but the duplicate is in the wrong directory.

**Action Required:** Delete the duplicate file at `app/Http/Controllers/StockController.php`

```bash
rm app/Http/Controllers/StockController.php
```

### 2. Firebase Credentials Configuration Error
**Error:** `file_exists(): Argument #1 ($filename) must be of type string, array given in ClientTrait.php line 129`

**Cause:** The `config/firebase.php` was returning an array for `credentials` instead of a string path.

**Status:** ✅ **FIXED** - Updated `config/firebase.php` to return the credentials path as a string.

### 3. Docker Build Process
**Issue:** Composer install was failing due to missing `.env` file and autoload errors during package discovery.

**Status:** ✅ **FIXED** - Updated `Dockerfile` to:
- Copy composer files first for better layer caching
- Install dependencies without running scripts initially
- Create `.env` from `.env.example` if missing
- Generate optimized autoloader after all files are copied
- Added `.dockerignore` to exclude unnecessary files

## Next Steps

1. **Delete the duplicate StockController:**
   ```bash
   rm app/Http/Controllers/StockController.php
   ```

2. **Rebuild your Docker image:**
   ```bash
   docker build -t gescom-laravel .
   ```

3. **If you still encounter issues, ensure:**
   - Firebase credentials file exists at the path specified in `.env`
   - All required environment variables are set
   - The `storage` and `bootstrap/cache` directories exist

## Files Modified

- ✅ `config/firebase.php` - Fixed credentials configuration
- ✅ `Dockerfile` - Improved build process
- ✅ `.dockerignore` - Created to exclude unnecessary files
- ⚠️ `app/Http/Controllers/StockController.php` - **Needs manual deletion**
