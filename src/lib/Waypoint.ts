import { Geocoder, GeocoderResponse } from './Geocoder';
import { now } from './global';
import { Query } from './Query';

export interface WaypointProps {
  timestamp: number;
  lon: number;
  lat: number;
  point?: string;
  label?: string;
  state?: string;
  country?: string;
  geocode_attempts?: number;
}

export class Waypoint {
  timestamp: number;
  lon: number;
  lat: number;
  point?: string;
  label?: string;
  state?: string;
  country?: string;
  geocode_attempts: number;
  geocode_results: GeocoderResponse;

  constructor(props: WaypointProps) {
    Object.assign(this, props);

    if (!props.geocode_attempts) {
      this.geocode_attempts = 0;
    }
  }

  /**
   * Is this waypoint in the past? How long ago did it end? Mostly for pairity
   * with the Trip class so they both have the same model for use in cacing.
   *
   * @returns (bool|number) False if going, otherwise hours since this.end.
   */
  isPast(): boolean | number {
    const ago = now() - this.timestamp;
    return ago < 0 ? false : ago / 3600;
  }

  async geocode(): Promise<boolean> {
    this.geocode_attempts++;
    const geocoder = new Geocoder({ lon: this.lon, lat: this.lat });
    const results = await geocoder.update();

    if (results instanceof Error) {
      return false;
    } else {
      this.label = results.label;
      this.state = results.state;
      this.country = results.country;
      this.geocode_results = results;
      return true;
    }
  }

  async save(): Promise<true | Error> {
    const payload = [
      {
        timestamp: this.timestamp,
        point: `POINT(${this.lon} ${this.lat})`,
        label: this.label || null,
        state: this.state || null,
        country: this.country || null,
        geocode_attempts: this.geocode_attempts || 0,
        geocode_results: this.geocode_results || null,
      },
    ];

    const query = new Query({
      endpoint: '/waypoint_data',
      admin: true,
      single: true,
      upsert: true,
      body: payload,
    });

    return query.run().then((payload) => {
      if (payload instanceof Error) {
        return payload;
      }

      try {
        Object.assign(this, payload);
        return true;
      } catch {
        return Error('500: Unable to process payload');
      }
    });
  }
}

// @TODO: What can be combined here with Waypoint::save() because this is
// basically the same thing... except this one doesn't update the props on the
// Waypoint objects because we don't necessarily know what order they'll come
// back in
export async function waypointBulkSave(waypoints: Waypoint[]): Promise<number | Error> {
  const payload = [];

  for (const waypoint of waypoints) {
    payload.push({
      timestamp: waypoint.timestamp,
      point: `POINT(${waypoint.lon} ${waypoint.lat})`,
      label: waypoint.label || null,
      state: waypoint.state || null,
      country: waypoint.country || null,
      geocode_attempts: waypoint.geocode_attempts || 0,
      geocode_results: waypoint.geocode_results || null,
    });
  }

  const query = new Query({
    endpoint: '/waypoint_data',
    admin: true,
    upsert: true,
    body: payload,
  });

  return query.run().then((payload) => {
    if (payload instanceof Error) {
      return payload;
    } else if (payload instanceof Array) {
      return payload.length;
    }

    // @TODO: We might have a valid JSON payload from the server which
    // includes a database error or some weirdness.
    return 0;
  });
}
