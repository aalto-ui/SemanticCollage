create table images
(
  id         serial       not null
    constraint images_pkey
      primary key,
  name       varchar(256) not null,
  location   varchar(300) not null,
  width      integer      not null,
  height     integer      not null,
  query_word varchar(256),
  url        varchar(256),
  labels     character varying[],
  palette    character varying[]
);



GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO research;