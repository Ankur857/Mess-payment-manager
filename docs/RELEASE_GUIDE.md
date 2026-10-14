# Fee Manager — Android Release & Build Guide

This document describes how to build, sign, and distribute the standalone Android APK or Google Play App Bundle (AAB) for **Fee Manager**.

---

## 1. Prerequisites

1. **Expo Account:**
   Sign up or log in at [expo.dev](https://expo.dev).
2. **EAS CLI:**
   Install or run EAS CLI via `npx`:
   ```powershell
   npx eas-cli@latest login
   ```
3. **Configure Project ID:**
   Initialize the EAS project configuration:
   ```powershell
   npx eas-cli@latest project:init
   ```

---

## 2. Environment Variables in EAS

Fee Manager uses Supabase client credentials (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Add them to EAS Secrets so they are embedded securely during cloud builds:

```powershell
npx eas-cli@latest secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co" --type string
npx eas-cli@latest secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key" --type string
```

> **Note:** Never add `SUPABASE_SERVICE_ROLE_KEY` or Meta WhatsApp Access Tokens to EAS project secrets or client bundles. Those belong exclusively in Supabase Edge Functions Secrets.

---

## 3. Build Profiles (`eas.json`)

| Profile | Output Format | Purpose | Command |
|---|---|---|---|
| **`preview`** | Standalone `.apk` | Sideload directly to any Android phone for internal testing | `npx eas-cli build -p android --profile preview` |
| **`production`** | Google Play `.aab` | Official submission bundle for Google Play Console | `npx eas-cli build -p android --profile production` |
| **`development`** | Custom Dev Client | Debugging native camera and custom native libraries | `npx eas-cli build -p android --profile development` |

---

## 4. Generating a Standalone Android APK (Recommended for Testing)

To generate an installable APK file without publishing to Google Play:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

### What Happens:
1. EAS packages your TypeScript assets and generates the Android project using Continuous Native Generation (CNG).
2. A release keystore is automatically generated and managed securely by Expo.
3. EAS outputs a download URL and QR code in your terminal upon completion.
4. Download the `.apk` directly to your Android device or scan the QR code to install.

---

## 5. Generating Google Play Store Release (AAB)

When ready to publish to Google Play:

```powershell
npx eas-cli@latest build --platform android --profile production
```

Once completed, submit directly using:
```powershell
npx eas-cli@latest submit -p android
```

---

## 6. Local Release Verification Checklist

Before triggering a release build, always run the automated verification checks:

```powershell
# 1. Typecheck
npx tsc --noEmit

# 2. Dependency and config health check
npx expo-doctor

# 3. Integration tests and security scanner
npm test
```
