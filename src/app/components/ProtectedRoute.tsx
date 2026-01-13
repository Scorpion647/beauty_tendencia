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
      <div className="flex flex-col justify-center items-center min-h-screen bg-pink-800">
        {/* Logo o imagen */}
        <img
          src="/Tendencia.png"
          alt="Cargando..."
          width={80}
          height={80}
          className="animate-bounce mb-6"
        />

        {/* Loader animado */}
        <div className="flex space-x-2">
          <span className="w-3 h-3 bg-[#F1D803] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
          <span className="w-3 h-3 bg-[#F1D803] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
          <span className="w-3 h-3 bg-[#F1D803] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
        </div>

        {/* Texto */}
        <p className="mt-6 text-white text-lg font-semibold tracking-wide">
          Cargando...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};



