import { now } from './global';
import { Query } from './Query';

export interface TripProps {
  id?: number | null;
  label: string | null;
  slug: string | null;
  start: number;
  end: number;
  line?: GeoJSON.GeoJSON;
}

export class Trip {
  id: number | null;
  label: string;
  slug: string;
  start: number;
  end: number;
  line: any;

  constructor(props: TripProps) {
    Object.assign(this, props);

    if (!props.id) {
      this.id = null;
    }
  }

  /**
   * TripCreate (which also handles patches) casts the incoming JSON payload
   * as a new Trip instance, gotta make sure we have what the DB would require
   * to actually save it.
   *
   * @returns (bool) Can we save this record?
   */
  validate(): boolean {
    const haveSlug = !!this.slug?.length || false;
    const haveStart = Number.isInteger(this.start);
    const haveEnd = Number.isInteger(this.end);

    return haveSlug && haveStart && haveEnd;
  }

  /**
   * Is this trip over? How long ago did it end?
   * @returns (bool|number) False if going, otherwise hours since this.end.
   */
  isPast(): boolean | number {
    const sinceEnd = now() - this.end;
    return (sinceEnd < 0) ? false : (sinceEnd / 3600);
  }

  async save(): Promise<true | Error> {
    if (!this.validate()) {
      return Error('400: Incomplete trip details.');
    }

    const payload = [
      {
        id: this.id || undefined,
        label: this.label || '',
        slug: this.slug,
        start: this.start,
        end: this.end,
      },
    ];

    const query = new Query({
      endpoint: '/trip_data',
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
