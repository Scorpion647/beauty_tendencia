// lib/supabase/recoverypassword.ts
import { supabase } from '@/lib/supabaseClient';

type RecoveryResult =
  | { success: true; data: {} }
  | { success: false; message: string; retryAfter?: number };

export async function sendPasswordRecoveryEmail(email: string): Promise<RecoveryResult> {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    // intentar extraer "after N seconds"
    const m = error.message.match(/after\s+(\d+)\s+seconds/i);
    const retryAfter = m ? Number(m[1]) : undefined;
    return { success: false, message: error.message, retryAfter };
  }

  return { success: true, data };
}

