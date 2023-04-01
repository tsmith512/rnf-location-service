
/**
 *               _                  _      __                  _
 *  _ _ ___ _  _| |_ ___   _ _  ___| |_   / _|___ _  _ _ _  __| |
 * | '_/ _ \ || |  _/ -_) | ' \/ _ \  _| |  _/ _ \ || | ' \/ _` |
 * |_| \___/\_,_|\__\___| |_||_\___/\__| |_| \___/\_,_|_||_\__,_|
 *
 * Worker to accept API requests related to maps and geocoding from the location
 * tracker phone, trip management backend, or WordPress (server- or client-side)
 */

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

const handleRequest = async (event: any) => {
  const response = routeRequest(event.request);
  return response;
};

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

// @TODO: Rewrite as module worker, but the gotcha is that global env vars and
// secrets become bindings (props on env object passed as second obj to fetch())
