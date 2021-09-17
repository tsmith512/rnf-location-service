import { Router } from 'itty-router';

import {
  HelloWorld,
  TripIndex,
  TripDetails,
  WaypointCreate,
  WaypointSearch,
  WaypointLatest,
} from './handlers';
import { authCheck, requireAdmin } from './lib/Auth';

const router = Router();

router.all('*', authCheck);

router.get('/waypoints', HelloWorld);
router.post('/waypoint', requireAdmin, WaypointCreate);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);
router.get('/trips/', TripIndex);
router.get('/trip/:id', TripDetails);

router.get('*', (request) => new Response('Route Not Found', {
  status: 404,
  headers: {
    'Content-Type': 'text/plain'
  },
}));

export const routeRequest = (request: Request) => router.handle(request);
