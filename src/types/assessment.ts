export type GradeLevel = '10 SMA' | '11 SMA';
export type Subject = 'Bahasa Indonesia' | 'Bahasa Inggris' | 'Matematika';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';
export type QuestionFormat = 'Reguler Kurikulum Merdeka' | 'TKA SMA Terbaru';

export interface ChoiceOption {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface StatementItem {
  id: string; // 's1', 's2', 's3', 's4'
  text: string;
}

export interface Question {
  id: string;
  grade: GradeLevel;
  subject: Subject;
  questionFormat?: QuestionFormat;
  topic: string;
  cognitiveLevel:
    | 'Knowing (Pemahaman)'
    | 'Applying (Penerapan)'
    | 'Reasoning (Penalaran)'
    | 'Menemukan Informasi'
    | 'Interpretasi & Integrasi'
    | 'Evaluasi & Refleksi'
    | 'Penerapan'
    | 'Penalaran'
    | 'Pemahaman';
  type: QuestionType;
  stimulusTitle: string;
  stimulusContent: string;
  stimulusType: 'text' | 'table' | 'dialogue' | 'infographic';
  stimulusTableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  stimulusNote?: string;
  questionText: string;
  options?: ChoiceOption[];
  statements?: StatementItem[];
  // For single_choice: 'A'
  // For multiple_choice: ['A', 'C']
  // For true_false: { s1: true, s2: false, s3: true, s4: false }
  correctAnswer: string | string[] | Record<string, boolean>;
  explanation: string;
  keyTakeaway: string;
}

export interface StudentAnswerState {
  questionId: string;
  answer: string | string[] | Record<string, boolean> | null;
  isDoubtful: boolean;
  isAnswered: boolean;
  scoreEarned?: number; // 0 to 10
  isCorrect?: boolean;
}

export interface StudentSession {
  id: string;
  name: string;
  grade: GradeLevel;
  school: string;
  tokenUsed: string;
  durationMinutes?: number;
  startTime: number;
  lastActiveTime: number;
  status: 'mengerjakan' | 'selesai' | 'belum_mulai';
  currentQuestionIndex: number;
  answeredCount: number;
  doubtfulCount: number;
  answers: Record<string, StudentAnswerState>;
  totalScore?: number; // 0 - 100
  mathScore?: number; // 0 - 100
  indoScore?: number; // 0 - 100
  englishScore?: number; // 0 - 100
  predicate?: 'Istimewa' | 'Baik' | 'Memadai' | 'Kurang';
  timeSpentSeconds?: number;
  completedAt?: number;
}

export interface AssessmentTokenItem {
  token: string;
  school: string;
  grade?: GradeLevel;
  durationMinutes: number;
  isActive: boolean;
  createdAt?: number;
  surveyUrl?: string;
}

export interface IntroSlideItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  displayMode?: 'card' | 'image_only';
  order?: number;
  updatedAt?: number;
}

export interface TeacherSettings {
  activeToken: string;
  isTokenActive: boolean;
  examDurationMinutes: number;
  teacherPin: string;
  schoolNameDefault: string;
  previousTokens?: string[];
  tokenList?: AssessmentTokenItem[];
  introSlides?: IntroSlideItem[];
  isIntroSlideEnabled?: boolean;
  introSlidesInitialized?: boolean;
  deletedTokens?: Record<string, number>;
  lastBackupDate?: string;
  lastRestoredAt?: number;
  updatedAt?: number;
}
