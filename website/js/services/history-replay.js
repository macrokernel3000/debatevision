(() => {
  function create(options) {
    const groupKeys = ["items", "roles", "creatures", "aliens", "powers", "specialists"];

    function entryMeta(mode, survivalState) {
      if (mode.cardMode !== "itemEnvironment") return undefined;
      return {
        survivalVariant: survivalState.variant,
        groupCount: survivalState.groupCount,
        counts: { ...survivalState.counts },
        noEnvironment: Boolean(survivalState.noEnvironment)
      };
    }

    function cardsForEntry(entry) {
      return (entry?.cards || []).map((card) => {
        const found = options.cardsFrom(card.deckId).find((candidate) => candidate.name === card.name);
        const base = found || options.normalizeCard({ ...card, lore: "", hooks: [] }, card.deckId);
        return {
          ...base,
          hooks: Array.isArray(card.hooks) && card.hooks.length ? [...card.hooks] : base.hooks
        };
      });
    }

    function isBattleEntry(entry) {
      return entry?.meta?.survivalVariant === "battle" || String(entry?.variant || "").startsWith("冒險版");
    }

    function groupCountFor(entry, memberCount) {
      const stored = Number(entry?.meta?.groupCount);
      if (stored > 0) return stored;
      const matched = String(entry?.variant || "").match(/冒險版：(\d+)\s*組/);
      if (Number(matched?.[1]) > 0) return Number(matched[1]);
      return memberCount ? 1 : 0;
    }

    function groupSizeFor(entry, memberCount, groupCount) {
      const counts = entry?.meta?.counts || {};
      const storedSize = groupKeys.reduce((sum, key) => sum + Math.max(0, Number(counts[key]) || 0), 0);
      if (storedSize > 0 && storedSize * groupCount <= memberCount) return storedSize;
      return groupCount ? Math.ceil(memberCount / groupCount) : 0;
    }

    function groupFor(index, members) {
      return {
        index,
        items: members.filter((card) => card.deckId === "items"),
        roles: members.filter((card) => card.deckId === "roles"),
        creatures: members.filter((card) => card.deckId === "creatures"),
        aliens: members.filter((card) => card.deckId === "summons" && card.rarity === "異族"),
        powers: members.filter((card) => card.deckId === "summons" && card.rarity === "超能"),
        specialists: members.filter((card) => card.deckId === "summons" && card.rarity === "特職")
      };
    }

    function itemEnvironment(entry, cards, secondaryDeck) {
      if (!entry || !cards.length) return null;
      const environment = cards.find((card) => card.deckId === secondaryDeck) || null;
      const rawMembers = environment
        ? cards.filter((card) => options.cardKey(card) !== options.cardKey(environment))
        : cards;
      const members = rawMembers.map((card) => options.withEnvironmentHooks(card, environment));

      if (isBattleEntry(entry) && environment) {
        const groupCount = groupCountFor(entry, members.length);
        const groupSize = groupSizeFor(entry, members.length, groupCount);
        const groups = Array.from({ length: groupCount }, (_, groupIndex) => {
          const start = groupIndex * groupSize;
          return groupFor(groupIndex + 1, members.slice(start, start + groupSize));
        });
        return { kind: "battle", environment, groups };
      }

      if (environment) {
        return {
          kind: "combo",
          environment,
          cards: members,
          hideStageInDesktopResults: true
        };
      }

      return { kind: "cards", cards: members };
    }

    return Object.freeze({
      cardsForEntry,
      entryMeta,
      itemEnvironment
    });
  }

  window.DEBATE_HISTORY_REPLAY = Object.freeze({ create });
})();
