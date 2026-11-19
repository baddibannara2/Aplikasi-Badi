import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { QUESTIONS } from './src/data/questionsData.js';
import { DEFAULT_INTRO_SLIDES } from './src/data/defaultSlides.js';
import { GradeLevel, Question, StudentSession, TeacherSettings } from './src/types/assessment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const SRC_DIR = path.resolve(__dirname, 'src', 'data');

const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const DB_BACKUP_FILE = path.resolve(DATA_DIR, 'db_backup.json');
const ROOT_BACKUP_FILE = path.resolve(__dirname, 'storage_backup.json');
const SRC_BACKUP_FILE = path.resolve(SRC_DIR, 'persisted_db.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DEFAULT_SETTINGS: TeacherSettings = {
  activeToken: 'SMA2026',
  isTokenActive: true,
  examDurationMinutes: 30,
  teacherPin: 'badi1234',
  schoolNameDefault: 'SMA Negeri 1',
  previousTokens: ['SMA2026'],
  isIntroSlideEnabled: true,
  introSlides: DEFAULT_INTRO_SLIDES
};

const INITIAL_DEMO_SESSIONS: StudentSession[] = [
  {
    id: 'demo-sma-101',
    name: 'Nadia Aurelia Putri',
    grade: '11 SMA',
    school: 'SMA Negeri 1 Surakarta',
    tokenUsed: 'SMA2026',
    durationMinutes: 30,
    startTime: Date.now() - 25 * 60 * 1000,
    lastActiveTime: Date.now() - 2 * 60 * 1000,
    status: 'selesai',
    currentQuestionIndex: 19,
    answeredCount: 20,
    doubtfulCount: 0,
    totalScore: 92.5,
    mathScore: 90,
    indoScore: 94.29,
    englishScore: 92.86,
    predicate: 'Istimewa',
    timeSpentSeconds: 1420,
    completedAt: Date.now() - 2 * 60 * 1000,
    answers: {}
  },
  {
    id: 'demo-sma-102',
    name: 'Muhammad Rafi Pratama',
    grade: '10 SMA',
    school: 'SMA Negeri 1 Surakarta',
    tokenUsed: 'SMA2026',
    durationMinutes: 30,
    startTime: Date.now() - 28 * 60 * 1000,
    lastActiveTime: Date.now() - 5 * 60 * 1000,
    status: 'selesai',
    currentQuestionIndex: 19,
    answeredCount: 20,
    doubtfulCount: 0,
    totalScore: 86,
    mathScore: 83.33,
    indoScore: 88.57,
    englishScore: 85.71,
    predicate: 'Baik',
    timeSpentSeconds: 1510,
    completedAt: Date.now() - 5 * 60 * 1000,
    answers: {}
  },
  {
    id: 'demo-sma-103',
    name: 'Clarissa Wijaya',
    grade: '10 SMA',
    school: 'SMA Negeri 1 Surakarta',
    tokenUsed: 'SMA2026',
    durationMinutes: 30,
    startTime: Date.now() - 32 * 60 * 1000,
    lastActiveTime: Date.now() - 8 * 60 * 1000,
    status: 'selesai',
    currentQuestionIndex: 19,
    answeredCount: 20,
    doubtfulCount: 0,
    totalScore: 80.5,
    mathScore: 76.67,
    indoScore: 82.86,
    englishScore: 81.43,
    predicate: 'Baik',
    timeSpentSeconds: 1650,
    completedAt: Date.now() - 8 * 60 * 1000,
    answers: {}
  }
];

interface DBStructure {
  settings: TeacherSettings;
  sessions: StudentSession[];
  questions: Question[];
  deletedSessionIds?: string[];
  deletedTokens?: Record<string, number>;
}

