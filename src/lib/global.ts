/**
 * So between the Request that CF passes to the Worker and what itty-router
 * does, which appears to slap a few properties onto that, I am not sure what
 * `type` to use for Requests in this context. So I'm creating this one with known properties.
 */
export interface RNFRequest extends Request {
  params?: any;
  auth?: string | null;
}
