import { Waypoint, WaypointProps } from '../lib/Waypoint';
import { RNFRequest, standardHeaders } from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

async function getLatestWaypoint(): Promise<Waypoint | Error> {
  const query = new Query({
    endpoint: '/waypoints',
    range: 1,
    single: true,
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

export async function WaypointLatest(request: RNFRequest): Promise<Response> {
  const waypoint = await getLatestWaypoint();

  if (waypoint instanceof Error) {
    const [code, message] = waypoint.message?.split(': ');
    return new Response(JSON.stringify({ message: message }), {
      status: parseInt(code),
      headers: standardHeaders,
    });
  }

  // If this hasn't been geocoded yet, do it.
  if (waypoint.geocode_attempts == 0) {
    await waypoint.geocode().then((result) => {
      waypoint.save();
    });
  }

  const output = request.auth === 'ADMIN' ? waypoint : locationFilter(waypoint);

  return new Response(JSON.stringify(output), {
    status: 200,
    headers: standardHeaders,
  });
}