function parseDBFile(filePath: string): DBStructure | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content || !content.trim()) return null;
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        const hasSettings = parsed.settings && typeof parsed.settings === 'object';
        const rawSettings = hasSettings ? parsed.settings : DEFAULT_SETTINGS;

        const deletedSessionIds: string[] = Array.isArray(parsed.deletedSessionIds)
          ? Array.from(new Set(parsed.deletedSessionIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)))
          : [];
        const deletedSessionSet = new Set(deletedSessionIds);

        const deletedTokens: Record<string, number> = {};
        if (parsed.deletedTokens && typeof parsed.deletedTokens === 'object') {
          Object.entries(parsed.deletedTokens).forEach(([tok, ts]) => {
            const cleanTok = String(tok || '').trim().toUpperCase();
            if (cleanTok && typeof ts === 'number') {
              deletedTokens[cleanTok] = ts;
            }
          });
        }

        const prevTokens: string[] = Array.isArray(rawSettings.previousTokens)
          ? Array.from(new Set(rawSettings.previousTokens.map((t: unknown) => String(t || '').trim().toUpperCase()).filter(Boolean)))
          : [];

        const tokenList = Array.isArray(rawSettings.tokenList)
          ? rawSettings.tokenList
              .filter((item: any) => item && item.token)
              .map((item: any) => ({
                ...item,
                token: String(item.token).trim().toUpperCase(),
                isActive: typeof item.isActive === 'boolean' ? item.isActive : true
              }))
              .filter((item: any) => {
                const delAt = deletedTokens[item.token];
                return !delAt || (Number(item.createdAt) || 0) > delAt;
              })
          : undefined;

        const filteredPrevTokens = prevTokens.filter(t => {
          const delAt = deletedTokens[t];
          if (!delAt) return true;
          const recreated = tokenList?.find((item: any) => item.token === t && (Number(item.createdAt) || 0) > delAt);
          return Boolean(recreated);
        });

        let activeTok = hasSettings
          ? String(rawSettings.activeToken || '').trim().toUpperCase()
          : DEFAULT_SETTINGS.activeToken;

        if (activeTok && deletedTokens[activeTok]) {
          const recreated = tokenList?.find((item: any) => item.token === activeTok && (Number(item.createdAt) || 0) > deletedTokens[activeTok]);
          if (!recreated) {
            activeTok = tokenList && tokenList.length > 0 ? tokenList[0].token : '';
          }
        }

        const sessions = Array.isArray(parsed.sessions)
          ? parsed.sessions.filter((s: any) => {
              if (!s || !s.id) return false;
              if (deletedSessionSet.has(s.id)) return false;
              const tok = String(s.tokenUsed || '').trim().toUpperCase();
              const delAt = deletedTokens[tok];
              if (delAt && (Number(s.startTime) || 0) <= delAt) return false;
              return true;
            })
          : INITIAL_DEMO_SESSIONS;

        return {
          settings: {
            ...DEFAULT_SETTINGS,
            ...rawSettings,
            activeToken: activeTok,
            previousTokens: filteredPrevTokens,
            isIntroSlideEnabled: typeof rawSettings.isIntroSlideEnabled === 'boolean' ? rawSettings.isIntroSlideEnabled : true,
            introSlides: Array.isArray(rawSettings.introSlides) ? rawSettings.introSlides : DEFAULT_INTRO_SLIDES,
            ...(tokenList !== undefined ? { tokenList } : {})
          },
          sessions,
          questions: Array.isArray(parsed.questions) && parsed.questions.length > 0 ? parsed.questions : QUESTIONS,
          deletedSessionIds,
          deletedTokens
        };
      }
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return null;
}

function loadDB(): DBStructure {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SRC_DIR)) {
    fs.mkdirSync(SRC_DIR, { recursive: true });
  }

  // 1. Try primary DB file
  let dbData = parseDBFile(DB_FILE);

  // 2. Fallback to secondary backup file
  if (!dbData) {
    console.log('Primary DB file missing or corrupted. Trying secondary backup...');
    dbData = parseDBFile(DB_BACKUP_FILE);
  }

  // 3. Fallback to root backup file
  if (!dbData) {
    console.log('Secondary backup file missing. Trying root backup file...');
    dbData = parseDBFile(ROOT_BACKUP_FILE);
  }

  // 4. Fallback to src data backup file
  if (!dbData) {
    console.log('Root backup file missing. Trying src persisted file...');
    dbData = parseDBFile(SRC_BACKUP_FILE);
  }

  // 5. Default fallback or Lawan!! Nilai 100 SMA Kurikulum Merdeka migration
  const hasSmaMerdekaQuestions = Boolean(
    dbData &&
    Array.isArray(dbData.questions) &&
    dbData.questions.length >= 40 &&
    dbData.questions.some(q => q.grade === '10 SMA') &&
    dbData.questions.some(q => q.grade === '11 SMA') &&
    dbData.questions.some(q => q.subject === 'Bahasa Inggris')
  );
  const hasFivePointQuestions = Boolean(
    hasSmaMerdekaQuestions &&
    dbData &&
    dbData.questions.every(q =>
      q.type === 'true_false'
        ? Array.isArray(q.statements) && q.statements.length >= 5
        : Array.isArray(q.options) && q.options.length >= 5
    )
  );
  if (!dbData) {
    console.log('Initializing Lawan!! Nilai 100 SMA database...');
    dbData = {
      settings: DEFAULT_SETTINGS,
      sessions: INITIAL_DEMO_SESSIONS,
      questions: QUESTIONS,
      deletedSessionIds: [],
      deletedTokens: {}
    };
  } else if (!hasSmaMerdekaQuestions) {
    console.log('Migrating database to Lawan!! Nilai 100 SMA (Kelas 10 & 11 Kurikulum Merdeka)...');
    dbData.questions = QUESTIONS;
    const oldToken = (dbData.settings.activeToken || '').trim().toUpperCase();
    const nextToken = !oldToken || oldToken === 'SMP2026' ? 'SMA2026' : oldToken;
    dbData.settings = {
      ...dbData.settings,
      examDurationMinutes: dbData.settings.examDurationMinutes || 30,
      activeToken: nextToken,
      schoolNameDefault:
        dbData.settings.schoolNameDefault === 'SMP Negeri 1' || !dbData.settings.schoolNameDefault
          ? 'SMA Negeri 1'
          : dbData.settings.schoolNameDefault,
      previousTokens: Array.from(
        new Set(
          (dbData.settings.previousTokens || [])
            .map(t => (t === 'SMP2026' ? 'SMA2026' : t))
            .concat(nextToken)
            .filter(Boolean)
        )
      ),
      introSlides: DEFAULT_INTRO_SLIDES,
      ...(Array.isArray(dbData.settings.tokenList)
        ? {
            tokenList: dbData.settings.tokenList.map(t => ({
              ...t,
              token: t.token === 'SMP2026' ? 'SMA2026' : t.token,
              school: t.school === 'SMP Negeri 1' ? 'SMA Negeri 1' : t.school,
              grade: t.grade === ('9 SMP' as any) ? '11 SMA' : '10 SMA',
              durationMinutes: t.durationMinutes || 30
            }))
          }
        : {})
    };
    dbData.sessions = INITIAL_DEMO_SESSIONS;
  } else if (!hasFivePointQuestions) {
    console.log('Upgrading SMA question bank to 5 options/statements per question...');
    dbData.questions = QUESTIONS;
  }

  saveDBSync(dbData);
  return dbData;
}

