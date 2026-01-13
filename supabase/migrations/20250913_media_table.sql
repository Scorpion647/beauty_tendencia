-- media_table.sql
-- Crea la tabla public.media_items para guardar metadatos de imágenes/videos

-- 1) Extensión para gen_random_uuid (si no existe)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Tipo ENUM para secciones (opcionales, más seguro que usar text)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_section') THEN
    CREATE TYPE public.media_section AS ENUM ('inicio', 'nosotros', 'ofertas');
  END IF;
END$$;

-- 3) Tabla de media items
CREATE TABLE IF NOT EXISTS public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,                       -- URL pública o path en storage
  storage_path text,                       -- ruta/clave dentro del bucket (opcional)
  mime_type text,
  section public.media_section,            -- 'inicio' | 'nosotros' | 'ofertas' | null
  "order" integer DEFAULT 0,               -- orden dentro de su sección
  position text,                           -- CSS position (ej: '50% 25%' o 'top')
  owner uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- quien subió (debe coincidir con auth.uid())
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Índices útiles
CREATE INDEX IF NOT EXISTS idx_media_items_section_order ON public.media_items (section, "order");
CREATE INDEX IF NOT EXISTS idx_media_items_owner ON public.media_items (owner);

-- 5) Trigger para updated_at (si ya existe la función, la reemplaza / asegura que exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_media_items ON public.media_items;

CREATE TRIGGER set_timestamp_media_items
  BEFORE UPDATE ON public.media_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();


-- Trigger para asignar siempre el owner = auth.uid()
CREATE OR REPLACE FUNCTION public.set_media_owner()
RETURNS trigger AS $$
BEGIN
  NEW.owner := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_media_owner ON public.media_items;
CREATE TRIGGER set_media_owner
  BEFORE INSERT ON public.media_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_media_owner();

