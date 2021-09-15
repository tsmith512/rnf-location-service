import { Waypoint } from '../lib/Waypoint';
import { ReqWithParams } from '../lib/global';
import { locationFilter } from '../lib/Filter';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getWaypointByTime(whattime: number | null): Promise<Waypoint | Error> {
  // Tell PostgREST that we want a single object, not an array of one.
  const requestHeaders = new Headers();
  requestHeaders.append('Accept', 'application/vnd.pgrst.object+json');

  let request;

  if (whattime) {
    requestHeaders.append('content-type', 'application/json;charset=UTF-8');

    request = fetch(`${DB_ENDPOINT}/rpc/waypoint_by_time`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ whattime: whattime }),
    });
  } else {
    request = fetch(`${DB_ENDPOINT}/waypoints?limit=1`, {
      headers: requestHeaders,
    });
  }

  return request
    .then((response) => {
      if (response.status == 406) {
        // @TODO: waypoint_by_time gets the nearest waypoint to the requested
        // time. How would that 406?
        throw new Error('404: Waypoint Not Found');
      }
      return response.json();
    })
    .then((payload) => {
      return new Waypoint(payload);
    })
    .catch((error) => {
      if (error instanceof SyntaxError) {
        return Error('500: JSON Parse Error');
      }

      return error;
    });
}

export async function WaypointSearch(request: ReqWithParams): Promise<Response> {
  // This endpoint answers /waypoint and /waypoint/[number]
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

  const filtered = locationFilter(waypoint);

  return new Response(JSON.stringify(filtered), {
    status: 200,
    headers: standardHeaders,
  });
}
