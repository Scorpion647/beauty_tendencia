-- Tighten employee loan policies and let cashiers insert sale items
-- for non-developer employee sales.

ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_can_read_all ON public.employee_loans;
DROP POLICY IF EXISTS self_can_read_own ON public.employee_loans;
DROP POLICY IF EXISTS admin_can_read_non_dev ON public.employee_loans;
DROP POLICY IF EXISTS dev_can_write_all ON public.employee_loans;
DROP POLICY IF EXISTS admin_can_write_non_dev ON public.employee_loans;

CREATE POLICY "Select: employee_loans developers"
  ON public.employee_loans
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'developer'
  );

CREATE POLICY "Select: employee_loans admin non-dev"
  ON public.employee_loans
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'admin'
    AND get_user_role(user_id) <> 'developer'
  );

CREATE POLICY "Select: employee_loans self"
  ON public.employee_loans
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Insert: employee_loans admin/developer"
  ON public.employee_loans
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) = 'admin'
      AND get_user_role(user_id) <> 'developer'
    )
  );

CREATE POLICY "Update: employee_loans admin/developer"
  ON public.employee_loans
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) = 'admin'
      AND get_user_role(user_id) <> 'developer'
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) = 'admin'
      AND get_user_role(user_id) <> 'developer'
    )
  );

CREATE POLICY "Delete: employee_loans admin/developer"
  ON public.employee_loans
  FOR DELETE
  USING (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) = 'admin'
      AND get_user_role(user_id) <> 'developer'
    )
  );

DROP POLICY IF EXISTS "Insert: sales_records" ON public.sales_records;
CREATE POLICY "Insert: sales_records"
  ON public.sales_records
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) IN ('cashier', 'admin')
      AND get_user_role(user_id) <> 'developer'
    )
  );

DROP POLICY IF EXISTS "Insert: sales_items" ON public.sales_items;
CREATE POLICY "Insert: sales_items"
  ON public.sales_items
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) IN ('cashier', 'admin')
      AND get_user_role(
        (SELECT user_id FROM public.sales_records WHERE id = sale_id)
      ) <> 'developer'
    )
  );

DROP POLICY IF EXISTS "Update: sales_items" ON public.sales_items;
CREATE POLICY "Update: sales_items"
  ON public.sales_items
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) IN ('cashier', 'admin')
      AND get_user_role(
        (SELECT user_id FROM public.sales_records WHERE id = sale_id)
      ) <> 'developer'
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) IN ('cashier', 'admin')
      AND get_user_role(
        (SELECT user_id FROM public.sales_records WHERE id = sale_id)
      ) <> 'developer'
    )
  );

DROP POLICY IF EXISTS "Delete: sales_items" ON public.sales_items;
CREATE POLICY "Delete: sales_items"
  ON public.sales_items
  FOR DELETE
  USING (
    get_user_role(auth.uid()) = 'developer'
    OR (
      get_user_role(auth.uid()) IN ('cashier', 'admin')
      AND get_user_role(
        (SELECT user_id FROM public.sales_records WHERE id = sale_id)
      ) <> 'developer'
    )
  );
