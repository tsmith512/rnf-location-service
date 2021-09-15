import { Trip, TripProps } from '../lib/Trip';
import { ReqWithParams } from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getTrip(id: number): Promise<Trip | Error> {
  const query = new Query({
    endpoint: `/trips?id=eq.${id}`,
    single: true
  });

  return query.run()
    .then((payload) => {
      if (payload instanceof Error) {
        return payload;
      }

      try {
        return new Trip(payload as unknown as TripProps);
      } catch {
        return Error('500: Unable to process payload');
      }
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
