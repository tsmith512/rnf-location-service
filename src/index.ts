declare global {
  // In secrets
  const DB_ENDPOINT: string;
  const DB_ADMIN_JWT: string;
  const GMAPS_API_KEY: string;
  const API_ADMIN_USER: string;
  const API_ADMIN_PASS: string;

  // In wrangler.toml as plaintext
  const GMAPS_API_ENDPOINT: string;
}

import { routeRequest } from './router';

addEventListener('fetch', (event) => {
  event.respondWith(routeRequest(event.request));
});
