import { Geocoder, GeocoderResponse } from "./Geocoder";

export interface WaypointProps {
  timestamp: number;
  lon: number;
  lat: number;
  point?: string;
  city?: string;
  admin?: string;
}

export class Waypoint {
  timestamp: number;
  lon: number;
  lat: number;
  point?: string;
  city?: string;
  admin?: string;
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
      this.city = results.name;
      // @TODO: I had a plan for "admin" being different than "city"...
      this.admin = results.name;
      this.geocode_results = results;
      return true;
    }

    // @TODO: Save to DB?? Or prepare a batch in WaypointCreate?
  }
}
