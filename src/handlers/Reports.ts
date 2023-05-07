import { now, RNFRequest, standardHeaders } from '../lib/global';
import { Query } from '../lib/Query';

export async function WaypointsPending(request: RNFRequest): Promise<Response> {
  const results = await new Query({
    endpoint: '/rpc/waypoints_pending_count',
    admin: true,
  }).run();

  if (request instanceof Error) {
    return new Response(JSON.stringify(results), {
      status: 500,
      headers: standardHeaders
    });
  } else {
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: standardHeaders,
    });
  }
};
