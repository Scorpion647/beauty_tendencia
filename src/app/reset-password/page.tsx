'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const type = params.get('type'); // debería ser 'recovery'
        console.log('[reset] params:', { tokenHash, type });

        if (tokenHash && type === 'recovery') {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          console.log('[reset] verifyOtp:', { data, verifyError });
          if (verifyError) throw verifyError;
          if (data?.session) {
            setReady(true);
            return;
          }
        }

        // fallback: si había session previa
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setReady(true);
          return;
        }

        setReady(false);
      } catch (err) {
        const error = err as Error
        console.error('[reset] error procesando token_hash:', error);
        setError(error?.message ?? 'No se pudo procesar el enlace de recuperación.');
        setReady(false);
      }
    })();
  }, []);

  const handlePasswordReset = async () => {
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setMessage('¡Contraseña actualizada con éxito! Redirigiendo...');
      setTimeout(() => router.push('/'), 1300);
    } catch (err) {
      const error = err as Error;
      console.error('[reset] updateUser error:', error);
      setError(error.message ?? 'Error actualizando la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-extrabold text-center text-black mb-4">Restablecer contraseña</h1>

        {!ready && !error && (
          <p className="text-center text-gray-600 mb-4">
            Procesando enlace de recuperación... si no funciona, revisa la plantilla de correo en Supabase.
          </p>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">{message}</div>}

        {ready ? (
          <>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded mb-3 placeholder-pink-400"
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded mb-3 placeholder-pink-400"
            />
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className={`w-full py-2 rounded ${loading ? 'bg-gray-400 text-black' : 'bg-pink-800 text-white hover:bg-pink-700'}`}
            >
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-4">
              No se detectó un enlace válido. Asegúrate de usar el enlace enviado por correo.
            </p>
            <div className="flex gap-2">
              <button onClick={() => router.push('/')} className="flex-1 py-2 bg-gray-200 rounded">Volver</button>
              <button onClick={() => router.push('/')} className="flex-1 py-2 bg-pink-800 text-white rounded">Solicitar enlace</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







