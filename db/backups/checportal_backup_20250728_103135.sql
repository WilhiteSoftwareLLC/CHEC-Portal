--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-28 10:31:35 CDT

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

--
-- TOC entry 216 (class 1259 OID 24591)
-- Name: admin_users; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    role character varying DEFAULT 'admin'::character varying NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_users OWNER TO chec;

--
-- TOC entry 215 (class 1259 OID 24590)
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO chec;

--
-- TOC entry 4563 (class 0 OID 0)
-- Dependencies: 215
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- TOC entry 218 (class 1259 OID 24608)
-- Name: classes; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    class_name character varying(255) NOT NULL,
    start_code integer,
    end_code integer
);


ALTER TABLE public.classes OWNER TO chec;

--
-- TOC entry 217 (class 1259 OID 24607)
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO chec;

--
-- TOC entry 4564 (class 0 OID 0)
-- Dependencies: 217
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- TOC entry 220 (class 1259 OID 24615)
-- Name: courses; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    course_name character varying(255) NOT NULL,
    class_id integer,
    offered_fall boolean DEFAULT true,
    offered_spring boolean DEFAULT true,
    hour integer,
    fee numeric(10,2),
    book_rental numeric(10,2),
    location character varying(255)
);


ALTER TABLE public.courses OWNER TO chec;

--
-- TOC entry 219 (class 1259 OID 24614)
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO chec;

--
-- TOC entry 4565 (class 0 OID 0)
-- Dependencies: 219
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- TOC entry 222 (class 1259 OID 24626)
-- Name: families; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.families (
    id integer NOT NULL,
    last_name character varying(255) NOT NULL,
    father character varying(255),
    mother character varying(255),
    parent_cell character varying(20),
    email character varying(255),
    address character varying(255),
    city character varying(100),
    zip character varying(10),
    home_phone character varying(20),
    parent_cell2 character varying(20),
    second_email character varying(255),
    work_phone character varying(20),
    church character varying(255),
    pastor_name character varying(255),
    pastor_phone character varying(20),
    active boolean DEFAULT true
);


ALTER TABLE public.families OWNER TO chec;

--
-- TOC entry 221 (class 1259 OID 24625)
-- Name: families_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.families_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.families_id_seq OWNER TO chec;

--
-- TOC entry 4566 (class 0 OID 0)
-- Dependencies: 221
-- Name: families_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.families_id_seq OWNED BY public.families.id;


--
-- TOC entry 224 (class 1259 OID 24636)
-- Name: former_families; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.former_families (
    id integer NOT NULL,
    last_name character varying(255) NOT NULL,
    father character varying(255),
    mother character varying(255),
    parent_cell character varying(20),
    email character varying(255),
    address character varying(255),
    city character varying(100),
    zip character varying(10),
    home_phone character varying(20),
    parent_cell2 character varying(20),
    field1 character varying(255),
    work_phone character varying(20),
    church character varying(255),
    pastor_name character varying(255),
    pastor_phone character varying(20)
);


ALTER TABLE public.former_families OWNER TO chec;

--
-- TOC entry 223 (class 1259 OID 24635)
-- Name: former_families_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.former_families_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.former_families_id_seq OWNER TO chec;

--
-- TOC entry 4567 (class 0 OID 0)
-- Dependencies: 223
-- Name: former_families_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.former_families_id_seq OWNED BY public.former_families.id;


--
-- TOC entry 226 (class 1259 OID 24645)
-- Name: grades; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    grade_name character varying(50) NOT NULL,
    code integer NOT NULL
);


ALTER TABLE public.grades OWNER TO chec;

--
-- TOC entry 225 (class 1259 OID 24644)
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_id_seq OWNER TO chec;

--
-- TOC entry 4568 (class 0 OID 0)
-- Dependencies: 225
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- TOC entry 228 (class 1259 OID 24652)
-- Name: hours; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.hours (
    id integer NOT NULL,
    description character varying(50) NOT NULL
);


ALTER TABLE public.hours OWNER TO chec;

--
-- TOC entry 227 (class 1259 OID 24651)
-- Name: hours_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.hours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hours_id_seq OWNER TO chec;

--
-- TOC entry 4569 (class 0 OID 0)
-- Dependencies: 227
-- Name: hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.hours_id_seq OWNED BY public.hours.id;


