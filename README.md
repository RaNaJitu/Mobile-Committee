# Committee Management Mobile App

A React Native mobile application built with Expo for managing committee draws, members, and payments.

## Features

- 🔐 Secure authentication with token storage
- 📊 Committee management and analysis
- 🎲 Draw management with timer functionality
- 💰 Payment tracking and management
- 👥 Member management
- 🎤 Voice announcements for draw timers

## Prerequisites

- Node.js 18+ or Bun
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://your-api-url.com/api/v1
   EXPO_PUBLIC_ENV=development
   ```

## Development

Start the development server:
```bash
bun run start
# or
npm run start
```

For Android:
```bash
bun run android
```

For iOS:
```bash
bun run ios
```

## Production Build

### Android
```bash
bun run build:android
```

### iOS
```bash
bun run build:ios
```

### Production Mode
```bash
bun run start:prod
```

## Environment Variables

- `EXPO_PUBLIC_API_BASE_URL` - Your API base URL (required)
- `EXPO_PUBLIC_ENV` - Environment: `development`, `staging`, or `production` (default: `development`)

## Security Features

- ✅ Secure token storage using expo-secure-store
- ✅ No password storage in memory
- ✅ Production-safe logging
- ✅ Error boundaries for crash handling
- ✅ Environment-based configuration

## Project Structure

```
├── app/                 # Expo Router pages
├── screens/            # Screen components
├── components/         # Reusable components
├── api/               # API functions
├── context/           # React Context providers
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── theme/             # Theme and colors
└── config/            # Configuration files
```

## Scripts

- `start` - Start Expo development server
- `start:dev` - Start with cleared cache
- `start:prod` - Start in production mode
- `android` - Start and open on Android
- `ios` - Start and open on iOS
- `build:android` - Build Android production app
- `build:ios` - Build iOS production app
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking

## Production Checklist

Before deploying to production:

- [x] Secure token storage implemented
- [x] Password removed from memory
- [x] Error boundaries added
- [x] Console logs replaced with logger
- [x] Environment variables configured
- [x] Production build scripts added
- [ ] Add analytics/crash reporting (optional)
- [ ] Set up CI/CD pipeline
- [ ] Configure app store metadata
- [ ] Test on physical devices
- [ ] Performance optimization
- [ ] Security audit

## License

Private - All rights reserved
