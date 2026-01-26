# Kids Storybook - iOS App

A safe, educational storybook library app for children ages 3-12. Features AI-generated stories with colorful illustrations and audio narration.

## Features

- 1,000+ age-appropriate stories for kids
- Beautiful color illustrations on every page
- Professional audio narration
- Offline audio caching
- No ads, no tracking, no data collection
- COPPA compliant
- Parental controls with math-based gate

## Tech Stack

- **Flutter** - iOS mobile app
- **Firebase Firestore** - Book metadata storage
- **Firebase Storage** - Images and audio files
- **Cloud Functions** - Secure API calls
- **Anthropic Claude** - Story text generation
- **Google Imagen** - Illustration generation
- **Gemini TTS** - Audio narration

## Project Structure

```
kids-ai-storybook-creator/
├── flutter_app/           # iOS Flutter app
├── functions/             # Firebase Cloud Functions
├── tools/                 # Batch generation tools
└── firebase-config/       # Firestore and Storage rules
```

## Setup Instructions

### Prerequisites

- Flutter SDK (3.0+)
- Xcode (for iOS development)
- Node.js 18+
- Firebase CLI
- API keys for Anthropic, Google Cloud (Imagen + Gemini)

### 1. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable Firestore Database
   - Go to Firestore Database > Create database
   - Start in production mode
   - Choose a region close to your users

3. Enable Storage
   - Go to Storage > Get started
   - Start in production mode

4. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

5. Initialize Firebase in the project:
   ```bash
   cd kids-ai-storybook-creator
   firebase init
   ```
   Select: Firestore, Functions, Storage

6. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

### 2. Cloud Functions Setup

1. Navigate to functions directory:
   ```bash
   cd functions
   npm install
   ```

2. Set environment variables:
   ```bash
   firebase functions:config:set anthropic.api_key="YOUR_ANTHROPIC_API_KEY"
   firebase functions:config:set google.api_key="YOUR_GOOGLE_API_KEY"
   ```

3. Deploy functions:
   ```bash
   npm run deploy
   ```

### 3. Flutter App Setup

1. Navigate to Flutter app:
   ```bash
   cd flutter_app
   flutter pub get
   ```

2. Configure Firebase for iOS:
   - Go to Firebase Console > Project Settings > Add app > iOS
   - Download `GoogleService-Info.plist`
   - Place it in `ios/Runner/`

3. Generate Firebase options:
   ```bash
   flutterfire configure
   ```

4. Run the app:
   ```bash
   flutter run
   ```

### 4. Generate Books

Use the batch generation tool to create the story library:

```bash
cd tools
npm install
npm run generate -- --count 1000 --age-range all
```

Options:
- `--count` - Number of books to generate (default: 10)
- `--age-range` - Target age range: 3-5, 6-8, 9-12, or all
- `--resume` - Resume from last progress checkpoint
- `--dry-run` - Preview without generating

Progress is saved to `.batch_progress.json` for resume capability.

## App Store Kids Category Requirements

This app is designed to meet Apple's Kids Category requirements:

1. **No advertising** - The app contains no ads
2. **No analytics/tracking** - No user data is collected
3. **No external links** - All content is self-contained
4. **No in-app purchases** - Free content only
5. **Parental gate** - Settings require math problem to access
6. **Age-appropriate content** - All stories are reviewed for appropriateness
7. **No user accounts** - No sign-in required

## Privacy Policy

This app:
- Does NOT collect any personal information
- Does NOT use analytics or tracking
- Does NOT display advertisements
- Does NOT contain external links
- Does NOT require user accounts
- Stores audio cache locally on device only

## Content Guidelines

All generated stories follow these guidelines:
- Age-appropriate vocabulary and themes
- Educational value (moral lessons, learning)
- Positive messages
- No violence or scary content
- No inappropriate language
- Culturally sensitive and inclusive

## Folder Details

### `/flutter_app/lib/`

- `main.dart` - App entry point and theme
- `models/book.dart` - Data models
- `services/` - Firebase, audio, caching services
- `screens/` - UI screens (home, reader, settings)

### `/functions/src/`

- `services/anthropicService.ts` - Story text generation
- `services/imagenService.ts` - Image generation
- `services/audioService.ts` - TTS audio generation
- `services/bookService.ts` - Book orchestration
- `index.ts` - Cloud Function endpoints

### `/firebase-config/`

- `firestore.rules` - Database security rules
- `storage.rules` - File storage security rules

## Troubleshooting

### Audio not playing
- Check internet connection
- Verify Firebase Storage rules allow read access
- Check console for audio URL errors

### Images not loading
- Verify Firebase Storage rules
- Check image URLs in Firestore
- Clear app cache and retry

### Book generation fails
- Check API key configuration
- Verify Cloud Functions are deployed
- Check Functions logs for errors

## License

Private - All rights reserved.
