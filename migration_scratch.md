# Migration Notes

Transforms and queries for the v1-MySQL to v2-PostgreSQL

## v1 dump to new columns

``` sql

-- For waypoint_data

SELECT
id,
`time` AS 'timestamp',
CONCAT("POINT(", lon, " ", lat, ")") AS `point`,
city,
full_city AS admin,
geocode_attempts
FROM location_history;

-- For trip_data

SELECT
id,
label,
machine_name AS 'slug',
`starttime` AS 'start',
`endtime` AS 'end'
FROM trips;

```

Notes:

- Remove the quotes that MySQL is gonna put in that `timestamp` column; that is an expression for psql to evaluate
- geocode_raw_response in v1 is stored as a PHP serialized associative array from a different library, just dump it
- I want to change `full_city` because it doesn't work well for rural locations. Recode everything? (Also decided to rename that to `admin` which is a little keyed to Google Maps Reverse Geocode API but whatever)
- Warning: `to_timestamp` returns `timestamp WITH time zone` which is not the logic I'm working on. Server time is UTC. I'm doing it with epoch timestamps as numbers, sue me.

## v2 App-related Queries

### Creating Database Rows

#### Create Waypoint `POST /waypoint`

?

#### CRUD Trip

(That's going to be manual psql for a minute because I'm cool like that.)

### Fetching Data

Create a view that describes waypoints and trips to match API docs. Requiring a `trip_data.id` on `waypoints` eliminates that security requirement in the middleware. Adding a GeoJSON aggregate of waypoints on `trips.line` is super convenient and a lot faster here.

``` sql

CREATE OR REPLACE VIEW waypoints
  AS SELECT
    w.timestamp,
    ST_X(w.point::geometry) AS lon,
    ST_Y(w.point::geometry) AS lat,
    w.city,
    w."admin",
    array_agg(t.id) AS trips
  FROM waypoint_data w
    LEFT JOIN trips t ON w.timestamp BETWEEN t.start AND t.end
  WHERE t.id IS NOT NULL
  GROUP BY w.id
  ORDER BY timestamp DESC

CREATE OR REPLACE VIEW trips
  AS SELECT t.*,
    ST_AsGeoJSON(ST_MakeLine(w.point::geometry ORDER BY timestamp))::jsonb AS line
  FROM trip_data t
  LEFT JOIN waypoint_data w
  ON w.timestamp between t.start and t.end
  GROUP BY t.id

```

#### ✅ For `GET /waypoint/latest`

``` sql

SELECT * FROM waypoints LIMIT 1;

```

Middleware to PostgREST:

- `GET /waypoints?limit=1`

#### ✅ For `GET /waypoint/{time}`

``` sql

-- Turn the query below into a function for PostgREST reasons

CREATE OR REPLACE FUNCTION waypoint_by_time(whattime int)
RETURNS waypoints AS $$
  SELECT * FROM waypoints
  ORDER BY (abs(timestamp - whattime)) ASC
  LIMIT 1
$$ LANGUAGE SQL

-- Then

SELECT * FROM waypoint_by_time(1625460412);

```

Middleware to PostgREST:

- `POST /rpc/waypoint_by_time`
- with body `{"whattime":1625460412}`
- To avoid an array of 1, use `Accept: application/vnd.pgrst.object+json`

#### ✅ For `GET /trips`

This view includes that geojson aggregate. The trip index maybe should just query on trip_data directly, but it doesn't get called often.

``` sql

SELECT id, label, slug, "start", "end" FROM trips;

```

Middleware to PostgREST:

- `GET /trips?select=id,label,slug,start,end`

#### ✅ For `GET /trips/{id}`

``` sql

SELECT * FROM trips WHERE id = {id}

```

Middleware to PostgREST:

- `GET /trips?id=eq.25`
- To avoid an array of 1, use `Accept: application/vnd.pgrst.object+json`

---

## Scratchwork

Grabs a timestamp as unix and coordinate pairs as floats

``` sql

SELECT
  EXTRACT(EPOCH FROM timestamp) as "timestamp",
  ST_X(point::geometry) AS "lon",
  ST_Y(point::geometry) AS "lat"
FROM public.waypoints LIMIT 100;

```

**Latest waypoint:** Grabs the newest waypoint and formats it like the waypoint object defiend in the middleware API. `array_agg` removes the need for a subsequent fetch.

``` sql

SELECT
  waypoints.timestamp,
  ST_X(waypoints.point::geometry) AS "lon",
  ST_Y(waypoints.point::geometry) AS "lat",
  waypoints.city,
  waypoints."admin",
  array_agg(trips.id) as "trips"
FROM waypoints
  LEFT JOIN trips ON waypoints.timestamp BETWEEN trips.start AND trips.end
GROUP BY waypoints.id
ORDER BY timestamp DESC
LIMIT 1;

```

**Getting waypoint for a particular time:** Except that this is kinda shitty for a number of reasons.

``` sql

SELECT *,
abs(timestamp - 1598733000) AS diff,
to_timestamp(timestamp)
FROM waypoints
ORDER BY diff
LIMIT 1;

-- With the view and using timestamps as numbers, this is better.

SELECT * FROM waypoints
ORDER BY (abs(timestamp - 1625460412)) ASC
LIMIT 1; 

```

**Idea:** Make a view from that first example that doesn't have the limit. Query that with a limit for latest; select the lowest `abs()` value for time-nearst. Right...?

Also if the view requires a matching trip, then the middleware doesn't have to do it! (require trip.id not null)

Rename that table to `waypoint_data` so the interface can hit the view called `waypoints`

---

Well this makes a GeoJSON line and that's awesome

``` sql

SELECT ST_AsGeoJSON(ST_MakeLine(waypoints.point::geometry ORDER BY timestamp))::jsonb as line
FROM waypoints;

```

And this would aggregate a GeoJSON line for the trip

``` sql

SELECT trips.*, ST_AsGeoJSON(ST_MakeLine(waypoints.point::geometry ORDER BY timestamp))::jsonb AS line
FROM trips
LEFT JOIN waypoints
ON waypoints.timestamp between trips.start and trips.end
GROUP BY trips.id

```

Would probably only want to grab one at a time, that's probably expensive

