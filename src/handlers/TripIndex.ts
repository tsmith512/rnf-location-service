import { Trip } from '../lib/Trip';
import { ReqWithParams } from '../lib/global';
import { Query } from '../lib/Query';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

// NB: fetch() requires either a Host header or to fetch by hostname, not IP.
// Also NB: random IP:Port combos not allowed. Must connect to a standard HTTP(S)
// port on a named host in Cloudflare Worker world.
async function getAllTrips(range: string | undefined): Promise<Trip[] | Error> {
  const query = new Query({
    endpoint: '/trips?select=id,label,slug,start,end',
    range: (range) ? range : undefined,
    single: false,
  })

  return query.run()
    .then((payload) => {
      if (payload instanceof Error) {
        return payload;
      }
      if (payload instanceof Array) {
        return payload.map(t => new Trip(t));
      }

      return Error('500: Unable to process payload');
    });
}

export async function TripIndex(request: ReqWithParams): Promise<Response> {
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
      headers: standardHeaders,
    });
  }

  return new Response(JSON.stringify(trips), {
    status: 200,
    headers: standardHeaders,
  });
}
