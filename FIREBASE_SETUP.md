# Firebase Setup Guide

This guide will walk you through setting up Firebase Authentication and Firestore for your QR app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Click on **Sign-in method** tab
4. Enable **Google Sign-In**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter a project support email (your email)
   - Click "Save"
   
   **Note**: The app now uses Google Sign-In. Users will sign in with their Google accounts.

## Step 3: Create a Web App

1. In Firebase Console, click the **Web icon** (`</>`) or go to Project Settings
2. Register your app:
   - Enter an app nickname (e.g., "QR App Frontend")
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
3. **Copy your Firebase configuration object** - it looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

## Step 4: Configure Your App

### Option A: Using Environment Variables (Recommended)

1. Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   touch .env
   ```

2. Add your Firebase config to `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Important**: Add `.env` to `.gitignore` to keep your keys secure:
   ```bash
   echo ".env" >> .gitignore
   ```

4. The `firebase.ts` config file will automatically use these environment variables.

### Option B: Direct Configuration

Edit `src/config/firebase.ts` and replace the placeholder values with your actual Firebase config.

## Step 5: Enable Firestore Database (Optional)

If you want to use Firestore for storing data:

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose:
   - **Start in production mode** (for production)
   - **Start in test mode** (for development - allows reads/writes for 30 days)
4. Select a location for your database
5. Click **Enable**

### Firestore Security Rules (Important!)

For production, set up proper security rules:

1. Go to **Firestore Database** > **Rules**
2. Example rules for this app (**users** + **userQRCodes**) where a user can only read/write their own docs:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Profile data saved by ProfileSetup.tsx → users/{uid}
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }

       // QR codes saved by the app → userQRCodes/{uid}
       match /userQRCodes/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

If you see **\"Missing or insufficient permissions\"** in the app, it means your Firestore rules are currently blocking writes.

## Step 6: Test Google Sign-In

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login` in your app
3. Click "Sign in with Google"
4. Select your Google account
5. You should be redirected to `/dashboard` and see your QR code (if you have one registered)

**Note**: Users will automatically be created in Firebase Authentication when they sign in with Google for the first time.

## Step 7: How It Works Now

### Authentication Flow

1. **Login**: User clicks "Sign in with Google" → Google popup appears → User selects account → User is logged in
2. **State Management**: `AuthContext` listens to auth state changes automatically
3. **Protected Routes**: Routes check `isAdminLoggedIn` and redirect if not authenticated
4. **Dashboard**: After login, users are redirected to `/dashboard` to see their QR code
5. **Logout**: Calls Firebase `signOut()` which updates auth state automatically

## How It Works

### QR Code Storage

- QR codes are stored in Firestore collection `userQRCodes`
- Each document is keyed by the user's Firebase UID
- QR codes are fetched from your backend API if not in Firestore
- Once stored, they're retrieved from Firestore for faster access

### Key Files

- **`src/config/firebase.ts`**: Firebase initialization and configuration
- **`src/contexts/AuthContext.tsx`**: Manages authentication state across the app
- **`src/components/AdminLogin.tsx`**: Login form using Firebase Auth
- **`src/services/firestoreExample.ts`**: Examples of Firestore operations

## Using Firestore

See `src/services/firestoreExample.ts` for complete examples of:
- Creating documents
- Reading documents
- Updating documents
- Deleting documents
- Querying with filters
- Real-time listeners
- Batch operations

### Example: Save User Data to Firestore

```typescript
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const saveUser = async (userId: string, userData: any) => {
  await setDoc(doc(db, 'users', userId), {
    ...userData,
    createdAt: Timestamp.now(),
  });
};
```

## Common Firebase Auth Errors

- **`auth/user-not-found`**: Email doesn't exist
- **`auth/wrong-password`**: Incorrect password
- **`auth/invalid-email`**: Email format is invalid
- **`auth/user-disabled`**: Account has been disabled
- **`auth/too-many-requests`**: Too many failed login attempts

These are already handled in `AdminLogin.tsx` with user-friendly error messages.

## Security Best Practices

1. ✅ **Never commit `.env` files** - Add to `.gitignore`
2. ✅ **Use environment variables** for Firebase config
3. ✅ **Set up Firestore security rules** for production
4. ✅ **Enable Firebase App Check** (optional, for additional security)
5. ✅ **Use Firebase Admin SDK** on backend for sensitive operations
6. ✅ **Implement proper error handling** (already done in AdminLogin)

## Next Steps

- Add user registration functionality
- Implement password reset
- Add email verification
- Set up Firestore collections for your data
- Add role-based access control (admin vs regular users)

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your API key in `.env` matches Firebase Console
- Make sure `.env` file is in the `frontend` directory
- Restart your dev server after changing `.env`

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add your domain (e.g., `localhost` for development)

### Authentication not persisting
- Firebase Auth automatically persists sessions
- Check browser console for errors
- Verify Firebase config is correct

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
