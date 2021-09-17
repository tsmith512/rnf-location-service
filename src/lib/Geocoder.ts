export interface GeocoderProps {
  lon: number;
  lat: number;
}

export interface AddressComponentPiece {
  long: string;
  short: string;
}

export interface AddressComponentStack {
  street_address?: AddressComponentPiece;
  route?: AddressComponentPiece;
  country?: AddressComponentPiece;
  administrative_area_level_1?: AddressComponentPiece;
  administrative_area_level_2?: AddressComponentPiece;
  administrative_area_level_3?: AddressComponentPiece;
  locality?: AddressComponentPiece;
  neighborhood?: AddressComponentPiece;
}

export interface GeocoderResponse {
  label?: string;
  state?: string;
  country?: string;
  components: AddressComponentStack;
}

export class Geocoder {
  lon: number;
  lat: number;

  constructor(props: GeocoderProps) {
    Object.assign(this, props);
  }

  async update(): Promise<GeocoderResponse | Error> {
    const results = await this.fetchReverseGeo();

    if (results instanceof Error) {
      // Uhhhh?
      return Error('500: fetchReverseGeo threw an error');
    }

    // This will be a GeocoderResponse with a full street address.
    const addressPieces = this.readRevGeo(results);

    if (addressPieces instanceof Error) {
      return Error('500: readRevGeo failed to parse the geocoded response')
    }

    // Let's make a better "City, ST, C" or "State, C" kinda name
    const locationName = this.buildLocationName(addressPieces);

    addressPieces.label = locationName;

    return addressPieces;
  }

  async fetchReverseGeo(): Promise<Object | Error> {
    return fetch(`${GMAPS_API_ENDPOINT}?latlng=${this.lat},${this.lon}&key=${GMAPS_API_KEY}`)
      .then((response) => {
        return response.json();
      })
      .then((payload) => {
        return payload;
      })
      .catch((error) => {
        if (error instanceof SyntaxError) {
          return Error('500: JSON Parse Error');
        }

        return Error('500: Unknown error in Reverse Geocode Request')
      });
  }

  readRevGeo(payload: any): GeocoderResponse | Error {
    if (payload.status !== 'OK') {
      return Error('500: Bad Google Maps API Payload');
    }

    if (payload.results.length < 1) {
      return Error('404: No reverse geocoder results');
    }

    const pieces = this.readComponents(payload.results[0].address_components);
    const address = payload.results[0].formatted_address || undefined;

    return {
      label: address,
      state: pieces.administrative_area_level_1?.long,
      country: pieces.country?.long,
      components: pieces,
    };
  }

  readComponents(components: Array<any>): AddressComponentStack {
    const processedComponents: any = {};
    components.forEach((e) => {
      const componentType = e.types[0];
      processedComponents[componentType] = {
        short: e.short_name,
        long: e.long_name,
      };
    });

    return processedComponents;
  }

  buildLocationName(input: GeocoderResponse): string {
    const output = [];

    const pieces = input.components;

    // country
    if (pieces.country && pieces.country.short !== 'US') {
      if (pieces.administrative_area_level_1) {
        output.push(pieces.country.short);
      } else {
        output.push(pieces.country.long);
      }
    }

    // administrative_area_level_1 -- usually a State or Province
    if (pieces.administrative_area_level_1) {
      if (pieces.administrative_area_level_2 || pieces.locality) {
        output.push(pieces.administrative_area_level_1.short)
      } else {
        output.push(pieces.administrative_area_level_1.long)
      }
    }

    // administrative_area_level_2 -- usually a County
    if (!pieces.locality && pieces.administrative_area_level_2) {
      output.push(pieces.administrative_area_level_2.long);
    }

    // locality -- usually a City
    if (pieces.locality) {
      output.push(pieces.locality.long);
    }

    // neighborhood -- not always useful? not usually provided?

    return output.reverse().join(', ');
  }
}
