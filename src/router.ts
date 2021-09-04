import { Router } from 'itty-router';

import { HelloWorld } from './handlers';

const router = Router();

router.post('/waypoints', HelloWorld);
router.get('/waypoints', HelloWorld);
router.get('/waypoint/latest', HelloWorld);
router.get('/waypoint/:whattime', HelloWorld);
router.get('/trips/', HelloWorld);
router.get('/trip/:id', HelloWorld);
router.get('*', HelloWorld);

export const routeRequest = (request: Request) => router.handle(request);
