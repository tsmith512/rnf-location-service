import { getAllWaypoints } from './handlers/WaypointIndex';
import { standardHeaders } from './lib/global';
import { waypointBulkSave } from './lib/Waypoint';

export async function fillMissingGeocode(count: number): Promise<Response> {
  const waypoints = await getAllWaypoints({
    range: `0-${count - 1}`,
    missingGeo: true,
  });

  if (waypoints instanceof Error) {
    const [code, message] = waypoints.message?.split(': ');
    return new Response(JSON.stringify({ message: message }), {
      status: parseInt(code),
      headers: standardHeaders,
    });
  }

  if (!waypoints.length) {
    return new Response(JSON.stringify({ message: 'All waypoints have been geocoded' }), {
      status: 416,
      headers: standardHeaders,
    });
  }

  await Promise.all(
    waypoints.map(async (p) => {
      return p.geocode();
    })
  );

  const saves = await waypointBulkSave(waypoints);

  if (saves instanceof Error) {
    return new Response(JSON.stringify(saves), {
      status: 500,
      headers: standardHeaders,
    });
  }

  const status = saves === waypoints.length ? 201 : 200;

  return new Response(JSON.stringify({ message: `${saves} waypoints updated` }), {
    status: status,
    headers: standardHeaders,
  });
}
