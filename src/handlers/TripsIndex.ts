import { Trip, TripProps } from '../lib/Trip';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

// NB: fetch() requires either a Host header or to fetch by hostname, not IP.
// Also NB: random IP:Port combos not allowed. Must connect to a standard HTTP(S)
// port on a named host in Cloudflare Worker world.
async function getAllTrips(range: string | null): Promise<Trip[] | Error> {
  const requestHeaders = new Headers();
  if (range) { requestHeaders.append('Range', range); }

  return fetch(`${DB_ENDPOINT}/trips?select=id,label,slug,start,end`, {headers: requestHeaders})
    .then(response => response.json())
    .then(payload => {
      return payload as Trip[];
    })
    .catch(error => {
      if (error instanceof SyntaxError) {
        return Error("JSON Parse Error");
      }

      // @TODO: Record and translate other errors here.
      console.log(error);

      return Error("Unknown error in getAllTrips");
    });
}

export async function TripsIndex(request: Request): Promise<Response> {
  // @TODO: Validate
  const range = request.headers.get('Range');

  const trips = await getAllTrips(range);

  if (trips instanceof Error) {
    return new Response(JSON.stringify({message: trips.message}), {status: 500, headers: standardHeaders});
  }

  if (!trips.length) {
    return new Response(JSON.stringify({message: "No trips available in this range"}), {status: 416, headers: standardHeaders});
  }

  return new Response(JSON.stringify(trips), {status: 200, headers: standardHeaders});
}
