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
-- Name: rnf_staging; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE rnf_staging WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'C.UTF-8' LC_CTYPE = 'C.UTF-8';


\connect rnf_staging

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
    NULL::text AS city,
    NULL::text AS admin,
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
    id integer NOT NULL,
    "timestamp" integer DEFAULT date_part('epoch'::text, CURRENT_TIMESTAMP) NOT NULL,
    point public.geography NOT NULL,
    city text,
    admin text,
    geocode_attempts integer,
    geocode_raw_response json
);


--
-- Name: waypoints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.waypoints_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: waypoints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.waypoints_id_seq OWNED BY public.waypoint_data.id;


--
-- Name: trip_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_data ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: waypoint_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waypoint_data ALTER COLUMN id SET DEFAULT nextval('public.waypoints_id_seq'::regclass);


--
-- Name: trip_data trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_data
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: waypoint_data waypoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waypoint_data
    ADD CONSTRAINT waypoints_pkey PRIMARY KEY (id);


--
-- Name: waypoints _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.waypoints AS
 SELECT w."timestamp",
    public.st_x((w.point)::public.geometry) AS lon,
    public.st_y((w.point)::public.geometry) AS lat,
    w.city,
    w.admin,
    array_agg(t.id) AS trips
   FROM (public.waypoint_data w
     LEFT JOIN public.trip_data t ON (((w."timestamp" >= t.start) AND (w."timestamp" <= t."end"))))
  WHERE (t.id IS NOT NULL)
  GROUP BY w.id
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
  GROUP BY t.id;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO web_requests;


--
-- Name: TABLE waypoints; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.waypoints TO web_requests;


--
-- Name: FUNCTION waypoint_by_time(whattime integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.waypoint_by_time(whattime integer) TO web_requests;


--
-- Name: TABLE spatial_ref_sys; Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON TABLE public.spatial_ref_sys FROM postgres;
REVOKE SELECT ON TABLE public.spatial_ref_sys FROM PUBLIC;
GRANT ALL ON TABLE public.spatial_ref_sys TO rnf;
GRANT SELECT ON TABLE public.spatial_ref_sys TO PUBLIC;


--
-- Name: TABLE trips; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.trips TO web_requests;


--
-- PostgreSQL database dump complete
--

