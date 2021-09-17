import { Router } from 'itty-router';

import {
  TripIndex,
  TripDetails,
  WaypointCreate,
  WaypointSearch,
  WaypointLatest,
} from './handlers';
import { authCheck, requireAdmin } from './lib/Auth';

const router = Router();

// Prepopulate "is this an admin?" for all requests
router.all('*', authCheck);

// Waypoint related
router.post('/waypoint', requireAdmin, WaypointCreate);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);

// Trip related
router.get('/trips/', TripIndex);
router.get('/trip/:id', TripDetails);

// Catch-all 404
router.get('*', (request) => new Response('Route Not Found', {
  status: 404,
  headers: {
    'Content-Type': 'text/plain'
  },
}));

export const routeRequest = (request: Request) => router.handle(request);
