import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logoutGoogle } from '../services/firebaseAuth';
import { LogOut, Calendar, CheckCircle } from 'lucide-react';

interface Props {
  onAuthStateChange?: (user: User | null, token: string | null) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ onAuthStateChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        if (onAuthStateChange) onAuthStateChange(currentUser, accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        if (onAuthStateChange) onAuthStateChange(null, null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [onAuthStateChange]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        if (onAuthStateChange) onAuthStateChange(res.user, res.accessToken);
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    if (onAuthStateChange) onAuthStateChange(null, null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Calendar className="w-3.5 h-3.5" />
          <CheckCircle className="w-3 h-3" />
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-medium text-slate-100 max-w-[120px] truncate">
            {user.displayName || user.email}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Google Agenda Conectado</span>
        </div>
        <button
          onClick={handleSignOut}
          title="Desconectar do Google"
          className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      type="button"
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
    >
      <svg className="w-4 h-4" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      <span>{loading ? 'Conectando...' : 'Conectar Google Agenda'}</span>
    </button>
  );
};
