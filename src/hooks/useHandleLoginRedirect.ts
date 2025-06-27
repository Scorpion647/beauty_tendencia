"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function useHandleLoginRedirect() {
  const router = useRouter();

  async function redirect() {
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
        router.push("/admin/home");
        break;
      case "employee":
        router.push("/admin/home");
        break;
      default:
        router.push("/");
        break;
    }
  }

  return { redirect };
}