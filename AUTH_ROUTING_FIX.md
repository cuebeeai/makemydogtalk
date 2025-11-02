# Auth Routing Fix - `/auth/google` 404 Issue

## 🐛 Problem Summary

Your `/auth/google` backend route was being intercepted by the Express catch-all route, which serves the React SPA's `index.html` file. This caused:

1. User visits `https://makemydogtalk.com/auth/google`
2. Express catch-all serves `index.html` (instead of handling auth)
3. React app loads and React Router sees `/auth/google`
4. React Router has no route for `/auth/google`
5. Result: React's "404 Page Not Found" component is shown

## ✅ Solution Applied

Modified `server/vite.ts` to **exclude backend routes** from the SPA fallback catch-all:

### Before (Problematic)
```typescript
// Catch-all that served index.html for EVERYTHING
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

### After (Fixed)
```typescript
// SPA fallback that SKIPS backend routes
app.use((req, res, next) => {
  // Skip backend routes - let them be handled by registered route handlers
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/auth') || 
      req.path.startsWith('/uploads')) {
    return next();
  }
  
  // For all other routes, serve the SPA index.html
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

## 🔧 What Changed

1. **Production Mode** (`serveStatic` function):
   - Catch-all now checks if path starts with `/api`, `/auth`, or `/uploads`
   - If yes → calls `next()` to let backend route handlers process the request
   - If no → serves `index.html` for client-side routing

2. **Development Mode** (`setupVite` function):
   - Applied the same fix to Vite dev server catch-all
   - Ensures consistent behavior in both environments

## 📋 How Express Middleware Order Works

Your app now has this middleware order:

1. ✅ **Body parsing & cookies** (`express.json()`, `cookieParser()`)
2. ✅ **Auth routes** (`app.use(authRoutes)`) → Handles `/auth/google`, `/auth/login`, etc.
3. ✅ **API routes** → Handles `/api/generate-video`, `/api/video-status`, etc.
4. ✅ **Static files** → Serves built frontend files (`.js`, `.css`, images)
5. ✅ **SPA fallback** (NEW FIX) → Serves `index.html` for frontend routes ONLY
   - ⚠️ **Skips** `/api/*`, `/auth/*`, `/uploads/*` paths
   - ✅ **Serves** all other paths (for React Router)

## 🚀 Deployment Steps

### 1. **Rebuild your application**
```bash
npm run build
```

This will:
- Build the React frontend with Vite
- Bundle the server code with the fix included

### 2. **Test locally** (optional but recommended)
```bash
npm start
```

Then visit:
- `http://localhost:3000/auth/google` → Should redirect to Google OAuth
- `http://localhost:3000/api/health` → Should show API health check
- `http://localhost:3000/` → Should show your React app

### 3. **Deploy to Firebase App Hosting**
```bash
npm run deploy
```

Or if using CI/CD, push to your connected GitHub branch:
```bash
git add server/vite.ts AUTH_ROUTING_FIX.md
git commit -m "Fix: Prevent catch-all route from intercepting /auth endpoints"
git push origin main
```

Firebase App Hosting will automatically:
- Detect the push
- Build your app
- Deploy to production

### 4. **Verify in production**

Visit your production URLs:
- ✅ `https://makemydogtalk.com/auth/google` → Should redirect to Google OAuth (not 404)
- ✅ `https://makemydogtalk.com/api/health` → Should return API health JSON
- ✅ `https://makemydogtalk.com/` → Should load your React app
- ✅ `https://makemydogtalk.com/pricing` → Should load React route (not 404)

## 🎯 Expected Behavior After Fix

| URL | Expected Behavior |
|-----|-------------------|
| `/auth/google` | ✅ Redirects to Google OAuth login |
| `/auth/google/callback` | ✅ Handles OAuth callback, sets auth cookie, redirects to `/` |
| `/auth/login` | ✅ Handles email/password login |
| `/auth/me` | ✅ Returns current user info |
| `/api/generate-video` | ✅ Generates video (API endpoint) |
| `/api/health` | ✅ Returns health status JSON |
| `/uploads/videos/xyz.mp4` | ✅ Serves video file |
| `/` | ✅ Loads React app (Home page) |
| `/pricing` | ✅ Loads React app (Pricing page via React Router) |
| `/about` | ✅ Loads React app (shows React's 404 if route doesn't exist) |

## 🔍 Why This Fix Works

### Root Cause
Express processes middleware in **registration order**. Even though your auth routes were registered BEFORE the catch-all, the catch-all was using `app.get("*", ...)` which matches **ANY** GET request without checking if previous routes handled it.

### The Fix
By adding a check inside the catch-all to **skip backend paths**, we ensure:
1. Request to `/auth/google` arrives
2. Express checks auth route handler first → **Matches and runs**
3. Auth route redirects to Google OAuth
4. Catch-all never runs (request already handled)

If the auth route didn't exist:
1. Request to `/auth/google` arrives
2. Express checks auth route handler → No match
3. Continues to catch-all
4. Catch-all sees path starts with `/auth` → Calls `next()`
5. No more handlers → Express returns 404 error (not React's 404 page)

## 🆘 Troubleshooting

If the issue persists after deployment:

### 1. Check Firebase App Hosting Logs
```bash
firebase apphosting:logs
```

Look for:
- Build errors
- Runtime errors
- 404 errors hitting your server

### 2. Verify OAuth Redirect URIs

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Go to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID
- Ensure these redirect URIs are listed:
  - `https://makemydogtalk.com/auth/callback`
  - `https://makemydogtalk.com/auth/google/callback`
  - `https://your-app-id.web.app/auth/callback`
  - `https://your-app-id.firebaseapp.com/auth/callback`

### 3. Check Environment Variables

In Firebase Console → App Hosting → Your App → Settings:
- Verify `GOOGLE_CLIENT_ID` is set
- Verify `GOOGLE_CLIENT_SECRET` is set
- Verify `OAUTH_REDIRECT_URI` matches your production URL
- Verify `SESSION_SECRET` is set

### 4. Test with curl

```bash
# Should redirect to Google OAuth (302 response)
curl -I https://makemydogtalk.com/auth/google

# Should return JSON (200 response)
curl https://makemydogtalk.com/api/health
```

### 5. Clear Browser Cache

Sometimes browsers cache 404 responses:
- Open DevTools → Network tab
- Check "Disable cache"
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## 📝 Additional Notes

- This fix also protects `/api/*` and `/uploads/*` routes from being caught by the SPA fallback
- The fix is applied to both **development** and **production** modes
- This is a common issue in SPA + Express apps and this is the standard solution
- Your auth routes are correctly defined in `server/authRoutes.ts` and registered in `server/routes.ts`

## ✅ Success Criteria

After deployment, you should be able to:

1. ✅ Click "Sign in with Google" button on your site
2. ✅ Be redirected to Google OAuth consent screen
3. ✅ After approving, be redirected back to your site
4. ✅ Be logged in with your auth cookie set
5. ✅ Generate videos as an authenticated user

---

**Status**: ✅ Fix applied and ready for deployment

**Next Step**: Run `npm run build && npm run deploy` to deploy the fix to production

