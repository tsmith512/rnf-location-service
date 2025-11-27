import { getAllWaypoints } from './handlers/WaypointIndex';
import { standardHeaders } from './lib/global';
import { waypointBulkSave } from './lib/Waypoint';
import type { Env } from './index';

export async function fillMissingGeocode(count: number, env: Env): Promise<Response> {
  const waypoints = await getAllWaypoints({
    range: `0-${count - 1}`,
    missingGeo: true,
    env,
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
      return p.geocode(env);
    })
  );

  const saves = await waypointBulkSave(waypoints, env);

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
