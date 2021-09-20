import { Waypoint } from "../lib/Waypoint";
import { RNFRequest, standardHeaders } from '../lib/global';
import { Query } from '../lib/Query';

interface allWaypointsQueryProps {
  range?: string;
  missingGeo?: boolean;
}

export async function getAllWaypoints(props: allWaypointsQueryProps): Promise<Waypoint[] | Error> {
  const query = new Query({
    endpoint: '/waypoints_all',
    range: props.range,
    admin: true,
  });

  if (props.missingGeo) {
    query.endpoint += '?geocode_attempts=eq.0';
  }

  return query.run()
    .then((payload) => {
      if (payload instanceof Error) {
        return payload;
      } else if (payload instanceof Array) {
        return payload.map(w => new Waypoint(w));
      }

      return Error('500: Unable to process payload');
    });
}

export async function WaypointIndex(request: RNFRequest): Promise<Response> {
  const range = request.headers
    .get('Range')
    ?.match(/\d+-\d+/g)
    ?.pop();

  const waypoints = await getAllWaypoints({range: range});

  if (waypoints instanceof Error) {
    const [code, message] = waypoints.message?.split(': ');
    return new Response(JSON.stringify({ message: message }), {
      status: parseInt(code),
      headers: standardHeaders,
    });
  }

  if (!waypoints.length) {
    return new Response(JSON.stringify({ message: 'No waypoints available in this range' }), {
      status: 416,
      headers: standardHeaders,
    });
  }

  return new Response(JSON.stringify(waypoints), {
    status: 200,
    headers: standardHeaders,
  });
}
