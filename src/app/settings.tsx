'use client';

import { useState } from 'react';
import { changePasswordLoggedIn } from '@/lib/supabase/chagespasswordlogin';
import { Toast, ToastToggle } from 'flowbite-react';
import { HiCheckCircle } from 'react-icons/hi';
import Accessmodal from './components/accessmodal';

export const SettingsPanel = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setCaptcha('');
  };

  // Validaciones de contraseña
  const getPasswordValidations = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const validations = getPasswordValidations(newPassword);
  const allValid = validations.minLength && validations.hasLetter && validations.hasNumber;

  const handleChangePassword = async () => {
    if (!allValid) {
      setErrorMsg('La contraseña no cumple con los requisitos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    if (captcha.trim() !== '5') {
      setErrorMsg('Captcha incorrecto. Por favor responde correctamente la pregunta.');
      return;
    }

    try {
      setLoading(true);
      await changePasswordLoggedIn(newPassword);
      setSuccessMsg('Contraseña actualizada con éxito');
      closeModal();
    } catch (error) {
      const err = error as Error
      setErrorMsg(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-pink-100 border border-gray-700 rounded-xl p-4 shadow-md">
        <div className="text-center mb-3">
          <p className="text-xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            Configuración
          </p>
        </div>

        <button
          onClick={openModal}
          className="w-full h-10 rounded font-semibold bg-pink-600 text-yellow-300 hover:opacity-90"
        >
          Cambiar contraseña
        </button>

        {/* Modal */}
        <Accessmodal isOpen={isModalOpen} onClose={closeModal}>
          <div className="w-full">
            <div className="mb-4 text-center text-lg font-semibold text-black">
              Cambiar contraseña
            </div>

            <div className="mb-3">
              <label className="text-sm text-black font-medium">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full h-10 px-2 rounded bg-white text-black border border-gray-700 focus:border-pink-600 focus:outline-none"
                disabled={loading}
              />
              <ul className="mt-2 text-xs pl-4 list-disc space-y-1">
                <li className={validations.minLength ? 'text-green-600' : 'text-red-600'}>
                  Mínimo 8 caracteres
                </li>
                <li className={validations.hasLetter ? 'text-green-600' : 'text-red-600'}>
                  Contiene letras (a-z, A-Z)
                </li>
                <li className={validations.hasNumber ? 'text-green-600' : 'text-red-600'}>
                  Contiene números (0-9)
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <label className="text-sm text-black font-medium">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full h-10 px-2 rounded bg-white text-black border border-gray-700 focus:border-pink-600 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="text-sm text-black font-medium">¿Cuánto es 3 + 2?</label>
              <input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                className="mt-1 w-full h-10 px-2 rounded bg-white text-black border border-gray-700 focus:border-pink-600 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div className="mt-5 flex justify-center">
              <button
                onClick={handleChangePassword}
                disabled={loading || !allValid}
                className={`w-[60%] h-10 rounded font-semibold ${
                  loading || !allValid
                    ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    : 'bg-pink-600 text-yellow-300 hover:opacity-90'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Accessmodal>

        {/* Mensaje de éxito */}
        {successMsg && (
          <div className="mt-4">
            <Toast>
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-200">
                <HiCheckCircle className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-bold">{successMsg}</div>
              <ToastToggle onClick={() => setSuccessMsg('')} />
            </Toast>
          </div>
        )}

        {/* Mensaje de error */}
        {errorMsg && (
          <div className="mt-4">
            <Toast>
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-200">
                !
              </div>
              <div className="ml-3 text-sm font-bold">{errorMsg}</div>
              <ToastToggle onClick={() => setErrorMsg('')} />
            </Toast>
          </div>
        )}
      </div>
    </div>
  );
};



