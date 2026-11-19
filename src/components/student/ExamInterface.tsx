import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Layers,
  Send,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  Question,
  StudentAnswerState,
  StudentSession
} from '../../types/assessment';
import { storageService } from '../../services/storageService';

interface ExamInterfaceProps {
  session: StudentSession;
  questions: Question[];
  durationMinutes?: number;
  onFinishExam: (evaluatedSession: StudentSession) => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  session,
  questions,
  durationMinutes = 30,
  onFinishExam
}) => {
  const totalQuestions = questions.length || 20;
  const examDurationSeconds = (durationMinutes || session.durationMinutes || 30) * 60;

  // Recover newer local backup if page was reloaded mid-exam
  const initialSessionSnapshot = useMemo(() => {
    const backup = storageService.getActiveStudentSessionBackup(session.id);
    if (
      backup &&
      backup.status === 'mengerjakan' &&
      (backup.lastActiveTime || 0) >= (session.lastActiveTime || 0)
    ) {
      return backup;
    }
    return session;
  }, [session]);

  const [currentIndex, setCurrentIndex] = useState<number>(initialSessionSnapshot.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerState>>(initialSessionSnapshot.answers || {});

  const computeRemainingSeconds = useCallback(() => {
    const elapsed = Math.max(0, Math.floor((Date.now() - session.startTime) / 1000));
    return Math.max(0, examDurationSeconds - elapsed);
  }, [examDurationSeconds, session.startTime]);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => Math.max(1, computeRemainingSeconds()));

  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);
  const [showTimeoutSubmitModal, setShowTimeoutSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const hasSubmittedRef = useRef(false);
  const lastUserActivityRef = useRef<number>(Date.now());
  const lastCloudSyncRef = useRef<number>(Date.now());
  const pendingFinalSessionRef = useRef<StudentSession | null>(null);

  const markActive = useCallback(() => {
    lastUserActivityRef.current = Date.now();
  }, []);

  const buildProgressSnapshot = useCallback(
    (
      nextAnswers: Record<string, StudentAnswerState> = answersRef.current,
      nextIndex: number = currentIndexRef.current
    ): StudentSession => ({
      ...session,
      durationMinutes,
      currentQuestionIndex: nextIndex,
      answers: nextAnswers,
      answeredCount: Object.values(nextAnswers).filter(a => a.isAnswered).length,
      doubtfulCount: Object.values(nextAnswers).filter(a => a.isDoubtful).length,
      lastActiveTime: Date.now(),
      timeSpentSeconds: Math.max(0, Math.floor((Date.now() - session.startTime) / 1000))
    }),
    [session, durationMinutes]
  );

  const persistProgress = useCallback(
    (nextAnswers: Record<string, StudentAnswerState>, nextIndex: number) => {
      if (hasSubmittedRef.current) return;
      lastUserActivityRef.current = Date.now();
      lastCloudSyncRef.current = Date.now();
      const snapshot = buildProgressSnapshot(nextAnswers, nextIndex);
      storageService.saveSession(snapshot);
    },
    [buildProgressSnapshot]
  );

  const finalizeSubmission = useCallback(
    async (isAutoSubmit = false) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        let finalSession = pendingFinalSessionRef.current;
        if (!finalSession) {
          const latestAnswers = answersRef.current;
          const result = storageService.calculateAssessmentResult(session.grade, latestAnswers);
          const nowTs = Date.now();
          finalSession = {
            ...session,
            durationMinutes,
            status: 'selesai',
            currentQuestionIndex: currentIndexRef.current,
            answers: result.answersWithScore,
            totalScore: result.totalScore,
            mathScore: result.mathScore,
            indoScore: result.indoScore,
            englishScore: result.englishScore,
            predicate: result.predicate,
            completedAt: nowTs,
            lastActiveTime: nowTs,
            timeSpentSeconds: Math.min(
              examDurationSeconds,
              Math.max(0, Math.floor((nowTs - session.startTime) / 1000))
            ),
            answeredCount: Object.values(latestAnswers).filter(a => a.isAnswered).length,
            doubtfulCount: Object.values(latestAnswers).filter(a => a.isDoubtful).length
          };
          pendingFinalSessionRef.current = finalSession;
        }

        const saveRes = await storageService.saveSessionAsync(finalSession);
        if (!saveRes.success) {
          hasSubmittedRef.current = false;
          if (isAutoSubmit) {
            setShowConfirmFinishModal(false);
            setShowTimeoutSubmitModal(true);
            setSubmitError(
              'Waktu ujian telah habis, namun koneksi ke server terputus. Jawaban Anda aman tersimpan di perangkat ini dan akan otomatis dikirim saat jaringan kembali.'
            );
          } else {
            setShowConfirmFinishModal(true);
            setSubmitError(
              'Gagal mengirim jawaban ke server karena koneksi internet terputus. Jawaban Anda aman tersimpan di perangkat ini — silakan periksa sinyal lalu tekan Kirim Ulang.'
            );
          }
          return;
        }

        pendingFinalSessionRef.current = null;
        void storageService.syncSessionsForToken(finalSession.tokenUsed, true);
        setShowConfirmFinishModal(false);
        setShowTimeoutSubmitModal(false);
        onFinishExam(saveRes.session || finalSession);
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, durationMinutes, examDurationSeconds, onFinishExam]
  );

  // Wall-clock timer interval with 30-minute inactivity auto-complete (immune to mobile background throttling)
  useEffect(() => {
    const checkTimer = () => {
      if (hasSubmittedRef.current || showTimeoutSubmitModal) return;

      const inactiveMs = Date.now() - lastUserActivityRef.current;
      if (inactiveMs >= 30 * 60 * 1000) {
        void finalizeSubmission(true);
        return;
      }

      const remaining = computeRemainingSeconds();
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        void finalizeSubmission(true);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [computeRemainingSeconds, finalizeSubmission, showTimeoutSubmitModal]);

  // Auto-retry pending timeout submission every 4s and immediately when online
  useEffect(() => {
    if (!showTimeoutSubmitModal) return;

    const handleOnline = () => {
      if (!isSubmitting) {
        void finalizeSubmission(true);
      }
    };
    window.addEventListener('online', handleOnline);
    const retryTimer = setInterval(() => {
      if (navigator.onLine && !hasSubmittedRef.current) {
        void finalizeSubmission(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(retryTimer);
    };
  }, [showTimeoutSubmitModal, isSubmitting, finalizeSubmission]);

  // Window user activity & mobile background flush listeners
  useEffect(() => {
    const handleActivity = () => {
      markActive();
    };

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    const flushBeforeHide = () => {
      if (hasSubmittedRef.current) return;
      const snapshot = buildProgressSnapshot();
      lastCloudSyncRef.current = Date.now();
      void storageService.saveSessionNow(snapshot);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushBeforeHide();
      } else if (document.visibilityState === 'visible') {
        const inactiveMs = Date.now() - lastUserActivityRef.current;
        if (inactiveMs >= 30 * 60 * 1000) {
          void finalizeSubmission(true);
          return;
        }
        const remaining = computeRemainingSeconds();
        setTimeLeftSeconds(remaining);
        if (remaining <= 0) {
          void finalizeSubmission(true);
        } else {
          markActive();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flushBeforeHide);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flushBeforeHide);
    };
  }, [markActive, finalizeSubmission, buildProgressSnapshot, computeRemainingSeconds]);

  // Gentle presence heartbeat (only when student hasn't triggered a dirty save for >= 45s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasSubmittedRef.current || showTimeoutSubmitModal) return;
      if (Date.now() - lastCloudSyncRef.current < 45000) return;
      lastCloudSyncRef.current = Date.now();
      const snapshot = buildProgressSnapshot();
      void storageService.saveSessionNow(snapshot);
    }, 15000);
    return () => clearInterval(interval);
  }, [buildProgressSnapshot, showTimeoutSubmitModal]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex] || questions[0];
  if (!currentQuestion) return null;

  const currentAnswerState = answers[currentQuestion.id] || {
    questionId: currentQuestion.id,
    answer: null,
    isDoubtful: false,
    isAnswered: false
  };

  const handleSingleChoiceSelect = (optId: string) => {
    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...currentAnswerState,
        answer: optId,
        isAnswered: true
      }
    };
    setAnswers(updated);
    persistProgress(updated, currentIndex);
  };

  const handleMultipleChoiceToggle = (optId: string) => {
    const currentChoices = Array.isArray(currentAnswerState.answer) ? currentAnswerState.answer : [];
    let nextChoices: string[];
    if (currentChoices.includes(optId)) {
      nextChoices = currentChoices.filter(id => id !== optId);
    } else {
      nextChoices = [...currentChoices, optId];
    }

    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...currentAnswerState,
        answer: nextChoices.length > 0 ? nextChoices : null,
        isAnswered: nextChoices.length > 0
      }
    };
    setAnswers(updated);
    persistProgress(updated, currentIndex);
  };

  const handleTrueFalseToggle = (stmtId: string, val: boolean) => {
    const currentMap = (currentAnswerState.answer as Record<string, boolean>) || {};
    const nextMap = { ...currentMap, [stmtId]: val };
    const hasAny = Object.keys(nextMap).length > 0;

    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...currentAnswerState,
        answer: nextMap,
        isAnswered: hasAny
      }
    };
    setAnswers(updated);
    persistProgress(updated, currentIndex);
  };

  const handleToggleDoubtful = () => {
    const updated = {
      ...answers,
      [currentQuestion.id]: {
        ...currentAnswerState,
        isDoubtful: !currentAnswerState.isDoubtful
      }
    };
    setAnswers(updated);
    persistProgress(updated, currentIndex);
  };

  const goToQuestion = (targetIdx: number) => {
    const clamped = Math.max(0, Math.min(totalQuestions - 1, targetIdx));
    setCurrentIndex(clamped);
    persistProgress(answersRef.current, clamped);
  };

  const answeredCount = Object.values(answers).filter(a => a.isAnswered).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-50 pb-12">
      {/* Top Assessment Header Bar */}
      <div className="sticky top-[var(--app-navbar-height,72px)] z-30 border-b border-rose-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1.5 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-xs sm:text-sm text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-300 shrink-0 tabular-nums">
              Soal {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="truncate text-xs sm:text-sm font-bold text-slate-800">
              {currentQuestion.subject} · {currentQuestion.grade}
            </span>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-mono text-sm sm:text-base font-extrabold border tabular-nums shrink-0 ${
              timeLeftSeconds <= 60
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-orange-50 text-orange-950 border-orange-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Quick Nav Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowNavDrawer(!showNavDrawer)}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-700 hover:bg-rose-50 tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="h-4 w-4 text-rose-600" />
              <span>{answeredCount}/{totalQuestions}</span>
            </button>

            <button
              onClick={() => {
                setSubmitError(null);
                setShowConfirmFinishModal(true);
              }}
              className="rounded-xl bg-rose-600 px-3.5 py-1 text-xs sm:text-sm font-extrabold text-white hover:bg-rose-700 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Card container */}
      <div className="mx-auto max-w-4xl px-3 pt-4 sm:pt-6 space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-white p-4 sm:p-7 shadow-xl shadow-rose-600/5 space-y-4">
          
          {/* Question Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                #{currentIndex + 1}
              </span>
              <span className={`font-bold ${
                currentQuestion.subject === 'Bahasa Indonesia'
                  ? 'text-rose-700'
                  : currentQuestion.subject === 'Bahasa Inggris'
                    ? 'text-orange-700'
                    : 'text-amber-800'
              }`}>
                {currentQuestion.subject}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{currentQuestion.topic}</span>
              {currentQuestion.questionFormat && (
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                  currentQuestion.questionFormat === 'TKA SMA Terbaru'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {currentQuestion.questionFormat}
                </span>
              )}
            </div>

            <button
              onClick={handleToggleDoubtful}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                currentAnswerState.isDoubtful
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {currentAnswerState.isDoubtful ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}
            </button>
          </div>

          {/* Stimulus Context */}
          {currentQuestion.stimulusContent && (
            <div className="rounded-xl bg-stone-50 p-4 border border-orange-200/70 text-slate-800 text-sm leading-relaxed space-y-2">
              <strong className="text-slate-900 block font-bold">Konteks: {currentQuestion.stimulusTitle}</strong>
              <p className="whitespace-pre-line">{currentQuestion.stimulusContent}</p>
              {currentQuestion.stimulusTableData && (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead className="bg-orange-100/80 font-bold text-slate-900">
                      <tr>
                        {currentQuestion.stimulusTableData.headers.map((h, i) => (
                          <th key={i} className="border border-slate-300 p-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentQuestion.stimulusTableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="bg-white">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-300 p-2">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <p className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug whitespace-pre-line">
              {currentQuestion.questionText}
            </p>
            {currentQuestion.type === 'multiple_choice' && (
              <span className="inline-block rounded-md bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-950 border border-orange-200">
                Soal Pilihan Ganda Kompleks (Dapat memilih lebih dari satu jawaban benar)
              </span>
            )}
            {currentQuestion.type === 'true_false' && (
              <span className="inline-block rounded-md bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 border border-amber-200">
                Tentukan Benar atau Salah pada setiap pernyataan di bawah ini
              </span>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3 pt-2">
            {/* Single Choice */}
            {currentQuestion.type === 'single_choice' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map(opt => {
                  const isSelected = currentAnswerState.answer === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSingleChoiceSelect(opt.id)}
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border-2 p-3.5 sm:p-4 transition-all ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-extrabold text-sm ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {opt.id}
                      </div>
                      <span className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-rose-950' : 'text-slate-800'}`}>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map(opt => {
                  const userChoices = Array.isArray(currentAnswerState.answer) ? currentAnswerState.answer : [];
                  const isSelected = userChoices.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleMultipleChoiceToggle(opt.id)}
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border-2 p-3.5 sm:p-4 transition-all ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-slate-800">
                        <strong className="font-bold mr-2">{opt.id}.</strong>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* True / False Statements */}
            {currentQuestion.type === 'true_false' && currentQuestion.statements && (
              <div className="space-y-3">
                {currentQuestion.statements.map((stmt, sIdx) => {
                  const userMap = (currentAnswerState.answer as Record<string, boolean>) || {};
                  const val = userMap[stmt.id];
                  return (
                    <div key={stmt.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {sIdx + 1}. {stmt.text}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleTrueFalseToggle(stmt.id, true)}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                            val === true
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          BENAR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTrueFalseToggle(stmt.id, false)}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                            val === false
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          SALAH
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitError(null);
                  setShowConfirmFinishModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Selesai</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Drawer Modal */}
      {showNavDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Daftar Nomor Soal</h3>
              <button onClick={() => setShowNavDrawer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans?.isAnswered;
                const isDoubt = ans?.isDoubtful;
                const isCurrent = idx === currentIndex;

                let btnBg = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isAnswered) btnBg = 'bg-rose-600 text-white border-rose-600';
                if (isDoubt) btnBg = 'bg-amber-500 text-white border-amber-600';
                if (isCurrent) btnBg += ' ring-2 ring-orange-500 ring-offset-2';

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      goToQuestion(idx);
                      setShowNavDrawer(false);
                    }}
                    className={`h-11 rounded-xl font-mono font-bold text-sm border transition-all cursor-pointer flex items-center justify-center ${btnBg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-around text-[11px] font-bold text-slate-600 pt-2 border-t">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-600 inline-block"></span> Terjawab</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500 inline-block"></span> Ragu-ragu</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100 border inline-block"></span> Belum</span>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowNavDrawer(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Finish Modal */}
      {showConfirmFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-center space-y-4">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${submitError ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Selesai Asesmen</h3>
              <p className="text-xs text-slate-600 mt-1">
                Anda telah menjawab <strong className="text-rose-700">{answeredCount}</strong> dari <strong className="text-slate-900">{totalQuestions}</strong> soal. Yakin ingin mengakhiri asesmen sekarang?
              </p>
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs font-semibold text-rose-800">
                {submitError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setShowConfirmFinishModal(false);
                }}
                disabled={isSubmitting}
                className="w-1/2 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Lanjutkan Ujian
              </button>
              <button
                type="button"
                onClick={() => void finalizeSubmission(false)}
                disabled={isSubmitting}
                className="w-1/2 flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Mengirim...' : submitError ? 'Kirim Ulang' : 'Ya, Selesai'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-timeout Offline/Retry Lock Modal */}
      {showTimeoutSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Waktu Ujian Telah Habis</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {submitError || 'Sedang mengirim jawaban Anda ke server. Jangan tutup halaman ini sebelum nilai tampil.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void finalizeSubmission(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Mengirim Jawaban...' : 'Coba Kirim Sekarang'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
