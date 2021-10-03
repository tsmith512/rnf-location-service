import { RNFRequest, standardHeaders } from '../lib/global';
import { Query } from '../lib/Query';

export async function TripDelete(request: RNFRequest): Promise<Response> {
  const id = parseInt(request.params.id);

  const query = new Query({
    endpoint: `/trip_data?id=eq.${id}`,
    delete: true,
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
