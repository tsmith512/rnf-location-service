--
-- PostgreSQL database dump
--

-- Dumped from database version 10.18 (Ubuntu 10.18-0ubuntu0.18.04.1)
-- Dumped by pg_dump version 10.18 (Ubuntu 10.18-0ubuntu0.18.04.1)

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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


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
  SELECT * FROM waypoints
  ORDER BY (abs(timestamp - whattime)) ASC
  LIMIT 1
$$;


SET default_tablespace = '';

SET default_with_oids = false;

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
    NULL::jsonb AS line;


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
    (public.st_asgeojson(public.st_makeline((w.point)::public.geometry ORDER BY w."timestamp")))::jsonb AS line
   FROM (public.trip_data t
     LEFT JOIN public.waypoint_data w ON (((w."timestamp" >= t.start) AND (w."timestamp" <= t."end"))))
  GROUP BY t.id
  ORDER BY t.id;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

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

REVOKE ALL ON TABLE public.spatial_ref_sys FROM postgres;
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


--
-- Name: TABLE waypoint_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.waypoint_data TO admin_requests;
GRANT ALL ON TABLE public.waypoint_data TO rnf;


--
-- PostgreSQL database dump complete
--
