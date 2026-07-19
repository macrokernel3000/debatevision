(() => {
  function createTimerService({
    storageKey = "debatevision-floating-timer",
    collapseOnMobile = true
  } = {}) {
    const state = window.DEBATE_STATE.create(read());

    function read() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
        const mobileDefault = collapseOnMobile && window.matchMedia?.("(max-width: 560px)")?.matches;
        return {
          elapsed: 0,
          running: false,
          startedAt: 0,
          ...stored,
          collapsed: Boolean(stored.collapsed || stored.hidden || mobileDefault)
        };
      } catch {
        return { elapsed: 0, running: false, startedAt: 0, collapsed: true };
      }
    }

    function snapshot() {
      const elapsed = state.running
        ? state.elapsed + Math.max(0, Date.now() - state.startedAt)
        : state.elapsed;
      return {
        elapsed,
        running: state.running,
        startedAt: state.running ? state.startedAt : 0,
        collapsed: state.collapsed
      };
    }

    function save() {
      window.localStorage.setItem(storageKey, JSON.stringify(snapshot()));
    }

    function setCollapsed(collapsed) {
      state.collapsed = Boolean(collapsed);
      save();
      return snapshot();
    }

    function toggle() {
      if (state.running) {
        state.elapsed = snapshot().elapsed;
        state.running = false;
        state.startedAt = 0;
      } else {
        state.running = true;
        state.startedAt = Date.now();
      }
      save();
      return snapshot();
    }

    function reset() {
      state.elapsed = 0;
      state.running = false;
      state.startedAt = 0;
      save();
      return snapshot();
    }

    return Object.freeze({ snapshot, setCollapsed, toggle, reset });
  }

  window.DEBATE_TIMER_SERVICE = Object.freeze({ create: createTimerService });
})();
