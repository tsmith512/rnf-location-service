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

const handleRequest = async (event: any) =>  {
  // Only unauthenticated GET requests can be cached.
  const request = event.request;
  const method = request.method;
  const authHeader = request.headers.get('Authorization');
  const cacheEligible = (method === 'GET') && !authHeader;

  // Does the CDN already have this? Shipit.
  if (cacheEligible) {
    const cachedResponse = await caches.default.match(request.url);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Nope, pass to the router and build it.
  const response = routeRequest(event.request);

  // Dispatch the result and save to CDN
  if (cacheEligible) {
    event.waitUntil(caches.default.put(request.url, new Response(response)));
  }
  return response;
};

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
