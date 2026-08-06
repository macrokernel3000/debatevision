(() => {
  function createHistoryService({
    storageKey = "debatevision-draw-history",
    limit = 20,
    pinnedLimit = 15
  } = {}) {
    const data = read();
    const pinnedStorageKey = `${storageKey}-pinned`;
    const pinned = readPinned();

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

    function readPinned() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(pinnedStorageKey) || "{}");
        return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
      } catch {
        return {};
      }
    }

    function savePinned() {
      window.localStorage.setItem(pinnedStorageKey, JSON.stringify(pinned));
    }

    function entryKey(entry) {
      if (entry.id) return entry.id;
      return JSON.stringify({
        roundNumber: entry.roundNumber,
        variant: entry.variant || "",
        cards: entry.cards || []
      });
    }

    function entries(scope) {
      return [...(data[scope] || [])].slice(0, limit);
    }

    function remember(scope, entry) {
      const storedEntry = {
        ...entry,
        id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      };
      data[scope] = [storedEntry, ...(data[scope] || [])].slice(0, limit);
      save();
      return storedEntry;
    }

    function entry(scope, index) {
      return data[scope]?.[Number(index)] || null;
    }

    function nextRound(scope) {
      return Math.max(0, ...entries(scope).map((item) => Number(item.roundNumber) || 0)) + 1;
    }

    function pinnedEntries(scope) {
      return [...(pinned[scope] || [])].slice(0, pinnedLimit);
    }

    function pinnedEntry(scope, index) {
      return pinned[scope]?.[Number(index)] || null;
    }

    function isPinned(scope, entry) {
      const key = entryKey(entry);
      return pinnedEntries(scope).some((item) => entryKey(item) === key);
    }

    function togglePin(scope, index) {
      const selected = entry(scope, index);
      if (!selected) return { changed: false, pinned: false };
      const key = entryKey(selected);
      const current = pinnedEntries(scope);
      const existingIndex = current.findIndex((item) => entryKey(item) === key);
      if (existingIndex >= 0) {
        current.splice(existingIndex, 1);
        pinned[scope] = current;
        savePinned();
        return { changed: true, pinned: false };
      }
      if (current.length >= pinnedLimit) {
        return { changed: false, pinned: false, full: true, limit: pinnedLimit };
      }
      pinned[scope] = [{ ...selected }, ...current];
      savePinned();
      return { changed: true, pinned: true };
    }

    function unpin(scope, index) {
      const current = pinnedEntries(scope);
      if (!current[Number(index)]) return { changed: false };
      current.splice(Number(index), 1);
      pinned[scope] = current;
      savePinned();
      return { changed: true };
    }

    return Object.freeze({
      data,
      entries,
      remember,
      entry,
      nextRound,
      pinnedEntries,
      pinnedEntry,
      isPinned,
      togglePin,
      unpin,
      pinnedLimit
    });
  }

  window.DEBATE_HISTORY_SERVICE = Object.freeze({ create: createHistoryService });
})();
