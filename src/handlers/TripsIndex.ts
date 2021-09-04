import { Trip, TripProps } from '../lib/Trip';

function getAllTrips(): Promise<Trip[]> {
  return fetch('${DB_ENDPOINT}/trips?select=id,label,slug,start,end')
    .then(response => response.json())
    .then(payload => {
      return payload as Trip[];
    });
}

export async function TripsIndex(request: Request): Promise<Response> {
  const trips = await getAllTrips();

  console.log(trips);

  return new Response(JSON.stringify(trips));
}
