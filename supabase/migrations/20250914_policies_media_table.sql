-- media_policies.sql
-- Habilita Row Level Security (RLS) y crea políticas:
-- - SELECT: público (true) -> cualquier persona puede leer la tabla
-- - INSERT/UPDATE/DELETE: solo usuarios con rol 'admin' o 'developer' (según public.users)

-- Importante: asegúrate de que tu tabla public.users tenga filas con id = auth.users.id y el campo rol (user_role enum)
-- El check de rol se hace consultando public.users u WHERE u.id = auth.uid()

-- 1) Habilitar RLS
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- 2) Política SELECT (público)
DROP POLICY IF EXISTS "Allow select to everyone" ON public.media_items;
CREATE POLICY "Allow select to everyone"
  ON public.media_items
  FOR SELECT
  USING ( true );

-- SELECT (cualquiera puede leer archivos)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  USING (true);

-- 3) Política INSERT (solo admin o developer)
DROP POLICY IF EXISTS "Insert only admin_developer" ON public.media_items;
CREATE POLICY "Insert only admin_developer"
  ON public.media_items
  FOR INSERT
  WITH CHECK (
    owner = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin','developer')
    )
  );

-- INSERT (solo admin y developer pueden subir)
DROP POLICY IF EXISTS "Only admin/developer can upload" ON storage.objects;
CREATE POLICY "Only admin/developer can upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.rol IN ('admin','developer')
    )
  );


-- 4) Política UPDATE (solo admin o developer)
DROP POLICY IF EXISTS "Update only admin_developer" ON public.media_items;
CREATE POLICY "Update only admin_developer"
  ON public.media_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin','developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin','developer')
    )
  );

-- 5) Política DELETE (solo admin o developer)
DROP POLICY IF EXISTS "Delete only admin_developer" ON public.media_items;
CREATE POLICY "Delete only admin_developer"
  ON public.media_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin','developer')
    )
  );

-- DELETE (solo admin y developer pueden borrar)
DROP POLICY IF EXISTS "Only admin/developer can delete" ON storage.objects;
CREATE POLICY "Only admin/developer can delete"
  ON storage.objects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.rol IN ('admin','developer')
    )
  );

-- Nota: los service roles (service_role) usan la clave secreta y siempre ignoran RLS — útil para trabajo backend automatizado.
