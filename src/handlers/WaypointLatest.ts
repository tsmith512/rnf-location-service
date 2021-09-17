import { Waypoint, WaypointProps } from '../lib/Waypoint';
import { RNFRequest } from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getLatestWaypoint(): Promise<Waypoint | Error> {
  const query = new Query({
    endpoint: '/waypoints',
    range: 1,
    single: true,
  });

  return query.run()
    .then((payload) => {
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

  const output = (request.auth === 'ADMIN') ? waypoint : locationFilter(waypoint);

  return new Response(JSON.stringify(output), {
    status: 200,
    headers: standardHeaders,
  });
}
