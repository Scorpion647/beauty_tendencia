import { supabase } from "@/lib/supabaseClient";

export async function changePasswordLoggedIn(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
