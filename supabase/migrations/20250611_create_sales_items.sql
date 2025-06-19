-- Crear tabla de ítems individuales de venta (sales_items)
CREATE TABLE IF NOT EXISTS public.sales_items (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          uuid           NOT NULL REFERENCES public.sales_records(id) ON DELETE CASCADE,
  service_name     text           NOT NULL,
  service_cost     numeric(12,2)  NOT NULL CHECK (service_cost >= 0),
  employee_earnings numeric(12,2) NOT NULL DEFAULT 0 CHECK (employee_earnings >= 0 AND employee_earnings <= service_cost),
  service_quantity integer        NOT NULL DEFAULT 1 CHECK (service_quantity >= 1),
  sale_date        timestamptz    NOT NULL DEFAULT now(),
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now()
);

-- Trigger para updated_at en sales_items
CREATE OR REPLACE FUNCTION public.update_sales_items_updated_at()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_items_set_timestamp ON public.sales_items;

CREATE TRIGGER sales_items_set_timestamp
  BEFORE UPDATE ON public.sales_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_sales_items_updated_at();

-- Índice para mejorar búsqueda por venta
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items (sale_id);
