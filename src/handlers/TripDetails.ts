import { Trip, TripProps } from '../lib/Trip';
import { ReqWithParams } from '../lib/global';

// @TODO: How to make this everywhere?
const standardHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
});

async function getTrip(id: number): Promise<Trip | Error> {
  // Tell PostgREST that we want a single object, not an array of one.
  const requestHeaders = new Headers();
  requestHeaders.append('Accept', 'application/vnd.pgrst.object+json');

  return fetch(`${DB_ENDPOINT}/trips?id=eq.${id}`, {headers: requestHeaders})
    .then(response => {
      if (response.status == 406) {
        return Error('404: Trip Not Found')
      }
      return response.json();
    })
    .then(payload => {
      return payload as Trip;
    })
    .catch(error => {
      if (error instanceof SyntaxError) {
        return Error('500: JSON Parse Error');
      }

      // @TODO: Record and translate other errors here.
      console.log(error);

      return Error('500: Unknown error in getTrip');
    });
}

export async function TripDetails(request: ReqWithParams): Promise<Response> {
  // @TODO: Validate
  const id = parseInt(request.params.id);

  const trip = await getTrip(id);

  if (trip instanceof Error) {
    const [ code, message ] = trip.message?.split(': ');
    return new Response(JSON.stringify({message: message}), {status: parseInt(code), headers: standardHeaders});
  }

  return new Response(JSON.stringify(trip), {status: 200, headers: standardHeaders});
}
