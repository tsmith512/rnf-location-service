export interface QueryProps {
  admin?: boolean;
  endpoint: string;
  range?: string | number | undefined;
  single?: boolean;
  upsert?: boolean;
  delete?: boolean;
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

    if (props.delete === true) {
      this.method = 'DELETE';
    } else {
      this.method = props.body ? 'POST' : 'GET';
    }

    // @TODO: Uhhhh this feels a little informal.
    if (props.admin) {
      this.reqHeaders.append('Authorization', `Bearer ${DB_ADMIN_JWT}`);
    }

    if (props.body) {
      this.body = JSON.stringify(props.body) || undefined;
      this.reqHeaders.append('Content-Type', 'application/json;charset=UTF-8');
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

    if (props.upsert) {
      this.reqHeaders.append(
        'Prefer',
        'resolution=merge-duplicates,return=representation'
      );
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
          case 400:
            throw new Error('400: Bad request sent to server');
          case 401:
            throw new Error('403: Unauthorized by database');
          case 404:
            throw new Error('404: Database error');
          case 406:
            throw new Error('404: Record not found');
          case 409:
            throw new Error('409: Unresolved conflict in database');
          case 500:
            throw new Error(
              '500: Unexpected database server error -- ' + JSON.stringify(response)
            );
          case 502:
            throw new Error('502: Bad Gateway, probably to PostgREST');
          case 204:
            return '';
          default:
            return response.text();
        }
      })
      .then((text) => {
        // Rather than response.json() directly, hook in here with .text()
        // for debugging. Cloudflare Firewall errors come back as text.
        if (text.length) {
          return JSON.parse(text);
        } else {
          return { success: true };
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
