import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<'android' | 'ios' | null>(null);

  if (isInstalled) {
    return null;
  }

  const handleAction = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowGuideModal('ios');
    } else {
      setShowGuideModal('android');
    }
  };

  if (variant === 'banner') {
    if (!isInstallable && !isAndroid && !isIOS) {
      return null;
    }

    return (
      <>
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                Pasang Aplikasi Lawan!! Nilai 100 di HP Android
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                Buka langsung dari layar utama seperti aplikasi native, lebih cepat &amp; fokus tanpa bar browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>{isInstallable ? 'Install Aplikasi' : isIOS ? 'Cara Install (iOS)' : 'Install di Android'}</span>
          </button>
        </div>

        {showGuideModal && (
          <InstallGuideModal mode={showGuideModal} onClose={() => setShowGuideModal(null)} />
        )}
      </>
    );
  }

  // Navbar compact button
  if (!isInstallable && !isAndroid && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        title="Install aplikasi Lawan!! Nilai 100 di HP Android / perangkat Anda"
      >
        <Download className="h-3.5 w-3.5 shrink-0 text-rose-700" />
        <span className="hidden sm:inline">{isInstallable ? 'Install App' : 'Install Android'}</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showGuideModal && (
        <InstallGuideModal mode={showGuideModal} onClose={() => setShowGuideModal(null)} />
      )}
    </>
  );
};

const InstallGuideModal: React.FC<{ mode: 'android' | 'ios'; onClose: () => void }> = ({ mode, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            {mode === 'ios' ? 'Install di iPhone / iPad' : 'Install di HP Android'}
          </h3>
        </div>

        {mode === 'android' ? (
          <ol className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-700 list-decimal list-inside font-medium leading-relaxed">
            <li>Pastikan halaman dibuka menggunakan browser <strong>Google Chrome</strong> (jika dari WhatsApp, pilih <em>Buka di Chrome</em>).</li>
            <li>Ketuk tombol menu <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.</li>
            <li>Pilih <strong>Install aplikasi</strong> atau <strong>Tambahkan ke Layar utama</strong>.</li>
            <li>Ketuk <strong>Install</strong> hingga ikon <strong>Lawan!! Nilai 100</strong> muncul di layar utama HP.</li>
          </ol>
        ) : (
          <ol className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-700 list-decimal list-inside font-medium leading-relaxed">
            <li>Buka aplikasi ini melalui browser <strong>Safari</strong>.</li>
            <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.</li>
            <li>Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-rose-600 py-2 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
