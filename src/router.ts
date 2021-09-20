import { Router } from 'itty-router';

import {
  TripIndex,
  TripDetails,
  WaypointCreate,
  WaypointSearch,
  WaypointLatest,
  TripCreate,
  WaypointIndex,
} from './handlers';
import { authCheck, requireAdmin } from './lib/Auth';
import { fillMissingGeocode } from './util';

const router = Router();

// Prepopulate "is this an admin?" for all requests
router.all('*', authCheck);

// Waypoint related
router.get('/waypoints', requireAdmin, WaypointIndex);
router.post('/waypoint', requireAdmin, WaypointCreate);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);

// Trip related
router.get('/trips', TripIndex);
router.post('/trip', requireAdmin, TripCreate);
router.get('/trip/:id', TripDetails);

router.get('/geocode-test', (request) => {
  return fillMissingGeocode(5);
});

// Catch-all 404
router.get('*', (request) => new Response('Route Not Found', {
  status: 404,
  headers: {
    'Content-Type': 'text/plain'
  },
}));

router.post('*', (request) => new Response('Method Not Allowed', {
  status: 405,
  headers: {
    'Content-Type': 'text/plain'
  },
}));

export const routeRequest = (request: Request) => router.handle(request);
