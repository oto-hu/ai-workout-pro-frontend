# Firebase Environment Variables Setup

This document describes the environment variables needed for Firebase Authentication integration.

## Required Environment Variables

Add the following variables to your `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication and configure providers:
   - **Email/Password**: Enable for email authentication
   - **Google**: Enable and configure OAuth consent screen
4. Go to Project Settings > General tab
5. Add a web app and copy the config values
6. Use the config values to set the environment variables above

## Google OAuth Setup

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google provider
3. The Google OAuth setup is handled automatically by Firebase

## Removed Environment Variables

The following Next-Auth variables are no longer needed:
- ~~NEXTAUTH_SECRET~~
- ~~NEXTAUTH_URL~~
- ~~GOOGLE_CLIENT_ID~~
- ~~GOOGLE_CLIENT_SECRET~~
- ~~GITHUB_CLIENT_ID~~
- ~~GITHUB_CLIENT_SECRET~~

## Supabase RLS Integration

Firebase Auth tokens are automatically validated with Supabase through the existing createClient() function. User data continues to be stored in Supabase with Firebase UIDs as user IDs.

## Testing

After setting up the environment variables:

1. Run `npm run dev`
2. Test Google OAuth login
3. Test email/password registration and login
4. Verify user data is created in Supabase
5. Test protected routes navigation