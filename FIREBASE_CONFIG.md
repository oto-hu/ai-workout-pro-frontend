# Firebase Configuration Guide

## Environment Variables

Create a `.env.local` file in your project root with the following Firebase configuration:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name (e.g., "ai-workout-pro")
4. Enable Google Analytics (optional)

### 2. Enable Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable the following providers:
   - **Email/Password**: Enable
   - **Google**: Enable and configure OAuth consent screen
   - **GitHub**: Enable and add GitHub OAuth app credentials

### 3. Create Firestore Database
1. Go to Firestore Database > Create database
2. Start in **production mode**
3. Choose a location (preferably close to your users)

### 4. Configure Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

## Deployment Commands

```bash
# Build the Next.js app for static export
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy everything
firebase deploy
```

## Security Rules

The included `firestore.rules` file provides:
- User isolation (users can only access their own data)
- Authentication requirement for all operations
- Proper field validation

## Development Setup

For local development with Firebase emulators:

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start Next.js dev server
npm run dev
```

The app will automatically connect to emulators when running in development mode.

## Migration Notes

### Removed Dependencies
- `next-auth` - Replaced with Firebase Auth
- `@supabase/supabase-js` - Replaced with Firestore
- `@supabase/auth-helpers-nextjs` - No longer needed

### Added Dependencies
- `firebase` v10.x - Complete Firebase SDK

### Database Schema Migration

The Firestore collections mirror the previous Supabase schema:

- `users/` - User accounts and profile data
- `userProfiles/` - Extended user fitness preferences
- `workoutSessions/` - Workout history and results
- `favoriteWorkouts/` - User's saved favorite workouts

### Authentication Flow

1. **Sign Up**: Creates user in Firebase Auth + Firestore user document
2. **Sign In**: Authenticates with Firebase Auth
3. **Session Management**: Handled automatically by Firebase Auth
4. **Protected Routes**: Use `useAuth()` hook to check authentication status

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set
2. **Project ID**: Update `.firebaserc` with your actual Firebase project ID
3. **OAuth Setup**: Configure OAuth consent screen in Google Cloud Console for Google sign-in
4. **GitHub OAuth**: Create GitHub OAuth app and add credentials to Firebase
5. **Build Errors**: Ensure Firebase SDK v10+ is installed

### Development Tips

- Use Firebase emulators for local development
- Test authentication flows in incognito mode
- Check Firebase Console for detailed error logs
- Verify Firestore security rules in Firebase Console