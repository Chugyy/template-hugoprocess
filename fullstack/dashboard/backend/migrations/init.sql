--
-- PostgreSQL Database Migration - Schema Initialization
-- Source: personal_dashboard (local)
-- Destination: dashboard-personnel-db (production)
-- Generated: 2025-10-18
--

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

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: users (root table)
CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    password_hash character varying DEFAULT ''::character varying NOT NULL,
    first_name text DEFAULT ''::text,
    last_name text DEFAULT ''::text,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Table: contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company character varying(255) NOT NULL,
    contact_name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    status character varying(50) DEFAULT 'active'::character varying,
    source character varying(100),
    deal_value numeric(12,2),
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_contact_date timestamp without time zone
);

CREATE SEQUENCE IF NOT EXISTS public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;
ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);

-- Table: communication_history
CREATE TABLE IF NOT EXISTS public.communication_history (
    id integer NOT NULL,
    contact_id integer NOT NULL,
    exchange_type character varying(50) NOT NULL,
    exchange_date timestamp without time zone NOT NULL,
    summary text,
    outcome character varying(50),
    next_steps text,
    participants text,
    audio_file_url character varying(500),
    transcription text,
    ai_analysis text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    exchange_context character varying(50) DEFAULT 'discovery'::character varying
);

CREATE SEQUENCE IF NOT EXISTS public.communication_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.communication_history_id_seq OWNED BY public.communication_history.id;
ALTER TABLE ONLY public.communication_history ALTER COLUMN id SET DEFAULT nextval('public.communication_history_id_seq'::regclass);

-- Table: projects
CREATE TABLE IF NOT EXISTS public.projects (
    id integer NOT NULL,
    user_id integer NOT NULL,
    contact_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'active'::character varying,
    start_date date,
    end_date date,
    budget numeric(12,2),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;
ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);

-- Table: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    contact_id integer,
    project_id integer,
    exchange_id integer,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    due_date date,
    completed_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;
ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);

-- Table: notes
CREATE TABLE IF NOT EXISTS public.notes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    content text NOT NULL,
    title character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;
ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);

-- Table: resources
CREATE TABLE IF NOT EXISTS public.resources (
    id integer NOT NULL,
    user_id integer NOT NULL,
    entity_type character varying(20) NOT NULL,
    entity_id integer NOT NULL,
    resource_type character varying(10) NOT NULL,
    title character varying(255) NOT NULL,
    url text,
    file_path text,
    file_size integer,
    mime_type character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    CONSTRAINT resources_resource_type_check CHECK (((resource_type)::text = ANY ((ARRAY['file'::character varying, 'url'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;
ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);

-- ============================================================================
-- PRIMARY KEYS
-- ============================================================================

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.communication_history
    ADD CONSTRAINT communication_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users USING btree (username);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON public.contacts USING btree (last_contact_date);

-- Communication history indexes
CREATE INDEX IF NOT EXISTS idx_comm_history_contact_id ON public.communication_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_comm_history_date ON public.communication_history USING btree (exchange_date);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_contact_id ON public.projects USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects USING btree (status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON public.tasks USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks USING btree (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks USING btree (due_date);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON public.notes USING btree (entity_type, entity_id);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_resources_entity ON public.resources USING btree (entity_type, entity_id);

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

-- Contacts foreign keys
ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Communication history foreign keys
ALTER TABLE ONLY public.communication_history
    ADD CONSTRAINT communication_history_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Projects foreign keys
ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Tasks foreign keys
ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_exchange_id_fkey FOREIGN KEY (exchange_id) REFERENCES public.communication_history(id) ON DELETE SET NULL;

-- Notes foreign keys
ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Resources foreign keys
ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
