import { Router } from 'itty-router';

import { HelloWorld } from './handlers/HelloWorld';

const router = Router();

router.get('*', HelloWorld);

export const handleRequest = (request: Request) => router.handle(request);
