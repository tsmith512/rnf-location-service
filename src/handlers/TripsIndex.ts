import { Trip, TripProps } from '../lib/Trip';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});


// NB: fetch() requires either a Host header or to fetch by hostname, not IP.
// Also NB: random IP:Port combos not allowed. Must connect to a standard HTTP(S)
// port on a named host in Cloudflare Worker world.
async function getAllTrips(): Promise<Trip[]> {
  return fetch(`${DB_ENDPOINT}/trips?select=id,label,slug,start,end`)
    .then(response => response.json())
    .then(payload => {
      return payload as Trip[];
    });
}

export async function TripsIndex(request: Request): Promise<Response> {
  const trips = await getAllTrips();

  console.log(trips);

  return new Response(JSON.stringify(trips), {headers: standardHeaders});
}
