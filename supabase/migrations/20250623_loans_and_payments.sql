CREATE TABLE public.employee_loans (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tipo_operacion TEXT CHECK (tipo_operacion IN ('prestamo', 'abono')) NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
