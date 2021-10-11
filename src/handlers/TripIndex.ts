import { Trip } from '../lib/Trip';
import { cacheHeaders, RNFRequest, standardHeaders } from '../lib/global';
import { Query } from '../lib/Query';

async function getAllTrips(range: string | undefined): Promise<Trip[] | Error> {
  const query = new Query({
    endpoint: '/trips?select=id,label,slug,start,end',
    range: range ? range : undefined,
  });

  return query.run().then((payload) => {
    if (payload instanceof Error) {
      return payload;
    } else if (payload instanceof Array) {
      return payload.map((t) => new Trip(t));
    }

    return Error('500: Unable to process payload');
  });
}

export async function TripIndex(request: RNFRequest): Promise<Response> {
  const range = request.headers
    .get('Range')
    ?.match(/\d+-\d+/g)
    ?.pop();

  const trips = await getAllTrips(range);

  if (trips instanceof Error) {
    const [code, message] = trips.message?.split(': ');
    return new Response(JSON.stringify({ message: message }), {
      status: parseInt(code),
      headers: standardHeaders,
    });
  }

  if (!trips.length) {
    return new Response(JSON.stringify({ message: 'No trips available in this range' }), {
      status: 416,
      headers: cacheHeaders(12, request),
    });
  }

  return new Response(JSON.stringify(trips), {
    status: 200,
    headers: cacheHeaders(12, request),
  });
}
