import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  KeyRound, 
  BarChart3, 
  BookOpen, 
  Trash2, 
  Copy, 
  Calculator, 
  Search, 
  Printer, 
  X, 
  FileSpreadsheet, 
  RefreshCw,
  School,
  Pencil,
  AlertTriangle,
  Check,
  CheckSquare,
  Square,
  ChevronRight,
  Download,
  Upload,
  ShieldCheck,
  History,
  Database,
  Filter,
  Plus,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Layers,
  Trophy,
  ExternalLink
} from 'lucide-react';
import { 
  StudentSession, 
  TeacherSettings, 
  GradeLevel, 
  Question, 
  Subject,
  ChoiceOption,
  StatementItem,
  AssessmentTokenItem,
  IntroSlideItem
} from '../../types/assessment';
import { storageService } from '../../services/storageService';
import { DEFAULT_INTRO_SLIDES, DEFAULT_SLIDE_IMAGE_KEY } from '../../data/defaultSlides';
import { resolveSlideImageUrl, uploadSlideImage } from '../../utils/slideImage';

interface TeacherDashboardProps {
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: Partial<TeacherSettings>) => void;
  onBackToMain: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  settings,
  onUpdateSettings,
  onBackToMain
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'tokens' | 'analytics' | 'questions' | 'slides'>('monitor');
  const [sessions, setSessions] = useState<StudentSession[]>(() => storageService.getSessions());
  const [questionsList, setQuestionsList] = useState<Question[]>(() => storageService.getQuestions());
  
  // Filters and Sorting for Student Monitor
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<'name' | 'grade' | 'school' | 'token' | 'status' | 'progress' | 'score' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filters for Bank Soal
  const [questionGradeFilter, setQuestionGradeFilter] = useState<string>('all');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<string>('all');
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');

  // Filters for Analytics
  const [analyticsTokenFilter, setAnalyticsTokenFilter] = useState<string>('all');
  const [analyticsSchoolFilter, setAnalyticsSchoolFilter] = useState<string>('all');

  // Modals & Active state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentSession | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentSession | null>(null);

  const activeDetailStudent = useMemo(() => {
    if (!selectedStudentForDetail) return null;
    return sessions.find(s => s.id === selectedStudentForDetail.id) || selectedStudentForDetail;
  }, [sessions, selectedStudentForDetail]);

  const studentDetailRanking = useMemo(() => {
    if (!activeDetailStudent) return null;
    const cleanToken = (activeDetailStudent.tokenUsed || '').trim().toUpperCase();
    const completedAll = sessions
      .filter(s => s.status === 'selesai')
      .slice()
      .sort((a, b) => {
        const scoreDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.timeSpentSeconds || 999999) - (b.timeSpentSeconds || 999999);
      });

    const peerSameGradeAndToken = completedAll.filter(
      s => s.grade === activeDetailStudent.grade && (s.tokenUsed || '').trim().toUpperCase() === cleanToken
    );

    const peerSameTokenAllGrades = completedAll.filter(
      s => (s.tokenUsed || '').trim().toUpperCase() === cleanToken
    );

    const gradeTokenIdx = peerSameGradeAndToken.findIndex(s => s.id === activeDetailStudent.id);
    const tokenAllIdx = peerSameTokenAllGrades.findIndex(s => s.id === activeDetailStudent.id);
    const overallIdx = completedAll.findIndex(s => s.id === activeDetailStudent.id);

    return {
      isCompleted: activeDetailStudent.status === 'selesai',
      gradeTokenRank: gradeTokenIdx >= 0 ? gradeTokenIdx + 1 : null,
      gradeTokenTotal: peerSameGradeAndToken.length,
      tokenAllRank: tokenAllIdx >= 0 ? tokenAllIdx + 1 : null,
      tokenAllTotal: peerSameTokenAllGrades.length,
      overallRank: overallIdx >= 0 ? overallIdx + 1 : null,
      overallTotal: completedAll.length
    };
  }, [activeDetailStudent, sessions]);
  const [tokenToDelete, setTokenToDelete] = useState<{ token: string; count: number; isActive: boolean } | null>(null);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showResetQuestionsModal, setShowResetQuestionsModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  
  // Token clipboard & save toast
  const [copiedToken, setCopiedToken] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings edit state
  const [manualTokenInput, setManualTokenInput] = useState(settings.activeToken);
  const [durationInput, setDurationInput] = useState(settings.examDurationMinutes);
  const [schoolNameInput, setSchoolNameInput] = useState(settings.schoolNameDefault || 'SMA Negeri 1');

  // Token modal and unified list states
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [editingTokenItem, setEditingTokenItem] = useState<{
    originalToken: string;
    token: string;
    school: string;
    grade: GradeLevel;
    durationMinutes: number;
    isActive: boolean;
    surveyUrl: string;
  } | null>(null);

  const [newTokenForm, setNewTokenForm] = useState<{
    token: string;
    school: string;
    grade: GradeLevel;
    durationMinutes: number;
    isActive: boolean;
    surveyUrl: string;
  }>({
    token: '',
    school: settings.schoolNameDefault || 'SMA Negeri 1',
    grade: '10 SMA',
    durationMinutes: settings.examDurationMinutes || 30,
    isActive: true,
    surveyUrl: ''
  });

  const tokenItems = useMemo(() => {
    return storageService.getAllTokenItems();
  }, [settings, sessions]);

  // Intro slides customization states
  const introSlides = useMemo(() => {
    return Array.isArray(settings.introSlides) ? settings.introSlides : DEFAULT_INTRO_SLIDES;
  }, [settings.introSlides]);

  const isIntroSlideEnabled = settings.isIntroSlideEnabled !== false;
  const [editingSlide, setEditingSlide] = useState<IntroSlideItem | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);
  const [slideModalError, setSlideModalError] = useState<string | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [localSlidePreviewUrl, setLocalSlidePreviewUrl] = useState<string>('');
  const [uploadedPreviewMap, setUploadedPreviewMap] = useState<Record<string, string>>({});
  const slideFileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    storageService.setTeacherMonitoringActive(true);
    void storageService.syncWithServer(true, { includeSessions: true });
    const unsubscribe = storageService.subscribe(() => {
      setSessions(storageService.getSessions());
      setQuestionsList(storageService.getQuestions());
    });
    return () => {
      unsubscribe();
      storageService.setTeacherMonitoringActive(false);
    };
  }, []);

  useEffect(() => {
    setManualTokenInput(settings.activeToken);
    setDurationInput(settings.examDurationMinutes);
    setSchoolNameInput(settings.schoolNameDefault || 'SMA Negeri 1');
  }, [settings]);

  const showToast = (msg: string) => {
    setErrorMsg(null);
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const showErrorToast = (msg: string) => {
    setSaveSuccessMsg(null);
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Overall System Stats for Top Metric Cards
  const overallStats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'selesai');
    const completedWithScores = completed.filter(s => typeof s.totalScore === 'number');

    const totalStudentsCount = sessions.length;
    const inProgressCount = sessions.filter(s => s.status === 'mengerjakan').length;
    const completedCount = completed.length;

    const avgTotal = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(completedWithScores.reduce((acc, s) => acc + (s.totalScore || 0), 0) / completedWithScores.length)
      : 0;

    return {
      totalStudentsCount,
      inProgressCount,
      completedCount,
      avgTotal
    };
  }, [sessions]);

  // Unique tokens for filter
  const availableTokens = useMemo(() => {
    return tokenItems.map(t => t.token.toUpperCase());
  }, [tokenItems]);

  // Unique schools for filter
  const availableSchools = useMemo(() => {
    const set = new Set<string>();
    if (settings.schoolNameDefault && settings.schoolNameDefault.trim()) {
      set.add(settings.schoolNameDefault.trim());
    }
    sessions.forEach(s => {
      if (s.school && s.school.trim()) {
        set.add(s.school.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [settings.schoolNameDefault, sessions]);

  // Filtered Sessions for Analytics Tab (Token & Sekolah)
  const analyticsFilteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchToken = analyticsTokenFilter === 'all' || s.tokenUsed.trim().toUpperCase() === analyticsTokenFilter.trim().toUpperCase();
      const matchSchool = analyticsSchoolFilter === 'all' || s.school.trim().toLowerCase() === analyticsSchoolFilter.trim().toLowerCase();
      return matchToken && matchSchool;
    });
  }, [sessions, analyticsTokenFilter, analyticsSchoolFilter]);

  // Safe Analytics Computations (computed based on filtered sessions for token & school)
  const analyticsData = useMemo(() => {
    const target = analyticsFilteredSessions;
    const completed = target.filter(s => s.status === 'selesai');
    const completedWithScores = completed.filter(s => typeof s.totalScore === 'number');

    const totalStudentsCount = target.length;
    const inProgressCount = target.filter(s => s.status === 'mengerjakan').length;
    const completedCount = completed.length;

    const avgTotal = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(completedWithScores.reduce((acc, s) => acc + (s.totalScore || 0), 0) / completedWithScores.length)
      : 0;

    const avgMath = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(completedWithScores.reduce((acc, s) => acc + (s.mathScore || 0), 0) / completedWithScores.length)
      : 0;

    const avgIndo = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(completedWithScores.reduce((acc, s) => acc + (s.indoScore || 0), 0) / completedWithScores.length)
      : 0;

    const avgEnglish = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(completedWithScores.reduce((acc, s) => acc + (s.englishScore || 0), 0) / completedWithScores.length)
      : 0;

    const highestScore = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(Math.max(...completedWithScores.map(s => s.totalScore || 0)))
      : 0;

    const lowestScore = completedWithScores.length > 0
      ? storageService.roundTo2Decimals(Math.min(...completedWithScores.map(s => s.totalScore || 0)))
      : 0;

    const grades: GradeLevel[] = ['10 SMA', '11 SMA'];
    const gradeBreakdown = grades.map(g => {
      const gSessions = completedWithScores.filter(s => s.grade === g);
      const count = gSessions.length;
      const gAvg = count > 0 ? storageService.roundTo2Decimals(gSessions.reduce((a, b) => a + (b.totalScore || 0), 0) / count) : 0;
      const gMath = count > 0 ? storageService.roundTo2Decimals(gSessions.reduce((a, b) => a + (b.mathScore || 0), 0) / count) : 0;
      const gIndo = count > 0 ? storageService.roundTo2Decimals(gSessions.reduce((a, b) => a + (b.indoScore || 0), 0) / count) : 0;
      const gEnglish = count > 0 ? storageService.roundTo2Decimals(gSessions.reduce((a, b) => a + (b.englishScore || 0), 0) / count) : 0;
      return { grade: g, count, avg: gAvg, math: gMath, indo: gIndo, english: gEnglish };
    });

    const predicateList = [
      { label: 'Istimewa (≥ 90)', key: 'Istimewa', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
      { label: 'Baik (75 - 89,99)', key: 'Baik', color: 'bg-orange-500', textColor: 'text-orange-700' },
      { label: 'Memadai (50 - 74,99)', key: 'Memadai', color: 'bg-amber-500', textColor: 'text-amber-700' },
      { label: 'Kurang (< 50)', key: 'Kurang', color: 'bg-rose-500', textColor: 'text-rose-700' }
    ];

    const predicateDistribution = predicateList.map(p => {
      const count = completed.filter(s => s.predicate === p.key).length;
      const percent = completed.length > 0 ? storageService.roundTo2Decimals((count / completed.length) * 100) : 0;
      return { ...p, count, percent };
    });

    return {
      totalStudentsCount,
      inProgressCount,
      completedCount,
      avgTotal,
      avgMath,
      avgIndo,
      avgEnglish,
      highestScore,
      lowestScore,
      gradeBreakdown,
      predicateDistribution
    };
  }, [analyticsFilteredSessions]);

  // Filtered & Sorted Sessions for Monitoring
  const filteredSessions = useMemo(() => {
    const list = sessions.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.school.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchToken = tokenFilter === 'all' || s.tokenUsed.toUpperCase() === tokenFilter.toUpperCase();
      return matchSearch && matchGrade && matchStatus && matchToken;
    });

    if (!sortColumn) return list;

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
          break;
        case 'grade':
          comparison = a.grade.localeCompare(b.grade);
          break;
        case 'school':
          comparison = a.school.localeCompare(b.school, 'id', { sensitivity: 'base' });
          break;
        case 'token':
          comparison = a.tokenUsed.localeCompare(b.tokenUsed);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'progress':
          comparison = (a.answeredCount || 0) - (b.answeredCount || 0);
          break;
        case 'score': {
          const scoreA = typeof a.totalScore === 'number'
            ? a.totalScore
            : (storageService.calculateAssessmentResult(a.grade, a.answers || {}).totalScore || 0);
          const scoreB = typeof b.totalScore === 'number'
            ? b.totalScore
            : (storageService.calculateAssessmentResult(b.grade, b.answers || {}).totalScore || 0);
          comparison = scoreA - scoreB;
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sessions, searchQuery, gradeFilter, statusFilter, tokenFilter, sortColumn, sortDirection]);

  const handleSort = (col: 'name' | 'grade' | 'school' | 'token' | 'status' | 'progress' | 'score') => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection(col === 'score' || col === 'progress' ? 'desc' : 'asc');
    }
  };

  const renderSortIndicator = (col: 'name' | 'grade' | 'school' | 'token' | 'status' | 'progress' | 'score') => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-rose-600 shrink-0" />
    ) : (
      <ArrowDown className="h-3 w-3 text-rose-600 shrink-0" />
    );
  };

  // Filtered Questions for Bank Soal
  const filteredQuestions = useMemo(() => {
    return questionsList.filter(q => {
      const matchGrade = questionGradeFilter === 'all' || q.grade === questionGradeFilter;
      const matchSubject = questionSubjectFilter === 'all' || q.subject === questionSubjectFilter;
      const matchSearch = !questionSearchQuery.trim() ||
        q.questionText.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
        q.stimulusTitle.toLowerCase().includes(questionSearchQuery.toLowerCase());
      return matchGrade && matchSubject && matchSearch;
    });
  }, [questionsList, questionGradeFilter, questionSubjectFilter, questionSearchQuery]);

  // Token management handlers
  const handleGenerateToken = () => {
    const newToken = storageService.generateRandomToken();
    onUpdateSettings({ activeToken: newToken, isTokenActive: true });
    showToast(`Token baru berhasil diacak: ${newToken}`);
  };

  const handleToggleTokenAccess = async (tokenStr: string) => {
    const clean = tokenStr.trim().toUpperCase();
    const latestSettings = storageService.getSettings();
    const allItems = storageService.getAllTokenItems();
    const target = allItems.find(t => t.token === clean);
    if (!target) return;

    const newStatus = !target.isActive;
    const isMainActive = clean === (latestSettings.activeToken || '').trim().toUpperCase();

    const updatedList = allItems.map(item => {
      if (item.token === clean) {
        return { ...item, isActive: newStatus };
      }
      return item;
    });

    const newPrevTokens = Array.from(new Set(updatedList.map(item => item.token.trim().toUpperCase()).filter(Boolean)));

    await storageService.saveSettingsAsync({
      tokenList: updatedList,
      previousTokens: newPrevTokens,
      ...(isMainActive ? { isTokenActive: newStatus } : {})
    });

    showToast(`Akses siswa untuk token "${clean}" diubah menjadi ${newStatus ? 'Aktif' : 'Tutup'}.`);
  };

  const normalizeSurveyUrlInput = (raw: string): string => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleOpenEditTokenModal = (item: AssessmentTokenItem) => {
    setEditingTokenItem({
      originalToken: item.token,
      token: item.token,
      school: item.school,
      grade: item.grade || '10 SMA',
      durationMinutes: item.durationMinutes,
      isActive: item.isActive,
      surveyUrl: item.surveyUrl || ''
    });
  };

  const handleSaveEditedToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTokenItem) return;

    const latestSettings = storageService.getSettings();
    const origToken = editingTokenItem.originalToken.trim().toUpperCase();
    const cleanNewToken = editingTokenItem.token.trim().toUpperCase();
    const cleanSchool = editingTokenItem.school.trim() || latestSettings.schoolNameDefault || 'SMA Negeri 1';
    const cleanGrade = editingTokenItem.grade || '10 SMA';
    const cleanDuration = Math.max(1, Number(editingTokenItem.durationMinutes) || 30);
    const newActiveState = editingTokenItem.isActive;
    const cleanSurveyUrl = normalizeSurveyUrlInput(editingTokenItem.surveyUrl);

    if (!cleanNewToken) {
      showToast('Kode token tidak boleh kosong.');
      return;
    }

    const allItems = storageService.getAllTokenItems();
    if (cleanNewToken !== origToken && allItems.some(t => t.token === cleanNewToken)) {
      showToast(`Token "${cleanNewToken}" sudah ada di dalam daftar.`);
      return;
    }

    // Update sessions if token code changed
    if (cleanNewToken !== origToken) {
      for (const s of sessions) {
        if (s.tokenUsed.trim().toUpperCase() === origToken) {
          await storageService.saveSessionAsync({
            ...s,
            tokenUsed: cleanNewToken,
            school: cleanSchool,
            grade: cleanGrade,
            durationMinutes: cleanDuration
          });
        }
      }
      setSessions(storageService.getSessions());
    }

    const existingOrig = allItems.find(t => t.token === origToken);
    const updatedItem: AssessmentTokenItem = {
      token: cleanNewToken,
      school: cleanSchool,
      grade: cleanGrade,
      durationMinutes: cleanDuration,
      isActive: newActiveState,
      createdAt: cleanNewToken === origToken && existingOrig?.createdAt ? existingOrig.createdAt : Date.now(),
      ...(cleanSurveyUrl ? { surveyUrl: cleanSurveyUrl } : {})
    };

    const updatedList: AssessmentTokenItem[] = allItems
      .filter(t => t.token !== origToken && t.token !== cleanNewToken)
      .concat(updatedItem);

    const updatedPrevTokens = Array.from(new Set(updatedList.map(t => t.token.trim().toUpperCase()).filter(Boolean)));
    const isEditingActive = (latestSettings.activeToken || '').trim().toUpperCase() === origToken;

    await storageService.saveSettingsAsync({
      ...(isEditingActive ? { activeToken: cleanNewToken, isTokenActive: newActiveState } : {}),
      tokenList: updatedList,
      previousTokens: updatedPrevTokens
    });

    setEditingTokenItem(null);
    showToast(`Perubahan token "${cleanNewToken}" berhasil disimpan.`);
  };

  const handleCreateNewToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const latestSettings = storageService.getSettings();
    const cleanToken = (newTokenForm.token || storageService.generateRandomToken()).trim().toUpperCase();
    const cleanSchool = newTokenForm.school.trim() || latestSettings.schoolNameDefault || 'SMA Negeri 1';
    const cleanGrade = newTokenForm.grade || '10 SMA';
    const cleanDuration = Math.max(1, Number(newTokenForm.durationMinutes) || 30);
    const isActive = newTokenForm.isActive;
    const cleanSurveyUrl = normalizeSurveyUrlInput(newTokenForm.surveyUrl);

    const allItems = storageService.getAllTokenItems();
    if (allItems.some(t => t.token === cleanToken)) {
      showToast(`Token "${cleanToken}" sudah terdaftar.`);
      return;
    }

    const newItem: AssessmentTokenItem = {
      token: cleanToken,
      school: cleanSchool,
      grade: cleanGrade,
      durationMinutes: cleanDuration,
      isActive,
      createdAt: Date.now(),
      ...(cleanSurveyUrl ? { surveyUrl: cleanSurveyUrl } : {})
    };

    const updatedList = [newItem, ...allItems.filter(t => t.token !== cleanToken)];
    const updatedPrevTokens = Array.from(new Set(updatedList.map(t => t.token.trim().toUpperCase()).filter(Boolean)));

    await storageService.saveSettingsAsync({
      ...(!latestSettings.activeToken ? { activeToken: cleanToken, isTokenActive: isActive } : {}),
      tokenList: updatedList,
      previousTokens: updatedPrevTokens
    });

    setShowCreateTokenModal(false);
    showToast(`Token baru "${cleanToken}" berhasil dibuat dan disimpan.`);
  };

  const handleReactivateToken = (tokenToActivate: string) => {
    const clean = tokenToActivate.trim().toUpperCase();
    if (!clean) return;
    onUpdateSettings({
      activeToken: clean,
      isTokenActive: true
    });
    setManualTokenInput(clean);
    showToast(`Token "${clean}" berhasil diaktifkan kembali sebagai token aktif.`);
  };

  const handleSaveManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const clean = manualTokenInput.trim().toUpperCase();
    const cleanSchool = schoolNameInput.trim() || 'SMA Negeri 1';
    const cleanDuration = Math.max(1, Number(durationInput) || 30);
    
    onUpdateSettings({
      activeToken: clean,
      examDurationMinutes: cleanDuration,
      schoolNameDefault: cleanSchool
    });
    showToast(`Pengaturan disimpan. Token: "${clean}", Durasi: ${cleanDuration} Menit, Sekolah: "${cleanSchool}"`);
  };

  const handleToggleTokenActive = () => {
    onUpdateSettings({ isTokenActive: !settings.isTokenActive });
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(settings.activeToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSyncData = async () => {
    showToast('Menyinkronkan data siswa dan token...');
    const ok = await storageService.syncWithServer(true, { includeSessions: true });
    setSessions(storageService.getSessions());
    setQuestionsList(storageService.getQuestions());
    if (ok) {
      showToast('Sinkronisasi berhasil! Data siswa dan token telah diperbarui.');
    } else {
      showToast('Sinkronisasi selesai.');
    }
  };

  const handleUpdateApp = () => {
    showToast('Memeriksa dan memperbarui aplikasi...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleExportBackup = async () => {
    try {
      showToast('Menyiapkan file cadangan (backup JSON)...');
      const jsonStr = await storageService.exportBackupJson();
      const schoolName = (settings.schoolNameDefault || 'SMA_Negeri_1').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Backup_Lawan_Nilai_100_${schoolName}_${dateStr}.json`;
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1500);
      showToast(`File cadangan "${filename}" berhasil diunduh ke perangkat Anda.`);
    } catch {
      showErrorToast('Gagal membuat file cadangan data.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = await storageService.importBackupJson(content);
      if (result.success) {
        setSearchQuery('');
        setGradeFilter('all');
        setStatusFilter('all');
        setTokenFilter('all');
        setAnalyticsTokenFilter('all');
        setAnalyticsSchoolFilter('all');
        setSessions(storageService.getSessions());
        setQuestionsList(storageService.getQuestions());
        showToast(result.message);
      } else {
        showErrorToast(result.message);
      }
    };
    reader.onerror = () => {
      showErrorToast('Gagal membaca file cadangan dari perangkat.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Student Deletion Handler
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const target = studentToDelete;
    setStudentToDelete(null);
    if (selectedStudentForDetail?.id === target.id) {
      setSelectedStudentForDetail(null);
    }
    const deletedOnServer = await storageService.deleteSession(target.id);
    setSessions(storageService.getSessions());
    if (deletedOnServer) {
      showToast(`Data siswa "${target.name}" berhasil dihapus secara permanen.`);
    } else {
      showErrorToast(`Data siswa "${target.name}" dihapus lokal, tetapi koneksi server gagal.`);
    }
  };

  const confirmClearAll = async () => {
    setShowClearAllModal(false);
    const clearedOnServer = await storageService.clearAllSessions();
    setSessions(storageService.getSessions());
    if (clearedOnServer) {
      showToast('Seluruh data siswa berhasil dikosongkan secara permanen.');
    } else {
      showErrorToast('Data siswa dikosongkan lokal, tetapi koneksi server gagal.');
    }
  };

  const confirmDeleteToken = async () => {
    if (!tokenToDelete || isDeletingToken) return;
    const { token, count } = tokenToDelete;
    setIsDeletingToken(true);
    try {
      const deletedOnServer = await storageService.deleteToken(token);
      setSessions(storageService.getSessions());
      if (tokenFilter.trim().toUpperCase() === token.trim().toUpperCase()) {
        setTokenFilter('all');
      }
      if (analyticsTokenFilter.trim().toUpperCase() === token.trim().toUpperCase()) {
        setAnalyticsTokenFilter('all');
      }
      setTokenToDelete(null);
      if (deletedOnServer) {
        showToast(`Token "${token}" dan ${count} data siswa terhubung berhasil dihapus secara permanen.`);
      } else {
        showToast(`Token "${token}" dihapus lokal, tetapi koneksi server gagal. Coba muat ulang halaman.`);
      }
    } finally {
      setIsDeletingToken(false);
    }
  };

  // Excel (.xls) Export Handler
  const handleExportExcel = () => {
    if (sessions.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const schoolName = settings.schoolNameDefault || 'SMA Negeri 1';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const exportList = filteredSessions.length > 0 ? filteredSessions : sessions;

    let tableRows = '';
    exportList.forEach((s, idx) => {
      const isSelesai = s.status === 'selesai';
      const gradeQCount = questionsList.filter(q => q.grade === s.grade).length || 20;
      const durasiMins = s.timeSpentSeconds ? Math.floor(s.timeSpentSeconds / 60) : 0;
      const durasiSecs = s.timeSpentSeconds ? (s.timeSpentSeconds % 60) : 0;
      const durasiStr = `${durasiMins}m ${durasiSecs}s`;
      const selesaiStr = s.completedAt
        ? new Date(s.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '-';

      tableRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
          <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${s.name}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.grade}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${s.school}</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${s.tokenUsed}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${isSelesai ? 'Selesai' : 'Sedang Asesmen'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.answeredCount || 0}/${gradeQCount}</td>
          <td style="text-align: center; font-weight: bold; font-size: 13px; color: #be123c; border: 1px solid #cbd5e1; padding: 6px;">${s.totalScore ?? '-'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.indoScore ?? '-'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.englishScore ?? '-'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.mathScore ?? '-'}</td>
          <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${s.predicate ?? '-'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${durasiStr}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${selesaiStr}</td>
        </tr>
      `;
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Nilai Siswa</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; }
          .header-title { font-size: 15pt; font-weight: bold; color: #881337; text-align: center; margin-bottom: 4px; }
          .header-sub { font-size: 10pt; color: #475569; text-align: center; margin-bottom: 15px; }
          th { background-color: #be123c; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; text-align: center; }
          td { border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header-title">REKAPITULASI HASIL ASESMEN KURIKULUM MERDEKA &amp; TKA SMA — LAWAN!! NILAI 100</div>
        <div class="header-sub">Asal Sekolah: ${schoolName} | Tanggal Ekspor: ${currentDate} | Filter Token: ${tokenFilter === 'all' ? 'Semua Token' : tokenFilter}</div>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Lengkap Siswa</th>
              <th>Kelas</th>
              <th>Asal Sekolah</th>
              <th>Token</th>
              <th>Status</th>
              <th>Terjawab</th>
              <th>Nilai Akhir</th>
              <th>Bhs. Indonesia</th>
              <th>Bhs. Inggris</th>
              <th>Matematika</th>
              <th>Predikat</th>
              <th>Durasi</th>
              <th>Waktu Selesai</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Rekap_Lawan_Nilai_100_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xls`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);
    showToast(`File Excel "${filename}" berhasil diunduh.`);
  };

  // Question Editing Handlers
  const handleSaveEditedQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    storageService.saveQuestion(editingQuestion);
    setQuestionsList(storageService.getQuestions());
    showToast(`Soal #${editingQuestion.id} berhasil diperbarui.`);
    setEditingQuestion(null);
  };

  const handleResetQuestionsConfirm = () => {
    storageService.resetQuestionsToDefault();
    setQuestionsList(storageService.getQuestions());
    setShowResetQuestionsModal(false);
    showToast('Bank soal berhasil dikembalikan ke standar awal.');
  };

  // Intro Slides Customization Handlers
  const handleToggleIntroSlideEnabled = async () => {
    const nextVal = !isIntroSlideEnabled;
    await storageService.saveSettingsAsync({ isIntroSlideEnabled: nextVal });
    showToast(nextVal ? 'Slide pembuka peserta diaktifkan.' : 'Slide pembuka peserta dinonaktifkan.');
  };

  const handleOpenAddSlide = () => {
    setIsNewSlide(true);
    setSlideModalError(null);
    setPreviewImgError(false);
    setLocalSlidePreviewUrl('');
    setEditingSlide({
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      description: '',
      imageUrl: '',
      isActive: true,
      displayMode: 'card'
    });
  };

  const handleOpenEditSlide = (slide: IntroSlideItem) => {
    setIsNewSlide(false);
    setSlideModalError(null);
    setPreviewImgError(false);
    setLocalSlidePreviewUrl('');
    setEditingSlide({ ...slide });
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;
    setSlideModalError(null);
    setPreviewImgError(false);

    // Show immediate local preview right away before network upload finishes
    let instantBlobUrl = '';
    try {
      instantBlobUrl = URL.createObjectURL(file);
      setLocalSlidePreviewUrl(instantBlobUrl);
    } catch {
      // Ignore if createObjectURL fails
    }

    setIsUploadingSlideImage(true);
    try {
      const uploadedUrl = await uploadSlideImage(file);
      if (instantBlobUrl && uploadedUrl) {
        setUploadedPreviewMap(prev => ({ ...prev, [uploadedUrl]: instantBlobUrl }));
      }
      setEditingSlide(prev => (prev ? { ...prev, imageUrl: uploadedUrl } : prev));
    } catch (err: any) {
      setLocalSlidePreviewUrl('');
      setSlideModalError(err?.message || 'Gagal mengunggah gambar slide.');
    } finally {
      setIsUploadingSlideImage(false);
      e.target.value = '';
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setSlideModalError(null);

    const cleanTitle = editingSlide.title.trim();
    const cleanDesc = editingSlide.description.trim();
    const cleanImg = editingSlide.imageUrl.trim();

    if (!cleanTitle && !cleanDesc && !cleanImg) {
      setSlideModalError('Isi minimal judul, keterangan, atau gambar untuk slide.');
      return;
    }

    const slideToSave: IntroSlideItem = {
      ...editingSlide,
      title: cleanTitle,
      description: cleanDesc,
      imageUrl: cleanImg,
      displayMode: editingSlide.displayMode === 'image_only' ? 'image_only' : 'card'
    };

    const nextSlides = isNewSlide
      ? [...introSlides, slideToSave]
      : introSlides.map(s => (s.id === slideToSave.id ? slideToSave : s));

    await storageService.saveSettingsAsync({ introSlides: nextSlides });
    setEditingSlide(null);
    showToast(isNewSlide ? 'Slide baru berhasil ditambahkan.' : 'Perubahan slide berhasil disimpan.');
  };

  const handleToggleSlideActive = async (slideId: string) => {
    const nextSlides = introSlides.map(s =>
      s.id === slideId ? { ...s, isActive: !s.isActive } : s
    );
    await storageService.saveSettingsAsync({ introSlides: nextSlides });
    showToast('Status visibilitas slide diperbarui.');
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= introSlides.length) return;
    const nextSlides = [...introSlides];
    const [moved] = nextSlides.splice(index, 1);
    nextSlides.splice(targetIdx, 0, moved);
    await storageService.saveSettingsAsync({ introSlides: nextSlides });
  };

  const handleDeleteSlide = async (slideId: string) => {
    const nextSlides = introSlides.filter(s => s.id !== slideId);
    await storageService.saveSettingsAsync({ introSlides: nextSlides });
    showToast('Slide berhasil dihapus.');
  };

  const handleResetSlidesToDefault = async () => {
    await storageService.saveSettingsAsync({
      isIntroSlideEnabled: true,
      introSlides: DEFAULT_INTRO_SLIDES
    });
    showToast('Slide pembuka dikembalikan ke pengaturan bawaan.');
  };

  return (
    <div className="w-full px-2 sm:px-4 py-2 space-y-2 text-slate-800">
      
      {/* PRINT-ONLY OFFICIAL REPORT HEADER */}
      <div className="hidden print:block text-center pb-2 mb-3 border-b-2 border-slate-900">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
          Laporan Rekapitulasi Hasil Asesmen SMA — Lawan!! Nilai 100
        </h2>
        <p className="text-xs font-bold text-slate-700 mt-0.5">
          {settings.schoolNameDefault} • Kurikulum Merdeka &amp; Model TKA SMA
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • Token: {tokenFilter === 'all' ? 'Semua' : tokenFilter}
        </p>
      </div>

      {/* Fit Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Panel Pengawas Guru
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => void handleSyncData()}
              className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              title="Sinkronkan data siswa dan token yang tersimpan"
            >
              <RefreshCw className="h-3 w-3 text-amber-600" />
              <span>Sinkronisasi</span>
            </button>
            <button
              onClick={handleUpdateApp}
              className="flex items-center gap-1 rounded-md border border-orange-300 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-800 hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer"
              title="Periksa dan refresh update aplikasi"
            >
              <RefreshCw className="h-3 w-3 text-orange-600 animate-spin" />
              <span>Perbaharui Aplikasi</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Backup Data, Pulihkan Data, Ekspor Excel & Cetak */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
            title="Unduh file cadangan (.json) seluruh data siswa, nilai, token & soal"
          >
            <Download className="h-3.5 w-3.5 text-rose-600" />
            <span>Backup Data</span>
          </button>

          <label className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs">
            <Upload className="h-3.5 w-3.5 text-emerald-600" />
            <span>Pulihkan Data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Unduh format Microsoft Excel (.xls)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Cetak Laporan Rekapitulasi Siswa"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Floating Success & Error Toast */}
      {saveSuccessMsg && (
        <div className="rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-2 text-xs font-bold text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Compact Metric Cards (Fit & Tight) */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 print:hidden">
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">Total Siswa</span>
          <p className="font-mono text-lg sm:text-xl font-bold text-slate-900 leading-tight">{overallStats.totalStudentsCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-amber-600 block">Sedang Asesmen</span>
          <p className="font-mono text-lg sm:text-xl font-bold text-amber-700 leading-tight">{overallStats.inProgressCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 block">Selesai</span>
          <p className="font-mono text-lg sm:text-xl font-bold text-emerald-700 leading-tight">{overallStats.completedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-rose-600 block">Rata-Rata Nilai</span>
          <p className="font-mono text-lg sm:text-xl font-bold text-rose-700 leading-tight">{overallStats.avgTotal}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 text-xs font-bold print:hidden">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-3 py-1.5 border-b-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'monitor' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Siswa ({overallStats.totalStudentsCount})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-3 py-1.5 border-b-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'tokens' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Token & Sekolah
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 border-b-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'analytics' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Analisis
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-3 py-1.5 border-b-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'questions' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bank Soal ({questionsList.length})
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-3 py-1.5 border-b-2 text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'slides' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Slide Peserta ({introSlides.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MONITOR SISWA */}
      {/* ========================================================= */}
      {activeTab === 'monitor' && (
        <div className="space-y-2 w-full">
          {/* Fit Filter Bar With Direct Excel Export Button */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 print:hidden">
            <div className="relative w-full sm:w-52">
              <Search className="absolute inset-y-0 left-0 pl-2 flex items-center h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa / sekolah..."
                className="w-full rounded-md border border-slate-200 py-1 pl-7 pr-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {/* Token Filter */}
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Token</option>
                {availableTokens.map(t => (
                  <option key={t} value={t}>Token: {t}</option>
                ))}
              </select>

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Kelas</option>
                <option value="10 SMA">10 SMA</option>
                <option value="11 SMA">11 SMA</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="mengerjakan">Sedang Asesmen</option>
                <option value="selesai">Selesai</option>
              </select>

              {/* Excel button in Submenu Siswa */}
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                title="Ekspor tabel ini ke Excel"
              >
                <FileSpreadsheet className="h-3 w-3 text-emerald-700" />
                <span>Excel</span>
              </button>

              {sortColumn && (
                <button
                  type="button"
                  onClick={() => setSortColumn(null)}
                  className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-colors cursor-pointer"
                  title="Klik untuk menghapus pengurutan"
                >
                  <span>Sort: {sortColumn === 'name' ? 'Siswa' : sortColumn === 'grade' ? 'Kelas' : sortColumn === 'school' ? 'Sekolah' : sortColumn === 'token' ? 'Token' : sortColumn === 'status' ? 'Status' : sortColumn === 'progress' ? 'Progress' : 'Nilai'} ({sortDirection === 'asc' ? 'A-Z / Naik' : 'Z-A / Turun'})</span>
                  <X className="h-3 w-3 text-orange-600" />
                </button>
              )}

              <button
                onClick={() => setShowClearAllModal(true)}
                className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Kosongkan Seluruh Data Siswa"
              >
                <Trash2 className="h-3 w-3 text-rose-600" />
                <span>Kosongkan Semua</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className={`px-2.5 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'name' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Nama Siswa"
                  >
                    <div className="flex items-center gap-1">
                      <span>Siswa</span>
                      {renderSortIndicator('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('grade')}
                    className={`px-2 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'grade' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Kelas"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kelas</span>
                      {renderSortIndicator('grade')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('school')}
                    className={`px-2 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'school' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Asal Sekolah"
                  >
                    <div className="flex items-center gap-1">
                      <span>Sekolah</span>
                      {renderSortIndicator('school')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('token')}
                    className={`px-2 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'token' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Token"
                  >
                    <div className="flex items-center gap-1">
                      <span>Token</span>
                      {renderSortIndicator('token')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className={`px-2 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'status' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Status"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('progress')}
                    className={`px-2 py-1.5 text-[10px] cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'progress' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Progress Terjawab"
                  >
                    <div className="flex items-center gap-1">
                      <span>Progress</span>
                      {renderSortIndicator('progress')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('score')}
                    className={`px-2 py-1.5 text-[10px] text-center cursor-pointer hover:bg-slate-100 transition-colors group ${
                      sortColumn === 'score' ? 'bg-rose-50 text-rose-900 font-black' : 'font-semibold'
                    }`}
                    title="Klik untuk mengurutkan berdasarkan Nilai Akhir"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Nilai</span>
                      {renderSortIndicator('score')}
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-[10px] text-center font-semibold print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-400 text-xs">
                      Tidak ada data siswa yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((student) => {
                    const isComplete = student.status === 'selesai';
                    const gradeQuestionTotal = questionsList.filter(q => q.grade === student.grade).length || 20;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2.5 py-1 font-bold text-slate-900">{student.name}</td>
                        <td className="px-2 py-1 text-slate-600">{student.grade}</td>
                        <td className="px-2 py-1 text-slate-500 text-[11px] truncate max-w-[150px]">{student.school}</td>
                        <td className="px-2 py-1 font-mono font-bold text-rose-700">{student.tokenUsed}</td>
                        <td className="px-2 py-1">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {isComplete ? 'Selesai' : 'Sedang Asesmen'}
                          </span>
                        </td>
                        <td className="px-2 py-1 font-mono text-[11px] text-slate-600">
                          {(student.answeredCount || 0).toFixed(1)}/{gradeQuestionTotal}
                        </td>
                        <td className="px-2 py-1 text-center font-mono font-bold text-slate-900">
                          {(() => {
                            if (typeof student.totalScore === 'number') return student.totalScore;
                            // Calculate live score preview
                            const result = storageService.calculateAssessmentResult(student.grade, student.answers || {});
                            return (
                              <span className="text-orange-600" title="Skor sementara (belum selesai)">
                                {result.totalScore}*
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-1 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedStudentForDetail(student)}
                              className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Lihat Detail Siswa"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => setStudentToDelete(student)}
                              className="flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Hapus data siswa ini"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PRINTABLE SIGNATURE BLOCK */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-slate-800">
            <div className="text-center w-56">
              <p>Mengetahui,</p>
              <p className="font-bold mt-1">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold border-t border-slate-900 pt-1">( ........................................ )</p>
              <p className="text-[10px] text-slate-500">NIP. ........................................</p>
            </div>
            <div className="text-center w-56">
              <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold mt-1">Guru Pengawas</p>
              <div className="h-16"></div>
              <p className="font-bold border-t border-slate-900 pt-1">( ........................................ )</p>
              <p className="text-[10px] text-slate-500">NIP. ........................................</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TOKEN & SEKOLAH (Satu Kesatuan Daftar Fit) */}
      {/* ========================================================= */}
      {activeTab === 'tokens' && (
        <div className="space-y-2 w-full print:hidden">
          {/* Main Card: Satu Kesatuan Daftar Token & Sekolah */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {/* Header Toolbar */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-700 ring-1 ring-rose-100 shrink-0">
                  <KeyRound className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">Daftar Token & Sekolah Asesmen</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600 border border-slate-200">
                    {tokenItems.length}
                  </span>
                </div>
              </div>

              {/* Action Button: Tambah Token */}
              <button
                type="button"
                onClick={() => {
                  setNewTokenForm({
                    token: '',
                    school: settings.schoolNameDefault || 'SMA Negeri 1',
                    grade: '10 SMA',
                    durationMinutes: settings.examDurationMinutes || 30,
                    isActive: true,
                    surveyUrl: ''
                  });
                  setShowCreateTokenModal(true);
                }}
                className="flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Token</span>
              </button>
            </div>

            {/* Table: Satu Kesatuan Daftar */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Kode Token</th>
                    <th className="py-2 px-3">Asal Sekolah</th>
                    <th className="py-2 px-3">Kelas</th>
                    <th className="py-2 px-3">Durasi</th>
                    <th className="py-2 px-3">Akses Siswa</th>
                    <th className="py-2 px-3">Jumlah Siswa Selesai</th>
                    <th className="py-2 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tokenItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        Belum ada token. Klik tombol <strong>Tambah Token</strong> untuk membuat token baru.
                      </td>
                    </tr>
                  ) : (
                    tokenItems.map(item => {
                      const tokenSessions = sessions.filter(s => s.tokenUsed.trim().toUpperCase() === item.token);
                      const completedCount = tokenSessions.filter(s => s.status === 'selesai').length;
                      const totalCount = tokenSessions.length;

                      return (
                        <tr
                          key={item.token}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* 1. Kode Token */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-wide">
                                {item.token}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.token);
                                  showToast(`Token "${item.token}" berhasil disalin.`);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Salin Kode Token"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          {/* 2. Asal Sekolah */}
                          <td className="py-2 px-3 text-slate-800 font-semibold text-xs">
                            <div className="flex items-center gap-1.5">
                              <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]" title={item.school}>
                                {item.school}
                              </span>
                            </div>
                            {item.surveyUrl && (
                              <a
                                href={item.surveyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 hover:text-orange-800 hover:underline max-w-[200px] truncate"
                                title={item.surveyUrl}
                              >
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">Angket: {item.surveyUrl}</span>
                              </a>
                            )}
                          </td>

                          {/* 3. Kelas */}
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs border border-rose-200">
                              {item.grade || '10 SMA'}
                            </span>
                          </td>

                          {/* 4. Durasi Asesmen */}
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{item.durationMinutes}"</span>
                            </span>
                          </td>

                          {/* 4. Akses Siswa (Aktif/Tutup langsung dapat di klik) */}
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTokenAccess(item.token)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                                item.isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                              title={item.isActive ? 'Akses AKTIF. Klik untuk menutup akses siswa' : 'Akses TUTUP. Klik untuk membuka akses siswa'}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span>{item.isActive ? 'Aktif' : 'Tutup'}</span>
                            </button>
                          </td>

                          {/* 5. Jumlah siswa yang telah asesmen */}
                          <td className="py-2 px-3">
                            <div className="flex items-baseline gap-1 text-xs">
                              <strong className="text-slate-900 font-bold text-xs">{completedCount}</strong>
                              <span className="text-slate-500 text-[11px]">Siswa</span>
                            </div>
                          </td>

                          {/* 6. Tombol Edit dan Hapus */}
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTokenModal(item)}
                                className="p-1 rounded-md border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-800 transition-colors shadow-2xs cursor-pointer"
                                title="Edit Token & Sekolah"
                                aria-label="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTokenToDelete({ token: item.token, count: totalCount, isActive: item.isActive })}
                                className="p-1 rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors shadow-2xs cursor-pointer"
                                title="Hapus Token"
                                aria-label="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANALISIS (Fit & Compact) */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-2 w-full print:hidden">
          {/* Filter Bar Analisis: Token & Sekolah */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-700 shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Filter Analisis Hasil Siswa</span>
                </div>
              </div>

              {/* Reset button if filter is active */}
              {(analyticsTokenFilter !== 'all' || analyticsSchoolFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsTokenFilter('all');
                    setAnalyticsSchoolFilter('all');
                  }}
                  className="self-start sm:self-center rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
              {/* Filter Token */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-rose-600" />
                  <span>Pilih Token:</span>
                </label>
                <select
                  value={analyticsTokenFilter}
                  onChange={(e) => setAnalyticsTokenFilter(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="all">Semua Token ({availableTokens.length} Token)</option>
                  {availableTokens.map(t => {
                    const isActive = t === settings.activeToken.toUpperCase();
                    const count = sessions.filter(s => s.tokenUsed.trim().toUpperCase() === t).length;
                    return (
                      <option key={t} value={t}>
                        {t} {isActive ? '★ (Aktif)' : ''} — {count} Siswa
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filter Sekolah */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                  <School className="h-3 w-3 text-emerald-600" />
                  <span>Pilih Asal Sekolah:</span>
                </label>
                <select
                  value={analyticsSchoolFilter}
                  onChange={(e) => setAnalyticsSchoolFilter(e.target.value)}
                  className="w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="all">Semua Asal Sekolah ({availableSchools.length} Sekolah)</option>
                  {availableSchools.map(sch => {
                    const count = sessions.filter(s => s.school.trim().toLowerCase() === sch.toLowerCase()).length;
                    return (
                      <option key={sch} value={sch}>
                        {sch} — {count} Siswa
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Active Filter Indicators */}
            <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px]">
              <span className="text-slate-500 font-medium text-[10px]">Data teranalisis:</span>
              <span className="rounded bg-rose-50 px-1.5 py-0.2 font-bold text-rose-800 border border-rose-200 text-[10px]">
                {analyticsTokenFilter === 'all' ? 'Semua Token' : `Token: ${analyticsTokenFilter}`}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.2 font-bold text-emerald-800 border border-emerald-200 text-[10px]">
                {analyticsSchoolFilter === 'all' ? 'Semua Sekolah' : `Sekolah: ${analyticsSchoolFilter}`}
              </span>
              <span className="text-slate-600 font-semibold text-[10px] ml-1">
                ({analyticsData.totalStudentsCount} Siswa • {analyticsData.completedCount} Selesai)
              </span>
            </div>
          </div>

          {/* Empty State when no students match filter */}
          {analyticsData.totalStudentsCount === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Tidak ada data asesmen siswa yang cocok dengan filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAnalyticsTokenFilter('all');
                  setAnalyticsSchoolFilter('all');
                }}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 shadow-2xs cursor-pointer"
              >
                Tampilkan Semua Data
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 text-xs">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-slate-500 font-medium text-[10px] block">Rata-Rata Total</span>
              <p className="font-mono text-lg sm:text-xl font-bold text-rose-700 leading-tight">
                {analyticsData.avgTotal}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-slate-500 font-medium text-[10px] block">Rata Bhs. Indonesia</span>
              <p className="font-mono text-lg sm:text-xl font-bold text-rose-600 leading-tight">
                {analyticsData.avgIndo}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-slate-500 font-medium text-[10px] block">Rata Bhs. Inggris</span>
              <p className="font-mono text-lg sm:text-xl font-bold text-orange-600 leading-tight">
                {analyticsData.avgEnglish}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-slate-500 font-medium text-[10px] block">Rata Matematika</span>
              <p className="font-mono text-lg sm:text-xl font-bold text-amber-700 leading-tight">
                {analyticsData.avgMath}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-slate-500 font-medium text-[10px] block">Tertinggi / Terendah</span>
              <p className="font-mono text-sm sm:text-base font-bold text-slate-800 leading-tight">
                <span className="text-emerald-700 font-black">{analyticsData.highestScore}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-rose-700 font-black">{analyticsData.lowestScore}</span>
              </p>
            </div>
          </div>

          {/* Breakdown per Tingkat Kelas */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
              Capaian Berdasarkan Tingkat Kelas SMA
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {analyticsData.gradeBreakdown.map(gb => (
                <div key={gb.grade} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-900">{gb.grade}</span>
                    <span className="rounded bg-white px-1.5 py-0.2 font-semibold text-slate-600 border border-slate-200 text-[10px]">
                      {gb.count} Siswa
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Rata Total</span>
                      <strong className="font-mono text-sm text-rose-700">{gb.avg}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">B. Indo</span>
                      <strong className="font-mono text-sm text-rose-600">{gb.indo}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">B. Ing</span>
                      <strong className="font-mono text-sm text-orange-600">{gb.english}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Matematika</span>
                      <strong className="font-mono text-sm text-amber-800">{gb.math}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predicate Distribution with Visual Progress */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
              Distribusi Kategori Predikat Asesmen
            </h3>
            <div className="space-y-2 text-xs">
              {analyticsData.predicateDistribution.map(p => (
                <div key={p.key} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-[11px]">
                    <span className={p.textColor}>{p.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {p.count} Siswa ({p.percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${p.color} transition-all duration-500`}
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BANK SOAL (Fit & Compact) */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-2 w-full print:hidden">
          {/* Bank Soal Header & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white p-2 rounded-lg border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative w-44">
                <Search className="absolute inset-y-0 left-0 pl-2 flex items-center h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  value={questionSearchQuery}
                  onChange={(e) => setQuestionSearchQuery(e.target.value)}
                  placeholder="Cari materi / teks soal..."
                  className="w-full rounded-md border border-slate-200 py-1 pl-7 pr-2 text-xs focus:outline-none"
                />
              </div>

              <select
                value={questionGradeFilter}
                onChange={(e) => setQuestionGradeFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Kelas</option>
                <option value="10 SMA">10 SMA</option>
                <option value="11 SMA">11 SMA</option>
              </select>

              <select
                value={questionSubjectFilter}
                onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Mapel</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Matematika">Matematika</option>
              </select>
            </div>

            <button
              onClick={() => setShowResetQuestionsModal(true)}
              className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Kembalikan semua soal ke bawaan default Lawan!! Nilai 100"
            >
              <RefreshCw className="h-3 w-3 text-slate-500" />
              <span>Reset Bawaan</span>
            </button>
          </div>

          {/* Question List */}
          <div className="space-y-1.5">
            {filteredQuestions.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                Tidak ada soal yang sesuai dengan filter.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs space-y-1.5 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-rose-700 text-[11px]">{q.grade}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`font-semibold text-[11px] ${
                        q.subject === 'Matematika'
                          ? 'text-amber-800'
                          : q.subject === 'Bahasa Inggris'
                            ? 'text-orange-700'
                            : 'text-rose-700'
                      }`}>
                        {q.subject}
                      </span>
                      {q.questionFormat && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                            q.questionFormat === 'TKA SMA Terbaru'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-orange-50 text-orange-800 border-orange-200'
                          }`}>
                            {q.questionFormat}
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 text-[11px]">{q.topic}</span>
                    </div>

                    <button
                      onClick={() => setEditingQuestion({ ...q })}
                      className="flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Stimulus Snippet */}
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/60 text-slate-700 text-[11px] leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">Konteks: {q.stimulusTitle}</strong>
                    <p className="line-clamp-2 whitespace-pre-line">{q.stimulusContent}</p>
                  </div>

                  {/* Question Text */}
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                    {q.questionText}
                  </p>

                  {/* Answer Key & Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/60 p-2 text-emerald-900">
                      <strong>Kunci: </strong>
                      <span className="font-mono font-bold">
                        {typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-2 text-amber-950 line-clamp-2">
                      <strong>Pembahasan: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SLIDE PESERTA (Kustomisasi Tampilan Sebelum Login) */}
      {/* ========================================================= */}
      {activeTab === 'slides' && (
        <div className="space-y-2.5 w-full print:hidden">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Kustomisasi Slide / Gambar Pembuka Peserta
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ditampilkan setelah peserta menekan "Masuk" pada menu awal sebelum halaman Login Peserta.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleToggleIntroSlideEnabled()}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                    isIntroSlideEnabled
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isIntroSlideEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{isIntroSlideEnabled ? 'Slide Aktif' : 'Slide Nonaktif'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleResetSlidesToDefault()}
                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  title="Kembalikan slide bawaan"
                >
                  <RefreshCw className="h-3 w-3 text-slate-500" />
                  <span>Reset Bawaan</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddSlide}
                  className="flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 shadow-2xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Slide</span>
                </button>
              </div>
            </div>

            {!isIntroSlideEnabled && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Tampilan slide pembuka sedang dinonaktifkan. Peserta yang menekan "Masuk" akan langsung diarahkan ke Login Peserta.</span>
              </div>
            )}

            {introSlides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
                <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Belum ada slide pembuka</p>
                <p className="text-[11px] text-slate-500">
                  Klik tombol <strong>Tambah Slide</strong> untuk menambahkan gambar atau pengumuman sebelum peserta login.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {introSlides.map((slide, idx) => {
                  const previewUrl = (slide.imageUrl && uploadedPreviewMap[slide.imageUrl]) || resolveSlideImageUrl(slide.imageUrl);
                  return (
                    <div
                      key={slide.id}
                      className={`rounded-xl border bg-white overflow-hidden flex flex-col justify-between transition-colors ${
                        slide.isActive ? 'border-slate-200' : 'border-slate-200 opacity-65 bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-800">Slide #{idx + 1}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {slide.displayMode === 'image_only' ? 'Gambar Penuh' : 'Gambar + Teks'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => void handleMoveSlide(idx, 'up')}
                              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                              title="Geser ke atas"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === introSlides.length - 1}
                              onClick={() => void handleMoveSlide(idx, 'down')}
                              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                              title="Geser ke bawah"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 flex gap-3 items-start">
                          <div className="w-28 h-20 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                key={previewUrl}
                                src={previewUrl}
                                alt={slide.title || `Slide ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-28 h-20 object-cover block"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {slide.title || '(Tanpa Judul)'}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                              {slide.description || 'Tidak ada keterangan teks.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleSlideActive(slide.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                            slide.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {slide.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          <span>{slide.isActive ? 'Ditampilkan' : 'Disembunyikan'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlide(slide)}
                            className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700 hover:bg-orange-100 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteSlide(slide.id)}
                            className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            title="Hapus Slide"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS SISWA */}
      {/* ========================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hapus Data Siswa</h4>
                <p className="text-slate-500 text-[11px]">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
              Apakah Anda yakin ingin menghapus data siswa <strong className="text-slate-900">{studentToDelete.name}</strong> ({studentToDelete.grade}, Token: <span className="font-mono font-bold">{studentToDelete.tokenUsed}</span>)?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStudentToDelete(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteStudent}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI KOSONGKAN SEMUA SISWA */}
      {/* ========================================================= */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Kosongkan Semua Siswa</h4>
                <p className="text-slate-500 text-[11px]">Semua data sesi akan dihapus permanen</p>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
              Apakah Anda yakin ingin menghapus seluruh {sessions.length} data siswa? Data yang sudah dihapus tidak dapat dipulihkan kembali.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmClearAll}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition-colors"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET SOAL KE DEFAULT */}
      {/* ========================================================= */}
      {showResetQuestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Reset Bank Soal</h4>
                <p className="text-slate-500 text-[11px]">Kurikulum Merdeka &amp; Model TKA SMA</p>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
              Apakah Anda ingin mengembalikan seluruh 40 soal SMA (Kelas 10 &amp; 11) ke data bawaan asli? Perubahan kustom yang Anda simpan sebelumnya akan digantikan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetQuestionsModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleResetQuestionsConfirm}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700"
              >
                Ya, Kembalikan Bawaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT SOAL */}
      {/* ========================================================= */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Soal #{editingQuestion.id}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  {editingQuestion.grade} • {editingQuestion.subject} ({editingQuestion.type})
                </p>
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveEditedQuestion} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              
              <div>
                <label className="font-bold text-slate-800 block mb-1">Topik / Materi</label>
                <input
                  type="text"
                  value={editingQuestion.topic}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Judul Stimulus / Bacaan</label>
                <input
                  type="text"
                  value={editingQuestion.stimulusTitle}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, stimulusTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Teks Stimulus (Paragraf Bacaan / Kasus)</label>
                <textarea
                  rows={4}
                  value={editingQuestion.stimulusContent}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, stimulusContent: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-sans"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Pertanyaan / Perintah Soal</label>
                <textarea
                  rows={2}
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-sans font-medium"
                  required
                />
              </div>

              {/* Edit Options if single_choice */}
              {editingQuestion.type === 'single_choice' && editingQuestion.options && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="font-bold text-slate-800 block">Pilihan Jawaban & Kunci</label>
                  {editingQuestion.options.map((opt, optIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="font-bold w-6 text-center text-slate-700">{opt.id}.</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...editingQuestion.options!];
                          newOpts[optIdx] = { ...opt, text: e.target.value };
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white"
                        required
                      />
                      <label className="flex items-center gap-1 cursor-pointer font-bold text-xs text-rose-700 px-2 py-1 bg-white rounded border">
                        <input
                          type="radio"
                          name="correct_single"
                          checked={editingQuestion.correctAnswer === opt.id}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt.id })}
                        />
                        <span>Kunci</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Options if multiple_choice */}
              {editingQuestion.type === 'multiple_choice' && editingQuestion.options && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="font-bold text-slate-800 block">
                    Pilihan Jawaban Kompleks (Centang Kunci yang Benar)
                  </label>
                  {editingQuestion.options.map((opt, optIdx) => {
                    const currentCorrect = Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer : [];
                    const isChecked = currentCorrect.includes(opt.id);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="font-bold w-6 text-center text-slate-700">{opt.id}.</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...editingQuestion.options!];
                            newOpts[optIdx] = { ...opt, text: e.target.value };
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            let nextCorrect: string[];
                            if (isChecked) {
                              nextCorrect = currentCorrect.filter(id => id !== opt.id);
                            } else {
                              nextCorrect = [...currentCorrect, opt.id];
                            }
                            setEditingQuestion({ ...editingQuestion, correctAnswer: nextCorrect });
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold ${
                            isChecked ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {isChecked ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                          <span>Kunci</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edit Statements if true_false */}
              {editingQuestion.type === 'true_false' && editingQuestion.statements && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="font-bold text-slate-800 block">Pernyataan & Kunci Benar / Salah</label>
                  {editingQuestion.statements.map((stmt, sIdx) => {
                    const currentMap = (editingQuestion.correctAnswer as Record<string, boolean>) || {};
                    const isTrue = currentMap[stmt.id] === true;
                    return (
                      <div key={stmt.id} className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 w-6">#{sIdx + 1}</span>
                        <input
                          type="text"
                          value={stmt.text}
                          onChange={(e) => {
                            const newStmts = [...editingQuestion.statements!];
                            newStmts[sIdx] = { ...stmt, text: e.target.value };
                            setEditingQuestion({ ...editingQuestion, statements: newStmts });
                          }}
                          className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white"
                          required
                        />
                        <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion({
                                ...editingQuestion,
                                correctAnswer: { ...currentMap, [stmt.id]: true }
                              });
                            }}
                            className={`px-2 py-1 ${isTrue ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion({
                                ...editingQuestion,
                                correctAnswer: { ...currentMap, [stmt.id]: false }
                              });
                            }}
                            className={`px-2 py-1 ${!isTrue ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            Salah
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">Pembahasan / Penjelasan Jawaban</label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-sans"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-xs"
                >
                  Simpan Perubahan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL SISWA */}
      {/* ========================================================= */}
      {activeDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-xl text-xs">
            <button
              onClick={() => setSelectedStudentForDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-bold text-slate-900 text-sm pr-6">
              {activeDetailStudent.name} ({activeDetailStudent.grade})
            </h3>
            <p className="text-slate-500">
              {activeDetailStudent.school} • Token: <span className="font-mono font-bold text-rose-700">{activeDetailStudent.tokenUsed}</span>
            </p>

            {/* Student Ranking Banner */}
            {studentDetailRanking && (
              <div className={`mt-2.5 rounded-xl border p-2.5 flex items-center justify-between gap-3 ${
                studentDetailRanking.isCompleted
                  ? 'border-rose-200 bg-rose-50/70'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    studentDetailRanking.isCompleted && studentDetailRanking.gradeTokenRank === 1
                      ? 'bg-amber-100 text-amber-600'
                      : studentDetailRanking.isCompleted
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Peringkat Siswa ({activeDetailStudent.grade} · Token {activeDetailStudent.tokenUsed})
                    </span>
                    {studentDetailRanking.isCompleted && studentDetailRanking.gradeTokenRank ? (
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <strong className="text-sm font-black text-rose-800">
                          Peringkat #{studentDetailRanking.gradeTokenRank} dari {studentDetailRanking.gradeTokenTotal} siswa
                        </strong>
                        {studentDetailRanking.overallTotal > studentDetailRanking.gradeTokenTotal && studentDetailRanking.overallRank && (
                          <span className="text-[10px] font-medium text-slate-600">
                            (Umum: #{studentDetailRanking.overallRank}/{studentDetailRanking.overallTotal})
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-600">
                        Belum ada peringkat (masih mengerjakan)
                      </p>
                    )}
                  </div>
                </div>

                {activeDetailStudent.predicate && (
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    activeDetailStudent.predicate === 'Istimewa'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeDetailStudent.predicate === 'Baik'
                        ? 'bg-orange-100 text-orange-800'
                        : activeDetailStudent.predicate === 'Memadai'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeDetailStudent.predicate}
                  </span>
                )}
              </div>
            )}

            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                <span className="text-slate-500 block">Total:</span>
                <strong className="font-bold text-base text-rose-700">{activeDetailStudent.totalScore ?? '-'}</strong>
              </div>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-900">
                <span className="block">Bhs. Indonesia:</span>
                <strong className="font-bold text-base">{activeDetailStudent.indoScore ?? '-'}</strong>
              </div>
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-2 text-orange-900">
                <span className="block">Bhs. Inggris:</span>
                <strong className="font-bold text-base">{activeDetailStudent.englishScore ?? '-'}</strong>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-900">
                <span className="block">Matematika:</span>
                <strong className="font-bold text-base">{activeDetailStudent.mathScore ?? '-'}</strong>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {questionsList.filter(q => q.grade === activeDetailStudent.grade).map((q, idx) => {
                const ansState = activeDetailStudent.answers?.[q.id];
                const score = ansState?.scoreEarned ?? 0;
                let statusColor = 'text-rose-700';
                let statusText = `Salah (0/10)`;

                if (score === 10) {
                  statusColor = 'text-emerald-700';
                  statusText = `Benar (10/10)`;
                } else if (score > 0) {
                  statusColor = 'text-amber-700';
                  statusText = `Sebagian (${score}/10)`;
                }

                return (
                  <div key={q.id} className="rounded-lg border p-2 text-[11px]">
                    <div className="flex justify-between font-semibold">
                      <span>#{idx + 1} {q.subject}</span>
                      <span className={`${statusColor} font-bold`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap justify-between gap-1 text-slate-600">
                      <span>Jawaban: <strong className="text-slate-900">{ansState?.answer ? (Array.isArray(ansState.answer) ? ansState.answer.join(', ') : typeof ansState.answer === 'object' ? JSON.stringify(ansState.answer) : String(ansState.answer)) : '-'}</strong></span>
                      <span>Kunci: <strong className="text-emerald-700">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t text-right">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="rounded-lg bg-slate-900 px-3 py-1 font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL: HAPUS 1 SISWA */}
      {/* ========================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Konfirmasi Hapus Data Siswa</span>
            </div>
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus data siswa <strong>"{studentToDelete.name}"</strong> ({studentToDelete.grade})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KOSONGKAN SEMUA SISWA */}
      {/* ========================================================= */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Konfirmasi Kosongkan Seluruh Data Siswa</span>
            </div>
            <p className="text-slate-600 font-medium">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700">SELURUH {sessions.length} data siswa</strong>? Tabel akan dikosongkan secara permanen di server dan semua perangkat.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HAPUS TOKEN & DATA SISWA TERHUBUNG */}
      {/* ========================================================= */}
      {tokenToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Hapus Token "{tokenToDelete.token}" dari Server?</span>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-950 space-y-1.5">
              <p className="font-bold text-rose-900">Perhatian: Tindakan Ini Tidak Dapat Dibatalkan!</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                <li>Token <strong className="font-mono text-slate-900">{tokenToDelete.token}</strong> akan dihapus permanen dari riwayat token server.</li>
                <li>Seluruh <strong className="text-rose-800">{tokenToDelete.count} data pengerjaan siswa</strong> dengan token ini akan ikut terhapus secara permanen dari server.</li>
                {tokenToDelete.isActive && (
                  <li className="text-rose-700 font-bold">
                    Token ini saat ini sedang AKTIF. Token aktif akan otomatis dialihkan ke token lain (atau dikosongkan jika tidak ada token tersisa).
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingToken}
                onClick={() => setTokenToDelete(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingToken}
                onClick={() => void confirmDeleteToken()}
                className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingToken ? 'Menghapus...' : 'Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH TOKEN BARU */}
      {/* ========================================================= */}
      {showCreateTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Token Asesmen</h3>
                  <p className="text-[11px] text-slate-500">Buat token baru beserta asal sekolah dan durasinya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTokenModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewToken} className="space-y-3.5">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Kode Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTokenForm.token}
                    onChange={(e) => setNewTokenForm({ ...newTokenForm, token: e.target.value.toUpperCase() })}
                    placeholder="Contoh: SMA2026"
                    className="flex-1 rounded-lg border border-slate-300 py-1.5 px-3 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = storageService.generateRandomToken();
                      setNewTokenForm({ ...newTokenForm, token: rand });
                    }}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Acak
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Asal Sekolah
                </label>
                <input
                  type="text"
                  value={newTokenForm.school}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, school: e.target.value })}
                  placeholder="Contoh: SMA Negeri 1 Sragen"
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-medium text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Kelas Asesmen
                </label>
                <select
                  value={newTokenForm.grade}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, grade: e.target.value as GradeLevel })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-bold text-slate-900 bg-white focus:outline-none focus:border-rose-600"
                >
                  <option value="10 SMA">10 SMA</option>
                  <option value="11 SMA">11 SMA</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Durasi Asesmen (Menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={newTokenForm.durationMinutes}
                    onChange={(e) => setNewTokenForm({ ...newTokenForm, durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-3 pr-14 font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                    required
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-slate-400">
                    Menit
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Link Angket Siswa (Website)
                </label>
                <input
                  type="text"
                  value={newTokenForm.surveyUrl}
                  onChange={(e) => setNewTokenForm({ ...newTokenForm, surveyUrl: e.target.value })}
                  placeholder="https://forms.gle/... (opsional)"
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-medium text-slate-900 focus:outline-none focus:border-rose-600"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Link ini akan dibuka saat siswa menekan tombol <strong>Isi Angket</strong> setelah selesai mengerjakan.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTokenForm.isActive}
                    onChange={(e) => setNewTokenForm({ ...newTokenForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Buka Akses Siswa Langsung (Status: Aktif)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTokenModal(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Simpan Token Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT TOKEN & SEKOLAH */}
      {/* ========================================================= */}
      {editingTokenItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Token & Sekolah</h3>
                  <p className="text-[11px] text-slate-500">Perbarui data token {editingTokenItem.originalToken}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTokenItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedToken} className="space-y-3.5">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Kode Token
                </label>
                <input
                  type="text"
                  value={editingTokenItem.token}
                  onChange={(e) => setEditingTokenItem({ ...editingTokenItem, token: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Asal Sekolah
                </label>
                <input
                  type="text"
                  value={editingTokenItem.school}
                  onChange={(e) => setEditingTokenItem({ ...editingTokenItem, school: e.target.value })}
                  placeholder="Contoh: SMA Negeri 1 Sragen"
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-medium text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Kelas Asesmen
                </label>
                <select
                  value={editingTokenItem.grade}
                  onChange={(e) => setEditingTokenItem({ ...editingTokenItem, grade: e.target.value as GradeLevel })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-bold text-slate-900 bg-white focus:outline-none focus:border-rose-600"
                >
                  <option value="10 SMA">10 SMA</option>
                  <option value="11 SMA">11 SMA</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Durasi Asesmen (Menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={editingTokenItem.durationMinutes}
                    onChange={(e) => setEditingTokenItem({ ...editingTokenItem, durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-3 pr-14 font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                    required
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-slate-400">
                    Menit
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Link Angket Siswa (Website)
                </label>
                <input
                  type="text"
                  value={editingTokenItem.surveyUrl}
                  onChange={(e) => setEditingTokenItem({ ...editingTokenItem, surveyUrl: e.target.value })}
                  placeholder="https://forms.gle/... (opsional)"
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 font-medium text-slate-900 focus:outline-none focus:border-rose-600"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Link ini akan dibuka saat siswa menekan tombol <strong>Isi Angket</strong> setelah selesai mengerjakan.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTokenItem.isActive}
                    onChange={(e) => setEditingTokenItem({ ...editingTokenItem, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Akses Siswa Aktif (dapat login dengan token ini)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTokenItem(null)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT SLIDE PESERTA */}
      {/* ========================================================= */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isNewSlide ? 'Tambah Slide Pembuka Baru' : 'Edit Slide Pembuka'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kustomisasi gambar, judul, dan pesan sebelum halaman login peserta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {slideModalError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{slideModalError}</span>
                </div>
              )}

              {/* Live Preview */}
              <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-200 bg-white text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Pratinjau Tampilan Peserta</span>
                  {editingSlide.imageUrl && (
                    <span className="text-[10px] font-medium text-emerald-700">
                      {editingSlide.imageUrl.startsWith('/uploads/')
                        ? 'Tersimpan lokal (unggah ulang agar sinkron)'
                        : editingSlide.imageUrl === DEFAULT_SLIDE_IMAGE_KEY
                          ? 'Ilustrasi bawaan'
                          : editingSlide.imageUrl.startsWith('data:')
                            ? 'Tersinkron ke semua perangkat'
                            : 'URL eksternal'}
                    </span>
                  )}
                </div>
                {(() => {
                  const activePreviewSrc =
                    localSlidePreviewUrl ||
                    (editingSlide.imageUrl && uploadedPreviewMap[editingSlide.imageUrl]) ||
                    resolveSlideImageUrl(editingSlide.imageUrl);
                  return (
                    <div className="w-full bg-slate-100 overflow-hidden">
                      {activePreviewSrc && !previewImgError ? (
                        <img
                          key={activePreviewSrc}
                          src={activePreviewSrc}
                          alt="Pratinjau slide"
                          referrerPolicy="no-referrer"
                          onLoad={() => setPreviewImgError(false)}
                          onError={() => setPreviewImgError(true)}
                          className="w-full h-48 sm:h-52 object-contain block"
                        />
                      ) : (
                        <div className="h-36 flex flex-col items-center justify-center px-4 text-center text-slate-400 space-y-1">
                          <ImageIcon className="h-7 w-7 mx-auto" />
                          <p className="text-[11px] font-medium">
                            {previewImgError
                              ? 'Gambar gagal dimuat. Coba unggah ulang file gambar atau periksa URL.'
                              : 'Belum ada gambar (tampilan banner teks)'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {editingSlide.displayMode !== 'image_only' && (editingSlide.title || editingSlide.description) && (
                  <div className="p-3 bg-white border-t border-slate-100 space-y-1">
                    {editingSlide.title && (
                      <p className="font-bold text-sm text-slate-900">{editingSlide.title}</p>
                    )}
                    {editingSlide.description && (
                      <p className="text-[11px] text-slate-600 whitespace-pre-line line-clamp-3">
                        {editingSlide.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upload or Image URL */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Gambar / Poster Slide</label>
                <input
                  ref={slideFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/*"
                  onChange={handleSlideImageUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingSlideImage}
                    onClick={() => slideFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-bold text-rose-800 hover:bg-rose-100 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <Upload className="h-3.5 w-3.5 text-rose-600" />
                    <span>{isUploadingSlideImage ? 'Mengunggah...' : 'Upload Gambar dari Perangkat'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImgError(false);
                      setSlideModalError(null);
                      setLocalSlidePreviewUrl('');
                      setEditingSlide({ ...editingSlide, imageUrl: DEFAULT_SLIDE_IMAGE_KEY });
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Pakai Ilustrasi Bawaan
                  </button>

                  {(editingSlide.imageUrl || localSlidePreviewUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImgError(false);
                        setSlideModalError(null);
                        setLocalSlidePreviewUrl('');
                        setEditingSlide({ ...editingSlide, imageUrl: '' });
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={editingSlide.imageUrl.startsWith('data:') || editingSlide.imageUrl.startsWith('/uploads/') ? '' : editingSlide.imageUrl}
                  onChange={(e) => {
                    setPreviewImgError(false);
                    setSlideModalError(null);
                    setLocalSlidePreviewUrl('');
                    setEditingSlide({ ...editingSlide, imageUrl: e.target.value });
                  }}
                  placeholder={editingSlide.imageUrl.startsWith('data:') || editingSlide.imageUrl.startsWith('/uploads/') ? 'Gambar terunggah tersimpan (atau tempel URL baru di sini)' : 'Atau tempel URL gambar (https://...)'}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              {/* Display Mode */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Mode Tampilan Slide</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, displayMode: 'card' })}
                    className={`rounded-lg border px-3 py-2 font-bold text-left transition-colors cursor-pointer ${
                      editingSlide.displayMode !== 'image_only'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">Gambar + Judul & Pesan</span>
                    <span className="text-[10px] font-medium opacity-80">Cocok untuk ilustrasi & panduan teks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, displayMode: 'image_only' })}
                    className={`rounded-lg border px-3 py-2 font-bold text-left transition-colors cursor-pointer ${
                      editingSlide.displayMode === 'image_only'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">Poster / Gambar Penuh</span>
                    <span className="text-[10px] font-medium opacity-80">Cocok untuk poster infografis jadi</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Judul Slide {editingSlide.displayMode === 'image_only' ? '(Label internal guru)' : ''}
                </label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="Contoh: Petunjuk Pengerjaan Asesmen Lawan!! Nilai 100"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Keterangan / Pesan untuk Peserta</label>
                <textarea
                  rows={3}
                  value={editingSlide.description}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  placeholder="Tuliskan pesan motivasi, tata tertib ujian, atau informasi penting lainnya..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-sans focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlide.isActive}
                    onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Tampilkan slide ini kepada peserta</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Simpan Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
