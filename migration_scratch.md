# Migration Notes

Transforms and queries for the v1-MySQL to v2-PostgreSQL

## v1 dump to new columns

``` sql

SELECT
id,
`time` AS 'timestamp',
CONCAT("POINT(", lon, " ", lat, ")") AS `point`,
city,
full_city AS admin,
geocode_attempts
FROM location_history;

SELECT
id,
label,
machine_name AS 'slug',
`starttime` AS 'start',
`endtime` AS 'end'
FROM trips;

```

Notes:

- Remove the quotes that MySQL is gonna put in that `timestamp` column; that is an expresstion for psql to evaluate
- geocode_raw_response in v1 is stored as a PHP serialized associative array from a different library, so that's gonna have to go.
- I want to change `full_city` because it doesn't work well for rural locations. Recode everything?
- **Warning** `to_timestamp` returns `timestamp WITH time zone` which is not the logic I'm working on. Server time is UTC

## v2 Queries

Grabs a timestamp as unix and coordinate pairs as floats

``` sql

SELECT EXTRACT(EPOCH FROM timestamp) as "timestamp", ST_X(point::geometry) AS "lon", ST_Y(point::geometry) AS "lat" FROM public.waypoints LIMIT 100;

```

For `/waypoint/latest`

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
ORDER BY timestamp ASC
LIMIT 1;

```

For `/waypoint/{time}`

Except that this is kinda shitty for a number of reasons.

``` sql

SELECT *,
abs(timestamp - 1598733000) AS diff,
to_timestamp(timestamp)
FROM waypoints
ORDER BY diff
LIMIT 1;

```

Make a view from that first example and then the first endpoint can `LIMIT 1` on it and the other can select the lowest `abs()` value. Right...?

Also if the view requires a matching trip, then the middleware doesn't have to do it.

Rename that table to `waypoint_data` so the interface can hit the view called `waypoints`

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

```

## Random Stuff

Well this makes a GeoJSON line

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

Would probably only want to grab one at a time.
