// src/lib/getCurrentSession.ts
"use client";

import { supabase } from "./supabaseClient";

export type CurrentSession = {
  session: import("@supabase/supabase-js").Session;
  userAuth: import("@supabase/supabase-js").User;
  userProfile: {
    id: string;
    nombres: string;
    apellidos: string;
    celular: string;
    correo: string;
    rol: string;
    created_at: string;
    updated_at: string;
  } | null;
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  // 1. Obtener la sesión
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Error obteniendo la sesión:", sessionError);
    return null;
  }

  // 2. Obtener datos de Auth (email, id, etc.)
  const {
    data: { user: userAuth },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !userAuth) {
    console.error("Error obteniendo datos de usuario Auth:", userError);
    return null;
  }

  // 3. Obtener perfil extendido desde tu tabla `users`
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id, nombres, apellidos, celular, correo, rol, created_at, updated_at")
    .eq("id", userAuth.id)
    .single();

  if (profileError) {
    console.error("Error obteniendo perfil de usuario:", profileError);
  }

  return {
    session,
    userAuth,
    userProfile: userProfile ?? null,
  };
}

