/**
 *               _                  _      __                  _
 *  _ _ ___ _  _| |_ ___   _ _  ___| |_   / _|___ _  _ _ _  __| |
 * | '_/ _ \ || |  _/ -_) | ' \/ _ \  _| |  _/ _ \ || | ' \/ _` |
 * |_| \___/\_,_|\__\___| |_||_\___/\__| |_| \___/\_,_|_||_\__,_|
 *
 * Worker to accept API requests related to maps and geocoding from the location
 * tracker phone, trip management backend, or WordPress (server- or client-side)
 */

import { routeRequest } from './router';
import { fillMissingGeocode } from './util';

export interface Env {
  // Secrets
  DB_ENDPOINT: string;
  DB_ADMIN_JWT: string;
  GMAPS_API_KEY: string;
  API_ADMIN_USER: string;
  API_ADMIN_PASS: string;
  // Variables from wrangler.toml
  GMAPS_API_ENDPOINT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Check edge cache to see if we have an answer for this, if so return it
    const cache = caches.default;
    if (!request.headers.has('authorization')) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Generate the response
    const response = await routeRequest(request, env);

    // If this response is publicly cacheable, store it in edge
    if (response.headers.has('cache-control')) {
      const cacheHeader = response.headers.get('cache-control');
      if (cacheHeader?.indexOf('public') === 0) {
        ctx.waitUntil(cache.put(request, response.clone()));
      }
    }

    return response;
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(
      fillMissingGeocode(20, env).then((response) => {
        console.log('Geocoding cron completed:', response.status);
      })
    );
  },
};
