import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore';
import {
  AssessmentTokenItem,
  GradeLevel,
  IntroSlideItem,
  Question,
  StudentAnswerState,
  StudentSession,
  TeacherSettings
} from '../types/assessment';
import { QUESTIONS } from '../data/questionsData';
import { DEFAULT_INTRO_SLIDES } from '../data/defaultSlides';
import { db, handleFirestoreError, OperationType, stripUndefinedDeep } from '../lib/firebase';

const SETTINGS_KEY = 'tka_keren_settings_v1';
const SESSIONS_KEY = 'tka_keren_sessions_v1';
const QUESTIONS_KEY = 'tka_keren_questions_v1';
const DELETED_SESSIONS_KEY = 'tka_deleted_sessions_v1';
const DELETED_TOKENS_KEY = 'tka_deleted_tokens_v1';
const ACTIVE_STUDENT_SESSION_KEY = 'tka_active_student_session_v1';
const PENDING_OUTBOX_KEY = 'tka_pending_outbox_v1';
const BROADCAST_CHANNEL_NAME = 'tka_sync_channel';

const CONFIG_COLLECTION = 'app_config';
const CONFIG_DOC_ID = 'main';
const SLIDES_COLLECTION = 'intro_slides';
const SESSIONS_COLLECTION = 'student_sessions';
const DELETED_SESSIONS_COLLECTION = 'deleted_sessions';
const QUESTIONS_COLLECTION = 'questions';

const normalizeGradeValue = (grade: unknown): GradeLevel => {
  if (grade === '11 SMA' || grade === '9 SMP') return '11 SMA';
  return '10 SMA';
};

const isValidSmaQuestion = (q: any): q is Question => {
  const hasFiveChoices =
    q?.type === 'true_false'
      ? Array.isArray(q?.statements) && q.statements.length >= 5
      : Array.isArray(q?.options) && q.options.length >= 5;
  return Boolean(
    q &&
      typeof q === 'object' &&
      q.id &&
      (q.grade === '10 SMA' || q.grade === '11 SMA') &&
      (q.subject === 'Bahasa Indonesia' || q.subject === 'Bahasa Inggris' || q.subject === 'Matematika') &&
      hasFiveChoices
  );
};

const EMPTY_SETTINGS: TeacherSettings = {
  activeToken: '',
  isTokenActive: false,
  examDurationMinutes: 30,
  teacherPin: 'badi1234',
  schoolNameDefault: 'SMA Negeri 1',
  previousTokens: [],
  tokenList: [],
  isIntroSlideEnabled: true,
  introSlidesInitialized: false,
  introSlides: DEFAULT_INTRO_SLIDES
};

class StorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<() => void> = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private firestoreUnsubs: Unsubscribe[] = [];
  private teacherFirestoreUnsubs: Unsubscribe[] = [];
  private teacherMonitoringActive = false;
  private tokenListeners: Map<string, { refCount: number; unsub: Unsubscribe }> = new Map();

  private settingsCache: TeacherSettings;
  private sessionsCache: StudentSession[];
  private questionsCache: Question[];
  private deletedSessionIds: Set<string> = new Set();
  private deletedTokens: Map<string, number> = new Map();
  private firestoreSlideIds: Set<string> = new Set();

  private serverRevision = 0;
  private syncEpoch = 0;
  private localMutationEpoch = 0;
  private activeMutationCount = 0;
  private settingsSaveSeq = 0;
  private isRestoring = false;
  private hasUnsyncedSettings = false;
  private inFlightSync: Promise<boolean> | null = null;
  private inFlightConfigSync: Promise<boolean> | null = null;
  private inFlightTokenSyncs: Map<string, Promise<boolean>> = new Map();
  private pendingSessionSaves: Map<string, StudentSession> = new Map();
  private sessionSaveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private pendingOutbox: Map<string, StudentSession> = new Map();
  private isFlushingOutbox = false;

  private hasRemoteConfigSnapshot = false;
  private hasRemoteSlidesSnapshot = false;
  private remoteConfigExistsOnServer = false;
  private remoteSlidesInitializedFlag = false;
  private firestoreBootstrapInFlight: Promise<void> | null = null;
  private initialSyncWaiters: Array<() => void> = [];
  private initialSyncResolved = false;

  constructor() {
    this.readDeletedSessionsFromLocal();
    this.readDeletedTokensFromLocal();
    this.readPendingOutboxFromLocal();
    this.settingsCache = this.readSettingsFromLocal();
    this.sessionsCache = this.readSessionsFromLocal();
    this.questionsCache = this.readQuestionsFromLocal();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = event => {
          if (event.data?.type === 'SYNC_DATA') {
            this.settingsCache = this.readSettingsFromLocal();
            this.sessionsCache = this.readSessionsFromLocal();
            this.questionsCache = this.readQuestionsFromLocal();
            this.notifyListenersOnly();
          }
        };
      }

      window.addEventListener('storage', e => {
        if (e.key === SETTINGS_KEY || e.key === SESSIONS_KEY || e.key === QUESTIONS_KEY) {
          this.settingsCache = this.readSettingsFromLocal();
          this.sessionsCache = this.readSessionsFromLocal();
          this.questionsCache = this.readQuestionsFromLocal();
          this.notifyListenersOnly();
        }
      });

      window.addEventListener('online', () => {
        void this.flushPendingOutbox();
      });

      this.startFirestoreRealtimeSync();
      void this.syncConfigAndSlides(false);
      void this.flushPendingOutbox();
    }
  }

  private resolveInitialSyncWaiters(): void {
    if (this.initialSyncResolved) return;
    if (this.hasRemoteConfigSnapshot && this.hasRemoteSlidesSnapshot) {
      this.initialSyncResolved = true;
      const waiters = this.initialSyncWaiters.splice(0);
      waiters.forEach(fn => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    }
  }

  public waitForInitialSync(timeoutMs = 2000): Promise<void> {
    if (this.initialSyncResolved || typeof window === 'undefined') {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.initialSyncResolved = true;
        resolve();
      }, timeoutMs);
      this.initialSyncWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private startFirestoreRealtimeSync(): void {
    if (typeof window === 'undefined' || this.firestoreUnsubs.length > 0) return;

    // 1. Real-time app_config/main listener
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const unsubConfig = onSnapshot(
      configRef,
      snapshot => {
        this.hasRemoteConfigSnapshot = true;
        if (snapshot.exists()) {
          this.remoteConfigExistsOnServer = true;
          const data = snapshot.data() as Record<string, any>;
          this.remoteSlidesInitializedFlag = Boolean(data.introSlidesInitialized);
          this.applyRemoteConfigData(data);
        } else if (!snapshot.metadata.fromCache && !this.firestoreBootstrapInFlight) {
          this.remoteConfigExistsOnServer = false;
          void this.bootstrapFirestoreIfEmpty();
        }
        this.resolveInitialSyncWaiters();
      },
      error => {
        this.hasRemoteConfigSnapshot = true;
        this.resolveInitialSyncWaiters();
        try {
          handleFirestoreError(error, OperationType.GET, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
        } catch {
          // Handled and logged
        }
      }
    );
    this.firestoreUnsubs.push(unsubConfig);

    // 2. Real-time intro_slides collection listener
    const slidesRef = collection(db, SLIDES_COLLECTION);
    const unsubSlides = onSnapshot(
      slidesRef,
      snapshot => {
        this.hasRemoteSlidesSnapshot = true;
        const remoteIds = new Set<string>();
        const remoteSlides: IntroSlideItem[] = [];

        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Record<string, any>;
          if (data && typeof data === 'object' && data.id) {
            remoteIds.add(docSnap.id);
            remoteSlides.push({
              id: String(data.id),
              title: String(data.title || ''),
              description: String(data.description || ''),
              imageUrl: String(data.imageUrl || ''),
              isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
              displayMode: data.displayMode === 'image_only' ? 'image_only' : 'card',
              order: typeof data.order === 'number' ? data.order : 0,
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0
            });
          }
        });

        this.firestoreSlideIds = remoteIds;

        if (remoteSlides.length > 0) {
          remoteSlides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          this.applyRemoteSlides(remoteSlides);
        } else if (
          !snapshot.metadata.fromCache &&
          (this.remoteSlidesInitializedFlag || this.remoteConfigExistsOnServer)
        ) {
          // Teacher explicitly deleted all slides
          this.applyRemoteSlides([]);
        }
        this.resolveInitialSyncWaiters();
      },
      error => {
        this.hasRemoteSlidesSnapshot = true;
        this.resolveInitialSyncWaiters();
        try {
          handleFirestoreError(error, OperationType.LIST, SLIDES_COLLECTION);
        } catch {
          // Handled and logged
        }
      }
    );
    this.firestoreUnsubs.push(unsubSlides);

    // 3. Real-time questions collection listener (lightweight, shared across all users)
    // NOTE: Full-collection listeners for student_sessions and deleted_sessions are intentionally
    // deferred to setTeacherMonitoringActive(true) so 35+ concurrent student phones never trigger
    // O(N^2) broadcast snapshot storms.

    // 5. Real-time questions collection listener
    const questionsRef = collection(db, QUESTIONS_COLLECTION);
    const unsubQuestions = onSnapshot(
      questionsRef,
      snapshot => {
        if (snapshot.empty) return;
        const customMap = new Map<string, Question>();
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Question;
          if (isValidSmaQuestion(data)) {
            customMap.set(data.id, data);
          }
        });
        if (customMap.size > 0) {
          const merged = QUESTIONS.map(q => customMap.get(q.id) || q);
          customMap.forEach((q, id) => {
            if (!QUESTIONS.some(base => base.id === id)) {
              merged.push(q);
            }
          });
          if (JSON.stringify(merged) !== JSON.stringify(this.questionsCache)) {
            this.questionsCache = merged;
            this.persistQuestionsToLocal();
            this.broadcastChange();
          }
        }
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, QUESTIONS_COLLECTION);
        } catch {
          // Handled
        }
      }
    );
    this.firestoreUnsubs.push(unsubQuestions);
  }

  public setTeacherMonitoringActive(active: boolean): void {
    if (typeof window === 'undefined') return;
    if (active === this.teacherMonitoringActive) return;
    this.teacherMonitoringActive = active;

    if (active) {
      if (this.teacherFirestoreUnsubs.length === 0) {
        const deletedRef = collection(db, DELETED_SESSIONS_COLLECTION);
        const unsubDeleted = onSnapshot(
          deletedRef,
          snapshot => {
            let changed = false;
            snapshot.forEach(docSnap => {
              const id = docSnap.id;
              if (id && !this.deletedSessionIds.has(id)) {
                this.deletedSessionIds.add(id);
                const timer = this.sessionSaveTimers.get(id);
                if (timer) {
                  clearTimeout(timer);
                  this.sessionSaveTimers.delete(id);
                }
                this.pendingSessionSaves.delete(id);
                this.pendingOutbox.delete(id);
                changed = true;
              }
            });
            if (changed) {
              this.persistDeletedSessionsToLocal();
              this.persistPendingOutboxToLocal();
              const filtered = this.sessionsCache.filter(
                s => !this.deletedSessionIds.has(s.id) && !this.isTokenDeleted(s.tokenUsed, s.startTime)
              );
              if (filtered.length !== this.sessionsCache.length) {
                this.sessionsCache = filtered;
                this.persistSessionsToLocal();
                this.broadcastChange();
              }
            }
          },
          error => {
            try {
              handleFirestoreError(error, OperationType.LIST, DELETED_SESSIONS_COLLECTION);
            } catch {
              // Handled
            }
          }
        );
        this.teacherFirestoreUnsubs.push(unsubDeleted);

        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const unsubSessions = onSnapshot(
          sessionsRef,
          snapshot => {
            if (snapshot.metadata.fromCache && snapshot.empty && this.sessionsCache.length > 0) {
              return;
            }
            const remoteSessions: StudentSession[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as StudentSession;
              if (data && data.id) {
                remoteSessions.push(data);
              }
            });
            if (!snapshot.metadata.fromCache || remoteSessions.length > 0) {
              this.reconcileRemoteSessions(remoteSessions, !snapshot.metadata.fromCache);
            }
          },
          error => {
            try {
              handleFirestoreError(error, OperationType.LIST, SESSIONS_COLLECTION);
            } catch {
              // Handled
            }
          }
        );
        this.teacherFirestoreUnsubs.push(unsubSessions);
      }

      if (!this.pollInterval) {
        this.pollInterval = setInterval(() => {
          if (this.teacherMonitoringActive) {
            this.checkAndCompleteInactiveSessions();
          }
        }, 15000);
      }
      void this.syncWithServer(true, { includeSessions: true });
    } else {
      this.teacherFirestoreUnsubs.forEach(unsub => {
        try {
          unsub();
        } catch {
          // Ignore
        }
      });
      this.teacherFirestoreUnsubs = [];
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  }

  public subscribeToTokenSessions(token: string): () => void {
    const cleanToken = (token || '').trim().toUpperCase();
    if (typeof window === 'undefined' || !cleanToken) {
      return () => {};
    }

    const existing = this.tokenListeners.get(cleanToken);
    if (existing) {
      existing.refCount++;
    } else {
      const q = query(collection(db, SESSIONS_COLLECTION), where('tokenUsed', '==', cleanToken));
      const unsub = onSnapshot(
        q,
        snapshot => {
          if (snapshot.metadata.fromCache && snapshot.empty) {
            return;
          }
          const remoteSessions: StudentSession[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as StudentSession;
            if (data && data.id) {
              remoteSessions.push(data);
            }
          });
          this.reconcileTokenSessions(cleanToken, remoteSessions, !snapshot.metadata.fromCache);
        },
        error => {
          try {
            handleFirestoreError(error, OperationType.LIST, `${SESSIONS_COLLECTION}[token=${cleanToken}]`);
          } catch {
            // Handled
          }
        }
      );
      this.tokenListeners.set(cleanToken, { refCount: 1, unsub });
    }

    return () => {
      const entry = this.tokenListeners.get(cleanToken);
      if (!entry) return;
      entry.refCount--;
      if (entry.refCount <= 0) {
        try {
          entry.unsub();
        } catch {
          // Ignore
        }
        this.tokenListeners.delete(cleanToken);
      }
    };
  }

  private async bootstrapFirestoreIfEmpty(): Promise<void> {
    if (this.firestoreBootstrapInFlight) return this.firestoreBootstrapInFlight;
    this.firestoreBootstrapInFlight = (async () => {
      try {
        // Double check server directly before bootstrapping so we never overwrite remote config
        const serverSnap = await getDocFromServer(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID));
        if (serverSnap.exists()) {
          this.remoteConfigExistsOnServer = true;
          this.applyRemoteConfigData(serverSnap.data() as Record<string, any>);
          return;
        }

        // Pull from local server first if it already has existing data
        try {
          const res = await this.fetchWithRetry('/api/sync', { method: 'GET' }, 1, 3500);
          if (res.ok) {
            const localServerData = await res.json();
            if (localServerData?.settings) {
              const sanitized = this.sanitizeSettingsWithTombstones(localServerData.settings);
              this.settingsCache = {
                ...sanitized,
                introSlides: (sanitized.introSlides || DEFAULT_INTRO_SLIDES).map(s =>
                  s.imageUrl && s.imageUrl.startsWith('/uploads/')
                    ? { ...s, imageUrl: '' }
                    : s
                )
              };
            }
            if (Array.isArray(localServerData?.sessions) && localServerData.sessions.length > 0) {
              this.sessionsCache = localServerData.sessions;
            }
          }
        } catch {
          // Use local defaults
        }

        const seedSettings: TeacherSettings = {
          ...this.settingsCache,
          activeToken:
            this.settingsCache.activeToken && this.settingsCache.activeToken !== 'SMP2026'
              ? this.settingsCache.activeToken
              : 'SMA2026',
          isTokenActive:
            this.settingsCache.activeToken && this.settingsCache.activeToken !== 'SMP2026'
              ? this.settingsCache.isTokenActive
              : true,
          schoolNameDefault:
            this.settingsCache.schoolNameDefault === 'SMP Negeri 1'
              ? 'SMA Negeri 1'
              : this.settingsCache.schoolNameDefault || 'SMA Negeri 1',
          previousTokens:
            this.settingsCache.previousTokens && this.settingsCache.previousTokens.length > 0
              ? this.settingsCache.previousTokens.map(t => (t === 'SMP2026' ? 'SMA2026' : t))
              : ['SMA2026'],
          introSlides:
            Array.isArray(this.settingsCache.introSlides) && this.settingsCache.introSlides.length > 0
              ? this.settingsCache.introSlides
              : DEFAULT_INTRO_SLIDES,
          introSlidesInitialized: true,
          updatedAt: Date.now()
        };

        this.settingsCache = seedSettings;
        await this.pushConfigAndSlidesToFirestore(seedSettings, true);

        // Seed initial sessions if any exist locally
        if (this.sessionsCache.length > 0) {
          const batch = writeBatch(db);
          this.sessionsCache.slice(0, 100).forEach(s => {
            const payload = this.buildFirestoreSessionPayload(s);
            batch.set(doc(db, SESSIONS_COLLECTION, s.id), payload);
          });
          await batch.commit();
        }
      } catch {
        // Ignore bootstrap failures when offline
      } finally {
        this.firestoreBootstrapInFlight = null;
      }
    })();
    return this.firestoreBootstrapInFlight;
  }

  private applyRemoteConfigData(data: Record<string, any>): void {
    if (this.hasUnsyncedSettings || this.isRestoring) return;

    if (data.deletedTokens && typeof data.deletedTokens === 'object') {
      let deletedTokensUpdated = false;
      Object.entries(data.deletedTokens).forEach(([tok, ts]) => {
        const clean = String(tok || '').trim().toUpperCase();
        if (clean && typeof ts === 'number') {
          const existingTs = this.deletedTokens.get(clean) || 0;
          if (ts > existingTs) {
            this.deletedTokens.set(clean, ts);
            deletedTokensUpdated = true;
          }
        }
      });
      if (deletedTokensUpdated) {
        this.persistDeletedTokensToLocal();
      }
    }

    const mergedRaw: TeacherSettings = {
      ...EMPTY_SETTINGS,
      ...this.settingsCache,
      activeToken: String(data.activeToken || ''),
      isTokenActive: Boolean(data.isTokenActive),
      examDurationMinutes: Number(data.examDurationMinutes) || 30,
      teacherPin: String(data.teacherPin || 'badi1234'),
      schoolNameDefault: String(data.schoolNameDefault || 'SMA Negeri 1'),
      previousTokens: Array.isArray(data.previousTokens) ? data.previousTokens : [],
      ...(Array.isArray(data.tokenList)
        ? {
            tokenList: data.tokenList.map((item: any) => ({
              ...item,
              ...(item?.grade ? { grade: normalizeGradeValue(item.grade) } : {})
            }))
          }
        : {}),
      isIntroSlideEnabled: typeof data.isIntroSlideEnabled === 'boolean' ? data.isIntroSlideEnabled : true,
      introSlidesInitialized: Boolean(data.introSlidesInitialized),
      ...(typeof data.lastBackupDate === 'string' ? { lastBackupDate: data.lastBackupDate } : {}),
      ...(typeof data.lastRestoredAt === 'number' ? { lastRestoredAt: data.lastRestoredAt } : {}),
      ...(typeof data.updatedAt === 'number' ? { updatedAt: data.updatedAt } : {}),
      introSlides: this.settingsCache.introSlides
    };

    const sanitized = this.sanitizeSettingsWithTombstones(mergedRaw);
    if (JSON.stringify(sanitized) !== JSON.stringify(this.settingsCache)) {
      this.settingsCache = sanitized;
      this.persistSettingsToLocal();
      this.broadcastChange();
    }
  }

  private applyRemoteSlides(slides: IntroSlideItem[]): void {
    if (this.hasUnsyncedSettings || this.isRestoring) return;
    if (JSON.stringify(slides) !== JSON.stringify(this.settingsCache.introSlides)) {
      this.settingsCache = {
        ...this.settingsCache,
        introSlides: slides
      };
      this.persistSettingsToLocal();
      this.broadcastChange();
    }
  }

  private reconcileTokenSessions(
    token: string,
    remoteSessions: StudentSession[],
    pruneMissingNonPending = false
  ): void {
    if (this.isRestoring) return;
    const cleanToken = (token || '').trim().toUpperCase();
    if (!cleanToken) return;

    const localMap = new Map(this.sessionsCache.map(s => [s.id, s]));
    const remoteIds = new Set<string>();
    const nextMap = new Map<string, StudentSession>();

    // Preserve sessions belonging to OTHER tokens untouched
    this.sessionsCache.forEach(ls => {
      if ((ls.tokenUsed || '').trim().toUpperCase() !== cleanToken) {
        nextMap.set(ls.id, ls);
      }
    });

    remoteSessions.forEach(rs => {
      if (!rs || !rs.id) return;
      remoteIds.add(rs.id);
      if (this.deletedSessionIds.has(rs.id)) return;
      if (this.isTokenDeleted(rs.tokenUsed, rs.startTime)) return;

      const ls = localMap.get(rs.id);
      const hasLocalPending =
        this.sessionSaveTimers.has(rs.id) ||
        this.pendingSessionSaves.has(rs.id) ||
        this.pendingOutbox.has(rs.id);
      if (ls && hasLocalPending && (ls.lastActiveTime || 0) > (rs.lastActiveTime || 0)) {
        if (rs.status === 'selesai' && ls.status !== 'selesai') {
          nextMap.set(rs.id, rs);
        } else {
          nextMap.set(rs.id, ls);
        }
      } else {
        nextMap.set(rs.id, rs);
      }
    });

    // Keep pending local sessions for this token, or non-pruned local sessions if offline/fromCache
    this.sessionsCache.forEach(ls => {
      if ((ls.tokenUsed || '').trim().toUpperCase() !== cleanToken) return;
      if (remoteIds.has(ls.id)) return;
      if (this.deletedSessionIds.has(ls.id) || this.isTokenDeleted(ls.tokenUsed, ls.startTime)) return;
      const isPending =
        this.sessionSaveTimers.has(ls.id) ||
        this.pendingSessionSaves.has(ls.id) ||
        this.pendingOutbox.has(ls.id);
      if (isPending || !pruneMissingNonPending) {
        nextMap.set(ls.id, ls);
      }
    });

    const nextSessions = Array.from(nextMap.values());
    if (JSON.stringify(nextSessions) !== JSON.stringify(this.sessionsCache)) {
      this.sessionsCache = nextSessions;
      this.persistSessionsToLocal();
      this.broadcastChange();
    }
  }

  private reconcileRemoteSessions(remoteSessions: StudentSession[], pruneMissingNonPending = false): void {
    if (this.isRestoring) return;
    const localMap = new Map(this.sessionsCache.map(s => [s.id, s]));
    const remoteIds = new Set<string>();
    const nextMap = new Map<string, StudentSession>();

    remoteSessions.forEach(rs => {
      if (!rs || !rs.id) return;
      remoteIds.add(rs.id);
      if (this.deletedSessionIds.has(rs.id)) return;
      if (this.isTokenDeleted(rs.tokenUsed, rs.startTime)) return;

      const ls = localMap.get(rs.id);
      const hasLocalPending =
        this.sessionSaveTimers.has(rs.id) ||
        this.pendingSessionSaves.has(rs.id) ||
        this.pendingOutbox.has(rs.id);
      if (ls && hasLocalPending && (ls.lastActiveTime || 0) > (rs.lastActiveTime || 0)) {
        if (rs.status === 'selesai' && ls.status !== 'selesai') {
          nextMap.set(rs.id, rs);
        } else {
          nextMap.set(rs.id, ls);
        }
      } else {
        nextMap.set(rs.id, rs);
      }
    });

    this.sessionsCache.forEach(ls => {
      if (remoteIds.has(ls.id)) return;
      if (this.deletedSessionIds.has(ls.id) || this.isTokenDeleted(ls.tokenUsed, ls.startTime)) return;
      const isPending =
        this.sessionSaveTimers.has(ls.id) ||
        this.pendingSessionSaves.has(ls.id) ||
        this.pendingOutbox.has(ls.id);
      if (isPending || !pruneMissingNonPending) {
        nextMap.set(ls.id, ls);
      }
    });

    const nextSessions = Array.from(nextMap.values());
    if (JSON.stringify(nextSessions) !== JSON.stringify(this.sessionsCache)) {
      this.sessionsCache = nextSessions;
      this.persistSessionsToLocal();
      this.broadcastChange();
    }
  }

  private notifyListenersOnly(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }

  private broadcastChange(): void {
    this.notifyListenersOnly();
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'SYNC_DATA', epoch: ++this.syncEpoch });
      } catch {
        // Ignore
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private persistSettingsToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settingsCache));
    } catch {
      // Fallback on QuotaExceededError: strip heavy data: image URLs in localStorage copy
      // while preserving full settingsCache in memory so tokens/config always persist.
      try {
        const lightweight: TeacherSettings = {
          ...this.settingsCache,
          introSlides: Array.isArray(this.settingsCache.introSlides)
            ? this.settingsCache.introSlides.map(s =>
                s.imageUrl && s.imageUrl.startsWith('data:')
                  ? { ...s, imageUrl: '' }
                  : s
              )
            : []
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(lightweight));
      } catch {
        // Ignore
      }
    }
  }

  private persistSessionsToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const toStore = this.teacherMonitoringActive
        ? this.sessionsCache
        : this.sessionsCache.slice(-100);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(toStore));
    } catch {
      // Fallback: keep only most recent 25 sessions in localStorage
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessionsCache.slice(-25)));
      } catch {
        // Ignore
      }
    }
  }

  private persistActiveStudentSession(session: StudentSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_STUDENT_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore
    }
  }

  public getActiveStudentSessionBackup(id?: string): StudentSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ACTIVE_STUDENT_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StudentSession;
      if (!parsed || !parsed.id) return null;
      if (id && parsed.id !== id) return null;
      if (this.deletedSessionIds.has(parsed.id) || this.isTokenDeleted(parsed.tokenUsed, parsed.startTime)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public clearActiveStudentSessionBackup(id?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (id) {
        const existing = this.getActiveStudentSessionBackup();
        if (existing && existing.id !== id) return;
      }
      localStorage.removeItem(ACTIVE_STUDENT_SESSION_KEY);
    } catch {
      // Ignore
    }
  }

  private readPendingOutboxFromLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(PENDING_OUTBOX_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((item: StudentSession) => {
            if (item && item.id) {
              this.pendingOutbox.set(item.id, item);
            }
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistPendingOutboxToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(this.pendingOutbox.values()).slice(-20);
      if (arr.length === 0) {
        localStorage.removeItem(PENDING_OUTBOX_KEY);
      } else {
        localStorage.setItem(PENDING_OUTBOX_KEY, JSON.stringify(arr));
      }
    } catch {
      // Ignore
    }
  }

  public getPendingOutboxCount(): number {
    return this.pendingOutbox.size;
  }

  public async flushPendingOutbox(): Promise<void> {
    if (typeof window === 'undefined' || this.isFlushingOutbox || this.pendingOutbox.size === 0) return;
    this.isFlushingOutbox = true;
    try {
      const entries = Array.from(this.pendingOutbox.entries());
      for (const [id, session] of entries) {
        if (this.deletedSessionIds.has(id) || this.isTokenDeleted(session.tokenUsed, session.startTime)) {
          this.pendingOutbox.delete(id);
          continue;
        }
        try {
          const payload = this.buildFirestoreSessionPayload(session);
          await setDoc(doc(db, SESSIONS_COLLECTION, payload.id), payload);
          this.pendingOutbox.delete(id);
          this.pendingSessionSaves.delete(id);
        } catch (error: any) {
          const code = String(error?.code || '');
          if (code === 'permission-denied') {
            try {
              const serverSnap = await getDocFromServer(doc(db, SESSIONS_COLLECTION, id));
              if (serverSnap.exists()) {
                const serverData = serverSnap.data() as StudentSession;
                if (serverData && serverData.status === 'selesai') {
                  this.pendingOutbox.delete(id);
                  this.reconcileTokenSessions(serverData.tokenUsed, [serverData], false);
                }
              } else {
                this.pendingOutbox.delete(id);
              }
            } catch {
              // Keep in outbox for next retry
            }
          }
        }
      }
      this.persistPendingOutboxToLocal();
    } finally {
      this.isFlushingOutbox = false;
    }
  }

  private persistQuestionsToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(this.questionsCache));
    } catch {
      // Ignore quota exceeded error
    }
  }

  private readDeletedSessionsFromLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DELETED_SESSIONS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach(id => {
            if (typeof id === 'string') this.deletedSessionIds.add(id);
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistDeletedSessionsToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const trimmed = Array.from(this.deletedSessionIds).slice(-2000);
      this.deletedSessionIds = new Set(trimmed);
      localStorage.setItem(DELETED_SESSIONS_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore
    }
  }

  private readDeletedTokensFromLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DELETED_TOKENS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') {
          Object.entries(obj).forEach(([tok, ts]) => {
            const clean = String(tok || '').trim().toUpperCase();
            if (clean && typeof ts === 'number') {
              this.deletedTokens.set(clean, ts);
            }
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistDeletedTokensToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, number> = {};
      this.deletedTokens.forEach((ts, tok) => {
        obj[tok] = ts;
      });
      localStorage.setItem(DELETED_TOKENS_KEY, JSON.stringify(obj));
    } catch {
      // Ignore
    }
  }

  private isTokenDeleted(tokenStr: string, createdOrStartedAt?: number): boolean {
    const clean = (tokenStr || '').trim().toUpperCase();
    if (!clean) return false;
    const deletedAt = this.deletedTokens.get(clean);
    if (!deletedAt) return false;
    return (Number(createdOrStartedAt) || 0) <= deletedAt;
  }

  private sanitizeSettingsWithTombstones(rawSettings: TeacherSettings): TeacherSettings {
    const rawTokenList = Array.isArray(rawSettings.tokenList) ? rawSettings.tokenList : undefined;
    const filteredTokenList = rawTokenList
      ? rawTokenList.filter(item => item && item.token && !this.isTokenDeleted(item.token, item.createdAt))
      : undefined;

    const filteredPrevTokens = Array.isArray(rawSettings.previousTokens)
      ? rawSettings.previousTokens.filter(t => {
          const clean = (t || '').trim().toUpperCase();
          if (!clean) return false;
          const delAt = this.deletedTokens.get(clean);
          if (!delAt) return true;
          const recreated = filteredTokenList?.some(
            item => item.token.trim().toUpperCase() === clean && (item.createdAt || 0) > delAt
          );
          return Boolean(recreated);
        })
      : [];

    let activeToken = (rawSettings.activeToken || '').trim().toUpperCase();
    let isTokenActive = rawSettings.isTokenActive;
    if (activeToken) {
      const delAt = this.deletedTokens.get(activeToken);
      const recreated = delAt
        ? filteredTokenList?.some(
            item => item.token.trim().toUpperCase() === activeToken && (item.createdAt || 0) > delAt
          )
        : true;
      if (delAt && !recreated) {
        activeToken =
          filteredTokenList && filteredTokenList.length > 0 ? filteredTokenList[0].token.trim().toUpperCase() : '';
        isTokenActive = Boolean(activeToken) && Boolean(filteredTokenList?.[0]?.isActive);
      }
    }

    return {
      ...EMPTY_SETTINGS,
      ...rawSettings,
      activeToken,
      isTokenActive,
      previousTokens: filteredPrevTokens,
      isIntroSlideEnabled:
        typeof rawSettings.isIntroSlideEnabled === 'boolean' ? rawSettings.isIntroSlideEnabled : true,
      introSlides: Array.isArray(rawSettings.introSlides) ? rawSettings.introSlides : DEFAULT_INTRO_SLIDES,
      ...(filteredTokenList !== undefined ? { tokenList: filteredTokenList } : {})
    };
  }

  private readSettingsFromLocal(): TeacherSettings {
    if (typeof window === 'undefined') return EMPTY_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return this.sanitizeSettingsWithTombstones({ ...EMPTY_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore
    }
    return EMPTY_SETTINGS;
  }

  private readSessionsFromLocal(): StudentSession[] {
    if (typeof window === 'undefined') return [];
    const map = new Map<string, StudentSession>();
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(s => {
            if (s && s.id && !this.deletedSessionIds.has(s.id) && !this.isTokenDeleted(s.tokenUsed, s.startTime)) {
              map.set(s.id, s);
            }
          });
        }
      }
    } catch {
      // Ignore
    }

    const activeBackup = this.getActiveStudentSessionBackup();
    if (activeBackup) {
      const existing = map.get(activeBackup.id);
      if (
        !existing ||
        (activeBackup.status === 'selesai' && existing.status !== 'selesai') ||
        (activeBackup.lastActiveTime || 0) > (existing.lastActiveTime || 0)
      ) {
        map.set(activeBackup.id, activeBackup);
      }
    }

    this.pendingOutbox.forEach(pending => {
      if (!this.deletedSessionIds.has(pending.id) && !this.isTokenDeleted(pending.tokenUsed, pending.startTime)) {
        const existing = map.get(pending.id);
        if (
          !existing ||
          (pending.status === 'selesai' && existing.status !== 'selesai') ||
          (pending.lastActiveTime || 0) > (existing.lastActiveTime || 0)
        ) {
          map.set(pending.id, pending);
        }
      }
    });

    return Array.from(map.values());
  }

  private readQuestionsFromLocal(): Question[] {
    if (typeof window === 'undefined') return QUESTIONS;
    try {
      const raw = localStorage.getItem(QUESTIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 40 &&
          parsed.some((q: any) => q?.grade === '10 SMA') &&
          parsed.some((q: any) => q?.grade === '11 SMA') &&
          parsed.some((q: any) => q?.subject === 'Bahasa Inggris') &&
          parsed.every(isValidSmaQuestion)
        ) {
          return parsed;
        }
        // Discard stale legacy SMP questions from localStorage
        localStorage.setItem(QUESTIONS_KEY, JSON.stringify(QUESTIONS));
      }
    } catch {
      // Ignore
    }
    return QUESTIONS;
  }

  private async fetchWithRetry(url: string, options?: RequestInit, retries = 1, timeoutMs = 5000): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        if (res.ok || res.status === 400 || res.status === 404) {
          return res;
        }
        if (i === retries) return res;
      } catch (err: any) {
        if (i === retries) throw err;
      }
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
    throw new Error('Network request failed after retries');
  }

  private buildFirestoreConfigPayload(settings: TeacherSettings): Record<string, any> {
    const deletedTokensObj: Record<string, number> = {};
    this.deletedTokens.forEach((ts, tok) => {
      if (tok && typeof ts === 'number') {
        deletedTokensObj[tok] = ts;
      }
    });

    const sanitizedTokenList = Array.isArray(settings.tokenList)
      ? settings.tokenList.slice(0, 100).map(item =>
          stripUndefinedDeep({
            token: String(item.token || '').trim().toUpperCase().slice(0, 64),
            school: String(item.school || '').slice(0, 200),
            ...(item.grade ? { grade: normalizeGradeValue(item.grade) } : {}),
            durationMinutes: Math.max(1, Math.min(600, Number(item.durationMinutes) || 30)),
            isActive: Boolean(item.isActive),
            ...(typeof item.createdAt === 'number' ? { createdAt: item.createdAt } : {}),
            ...(typeof item.surveyUrl === 'string' && item.surveyUrl.trim()
              ? { surveyUrl: item.surveyUrl.trim().slice(0, 1000) }
              : {})
          })
        )
      : undefined;

    const payload: Record<string, any> = {
      activeToken: String(settings.activeToken || '').trim().toUpperCase().slice(0, 64),
      isTokenActive: Boolean(settings.isTokenActive),
      examDurationMinutes: Math.max(1, Math.min(600, Number(settings.examDurationMinutes) || 30)),
      teacherPin: String(settings.teacherPin || 'badi1234').trim().slice(0, 64) || 'badi1234',
      schoolNameDefault: String(settings.schoolNameDefault || 'SMA Negeri 1').slice(0, 200),
      previousTokens: Array.isArray(settings.previousTokens)
        ? settings.previousTokens.map(t => String(t || '').trim().toUpperCase()).filter(Boolean).slice(0, 200)
        : [],
      isIntroSlideEnabled: typeof settings.isIntroSlideEnabled === 'boolean' ? settings.isIntroSlideEnabled : true,
      introSlidesInitialized: true,
      deletedTokens: deletedTokensObj,
      updatedAt: Date.now()
    };

    if (sanitizedTokenList !== undefined) {
      payload.tokenList = sanitizedTokenList;
    }
    if (typeof settings.lastBackupDate === 'string' && settings.lastBackupDate) {
      payload.lastBackupDate = settings.lastBackupDate.slice(0, 100);
    }
    if (typeof settings.lastRestoredAt === 'number' && settings.lastRestoredAt >= 0) {
      payload.lastRestoredAt = settings.lastRestoredAt;
    }

    return payload;
  }

  private buildFirestoreSlidePayload(slide: IntroSlideItem, orderIndex: number, timestamp: number): Record<string, any> {
    const cleanId = String(slide.id || `slide-${timestamp}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    return {
      id: cleanId,
      title: String(slide.title || '').slice(0, 300),
      description: String(slide.description || '').slice(0, 3000),
      imageUrl: String(slide.imageUrl || '').slice(0, 900000),
      isActive: typeof slide.isActive === 'boolean' ? slide.isActive : true,
      displayMode: slide.displayMode === 'image_only' ? 'image_only' : 'card',
      order: orderIndex,
      updatedAt: timestamp
    };
  }

  private buildFirestoreSessionPayload(session: StudentSession): Record<string, any> {
    const cleanId = String(session.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    const payload: Record<string, any> = {
      id: cleanId,
      name: String(session.name || 'Peserta').slice(0, 200),
      grade: normalizeGradeValue(session.grade),
      school: String(session.school || '').slice(0, 200),
      tokenUsed: String(session.tokenUsed || '').trim().toUpperCase().slice(0, 64),
      startTime: Math.max(0, Number(session.startTime) || Date.now()),
      lastActiveTime: Math.max(0, Number(session.lastActiveTime) || Date.now()),
      status: session.status,
      currentQuestionIndex: Math.max(0, Math.min(500, Number(session.currentQuestionIndex) || 0)),
      answeredCount: Math.max(0, Math.min(500, Number(session.answeredCount) || 0)),
      doubtfulCount: Math.max(0, Math.min(500, Number(session.doubtfulCount) || 0)),
      answers: stripUndefinedDeep(session.answers || {})
    };

    if (typeof session.durationMinutes === 'number' && Number.isFinite(session.durationMinutes)) {
      payload.durationMinutes = Math.max(1, Math.min(600, session.durationMinutes));
    }
    if (typeof session.totalScore === 'number' && Number.isFinite(session.totalScore)) {
      payload.totalScore = Math.max(0, Math.min(100, session.totalScore));
    }
    if (typeof session.mathScore === 'number' && Number.isFinite(session.mathScore)) {
      payload.mathScore = Math.max(0, Math.min(100, session.mathScore));
    }
    if (typeof session.indoScore === 'number' && Number.isFinite(session.indoScore)) {
      payload.indoScore = Math.max(0, Math.min(100, session.indoScore));
    }
    if (typeof session.englishScore === 'number' && Number.isFinite(session.englishScore)) {
      payload.englishScore = Math.max(0, Math.min(100, session.englishScore));
    }
    if (session.predicate) {
      payload.predicate = session.predicate;
    }
    if (typeof session.timeSpentSeconds === 'number' && Number.isFinite(session.timeSpentSeconds)) {
      payload.timeSpentSeconds = Math.max(0, Math.min(86400, session.timeSpentSeconds));
    }
    if (typeof session.completedAt === 'number' && Number.isFinite(session.completedAt)) {
      payload.completedAt = Math.max(0, session.completedAt);
    }

    return payload;
  }

  private async pushConfigAndSlidesToFirestore(settings: TeacherSettings, includeSlides: boolean): Promise<void> {
    const configPayload = this.buildFirestoreConfigPayload(settings);
    try {
      await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), configPayload);
      this.remoteConfigExistsOnServer = true;
      this.remoteSlidesInitializedFlag = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
    }

    if (includeSlides && Array.isArray(settings.introSlides)) {
      const now = Date.now();
      const targetSlides = settings.introSlides.slice(0, 50);
      const targetIds = new Set<string>();

      let existingRemoteIds = new Set(this.firestoreSlideIds);
      try {
        const snap = await getDocs(collection(db, SLIDES_COLLECTION));
        existingRemoteIds = new Set(snap.docs.map(d => d.id));
      } catch {
        // Use cached set
      }

      const batch = writeBatch(db);
      targetSlides.forEach((slide, idx) => {
        const payload = this.buildFirestoreSlidePayload(slide, idx, now);
        targetIds.add(payload.id);
        batch.set(doc(db, SLIDES_COLLECTION, payload.id), payload);
      });

      existingRemoteIds.forEach(oldId => {
        if (!targetIds.has(oldId)) {
          batch.delete(doc(db, SLIDES_COLLECTION, oldId));
        }
      });

      try {
        await batch.commit();
        this.firestoreSlideIds = targetIds;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, SLIDES_COLLECTION);
      }
    }
  }

  public async syncConfigAndSlides(force = false): Promise<boolean> {
    if (this.isRestoring) return false;
    if (this.activeMutationCount > 0 && !force) return false;
    if (this.inFlightConfigSync) return this.inFlightConfigSync;

    this.inFlightConfigSync = (async () => {
      const startMutationEpoch = this.localMutationEpoch;
      try {
        const [configSnap, slidesSnap] = await Promise.all([
          force
            ? getDocFromServer(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID)).catch(() =>
                getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID))
              )
            : getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID)),
          force
            ? getDocsFromServer(collection(db, SLIDES_COLLECTION)).catch(() =>
                getDocs(collection(db, SLIDES_COLLECTION))
              )
            : getDocs(collection(db, SLIDES_COLLECTION))
        ]);

        if (this.localMutationEpoch !== startMutationEpoch || this.activeMutationCount > 0) {
          return false;
        }

        if (configSnap.exists()) {
          this.remoteConfigExistsOnServer = true;
          const data = configSnap.data() as Record<string, any>;
          this.remoteSlidesInitializedFlag = Boolean(data.introSlidesInitialized);
          this.applyRemoteConfigData(data);
        }

        const slides: IntroSlideItem[] = [];
        const slideIds = new Set<string>();
        slidesSnap.forEach(docSnap => {
          const data = docSnap.data() as Record<string, any>;
          if (data && data.id) {
            slideIds.add(docSnap.id);
            slides.push({
              id: String(data.id),
              title: String(data.title || ''),
              description: String(data.description || ''),
              imageUrl: String(data.imageUrl || ''),
              isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
              displayMode: data.displayMode === 'image_only' ? 'image_only' : 'card',
              order: typeof data.order === 'number' ? data.order : 0,
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0
            });
          }
        });
        this.firestoreSlideIds = slideIds;
        if (slides.length > 0) {
          slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          this.applyRemoteSlides(slides);
        } else if (this.remoteSlidesInitializedFlag) {
          this.applyRemoteSlides([]);
        }

        this.hasRemoteConfigSnapshot = true;
        this.hasRemoteSlidesSnapshot = true;
        this.resolveInitialSyncWaiters();
        return true;
      } catch {
        return false;
      } finally {
        this.inFlightConfigSync = null;
      }
    })();

    return this.inFlightConfigSync;
  }

  public async syncSessionsForToken(token: string, force = true): Promise<boolean> {
    const cleanToken = (token || '').trim().toUpperCase();
    if (!cleanToken || this.isRestoring) return false;

    const existing = this.inFlightTokenSyncs.get(cleanToken);
    if (existing) return existing;

    const task = (async () => {
      try {
        const q = query(collection(db, SESSIONS_COLLECTION), where('tokenUsed', '==', cleanToken));
        let fromServer = false;
        const snap = force
          ? await getDocsFromServer(q)
              .then(res => {
                fromServer = true;
                return res;
              })
              .catch(() => getDocs(q))
          : await getDocs(q);

        const remoteSessions: StudentSession[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data() as StudentSession;
          if (data && data.id) {
            remoteSessions.push(data);
          }
        });
        this.reconcileTokenSessions(cleanToken, remoteSessions, fromServer || !snap.metadata.fromCache);
        return true;
      } catch {
        return false;
      } finally {
        this.inFlightTokenSyncs.delete(cleanToken);
      }
    })();

    this.inFlightTokenSyncs.set(cleanToken, task);
    return task;
  }

  public async syncWithServer(force = false, options?: { includeSessions?: boolean }): Promise<boolean> {
    const includeSessions = options?.includeSessions ?? this.teacherMonitoringActive;
    if (!includeSessions) {
      return this.syncConfigAndSlides(force);
    }

    if (this.isRestoring) return false;
    if (this.activeMutationCount > 0 && !force) return false;
    if (this.inFlightSync) return this.inFlightSync;

    this.inFlightSync = (async () => {
      const startMutationEpoch = this.localMutationEpoch;
      try {
        // Fetch live state directly from Firestore servers
        const [configSnap, slidesSnap, deletedSnap, sessionsSnap] = await Promise.all([
          force
            ? getDocFromServer(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID)).catch(() =>
                getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID))
              )
            : getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID)),
          force
            ? getDocsFromServer(collection(db, SLIDES_COLLECTION)).catch(() =>
                getDocs(collection(db, SLIDES_COLLECTION))
              )
            : getDocs(collection(db, SLIDES_COLLECTION)),
          force
            ? getDocsFromServer(collection(db, DELETED_SESSIONS_COLLECTION)).catch(() =>
                getDocs(collection(db, DELETED_SESSIONS_COLLECTION))
              )
            : getDocs(collection(db, DELETED_SESSIONS_COLLECTION)),
          force
            ? getDocsFromServer(collection(db, SESSIONS_COLLECTION)).catch(() =>
                getDocs(collection(db, SESSIONS_COLLECTION))
              )
            : getDocs(collection(db, SESSIONS_COLLECTION))
        ]);

        if (this.localMutationEpoch !== startMutationEpoch || this.activeMutationCount > 0) {
          return false;
        }

        // Apply deleted session tombstones
        let deletedUpdated = false;
        deletedSnap.forEach(d => {
          if (d.id && !this.deletedSessionIds.has(d.id)) {
            this.deletedSessionIds.add(d.id);
            deletedUpdated = true;
          }
        });
        if (deletedUpdated) {
          this.persistDeletedSessionsToLocal();
        }

        // Apply remote config
        if (configSnap.exists()) {
          this.remoteConfigExistsOnServer = true;
          const data = configSnap.data() as Record<string, any>;
          this.remoteSlidesInitializedFlag = Boolean(data.introSlidesInitialized);
          this.applyRemoteConfigData(data);
        }

        // Apply remote slides
        const slides: IntroSlideItem[] = [];
        const slideIds = new Set<string>();
        slidesSnap.forEach(docSnap => {
          const data = docSnap.data() as Record<string, any>;
          if (data && data.id) {
            slideIds.add(docSnap.id);
            slides.push({
              id: String(data.id),
              title: String(data.title || ''),
              description: String(data.description || ''),
              imageUrl: String(data.imageUrl || ''),
              isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
              displayMode: data.displayMode === 'image_only' ? 'image_only' : 'card',
              order: typeof data.order === 'number' ? data.order : 0,
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0
            });
          }
        });
        this.firestoreSlideIds = slideIds;
        if (slides.length > 0) {
          slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          this.applyRemoteSlides(slides);
        } else if (this.remoteSlidesInitializedFlag) {
          this.applyRemoteSlides([]);
        }

        // Apply remote sessions
        const remoteSessions: StudentSession[] = [];
        sessionsSnap.forEach(docSnap => {
          const data = docSnap.data() as StudentSession;
          if (data && data.id) {
            remoteSessions.push(data);
          }
        });
        if (configSnap.exists() || remoteSessions.length > 0) {
          this.reconcileRemoteSessions(remoteSessions, force && !sessionsSnap.metadata.fromCache);
        }

        this.hasRemoteConfigSnapshot = true;
        this.hasRemoteSlidesSnapshot = true;
        this.resolveInitialSyncWaiters();

        return true;
      } catch {
        // Fallback to local container endpoint if Firestore unreachable
        try {
          const res = await this.fetchWithRetry('/api/sync', { method: 'GET' }, 0, 3500);
          if (res.ok) {
            const data = await res.json();
            if (data.settings && !this.hasUnsyncedSettings) {
              this.settingsCache = this.sanitizeSettingsWithTombstones(data.settings);
              this.persistSettingsToLocal();
            }
            if (Array.isArray(data.sessions)) {
              this.reconcileRemoteSessions(data.sessions);
            }
            this.broadcastChange();
            return true;
          }
        } catch {
          // Offline
        }
        return false;
      } finally {
        this.inFlightSync = null;
      }
    })();

    return this.inFlightSync;
  }

  public getSettings(): TeacherSettings {
    return this.settingsCache;
  }

  public getIntroSlides(): IntroSlideItem[] {
    if (Array.isArray(this.settingsCache.introSlides)) {
      return this.settingsCache.introSlides;
    }
    return DEFAULT_INTRO_SLIDES;
  }

  public getActiveIntroSlides(): IntroSlideItem[] {
    return this.getIntroSlides().filter(s => s && s.isActive);
  }

  private clearDeletedTokenMarkersForSettings(settings: Partial<TeacherSettings>): void {
    let changed = false;
    if (Array.isArray(settings.tokenList)) {
      settings.tokenList.forEach(item => {
        if (item && item.token) {
          const clean = item.token.trim().toUpperCase();
          const delAt = this.deletedTokens.get(clean);
          if (delAt && (Number(item.createdAt) || 0) > delAt) {
            this.deletedTokens.delete(clean);
            changed = true;
          }
        }
      });
    }
    if (changed) {
      this.persistDeletedTokensToLocal();
    }
  }

  public saveSettings(updated: Partial<TeacherSettings>): TeacherSettings {
    this.localMutationEpoch++;
    this.clearDeletedTokenMarkersForSettings(updated);
    const hasSlidesUpdate = Array.isArray(updated.introSlides);
    const newSettings = { ...this.settingsCache, ...updated, updatedAt: Date.now() };
    this.settingsCache = newSettings;
    this.hasUnsyncedSettings = true;
    const seq = ++this.settingsSaveSeq;

    this.persistSettingsToLocal();
    this.broadcastChange();

    void this.pushConfigAndSlidesToFirestore(newSettings, hasSlidesUpdate)
      .catch(() => {})
      .finally(() => {
        if (seq === this.settingsSaveSeq) {
          this.hasUnsyncedSettings = false;
        }
      });

    void this.fetchWithRetry('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    }, 0, 4000).catch(() => {});

    return newSettings;
  }

  public async saveSettingsAsync(updated: Partial<TeacherSettings>): Promise<TeacherSettings> {
    this.localMutationEpoch++;
    this.activeMutationCount++;
    this.clearDeletedTokenMarkersForSettings(updated);
    const hasSlidesUpdate = Array.isArray(updated.introSlides);
    const newSettings = { ...this.settingsCache, ...updated, updatedAt: Date.now() };
    this.settingsCache = newSettings;
    this.hasUnsyncedSettings = true;
    const seq = ++this.settingsSaveSeq;

    this.persistSettingsToLocal();
    this.broadcastChange();

    try {
      await this.pushConfigAndSlidesToFirestore(newSettings, hasSlidesUpdate);
      void this.fetchWithRetry('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      }, 0, 4000).catch(() => {});
    } catch {
      // Errors logged via handleFirestoreError
    } finally {
      if (seq === this.settingsSaveSeq) {
        this.hasUnsyncedSettings = false;
      }
      this.activeMutationCount = Math.max(0, this.activeMutationCount - 1);
    }
    return this.settingsCache;
  }

  public checkAndCompleteInactiveSessions(): boolean {
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
    const now = Date.now();
    let hasChanged = false;

    const updatedList = this.sessionsCache.map(session => {
      if (this.deletedSessionIds.has(session.id) || this.isTokenDeleted(session.tokenUsed, session.startTime)) {
        return session;
      }
      if (session.status === 'mengerjakan') {
        const lastActive = session.lastActiveTime || session.startTime || 0;
        if (lastActive > 0 && now - lastActive >= INACTIVITY_TIMEOUT_MS) {
          hasChanged = true;
          const result = this.calculateAssessmentResult(normalizeGradeValue(session.grade), session.answers || {});
          const completedAt = lastActive + INACTIVITY_TIMEOUT_MS;
          const timeSpentSeconds = Math.min(
            (session.durationMinutes || 30) * 60,
            Math.max(0, Math.floor((completedAt - session.startTime) / 1000))
          );
          const finishedSession: StudentSession = {
            ...session,
            grade: normalizeGradeValue(session.grade),
            status: 'selesai',
            completedAt,
            timeSpentSeconds,
            answers: result.answersWithScore,
            totalScore: result.totalScore,
            mathScore: result.mathScore,
            indoScore: result.indoScore,
            englishScore: result.englishScore,
            predicate: result.predicate,
            answeredCount: Object.values(session.answers || {}).filter(a => a.isAnswered).length,
            doubtfulCount: 0
          };
          const payload = this.buildFirestoreSessionPayload(finishedSession);
          void setDoc(doc(db, SESSIONS_COLLECTION, payload.id), payload).catch(() => {});
          return finishedSession;
        }
      }
      return session;
    });

    if (hasChanged) {
      this.sessionsCache = updatedList.filter(
        s => !this.deletedSessionIds.has(s.id) && !this.isTokenDeleted(s.tokenUsed, s.startTime)
      );
      this.persistSessionsToLocal();
      this.broadcastChange();
    }
    return hasChanged;
  }

  public getSessions(): StudentSession[] {
    if (this.teacherMonitoringActive) {
      this.checkAndCompleteInactiveSessions();
    }
    return this.sessionsCache.filter(
      s => !this.deletedSessionIds.has(s.id) && !this.isTokenDeleted(s.tokenUsed, s.startTime)
    );
  }

  public getSession(id: string): StudentSession | null {
    if (this.deletedSessionIds.has(id)) return null;
    if (this.teacherMonitoringActive) {
      this.checkAndCompleteInactiveSessions();
    }
    const found = this.sessionsCache.find(s => s.id === id) || null;
    if (found && this.isTokenDeleted(found.tokenUsed, found.startTime)) return null;
    return found;
  }

  public findSessionByNameAndToken(name: string, token: string): StudentSession | null {
    const cleanName = name.trim().toLowerCase();
    const cleanToken = token.trim().toUpperCase();
    return (
      this.getSessions().find(
        s => s.name.trim().toLowerCase() === cleanName && s.tokenUsed.trim().toUpperCase() === cleanToken
      ) || null
    );
  }

  public saveSessionLocal(session: StudentSession): StudentSession {
    const cleanToken = (session.tokenUsed || '').trim().toUpperCase();
    const normalized: StudentSession = { ...session, tokenUsed: cleanToken };
    if (this.deletedSessionIds.has(session.id) || this.isTokenDeleted(cleanToken, session.startTime)) {
      return normalized;
    }

    const list = [...this.sessionsCache];
    const index = list.findIndex(s => s.id === session.id);
    if (index >= 0) {
      // Protect finished sessions from being reverted to in-progress locally
      if (list[index].status === 'selesai' && normalized.status !== 'selesai') {
        return list[index];
      }
      list[index] = normalized;
    } else {
      list.push(normalized);
    }

    this.sessionsCache = list;
    this.persistActiveStudentSession(normalized);
    this.persistSessionsToLocal();
    return normalized;
  }

  public saveSession(session: StudentSession): void {
    const normalized = this.saveSessionLocal(session);
    const cleanToken = normalized.tokenUsed;
    if (this.deletedSessionIds.has(normalized.id) || this.isTokenDeleted(cleanToken, normalized.startTime)) {
      return;
    }

    this.pendingSessionSaves.set(normalized.id, normalized);
    this.broadcastChange();

    const existingTimer = this.sessionSaveTimers.get(normalized.id);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.sessionSaveTimers.delete(normalized.id);
      const latestToSave = this.pendingSessionSaves.get(normalized.id) || normalized;
      if (this.deletedSessionIds.has(latestToSave.id) || this.isTokenDeleted(cleanToken, latestToSave.startTime)) {
        this.pendingSessionSaves.delete(latestToSave.id);
        return;
      }
      const payload = this.buildFirestoreSessionPayload(latestToSave);
      void setDoc(doc(db, SESSIONS_COLLECTION, payload.id), payload)
        .then(() => {
          this.pendingOutbox.delete(latestToSave.id);
          this.persistPendingOutboxToLocal();
        })
        .catch(err => {
          const code = String((err as any)?.code || '');
          if (code !== 'permission-denied') {
            this.pendingOutbox.set(latestToSave.id, latestToSave);
            this.persistPendingOutboxToLocal();
          }
          try {
            handleFirestoreError(err, OperationType.WRITE, `${SESSIONS_COLLECTION}/${payload.id}`);
          } catch {
            // Logged
          }
        })
        .finally(() => {
          this.pendingSessionSaves.delete(latestToSave.id);
        });
    }, 1500);

    this.sessionSaveTimers.set(normalized.id, timer);
  }

  public async saveSessionNow(session: StudentSession): Promise<boolean> {
    const normalized = this.saveSessionLocal(session);
    const cleanToken = normalized.tokenUsed;
    if (this.deletedSessionIds.has(normalized.id) || this.isTokenDeleted(cleanToken, normalized.startTime)) {
      return false;
    }

    const existingTimer = this.sessionSaveTimers.get(normalized.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.sessionSaveTimers.delete(normalized.id);
    }

    this.pendingSessionSaves.set(normalized.id, normalized);
    try {
      const payload = this.buildFirestoreSessionPayload(normalized);
      await setDoc(doc(db, SESSIONS_COLLECTION, payload.id), payload);
      this.pendingSessionSaves.delete(normalized.id);
      this.pendingOutbox.delete(normalized.id);
      this.persistPendingOutboxToLocal();
      return true;
    } catch {
      this.pendingSessionSaves.delete(normalized.id);
      this.pendingOutbox.set(normalized.id, normalized);
      this.persistPendingOutboxToLocal();
      return false;
    }
  }

  public async saveSessionAsync(session: StudentSession): Promise<{ success: boolean; session: StudentSession }> {
    const cleanToken = (session.tokenUsed || '').trim().toUpperCase();
    if (this.deletedSessionIds.has(session.id) || this.isTokenDeleted(cleanToken, session.startTime)) {
      return { success: false, session };
    }

    const normalized = this.saveSessionLocal(session);
    const existingTimer = this.sessionSaveTimers.get(normalized.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.sessionSaveTimers.delete(normalized.id);
    }

    this.pendingSessionSaves.set(normalized.id, normalized);
    this.broadcastChange();

    const payload = this.buildFirestoreSessionPayload(normalized);
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await setDoc(doc(db, SESSIONS_COLLECTION, payload.id), payload);
        this.pendingSessionSaves.delete(normalized.id);
        this.pendingOutbox.delete(normalized.id);
        this.persistPendingOutboxToLocal();
        return { success: true, session: normalized };
      } catch (error: any) {
        const code = String(error?.code || '');
        if (code === 'permission-denied') {
          // Check if server already finalized this session
          try {
            const serverSnap = await getDocFromServer(doc(db, SESSIONS_COLLECTION, payload.id));
            if (serverSnap.exists()) {
              const serverSession = serverSnap.data() as StudentSession;
              if (serverSession && serverSession.status === 'selesai') {
                this.pendingSessionSaves.delete(normalized.id);
                this.pendingOutbox.delete(normalized.id);
                this.persistPendingOutboxToLocal();
                this.saveSessionLocal(serverSession);
                return { success: true, session: serverSession };
              }
            }
          } catch {
            // Fall through to retry/failure
          }
        }

        if (attempt < maxAttempts - 1) {
          const jitter = Math.floor(Math.random() * 250);
          await new Promise(resolve => setTimeout(resolve, 450 * (attempt + 1) + jitter));
        } else {
          this.pendingSessionSaves.delete(normalized.id);
          this.pendingOutbox.set(normalized.id, normalized);
          this.persistPendingOutboxToLocal();
          try {
            handleFirestoreError(error, OperationType.WRITE, `${SESSIONS_COLLECTION}/${normalized.id}`);
          } catch {
            // Logged
          }
          return { success: false, session: normalized };
        }
      }
    }

    return { success: false, session: normalized };
  }

  public async deleteSession(id: string): Promise<boolean> {
    this.localMutationEpoch++;
    this.activeMutationCount++;

    const timer = this.sessionSaveTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.sessionSaveTimers.delete(id);
    }
    this.pendingSessionSaves.delete(id);

    this.deletedSessionIds.add(id);
    this.persistDeletedSessionsToLocal();

    this.sessionsCache = this.sessionsCache.filter(s => s.id !== id);
    this.persistSessionsToLocal();
    this.broadcastChange();

    try {
      const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
      const batch = writeBatch(db);
      batch.set(doc(db, DELETED_SESSIONS_COLLECTION, cleanId), {
        id: cleanId,
        deletedAt: Date.now()
      });
      batch.delete(doc(db, SESSIONS_COLLECTION, cleanId));
      await batch.commit();

      void this.fetchWithRetry(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }, 0, 4000).catch(
        () => {}
      );
      return true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `${SESSIONS_COLLECTION}/${id}`);
      } catch {
        // Logged
      }
      return false;
    } finally {
      this.activeMutationCount = Math.max(0, this.activeMutationCount - 1);
    }
  }

  public async clearAllSessions(): Promise<boolean> {
    this.localMutationEpoch++;
    this.activeMutationCount++;

    this.sessionSaveTimers.forEach(timer => clearTimeout(timer));
    this.sessionSaveTimers.clear();
    this.pendingSessionSaves.clear();

    const allIds = new Set(this.sessionsCache.map(s => s.id));
    try {
      const remoteSnap = await getDocs(collection(db, SESSIONS_COLLECTION));
      remoteSnap.forEach(d => allIds.add(d.id));
    } catch {
      // Use local ids
    }

    allIds.forEach(id => this.deletedSessionIds.add(id));
    this.persistDeletedSessionsToLocal();

    this.sessionsCache = [];
    this.persistSessionsToLocal();
    this.broadcastChange();

    try {
      const idsArr = Array.from(allIds);
      const now = Date.now();
      for (let i = 0; i < idsArr.length; i += 200) {
        const chunk = idsArr.slice(i, i + 200);
        const batch = writeBatch(db);
        chunk.forEach(id => {
          const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
          batch.set(doc(db, DELETED_SESSIONS_COLLECTION, cleanId), { id: cleanId, deletedAt: now });
          batch.delete(doc(db, SESSIONS_COLLECTION, cleanId));
        });
        await batch.commit();
      }

      void this.fetchWithRetry('/api/sessions/clear', { method: 'POST' }, 0, 4000).catch(() => {});
      return true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, SESSIONS_COLLECTION);
      } catch {
        // Logged
      }
      return false;
    } finally {
      this.activeMutationCount = Math.max(0, this.activeMutationCount - 1);
    }
  }

  public async deleteToken(tokenStr: string): Promise<boolean> {
    this.localMutationEpoch++;
    this.activeMutationCount++;

    const clean = tokenStr.trim().toUpperCase();
    const deletedAt = Date.now();
    this.deletedTokens.set(clean, deletedAt);
    this.persistDeletedTokensToLocal();

    const tokenSessions = this.sessionsCache.filter(s => s.tokenUsed.trim().toUpperCase() === clean);
    tokenSessions.forEach(s => {
      this.deletedSessionIds.add(s.id);
      const timer = this.sessionSaveTimers.get(s.id);
      if (timer) {
        clearTimeout(timer);
        this.sessionSaveTimers.delete(s.id);
      }
      this.pendingSessionSaves.delete(s.id);
    });
    this.persistDeletedSessionsToLocal();

    this.sessionsCache = this.sessionsCache.filter(s => s.tokenUsed.trim().toUpperCase() !== clean);

    const currentSettings = this.getSettings();
    const newTokenList = (currentSettings.tokenList || []).filter(t => t.token.trim().toUpperCase() !== clean);
    const newPrevTokens = (currentSettings.previousTokens || []).filter(t => t.trim().toUpperCase() !== clean);
    const isMainActive = (currentSettings.activeToken || '').trim().toUpperCase() === clean;

    const nextSettings: TeacherSettings = {
      ...currentSettings,
      tokenList: newTokenList,
      previousTokens: newPrevTokens,
      ...(isMainActive
        ? { activeToken: newTokenList[0]?.token || '', isTokenActive: newTokenList.length > 0 }
        : {}),
      updatedAt: deletedAt
    };
    this.settingsCache = nextSettings;
    this.persistSettingsToLocal();
    this.persistSessionsToLocal();
    this.broadcastChange();

    try {
      await this.pushConfigAndSlidesToFirestore(nextSettings, false);

      // Delete matching student sessions in Firestore
      const matchingIds = new Set(tokenSessions.map(s => s.id));
      try {
        const snap = await getDocs(collection(db, SESSIONS_COLLECTION));
        snap.forEach(d => {
          const data = d.data() as StudentSession;
          if ((data.tokenUsed || '').trim().toUpperCase() === clean) {
            matchingIds.add(d.id);
          }
        });
      } catch {
        // Use local list
      }

      const idList = Array.from(matchingIds);
      for (let i = 0; i < idList.length; i += 200) {
        const chunk = idList.slice(i, i + 200);
        const batch = writeBatch(db);
        chunk.forEach(id => {
          const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
          batch.set(doc(db, DELETED_SESSIONS_COLLECTION, cleanId), { id: cleanId, deletedAt });
          batch.delete(doc(db, SESSIONS_COLLECTION, cleanId));
        });
        await batch.commit();
      }

      void this.fetchWithRetry(`/api/tokens/${encodeURIComponent(clean)}`, { method: 'DELETE' }, 0, 4000).catch(
        () => {}
      );
      return true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
      } catch {
        // Logged
      }
      return false;
    } finally {
      this.activeMutationCount = Math.max(0, this.activeMutationCount - 1);
    }
  }

  public generateRandomToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'N100';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public getAllTokenItems(): AssessmentTokenItem[] {
    const list = (this.settingsCache.tokenList || []).filter(
      item => item && item.token && !this.isTokenDeleted(item.token, item.createdAt)
    );
    if (list.length === 0 && this.settingsCache.activeToken && !this.isTokenDeleted(this.settingsCache.activeToken)) {
      return [
        {
          token: this.settingsCache.activeToken.trim().toUpperCase(),
          school: this.settingsCache.schoolNameDefault || 'SMA Negeri 1',
          durationMinutes: this.settingsCache.examDurationMinutes || 30,
          isActive: this.settingsCache.isTokenActive
        }
      ];
    }
    return list;
  }

  public getTokenItem(tokenStr: string): AssessmentTokenItem | null {
    const clean = tokenStr.trim().toUpperCase();
    const items = this.getAllTokenItems();
    return items.find(t => t.token.trim().toUpperCase() === clean) || null;
  }

  public async exportBackupJson(): Promise<string> {
    await this.syncWithServer(true);
    const payload = {
      app: 'Lawan!! Nilai 100 - Asesmen SMA',
      version: 2,
      exportedAt: Date.now(),
      settings: this.getSettings(),
      sessions: this.getSessions(),
      questions: this.getQuestions()
    };
    return JSON.stringify(payload, null, 2);
  }

  public async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      this.isRestoring = true;
      let parsed: any;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return { success: false, message: 'Format file JSON cadangan tidak valid.' };
      }

      let payload = parsed;
      if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
        payload = parsed.data;
      }

      if (!payload || !payload.settings) {
        return { success: false, message: 'File cadangan tidak memuat pengaturan guru yang valid.' };
      }

      const restoreTs = Date.now();
      this.deletedSessionIds.clear();
      this.persistDeletedSessionsToLocal();
      this.deletedTokens.clear();
      this.persistDeletedTokensToLocal();

      const restoredSettings: TeacherSettings = {
        ...EMPTY_SETTINGS,
        ...payload.settings,
        lastRestoredAt: restoreTs,
        updatedAt: restoreTs
      };
      this.settingsCache = restoredSettings;
      this.persistSettingsToLocal();

      await this.pushConfigAndSlidesToFirestore(restoredSettings, true);

      if (Array.isArray(payload.sessions)) {
        const cleanSessions: StudentSession[] = payload.sessions
          .filter((s: any) => s && s.id && s.name)
          .map((s: any) => ({ ...s, tokenUsed: String(s.tokenUsed || '').trim().toUpperCase() }));
        this.sessionsCache = cleanSessions;
        this.persistSessionsToLocal();

        for (let i = 0; i < cleanSessions.length; i += 200) {
          const chunk = cleanSessions.slice(i, i + 200);
          const batch = writeBatch(db);
          chunk.forEach(s => {
            const sp = this.buildFirestoreSessionPayload(s);
            batch.set(doc(db, SESSIONS_COLLECTION, sp.id), sp);
          });
          await batch.commit();
        }
      }

      if (Array.isArray(payload.questions) && payload.questions.length > 0) {
        this.questionsCache = payload.questions;
        this.persistQuestionsToLocal();
        for (let i = 0; i < payload.questions.length; i += 200) {
          const chunk = payload.questions.slice(i, i + 200);
          const batch = writeBatch(db);
          chunk.forEach((q: Question) => {
            if (q && q.id) {
              batch.set(doc(db, QUESTIONS_COLLECTION, q.id), stripUndefinedDeep(q));
            }
          });
          await batch.commit();
        }
      }

      void this.fetchWithRetry('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload, restoreTimestamp: restoreTs })
      }, 0, 6000).catch(() => {});

      this.broadcastChange();
      return { success: true, message: 'Data cadangan Lawan!! Nilai 100 berhasil dipulihkan secara penuh!' };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal memproses file JSON: ' + (err?.message || 'Error tidak diketahui')
      };
    } finally {
      this.isRestoring = false;
    }
  }

  public getQuestions(): Question[] {
    return this.questionsCache;
  }

  public getQuestionsByGrade(grade: GradeLevel): Question[] {
    return this.getQuestions().filter(q => q.grade === grade);
  }

  public saveQuestion(updated: Question): void {
    const list = [...this.getQuestions()];
    const index = list.findIndex(q => q.id === updated.id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    this.questionsCache = list;
    this.persistQuestionsToLocal();
    this.broadcastChange();

    const cleanId = String(updated.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    void setDoc(doc(db, QUESTIONS_COLLECTION, cleanId), stripUndefinedDeep(updated)).catch(error => {
      try {
        handleFirestoreError(error, OperationType.WRITE, `${QUESTIONS_COLLECTION}/${cleanId}`);
      } catch {
        // Logged
      }
    });

    void this.fetchWithRetry('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: updated })
    }, 0, 4000).catch(() => {});
  }

  public resetQuestionsToDefault(): void {
    this.questionsCache = QUESTIONS;
    this.persistQuestionsToLocal();
    this.broadcastChange();

    void (async () => {
      try {
        const snap = await getDocs(collection(db, QUESTIONS_COLLECTION));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, QUESTIONS_COLLECTION);
        } catch {
          // Logged
        }
      }
    })();

    void this.fetchWithRetry('/api/questions/reset', {
      method: 'POST'
    }, 0, 4000).catch(() => {});
  }

  public roundTo2Decimals(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  // Scoring Logic for Lawan!! Nilai 100 SMA Kurikulum Merdeka & Model TKA (B. Indonesia + B. Inggris + Matematika)
  public calculateAssessmentResult(
    grade: GradeLevel,
    rawAnswers: Record<string, StudentAnswerState>
  ): {
    answersWithScore: Record<string, StudentAnswerState>;
    totalScore: number;
    mathScore: number;
    indoScore: number;
    englishScore: number;
    predicate: 'Istimewa' | 'Baik' | 'Memadai' | 'Kurang';
    correctCount: number;
    wrongCount: number;
  } {
    const gradeQuestions = this.getQuestionsByGrade(normalizeGradeValue(grade));
    let mathScoreAccumulator = 0;
    let mathMaxPoints = 0;
    let indoScoreAccumulator = 0;
    let indoMaxPoints = 0;
    let englishScoreAccumulator = 0;
    let englishMaxPoints = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const evaluatedAnswers: Record<string, StudentAnswerState> = {};

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
          const userChoices = Array.isArray(studentState.answer) ? studentState.answer : [];
          const correctChoices = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          const totalOptions = question.options?.length || 5;

          if (userChoices.length > 0 && correctChoices.length > 0) {
            const correctHits = userChoices.filter(c => correctChoices.includes(c)).length;
            const totalCorrectCount = correctChoices.length;

            if (userChoices.length >= totalOptions) {
              scoreEarned = 0;
              isCorrect = false;
            } else if (correctHits > 0) {
              const excessChoices = Math.max(0, userChoices.length - totalCorrectCount);
              const effectiveHits = Math.max(0, correctHits - excessChoices);

              if (effectiveHits > 0) {
                scoreEarned = this.roundTo2Decimals((effectiveHits / totalCorrectCount) * 10);
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

          scoreEarned = totalStatements > 0 ? this.roundTo2Decimals((matchedStatements / totalStatements) * 10) : 0;
          isCorrect = matchedStatements === totalStatements;
        }
      }

      if (scoreEarned > 0) {
        if (scoreEarned === 10) {
          correctCount++;
        } else {
          correctCount += this.roundTo2Decimals(scoreEarned / 10);
        }
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

    const mathScore = mathMaxPoints > 0 ? this.roundTo2Decimals((mathScoreAccumulator / mathMaxPoints) * 100) : 0;
    const indoScore = indoMaxPoints > 0 ? this.roundTo2Decimals((indoScoreAccumulator / indoMaxPoints) * 100) : 0;
    const englishScore =
      englishMaxPoints > 0 ? this.roundTo2Decimals((englishScoreAccumulator / englishMaxPoints) * 100) : 0;
    const totalMaxPoints = mathMaxPoints + indoMaxPoints + englishMaxPoints;
    const totalEarned = mathScoreAccumulator + indoScoreAccumulator + englishScoreAccumulator;
    const totalScore = totalMaxPoints > 0 ? this.roundTo2Decimals((totalEarned / totalMaxPoints) * 100) : 0;

    correctCount = this.roundTo2Decimals(correctCount);
    wrongCount = this.roundTo2Decimals(Math.max(0, gradeQuestions.length - correctCount));

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

  public getLeaderboard(grade: GradeLevel, token: string): StudentSession[] {
    const cleanToken = token.trim().toUpperCase();
    const sessions = this.getSessions().filter(
      s => s.grade === grade && s.tokenUsed.trim().toUpperCase() === cleanToken && s.status === 'selesai'
    );

    return sessions.sort((a, b) => {
      const scoreA = a.totalScore ?? 0;
      const scoreB = b.totalScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const timeA = a.timeSpentSeconds || 999999;
      const timeB = b.timeSpentSeconds || 999999;
      return timeA - timeB;
    });
  }
}

export const storageService = new StorageService();
