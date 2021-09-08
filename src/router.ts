import { Router } from 'itty-router';

import {
  HelloWorld,
  TripIndex,
  TripDetails,
  WaypointSearch,
  WaypointLatest,
} from './handlers';

const router = Router();

router.post('/waypoints', HelloWorld);
router.get('/waypoints', HelloWorld);
router.get('/waypoint', WaypointLatest);
router.get('/waypoint/:whattime', WaypointSearch);
router.get('/trips/', TripIndex);
router.get('/trip/:id', TripDetails);
router.get('*', HelloWorld);

export const routeRequest = (request: Request) => router.handle(request);
