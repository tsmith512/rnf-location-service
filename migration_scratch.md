# Migration Notes

Transforms and queries for the v1-MySQL to v2-PostgreSQL

## v1 dump to new columns

``` sql

SELECT
id,
CONCAT("to_timestamp(", `time`, ")") AS 'timestamp',
CONCAT("POINT(", lon, " ", lat, ")") AS `point`,
city,
full_city AS admin,
geocode_attempts,
NULL AS geocode_raw_response
FROM location_history;

```

Notes:

- Remove the quotes that MySQL is gonna put in that `timestamp` column; that is an expresstion for psql to evaluate
- geocode_raw_response in v1 is stored as a PHP serialized associative array from a different library, so that's gonna have to go.
- I want to change `full_city` because it doesn't work well for rural locations. Recode everything?

## v2 Queries

Grabs a timestamp as unix and coordinate pairs as floats

``` sql

SELECT EXTRACT(EPOCH FROM timestamp) as "timestamp", ST_X(point::geometry) AS "lon", ST_Y(point::geometry) AS "lat" FROM public.waypoints LIMIT 100;

```

For `/waypoint/latest`

``` sql

SELECT
  EXTRACT(EPOCH FROM timestamp) AS "timestamp",
  ST_X(point::geometry) AS "lon",
  ST_Y(point::geometry) AS "lat",
  city,
  admin,
  'TODO' as "trips"
FROM public.waypoints
ORDER BY timestamp DESC
LIMIT 1;

```
