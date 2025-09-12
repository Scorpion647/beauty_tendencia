"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function useHandleLoginRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  async function redirect() {
    // ⚠️ No redirigir si ya estamos en reset-password
    if (pathname.startsWith("/reset-password")) return;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("Error al obtener la sesión:", sessionError);
      return;
    }

    const userId = session.user.id;
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("Error al obtener los datos del usuario:", userError);
      return;
    }

    switch (userData.rol) {
      case "admin":
      case "employee":
      case "cashier":
      case "guest":
      case "developer":
        router.push("/admin/home");
        break;
      default:
        router.push("/");
        break;
    }
  }

  return { redirect };
}
