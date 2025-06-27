CREATE TABLE public.servicios_peluqueria (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
