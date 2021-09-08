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

export async function WaypointCreate(request: ReqWithParams): Promise<Response> {
  // Tasker [still...] records the data in a text file like this:
  //   1-12-17,1484250000,30.123,-95.123
  //   1-12-18,1484260000,30.456,-95.456
  // Human readable date, Unix Timestamp, Latitude, Longitude newline
  // @TODO: And yes lon/lat are in the wrong order.

  const body = await request.text();
  const lines = body.replace(/[\r\n]+/, '\n').split('\n');
  const waypoints: Waypoint[] = [];

  lines.forEach((line) => {
    const [date, timestamp, lat, lon] = line.split(',');
    waypoints.push(
      new Waypoint({
        timestamp: parseInt(timestamp),
        lon: parseFloat(lon),
        lat: parseFloat(lat),
      })
    );
  });

  console.log(JSON.stringify(waypoints));

  waypoints.forEach((w) => w.geocode());

  console.log(JSON.stringify(waypoints));

  return new Response(JSON.stringify(waypoints), {
    status: 200,
    headers: standardHeaders,
  });
}
