(() => {
  function createHistoryService({
    storageKey = "debatevision-draw-history",
    limit = 10
  } = {}) {
    const data = read();

    function read() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
        return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
      } catch {
        return {};
      }
    }

    function save() {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }

    function entries(scope) {
      return [...(data[scope] || [])].slice(0, limit);
    }

    function remember(scope, entry) {
      data[scope] = [entry, ...(data[scope] || [])].slice(0, limit);
      save();
      return entry;
    }

    function entry(scope, index) {
      return data[scope]?.[Number(index)] || null;
    }

    return Object.freeze({ data, entries, remember, entry });
  }

  window.DEBATE_HISTORY_SERVICE = Object.freeze({ create: createHistoryService });
})();
