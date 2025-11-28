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
  FiftyStates,
} from './handlers';
import { authCheck, requireAdmin } from './lib/Auth';
import { corsHeaders } from './lib/global';
import { fillMissingGeocode } from './util';
import type { Env } from './index';

const router = Router();

// Prepopulate "is this an admin?" for all requests
router.all('*', (request: Request, env: Env) => authCheck(request, env));

// Waypoint related
router.get('/waypoints', requireAdmin, WaypointIndex);
router.get('/waypoints/pending', requireAdmin, WaypointsPending);
router.get('/waypoints/pending/process', requireAdmin, (_request: Request, env: Env) => {
  return fillMissingGeocode(10, env);
});
router.post('/waypoint', requireAdmin, WaypointCreate);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);

// Trip related
router.get('/trips', TripIndex);
router.post('/trip', requireAdmin, TripCreate);
// @TODO: Differentiate post-new and patch-edit. Right now post will overwrite.
router.get('/trip/:id', TripDetails);
router.delete('/trip/:id', requireAdmin, TripDelete);

// Specials and Side Projects
router.get('/fifty_states', FiftyStates);

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

export const routeRequest = (request: Request, env: Env): Response | Promise<Response> =>
  router.handle(request, env);