--
-- TOC entry 230 (class 1259 OID 24659)
-- Name: parent_users; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.parent_users (
    id integer NOT NULL,
    family_id integer NOT NULL,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    email character varying NOT NULL,
    role character varying DEFAULT 'parent'::character varying NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.parent_users OWNER TO chec;

--
-- TOC entry 229 (class 1259 OID 24658)
-- Name: parent_users_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.parent_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parent_users_id_seq OWNER TO chec;

--
-- TOC entry 4570 (class 0 OID 0)
-- Dependencies: 229
-- Name: parent_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.parent_users_id_seq OWNED BY public.parent_users.id;


--
-- TOC entry 231 (class 1259 OID 24675)
-- Name: sessions; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO chec;

--
-- TOC entry 233 (class 1259 OID 24683)
-- Name: settings; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying NOT NULL,
    value character varying,
    description character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO chec;

--
-- TOC entry 232 (class 1259 OID 24682)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO chec;

--
-- TOC entry 4571 (class 0 OID 0)
-- Dependencies: 232
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 235 (class 1259 OID 24696)
-- Name: students; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.students (
    id integer NOT NULL,
    family_id integer NOT NULL,
    last_name character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    birthdate timestamp without time zone,
    grad_year character varying(10),
    comment1 text,
    math_hour character varying(255),
    first_hour character varying(255),
    second_hour character varying(255),
    third_hour character varying(255),
    fourth_hour character varying(255),
    fifth_hour_fall character varying(255),
    fifth_hour_spring character varying(255),
    inactive boolean DEFAULT false,
    registered_on timestamp without time zone
);


ALTER TABLE public.students OWNER TO chec;

--
-- TOC entry 234 (class 1259 OID 24695)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: chec
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO chec;

--
-- TOC entry 4572 (class 0 OID 0)
-- Dependencies: 234
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chec
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 236 (class 1259 OID 24705)
-- Name: users; Type: TABLE; Schema: public; Owner: chec
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO chec;

--
-- TOC entry 4327 (class 2604 OID 24594)
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- TOC entry 4332 (class 2604 OID 24611)
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- TOC entry 4333 (class 2604 OID 24618)
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- TOC entry 4336 (class 2604 OID 24629)
-- Name: families id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.families ALTER COLUMN id SET DEFAULT nextval('public.families_id_seq'::regclass);


--
-- TOC entry 4338 (class 2604 OID 24639)
-- Name: former_families id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.former_families ALTER COLUMN id SET DEFAULT nextval('public.former_families_id_seq'::regclass);


--
-- TOC entry 4339 (class 2604 OID 24648)
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- TOC entry 4340 (class 2604 OID 24655)
-- Name: hours id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.hours ALTER COLUMN id SET DEFAULT nextval('public.hours_id_seq'::regclass);


--
-- TOC entry 4341 (class 2604 OID 24662)
-- Name: parent_users id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.parent_users ALTER COLUMN id SET DEFAULT nextval('public.parent_users_id_seq'::regclass);


--
-- TOC entry 4346 (class 2604 OID 24686)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 4349 (class 2604 OID 24699)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4537 (class 0 OID 24591)
-- Dependencies: 216
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.admin_users (id, username, password_hash, email, first_name, last_name, role, active, created_at, updated_at) FROM stdin;
1	admin	$2a$10$dWUq/EwVviOVX.qxIptZrepStRmRtyQWWgRrRnNy8TGTBNjvMzPl.	checadmin@gmail.com	Admin		admin	t	2025-06-24 07:20:37.78134	2025-06-24 07:20:37.78134
2	katherine	$2b$10$G1GAJLD3MP6dANm3rAxTVuNGh/dTrvPY2bry4KYLOjgdPsOLQt0mu	mathteacher18@yahoo.com	Katherine	Wilhite	admin	t	2025-06-24 10:51:50.536013	2025-06-24 10:51:50.536013
3	trisha	$2b$10$re0dJKoQ.1DGdy1y6N59r.C/kY3iErq.m.rdrZSSwWkqktCfRVAzC	trisha050600@yahoo.com	Trisha	Randolph	admin	t	2025-06-24 10:53:56.238445	2025-06-24 10:53:56.238445
4	jeff	$2b$10$/aDJq1xs2QDkD3LV/DEFieYKcqemyuLdMv2CWmyseXmB38Xhvn3ZO	jeff@wilhite.software	Jeff	Wilhite	admin	t	2025-06-24 11:14:31.06631	2025-06-24 11:14:31.06631
5	chauna	$2b$10$DaPqhUmy8siNWXxA9XSopeIB1WOp9JlYBp/Tr2c8vPzElVBrg9.Ke	gaertnergang@gmail.com	Chauna	Gaertner	admin	t	2025-07-17 22:57:49.889831	2025-07-17 22:57:49.889831
\.


--
-- TOC entry 4539 (class 0 OID 24608)
-- Dependencies: 218
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.classes (id, class_name, start_code, end_code) FROM stdin;
1	Nursery	-5	-5
4	Pre-K	-1	-1
5	Kinder	0	0
8	5th & 6th	5	6
6	1st	1	1
7	3rd & 4th	3	4
9	2nd	2	2
3	Grizzlies	-2	-2
10	Bears	-3	-3
2	Cubs	-4	-4
\.


--
-- TOC entry 4541 (class 0 OID 24615)
-- Dependencies: 220
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.courses (id, course_name, class_id, offered_fall, offered_spring, hour, fee, book_rental, location) FROM stdin;
1	3rd/4th History	\N	t	t	3	3.00	\N	\N
3	5th Art	\N	t	t	5	10.00	\N	\N
4	5th/6th Chimes	\N	t	t	2	12.00	\N	\N
5	5th/6th History	\N	t	t	4	3.00	\N	\N
6	5th/6th Science	\N	t	t	3	12.00	\N	\N
7	Algebra I	\N	t	t	0	\N	8.00	A201
8	Algebra II	\N	t	t	0	\N	10.00	B109
9	Anatomy & Physiology	\N	t	t	4	80.00	15.00	B201
12	ASL 1 - 3rd Hour	\N	t	t	3	\N	\N	B109
13	ASL 1 - 5th Hour	\N	t	t	5	\N	\N	B109
14	ASL 2	\N	t	t	5	\N	\N	B206
16	Biology	\N	t	t	4	65.00	10.00	B204/205
17	Chemistry	\N	t	t	4	25.00	20.00	Southside
18	Children of Math Teachers	\N	t	t	0	\N	\N	\N
19	Computer Applications - 3rd Hour	\N	f	f	3	\N	\N	B114
21	Creative and Technical Writing	\N	t	t	1	\N	\N	B207
24	Geometry	\N	t	t	0	\N	10.00	B204/205
30	HS Writing Part II	\N	t	t	1	\N	\N	B114
32	JH Math	\N	t	t	0	\N	5.00	B114
35	MS Excel (Fall)	\N	f	f	5	\N	\N	B109
38	Physics	\N	t	t	4	10.00	20.00	B107
39	Pre-Algebra	\N	t	t	0	\N	5.00	B207
47	Student Volunteer - 1st Hour	\N	t	t	1	\N	\N	\N
48	Student Volunteer - 2nd Hour	\N	t	t	2	\N	\N	\N
49	Student Volunteer - 3rd Hour	\N	t	t	3	\N	\N	\N
50	Student Volunteer - 4th Hour	\N	t	t	4	\N	\N	\N
51	Student Volunteer - 5th Hour	\N	t	t	5	\N	\N	\N
52	Student Volunteer - Math Hour	\N	t	t	0	\N	\N	\N
58	Study Hall - Lit	\N	t	t	3	\N	\N	Southside
64	Will Not Attend Math Hour	\N	t	t	0	\N	\N	\N
67	Writeshop I	\N	t	t	1	\N	\N	B109
36	Personal Finance	\N	f	f	0	\N	\N	B112
2	3rd/4th Music	\N	t	t	4	6.00	\N	\N
15	Automotive - 3rd Hour	\N	t	t	3	\N	\N	B204/205
65	World Geography	\N	t	t	2	\N	\N	Southside
77	Automotive - 5th Hour	\N	t	t	5	0.00	0.00	
66	World History	\N	f	f	2	\N	\N	Southside
25	Health & Nutrition	\N	t	t	4	\N	\N	B204
59	Trigonometry & Precalculus	\N	f	f	0	\N	10.00	B206/209
42	Spanish I - 3rd Hour	\N	t	t	3	\N	\N	B109
60	US Government with Economics	\N	t	t	2	\N	\N	B109
10	Art - 3rd Hour	\N	f	f	3	20.00	10.00	B112
43	Spanish II	\N	f	f	5	\N	\N	B209
11	Art - 5th Hour	\N	f	f	5	20.00	10.00	B112
23	General Science (7th)	\N	t	t	2	10.00	15.00	A201
61	JH US History (7th)	\N	t	t	4	\N	\N	B109
20	Computer Applications - 5th Hour	\N	f	f	5	\N	\N	B114
26	History of Western Philosophy	\N	t	t	2	\N	\N	B204/205
45	Speech (HS)	\N	f	f	5	\N	\N	B107
27	Home Improvement - 3rd Hour	\N	f	f	3	\N	\N	B204/205
72	Ensemble	\N	t	t	5	0.00	0.00	
28	Home Improvement - 5th Hour	\N	f	f	5	\N	\N	B204/205
46	Speech/Mock Trial	\N	f	f	5	18.00	\N	A201
34	Math Tutoring - 3rd hour	\N	t	t	3	\N	\N	B107
73	TSI Math Prep/Math Skills Practice (9th-12th) 3rd Hour	\N	t	t	3	0.00	0.00	
63	US History (HS)	\N	f	f	2	\N	5.00	B204/205
74	TSI Math Prep/Math Skills Practice (9th-12th) 5th Hour	\N	t	t	5	0.00	0.00	
53	Independent Studies - 1st Hour	\N	t	t	1	\N	\N	\N
54	Independent Studies  - 2nd Hour	\N	t	t	2	\N	\N	\N
55	Independent Studies - 3rd Hour	\N	t	t	3	\N	\N	\N
56	Independent Studies - 4th Hour	\N	t	t	4	\N	\N	\N
57	Independent Studies - 5th Hour	\N	t	t	5	\N	\N	\N
78	Math Tutoring - 5th hour	\N	t	t	5	0.00	0.00	
29	HS Writing Part I 	\N	t	t	1	\N	3.00	Southside
33	Traditional Logic I and II	\N	t	t	0	\N	\N	B207
41	SAT Prep (Fall) - Verbal	\N	t	t	5	\N	\N	B206
31	Intro to Drama (7th-8th)	\N	t	t	3	\N	\N	Worship Center
75	Spanish I - 5th Hour	\N	t	t	5	0.00	0.00	
40	SAT Prep (Spring) - Math	\N	t	t	5	\N	\N	B207
44	Speech & Career (7th-9th) 5th hour	\N	t	t	5	\N	\N	B107
76	Speech & Career (7th-9th) 3rd hour	\N	t	t	3	0.00	0.00	
22	Drama (9th-12th)	\N	t	t	5	75.00	\N	Worship Center
69	Mock Trial (9th-12th) 	\N	t	t	5	0.00	0.00	
62	JH US History (8th)	\N	t	t	2	\N	\N	B109
68	Writeshop II	\N	t	t	1	\N	\N	B114
37	Physical Science (8th)	\N	t	t	4	10.00	15.00	A201
70	Journalism/Creative Media Design. - 3rd hour	\N	t	t	3	21.00	0.00	
71	Journalism/Creative Media Design - 5th hour	\N	t	t	5	21.00	0.00	
\.


--
-- TOC entry 4543 (class 0 OID 24626)
-- Dependencies: 222
-- Data for Name: families; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.families (id, last_name, father, mother, parent_cell, email, address, city, zip, home_phone, parent_cell2, second_email, work_phone, church, pastor_name, pastor_phone, active) FROM stdin;
1	Anderson	Anthony	Shana	903-434-2841	mathtutorshana@yahoo.com	10898 HW 271 N	Gilmer	75644	903-762-6518	903-434-2840	\N	903-572-1741	Willow Oak Baptist Church	\N	\N	t
90	Arnold	Andrew	Kristen	903.466.2666	KristenDeAnnCraig@gmail.com	1125 CR 3430	Cookville	75558	\N	903.285.7546	\N	\N	Southside church of Christ	Drew Nelson	254.541.3815	t
92	Betancourt	Bryant	Maggie	806-451-9693	maggieshaebetancourt@gmail.com	300 English Street	Mount Vernon Texas	75457	\N	806-702-1310	\N	\N	Trinity Baptist	Chris Wigley	903.572.1959	t
3	Binns	Bernie	Rebecca	903-946-6504	rbinns5f@ymail.com	952 CR 4135	Clarksville	75426	\N	903-946-6505	\N	\N	South Union	Dangerfield	\N	t
84	Burkhalter	Chad	Cammy	903-767-5484	cammyburkhalter.4@gmail.com	3830 Castle Ridge Drive	Longview	75605	\N	903-767-1193	\N	\N	Mobberly Baptist	Dr. Andrew He’bert	903-663-3100	t
97	Cannon	Wade	Victoria	9032851925	wadeandvictoria@gmail.com	562 CR NW 1085	Sulphur Bluff	75481	\N	9035732867	\N	\N	Sulphur bluff assembly of God	Jake Jones	9037150772	t
4	Carlisle	Chas	Amy	903-799-9646	ladycarlisle03@gmail.com	P.O. Box 162	Marietta	75566	\N	903-650-1952	\N	\N	Oak Ridge Baptist	Marietta	\N	t
5	Carpenter	Keith	Elibeth	469-265-6403	erawac@gmail.com	188 CR 4583	Winnsboro	75494	\N	469-243-3578	\N	\N	Calvary Bible Church	\N	903-285-5270	t
98	Caswell	Chris	Sarah	903-916-0692	sarahmegrace915@gmail.com	341 State Park Rd 2117	Pittsburg	75686	\N	318-578-2771	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
7	Clayton	Todd	Ginger	903-853-0999	gsclytn@yahoo.com	14603 FM 115	Scroggins	75480	\N	903-850-2441	\N	\N	FBC Winsboro	David Rose	903-342-3538	t
9	Coleman	Matthew	Emily	903-434-6908	emily@thecolemans.ca	2636 US Hwy 271 S.	Pittsburg	75686	\N	903-219-1814	\N	\N	Trinity	\N	817-995-7999	t
89	Anderson3	Thomas	Alejandra	9035634327	chrisale21.af@gmail.com	198 cr 4511	Pittsburg	75686	\N	9032853728	\N	\N	Victory Babtist Church	Mike Murrey	New pastor	t
12	DeLisi	Craig	Tonya	903-918-9205	craigdelisi@gmail.com	194 CR 4210	Mt. Pleasant	75455	\N	903-918-9204	\N	903-946-5442	Calvary Bible Church	Daniel Souza	\N	t
13	Deornellis	Tony	Amy	903-563-2156	ardeornellis@gmail.com	267 CR 1311	Pittsburg	75686	\N	903-563-2253	twd1072@gmail.com	\N	FBC Pittsburg	\N	\N	t
14	Dickson	Robert	Tabitha	903-285-3339	dicksonfamily1996@gmail.com	327 Quitman St.	Pittsburg	75686	\N	903-285-3339	\N	\N	Victory Baptist Church	Cox Community	\N	t
15	Dublin	Donovan	Karla	903-238-3210	karladublin@gmail.com	872 CR 3311	Omaha	75571	\N	903-285-7375	\N	\N	Dangerfield Church of Christ	\N	\N	t
16	Fein	Bradley	Lisa	903-204-9567	lisaramseyfein@yahoo.com	1166 CR 3350	Cookville	75558	\N	817-584-2216	\N	\N	Trinity Baptist	Mike Kessler	903-572-1959	t
17	Friberg	Erikk	Sarah	903-285-1926	sarey717@gmail.com	353 CR 1336	Pittsburg	75686	\N	903-767-6753	\N	\N	New Beginnings Baptist Church	\N	903-767-6824	t
18	Gaertner	Michael	Chauna	573-614-2094	gaertnergang@gmail.com	1200 Alexander Rd.	Mt. Pleasant	75455	\N	573-614-2034	\N	\N	Trinity	\N	\N	t
19	Glanzer	Mark	Christie	918-760-0957	christie.glanzer@icloud.com	1108 S Florey	Mt. Pleasant	75455	\N	903-204-3717	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
20	Gressley	Randy	Harmoni	660-281-1766	thegressleys@gmail.com	4721 Lakeside Dr.	Mt. Pleasant	75455	\N	660-281-6491	\N	\N	Trinity	\N	\N	t
78	Griffin	Steve	Joy	903-767-3179	afunmom@juno.com	3500 FM 557	Pittsburg	75686	\N	903-767-0860	\N	\N	Emmanuel Baptist Church	\N	\N	t
22	Hall	Michael	Emily	903-235-7429	emilyrhall1986@gmail.com	681 CR 1233	Omaha	75571	\N	903-916-0059	\N	\N	Church on the Rock	Randy Seybert	903-238-5079	t
23	Hall	Scott	Johnette	903-767-9441	johnettehall8@gmail.com	482 FM 1519 N	Leesburg	75451	903-856-7085	903-767-7702	\N	\N	New Beginnings SS	\N	\N	t
75	Hampton	Jeremy	Laura	979-218-8328	hampton.laura07@gmail.com	1750 CR 4875	Pittsburg	75686	\N	903-575-8005	\N	\N	Trinity	Chris Wigley	817-995-7999	t
24	Harrison	Will	Nancy	903-850-1998	nancycharrison@yahoo.com	1868 E. FM 515	Winnsboro	75494	903-365-2212	903-850-1997	\N	903-342-0117	FBC Winnsboro	\N	\N	t
25	Hefner	Cole	Kerri	903-855-2252	kerrihefner@yahoo.com	806 CR 4510	Mt. Pleasant	75455	\N	903-855-2251	\N	\N	South Jefferson Baptist Church	\N	\N	t
26	Hefner	Jed	RaeLynn	903-204-3407	rae@hefcoservices.com	3558 FM 3384	Pittsburg	75686	\N	903-855-2900	\N	\N	Trinity Baptist	Chris Wigley	817-995-7999	t
27	Higginbotham	Brandon	Laura	903-960-0056	lehigginbotham@gmail.com	4228 FM 2348	Mt. Pleasant	75455	\N	903-285-8353	\N	\N	visiting Trinity	\N	\N	t
71	Huddleston	Mark	Amy	903-243-2413	mamahuddle@yahoo.com	208 Turner St.	Mt. Vernon	75457	\N	903-348-0930	\N	\N	FBC - Mt. Vernon	Pepper Puryear	903-537-2322	t
86	Keith	Michael	Hilary	936-465-5057	hilaryjanelle.1229@gmail.com	440 county road 3245	Mt. Pleasant	75455	\N	214-251-7890	\N	\N	Trinity Baptist Church	Chris Wigley	817-995-7999	t
28	Kilburn	John	Aliza	214-450-3764	alizashier@gmail.com	1399 CR 4240	Pittsburg	75686	\N	903-767-6855	\N	\N	Calvary	\N	\N	t
83	McGill	Jeremy	Mary	760-417-2598	marfox01@protonmail.com	497 CR 1233	Omaha	75571	\N	661-204-9636	\N	\N	Nevill’s Chapel	Shawn Findley	903-572-5664	t
35	Merritt	Jase	Marissa	806-292-9572	marissamphotos@gmail.com	942 CR 1330	Mt. Pleasant	75455	\N	806-548-4562	\N	\N	Outpost Church	\N	\N	t
68	Morris	Shane	Ashley	210-677-2670	ashleydmorris31@gmail.com	206 Bluebird St.	Mt. Pleasant	75455	\N	210-254-5733	\N	\N	FBC Pittsburg	\N	\N	t
63	Nelson	Drew	Meagan	214-335-8131	meaganclaire@gmail.com	1805 Hogan Lane	Mount Pleasant	75455	\N	254-541-3815	\N	\N	Southside Church of Christ	Drew Nelson	254-541-3815	t
82	Nix	Christopher	Christen	9726586338	christen@christen.abear.net	1515 County Road 3250	Mount Pleasant	75455	\N	9723699340	\N	\N	Calvary Bible	Daniel Souza	9035777787	t
38	Nuss	Chad	Kaley	903-343-3031	mnuss240@gmail.com	20 CR 3204	Naples	75568	\N	903-343-2061	knuss873@gmail.com	\N	Oak Ridge Baptist	Marietta	\N	t
88	Obholz	Caleb	Leslie	8177898591	lemonchic2005@yahoo.com	10299 Turtle Circle	Pittsburg	75686	\N	2147895934	\N	\N	First Baptist Church Pittsburg	Joel Davis	9037670082	t
10	Corbin	Danny	Toni	903-790-1452	tonicorbin@aol.com	249 FM 1519 N.	Leesburg	75451	\N	903-790-0931	\N	\N	Wood County Cowboy Church	\N	\N	f
2	Anderson2	Daniel	Allison	903 285-7181	allieanders.0@gmail.com	4991 Longhorn Rd.	Pittsburg	75686	\N	903-801-1965	\N	\N	Brumley Baptist	\N	\N	t
64	Fulton	John	Cindy	214-770-6600	cindyfulton7@gmail.com	118 Deer Cove Rd	Scroggins	75480	\N	214-505-9700	johnfulton7@gmail.com	\N	Calvary Bible Church	Daniel Souza	903-466-4803	f
70	Pedersen	Ryan	Katrina	903-449-9410	katrinamarta@protonmail.com	2723 CR 1127	Daingerfield	75638	\N	775-303-9354	\N	\N	FBC MP	Randy Seybert	903-238-5079	t
95	Phifer	Danny	Stephanie	9032855998	sphifer84@gmail.com	2139 Burton Rd Apt 27	Mount Pleasant	75455	\N	9032851824	\N	\N	Calvary Bible Church	Daniel Souza	9035777787	t
40	Pickens	Travis	Valerie	903-573-4336	averybows@gmail.com	55 Piney Wood Drive	Mt. Vernon	75457	\N	\N	\N	\N	Macon Baptist	\N	\N	t
87	Pirtle	Noah	Katlyn	2818988646	katlynw1998@gmail.com	407 Campbell Street	Daingerfield	75638	\N	9037202113	\N	\N	Church on the Rock Daingerfield	Pastor Randy	9036457050	t
42	Quinn	Lloyd	Elissa	903-767-8023	quinnmom823@gmail.com	155 CR 2605	Pittsburg	75688	\N	903-767-2421	\N	\N	South Jefferson Baptist Church	\N	\N	t
43	Randolph	Jeremy	Trisha	205-527-5927	trisha050600@yahoo.com	101 Princedale Dr.	Pittsburg	75686	\N	205-405-4734	randolphs@pobox.com	\N	FBC MP	\N	\N	t
44	Rawlings	Anthony	Steffenie	903-305-4813	steffenie.rawlings@gmail.com	690 CR 3210	Mt. Pleasant	75455	\N	903-305-3682	\N	\N	FBCMV	\N	903-572-3605	t
45	Reed	Eric	Karen	903-563-2228	edktreed@gmail.com	2954 FM 1402	Mt. Pleasant	75455	\N	903-563-2808	\N	903-577-1101	NR Church of Christ	Derek McNamara	903-572-3202	t
62	Rogers	Dave	Bethany	903-767-5891	rogers0531@gmail.com	580 CR 1070	Mt. Pleasant	75455	\N	903-767-1303	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
85	Roraback	Josh	Julie	9034071369	jaroraback@gmail.com	10100 FM 1650	Gilmer	75645	\N	9034071368	\N	\N	Sovereign Life Fellowship	Jason Williams	903-918-2670	t
50	Smith	Thomas	Kim	903-261-8276	kimsmithketo58@gmail.com	320 Jefferson St.	Lone Star	75668	\N	903-241-8284	\N	\N	Church on the Rock	Randy Seybert	903-238-5079	t
51	Souza	Daniel	Jessica	903-466-4860	jessicaksouza@yahoo.com	4552 FM 2348	Mt. Pleasant	75455	\N	903-466-4803	danielaggie02@gmail.com	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
52	Tagg	Barry	Brandi	940-765-1391	branditagg@yahoo.com	2465 N. Jefferson	Mt. Pleasant	75455	\N	940-391-7556	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
53	Taylor	James	K'Lee	903-790-1250	taylorhomeschool21@gmail.com	4486 SE CR 3470	winnsboro	75494	\N	903-738-1041	\N	\N	The Church at West Mountain	Aeron Wallace	903-734-3775	t
54	Villone	Joshua	Heather	903-767-6064	havillone@gmail.com	634 CR 1070	Mt. Pleasant	75455	\N	903-853-0574	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
55	Wheeler	Tandy	Melinda	903-841-2756	loblolly70@gmail.com	10772 Cactus Road	Pittsburg	75686	\N	\N	\N	\N	Midway Baptist Church	Johnny Simmons	903-918-4623	t
91	Whitton	Thomas	Allison	9035590591	allison_whitton@yahoo.com	8619 CR SW 3170	Winnsboro	75494	\N	9038245201	\N	\N	Calvary bible	Daniel Souza	9035777787	t
56	Wigley	Chris	Cathy	817-995-7305	cathywigley@hotmail.com	306 Delwood	Mt. Pleasant	75455	\N	\N	\N	\N	Trinity	Chris Wigley	817-995-7999	t
57	Wilhite	Jeff	Katherine	325-260-8926	mathteacher18@yahoo.com	357 CR 3265	Mt. Pleasant	75455	\N	903-573-0715	jwilhite@acm.org	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
93	Wilkerson	Ruie	Debra	281-380-9423	debwilk65@gmail.com	1746 County Road 2746	Hughes Springs	75656	\N	281-546-1129	\N	\N	Church on the Rock - Daingerfield	Randy Seybert	903-645-7050	t
58	Wilson	Billy	Cristen	713-201-6123	wilsoncristen@gmail.coom	586 CR 4135 SE	Mt. Vernon	75457	903-201-6123	903-814-0387	bjwiltrack@hotmail.com	\N	FBC Mt. Vernon	\N	\N	t
59	Wisner	Steven	Dawn	903-285-9979	dmc51676@hotmail.com	280 CR 2718	Mt. Pleasant	75455	\N	210-326-5710	\N	\N	Highland Park Baptist Church	\N	\N	t
60	Woods	James	Kayla	903-931-1396	kayla.lynne.woods@gmail.com	806 CR 3375	Cookville	75558	\N	903-806-9420	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	t
61	Wyatt	Brandon	J'Lae	806-240-1087	jlae.dependent@gmail.com	1416 CR 3218	DeKalb	75559	\N	\N	\N	\N	Christ Community Church	TXK	\N	t
66	Yarbrough	Corey	Sarah	903-720-0739	sarah.yarbrough90@gmail.com	199 CR 2211	Daingerfield	75638	\N	903-931-7319	\N	\N	Daingerfield Church of Christ	Tim Gibbs	903-645-2896	t
1000	Price	Stephen	Lisa	903-312-0231	slprice@peoplescom.net	1825 CR 4778 P.O. Box 376	Winnsboro	75494	903-629-7711	903-520-8348	\N	\N	FBC Winnsboro	David Rose	903-342-3538	f
1001	Simmons	Johnny	Teri	903-918-8257	teri@s-sroofing.com	3440 CR 1264	Pittsburg	75686	\N	\N	\N	\N	\N	\N	\N	f
39	O'Rand	Phillip	Kitty	903 366-1254	kittyorand@yahoo.com	522 CR 4245	Mount Pleasant	75455	\N	\N	\N	75455	Impact Church	\N	\N	t
1002	Lowry	Brent	Rena	903-261-6973	jrenalowry4@gmail.com	335 York St	Harleton	75651	\N	903-563-4678	\N	\N	Harleton Baptist Church	Brent Lowry	903-563-4678	f
1003	Griffin	Steve	Joy	903-767-3179	afunmom@juno.com	3500 FM 557	Pittsburg	75686	\N	903-767-0860	\N	\N	\N	\N	\N	f
1004	Cole	Michael	Cryste	903-752-8846	cryste.cole@gmail.com	1555 CR 3265	Mineola	75773	\N	903-810-8550	\N	\N	Garden Valley Bible	\N	\N	f
1005	Knight	\N	Melanie	903-466-4192	melne131126@gmail.com	103 Sweet Pea Ct.	Mt. Pleasant	75455	\N	903-466-4188	\N	\N	\N	\N	\N	f
1006	Frazier	Eric	Misty	903-590-7888	ejfrazier@hotmail.com	1200 N Main Street	Winnsboro	75494	\N	903-975-4064	\N	\N	1st Baptist Winnsboro	David Rose	9033423538	f
1007	Griffin	Joshua	Macy	706-273-8134	macywgriffin@gmail.com	345 Private road 54166	Pittsburg	75686	\N	706-818-1173	\N	\N	Trinity Baptist	Chris Wigley	817-995-7999	f
1008	McCraw	Robby	Amy	214-218-7044	amymccraw5@gmail.com	5064 FM 115	Mt. Vernon	75457	903 860 7622	214 726 2989	\N	903 860 3043	FBC Winnsboro	\N	\N	f
1009	Neely	Cory	Lori	214-502-7704	l.ellenneely@yahoo.com	298 CR 3341 North	Sulphur Springs	75482	\N	214-502-7726	\N	\N	Shannon Oaks	\N	\N	f
1010	Chandler	Richard	Crystal	903-434-2678	cchandler777@gmail.com	1401 S. Lide Ave.	Mt. Pleasant	75455	903-577-8781	903-285-5539	\N	903-572-3605	First Baptist Church Mt. Pleasant	\N	\N	f
1011	Mullins	Aaron	Tonya	903-238-7341	tonyanrcoc@gmail.com	214 White St.	Mt. Pleasant	75455	\N	903-946-6486	\N	\N	North Ridge Church of Christ	Derek McNamara	903-572-3202	f
1012	Tallant	Jeff	Haylee	979-575-0187	godshaylo@yahoo.com	7439 Highway 67 East	Cookville	75558	\N	979-575-6969	\N	\N	Calvary Bible Church	Daniel Souza	903-466-4803	f
1013	Gann	Nathan	Allyson	903.431.3062	ally.d.gann@gmail.com	PO Box 547	Gilmer	75644	\N	903.987.0966	\N	\N	Chapel in the Woods	Alan Metzel	903.570.9326	f
99	Parker	Mike	Karen	903-754-3068	mparker@mikeparkerlaw.com	3001 Chase Wood Way	Longview	75605	\N	903-754-1490	\N	\N	New Beginnings Baptist Church	Todd Kaunitz	903-759-5552	f
96	Acuña	Martin	Bany	903-305-6707	b.acuna0520@gmail.com	119 Texas	Mount Pleasant	75455	\N	903-434-2319	\N	\N	Templo Cristiano Fuente De Agua Viva A/D	Rev. Juan Martinez	903-253-1544	t
94	Hallonquist	Will	Julie	903-563-2654	atimetodance.jh@gmail.com	3057 County Road 1220	Mount Pleasant	75455	\N	903-563-1057	\N	\N	West New Hope Global Methodist Church	Brian Walker	903-563-2131	t
76	Orr	Michael	Loretta	972-804-2712	loretta.lynn.orr@gmail.com	2824 FM 1402	Mt. Pleasant	75455	\N	972-948-6344	\N	\N	North Ridge Church of Christ	Michael Orr	972-948-6344	t
1015	Ridge	Randy	Laura	210-846-3136	mrslridge@aol.com	205 Private Road 1917	Mount Pleasant	75455		210-846-2502			Trinity	Lanny Bridges	903-572-1959	t
1016	Shumate	David Brett	Sarah	903-573-0379	sbs316@yahoo.com	1491 CR 1030	Mount Pleasant	75455		903-327-3767			SJBC	Tommy Oglesby	903-572-2006	t
1017	Waddell	Nate	Lindsey	214-856-9708	lsmcclure@gmail.com	931 CR 1150	Mount Pleasant	75455		214-415-5324			Calvary Bible	Daniel Souza	903-577-7787	t
1018	Lawrence	Allen	Allison	807-285-5621	allisonlawrence02@gmail.com	312 IH-30 E	Mount Pleasant	75455		903-466-6872			Calvary Bible	Daniel Souza	903-466-4803	t
1019	Young	Anthony	Chelsey	903-305-1276	cyoung9306@gmail.com	2830 County Road 4301	Omaha	75571		903-556-7401			Fervent Church	Garrett Graupner	208-304-2626	t
1020	Gomez	Anthony	Rebecca	830-832-4497	rjg1015@hotmail.com	197 County Road 1230	Pittsburg	75686		830-832-7712						t
1021	Barkley	Drew	Rachel	903-932-9416	rbarkley11@gmail.com	1108 Holly Hill Lane	Mount Pleasant	75455		903-954-0809	drewrachbarkley@yahoo.com		Outpost Church	Brian Kimball	903-563-3321	t
1022	Taylor2	Dustin	Shea	903-305-3518	sheasheatay94@gmail.com	237 CR 1927	Mt. Pleasant	75455		903-380-3736			FBC Mount Pleasant	Richard Chandler (Children's minister)	903-572-3605	t
\.


--
-- TOC entry 4545 (class 0 OID 24636)
-- Dependencies: 224
-- Data for Name: former_families; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.former_families (id, last_name, father, mother, parent_cell, email, address, city, zip, home_phone, parent_cell2, field1, work_phone, church, pastor_name, pastor_phone) FROM stdin;
\.


--
-- TOC entry 4547 (class 0 OID 24645)
-- Dependencies: 226
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.grades (id, grade_name, code) FROM stdin;
4	Pre-K	-1
5	Kinder	0
6	1st	1
7	2nd	2
8	3rd	3
9	4th	4
10	5th	5
11	6th	6
12	7th	7
13	8th	8
14	9th	9
15	10th	10
16	11th	11
17	12th	12
18	12th	13
19	12th	14
1	Cubs	-4
2	Bears	-3
3	Grizzlies	-2
21	Babies	-6
20	Nursery	-5
\.


--
-- TOC entry 4549 (class 0 OID 24652)
-- Dependencies: 228
-- Data for Name: hours; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.hours (id, description) FROM stdin;
0	Math
1	1st
2	2nd
3	3rd
4	4th
5	5th
\.


--
-- TOC entry 4551 (class 0 OID 24659)
-- Dependencies: 230
-- Data for Name: parent_users; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.parent_users (id, family_id, username, password_hash, email, role, active, created_at, updated_at) FROM stdin;
1	63	Meagan	$2b$10$vbRa0PMhFr58fDcjbcizkOgohhPAp4TiTFAHf7nhi2hmKVoMbCZVC	meaganclaire@gmail.com	parent	t	2025-07-23 08:44:07.441168	2025-07-23 08:44:07.441168
\.


--
-- TOC entry 4552 (class 0 OID 24675)
-- Dependencies: 231
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- TOC entry 4554 (class 0 OID 24683)
-- Dependencies: 233
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.settings (id, key, value, description, created_at, updated_at) FROM stdin;
1	BackgroundFee	0	Background check fee amount	2025-06-24 11:05:05.577295	2025-06-24 11:05:05.577295
2	SchoolYear	2025	Current school year	2025-06-24 11:05:05.58756	2025-06-24 11:05:05.58756
3	StudentFee	20	\N	2025-06-24 11:05:05.592958	2025-06-24 16:05:38.46
4	FamilyFee	30	\N	2025-06-24 11:05:05.598493	2025-06-24 16:05:41.077
\.


--
-- TOC entry 4556 (class 0 OID 24696)
-- Dependencies: 235
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.students (id, family_id, last_name, first_name, birthdate, grad_year, comment1, math_hour, first_hour, second_hour, third_hour, fourth_hour, fifth_hour_fall, fifth_hour_spring, inactive, registered_on) FROM stdin;
52	43	Randolph	Ethan	2017-02-13 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
64	60	Woods	Ember	2016-08-15 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
67	92	Betancourt	Ellinor	2015-04-11 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
88	98	Caswell	Carter	2013-04-03 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
29	97	Cannon	Paisley	2019-03-27 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
84	51	Souza	Levi	2013-12-16 06:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
40	68	Morris	Warren	2017-06-04 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
78	61	Wyatt	Morgan	2015-06-21 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
65	66	Yarbrough	Emory	2016-08-15 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
44	98	Caswell	Luke	2017-04-14 05:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
56	14	Dickson	Natalie	2015-12-11 06:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
45	17	Friberg	Elizabeth	2016-11-27 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
60	63	Nelson	Daphne	2016-07-21 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
35	96	Acuna	William	2017-12-27 00:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
36	89	Anderson3	Theodore	2018-08-28 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
21	90	Arnold	Krosslynn	2020-08-16 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
6	92	Betancourt	Charlotte	2023-01-30 06:00:00	2041	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
55	2	Anderson2	Hadassah	2015-06-29 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
37	16	Fein	Judith Ann	2018-05-22 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
49	28	Kilburn	Marielle	2017-03-22 05:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
33	87	Pirtle	Jonah	2019-07-04 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
18	96	Acuna	Isabella	2020-01-18 00:00:00	2038		\N	\N	\N	\N	\N	\N	\N	f	\N
86	1	Anderson	Noah	2012-12-12 06:00:00	2031	\N	Traditional Logic I and II	HS Writing Part I 	\N	\N	\N	\N	\N	f	2025-07-26 21:22:03.593
20	90	Arnold	Koralee	2020-08-16 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
87	4	Carlisle	Levi	2011-05-04 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
59	68	Morris	Harland	2015-08-19 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
41	82	Nix	Fletcher	2018-04-18 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
75	44	Rawlings	Eliana	2015-07-31 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
73	28	Kilburn	Juliette	2014-10-08 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
16	16	Fein	Meghann	2021-06-04 05:00:00	2039	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
71	75	Hampton	Evie	2014-07-29 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
74	35	Merritt	Rett	2015-05-27 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
61	82	Nix	Oran	2016-07-10 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
62	88	Obholz	Ethan	2015-08-05 05:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
4	87	Pirtle	Joseph	2024-01-24 06:00:00	2042	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
22	12	DeLisi	Caedon*	2021-03-01 06:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	t	\N
79	18	Gaertner	Avett	2014-05-02 05:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
38	94	Hallonquist	Jace	2017-12-17 06:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
82	25	Hefner	Ava	2014-02-04 06:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
24	28	Kilburn	Luisa	2019-06-20 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
39	83	McGill	Mattie Jane	2018-06-19 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
51	42	Quinn	Emersyn	2016-11-10 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
53	44	Rawlings	Elliott	2017-06-23 05:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
63	53	Taylor	Noelle	2016-02-12 06:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
54	91	Whitton	Aubreigh	2016-09-15 05:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
12	60	Woods	Lily	2022-01-14 06:00:00	2040	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
28	90	Arnold	Kanaan	2018-09-11 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
23	16	Fein	DAX	2020-03-27 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
17	63	Nelson	Archer	2021-05-08 05:00:00	2039	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
3	83	McGill	Maverick	2023-07-31 05:00:00	2042	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
32	63	Nelson	Clara	2018-10-13 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
50	88	Obholz	Olivia	2017-05-28 05:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
42	70	Pedersen	Levi	2018-04-21 05:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
83	42	Quinn	Tucker	2014-04-04 05:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
85	60	Woods	Maddox	2014-07-23 05:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
19	2	Anderson2	Evelyn	2019-09-24 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
68	3	Binns	Luke	2014-02-05 06:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
9	97	Cannon	Logan	2022-04-28 05:00:00	2040	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
15	14	Dickson	Liliana	2020-11-01 05:00:00	2039	2039 true grad	\N	\N	\N	\N	\N	\N	\N	f	\N
47	75	Hampton	Hayes	2016-12-05 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
70	12	DeLisi	Craig*	2015-04-16 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	t	\N
58	83	McGill	Mabel	2016-02-03 06:00:00	2034	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
11	68	Morris	Sawyer	2022-07-09 05:00:00	2040	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
5	91	Whitton	Nova	2024-05-28 05:00:00	2042	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
77	57	Wilhite	Seren	2014-10-30 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
34	60	Woods	Raylee	2018-09-10 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
80	20	Gressley	Olivia	2014-01-11 06:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
81	22	Hall	Charlie	2014-06-30 05:00:00	2032	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
46	22	Hall	Naomi	2016-11-21 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
48	25	Hefner	Ellie	2016-12-09 06:00:00	2035	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
76	62	Rogers	Bethany	2015-08-19 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
13	61	Wyatt	Baron	2022-02-11 06:00:00	2040	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
66	1	Anderson	Zack	2015-02-07 06:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
7	98	Caswell	Allison	2022-10-26 05:00:00	2041	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
14	98	Caswell	Everett	2021-04-02 05:00:00	2039	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
10	28	Kilburn	Clara*	2021-12-21 06:00:00	2040	\N	\N	\N	\N	\N	\N	\N	\N	t	\N
31	68	Morris	Cooper	2019-03-12 05:00:00	2037	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
2	68	Morris	Susannah	2024-11-30 00:00:00	2043	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
25	70	Pedersen	Sky	2020-02-25 06:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
26	85	Roraback	Sammy*	2019-10-28 05:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	t	\N
43	61	Wyatt	Ian	2017-12-02 06:00:00	2036	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
27	61	Wyatt	Logan	2019-11-21 06:00:00	2038	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
184	1018	Lawrence	Baby	\N	2043		\N	\N	\N	\N	\N	\N	\N	f	\N
182	1018	Lawrence	Emmett	2019-09-26 00:00:00	2038		\N	\N	\N	\N	\N	\N	\N	f	\N
95	35	Merritt	Rokzen	2013-02-08 06:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
120	35	Merritt	Ryder	2010-12-12 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
127	52	Tagg	Isaac	2010-10-01 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
126	52	Tagg	Sophie	2010-10-01 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
128	53	Taylor	Asher	2010-12-17 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
102	12	DeLisi	Caleb	2011-09-10 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
103	13	Deornellis	Delaney	2011-04-05 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
104	16	Fein	Nolan	2012-08-16 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
91	22	Hall	Lucy	2013-03-16 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
92	94	Hallonquist	Lanna	2013-03-12 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
118	24	Harrison	Charlie	2010-04-22 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
108	82	Nix	Tucker	2011-05-30 05:00:00	2030	2029 true grad	\N	\N	\N	\N	\N	\N	\N	f	\N
112	53	Taylor	Hope	2012-08-23 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
99	54	Villone	Lily	2013-03-01 06:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
113	57	Wilhite	Bethany	2012-03-14 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
129	58	Wilson	Coley Sue	2011-02-26 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
132	84	Burkhalter	Caroline	2009-08-14 05:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
135	9	Coleman	Grady	2009-10-10 05:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
121	38	Nuss	Gwyneth	2011-01-04 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
122	76	Orr	Jaycee	2010-11-10 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
130	58	Wilson	Kip	2011-02-26 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
114	60	Woods	Autumn	2012-05-05 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
131	60	Woods	Eli	2010-08-08 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
100	66	Yarbrough	Evelyn	2013-01-10 06:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
133	4	Carlisle	Caleb	2009-12-10 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
134	5	Carpenter	Joshua	2009-12-31 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
117	7	Clayton	Ethan	2010-06-02 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
101	12	DeLisi	Bella	2011-09-10 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
115	1	Anderson	Joel	2010-11-09 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
105	18	Gaertner	Hadden	2012-04-05 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
90	14	Dickson	Rachel	2013-04-03 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
106	19	Glanzer	Joseph	2011-09-07 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
185	1020	Gomez	Elsa	2014-07-08 00:00:00	2032		\N	\N	\N	\N	\N	\N	\N	f	\N
93	26	Hefner	Blye	2013-01-21 06:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
119	25	Hefner	Ian	2011-03-11 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
107	71	Huddleston	Melanie	2011-08-03 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
94	28	Kilburn	Samuel	2013-05-28 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
183	1018	Lawrence	Andrew	2022-12-01 00:00:00	2041		\N	\N	\N	\N	\N	\N	\N	f	\N
123	40	Pickens	Avery	2010-09-20 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
124	42	Quinn	Landon	2010-12-16 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
97	43	Randolph	Isaac	2012-05-21 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
109	44	Rawlings	Caleb	2011-10-28 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
110	44	Rawlings	McKenna	2012-08-22 05:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
98	62	Rogers	Ariana	2013-07-06 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
125	62	Rogers	Noelle	2010-11-20 06:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
111	51	Souza	Annaleigh	2011-12-22 06:00:00	2030	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
159	5	Carpenter	Nathan	2007-12-09 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
150	78	Griffin	Judah	2009-09-22 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
166	45	Reed	Benjamin	2008-03-03 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
174	1015	Ridge	Hadley	2016-04-12 00:00:00	2035		\N	\N	\N	\N	\N	\N	\N	f	\N
173	1015	Ridge	Levi	2014-05-10 00:00:00	2033		\N	\N	\N	\N	\N	\N	\N	f	\N
145	3	Binns	Nathan	2009-08-18 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
158	4	Carlisle	Charlie	2008-03-29 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
175	1016	Edwards	Ramzee	2012-06-20 00:00:00	2030		\N	\N	\N	\N	\N	\N	\N	f	\N
162	75	Hampton	Dylan	2008-03-19 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
139	75	Hampton	Hensley	2009-12-12 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
163	25	Hefner	Eli	2008-07-09 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
142	85	Roraback	Silas	2009-09-08 05:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
178	1016	Shumate	Adler	2021-10-07 00:00:00	2040		\N	\N	\N	\N	\N	\N	\N	f	\N
177	1016	Shumate	David Nash	2020-07-15 00:00:00	2039		\N	\N	\N	\N	\N	\N	\N	f	\N
30	5	Carpenter	Hannah	2018-07-31 05:00:00	2037	2036 grad - may move back to grade level in 2025	\N	\N	\N	\N	\N	\N	\N	f	\N
69	5	Carpenter	Raquel	2014-09-19 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
146	14	Dickson	Jacob	2009-05-07 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
176	1016	Edwards	Seth McCoy	2014-02-24 00:00:00	2032		\N	\N	\N	\N	\N	\N	\N	f	\N
167	50	Smith	Allison	2008-02-12 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
143	51	Souza	Aaron	2009-12-28 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
153	51	Souza	Claire	2009-01-02 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
168	52	Tagg	Ariana	2008-06-14 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
144	1	Anderson	Caleb	2008-10-23 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
136	12	DeLisi	Caius	2009-04-22 05:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
140	26	Hefner	Milie Jo	2010-01-05 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
160	13	Deornellis	Dylan	2006-11-24 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
147	16	Fein	Wyatt	2008-11-25 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
169	54	Villone	Elijah	2008-02-15 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
161	15	Dublin	Holly	2007-08-22 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
137	15	Dublin	Olivia	2009-11-10 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
1	17	Friberg	Samuel	2014-08-05 05:00:00	2033	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
148	18	Gaertner	Silas	2009-02-14 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
138	19	Glanzer	Ruby	2009-08-05 05:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
149	20	Gressley	Grace	2009-01-11 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
181	1018	Lawrence	Franklin	2017-08-23 00:00:00	2036		\N	\N	\N	\N	\N	\N	\N	f	\N
141	82	Nix	Lilia	2010-01-14 06:00:00	2028	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
164	39	O'Rand	Mary	2007-09-11 05:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
151	76	Orr	Joshua	2008-01-11 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
96	95	Phifer	Madelyn	2009-05-06 05:00:00	2031	2030 true grad?	\N	\N	\N	\N	\N	\N	\N	f	\N
152	42	Quinn	Connor	2009-06-01 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
165	43	Randolph	JD	2007-11-30 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
180	1017	Waddell	Brooklyn	2015-10-26 00:00:00	2034		\N	\N	\N	\N	\N	\N	\N	f	\N
179	1017	Waddell	London	2014-02-13 00:00:00	2032		\N	\N	\N	\N	\N	\N	\N	f	\N
154	55	Wheeler	Sadie	2008-10-09 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
155	57	Wilhite	Anna	2009-01-05 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
156	58	Wilson	Cooper	2008-08-04 05:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
157	59	Wisner	Cody	2008-12-23 06:00:00	2027	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
170	60	Woods	Dawson	2008-02-09 06:00:00	2026	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
8	66	Yarbrough	Asa	2023-06-07 05:00:00	2041	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
116	2	Anderson2	Matthew	2011-04-18 05:00:00	2029	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
195	89	Anderson3	Baby	\N	2044		\N	\N	\N	\N	\N	\N	\N	f	\N
189	1021	Barkley	Beckett	2014-09-09 00:00:00	2033		\N	\N	\N	\N	\N	\N	\N	f	\N
190	1021	Barkley	Brynlee	2018-07-11 00:00:00	2037		\N	\N	\N	\N	\N	\N	\N	f	\N
194	92	Betancourt	Clementine	2024-12-10 00:00:00	2043		\N	\N	\N	\N	\N	\N	\N	f	\N
89	12	DeLisi	Abigail	2013-07-02 05:00:00	2031	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
193	17	Friberg	Erikk	2024-09-06 00:00:00	2043		\N	\N	\N	\N	\N	\N	\N	f	\N
186	1020	Gomez	Emmy	2014-07-08 00:00:00	2032		\N	\N	\N	\N	\N	\N	\N	f	\N
172	1015	Ridge	Weston	2012-08-07 00:00:00	2031		\N	\N	\N	\N	\N	\N	\N	f	\N
196	1022	Taylor2	Kylan	2014-09-19 00:00:00	2034	place back one grade level	\N	\N	\N	\N	\N	\N	\N	f	\N
197	1022	Taylor2	Liam	2016-09-21 00:00:00	2035		\N	\N	\N	\N	\N	\N	\N	f	\N
198	1022	VanBibber	Trey	2015-12-23 00:00:00	2034		\N	\N	\N	\N	\N	\N	\N	f	\N
191	61	Wyatt	Abigail	2025-03-02 00:00:00	2043		\N	\N	\N	\N	\N	\N	\N	f	\N
192	61	Wyatt	Avery	2025-03-02 00:00:00	2043		\N	\N	\N	\N	\N	\N	\N	f	\N
187	1019	Young	Kaseley	2014-01-29 00:00:00	2032		\N	\N	\N	\N	\N	\N	\N	f	\N
188	1019	Young	Kavryn	2019-04-08 00:00:00	2039		\N	\N	\N	\N	\N	\N	\N	f	\N
\.


--
-- TOC entry 4557 (class 0 OID 24705)
-- Dependencies: 236
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: chec
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4573 (class 0 OID 0)
-- Dependencies: 215
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 5, true);


--
-- TOC entry 4574 (class 0 OID 0)
-- Dependencies: 217
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.classes_id_seq', 10, true);


--
-- TOC entry 4575 (class 0 OID 0)
-- Dependencies: 219
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.courses_id_seq', 78, true);


--
-- TOC entry 4576 (class 0 OID 0)
-- Dependencies: 221
-- Name: families_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.families_id_seq', 1022, true);


--
-- TOC entry 4577 (class 0 OID 0)
-- Dependencies: 223
-- Name: former_families_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.former_families_id_seq', 1, false);


--
-- TOC entry 4578 (class 0 OID 0)
-- Dependencies: 225
-- Name: grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.grades_id_seq', 21, true);


--
-- TOC entry 4579 (class 0 OID 0)
-- Dependencies: 227
-- Name: hours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.hours_id_seq', 1, false);


--
-- TOC entry 4580 (class 0 OID 0)
-- Dependencies: 229
-- Name: parent_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.parent_users_id_seq', 1, true);


--
-- TOC entry 4581 (class 0 OID 0)
-- Dependencies: 232
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.settings_id_seq', 4, true);


--
-- TOC entry 4582 (class 0 OID 0)
-- Dependencies: 234
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chec
--

SELECT pg_catalog.setval('public.students_id_seq', 198, true);


--
-- TOC entry 4354 (class 2606 OID 24606)
-- Name: admin_users admin_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_unique UNIQUE (email);


--
-- TOC entry 4356 (class 2606 OID 24602)
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4358 (class 2606 OID 24604)
-- Name: admin_users admin_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_unique UNIQUE (username);


--
-- TOC entry 4360 (class 2606 OID 24613)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- TOC entry 4362 (class 2606 OID 24624)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 4364 (class 2606 OID 24634)
-- Name: families families_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_pkey PRIMARY KEY (id);


--
-- TOC entry 4366 (class 2606 OID 24643)
-- Name: former_families former_families_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.former_families
    ADD CONSTRAINT former_families_pkey PRIMARY KEY (id);


--
-- TOC entry 4368 (class 2606 OID 24650)
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- TOC entry 4370 (class 2606 OID 24657)
-- Name: hours hours_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.hours
    ADD CONSTRAINT hours_pkey PRIMARY KEY (id);


--
-- TOC entry 4372 (class 2606 OID 24674)
-- Name: parent_users parent_users_email_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.parent_users
    ADD CONSTRAINT parent_users_email_unique UNIQUE (email);


--
-- TOC entry 4374 (class 2606 OID 24670)
-- Name: parent_users parent_users_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.parent_users
    ADD CONSTRAINT parent_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4376 (class 2606 OID 24672)
-- Name: parent_users parent_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.parent_users
    ADD CONSTRAINT parent_users_username_unique UNIQUE (username);


--
-- TOC entry 4379 (class 2606 OID 24681)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 4381 (class 2606 OID 24694)
-- Name: settings settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_unique UNIQUE (key);


--
-- TOC entry 4383 (class 2606 OID 24692)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4385 (class 2606 OID 24704)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 4387 (class 2606 OID 24715)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4389 (class 2606 OID 24713)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4377 (class 1259 OID 24731)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: chec
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 4390 (class 2606 OID 24716)
-- Name: courses courses_class_id_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_class_id_classes_id_fk FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- TOC entry 4391 (class 2606 OID 24721)
-- Name: parent_users parent_users_family_id_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.parent_users
    ADD CONSTRAINT parent_users_family_id_families_id_fk FOREIGN KEY (family_id) REFERENCES public.families(id);


--
-- TOC entry 4392 (class 2606 OID 24726)
-- Name: students students_family_id_families_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: chec
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_family_id_families_id_fk FOREIGN KEY (family_id) REFERENCES public.families(id);


-- Completed on 2025-07-28 10:31:35 CDT

--
-- PostgreSQL database dump complete
--