function saveDBSync(dbData: DBStructure) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SRC_DIR)) {
      fs.mkdirSync(SRC_DIR, { recursive: true });
    }
    const jsonStr = JSON.stringify(dbData, null, 2);
    fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(DB_BACKUP_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(ROOT_BACKUP_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(SRC_BACKUP_FILE, jsonStr, 'utf-8');
  } catch (err) {
    console.error('Error saving DB file across backup locations:', err);
  }
}

let db = loadDB();
let dbRevision = Date.now();
let questionsRevision = Date.now();

let writeChain: Promise<void> = Promise.resolve();
let debouncedPrimaryTimer: ReturnType<typeof setTimeout> | null = null;
let debouncedBackupTimer: ReturnType<typeof setTimeout> | null = null;

async function writeFileAtomic(targetPath: string, content: string): Promise<void> {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  const uniqueSuffix = `${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const tmpPath = `${targetPath}.${uniqueSuffix}.tmp`;
  await fs.promises.writeFile(tmpPath, content, 'utf-8');
  await fs.promises.rename(tmpPath, targetPath);
}

function enqueueDiskWrite(includeBackups: boolean): Promise<void> {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain
    .then(async () => {
      await writeFileAtomic(DB_FILE, snapshot);
      if (includeBackups) {
        await Promise.all([
          writeFileAtomic(DB_BACKUP_FILE, snapshot),
          writeFileAtomic(ROOT_BACKUP_FILE, snapshot),
          writeFileAtomic(SRC_BACKUP_FILE, snapshot)
        ]);
      }
    })
    .catch(err => {
      console.error('Error persisting DB:', err);
    });
  return writeChain;
}

async function flushDBNow(): Promise<void> {
  if (debouncedPrimaryTimer) {
    clearTimeout(debouncedPrimaryTimer);
    debouncedPrimaryTimer = null;
  }
  if (debouncedBackupTimer) {
    clearTimeout(debouncedBackupTimer);
    debouncedBackupTimer = null;
  }
  await enqueueDiskWrite(true);
}

function scheduleDBWrite(): void {
  if (!debouncedPrimaryTimer) {
    debouncedPrimaryTimer = setTimeout(() => {
      debouncedPrimaryTimer = null;
      void enqueueDiskWrite(false);
    }, 250);
  }
  if (!debouncedBackupTimer) {
    debouncedBackupTimer = setTimeout(() => {
      debouncedBackupTimer = null;
      void enqueueDiskWrite(true);
    }, 2000);
  }
}

let sseClients: Array<{ id: number; res: express.Response }> = [];
let sseDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function broadcastSseNow() {
  if (sseDebounceTimer) {
    clearTimeout(sseDebounceTimer);
    sseDebounceTimer = null;
  }
  const payload = `data: ${JSON.stringify({ type: 'SYNC_DATA', revision: dbRevision, questionsRevision, timestamp: Date.now() })}\n\n`;
  const aliveClients: Array<{ id: number; res: express.Response }> = [];
  for (const c of sseClients) {
    try {
      c.res.write(payload);
      aliveClients.push(c);
    } catch {
      // client disconnected
    }
  }
  sseClients = aliveClients;
}

function scheduleSseNotify(immediate = false) {
  if (immediate) {
    broadcastSseNow();
    return;
  }
  if (!sseDebounceTimer) {
    sseDebounceTimer = setTimeout(() => {
      sseDebounceTimer = null;
      broadcastSseNow();
    }, 300);
  }
}

setInterval(() => {
  const aliveClients: Array<{ id: number; res: express.Response }> = [];
  for (const c of sseClients) {
    try {
      c.res.write(': keepalive\n\n');
      aliveClients.push(c);
    } catch {
      // client disconnected
    }
  }
  sseClients = aliveClients;
}, 25000);

// Helper to evaluate student session results if student abandons exam
function evaluateSessionResult(grade: GradeLevel, rawAnswers: Record<string, any>, questions: Question[]) {
  const normalizedGrade: GradeLevel =
    grade === '11 SMA' || (grade as string) === '9 SMP' ? '11 SMA' : '10 SMA';
  const gradeQuestions = questions.filter(q => q.grade === normalizedGrade);
  let mathScoreAccumulator = 0;
  let mathMaxPoints = 0;
  let indoScoreAccumulator = 0;
  let indoMaxPoints = 0;
  let englishScoreAccumulator = 0;
  let englishMaxPoints = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const evaluatedAnswers: Record<string, any> = {};

  gradeQuestions.forEach(question => {
    const studentState = rawAnswers[question.id] || {
      questionId: question.id,
      answer: null,
      isDoubtful: false,
      isAnswered: false
    };

    let scoreEarned = 0;
    let isCorrect = false;

    if (studentState.isAnswered && studentState.answer !== null && studentState.answer !== undefined) {
      if (question.type === 'single_choice') {
        if (studentState.answer === question.correctAnswer) {
          scoreEarned = 10;
          isCorrect = true;
        }
      } else if (question.type === 'multiple_choice') {
        const userChoices: string[] = Array.isArray(studentState.answer) ? studentState.answer : [];
        const correctChoices: string[] = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
        const totalOptions = question.options?.length || 5;

        if (userChoices.length > 0 && correctChoices.length > 0) {
          const correctHits = userChoices.filter((c: string) => correctChoices.includes(c)).length;
          const totalCorrectCount = correctChoices.length;

          if (userChoices.length >= totalOptions) {
            scoreEarned = 0;
            isCorrect = false;
          } else if (correctHits > 0) {
            const excessChoices = Math.max(0, userChoices.length - totalCorrectCount);
            const effectiveHits = Math.max(0, correctHits - excessChoices);
            if (effectiveHits > 0) {
              scoreEarned = Math.round(((effectiveHits / totalCorrectCount) * 10 + Number.EPSILON) * 100) / 100;
              isCorrect = scoreEarned === 10;
            }
          }
        }
      } else if (question.type === 'true_false') {
        const userMap = (studentState.answer as Record<string, boolean>) || {};
        const correctMap = (question.correctAnswer as Record<string, boolean>) || {};
        const totalStatements = question.statements?.length || Object.keys(correctMap).length || 5;

        let matchedStatements = 0;
        Object.keys(correctMap).forEach(statementKey => {
          if (userMap[statementKey] === correctMap[statementKey]) {
            matchedStatements++;
          }
        });

        scoreEarned = totalStatements > 0
          ? Math.round(((matchedStatements / totalStatements) * 10 + Number.EPSILON) * 100) / 100
          : 0;
        isCorrect = matchedStatements === totalStatements;
      }
    }

    if (scoreEarned > 0) {
      if (scoreEarned === 10) correctCount++;
      else correctCount += Math.round((scoreEarned / 10 + Number.EPSILON) * 100) / 100;
    } else {
      wrongCount++;
    }

    if (question.subject === 'Matematika') {
      mathScoreAccumulator += scoreEarned;
      mathMaxPoints += 10;
    } else if (question.subject === 'Bahasa Inggris') {
      englishScoreAccumulator += scoreEarned;
      englishMaxPoints += 10;
    } else {
      indoScoreAccumulator += scoreEarned;
      indoMaxPoints += 10;
    }

    evaluatedAnswers[question.id] = {
      ...studentState,
      scoreEarned,
      isCorrect
    };
  });

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const mathScore = mathMaxPoints > 0 ? round2((mathScoreAccumulator / mathMaxPoints) * 100) : 0;
  const indoScore = indoMaxPoints > 0 ? round2((indoScoreAccumulator / indoMaxPoints) * 100) : 0;
  const englishScore = englishMaxPoints > 0 ? round2((englishScoreAccumulator / englishMaxPoints) * 100) : 0;
  const totalMaxPoints = mathMaxPoints + indoMaxPoints + englishMaxPoints;
  const totalEarned = mathScoreAccumulator + indoScoreAccumulator + englishScoreAccumulator;
  const totalScore = totalMaxPoints > 0 ? round2((totalEarned / totalMaxPoints) * 100) : 0;

  correctCount = round2(correctCount);
  wrongCount = round2(Math.max(0, gradeQuestions.length - correctCount));

  let predicate: 'Istimewa' | 'Baik' | 'Memadai' | 'Kurang' = 'Kurang';
  if (totalScore >= 90) predicate = 'Istimewa';
  else if (totalScore >= 75) predicate = 'Baik';
  else if (totalScore >= 50) predicate = 'Memadai';

  return {
    answersWithScore: evaluatedAnswers,
    totalScore,
    mathScore,
    indoScore,
    englishScore,
    predicate,
    correctCount,
    wrongCount
  };
}

// Automatically complete sessions that have been inactive for >= 30 minutes
function autoCompleteInactiveSessions(): boolean {
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
  const now = Date.now();
  let changed = false;

  for (let i = 0; i < db.sessions.length; i++) {
    const s = db.sessions[i];
    if (s.status === 'mengerjakan') {
      const lastActive = s.lastActiveTime || s.startTime || 0;
      if (lastActive > 0 && now - lastActive >= INACTIVITY_TIMEOUT_MS) {
        changed = true;
        const completedAt = lastActive + INACTIVITY_TIMEOUT_MS;
        const timeSpentSeconds = Math.min(
          (s.durationMinutes || 30) * 60,
          Math.max(0, Math.floor((completedAt - s.startTime) / 1000))
        );
        const evalRes = evaluateSessionResult(s.grade, s.answers || {}, db.questions);
        db.sessions[i] = {
          ...s,
          status: 'selesai',
          completedAt,
          timeSpentSeconds,
          answers: evalRes.answersWithScore,
          totalScore: evalRes.totalScore,
          mathScore: evalRes.mathScore,
          indoScore: evalRes.indoScore,
          englishScore: evalRes.englishScore,
          predicate: evalRes.predicate,
          answeredCount: Object.values(s.answers || {}).filter(a => a.isAnswered).length,
          doubtfulCount: 0
        };
      }
    }
  }

  if (changed) {
    dbRevision++;
    void enqueueDiskWrite(false);
    scheduleSseNotify(true);
  }
  return changed;
}

// Check every 20 seconds for inactive student sessions
setInterval(() => {
  autoCompleteInactiveSessions();
}, 20000);

const app = express();

// Serve uploaded slide images directly before Vite / SPA middlewares
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Upload slide image endpoint (supports raw binary File body OR JSON { dataUrl })
app.post(
  '/api/upload-slide-image',
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '20mb' }),
  async (req, res, next) => {
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      try {
        const contentType = String(req.headers['content-type'] || '').toLowerCase();
        const rawName = decodeURIComponent(String(req.headers['x-file-name'] || ''));
        const extMatch = rawName.match(/\.([a-zA-Z0-9]{2,5})$/);
        let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
          ext = 'jpg';
        }

        const filename = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const targetPath = path.join(UPLOADS_DIR, filename);
        await fs.promises.writeFile(targetPath, req.body);
        return res.json({ success: true, url: `/uploads/${filename}`, size: req.body.length });
      } catch (err: any) {
        return res.status(500).json({ error: 'Gagal menyimpan file gambar di server: ' + (err?.message || 'Error') });
      }
    }
    return next();
  }
);

app.use(express.json({ limit: '25mb' }));

app.post('/api/upload-slide-image', async (req, res) => {
  try {
    const dataUrl = String(req.body?.dataUrl || '');
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Payload gambar tidak valid.' });
    }
    let ext = match[1].toLowerCase().replace('jpeg', 'jpg').replace('+xml', '');
    if (!['jpg', 'png', 'webp', 'gif'].includes(ext)) ext = 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Ukuran file gambar kosong.' });
    }
    const filename = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, filename);
    await fs.promises.writeFile(targetPath, buffer);
    return res.json({ success: true, url: `/uploads/${filename}`, size: buffer.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memproses unggahan gambar: ' + (err?.message || 'Error') });
  }
});

// 1. GET /api/sync
app.get('/api/sync', (req, res) => {
  autoCompleteInactiveSessions();
  const clientRev = req.query.rev ? Number(req.query.rev) : 0;
  const clientQRev = req.query.qrev ? Number(req.query.qrev) : 0;

  if (clientRev && clientRev === dbRevision) {
    return res.json({
      unchanged: true,
      revision: dbRevision,
      questionsRevision,
      timestamp: Date.now()
    });
  }

  const includeQuestions = !clientQRev || clientQRev !== questionsRevision;
  res.json({
    settings: db.settings,
    sessions: db.sessions,
    deletedSessionIds: db.deletedSessionIds || [],
    deletedTokens: db.deletedTokens || {},
    ...(includeQuestions ? { questions: db.questions } : {}),
    revision: dbRevision,
    questionsRevision,
    timestamp: Date.now()
  });
});

// 2. GET /api/stream (SSE)
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const clientId = Date.now() + Math.random();
  const client = { id: clientId, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', revision: dbRevision, questionsRevision, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// 3. POST /api/settings
app.post('/api/settings', async (req, res) => {
  const newSettings = req.body.settings || req.body;
  if (!newSettings || typeof newSettings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }

  if (!db.deletedTokens) db.deletedTokens = {};

  const rawTokenList = Array.isArray(newSettings.tokenList)
    ? newSettings.tokenList
        .filter((item: any) => item && item.token)
        .map((item: any) => ({
          ...item,
          token: String(item.token).trim().toUpperCase(),
          isActive: typeof item.isActive === 'boolean' ? item.isActive : true
        }))
    : undefined;

  // Allow explicitly recreated tokens (createdAt > deletedAt) and filter out stale deleted tokens
  const nextTokenList = rawTokenList
    ? rawTokenList.filter((item: any) => {
        const delAt = db.deletedTokens?.[item.token];
        if (!delAt) return true;
        if ((Number(item.createdAt) || 0) > delAt) {
          delete db.deletedTokens![item.token];
          return true;
        }
        return false;
      })
    : (db.settings as any).tokenList;

  let updatedToken = newSettings.activeToken !== undefined
    ? String(newSettings.activeToken || '').trim().toUpperCase()
    : String(db.settings.activeToken || '').trim().toUpperCase();

  if (updatedToken && db.deletedTokens[updatedToken]) {
    const delAt = db.deletedTokens[updatedToken];
    const recreated = Array.isArray(nextTokenList)
      ? nextTokenList.find((item: any) => item.token === updatedToken && (Number(item.createdAt) || 0) > delAt)
      : null;
    if (!recreated) {
      updatedToken = Array.isArray(nextTokenList) && nextTokenList.length > 0
        ? String(nextTokenList[0].token).trim().toUpperCase()
        : '';
    }
  }

  let nextPrevTokens: string[];
  if (Array.isArray(newSettings.previousTokens)) {
    nextPrevTokens = Array.from(new Set(
      newSettings.previousTokens.map((t: unknown) => String(t || '').trim().toUpperCase()).filter(Boolean)
    ));
  } else {
    nextPrevTokens = Array.from(new Set([
      ...(db.settings.previousTokens || []),
      ...(updatedToken ? [updatedToken] : [])
    ])).filter(Boolean);
  }

  nextPrevTokens = nextPrevTokens.filter(t => {
    const delAt = db.deletedTokens?.[t];
    if (!delAt) return true;
    const recreated = Array.isArray(nextTokenList)
      ? nextTokenList.find((item: any) => item.token === t && (Number(item.createdAt) || 0) > delAt)
      : null;
    return Boolean(recreated);
  });

  const nextIntroSlides = Array.isArray(newSettings.introSlides)
    ? newSettings.introSlides
        .filter((s: any) => s && typeof s === 'object' && s.id)
        .map((s: any) => ({
          id: String(s.id),
          title: String(s.title || ''),
          description: String(s.description || ''),
          imageUrl: String(s.imageUrl || ''),
          isActive: typeof s.isActive === 'boolean' ? s.isActive : true,
          displayMode: s.displayMode === 'image_only' ? 'image_only' : 'card'
        }))
    : db.settings.introSlides;

  const nextIsIntroEnabled = typeof newSettings.isIntroSlideEnabled === 'boolean'
    ? newSettings.isIntroSlideEnabled
    : (typeof db.settings.isIntroSlideEnabled === 'boolean' ? db.settings.isIntroSlideEnabled : true);

  db.settings = {
    ...db.settings,
    ...newSettings,
    activeToken: updatedToken,
    previousTokens: nextPrevTokens,
    isIntroSlideEnabled: nextIsIntroEnabled,
    ...(nextIntroSlides !== undefined ? { introSlides: nextIntroSlides } : {}),
    ...(nextTokenList !== undefined ? { tokenList: nextTokenList } : {})
  };

  dbRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, settings: db.settings, revision: dbRevision });
});

// 4. POST /api/sessions
app.post('/api/sessions', async (req, res) => {
  const incoming: StudentSession = req.body.session || req.body;
  if (!incoming || !incoming.id || !incoming.name) {
    return res.status(400).json({ error: 'Invalid session data' });
  }

  const normalizedToken = (incoming.tokenUsed || '').trim().toUpperCase();

  // Reject updates or re-creations for sessions that have been explicitly deleted
  if (Array.isArray(db.deletedSessionIds) && db.deletedSessionIds.includes(incoming.id)) {
    return res.json({ success: false, deleted: true, sessionDeleted: true, revision: dbRevision });
  }

  // Reject sessions belonging to a deleted token unless created after token deletion
  const tokenDeletedAt = db.deletedTokens?.[normalizedToken];
  if (tokenDeletedAt && (Number(incoming.startTime) || 0) <= tokenDeletedAt) {
    return res.json({ success: false, deleted: true, tokenDeleted: true, revision: dbRevision });
  }

  const session: StudentSession = {
    ...incoming,
    tokenUsed: normalizedToken
  };

  const index = db.sessions.findIndex(s => s.id === session.id);
  let isNewOrCompleted = false;

  if (index >= 0) {
    const existing = db.sessions[index];
    // Prevent late in-flight answer saves from reverting a finished exam
    if (existing.status === 'selesai' && session.status !== 'selesai') {
      return res.json({ success: true, session: existing, staleIgnored: true, revision: dbRevision });
    }
    // Prevent older timestamp packets from overwriting newer in-progress answers
    if (
      existing.status === session.status &&
      (session.lastActiveTime || 0) < (existing.lastActiveTime || 0)
    ) {
      return res.json({ success: true, session: existing, staleIgnored: true, revision: dbRevision });
    }
    db.sessions[index] = session;
    isNewOrCompleted = session.status === 'selesai';
  } else {
    // Guard against duplicate session creation for the exact same student name + token
    const cleanName = session.name.trim().toLowerCase();
    const existingDup = db.sessions.find(
      s => s.name.trim().toLowerCase() === cleanName && (s.tokenUsed || '').trim().toUpperCase() === normalizedToken
    );
    if (existingDup) {
      return res.json({ success: true, session: existingDup, deduplicated: true, revision: dbRevision });
    }
    db.sessions.unshift(session);
    isNewOrCompleted = true;
  }

  dbRevision++;
  if (isNewOrCompleted) {
    await flushDBNow();
    scheduleSseNotify(true);
  } else {
    scheduleDBWrite();
    scheduleSseNotify(false);
  }

  res.json({ success: true, session, revision: dbRevision });
});

// 5. DELETE /api/sessions/:id
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  if (!Array.isArray(db.deletedSessionIds)) db.deletedSessionIds = [];
  if (id && !db.deletedSessionIds.includes(id)) {
    db.deletedSessionIds.push(id);
    if (db.deletedSessionIds.length > 2000) {
      db.deletedSessionIds = db.deletedSessionIds.slice(-2000);
    }
  }
  db.sessions = db.sessions.filter(s => s.id !== id);
  dbRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, revision: dbRevision, deletedSessionId: id });
});

// 6. POST /api/sessions/clear
app.post('/api/sessions/clear', async (_req, res) => {
  if (!Array.isArray(db.deletedSessionIds)) db.deletedSessionIds = [];
  const clearedIds = db.sessions.map(s => s.id).filter(Boolean);
  db.deletedSessionIds = Array.from(new Set([...db.deletedSessionIds, ...clearedIds])).slice(-2000);
  db.sessions = [];
  dbRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, revision: dbRevision, clearedIds });
});

// 6b. DELETE /api/tokens/:token - Hapus token dan seluruh data pengerjaan siswa terhubung secara permanen
app.delete('/api/tokens/:token', async (req, res) => {
  const tokenToDelete = decodeURIComponent(req.params.token || '').trim().toUpperCase();
  if (!tokenToDelete) {
    return res.status(400).json({ error: 'Token tidak valid.' });
  }

  if (!Array.isArray(db.deletedSessionIds)) db.deletedSessionIds = [];
  if (!db.deletedTokens) db.deletedTokens = {};

  // Record deletion timestamp so stale client payloads can never resurrect this token or its sessions
  db.deletedTokens[tokenToDelete] = Date.now();

  // 1. Record & remove all sessions matching this token
  const matchingIds = db.sessions
    .filter(s => (s.tokenUsed || '').trim().toUpperCase() === tokenToDelete)
    .map(s => s.id);
  db.deletedSessionIds = Array.from(new Set([...db.deletedSessionIds, ...matchingIds])).slice(-2000);
  db.sessions = db.sessions.filter(s => (s.tokenUsed || '').trim().toUpperCase() !== tokenToDelete);

  // 2. Remove token from previousTokens array and tokenList
  if (Array.isArray(db.settings.previousTokens)) {
    db.settings.previousTokens = db.settings.previousTokens.filter(
      t => (t || '').trim().toUpperCase() !== tokenToDelete
    );
  } else {
    db.settings.previousTokens = [];
  }

  if (Array.isArray((db.settings as any).tokenList)) {
    (db.settings as any).tokenList = (db.settings as any).tokenList.filter(
      (item: any) => (item.token || '').trim().toUpperCase() !== tokenToDelete
    );
  }

  // 3. Reassign activeToken safely; never resurrect old tokens from previousTokens if tokenList is empty
  if ((db.settings.activeToken || '').trim().toUpperCase() === tokenToDelete) {
    const hasTokenList = Array.isArray((db.settings as any).tokenList);
    const remainingFromList = hasTokenList
      ? (db.settings as any).tokenList.find((item: any) => item && item.token)
      : null;

    if (remainingFromList && remainingFromList.token) {
      db.settings.activeToken = String(remainingFromList.token).trim().toUpperCase();
    } else if (!hasTokenList && db.settings.previousTokens.length > 0) {
      db.settings.activeToken = db.settings.previousTokens[0];
    } else {
      db.settings.activeToken = '';
      db.settings.isTokenActive = false;
    }
  }

  dbRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({
    success: true,
    settings: db.settings,
    deletedSessionIds: db.deletedSessionIds,
    deletedTokens: db.deletedTokens,
    revision: dbRevision
  });
});

// 7. POST /api/sessions/reset-demo
app.post('/api/sessions/reset-demo', async (_req, res) => {
  db.sessions = [...INITIAL_DEMO_SESSIONS];
  dbRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, revision: dbRevision });
});

// 8. POST /api/questions
app.post('/api/questions', async (req, res) => {
  const question: Question = req.body.question || req.body;
  if (!question || !question.id) {
    return res.status(400).json({ error: 'Invalid question data' });
  }
  const index = db.questions.findIndex(q => q.id === question.id);
  if (index >= 0) {
    db.questions[index] = question;
  } else {
    db.questions.push(question);
  }
  dbRevision++;
  questionsRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, revision: dbRevision });
});

// 9. POST /api/questions/reset
app.post('/api/questions/reset', async (_req, res) => {
  db.questions = [...QUESTIONS];
  dbRevision++;
  questionsRevision++;
  await flushDBNow();
  scheduleSseNotify(true);
  res.json({ success: true, revision: dbRevision });
});

// 10. GET /api/backup/export
app.get('/api/backup/export', (_req, res) => {
  autoCompleteInactiveSessions();
  res.json({
    version: 3,
    app: 'Lawan!! Nilai 100 - Asesmen SMA',
    timestamp: Date.now(),
    date: new Date().toISOString(),
    data: db
  });
});

// 11. POST /api/backup/import
app.post('/api/backup/import', async (req, res) => {
  try {
    let importedPayload = req.body?.data ?? req.body;
    while (
      importedPayload &&
      typeof importedPayload === 'object' &&
      !importedPayload.settings &&
      importedPayload.data &&
      typeof importedPayload.data === 'object'
    ) {
      importedPayload = importedPayload.data;
    }

    if (!importedPayload || typeof importedPayload !== 'object') {
      return res.status(400).json({ error: 'Format payload backup tidak valid.' });
    }

    const newSettings = importedPayload.settings;
    const newSessions = importedPayload.sessions;
    const newQuestions = importedPayload.questions;

    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'File cadangan tidak memuat pengaturan guru.' });
    }

    const normalizedActiveToken = newSettings.activeToken !== undefined
      ? String(newSettings.activeToken || '').trim().toUpperCase()
      : '';

    const normalizedPrevTokens: string[] = Array.isArray(newSettings.previousTokens)
      ? Array.from(new Set(
          newSettings.previousTokens
            .map((t: unknown) => String(t || '').trim().toUpperCase())
            .filter(Boolean)
        ))
      : (normalizedActiveToken ? [normalizedActiveToken] : []);

    const normalizedTokenList = Array.isArray(newSettings.tokenList)
      ? newSettings.tokenList
          .filter((item: any) => item && item.token)
          .map((item: any) => ({
            ...item,
            token: String(item.token).trim().toUpperCase(),
            isActive: typeof item.isActive === 'boolean' ? item.isActive : true
          }))
      : undefined;

    const restoreTs = Math.max(
      Number(req.body?.restoreTimestamp) || 0,
      Number(newSettings.lastRestoredAt) || 0,
      Date.now()
    );

    db.settings = {
      ...DEFAULT_SETTINGS,
      ...newSettings,
      activeToken: normalizedActiveToken,
      previousTokens: normalizedPrevTokens,
      lastRestoredAt: restoreTs,
      ...(normalizedTokenList !== undefined ? { tokenList: normalizedTokenList } : {})
    };

    if (Array.isArray(newSessions)) {
      db.sessions = newSessions
        .filter((s: any) => s && s.id && s.name)
        .map((s: any) => ({
          ...s,
          tokenUsed: String(s.tokenUsed || '').trim().toUpperCase()
        }));
    }

    if (Array.isArray(newQuestions) && newQuestions.length > 0) {
      db.questions = newQuestions;
      questionsRevision++;
    }

    db.deletedSessionIds = [];
    db.deletedTokens = {};

    dbRevision++;
    await flushDBNow();
    scheduleSseNotify(true);
    res.json({
      success: true,
      message: 'Cadangan berhasil dipulihkan!',
      settings: db.settings,
      sessions: db.sessions,
      questions: db.questions,
      revision: dbRevision,
      questionsRevision
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses file cadangan: ' + err.message });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        ws: { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
