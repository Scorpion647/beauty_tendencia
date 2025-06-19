-- Crear ENUM para métodos de pago
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM (
      'cash',
      'card',
      'transaction'
    );
  END IF;
END$$;

-- Crear tabla de registros de venta (sales_records)
CREATE TABLE IF NOT EXISTS public.sales_records (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_code        text           NOT NULL UNIQUE,
  payment_method   public.payment_method NOT NULL,
  total_amount     numeric(12,2)  NOT NULL CHECK (total_amount >= 0),
  earnings_amount  numeric(12,2)  NOT NULL DEFAULT 0 CHECK (earnings_amount >= 0 AND earnings_amount <= total_amount),
  sale_date        timestamptz    NOT NULL DEFAULT now(),
  user_id          uuid           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notes            text,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now()
);

-- Trigger para updated_at en sales_records
CREATE OR REPLACE FUNCTION public.update_sales_updated_at()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_set_timestamp ON public.sales_records;

CREATE TRIGGER sales_set_timestamp
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_sales_updated_at();

-- Índice para mejorar búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON public.sales_records (user_id);

