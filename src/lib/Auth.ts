// So here's a thing that should really be more sophisticated but Tasker can't
// really accommodate an auth header that isn't HTTP Basic auth. And over HTTPS
// it'll be fine.

import { RNFRequest } from "./global";

// Adapted from dommmel/cloudflare-workers-basic-auth

interface credentials {
  username: string;
  password: string;
}


/**
 * RegExp for basic auth credentials
 *
 * credentials = auth-scheme 1*SP token68
 * auth-scheme = "Basic" ; case insensitive
 * token68     = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
 */

const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;

 /**
  * RegExp for basic auth user/pass
  *
  * user-pass   = userid ":" password
  * userid      = *<TEXT excluding ":">
  * password    = *TEXT
  */

const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

/**
 * Parse basic auth to object.
 */
const parseAuth = (input: string): credentials | false => {

  const payload = CREDENTIALS_REGEXP.exec(input);

  if (!payload) {
    return false;
  }

  const creds = USER_PASS_REGEXP.exec(atob(payload[1]));

  if (!creds) {
    return false;
  }

  // return credentials object
  return {
    username: creds[1],
    password: creds[2]
  };
}

/**
 * Short and sweet. Either the API is serving me (phone or admin view) or it's a
 * public web request. May add different roles in the future.
 *
 * @param user (credentials) a credentials pair from the Authorization header
 * @returns (bool) am I me?
 */
const isAdmin = (user: credentials): boolean =>
  (user.username == API_ADMIN_USER && user.password == API_ADMIN_PASS);

/**
 * Middleware to add an auth property to the RNFRequest that'll get passed to
 * other handler. No return value, per itty-router middelware spec.
 *
 * @param request
 */
export function authCheck(request: RNFRequest) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader) {
    const credentials = parseAuth(authHeader);

    if (credentials) {
      request.auth = isAdmin(credentials) ? 'ADMIN' : 'PUBLIC';
    }
  }
}
