// components/LogoutComponent.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutComponent() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      await supabase.auth.signOut();
      router.push("/");
    };

    doLogout();
  }, [router]);

  return null; // No muestra nada mientras cierra sesión
}
