import { Waypoint } from '../lib/Waypoint';
import { ReqWithParams } from '../lib/global';

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
        return Error('404: Waypoint Not Found');
      }
      return response.json();
    })
    .then((payload) => {
      return payload as Waypoint;
    })
    .catch((error) => {
      if (error instanceof SyntaxError) {
        return Error('500: JSON Parse Error');
      }

      // @TODO: Record and translate other errors here.
      console.log(error);

      return Error('500: Unknown error in getWaypoint');
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

  return new Response(JSON.stringify(waypoint), {
    status: 200,
    headers: standardHeaders,
  });
}
