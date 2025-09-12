-- 🔐 Habilitar Row-Level Security
ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;

-- 🔸 SELECT Policies

-- 1. Los developers pueden ver todos los registros
CREATE POLICY dev_can_read_all ON public.employee_loans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = auth.uid() AND u.rol = 'developer'
    )
  );

-- 2. Los usuarios pueden ver sus propios registros
CREATE POLICY self_can_read_own ON public.employee_loans
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- 3. El admin puede ver todos los registros excepto los de developers
CREATE POLICY admin_can_read_non_dev ON public.employee_loans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u_admin
      WHERE u_admin.id = auth.uid() AND u_admin.rol = 'admin'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.users AS record_owner
      WHERE record_owner.id = user_id AND record_owner.rol = 'developer'
    )
  );

-- 🔸 INSERT / UPDATE / DELETE Policies

-- 4. Los developers pueden insertar, actualizar y eliminar cualquier registro
CREATE POLICY dev_can_write_all ON public.employee_loans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u
      WHERE u.id = auth.uid() AND u.rol = 'developer'
    )
  )
  WITH CHECK (
    TRUE
  );

-- 5. El admin puede insertar, actualizar y eliminar registros que no sean de developers
CREATE POLICY admin_can_write_non_dev ON public.employee_loans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS u_admin
      WHERE u_admin.id = auth.uid() AND u_admin.rol = 'admin'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.users AS record_owner
      WHERE record_owner.id = user_id AND record_owner.rol = 'developer'
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1
      FROM public.users AS record_owner
      WHERE record_owner.id = user_id AND record_owner.rol = 'developer'
    )
  );

