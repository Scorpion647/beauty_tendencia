// lib/supabase/recoverypassword.ts
import { supabase } from '@/lib/supabaseClient';

type RecoveryResult =
  | { success: true; data: unknown }
  | { success: false; message: string; retryAfter?: number };

export async function sendPasswordRecoveryEmail(email: string): Promise<RecoveryResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (!siteUrl) {
    return {
      success: false,
      message: 'No se pudo determinar la URL del sitio para el enlace de recuperación.',
    };
  }

  const redirectTo = `${siteUrl.replace(/\/$/, '')}/reset-password`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    // intentar extraer "after N seconds"
    const m = error.message.match(/after\s+(\d+)\s+seconds/i);
    const retryAfter = m ? Number(m[1]) : undefined;
    return { success: false, message: error.message, retryAfter };
  }

  return { success: true, data };
}

