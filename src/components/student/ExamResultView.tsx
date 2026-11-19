import React, { useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ClipboardList,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import {
  StudentSession,
  Subject
} from '../../types/assessment';
import { storageService } from '../../services/storageService';

interface ExamResultViewProps {
  session: StudentSession;
  onBackToHome: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  session,
  onBackToHome
}) => {
  const [filterType, setFilterType] = useState<'all' | 'wrong_only' | Subject>('all');
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMissingSurveyHint, setShowMissingSurveyHint] = useState(false);
  const scoreCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollToTopRank = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        scoreCardRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      } catch {
        // Ignore
      }
    };

    scrollToTopRank();
    const rafId = requestAnimationFrame(scrollToTopRank);
    const timerId = setTimeout(scrollToTopRank, 80);

    void storageService.syncSessionsForToken(session.tokenUsed, true);
    void storageService.syncConfigAndSlides(false);
    const unsubToken = storageService.subscribeToTokenSessions(session.tokenUsed);
    const unsubscribe = storageService.subscribe(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      unsubToken();
      unsubscribe();
    };
  }, [session.id, session.tokenUsed]);

  const handleRefreshLeaderboard = async () => {
    setIsRefreshing(true);
    await Promise.all([
      storageService.syncSessionsForToken(session.tokenUsed, true),
      storageService.syncConfigAndSlides(true)
    ]);
    setRefreshTrigger(prev => prev + 1);
    setIsRefreshing(false);
  };

  const gradeQuestions = useMemo(() => {
    return storageService.getQuestionsByGrade(session.grade);
  }, [session.grade]);

  const evaluated = useMemo(() => {
    return storageService.calculateAssessmentResult(session.grade, session.answers || {});
  }, [session.grade, session.answers]);

  const totalQuestions = gradeQuestions.length || 20;
  const indoCount = gradeQuestions.filter(q => q.subject === 'Bahasa Indonesia').length || 7;
  const englishCount = gradeQuestions.filter(q => q.subject === 'Bahasa Inggris').length || 7;
  const mathCount = gradeQuestions.filter(q => q.subject === 'Matematika').length || 6;

  const displayTotalScore = session.totalScore ?? evaluated.totalScore;
  const displayMathScore = session.mathScore ?? evaluated.mathScore;
  const displayIndoScore = session.indoScore ?? evaluated.indoScore;
  const displayEnglishScore = session.englishScore ?? evaluated.englishScore;
  const displayPredicate = session.predicate ?? evaluated.predicate;

  const correctCount = evaluated.correctCount;
  const wrongCount = evaluated.wrongCount;

  useEffect(() => {
    try {
      if ((displayTotalScore || 0) >= 75) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#fb7185', '#f97316', '#f59e0b']
        });
      }
    } catch {
      // Ignore
    }
  }, [displayTotalScore]);

  const leaderboard = useMemo(() => {
    return storageService.getLeaderboard(session.grade, session.tokenUsed);
  }, [session.grade, session.tokenUsed, refreshTrigger]);

  const tokenSurveyUrl = useMemo(() => {
    const tokenItem = storageService.getTokenItem(session.tokenUsed);
    const raw = (tokenItem?.surveyUrl || '').trim();
    if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return '';
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }, [session.tokenUsed, refreshTrigger]);

  const studentRankIndex = leaderboard.findIndex(s => s.id === session.id);
  const studentRank = studentRankIndex >= 0 ? studentRankIndex + 1 : 1;
  const totalPeers = Math.max(leaderboard.length, 1);

  const filteredQuestions = gradeQuestions.filter(q => {
    const studentAns = session.answers?.[q.id];
    const isCorrect = studentAns?.isCorrect;

    if (filterType === 'wrong_only') return !isCorrect;
    if (filterType !== 'all') return q.subject === filterType;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:py-6 space-y-4 text-slate-800">

      {/* ========================================================= */}
      {/* OFFICIAL PRINTABLE REPORT CARD (Visible ONLY during print) */}
      {/* ========================================================= */}
      <div className="hidden print:block space-y-5 text-slate-900 font-sans p-2">
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <h1 className="text-xl font-black uppercase tracking-wide">
            LEMBAR HASIL ASESMEN KURIKULUM MERDEKA &amp; TKA SMA — LAWAN!! NILAI 100
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-1">
            {session.school} · TAHUN PELAJARAN 2025/2026
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Dokumen Resmi Capaian Kompetensi Siswa Kelas {session.grade}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs border border-slate-900 p-3 rounded-lg bg-slate-50/50">
          <div className="space-y-1">
            <div>
              <span className="text-slate-600 font-semibold block">Nama Lengkap Siswa:</span>
              <strong className="text-sm font-black text-slate-900">{session.name}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">Jenjang / Kelas:</span>
              <strong className="text-xs font-bold text-slate-900">{session.grade}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">Asal Sekolah:</span>
              <strong className="text-xs font-bold text-slate-900">{session.school}</strong>
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div>
              <span className="text-slate-600 font-semibold block">Token Asesmen:</span>
              <strong className="font-mono text-xs font-bold text-slate-900">{session.tokenUsed}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">Tanggal Pengerjaan:</span>
              <strong className="text-xs font-bold text-slate-900">
                {session.completedAt
                  ? new Date(session.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">Predikat &amp; Peringkat:</span>
              <span className="inline-block px-2 py-0.5 rounded font-black text-xs bg-slate-200 text-slate-900 border border-slate-900">
                {displayPredicate} · Peringkat #{studentRank}/{totalPeers}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            I. Rekapitulasi Nilai Mata Pelajaran
          </h2>
          <table className="w-full text-xs border-collapse border border-slate-900 tabular-nums">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border border-slate-900 p-2 text-center">Bhs. Indonesia ({indoCount} Soal)</th>
                <th className="border border-slate-900 p-2 text-center">Bhs. Inggris ({englishCount} Soal)</th>
                <th className="border border-slate-900 p-2 text-center">Matematika ({mathCount} Soal)</th>
                <th className="border border-slate-900 p-2 text-center">Nilai Akhir Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-rose-800 text-base">
                  {displayIndoScore}
                </td>
                <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-orange-800 text-base">
                  {displayEnglishScore}
                </td>
                <td className="border border-slate-900 p-2.5 text-center font-mono font-bold text-amber-800 text-base">
                  {displayMathScore}
                </td>
                <td className="border border-slate-900 p-2.5 text-center font-mono font-black text-rose-900 text-lg">
                  {displayTotalScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            II. Rincian Pengerjaan Soal ({totalQuestions} Soal)
          </h2>
          <table className="w-full text-[11px] border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-200 font-bold border-b border-slate-900 text-slate-900">
                <th className="border border-slate-900 p-1.5 text-center w-8">No</th>
                <th className="border border-slate-900 p-1.5 text-left">Mapel & Topik</th>
                <th className="border border-slate-900 p-1.5 text-center">Jawaban Siswa</th>
                <th className="border border-slate-900 p-1.5 text-center">Kunci</th>
                <th className="border border-slate-900 p-1.5 text-center w-20">Skor</th>
              </tr>
            </thead>
            <tbody>
              {gradeQuestions.map((q, idx) => {
                const ansState = session.answers?.[q.id];
                const evalState = evaluated.answersWithScore?.[q.id];
                const score = ansState?.scoreEarned ?? evalState?.scoreEarned ?? 0;
                return (
                  <tr key={q.id}>
                    <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="border border-slate-900 p-1.5">
                      <strong className="block text-slate-900">{q.subject}</strong>
                      <span className="text-[10px] text-slate-600">{q.topic}</span>
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono">
                      {ansState?.answer
                        ? (Array.isArray(ansState.answer)
                            ? ansState.answer.join(', ')
                            : typeof ansState.answer === 'object'
                              ? JSON.stringify(ansState.answer)
                              : String(ansState.answer))
                        : '-'}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">
                      {Array.isArray(q.correctAnswer)
                        ? q.correctAnswer.join(', ')
                        : typeof q.correctAnswer === 'object'
                          ? JSON.stringify(q.correctAnswer)
                          : String(q.correctAnswer)}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center font-bold tabular-nums">
                      {score}/10
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE SCREEN VIEW */}
      {/* ========================================================= */}
      <div className="space-y-4 print:hidden">
        {/* Main Score & Rank Card */}
        <div
          ref={scoreCardRef}
          className="scroll-mt-20 rounded-2xl border border-rose-200 bg-white p-4 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="inline-block rounded-md bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-900 border border-rose-300">
                Lawan!! Nilai 100 · {session.grade}
              </span>
              <h1 className="mt-1.5 text-2xl sm:text-3xl font-black text-slate-900">
                {session.name}
              </h1>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                {session.school} · Token: <span className="font-mono font-bold">{session.tokenUsed}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-center">
              <div className="rounded-xl bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 border border-rose-200 px-6 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                  Nilai Akhir Total
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-rose-600 my-0.5 tabular-nums">
                  {displayTotalScore}
                </div>
                <span className="inline-block rounded-md px-2.5 py-0.5 text-xs font-extrabold bg-rose-600 text-white">
                  {displayPredicate}
                </span>
              </div>
            </div>
          </div>

          {/* CLASS COHORT RANKING CARD */}
          <div
            onClick={() => {
              setShowLeaderboardModal(true);
              void storageService.syncSessionsForToken(session.tokenUsed, true);
            }}
            className="mt-4 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border-2 border-orange-300 bg-orange-50/70 p-3.5 sm:p-4 shadow-xs hover:border-rose-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-xs">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-orange-800">
                  <span>Peringkat Siswa</span>
                  <span>·</span>
                  <span className="font-mono">Token: {session.tokenUsed}</span>
                </div>
                {leaderboard.length > 0 ? (
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                    Peringkat #{studentRank}{' '}
                    <span className="text-slate-600 font-semibold text-sm">
                      dari {totalPeers} Siswa {session.grade}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    Data peringkat sedang disinkronkan...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-center font-bold text-xs text-rose-700 group-hover:text-rose-900">
              <span>Lihat Peringkat Lengkap</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3-Subject Breakdown + Ketuntasan */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-2.5 sm:p-3">
                <span className="text-xs font-semibold text-rose-900 block">Bhs. Indonesia ({indoCount} Soal)</span>
                <strong className="font-mono text-xl sm:text-2xl font-black text-rose-700 mt-0.5 block tabular-nums">
                  {displayIndoScore}
                </strong>
              </div>
              <div className="rounded-xl bg-orange-50/80 border border-orange-200 p-2.5 sm:p-3">
                <span className="text-xs font-semibold text-orange-900 block">Bhs. Inggris ({englishCount} Soal)</span>
                <strong className="font-mono text-xl sm:text-2xl font-black text-orange-700 mt-0.5 block tabular-nums">
                  {displayEnglishScore}
                </strong>
              </div>
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 sm:p-3">
                <span className="text-xs font-semibold text-amber-900 block">Matematika ({mathCount} Soal)</span>
                <strong className="font-mono text-xl sm:text-2xl font-black text-amber-800 mt-0.5 block tabular-nums">
                  {displayMathScore}
                </strong>
              </div>
              <div className="rounded-xl bg-stone-50 border border-slate-200 p-2.5 sm:p-3">
                <span className="text-xs font-semibold text-slate-600 block">Ketuntasan ({totalQuestions} Soal)</span>
                <div className="text-xs sm:text-sm font-bold mt-1.5 tabular-nums">
                  <span className="text-emerald-700">{correctCount} Tepat</span> ·{' '}
                  <span className="text-rose-700">{wrongCount} Salah</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Menu Utama</span>
            </button>

            {tokenSurveyUrl ? (
              <a
                href={tokenSurveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:from-rose-700 hover:to-amber-600 shadow-xs transition-all cursor-pointer"
              >
                <ClipboardList className="h-4 w-4 text-white" />
                <span>Isi Angket</span>
                <ExternalLink className="h-3.5 w-3.5 text-rose-100" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setShowMissingSurveyHint(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:from-rose-700 hover:to-amber-600 shadow-xs transition-all cursor-pointer"
              >
                <ClipboardList className="h-4 w-4 text-white" />
                <span>Isi Angket</span>
              </button>
            )}
          </div>
          {showMissingSurveyHint && !tokenSurveyUrl && (
            <p className="mt-2 text-right text-xs font-medium text-amber-700">
              Link angket belum ditambahkan oleh guru pada token ini.
            </p>
          )}
        </div>

        {/* Detailed Question Review List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Rincian Jawaban &amp; Pembahasan Soal
            </h3>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('wrong_only')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === 'wrong_only' ? 'bg-rose-700 text-white border-rose-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Salah Saja
              </button>
              <button
                onClick={() => setFilterType('Bahasa Indonesia')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === 'Bahasa Indonesia' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Bhs. Indonesia
              </button>
              <button
                onClick={() => setFilterType('Bahasa Inggris')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === 'Bahasa Inggris' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Bhs. Inggris
              </button>
              <button
                onClick={() => setFilterType('Matematika')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === 'Matematika' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Matematika
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const studentAnsState = session.answers?.[q.id];
              const isCorrect = studentAnsState?.isCorrect;
              const scoreEarned = studentAnsState?.scoreEarned ?? 0;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-3.5 sm:p-4 space-y-2 text-xs sm:text-sm ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{q.subject}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{q.topic}</span>
                      {q.questionFormat && (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                          q.questionFormat === 'TKA SMA Terbaru'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {q.questionFormat}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-bold">
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Benar ({scoreEarned}/10)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full text-xs">
                          <XCircle className="h-3.5 w-3.5" /> Salah ({scoreEarned}/10)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-slate-900 whitespace-pre-line">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-slate-500 block">Jawaban Anda:</span>
                      <strong className="font-mono text-slate-900">
                        {studentAnsState?.answer
                          ? (Array.isArray(studentAnsState.answer)
                              ? studentAnsState.answer.join(', ')
                              : typeof studentAnsState.answer === 'object'
                                ? JSON.stringify(studentAnsState.answer)
                                : String(studentAnsState.answer))
                          : '(Tidak dijawab)'}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-slate-500 block">Kunci Jawaban:</span>
                      <strong className="font-mono text-emerald-700">
                        {Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.join(', ')
                          : typeof q.correctAnswer === 'object'
                            ? JSON.stringify(q.correctAnswer)
                            : String(q.correctAnswer)}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-lg bg-orange-50/70 p-2.5 border border-orange-200 text-slate-700 text-xs leading-relaxed">
                    <strong className="text-orange-950 block mb-0.5">Pembahasan:</strong>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:hidden backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-xs">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Peringkat Siswa</h3>
                  <p className="text-slate-500 text-xs">
                    Token: <strong className="font-mono text-rose-700">{session.tokenUsed}</strong> ({session.grade})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshLeaderboard}
                  disabled={isRefreshing}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Perbarui Peringkat"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm tabular-nums">
                  <thead className="bg-rose-50 text-xs font-bold text-rose-950 border-b border-rose-200">
                    <tr>
                      <th className="px-3 py-3 text-center w-14">Rank</th>
                      <th className="px-4 py-3">Nama Siswa</th>
                      <th className="px-2.5 py-3 text-center">B. Indo</th>
                      <th className="px-2.5 py-3 text-center">B. Ing</th>
                      <th className="px-2.5 py-3 text-center">Mat</th>
                      <th className="px-3 py-3 text-center font-bold">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500 text-sm">
                          <p className="font-bold">Belum ada peserta selesai lainnya.</p>
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((item, idx) => {
                        const isCurrentUser = item.id === session.id;
                        const rankNum = idx + 1;
                        const itemCalc = storageService.calculateAssessmentResult(item.grade, item.answers || {});
                        const itemMath = item.mathScore ?? itemCalc.mathScore;
                        const itemIndo = item.indoScore ?? itemCalc.indoScore;
                        const itemEnglish = item.englishScore ?? itemCalc.englishScore;
                        const itemTotal = item.totalScore ?? itemCalc.totalScore;

                        let medalBadge = null;
                        if (rankNum === 1) medalBadge = <span className="text-lg">🥇</span>;
                        else if (rankNum === 2) medalBadge = <span className="text-lg">🥈</span>;
                        else if (rankNum === 3) medalBadge = <span className="text-lg">🥉</span>;
                        else medalBadge = <span className="font-bold text-slate-500">#{rankNum}</span>;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              isCurrentUser
                                ? 'bg-rose-50 font-semibold ring-2 ring-rose-500/30'
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            <td className="px-3 py-3 text-center">
                              {medalBadge}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm sm:text-base">
                                  {item.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block">
                                {item.school}
                              </span>
                            </td>
                            <td className="px-2.5 py-3 text-center font-mono font-semibold text-rose-700">
                              {itemIndo}
                            </td>
                            <td className="px-2.5 py-3 text-center font-mono font-semibold text-orange-700">
                              {itemEnglish}
                            </td>
                            <td className="px-2.5 py-3 text-center font-mono font-semibold text-amber-800">
                              {itemMath}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-black text-rose-700 text-base">
                              {itemTotal}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-stone-50 flex justify-end">
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                Tutup Peringkat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
