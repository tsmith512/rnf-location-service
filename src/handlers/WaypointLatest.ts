import { Waypoint } from '../lib/Waypoint';
import { ReqWithParams } from '../lib/global';
import { locationFilter } from '../lib/Filter';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getLatestWaypoint(): Promise<Waypoint | Error> {
  // Tell PostgREST that we want a single object, not an array of one.
  const requestHeaders = new Headers();
  requestHeaders.append('Accept', 'application/vnd.pgrst.object+json');

  return fetch(`${DB_ENDPOINT}/waypoints?limit=1`, { headers: requestHeaders })
    .then((response) => {
      if (response.status == 406) {
        // @TODO: The only way this could 406 at the database server is if the
        // waypoint_data table is empty.
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

export async function WaypointLatest(request: ReqWithParams): Promise<Response> {
  const waypoint = await getLatestWaypoint();

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
