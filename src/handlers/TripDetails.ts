import { Trip, TripProps } from '../lib/Trip';
import { ReqWithParams } from '../lib/global';
import { locationFilter } from '../lib/Filter';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getTrip(id: number): Promise<Trip | Error> {
  // Tell PostgREST that we want a single object, not an array of one.
  const requestHeaders = new Headers();
  requestHeaders.append('Accept', 'application/vnd.pgrst.object+json');

  return fetch(`${DB_ENDPOINT}/trips?id=eq.${id}`, { headers: requestHeaders })
    .then((response) => {
      // Add 502
      if (response.status == 406) {
        throw new Error('404: Trip Not Found');
      }
      return response.json();
    })
    .then((payload) => {
      return new Trip(payload);
    })
    .catch((error) => {
      if (error instanceof SyntaxError) {
        return new Error('500: JSON Parse Error');
      }

      return error;
    });
}

export async function TripDetails(request: ReqWithParams): Promise<Response> {
  const id = parseInt(request.params.id);
  const trip = await getTrip(id);

  if (trip instanceof Error) {
    const [code, message] = trip.message?.split(': ');
    return new Response(JSON.stringify({error: message}), {
      status: parseInt(code) || 500,
      headers: standardHeaders,
    });
  }

  return new Response(JSON.stringify((trip.line) ? locationFilter(trip) : trip), {
    status: 200,
    headers: standardHeaders,
  });
}
