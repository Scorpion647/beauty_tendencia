// src/lib/auth.ts (o donde quieras)

import { supabase } from "./supabaseClient";

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Puedes personalizar este throw o manejar el error desde el componente
    throw new Error(error.message);
  }

  return data; // data.user y data.session si todo va bien
}
