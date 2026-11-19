import React, { useState } from 'react';
import { KeyRound, AlertCircle, X, ArrowRight } from 'lucide-react';
import { TeacherSettings } from '../../types/assessment';

interface TeacherLoginModalProps {
  settings: TeacherSettings;
  onSuccess: () => void;
  onClose: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  settings,
  onSuccess,
  onClose
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (pinInput.trim() === settings.teacherPin) {
      onSuccess();
    } else {
      setErrorMsg('Sandi/PIN guru salah.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl shadow-rose-600/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Login Panel Guru
            </h3>
            <p className="text-xs text-slate-500">Lawan!! Nilai 100 · Monitoring & Asesmen SMA</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Password Pengawas
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan password guru"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-base text-slate-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-xl border border-slate-300 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-2/3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 py-2.5 text-xs sm:text-sm font-bold text-white hover:from-rose-700 hover:via-orange-600 hover:to-amber-600 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <span>Masuk</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
