-- ===========================================
-- 🔐 POLICIES PARA sales_records
-- ===========================================

-- 1. Habilitamos RLS
ALTER TABLE public.sales_records
  ENABLE ROW LEVEL SECURITY,
  FORCE ROW LEVEL SECURITY;

-- 2. INSERT: cashier, admin, developer pueden crear para cualquier user_id
DROP POLICY IF EXISTS "Insert: sales_records" ON public.sales_records;
CREATE POLICY "Insert: sales_records"
  ON public.sales_records
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('cashier', 'admin', 'developer')
  );

-- 3. UPDATE: solo para modificar sus propios registros
DROP POLICY IF EXISTS "Update: sales_records" ON public.sales_records;
CREATE POLICY "Update: sales_records"
  ON public.sales_records
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('cashier', 'admin', 'developer')
    AND user_id = auth.uid()
  )
  WITH CHECK (
    get_user_role(auth.uid()) IN ('cashier', 'admin', 'developer')
    AND user_id = auth.uid()
  );

-- 4. DELETE: igual que UPDATE
DROP POLICY IF EXISTS "Delete: sales_records" ON public.sales_records;
CREATE POLICY "Delete: sales_records"
  ON public.sales_records
  FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('cashier', 'admin', 'developer')
    AND user_id = auth.uid()
  );

-- 5. SELECT: tres niveles

-- a) Developer ve TODO
DROP POLICY IF EXISTS "Select: sales_records developers" ON public.sales_records;
CREATE POLICY "Select: sales_records developers"
  ON public.sales_records
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'developer'
  );

-- b) Admin y Cashier ven sus registros y los de otros no-developers
DROP POLICY IF EXISTS "Select: sales_records admin_cashier" ON public.sales_records;
CREATE POLICY "Select: sales_records admin_cashier"
  ON public.sales_records
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('admin', 'cashier')
    AND (
      user_id = auth.uid()
      OR get_user_role(user_id) <> 'developer'
    )
  );

-- c) Resto de roles: solo sus propios registros
DROP POLICY IF EXISTS "Select: sales_records self" ON public.sales_records;
CREATE POLICY "Select: sales_records self"
  ON public.sales_records
  FOR SELECT
  USING (
    user_id = auth.uid()
  );



-- ===========================================
-- 🔐 POLICIES PARA sales_items
-- ===========================================

-- 1. Habilitamos RLS
ALTER TABLE public.sales_items
  ENABLE ROW LEVEL SECURITY,
  FORCE ROW LEVEL SECURITY;

-- 2. INSERT: cashier, admin, developer pueden agregar ítems si:
--    - son dueños de la venta
--    - o si son admin o developer
DROP POLICY IF EXISTS "Insert: sales_items" ON public.sales_items;
CREATE POLICY "Insert: sales_items"
  ON public.sales_items
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('cashier','admin','developer')
    AND (
      auth.uid() = (
        SELECT user_id FROM public.sales_records WHERE id = sale_id
      )
      OR get_user_role(auth.uid()) IN ('admin', 'developer')
    )
  );

-- 3. UPDATE: igual que INSERT
DROP POLICY IF EXISTS "Update: sales_items" ON public.sales_items;
CREATE POLICY "Update: sales_items"
  ON public.sales_items
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('cashier','admin','developer')
    AND (
      auth.uid() = (
        SELECT user_id FROM public.sales_records WHERE id = sale_id
      )
      OR get_user_role(auth.uid()) IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) IN ('cashier','admin','developer')
    AND (
      auth.uid() = (
        SELECT user_id FROM public.sales_records WHERE id = sale_id
      )
      OR get_user_role(auth.uid()) IN ('admin', 'developer')
    )
  );

-- 4. DELETE: igual que UPDATE
DROP POLICY IF EXISTS "Delete: sales_items" ON public.sales_items;
CREATE POLICY "Delete: sales_items"
  ON public.sales_items
  FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('cashier','admin','developer')
    AND (
      auth.uid() = (
        SELECT user_id FROM public.sales_records WHERE id = sale_id
      )
      OR get_user_role(auth.uid()) IN ('admin', 'developer')
    )
  );

-- 5. SELECT: tres niveles

-- a) Developer ve TODO
DROP POLICY IF EXISTS "Select: sales_items developers" ON public.sales_items;
CREATE POLICY "Select: sales_items developers"
  ON public.sales_items
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'developer'
  );

-- b) Admin y Cashier ven ítems de sus ventas y de otros no-developers
DROP POLICY IF EXISTS "Select: sales_items admin_cashier" ON public.sales_items;
CREATE POLICY "Select: sales_items admin_cashier"
  ON public.sales_items
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('admin','cashier')
    AND (
      (SELECT user_id FROM public.sales_records WHERE id = sale_id) = auth.uid()
      OR get_user_role(
           (SELECT user_id FROM public.sales_records WHERE id = sale_id)
         ) <> 'developer'
    )
  );

-- c) Otros roles: solo sus ítems
DROP POLICY IF EXISTS "Select: sales_items self" ON public.sales_items;
CREATE POLICY "Select: sales_items self"
  ON public.sales_items
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.sales_records WHERE id = sale_id
    )
  );




