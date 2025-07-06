import { supabase } from "@/lib/supabaseClient";

export async function sendPasswordRecoveryEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
});


  if (error) {
    throw new Error(error.message);
  }

  return data;
}
