-- 02_ventas_productos.sql
create table if not exists ventas_productos (
  id bigserial primary key,
  producto_id bigint references productos(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  descuento integer check (descuento between 1 and 100),
  total numeric(10,2) not null,
  created_at timestamp with time zone default timezone('utc', now())
);
