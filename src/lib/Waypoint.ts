import { Geocoder, GeocoderResponse } from "./Geocoder";

export interface WaypointProps {
  timestamp: number;
  lon: number;
  lat: number;
  point?: string;
  label?: string;
  state?: string;
  country?: string;
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
    this.geocode_attempts = 0;
  }

  async geocode() {
    this.geocode_attempts++;
    const geocoder = new Geocoder({lon: this.lon, lat: this.lat});
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

    // @TODO: Save to DB?? Or prepare a batch in WaypointCreate?
  }

  async save() {
    const requestHeaders = new Headers({
      'Authorization': `Bearer ${DB_ADMIN_JWT}`,
      'Prefer': 'resolution=merge-duplicates,return=representation',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.pgrst.object+json',
    });

    const payload = [{
      timestamp: this.timestamp,
      point: `POINT(${this.lon} ${this.lat})`,
      label: this.label || null,
      state: this.state || null,
      country: this.country || null,
      geocode_attempts: this.geocode_attempts || 0,
      geocode_results: this.geocode_results || null,
    }];

    console.log(JSON.stringify(payload));

    return fetch(`${DB_ENDPOINT}/waypoint_data`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.status == 400) {
          // We sent shit to the database...
          return Error('500: Bad request sent to server')
        }
        if (response.status == 401) {
          return Error('401: Unauthorized by Database');
        } else if (response.status == 409) {
          // We merge duplicates on primary key, so this shouldn't happen?
          return Error('409: Conflict from Database');
        } else if (response.status == 200 || response.status == 201) {
          return response.json();
        } else {
          return Error('500: Unknown Error: ' + JSON.stringify(response));
        }
      })
      .then((payload) => {
        // @TODO: We might have a valid JSON payload from the server which
        // includes a database error or some weirdness
        Object.assign(this, payload);
        return true;
      })
      .catch((error) => {
        if (error instanceof SyntaxError) {
          return Error('500: JSON Parse Error');
        }

        console.log(error.message);
        return false;
      });
  }
}
