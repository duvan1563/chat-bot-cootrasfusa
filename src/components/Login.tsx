import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Bus, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setError(null);
    
    const provider = new GoogleAuthProvider();
    // Force account selection to avoid some auto-login issues in iframes
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Ya hay una solicitud de inicio de sesión en curso.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("La ventana de inicio de sesión fue cerrada antes de completar el proceso.");
      } else {
        setError("Error al iniciar sesión. Por favor, intenta de nuevo.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Bus className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Cotransfusa</h1>
        <p className="text-slate-500 mb-8">Tu viaje comienza aquí. Reserva tus pasajes vía Chatbot.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isLoggingIn ? "Iniciando sesión..." : "Iniciar sesión con Google"}
        </button>
        
        <p className="mt-6 text-xs text-slate-400">
          Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </motion.div>
    </div>
  );
}
