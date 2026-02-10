--
-- PostgreSQL database dump
--

\restrict 1qs1jlX5QD6Gzte3McdpCBnSsDheyleAJL6HWVon9S3gBcoXM4N2Z4MKg7zCLV6

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: budgets; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    currency character varying(3) NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    base_amount numeric(14,2),
    base_currency character varying(3),
    exchange_rate numeric(12,6)
);


ALTER TABLE public.budgets OWNER TO rohitaggarwal;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(10),
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categories_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


ALTER TABLE public.categories OWNER TO rohitaggarwal;

--
-- Name: monthly_category_spend; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.monthly_category_spend (
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    base_spent numeric DEFAULT 0
);


ALTER TABLE public.monthly_category_spend OWNER TO rohitaggarwal;

--
-- Name: monthly_user_summary; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.monthly_user_summary (
    user_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    total_income numeric DEFAULT 0,
    total_expense numeric DEFAULT 0
);


ALTER TABLE public.monthly_user_summary OWNER TO rohitaggarwal;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50),
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO rohitaggarwal;

--
-- Name: receipts; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    user_id uuid NOT NULL,
    filename text,
    storage_url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.receipts OWNER TO rohitaggarwal;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid,
    type character varying(10),
    amount numeric(14,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    description text,
    transaction_date date NOT NULL,
    is_refund boolean DEFAULT false,
    receipt_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    base_amount numeric(14,2),
    base_currency character varying(3) DEFAULT 'INR'::character varying,
    exchange_rate numeric(12,6),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO rohitaggarwal;

--
-- Name: users; Type: TABLE; Schema: public; Owner: rohitaggarwal
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    primary_currency character varying(3) DEFAULT 'INR'::character varying,
    google_sub text,
    auth_provider character varying(20) DEFAULT 'local'::character varying
);


ALTER TABLE public.users OWNER TO rohitaggarwal;

--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: monthly_category_spend monthly_category_spend_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.monthly_category_spend
    ADD CONSTRAINT monthly_category_spend_pkey PRIMARY KEY (user_id, category_id, month, year);


--
-- Name: monthly_user_summary monthly_user_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.monthly_user_summary
    ADD CONSTRAINT monthly_user_summary_pkey PRIMARY KEY (user_id, month, year);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_categories_user; Type: INDEX; Schema: public; Owner: rohitaggarwal
--

CREATE INDEX idx_categories_user ON public.categories USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: rohitaggarwal
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: budgets fk_budget_category; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: budgets fk_budget_user; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories fk_category_user; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions fk_transaction_category; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: transactions fk_transaction_user; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: receipts receipts_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: receipts receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohitaggarwal
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 1qs1jlX5QD6Gzte3McdpCBnSsDheyleAJL6HWVon9S3gBcoXM4N2Z4MKg7zCLV6

