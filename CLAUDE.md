# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Worker that provides a location tracking API for Route Not Found. It accepts waypoint data from Tasker on a phone, manages trip information from an admin backend, and serves location data to WordPress for display. The worker acts as middleware between clients and a PostgREST/PostgreSQL backend.

## Commands

### Build and Development
- `npm run build` - Build the worker using webpack
- `npm run lint` - Run ESLint and Prettier checks (fails with any warnings)
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests (note: jestconfig.json may not exist yet)

### Deployment
This project uses Wrangler (Cloudflare's CLI) for deployment. Configuration is in `wrangler.toml`:
- Production route: `api.routenotfound.com`
- Dev route: `api.dev.routenotfound.com`
- Hourly cron job (`0 * * * *`) to geocode pending waypoints

## Architecture

### Request Flow
1. `src/index.ts` - Entry point with fetch and scheduled event listeners
2. Edge cache check (skipped for authenticated requests)
3. `src/router.ts` - Routes requests using itty-router
4. Handler functions in `src/handlers/` - Process specific endpoints
5. Model classes in `src/lib/` - Business logic and data operations
6. PostgREST backend - Actual data storage

### Authentication
- HTTP Basic Auth using `API_ADMIN_USER` and `API_ADMIN_PASS` secrets
- Two modes: ADMIN (full access) or PUBLIC (filtered data)
- `src/lib/Auth.ts` provides `authCheck` middleware (adds auth property to requests) and `requireAdmin` guard
- Authenticated requests bypass edge caching

### Caching Strategy
Implemented in `src/lib/global.ts`:
- Public requests are cached at Cloudflare edge
- Cache duration varies by object age and type:
  - Current trips/waypoints: 0 hours (no cache)
  - Recent waypoints (<24h): 1 hour
  - Recent trips (<72h): 12 hours
  - Old trips: 30 days
  - Old geocoded waypoints: 7 days
  - Recent ungecoded waypoints: 2 hours

### Data Models

**Waypoint** (`src/lib/Waypoint.ts`):
- Represents a geographic location with timestamp
- Can be geocoded using Google Maps API via `Geocoder` class
- Stored with optional label, state, country, and full geocode results
- Uses PostGIS `POINT` geometry type in database
- `isPast()` returns hours since timestamp

**Trip** (`src/lib/Trip.ts`):
- Time-bounded collection of waypoints with metadata
- Properties: id, label, slug, start/end timestamps, GeoJSON line
- `validate()` checks required fields before save
- `isPast()` returns hours since end timestamp

**Query** (`src/lib/Query.ts`):
- Abstraction layer for PostgREST API calls
- Handles authentication via JWT (`DB_ADMIN_JWT` secret)
- Supports range queries, upserts, single object returns
- Error translation from HTTP status codes

**Geocoder** (`src/lib/Geocoder.ts`):
- Reverse geocodes lat/lon to human-readable location names
- Uses Google Maps Geocoding API
- Parses address components into structured data
- `buildLocationName()` formats location as "City, ST, Country"

### Key Endpoints

**Waypoints:**
- `POST /waypoint` - Create waypoints from CSV (admin only, legacy format)
- `GET /waypoint` - Get most recent waypoint
- `GET /waypoint/:whattime` - Find closest waypoint within a trip
- `GET /waypoints` - List all waypoints (admin only)
- `GET /waypoints/pending` - Count waypoints missing geocode data (admin only)
- `GET /waypoints/pending/process` - Process batch of 10 ungecoded waypoints (admin only)

**Trips:**
- `GET /trips` - List all trips (without GeoJSON line)
- `POST /trip` - Create or update trip (upsert, admin only)
- `GET /trip/:id` - Get trip details with GeoJSON line
- `DELETE /trip/:id` - Delete trip (admin only)

### Scheduled Tasks

`src/util.ts::fillMissingGeocode()`:
- Runs hourly via cron trigger
- Fetches waypoints missing geocode data
- Geocodes them via Google Maps API
- Saves updated waypoints in bulk
- Returns 416 when all waypoints are geocoded

### Environment & Secrets

Variables in `wrangler.toml`:
- `GMAPS_API_ENDPOINT` - Google Maps API base URL

Required secrets (set per environment):
- `API_ADMIN_USER` / `API_ADMIN_PASS` - Admin authentication
- `DB_ENDPOINT` - PostgREST endpoint URL
- `DB_ADMIN_JWT` - JWT token for PostgREST admin operations
- `GMAPS_API_KEY` - Google Maps API key

Global variables are declared in `src/index.ts` using `declare global` block.

## Important Notes

- This is a **service worker** format (not module worker). Global env vars/secrets are accessed directly, not through an `env` binding object.
- Location data filtering: Public requests get filtered location data; admin requests get full precision.
- CSV format for waypoint creation: `date,timestamp,lat,lon` (one waypoint per line)
- API documentation exists in `apiary.apib` (API Blueprint format)
- Main branch is `trunk`, not `main` or `master`
