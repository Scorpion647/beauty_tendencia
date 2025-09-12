-- 1. Crear tipo ENUM para roles
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'employee',
  'cashier',
  'guest',
  'developer'
);

-- 2. Crear tabla public.users utilizando el tipo ENUM para la columna rol
CREATE TABLE public.users (
  id uuid PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  celular text NOT NULL,
  correo text NOT NULL UNIQUE,
  rol public.user_role NOT NULL DEFAULT 'guest',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Función y trigger para mantener updated_at al actualizar
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.users;

CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
