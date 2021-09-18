import { Waypoint, waypointBulkSave } from '../lib/Waypoint';
import { RNFRequest, standardHeaders } from '../lib/global';

export async function WaypointCreate(request: RNFRequest): Promise<Response> {
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

    // Confirm we have all the pieces, Tasker's queue ends with an empty line.
    // Or maybe a line is goofy.
    if (timestamp && lon && lat) {
      waypoints.push(
        new Waypoint({
          timestamp: parseInt(timestamp),
          lon: parseFloat(lon),
          lat: parseFloat(lat),
        })
      );
    }
  });

  // If we get a few, geocode each. Otherwise only geocode the last one,
  // and punt the rest to cron and on-demand.
  if (waypoints.length < 5) {
    await Promise.all(waypoints.map(async (p) => {
      await p.geocode();
    }));
  } else {
    await waypoints[waypoints.length - 1].geocode();
  }

  const saves = await waypointBulkSave(waypoints);

  // @TODO: Make this happen in all handlers. This endpoint would send a 200 to
  // the client when it got a 403 trying to save stuff.
  if (saves instanceof Error) {
    return new Response(JSON.stringify(saves), {
      status: 500,
      headers: standardHeaders,
    });
  }

  // @TODO: So if we didn't get a save confirmation for each record we tried to
  // make... what do we do? v1 also provided this distinction but never did
  // anything about it. :upside_down_face:
  const status = (saves === waypoints.length) ? 201 : 200;

  return new Response(JSON.stringify(waypoints), {
    status: status,
    headers: standardHeaders,
  });
}
