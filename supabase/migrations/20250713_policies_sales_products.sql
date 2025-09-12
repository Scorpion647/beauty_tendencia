-- Activar RLS en la tabla
ALTER TABLE ventas_productos ENABLE ROW LEVEL SECURITY;

-- 🔸 SELECT para admin, developer y cashier
CREATE POLICY select_allowed_roles ON ventas_productos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'developer', 'cashier')
    )
  );

-- 🔸 INSERT para admin, developer y cashier
CREATE POLICY insert_allowed_roles ON ventas_productos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'developer', 'cashier')
    )
  );

-- 🔸 UPDATE solo para admin y developer (no cashier)
CREATE POLICY update_admin_developer_only ON ventas_productos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'developer')
    )
  );

-- 🔸 DELETE para admin, developer y cashier
CREATE POLICY delete_allowed_roles ON ventas_productos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.rol IN ('admin', 'developer', 'cashier')
    )
  );
