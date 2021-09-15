export interface QueryProps {
  range?: string | number | undefined;
  endpoint: string;
  single: boolean;
}

export class Query {
  endpoint: string;
  provide: string;
  reqHeaders: Headers;

  constructor(props: QueryProps) {
    this.reqHeaders = new Headers();
    this.endpoint = DB_ENDPOINT + props.endpoint;

    if (typeof props.range == 'string') {
      this.reqHeaders.append('Range', props.range);
    } else if (typeof props.range == 'number') {
      this.endpoint += `&limit=${props.range}`;
    }

    if (props.single) {
      this.reqHeaders.append('Accept', 'application/vnd.pgrst.object+json');
    }
  }

  async run(): Promise<JSON | Error> {
    return fetch(this.endpoint, {
      headers: this.reqHeaders
    })
      .then((response) => {
        switch (response.status) {
          case 502:
            throw new Error('502: Bad Gateway, probably to PostgREST');
          default:
            return response.json();
        }
      })
      .catch((error) => {
        if (error instanceof SyntaxError) {
          return Error('500: JSON Parse Error');
        }

        // @TODO: Record and translate other errors here.
        return error;
      });
  }
}
