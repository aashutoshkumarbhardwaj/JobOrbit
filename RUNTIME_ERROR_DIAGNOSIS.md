# Runtime Error Diagnosis

**Error**: React Router throws empty error on production  
**Error ID**: `error-1783226617608-lny10coib`

---

## Console Analysis

From your console logs:

1. ✅ **AuthManager initialized** - Environment variables ARE working
2. ✅ **App component rendered** - React renders successfully
3. ❌ **React Router error** - Empty error message
4. ✅ **ErrorBoundary caught it** - Graceful fallback working

---

## Root Cause

The error is coming from React Router (`router-CEWAqAhW.js`) with an **empty message**. This typically happens when:

1. A route component tries to use a hook outside of Router context
2. A Link/Navigate tries to reference a non-existent route
3. The BrowserRouter basename is misconfigured

---

## Quick Fix

### Check Browser Console for Stored Errors

Your ErrorBoundary stores errors in localStorage. Check them:

```javascript
// In browser console on your deployed site
JSON.parse(localStorage.getItem('app-errors'))
```

This will show you the actual error with full stack trace!

---

## Most Likely Cause

Looking at the timing in console logs:
```
index-D-iH3uab.js:520 📱 App.tsx: App component rendering (4 times)
router-CEWAqAhW.js:32 Error
```

The App component renders 4 times rapidly, then Router errors. This suggests:

**A component is trying to use `useNavigate()`, `useLocation()`, or `useParams()` outside of a `<Route>`**

---

## How to Fix

### Option 1: Check ExtensionAuth Page

The `ExtensionAuth` page uses `useNavigate` and `useSearchParams`:

```typescript
const navigate = useNavigate()
const [searchParams] = useSearchParams()
```

This page might be causing issues if it's trying to access router hooks before the router is ready.

### Option 2: Wrap Router Context Properly

Make sure all components using router hooks are inside `<BrowserRouter>`:

```typescript
// WRONG
<AuthProvider>
  {/* Components here can't use useNavigate */}
  <BrowserRouter>
    <Routes>...</Routes>
  </BrowserRouter>
</AuthProvider>

// CORRECT
<AuthProvider>
  <BrowserRouter>
    {/* Components here CAN use useNavigate */}
    <Routes>...</Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Immediate Actions

### 1. Check localStorage for actual error

On the deployed site, open browser console and run:
```javascript
localStorage.getItem('app-errors')
```

This will show the full error message!

### 2. Check if it's environment-specific

The error might only happen in production. Try:
1. Build locally: `npm run build`
2. Preview: `npm run preview`
3. Open in browser and check if same error occurs

### 3. Simplify Landing Page

The error happens when loading `/` (Landing page). Try temporarily:

```typescript
// In App.tsx, comment out Landing and use a simple div
<Route path="/" element={<div>Test</div>} />
```

If this works, the issue is in the Landing page component.

---

## Debug Steps

### Step 1: Add console.log to Landing

```typescript
// At the top of Landing.tsx
export default function Landing() {
  console.log('🏠 Landing component rendering')
  console.log('🏠 landingStats:', landingStats)
  console.log('🏠 testimonials:', testimonials)
  
  // ... rest of component
}
```

### Step 2: Check if hooks are the issue

Comment out the data fetching hooks temporarily:

```typescript
// const { data: landingStats, isLoading: statsLoading } = useLandingStats();
// const { data: testimonials, isLoading: testimonialsLoading } = useTestimonials();

const landingStats = null;
const testimonials = null;
const statsLoading = false;
const testimonialsLoading = false;
```

If this fixes it, the issue is in `useLandingData.ts`.

---

## Most Likely Fix

Based on the console output showing AuthManager worked but Router failed, I suspect the `SessionTimeoutWarning` component is trying to use `useNavigate()` outside of router context.

Check this in `App.tsx`:

```typescript
// CURRENT (might be wrong)
<AuthProvider>
  <AuthenticatedDataProvider>
    <SessionTimeoutWarning />  {/* ← Uses useNavigate! */}
    <BrowserRouter>
      <Routes>...</Routes>
    </BrowserRouter>
  </AuthenticatedDataProvider>
</AuthProvider>

// SHOULD BE
<AuthProvider>
  <AuthenticatedDataProvider>
    <BrowserRouter>
      <SessionTimeoutWarning />  {/* ← Now inside Router! */}
      <Routes>...</Routes>
    </BrowserRouter>
  </AuthenticatedDataProvider>
</AuthProvider>
```

---

## Quick Fix to Deploy Now

Move `SessionTimeoutWarning` inside `BrowserRouter` in `App.tsx`:

```typescript
<BrowserRouter>
  <SessionTimeoutWarning />  {/* MOVE HERE */}
  <Routes>
    {/* routes */}
  </Routes>
</BrowserRouter>
```

Then commit and push. This should fix the error!

---

## Summary

**Problem**: SessionTimeoutWarning uses `useNavigate()` but is outside BrowserRouter  
**Solution**: Move it inside BrowserRouter  
**Why**: React Router hooks only work inside Router context  

**Expected Result**: App loads successfully! 🎉
