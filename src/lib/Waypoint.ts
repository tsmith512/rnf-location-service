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

  constructor(props: WaypointProps) {
    Object.assign(this, props);
  }

  async geocode() {
    this.admin = 'ADMIN TEXT REPLACED';
    this.city = 'CITY TEXT';
  }
}
