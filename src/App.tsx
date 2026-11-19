/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { RoleSelector } from './components/RoleSelector';
import { IntroSlideView } from './components/student/IntroSlideView';
import { StudentLogin } from './components/student/StudentLogin';
import { StudentIdentityForm } from './components/student/StudentIdentityForm';
import { ExamInterface } from './components/student/ExamInterface';
import { ExamResultView } from './components/student/ExamResultView';
import { TeacherLoginModal } from './components/teacher/TeacherLoginModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GradeLevel, StudentSession, TeacherSettings } from './types/assessment';
import { storageService } from './services/storageService';
import { DEFAULT_INTRO_SLIDES } from './data/defaultSlides';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'landing' | 'student' | 'teacher'>('landing');
  const [studentStep, setStudentStep] = useState<'intro' | 'login' | 'identity' | 'exam' | 'result'>('intro');
  
  // Settings & Authentication
  const [settings, setSettings] = useState<TeacherSettings>(() => storageService.getSettings());
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);

  // Student active session state
  const [studentTempLogin, setStudentTempLogin] = useState<{ name: string; token: string } | null>(null);
  const [activeSession, setActiveSession] = useState<StudentSession | null>(null);
  const studentStepRef = React.useRef(studentStep);
  studentStepRef.current = studentStep;

  // Listen to real-time storage updates
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setSettings(storageService.getSettings());
      if (studentStepRef.current !== 'exam') {
        setActiveSession(prev => {
          if (!prev) return null;
          const latest = storageService.getSession(prev.id);
          return latest || prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const activeIntroSlides = useMemo(() => {
    const list = Array.isArray(settings.introSlides) ? settings.introSlides : DEFAULT_INTRO_SLIDES;
    return list.filter(s => s && s.isActive);
  }, [settings.introSlides]);

  const shouldShowIntroSlide = settings.isIntroSlideEnabled !== false && activeIntroSlides.length > 0;

  useEffect(() => {
    if (currentRole === 'student' && studentStep === 'intro' && !shouldShowIntroSlide) {
      setStudentStep('login');
    }
  }, [currentRole, studentStep, shouldShowIntroSlide]);

  // Role switching
  const handleSwitchRole = (targetRole: 'landing' | 'student' | 'teacher') => {
    if (targetRole === 'teacher') {
      if (isTeacherAuthenticated) {
        setCurrentRole('teacher');
      } else {
        setShowTeacherLoginModal(true);
      }
    } else {
      setCurrentRole(targetRole);
    }
  };

  // Student Flow
  const handleStudentLoginSuccess = (name: string, token: string) => {
    const existingSession = storageService.findSessionByNameAndToken(name, token);
    if (existingSession) {
      setActiveSession(existingSession);
      if (existingSession.status === 'selesai') {
        setStudentStep('result');
      } else {
        setStudentStep('exam');
      }
      return;
    }

    setStudentTempLogin({ name, token });
    setStudentStep('identity');
  };

  const handleStudentIdentitySubmit = async (identity: {
    name: string;
    grade: GradeLevel;
    school: string;
    tokenUsed: string;
  }): Promise<string | null> => {
    await Promise.all([
      storageService.syncConfigAndSlides(true),
      storageService.syncSessionsForToken(identity.tokenUsed, true)
    ]);

    const existingSameToken = storageService.findSessionByNameAndToken(identity.name, identity.tokenUsed);
    if (existingSameToken) {
      setActiveSession(existingSameToken);
      if (existingSameToken.status === 'selesai') {
        setStudentStep('result');
      } else {
        setStudentStep('exam');
      }
      return null;
    }

    const tokenItem = storageService.getTokenItem(identity.tokenUsed);
    if (!tokenItem || !tokenItem.isActive) {
      return 'Sesi asesmen untuk token ini telah ditutup oleh guru. Silakan tanyakan token aktif ke guru.';
    }

    const duration = tokenItem.durationMinutes || (settings.examDurationMinutes && settings.examDurationMinutes > 0
      ? settings.examDurationMinutes
      : 30);

    const newSessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newSession: StudentSession = {
      id: newSessionId,
      name: identity.name,
      grade: identity.grade,
      school: identity.school,
      tokenUsed: identity.tokenUsed.trim().toUpperCase(),
      durationMinutes: duration,
      startTime: Date.now(),
      lastActiveTime: Date.now(),
      status: 'mengerjakan',
      currentQuestionIndex: 0,
      answeredCount: 0,
      doubtfulCount: 0,
      answers: {}
    };

    const saveResult = await storageService.saveSessionAsync(newSession);
    if (!saveResult.success) {
      return 'Gagal terhubung ke server untuk memulai ujian. Periksa koneksi internet/Wi-Fi Anda lalu coba lagi.';
    }

    setActiveSession(saveResult.session);
    setStudentStep('exam');
    return null;
  };

  const handleFinishExam = (evaluatedSession: StudentSession) => {
    setActiveSession(evaluatedSession);
    setStudentStep('result');
  };

  const handleLogoutStudent = () => {
    storageService.clearActiveStudentSessionBackup(activeSession?.id);
    setActiveSession(null);
    setStudentTempLogin(null);
    setStudentStep('intro');
    setCurrentRole('landing');
  };

  // Teacher Handlers
  const handleTeacherAuthSuccess = () => {
    setIsTeacherAuthenticated(true);
    setShowTeacherLoginModal(false);
    setCurrentRole('teacher');
  };

  const handleUpdateTeacherSettings = (updated: Partial<TeacherSettings>) => {
    const newSettings = storageService.saveSettings(updated);
    setSettings(newSettings);
  };

  const [isEnteringStudent, setIsEnteringStudent] = useState(false);

  const handleEnterStudentPortal = async () => {
    if (isEnteringStudent) return;
    setIsEnteringStudent(true);
    try {
      await Promise.race([
        storageService.waitForInitialSync(2000),
        storageService.syncConfigAndSlides(true)
      ]);
      const latestSettings = storageService.getSettings();
      setSettings(latestSettings);
      const latestActiveSlides = (
        Array.isArray(latestSettings.introSlides) ? latestSettings.introSlides : DEFAULT_INTRO_SLIDES
      ).filter(s => s && s.isActive);
      const latestShouldShowIntro =
        latestSettings.isIntroSlideEnabled !== false && latestActiveSlides.length > 0;
      setCurrentRole('student');
      setStudentStep(latestShouldShowIntro ? 'intro' : 'login');
    } finally {
      setIsEnteringStudent(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 flex flex-col font-sans">
      {/* Top Professional Header */}
      <Navbar
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
        settings={settings}
        studentName={activeSession?.name || studentTempLogin?.name}
        studentGrade={activeSession?.grade || (studentTempLogin ? storageService.getTokenItem(studentTempLogin.token)?.grade : undefined)}
        onLogoutStudent={currentRole === 'student' ? handleLogoutStudent : undefined}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {/* 1. LANDING PORTAL (Role Selection) */}
        {currentRole === 'landing' && (
          <RoleSelector
            onSelectStudent={() => {
              void handleEnterStudentPortal();
            }}
            onSelectTeacher={() => handleSwitchRole('teacher')}
            settings={settings}
            isLoadingEntrance={isEnteringStudent}
          />
        )}

        {/* 2. STUDENT PORTAL */}
        {currentRole === 'student' && (
          <>
            {studentStep === 'intro' && shouldShowIntroSlide && (
              <IntroSlideView
                slides={activeIntroSlides}
                onBack={() => setCurrentRole('landing')}
                onContinue={() => setStudentStep('login')}
              />
            )}

            {studentStep === 'login' && (
              <StudentLogin
                settings={settings}
                onSuccess={handleStudentLoginSuccess}
                onBack={() => {
                  if (shouldShowIntroSlide) {
                    setStudentStep('intro');
                  } else {
                    setCurrentRole('landing');
                  }
                }}
              />
            )}

            {studentStep === 'identity' && studentTempLogin && (
              <StudentIdentityForm
                initialName={studentTempLogin.name}
                initialToken={studentTempLogin.token}
                initialGrade={storageService.getTokenItem(studentTempLogin.token)?.grade || '10 SMA'}
                initialSchool={storageService.getTokenItem(studentTempLogin.token)?.school || settings.schoolNameDefault}
                examDurationMinutes={storageService.getTokenItem(studentTempLogin.token)?.durationMinutes || settings.examDurationMinutes}
                onSubmit={handleStudentIdentitySubmit}
                onBack={() => setStudentStep('login')}
              />
            )}

            {studentStep === 'exam' && activeSession && (
              <ExamInterface
                session={activeSession}
                questions={storageService.getQuestionsByGrade(activeSession.grade)}
                durationMinutes={activeSession.durationMinutes || storageService.getTokenItem(activeSession.tokenUsed)?.durationMinutes || settings.examDurationMinutes || 30}
                onFinishExam={handleFinishExam}
              />
            )}

            {studentStep === 'result' && activeSession && (
              <ExamResultView
                session={activeSession}
                onBackToHome={() => {
                  setStudentStep('intro');
                  setCurrentRole('landing');
                }}
              />
            )}
          </>
        )}

        {/* 3. TEACHER DASHBOARD (Master Application) */}
        {currentRole === 'teacher' && (
          <TeacherDashboard
            settings={settings}
            onUpdateSettings={handleUpdateTeacherSettings}
            onBackToMain={() => setCurrentRole('landing')}
          />
        )}
      </main>

      {/* Teacher PIN Login Modal */}
      {showTeacherLoginModal && (
        <TeacherLoginModal
          settings={settings}
          onSuccess={handleTeacherAuthSuccess}
          onClose={() => setShowTeacherLoginModal(false)}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-rose-100 bg-white py-3 text-center text-xs text-slate-500 print:hidden">
        Lawan!! Nilai 100 • Asesmen SMA Kurikulum Merdeka
      </footer>
    </div>
  );
}
