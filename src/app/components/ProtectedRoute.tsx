// components/ProtectedRoute.tsx
"use client";

import { useUser } from "@/lib/context/Usercontext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Cargando</p>
      </div>
    );
  }

  return <>{children}</>;
};


