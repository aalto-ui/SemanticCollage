create table users
(
  id           serial      not null
    constraint users_pkey
      primary key,
  name         varchar(50) not null,
  start_time   integer,
  end_time     integer,
  task         varchar(50),
  reward       integer,
  image1       integer,
  image2       integer,
  regret       double precision default 0.0,
  sat1         double precision default 0.85,
  sat2         double precision default 0.25,
  temp1        double precision default 0.9,
  temp2        double precision default 0.5,
  orientation1 integer,
  distance1    double precision,
  orientation2 integer,
  distance2    double precision
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO research;