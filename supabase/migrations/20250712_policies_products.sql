-- 🔐 1. Habilitar RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- 🔍 2. SELECT Policies

-- a) Admin puede seleccionar
CREATE POLICY admin_can_select_productos ON public.productos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- b) Developer puede seleccionar
CREATE POLICY developer_can_select_productos ON public.productos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'developer'
    )
  );

-- c) Cashier puede seleccionar
CREATE POLICY cashier_can_select_productos ON public.productos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'cashier'
    )
  );

-- ✍️ 3. INSERT Policies (solo admin y developer)

CREATE POLICY admin_can_insert_productos ON public.productos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY developer_can_insert_productos ON public.productos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'developer'
    )
  );

-- 🛠️ 4. UPDATE Policies (solo admin y developer)

CREATE POLICY admin_can_update_productos ON public.productos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY developer_can_update_productos ON public.productos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'developer'
    )
  );

-- 🗑️ 5. DELETE Policies (solo admin y developer)

CREATE POLICY admin_can_delete_productos ON public.productos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY developer_can_delete_productos ON public.productos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND rol = 'developer'
    )
  );

