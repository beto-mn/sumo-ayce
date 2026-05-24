# SUMO AYCE — Website Redesign

## Project Overview

Full-stack website redesign for SUMO, an All You Can Eat restaurant chain in Mexico (sumo.com.mx). The project migrates from a traditional WordPress site to a modern headless architecture.

## Client

- **Brand:** SUMO — All You Can Eat
- **Domain:** sumo.com.mx
- **Current hosting:** Hospedando.mx (plan "Emprendedor Libre", includes domain + email)
- **Brand colors:** Orange (#F37021), Dark (#0F0F0F / #1A1A1A), Express Blue (#2B3990)
- **Logo:** Square format, orange background, "SUMO" white text, "ALL YOU CAN EAT" on black bar. Must be used as-is without modifications.

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3 + TypeScript)
- **Hosting:** Vercel (frontend + server routes + PostgreSQL)
- **CMS:** WordPress headless (REST API or WPGraphQL) on Hospedando.mx
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Maps:** Mapbox (branch finder with geolocation)
- **Messaging:** Twilio WhatsApp Business API (reservations + loyalty notifications)
- **Storage:** Google Drive API (daily CSV upload)
- **DNS:** Hospedando.mx (or optionally Cloudflare)
- **Font:** Lato

## Architecture

Single Nuxt 3 project deployed to Vercel. Frontend pages and backend API routes (`/server/api/`) live together in one repo, one deploy. WordPress serves as a headless CMS only — the client edits content (menu, promotions, branch info) through the WordPress admin, and the Nuxt frontend fetches data via REST API. ISR with 60-second revalidation for content updates.

Features like reservations, loyalty, and staff portal connect directly to Neon PostgreSQL, not WordPress.

## Features

### Pages (content from WordPress CMS)
- Homepage
- Menu / Bebidas
- SUMO Express (uses brand blue #2B3990 with gradient transitions from dark theme)
- Contacto
- Sucursales

### Feature: Branch Finder
- Geolocation-based search (nearest branches)
- Postal code fallback search
- Browser permission prompt handling
- Mapbox integration for interactive maps

### Feature: Reservation System
- Reservation form (name, phone, branch, date, time, party size)
- WhatsApp confirmation to client via Twilio
- WhatsApp notification to branch manager via Twilio
- Daily CSV report of reservations uploaded to Google Drive (cron job)

### Feature: Loyalty Program
- Points-based system (points per visit)
- Reward redemption
- WhatsApp notifications for points/rewards
- User registration and authentication

### Feature: Staff Portal
- Staff login with role-based auth (staff vs admin)
- Dashboard to scan/validate loyalty visits
- Transaction history
- Branch-specific views

## Infrastructure Costs (Monthly)

| Service | Cost |
|---------|------|
| Vercel Pro | $20 USD/mo (~$400 MXN) |
| Hospedando.mx | ~$1,650 MXN/year (already owned) |
| Twilio WhatsApp | ~$500-$2,500 MXN/mo (volume-based) |
| Mapbox | Free (50k loads/mo) |
| Google Drive API | Free |

## Project Structure (Expected)

```
sumo-ayce/
├── app/                    # Nuxt app directory
│   ├── pages/              # Frontend pages
│   ├── components/         # Vue components
│   ├── layouts/            # Page layouts
│   └── composables/        # Shared logic
├── server/
│   ├── api/                # Backend API routes
│   │   ├── reservaciones/  # Reservation endpoints
│   │   ├── lealtad/        # Loyalty endpoints
│   │   └── staff/          # Staff portal endpoints
│   └── utils/              # Server utilities (db, twilio, drive)
├── public/                 # Static assets
├── nuxt.config.ts
└── package.json
```

## WordPress Custom Post Types

- Promociones (promotions)
- Sucursales (branches: name, address, hours, phone, coordinates)
- Menu items
- General page content

## Development Notes

- SUMO Express section uses blue (#2B3990) as accent color with gradient transitions from the dark theme, not as a base color. This blue is exclusive to the Express product line.
- All WhatsApp messages go through Twilio WhatsApp Business API (~$0.03 USD/message).
- CSV daily report runs as a cron job at end of day, generates CSV from Neon PostgreSQL, uploads to client's shared Google Drive folder via Service Account.
- The client will manage content through WordPress admin as they always have. They should not need to touch code.

<!-- SPECKIT START -->
## Active Feature

**Branch**: `feat/002-reservaciones-crud`
**Plan**: `specs/002-reservaciones-crud/plan.md`
**Spec**: `specs/002-reservaciones-crud/spec.md`
**Data Model**: `specs/002-reservaciones-crud/data-model.md`
**Quickstart**: `specs/002-reservaciones-crud/quickstart.md`
**API Contract**: `specs/002-reservaciones-crud/contracts/api.md`
<!-- SPECKIT END -->
