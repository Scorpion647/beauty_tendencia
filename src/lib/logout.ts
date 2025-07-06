// lib/logout.ts
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // redirige al inicio
  };

  return { logout };
}
