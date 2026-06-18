# SUMO AYCE

Full-stack website redesign for **SUMO**, an All You Can Eat restaurant chain in Mexico. Built with Nuxt 3, headless WordPress, and Vercel Postgres.

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white)](https://vercel.com)
[![WordPress](https://img.shields.io/badge/WordPress-Headless-21759B?logo=wordpress&logoColor=white)](https://wordpress.org)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-F22F46?logo=twilio&logoColor=white)](https://twilio.com)
[![Mapbox](https://img.shields.io/badge/Mapbox-Maps-000?logo=mapbox&logoColor=white)](https://mapbox.com)
[![Biome](https://img.shields.io/badge/Biome-Linter%20%2B%20Formatter-60A5FA?logo=biome&logoColor=white)](https://biomejs.dev)
[![License](https://img.shields.io/badge/License-Private-red)]()

## Overview

SUMO is a popular All You Can Eat sushi restaurant chain operating multiple branches across Mexico. This project migrates their existing WordPress site to a modern headless architecture, delivering a faster frontend while preserving the familiar WordPress admin for content management.

The redesign introduces three new features: a geolocation-based branch finder, a reservation system with WhatsApp notifications, and a digital loyalty program with a staff management portal.

### Live Site

> [sumo.com.mx](https://sumo.com.mx) (currently running legacy WordPress — redesign in progress)

## Features

### Website Redesign
- Dark-themed UI with brand orange (#F37021) accents
- SUMO Express section with exclusive blue (#2B3990) gradient transitions
- Mobile-first responsive design
- Server-side rendered for SEO
- Content managed via WordPress headless CMS

### Branch Finder
- Geolocation-based nearest branch search
- Postal code fallback for users who deny location access
- Interactive Mapbox maps with branch details
- Real-time distance calculations

### Reservation System
- Online reservation form (name, phone, branch, date, time, party size)
- Instant WhatsApp confirmation to the customer via Twilio
- WhatsApp notification to the branch manager
- Daily CSV report uploaded automatically to Google Drive

### Loyalty Program
- Points-based reward system (earn points per visit)
- Reward catalog and redemption
- WhatsApp notifications for points balance and rewards
- User registration and authentication

### Staff Portal
- Role-based authentication (staff and admin roles)
- Scan and validate customer loyalty visits
- Transaction history and reporting
- Branch-specific dashboard views

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 3 (Vue 3 + TypeScript) |
| Hosting | Vercel (frontend + serverless API + Postgres) |
| Database | Vercel Postgres + Prisma/Drizzle ORM |
| CMS | WordPress headless (REST API) |
| Maps | Mapbox GL JS |
| Messaging | Twilio WhatsApp Business API |
| Storage | Google Drive API (via Service Account) |
| Linter/Formatter | Biome |
| Git Hooks | Husky + commitlint |
| Commits | Conventional Commits |

## Architecture

```
                    ┌─────────────────┐
                    │   Hospedando.mx │
                    │   ┌───────────┐ │
                    │   │ WordPress │ │
                    │   │  (CMS)    │ │
                    │   └─────┬─────┘ │
                    └─────────┼───────┘
                              │ REST API
                              ▼
┌──────────────────────────────────────────────┐
│                   Vercel                     │
│                                              │
│  ┌──────────────┐      ┌──────────────────┐  │
│  │  Nuxt 3 SSR  │      │  /server/api/    │  │
│  │  (Frontend)  │◄────►│  (Backend)       │  │
│  └──────────────┘      └───────┬──────────┘  │
│                                │             │
│                        ┌───────▼──────────┐  │
│                        │ Vercel Postgres  │  │
│                        └─────────────────┘   │
└──────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   ┌──────────┐     ┌─────────────────┐
   │  Mapbox  │     │  Twilio + Drive │
   └──────────┘     └─────────────────┘
```

**Single project, single deploy.** Frontend pages and backend API routes live in the same Nuxt 3 repository. WordPress is used exclusively as a content management interface for the client — all transactional data flows through Vercel Postgres.

## Project Structure

```
sumo-ayce/
├── app/
│   ├── pages/                 # Frontend routes
│   ├── components/            # Vue components (PascalCase)
│   ├── composables/           # Shared logic (use* prefix)
│   └── layouts/               # Page layouts
├── server/
│   ├── api/
│   │   ├── reservaciones/     # Reservation endpoints
│   │   ├── lealtad/           # Loyalty endpoints
│   │   ├── staff/             # Staff portal endpoints
│   │   └── csv/               # Daily CSV cron job
│   └── utils/
│       ├── error-handler.ts   # Centralized error handling
│       ├── env.ts             # Environment validation (Zod)
│       └── db.ts              # Database client
├── types/                     # Shared TypeScript types
├── utils/                     # Shared utility functions
├── tests/
│   └── mocks/                 # Centralized external service mocks
├── .specify/                  # Spec-Kit SDD configuration
├── nuxt.config.ts
├── biome.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- A WordPress instance with REST API enabled
- Twilio account with WhatsApp Business API
- Mapbox account
- Google Cloud service account with Drive API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/beto-mn/sumo-ayce.git
cd sumo-ayce

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your credentials (see Environment Variables below)

# Run development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Database (Vercel Postgres)
DATABASE_URL=
POSTGRES_PRISMA_URL=

# WordPress
WORDPRESS_API_URL=https://sumo.com.mx/wp-json/wp/v2

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=

# Mapbox
NUXT_PUBLIC_MAPBOX_TOKEN=
```

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run Biome linting
pnpm format       # Run Biome formatting
pnpm test         # Run all tests
pnpm test:unit    # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm typecheck    # vue-tsc --noEmit
```

## Quality Gates

Every commit passes through mandatory quality gates enforced by Husky:

| Hook | Checks |
|------|--------|
| Pre-commit | Biome lint, Biome format, `vue-tsc --noEmit` |
| Commit message | Conventional Commits via commitlint |
| Pre-push | Unit tests, integration tests, zero TS errors |

## Author

**Roberto Mirón Najera**
Senior Software Engineer

- GitHub: [@beto-mn](https://github.com/beto-mn)
- Email: ing.betonajera@gmail.com

## License

This project is proprietary. All rights reserved.
