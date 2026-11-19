import React, { useEffect, useRef } from 'react';
import { GraduationCap, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { TeacherSettings } from '../types/assessment';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentRole: 'student' | 'teacher' | 'landing';
  onSwitchRole: (targetRole: 'student' | 'teacher' | 'landing') => void;
  settings: TeacherSettings;
  studentName?: string;
  studentGrade?: string;
  onLogoutStudent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  studentName,
  studentGrade,
  onLogoutStudent
}) => {
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === 'undefined') return;

    const updateHeight = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        document.documentElement.style.setProperty('--app-navbar-height', `${Math.round(rect.height)}px`);
      }
    };

    updateHeight();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeight);
      observer.observe(el);
    }
    window.addEventListener('resize', updateHeight, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [currentRole, studentName, studentGrade]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-rose-100/90 bg-white/95 backdrop-blur-md print:hidden">
      <div className="w-full flex items-center justify-between px-3 py-1.5 sm:px-5">
        {/* Logo & Student Name Below on Far Left */}
        <div className="flex flex-col items-start">
          <div 
            onClick={() => onSwitchRole('landing')} 
            className="flex cursor-pointer items-center gap-2 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
              Lawan!! <span className="text-rose-600">Nilai 100</span>
            </span>
          </div>

          {currentRole === 'student' && studentName && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-rose-950 font-bold">
              <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-rose-900">
                👤 {studentName} {studentGrade ? `(${studentGrade})` : ''}
              </span>
              {onLogoutStudent && (
                <button
                  onClick={onLogoutStudent}
                  className="text-rose-600 hover:text-rose-900 text-[11px] font-bold underline cursor-pointer"
                >
                  Keluar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Role Switcher */}
          {currentRole === 'teacher' ? (
            <button
              onClick={() => onSwitchRole('landing')}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowRightLeft className="h-4 w-4 text-rose-600" />
              <span>Siswa</span>
            </button>
          ) : currentRole === 'student' ? (
            <button
              onClick={() => onSwitchRole('teacher')}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Guru</span>
            </button>
          ) : (
            <button
              onClick={() => onSwitchRole('teacher')}
              className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Panel Guru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
