-- policies_users.sql

-- 1) Funciones helper (SECURITY DEFINER) para evitar recursión en RLS
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT rol
  FROM public.users
  WHERE id = uid
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_created_at(uid uuid)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT created_at
  FROM public.users
  WHERE id = uid
  LIMIT 1;
$$;



-- 2) Habilitar y forzar RLS en la tabla
--------------------------------------------------------------------------------
ALTER TABLE public.users
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users
  FORCE ROW LEVEL SECURITY;


-- 3) Políticas de INSERT y DELETE
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Insert: solo admin o developer" ON public.users;
CREATE POLICY "Insert: solo admin o developer"
  ON public.users
  FOR INSERT
  WITH CHECK (
    -- puede insertarse a sí mismo
    auth.uid() = id
    -- o si es admin/dev
    OR get_user_role(auth.uid()) IN ('admin', 'developer')
  );



DROP POLICY IF EXISTS "Delete: solo admin o developer" ON public.users;
CREATE POLICY "Delete: solo admin o developer"
  ON public.users
  FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('admin', 'developer')
  );


-- 4) Políticas de UPDATE
--------------------------------------------------------------------------------
-- 4.1) Self‑update: cada usuario actualiza sólo SU registro, sin cambiar rol ni created_at
DROP POLICY IF EXISTS "Update: self (sin cambiar rol)" ON public.users;
CREATE POLICY "Update: self (sin cambiar rol)"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
  )
  WITH CHECK (
    -- sigue siendo su propio registro
    auth.uid() = id
    -- no puede cambiar su rol
    AND rol = get_user_role(auth.uid())
    -- no puede cambiar created_at
    AND created_at = get_user_created_at(auth.uid())
  );

-- 4.2) Admin/Developer update: pueden actualizar cualquier fila e incluso cambiar rol, pero sin alterar created_at
DROP POLICY IF EXISTS "Update: admin/developer (incluye rol)" ON public.users;
CREATE POLICY "Update: admin/developer (incluye rol)"
  ON public.users
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    -- created_at debe permanecer igual al valor original
    created_at = get_user_created_at(id)
  );


-- 5) Políticas de SELECT
--------------------------------------------------------------------------------
-- 5.1) Developers ven TODO, incluyendo otros developers
DROP POLICY IF EXISTS "Select: developers ven todo" ON public.users;
CREATE POLICY "Select: developers ven todo"
  ON public.users
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'developer'
  );

-- 5.2) Admin y Cashier ven todos menos a los developers
DROP POLICY IF EXISTS "Select: admin y cashier (sin developers)" ON public.users;
CREATE POLICY "Select: admin y cashier (sin developers)"
  ON public.users
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('admin', 'cashier')
    AND rol <> 'developer'
  );

-- 5.3) Resto de roles solo pueden ver su propio registro
DROP POLICY IF EXISTS "Select: solo puedes ver tu propio registro" ON public.users;
CREATE POLICY "Select: solo puedes ver tu propio registro"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
  );





