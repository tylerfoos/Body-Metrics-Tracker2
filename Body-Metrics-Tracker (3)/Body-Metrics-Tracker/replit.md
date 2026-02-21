# BodyLog - Replit Agent Guide

## Overview

BodyLog is a body measurement tracking mobile application built with Expo (React Native). It allows users to track body measurements (neck, shoulders, chest, biceps, etc.), vital signs (heart rate, blood oxygen, etc.), progress photos, and calculated ratios. The app features onboarding, a dashboard with mini charts, CSV import/export, and a settings screen for customization.

The project uses a dual architecture: a React Native frontend (via Expo) for the mobile/web UI, and an Express.js backend server. Currently, most data is stored locally on-device using AsyncStorage, while the server side has a PostgreSQL schema defined via Drizzle ORM (with basic user table) that is not yet heavily utilized.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: Tab-based layout with three tabs (Dashboard, Photos, Settings) plus modal screens (add-entry, import-csv, measurement-info, onboarding)
- **State Management**: React Context (`AppContext`) provides global state for profile, measurements, entries, photos, and custom configurations. No Redux or other state library.
- **Data Persistence**: AsyncStorage (`@react-native-async-storage/async-storage`) stores all user data locally on device. Keys are prefixed with `@bodylog_`. This is the primary data store — the PostgreSQL database is scaffolded but not yet the main storage mechanism.
- **Styling**: Raw StyleSheet (no component library like NativeBase or Tamagui). Custom theme system in `constants/colors.ts` with light/dark mode support using `useColorScheme()`.
- **Fonts**: Inter font family loaded via `@expo-google-fonts/inter`
- **Data Fetching**: TanStack React Query is installed and configured (`lib/query-client.ts`) with an `apiRequest` helper that points to the Express server. Currently the app primarily reads from local AsyncStorage rather than the API.
- **Charts**: Custom `MiniChart` component using `react-native-svg` for sparkline-style charts on the dashboard
- **Key Libraries**: expo-haptics (tactile feedback), expo-image-picker (photos), expo-document-picker + expo-file-system (CSV import), expo-sharing (export)

### Backend (Express.js)

- **Server**: Express 5 running on the same Replit instance, defined in `server/index.ts`
- **Routes**: Registered via `server/routes.ts` — currently minimal, just creates an HTTP server. API routes should be prefixed with `/api`.
- **CORS**: Custom middleware that allows Replit domains and localhost origins
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with in-memory implementation (`MemStorage`). Currently only has user CRUD methods.
- **Static Serving**: In production, the server serves a pre-built Expo web bundle. In development, it proxies to the Metro bundler.
- **Build System**: `scripts/build.js` handles building the Expo web app for production deployment. Server is bundled with esbuild.

### Database (PostgreSQL + Drizzle ORM)

- **Schema**: Defined in `shared/schema.ts` using Drizzle ORM's `pgTable`. Currently only has a `users` table with id, username, and password fields.
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, outputs to `./migrations` directory. Uses `DATABASE_URL` environment variable.
- **Validation**: `drizzle-zod` generates Zod schemas from the Drizzle table definitions (`insertUserSchema`)
- **Current State**: The database schema is minimal. The app's actual data (measurements, entries, photos, profile) lives in AsyncStorage on the client. When extending the app to sync data to the server, new tables should be added to `shared/schema.ts`.

### Key Data Models (Client-Side)

Defined in `lib/types.ts`:
- **UserProfile**: name, units (imperial/metric), sex, age, height, onboarding status
- **MeasurementDefinition**: describes a trackable measurement (body or vital) with units, variations, left/right support, sub-sites
- **SelectedMeasurement**: which measurements the user has enabled and their configuration
- **MeasurementEntry**: a logged data point with date, measurement values, and notes
- **ProgressPhoto**: photo URI with date, type, and notes
- **RatioDefinition**: calculated ratios between two measurements

### Measurement System

- Predefined body measurements and vital signs in `lib/measurements.ts`
- Support for custom user-defined measurements, ratios, and photo types
- Unit conversion between imperial and metric
- CSV import parses Apple Health Export format (`lib/csv-parser.ts`)

### Development Workflow

- `npm run expo:dev` — Start Expo dev server (configured for Replit)
- `npm run server:dev` — Start Express backend with tsx
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` — Build static web bundle
- `npm run server:prod` — Run production server

## External Dependencies

- **PostgreSQL**: Required for Drizzle ORM. Connection via `DATABASE_URL` environment variable. Currently has minimal schema (users table only).
- **AsyncStorage**: Primary data store for all app data (on-device, no cloud sync yet)
- **Expo Services**: Uses various Expo SDK modules (no EAS Build or Expo push notifications configured)
- **No Authentication**: No auth system is currently implemented despite having a users table. The app works without login.
- **No Third-Party APIs**: No external API integrations. All data is local.