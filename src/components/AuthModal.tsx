import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, X } from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMsg(
        err?.message ||
        'Could not complete Google Sign-In. You may continue in Guest Mode to test all Firestore and Gemini features.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginAsGuest();
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Guest sign-in error:', err);
      setErrorMsg(err?.message || 'Could not initiate session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Sign In to Personal Gemini Journal
          </h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Your journal entries are strictly encrypted and isolated in Firestore under <code className="text-[11px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">users/&#123;uid&#125;/entries</code>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{errorMsg}</p>
              <p className="text-[11px] opacity-80">
                Tip: Try the "Continue as Guest Session" below to bypass browser iframe popup restrictions.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            id="btn-google-sign-in"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/80 font-medium text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            <span className="absolute px-2 text-[10px] uppercase font-mono text-stone-400 bg-white dark:bg-stone-900">
              or instant sandbox
            </span>
          </div>

          <button
            id="btn-guest-sign-in"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span>Continue as Guest Session</span>
          </button>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-stone-400">
            Sessions persist locally and sync in real time with Cloud Firestore.
          </p>
        </div>
      </div>
    </div>
  );
};
