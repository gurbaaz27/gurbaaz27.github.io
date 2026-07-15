# View Counter Setup Guide

This guide will help you set up view counts for your Jekyll blog posts using Firebase Realtime Database.

## Overview

The view counter system:
- Tracks page views client-side using Firebase Realtime Database
- Displays view counts on post pages
- Uses session storage to prevent duplicate counts from the same visitor
- Works entirely client-side (no backend required)
- Free tier available from Firebase

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can skip Google Analytics if you want)

### 2. Enable Realtime Database

1. In your Firebase project, go to **Build** > **Realtime Database**
2. Click **Create Database**
3. Choose a location (closest to your users)
4. Start in **test mode** (we'll update the rules next)

### 3. Configure Database Rules

1. In Realtime Database, go to the **Rules** tab
2. Replace the rules with:

```json
{
  "rules": {
    "views": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Note:** For production, you may want to restrict writes to prevent abuse. However, for a personal blog, the above rules are usually fine.

### 4. Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. If you don't have a web app, click **Add app** > **Web** (</> icon)
4. Register your app (you can skip hosting setup)
5. Copy the Firebase configuration object

### 5. Add Configuration to Jekyll

1. Open `_config.yml`
2. Find the `# --- View Counter (Firebase) --- #` section
3. Uncomment the `firebase:` section
4. Fill in your Firebase config values:

```yaml
firebase:
  apiKey: "AIzaSyC..."
  authDomain: "your-project.firebaseapp.com"
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
  projectId: "your-project-id"
  storageBucket: "your-project.appspot.com"
  messagingSenderId: "123456789"
  appId: "1:123456789:web:abc123"
```

### 6. Test the Setup

1. Build and serve your Jekyll site:
   ```bash
   bundle exec jekyll serve
   ```
2. Visit a blog post page
3. Check the browser console for any errors
4. Refresh the page - you should see the view count appear
5. Check your Firebase Realtime Database - you should see a `views` node with your page paths

## How It Works

- **View Tracking**: When a page loads, the script increments the view count in Firebase
- **Session Storage**: Uses browser session storage to prevent counting the same visitor multiple times in one session
- **Display**: View counts are displayed next to the post date and read time
- **Formatting**: View counts are formatted (e.g., "1.2K views", "500 views")

## Customization

### Change View Count Position

Edit `_includes/header.html` to move the view count to a different location.

### Change View Count Format

Edit `formatViewCount()` function in `assets/js/view-counter.js` to customize the display format.

### Disable View Counter

Simply comment out or remove the `firebase:` section in `_config.yml`. The view counter will not load if Firebase is not configured.

## Troubleshooting

### View counts not showing

1. Check browser console for errors
2. Verify Firebase config in `_config.yml` is correct
3. Ensure Realtime Database (not Firestore) is enabled
4. Check database rules allow read/write access

### View counts showing "Loading views..."

- Firebase may not be initialized properly
- Check that all Firebase config values are correct
- Verify Firebase SDK is loading (check Network tab in browser dev tools)

### Duplicate counts

- The system uses session storage to prevent duplicates
- Each new browser session will increment the count once
- This is expected behavior

## Firebase Free Tier Limits

Firebase Realtime Database free tier includes:
- 1 GB storage
- 10 GB/month bandwidth
- 100 concurrent connections

For a personal blog, this is usually more than enough.

## Alternative Solutions

If you prefer not to use Firebase, you could:
- Use Google Analytics API (requires server-side code)
- Use a different service like GoatCounter or Plausible
- Implement a custom backend solution

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify Firebase configuration is correct
3. Ensure Realtime Database is enabled (not Firestore)
4. Check database rules allow read/write

