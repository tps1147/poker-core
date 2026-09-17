// One acknowledged command at a time. Retrying a failed request reuses its ID;
// a second tab's revision conflict adopts its snapshot instead of overwriting it.
export function createLessonRunController({ read, write, cache, makeId, timeoutMs = 12000 }) {
  let state = { phase: "loading", snapshot: null, pending: null, message: null };
  let active = false;
  let generation = 0;
  const listeners = new Set();
  const emit = (patch) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const safeCache = (fn) => { try { return fn(); } catch { return null; } };
  async function withDeadline(promise) {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Lesson request timed out")), timeoutMs); })]);
    } finally { clearTimeout(timer); }
  }
  function adopt(response) {
    const snapshot = response?.snapshot;
    if (!snapshot?.run || !Number.isInteger(snapshot.revision)) throw new Error("Your lesson could not be loaded. Please try again.");
    return snapshot;
  }
  async function save(payload) {
    const requestGeneration = generation;
    emit({ phase: "saving", pending: payload, message: null });
    safeCache(() => cache.set(payload));
    try {
      const response = await withDeadline(write(payload));
      if (!active || generation !== requestGeneration) return;
      const snapshot = adopt(response);
      safeCache(() => cache.clear());
      emit({ phase: "ready", snapshot, pending: null, message: null });
    } catch (error) {
      if (!active || generation !== requestGeneration) return;
      if (error.status === 403 && error.details?.code === "LESSON_ACCESS_REQUIRED") {
        safeCache(() => cache.clear());
        emit({ phase: "access-required", pending: null, message: error.details.message || "This lesson is part of Flop52 Pro." });
      } else if (error.status === 401 || error.status === 403) {
        emit({ phase: "auth-required", message: "Sign in again to save this step. We’ll keep it here while you reconnect." });
      } else if (error.status === 409 && error.details?.snapshot?.run && Number.isInteger(error.details.snapshot.revision)) {
        const snapshot = adopt(error.details);
        safeCache(() => cache.clear());
        const conflict = !error.details.code || error.details.code === "REVISION_CONFLICT";
        emit({ phase: error.details.code === "RUN_LIMIT" ? "limited" : "ready", snapshot, pending: null,
          message: conflict ? "This lesson changed in another tab. We’ve loaded your latest saved place; this choice was not applied." : error.details.message || "That step couldn’t be applied. Your saved place is shown below." });
      } else if ([400,404,413,422].includes(error.status)) {
        safeCache(() => cache.clear());
        emit({ phase: "limited", pending: null, message: error.details?.message || "This lesson step is not available. Your earlier saved progress is safe." });
      } else emit({ phase: "error", message: "We couldn’t save that step. Retry to keep your place. Your last confirmed progress is safe." });
    }
  }
  async function load() {
    const requestGeneration = ++generation;
    emit({ phase: "loading", message: null });
    try {
      const response = await withDeadline(read());
      if (!active || generation !== requestGeneration) return;
      const snapshot = adopt(response);
      const pending = state.pending || safeCache(() => cache.get());
      emit({ snapshot, phase: "ready", pending: null });
      if (pending?.operation?.id && Number.isInteger(pending.expectedRevision)) await save(pending);
    } catch (error) {
      if (!active || generation !== requestGeneration) return;
      if (error.status === 403 && error.details?.code === "LESSON_ACCESS_REQUIRED") {
        safeCache(() => cache.clear());
        emit({ phase: "access-required", pending: null, message: error.details.message || "This lesson is part of Flop52 Pro." });
      } else emit({ phase: [401,403].includes(error.status) ? "auth-required" : "error",
        message: [401,403].includes(error.status) ? "Sign in again to return to your saved lesson." : "We couldn’t load your saved lesson. Check your connection and try again." });
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start() { active = true; void load(); return () => { active = false; generation++; }; },
    send(operation) {
      if (!active || state.phase !== "ready" || !state.snapshot) return Promise.resolve();
      return save({ expectedRevision: state.snapshot.revision, runId: state.snapshot.run.runId, operation: { ...operation, id: makeId() } });
    },
    retry() { if (state.phase === "error") return state.pending ? save(state.pending) : load(); return Promise.resolve(); },
  };
}
