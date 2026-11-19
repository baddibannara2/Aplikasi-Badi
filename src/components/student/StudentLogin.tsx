import React, { useState } from 'react';
import { User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { TeacherSettings } from '../../types/assessment';
import { storageService } from '../../services/storageService';

interface StudentLoginProps {
  settings: TeacherSettings;
  onSuccess: (studentName: string, token: string) => void;
  onBack: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onSuccess,
  onBack
}) => {
  const [name, setName] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    void storageService.syncConfigAndSlides(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const trimmedName = name.trim();
    const cleanToken = tokenInput.trim().toUpperCase();

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMsg('Masukkan nama lengkap (minimal 3 huruf).');
      return;
    }

    if (!cleanToken) {
      setErrorMsg('Masukkan token asesmen yang diberikan guru.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [configSynced, tokenSynced] = await Promise.all([
        storageService.syncConfigAndSlides(true),
        storageService.syncSessionsForToken(cleanToken, true)
      ]);
      const synced = configSynced || tokenSynced;

      const existingStudent = storageService.findSessionByNameAndToken(trimmedName, cleanToken);
      if (existingStudent) {
        onSuccess(existingStudent.name, cleanToken);
        return;
      }

      const tokenItem = storageService.getTokenItem(cleanToken);
      if (!tokenItem) {
        if (!synced) {
          setErrorMsg('Gagal terhubung ke server asesmen. Periksa koneksi jaringan Anda lalu coba lagi.');
        } else {
          setErrorMsg('Token asesmen tidak valid atau tidak ditemukan. Silakan periksa kembali token dari guru pengawas.');
        }
        return;
      }

      if (!tokenItem.isActive) {
        setErrorMsg('Sesi asesmen untuk token ini sedang ditutup oleh guru. Silakan hubungi guru pengawas.');
        return;
      }

      onSuccess(trimmedName, cleanToken);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:py-10">
      <div className="rounded-3xl border border-rose-200/80 bg-white p-5 sm:p-7 shadow-xl shadow-rose-500/8">
        <div className="text-center">
          <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            Portal Siswa SMA · Lawan!! Nilai 100
          </span>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Login Peserta Lawan!! Nilai 100</h2>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">
            Masukkan nama lengkap dan token dari guru pengawas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs sm:text-sm text-rose-800 border border-rose-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Nama Lengkap Siswa
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap siswa"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-base text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:bg-slate-50"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Token Asesmen
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Contoh: SMA2026"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 font-mono text-base uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-1/3 rounded-xl border border-slate-300 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 py-2.5 text-xs sm:text-sm font-bold text-white hover:from-rose-700 hover:via-orange-600 hover:to-amber-600 shadow-md shadow-rose-500/20 transition-all disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              <span>{isSubmitting ? 'Memeriksa...' : 'Lanjut'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
