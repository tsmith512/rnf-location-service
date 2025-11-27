import { Waypoint, WaypointProps } from '../lib/Waypoint';
import { cacheHeaders, RNFRequest, standardHeaders } from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';
import type { Env } from '../index';

async function getLatestWaypoint(env: Env): Promise<Waypoint | Error> {
  const query = new Query({
    endpoint: '/waypoints',
    range: 1,
    single: true,
    env,
  });

  return query.run().then((payload) => {
    if (payload instanceof Error) {
      return payload;
    }

    try {
      return new Waypoint(payload as unknown as WaypointProps);
    } catch {
      return Error('500: Unable to process payload');
    }
  });
}

export async function WaypointLatest(request: RNFRequest, env: Env): Promise<Response> {
  const waypoint = await getLatestWaypoint(env);

  if (waypoint instanceof Error) {
    const [code, message] = waypoint.message?.split(': ');
    return new Response(JSON.stringify({ message: message }), {
      status: parseInt(code),
      headers: standardHeaders,
    });
  }

  // If this hasn't been geocoded yet, do it.
  if (waypoint.geocode_attempts == 0) {
    await waypoint.geocode(env).then(() => {
      waypoint.save(env);
    });
  }

  const output = request.auth === 'ADMIN' ? waypoint : locationFilter(waypoint);

  return new Response(JSON.stringify(output), {
    status: 200,
    headers: cacheHeaders(0.25, request),
  });
}
