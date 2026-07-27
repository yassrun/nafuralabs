# Blanner App

Modular Flutter application for Blanner’s authentication experience. It uses Riverpod for state management, GoRouter for navigation, and Firebase Authentication (phone + OTP, Google, Facebook).

## Project Structure

```
lib/
  app.dart                  # Root widget + router wiring
  core/                     # Routing, utils, failures
  design_system/            # Theme, tokens, reusable widgets
  features/auth/            # Domain, infrastructure, application, presentation
  shared/                   # Shared extensions/widgets (future)
```

## Requirements

- Flutter 3.38+
- Dart 3.10+
- Firebase project with Phone, Google, and Facebook auth providers enabled

## Setup

1. **Install dependencies**
   ```bash
   flutter pub get
   ```

2. **Configure Firebase**
   - Install the [FlutterFire CLI](https://firebase.google.com/docs/flutter/setup?platform=ios#cli).
   - Run `flutterfire configure` inside the project directory.
   - When prompted, select the Firebase project + platforms (Android/iOS).
   - The command will generate `lib/firebase_options.dart`. Allow it to overwrite the existing stub.

3. **Platform-specific Firebase setup**
   - **Android:** Add the generated `google-services.json` under `android/app/`.
   - **iOS:** Add the generated `GoogleService-Info.plist` under `ios/Runner/` and ensure it is included in Xcode build settings.

4. **Facebook login**
   - Create a Facebook app and configure the bundle ID / package name + hashes.
   - Update the Android `strings.xml`/manifest and iOS `Info.plist` with the Facebook App ID + client token.
   - Enable the Facebook provider in Firebase Authentication and paste the secret keys there (never in the repo).

5. **Run the app**
   ```bash
   flutter run
   ```

## Notes

- `lib/firebase_options.dart` currently contains a placeholder that throws at runtime. Replace it using `flutterfire configure`.
- API keys, OAuth secrets, and SHA certificates should never be committed—follow Firebase’s guided setup per platform.
- The design system is tokenized (colors/typography/spacing) so you can easily swap values when the final DS is available.
