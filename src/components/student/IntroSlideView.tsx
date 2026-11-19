import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { IntroSlideItem } from '../../types/assessment';
import { resolveSlideImageUrl } from '../../utils/slideImage';

interface IntroSlideViewProps {
  slides: IntroSlideItem[];
  onBack: () => void;
  onContinue: () => void;
}

export const IntroSlideView: React.FC<IntroSlideViewProps> = ({
  slides,
  onBack,
  onContinue
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const touchStartXRef = useRef<number | null>(null);

  const safeTotal = slides.length;
  const clampedIndex = safeTotal > 0 ? Math.min(currentIndex, safeTotal - 1) : 0;
  const currentSlide = slides[clampedIndex];

  useEffect(() => {
    setImageErrorMap({});
  }, [slides]);

  useEffect(() => {
    if (currentIndex >= safeTotal && safeTotal > 0) {
      setCurrentIndex(safeTotal - 1);
    }
  }, [currentIndex, safeTotal]);

  const handlePrev = () => {
    if (clampedIndex > 0) {
      setCurrentIndex(clampedIndex - 1);
    } else {
      onBack();
    }
  };

  const handleNext = () => {
    if (clampedIndex < safeTotal - 1) {
      setCurrentIndex(clampedIndex + 1);
    } else {
      onContinue();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!currentSlide) {
    return null;
  }

  const resolvedImg = resolveSlideImageUrl(currentSlide.imageUrl);
  const hasValidImage = Boolean(resolvedImg) && !imageErrorMap[currentSlide.id];
  const isImageOnly = currentSlide.displayMode === 'image_only';
  const isLastSlide = clampedIndex === safeTotal - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || safeTotal <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const diff = touchStartXRef.current - endX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 48) {
      if (diff > 0 && clampedIndex < safeTotal - 1) {
        setCurrentIndex(clampedIndex + 1);
      } else if (diff < 0 && clampedIndex > 0) {
        setCurrentIndex(clampedIndex - 1);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-0">
      <div
        className="w-full rounded-none border-b sm:border-x border-slate-200 bg-white shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Visual Stage (Persegi Penuh tanpa sudut melengkung) */}
        <div className="relative w-full rounded-none bg-slate-50 border-b border-slate-200">
          {hasValidImage ? (
            <div className="relative w-full flex items-center justify-center bg-slate-50 rounded-none">
              <img
                src={resolvedImg}
                alt={currentSlide.title || 'Slide informasi Lawan!! Nilai 100'}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImageErrorMap(prev => ({ ...prev, [currentSlide.id]: true }))
                }
                className={
                  isImageOnly
                    ? 'w-full max-h-[72vh] object-contain block rounded-none'
                    : 'w-full max-h-[420px] object-contain block rounded-none'
                }
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 text-white text-center rounded-none">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs mb-3">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg sm:text-xl font-bold tracking-tight">
                {currentSlide.title || 'Informasi Peserta Lawan!! Nilai 100'}
              </p>
            </div>
          )}
        </div>

        {/* Slide Content & Controls */}
        <div className="p-5 sm:p-7 space-y-5">
          {!isImageOnly && (currentSlide.title || currentSlide.description) && (
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between gap-2 text-xs font-medium text-slate-500">
                <span>Informasi Peserta</span>
                {safeTotal > 1 && (
                  <span className="tabular-nums font-semibold text-rose-700">
                    Slide {clampedIndex + 1} / {safeTotal}
                  </span>
                )}
              </div>
              {currentSlide.title && (
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-balance">
                  {currentSlide.title}
                </h2>
              )}
              {currentSlide.description && (
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {currentSlide.description}
                </p>
              )}
            </div>
          )}

          {/* Slide Dots when > 1 slide */}
          {safeTotal > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1" role="tablist" aria-label="Navigasi Slide">
              {slides.map((s, idx) => {
                const isCurrent = idx === clampedIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Pilih slide ${idx + 1}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      isCurrent ? 'w-7 bg-rose-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Primary Navigation Actions: Kembali / Lanjut */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 min-h-[46px] flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex-[1.5] min-h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:from-rose-700 hover:via-orange-600 hover:to-amber-600 px-5 py-3 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isLastSlide ? 'Lanjut ke Login' : 'Lanjut'}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
