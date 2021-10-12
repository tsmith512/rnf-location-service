import { Trip, TripProps } from '../lib/Trip';
import {
  cacheControlByObject,
  cacheHeaders,
  now,
  RNFRequest,
  standardHeaders,
} from '../lib/global';
import { locationFilter } from '../lib/Filter';
import { Query } from '../lib/Query';

async function getTrip(id: number): Promise<Trip | Error> {
  const query = new Query({
    endpoint: `/trips?id=eq.${id}`,
    single: true,
  });

  return query.run().then((payload) => {
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

export async function TripDetails(request: RNFRequest): Promise<Response> {
  const id = parseInt(request.params.id);
  const trip = await getTrip(id);

  if (trip instanceof Error) {
    const [code, message] = trip.message?.split(': ');
    return new Response(JSON.stringify({ error: message }), {
      status: parseInt(code) || 500,
      headers: standardHeaders,
    });
  }

  const cacheHours = cacheControlByObject(trip);

  if (request.auth === 'ADMIN') {
    return new Response(JSON.stringify(trip), {
      status: 200,
      headers: cacheHeaders(cacheHours, request),
    });
  } else {
    return new Response(JSON.stringify(trip.line ? locationFilter(trip) : trip), {
      status: 200,
      headers: cacheHeaders(cacheHours, request),
    });
  }
}
