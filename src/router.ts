import { Router } from 'itty-router';

import {
  TripIndex,
  TripDetails,
  TripDelete,
  WaypointCreate,
  WaypointSearch,
  WaypointLatest,
  TripCreate,
  WaypointIndex,
  WaypointsPending,
} from './handlers';
import { authCheck, requireAdmin } from './lib/Auth';
import { corsHeaders } from './lib/global';
import { fillMissingGeocode } from './util';

const router = Router();

// Prepopulate "is this an admin?" for all requests
router.all('*', authCheck);

// Waypoint related
router.get('/waypoints', requireAdmin, WaypointIndex);
router.get('/waypoints/pending', requireAdmin, WaypointsPending);
router.get('/waypoints/pending/process', requireAdmin, () => {
  return fillMissingGeocode(10);
});
router.post('/waypoint', requireAdmin, WaypointCreate);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);

// Trip related
router.get('/trips', TripIndex);
router.post('/trip', requireAdmin, TripCreate);
router.get('/trip/:id', TripDetails);
router.delete('/trip/:id', requireAdmin, TripDelete);

// Options / Preflight
router.options(
  '*',
  () =>
    new Response(null, {
      headers: corsHeaders,
    })
);

// Catch-all 404
router.get(
  '*',
  () =>
    new Response('Route Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    })
);

router.post(
  '*',
  () =>
    new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    })
);

export const routeRequest = (request: Request): Response => router.handle(request);
