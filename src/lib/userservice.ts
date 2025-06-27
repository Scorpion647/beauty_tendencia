// src/lib/userService.ts

import { supabase } from "./supabaseClient";



interface CreateUserPayload {
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  rol?: string;
}

/**
 * Crea un nuevo usuario en Auth (con password = correo y email ya confirmado)
 * y luego inserta su información en la tabla `public.users`.
 */
export async function createUser(name: string, lastname: string, phone: string, email: string, userrol: string, {
    nombres, apellidos, celular, correo, rol = "guest",
}: CreateUserPayload) {
  // 1) Crear el usuario en Auth con contraseña = correo y email_confirm = true
  const { data, error: authError } = await supabase.auth.admin.createUser({
    email: correo,
    password: correo,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Error al crear usuario en Auth: ${authError.message}`);
  }
  if (!data || !data.user || !data.user.id) {
    throw new Error("No se recibió el ID del usuario recién creado en Auth.");
  }

  const userId = data.user.id;

  // 2) Insertar el resto de los datos en la tabla public.users
  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert([
      {
        id: userId,
        nombres,
        apellidos,
        celular,
        correo,
        rol,
      },
    ])
    .select("*")
    .single();

  if (insertError) {
    // Opcional: si falla la inserción en public.users, podrías eliminar el usuario en Auth:
    // await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Error al insertar en public.users: ${insertError.message}`);
  }

  return {
    authUserId: userId,
    userData: inserted,
  };
}

/**
 * Elimina un usuario tanto de Auth como de la tabla `public.users`, dado su userId.
 */
export async function deleteUser(userId: string) {
  if (!userId) {
    throw new Error("Debes proporcionar el ID del usuario a eliminar.");
  }

  // 1) Borrar de Auth
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
    userId
  );
  if (deleteAuthError) {
    throw new Error(`Error al eliminar usuario en Auth: ${deleteAuthError.message}`);
  }

  // 2) Borrar de public.users (si tienes ON DELETE CASCADE tal vez no sea necesario)
  const { error: deleteRowError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (deleteRowError) {
    throw new Error(
      `Error al eliminar fila en public.users: ${deleteRowError.message}`
    );
  }

  return { message: "Usuario eliminado correctamente." };
}

export async function listUsers(page: number, limit: number) {
  // Calculamos el índice inicial y final para Supabase.range()
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Error al obtener usuarios: ${error.message}`);
  }

  return data || [];
}