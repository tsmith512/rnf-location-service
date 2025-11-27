import { RNFRequest, standardHeaders } from '../lib/global';
import { Query } from '../lib/Query';
import type { Env } from '../index';

export async function TripDelete(request: RNFRequest, env: Env): Promise<Response> {
  const id = parseInt(request.params.id);

  const query = new Query({
    endpoint: `/trip_data?id=eq.${id}`,
    delete: true,
    admin: true,
    env,
  });

  const result = await query.run().then((payload) => {
    if (payload instanceof Error) {
      return new Response(JSON.stringify({ message: payload.message }), {
        status: 500,
        headers: standardHeaders,
      });
    }

    return new Response('', {
      status: 204,
      headers: standardHeaders,
    });
  });

  return result;
}
