import { Trip, TripProps } from "../lib/Trip";
import { RNFRequest, standardHeaders } from "../lib/global";

export async function TripCreate(request: RNFRequest): Promise<Response> {
  const payload = await request.json().catch(e => {
    return new Response(JSON.stringify({ "message": e.message }), {
      status: 400,
      headers: standardHeaders,
    });
  });

  const trip = new Trip(payload as unknown as TripProps);

  if (!trip.validate()) {
    return new Response(JSON.stringify({ message: 'Bad trip input'}), {
      status: 400,
      headers: standardHeaders
    });
  }

  const save = await trip.save();

  if (save instanceof Error) {
    return new Response(JSON.stringify({message: save.message}), {
      status: 500,
      headers: standardHeaders,
    });
  }

  return new Response(JSON.stringify(trip), {
    status: 201,
    headers: standardHeaders,
  });
}
