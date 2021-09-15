export interface QueryProps {
  range?: string | number | undefined;
  endpoint: string;
  single: boolean;
  body?: object;
}

export class Query {
  endpoint: string;
  provide: string;
  reqHeaders: Headers;
  method: string;
  body?: string;

  constructor(props: QueryProps) {
    this.reqHeaders = new Headers();
    this.endpoint = DB_ENDPOINT + props.endpoint;
    this.method = (props.body) ? 'POST' : 'GET';

    if (props.body) {
      this.body = JSON.stringify(props.body) || undefined;
      this.reqHeaders.append('Content-Type', 'application/json;charset=UTF-8')
    }

    if (typeof props.range == 'string') {
      this.reqHeaders.append('Range', props.range);
    } else if (typeof props.range == 'number') {
      if (this.endpoint.indexOf('?') === -1) {
        this.endpoint += '?';
      }

      this.endpoint += `&limit=${props.range}`;
    }

    if (props.single) {
      this.reqHeaders.append('Accept', 'application/vnd.pgrst.object+json');
    }
  }

  async run(): Promise<JSON | Error> {
    return fetch(this.endpoint, {
      headers: this.reqHeaders,
      method: this.method,
      body: this.body,
    })
      .then((response) => {
        switch (response.status) {
          case 404:
            throw new Error('404: Database error');
          case 406:
            throw new Error('404: Record not found');
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
