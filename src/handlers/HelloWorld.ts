export async function HelloWorld(request: Request): Promise<Response> {
  return new Response(
    `Hello World. Incoming request method: ${request.method}`
  );
}
