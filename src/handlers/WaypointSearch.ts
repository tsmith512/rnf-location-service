import { Waypoint, WaypointProps } from '../lib/Waypoint';
import { RNFRequest } from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getWaypointByTime(whattime: number): Promise<Waypoint | Error> {
  const query = new Query({
    endpoint: `/rpc/waypoint_by_time`,
    body: { whattime: whattime },
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

export async function WaypointSearch(request: RNFRequest): Promise<Response> {
  if (!isFinite(request.params?.whattime)) {
    return new Response(JSON.stringify({ message: 'Timestamp search must be numeric' }), {
      status: 404,
      headers: standardHeaders,
    });
  }

  const waypoint = await getWaypointByTime(parseInt(request.params.whattime));

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
