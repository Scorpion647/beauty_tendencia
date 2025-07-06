-- 01_productos.sql
create table if not exists productos (
  id bigserial primary key,
  nombre text unique not null,
  cantidad integer not null default 0,
  precio numeric(10,2) not null default 0,
  descuento integer check (descuento between 1 and 100), -- puede ser null
  created_at timestamp with time zone default timezone('utc', now())
);

