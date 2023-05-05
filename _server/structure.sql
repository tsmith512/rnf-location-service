--
-- PostgreSQL database dump
--

-- Dumped from database version 10.21 (Debian 10.21-1.pgdg90+1)
-- Dumped by pg_dump version 14.7 (Ubuntu 14.7-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: waypoints; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.waypoints AS
SELECT
    NULL::integer AS "timestamp",
    NULL::double precision AS lon,
    NULL::double precision AS lat,
    NULL::text AS label,
    NULL::text AS state,
    NULL::text AS country,
    NULL::integer AS geocode_attempts,
    NULL::integer[] AS trips;


--
-- Name: waypoint_by_time(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.waypoint_by_time(whattime integer) RETURNS public.waypoints
    LANGUAGE sql
    AS $$
SELECT waypoints.* FROM waypoints
LEFT OUTER JOIN trips ON trips.id = ANY(waypoints.trips)
WHERE trips.start < whattime AND whattime < trips.end
ORDER BY (abs(timestamp - whattime)) ASC LIMIT 1
$$;


--
-- Name: waypoints_pending_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.waypoints_pending_count() RETURNS integer
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN (SELECT COUNT(*) AS c FROM waypoint_data WHERE geocode_attempts = 0); END; $$;


SET default_tablespace = '';

--
-- Name: trip_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_data (
    id integer NOT NULL,
    label text,
    slug character varying(50) NOT NULL,
    start integer NOT NULL,
    "end" integer NOT NULL
);


--
-- Name: trips; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.trips AS
SELECT
    NULL::integer AS id,
    NULL::text AS label,
    NULL::character varying(50) AS slug,
    NULL::integer AS start,
    NULL::integer AS "end",
    NULL::jsonb AS line,
    NULL::public.box2d AS boundaries;


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trip_data.id;


--
-- Name: waypoint_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waypoint_data (
    "timestamp" integer DEFAULT date_part('epoch'::text, CURRENT_TIMESTAMP) NOT NULL,
    point public.geography NOT NULL,
    label text,
    state text,
    country text,
    geocode_attempts integer,
    geocode_results json
);


--
-- Name: waypoints_all; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.waypoints_all AS
 SELECT waypoint_data."timestamp",
    public.st_x((waypoint_data.point)::public.geometry) AS lon,
    public.st_y((waypoint_data.point)::public.geometry) AS lat,
    waypoint_data.label,
    waypoint_data.state,
    waypoint_data.country,
    waypoint_data.geocode_attempts
   FROM public.waypoint_data
  ORDER BY waypoint_data."timestamp" DESC;


--
-- Name: trip_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_data ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: trip_data trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_data
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: waypoint_data waypoint_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waypoint_data
    ADD CONSTRAINT waypoint_data_pkey PRIMARY KEY ("timestamp");


--
-- Name: waypoints _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.waypoints AS
 SELECT w."timestamp",
    public.st_x((w.point)::public.geometry) AS lon,
    public.st_y((w.point)::public.geometry) AS lat,
    w.label,
    w.state,
    w.country,
    w.geocode_attempts,
    array_agg(t.id) AS trips
   FROM (public.waypoint_data w
     LEFT JOIN public.trips t ON (((w."timestamp" >= t.start) AND (w."timestamp" <= t."end"))))
  WHERE (t.id IS NOT NULL)
  GROUP BY w."timestamp"
  ORDER BY w."timestamp" DESC;


--
-- Name: trips _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.trips AS
 SELECT t.id,
    t.label,
    t.slug,
    t.start,
    t."end",
    (public.st_asgeojson(public.st_makeline((w.point)::public.geometry ORDER BY w."timestamp")))::jsonb AS line,
    public.st_extent((w.point)::public.geometry) AS boundaries
   FROM (public.trip_data t
     LEFT JOIN public.waypoint_data w ON (((w."timestamp" >= t.start) AND (w."timestamp" <= t."end"))))
  GROUP BY t.id
  ORDER BY t.id;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM pgrnf;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO web_requests;
GRANT USAGE ON SCHEMA public TO admin_requests;


--
-- Name: TABLE waypoints; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.waypoints TO web_requests;
GRANT SELECT ON TABLE public.waypoints TO admin_requests;
GRANT ALL ON TABLE public.waypoints TO rnf;


--
-- Name: TABLE geography_columns; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.geography_columns TO rnf;


--
-- Name: TABLE geometry_columns; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.geometry_columns TO rnf;


--
-- Name: TABLE raster_columns; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.raster_columns TO rnf;


--
-- Name: TABLE raster_overviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.raster_overviews TO rnf;


--
-- Name: TABLE spatial_ref_sys; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.spatial_ref_sys TO rnf;


--
-- Name: TABLE trip_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.trip_data TO admin_requests;
GRANT ALL ON TABLE public.trip_data TO rnf;


--
-- Name: TABLE trips; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.trips TO web_requests;
GRANT SELECT ON TABLE public.trips TO admin_requests;
GRANT ALL ON TABLE public.trips TO rnf;


--
-- Name: SEQUENCE trips_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.trips_id_seq TO admin_requests;
GRANT ALL ON SEQUENCE public.trips_id_seq TO rnf;


--
-- Name: TABLE waypoint_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.waypoint_data TO admin_requests;
GRANT ALL ON TABLE public.waypoint_data TO rnf;


--
-- Name: TABLE waypoints_all; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.waypoints_all TO admin_requests;


--
-- PostgreSQL database dump complete
--

