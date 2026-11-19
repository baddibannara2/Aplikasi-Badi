import React from 'react';
import { GraduationCap, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { TeacherSettings } from '../types/assessment';

interface RoleSelectorProps {
  onSelectStudent: () => void;
  onSelectTeacher: () => void;
  settings: TeacherSettings;
  isLoadingEntrance?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  onSelectStudent,
  isLoadingEntrance = false
}) => {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* 1. Top Welcome Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 shadow-2xs">
          <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
          <span>Asesmen Kurikulum Merdeka &amp; Model TKA SMA</span>
        </div>
      </div>

      {/* 2. Hero Title & Subtitle */}
      <div className="text-center mt-5">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
          Lawan!! <span className="bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">Nilai 100</span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
          Platform Tes Kemampuan Akademik untuk <strong>SMA Kelas 10 &amp; 11</strong> berbasis Kurikulum Merdeka dan Soal Model TKA SMA Terbaru.
        </p>
        <p className="mt-1 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
          Asah nalar kritis, taklukkan 20 soal pilihan per jenjang, dan raih nilai sempurna!
        </p>
      </div>

      {/* 3. Main Assessment Entrance Card */}
      <div className="mt-7 rounded-[28px] border-2 border-rose-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-rose-500/10">
        {/* Card Header: Icon + Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 text-white shadow-md shadow-rose-500/25">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <span className="inline-block rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 mb-0.5 border border-rose-100">
              Portal Asesmen Siswa
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Siswa SMA (Kelas 10 &amp; 11)
            </h2>
          </div>
        </div>

        {/* Grade Cards (2-column clean split) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5 text-center shadow-2xs">
            <div className="font-black text-sm text-rose-900">10 SMA</div>
            <div className="text-[11px] font-semibold text-rose-700">Kurikulum Merdeka · Fase E</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-center shadow-2xs">
            <div className="font-black text-sm text-amber-950">11 SMA</div>
            <div className="text-[11px] font-semibold text-amber-800">Kurikulum Merdeka · Fase F</div>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 mb-6">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>7 Soal Bhs. Indonesia, 7 Soal Bhs. Inggris &amp; 6 Soal Matematika</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>50% Soal Reguler Kurikulum Merdeka &amp; 50% Model TKA SMA Terbaru</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Pembahasan Lengkap, Kunci Jawaban &amp; Rapor Skor Otomatis</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Cukup Nama &amp; Token dari Guru untuk Mulai Mengerjakan</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          disabled={isLoadingEntrance}
          onClick={onSelectStudent}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-700 hover:via-orange-600 hover:to-amber-600 py-3.5 sm:py-4 text-base font-extrabold text-white shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
        >
          <span>{isLoadingEntrance ? 'Memuat...' : 'Masuk ke Asesmen'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* 4. Bottom 4 Feature Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
        <div className="rounded-2xl border border-rose-200/80 bg-white p-3 sm:p-3.5 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-2xl">📖</div>
          <p className="font-bold text-xs sm:text-sm text-rose-900">Bhs. Indonesia</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">7 Soal Literasi</p>
        </div>

        <div className="rounded-2xl border border-orange-200/80 bg-white p-3 sm:p-3.5 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-2xl">🌍</div>
          <p className="font-bold text-xs sm:text-sm text-orange-900">Bhs. Inggris</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">7 Soal Reading</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-3 sm:p-3.5 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-2xl">📐</div>
          <p className="font-bold text-xs sm:text-sm text-amber-950">Matematika</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">6 Soal Numerasi</p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-3 sm:p-3.5 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-2xl">🏆</div>
          <p className="font-bold text-xs sm:text-sm text-slate-900">Leaderboard</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Ranking Angkatan</p>
        </div>
      </div>
    </div>
  );
};
