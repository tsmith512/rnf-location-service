import { Trip } from './Trip';
import { Waypoint } from './Waypoint';

/**
 * So between the Request that CF passes to the Worker and what itty-router
 * does, which appears to slap a few properties onto that, I am not sure what
 * `type` to use for Requests in this context. So I'm creating this one with known properties.
 */
export interface RNFRequest extends Request {
  params?: any;
  auth?: string | null;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

/**
 * All responses start with at least these unless something special is happening
 */
export const standardHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
};

export const cacheHeaders = (hours: number, request?: RNFRequest) => {
  // Only if we know this isn't an admin request, save it.
  if (request?.auth !== 'ADMIN') {
    return {
      'cache-control': `public, max-age=${hours * 60 * 60}`,
      'x-rnf-cache-debug': `Fetched at ${now()} and cacheable for ${hours} hours.`,
      ...standardHeaders,
    };
  }

  return standardHeaders;
};

/**
 * Gimme a unix timestamp. Gonna repeat this a few times and easier to just have
 * the math done in one place before I do it stupidly somewhere else.
 *
 * @returns (number) a Unix timestamp
 */
export const now = (): number => Math.floor(new Date().getTime() / 1000);

export const cacheControlByObject = (object: Trip | Waypoint): number => {
  const past = object.isPast();

  // If it's current, don't cache
  if (past === false) {
    return 0;
  }

  // If it's recent, keep it for an hour just to reduce load
  else if (past < 24) {
    return 1;
  }

  // Recently finished trips, keep 'em somewhat fresh
  else if (object instanceof Trip && past < 72) {
    return 12;
  }

  // Old trips are good forever
  else if (object instanceof Trip) {
    return 24 * 30;
  }

  // Recent waypoints, don't keep 'em long in case data hasn't been submitted
  // yet, or if geocoding isn't complete
  else if (past < 72 || object.geocode_attempts < 1) {
    return 2;
  }

  // By now: we're looking at Waypoints that are older and are geocoded. Keep
  // them longer.
  return 24 * 7;
};
