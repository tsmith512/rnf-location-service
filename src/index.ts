declare global {
  // In secrets
  const DB_ENDPOINT: string;
  const GMAPS_API_KEY: string;

  // In wrangler.toml as plaintext
  const GMAPS_API_ENDPOINT: string;
}

import { routeRequest } from './router';

addEventListener('fetch', (event) => {
  event.respondWith(routeRequest(event.request));
});
