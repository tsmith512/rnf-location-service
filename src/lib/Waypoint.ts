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
}
