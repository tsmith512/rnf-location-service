import { Waypoint } from '../lib/Waypoint';
import {
  cacheControlByObject,
  cacheHeaders,
  RNFRequest,
  standardHeaders,
} from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

async function getWaypointByTime(whattime: number): Promise<Waypoint | Error> {
  const query = new Query({
    endpoint: `/rpc/waypoint_by_time`,
    body: { whattime: whattime },
    single: true,
  });

  return query.run().then((payload) => {
    if (payload instanceof Error) {
      return payload;
    }

    try {
      if (payload?.timestamp !== null) {
        return new Waypoint(payload);
      } else {
        return new Error('404: No matching waypoint');
      }
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

  // If this hasn't been geocoded yet, do it.
  if (waypoint.geocode_attempts == 0) {
    await waypoint.geocode().then(() => {
      waypoint.save();
    });
  }

  const cacheHours = cacheControlByObject(waypoint);

  const output = request.auth === 'ADMIN' ? waypoint : locationFilter(waypoint);

  return new Response(JSON.stringify(output), {
    status: 200,
    headers: cacheHeaders(cacheHours, request),
  });
}
