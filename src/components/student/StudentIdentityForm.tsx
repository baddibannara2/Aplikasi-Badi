import React, { useState } from 'react';
import { User, School, ArrowRight, Clock } from 'lucide-react';
import { GradeLevel } from '../../types/assessment';
import { storageService } from '../../services/storageService';

interface StudentIdentityFormProps {
  initialName: string;
  initialToken: string;
  initialGrade?: GradeLevel;
  initialSchool?: string;
  examDurationMinutes?: number;
  onSubmit: (identity: {
    name: string;
    grade: GradeLevel;
    school: string;
    tokenUsed: string;
  }) => Promise<string | null | void> | void;
  onBack: () => void;
}

export const StudentIdentityForm: React.FC<StudentIdentityFormProps> = ({
  initialName,
  initialToken,
  initialGrade = '10 SMA',
  initialSchool = 'SMA Negeri 1',
  examDurationMinutes = 30,
  onSubmit,
  onBack
}) => {
  const [name] = useState(initialName);
  const [grade] = useState<GradeLevel>(initialGrade);
  const [school] = useState(initialSchool);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionCount = storageService.getQuestionsByGrade(grade).length || 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      setErrorMsg('Nama wajib diisi.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const err = await onSubmit({
        name: name.trim(),
        grade,
        school: school.trim(),
        tokenUsed: initialToken
      });
      if (typeof err === 'string' && err) {
        setErrorMsg(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:py-8">
      <div className="rounded-3xl border border-rose-200/80 bg-white p-5 sm:p-7 shadow-xl shadow-rose-500/8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">Identitas Siswa</h2>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-0.5 rounded-full border border-rose-200">
              <Clock className="h-3.5 w-3.5 text-rose-600" />
              <span>Durasi: {examDurationMinutes} Menit • {questionCount} Soal</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-medium text-rose-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={name}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3 text-base font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Kelas Asesmen
            </label>
            <div className="relative">
              <input
                type="text"
                value={grade}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3 text-base font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Asal Sekolah
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <School className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={school}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3 text-base font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-1/3 rounded-xl border border-slate-300 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 py-2.5 text-xs sm:text-sm font-bold text-white hover:from-rose-700 hover:via-orange-600 hover:to-amber-600 shadow-md shadow-rose-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{isSubmitting ? 'Memulai...' : 'Mulai Asesmen'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
