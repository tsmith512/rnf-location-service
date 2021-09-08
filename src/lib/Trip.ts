export interface TripProps {
  id?: number | boolean;
  label: string | null;
  slug: string | null;
  start: number;
  end: number;
  line?: GeoJSON.GeoJSON;
}

export class Trip {
  id: number | boolean;
  label: string;
  slug: string;
  start: number;
  end: number;
  line: any;

  constructor(props: TripProps) {
    Object.assign(this, props);
  }
}
