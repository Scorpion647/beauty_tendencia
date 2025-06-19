
import React, { ReactNode } from 'react';

export interface ModalProps {
  /** Controla si el modal está abierto */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Contenido interno del modal */
  children: ReactNode;
}

export default function Accessmodal({ isOpen, onClose, children }: ModalProps) {
if (!isOpen) return null;

  return (
    <div
  className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-filter backdrop-blur-sm z-50"
  onClick={onClose} // se dispara al hacer clic en el fondo
>
  <div
    className="bg-white rounded-lg shadow-lg max-w-[700px] w-[80%] p-6 relative"
    onClick={(e) => e.stopPropagation()} // evita que el clic se propague y cierre el modal si se hace dentro
  >
    <button
      className="absolute top-2 cursor-pointer right-2 text-gray-500 hover:text-gray-700"
      onClick={onClose}
      aria-label="Close modal"
    >
      X
    </button>
    {children}
  </div>
</div>

  );
}