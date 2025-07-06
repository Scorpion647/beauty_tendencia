"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordReset = async () => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setChanged(true);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Restablecer contraseña</h2>
      {changed ? (
        <p className="text-green-600">¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.</p>
      ) : (
        <>
          <input
            type="password"
            value={newPassword}
            placeholder="Nueva contraseña"
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 w-full mb-2 rounded"
          />
          {error && <p className="text-red-600">{error}</p>}
          <button
            onClick={handlePasswordReset}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Cambiar contraseña
          </button>
        </>
      )}
    </div>
  );
}
