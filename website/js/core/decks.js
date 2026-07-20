(() => {
  function create({ decks, getActiveMode, normalizeCard, summonCategories = [] }) {
    const selectedKeysByScope = {};

    function cardsFrom(deckId) {
      return (decks[deckId]?.cards || []).map((card) => normalizeCard(card, deckId));
    }

    function cardKey(card) {
      return `${card.deckId}::${card.rarity || "C"}::${card.name}`;
    }

    function selectionScope(deckId) {
      return `${getActiveMode().id}::${deckId}`;
    }

    function defaultRaritiesFor(deckId) {
      const defaults = getActiveMode().defaultRarities;
      if (Array.isArray(defaults)) return defaults;
      if (defaults && Array.isArray(defaults[deckId])) return defaults[deckId];
      return null;
    }

    function defaultCardsForDeck(deckId) {
      const cards = cardsFrom(deckId);
      const defaultRarities = defaultRaritiesFor(deckId);
      if (!defaultRarities) return cards;
      const allowed = new Set(defaultRarities);
      return cards.filter((card) => allowed.has(card.rarity || "C"));
    }

    function rarityOrder(rarity) {
      return ({ A: 1, B: 2, C: 3, N: 4, 概念: 5, 需求: 6 })[rarity] || 99;
    }

    function raritiesFrom(deckId) {
      return [...new Set(cardsFrom(deckId).map((card) => card.rarity || "C"))]
        .sort((a, b) => rarityOrder(a) - rarityOrder(b) || a.localeCompare(b));
    }

    function rarityDisplayName(rarity) {
      if (rarity === "概念") return "概念卡";
      if (rarity === "需求") return "需求卡";
      if (summonCategories.includes(rarity)) return `${rarity}卡`;
      return rarity === "N" ? "道具卡" : `${rarity} 卡`;
    }

    function ensureDeckSelection(deckId) {
      if (!deckId) return;
      const scope = selectionScope(deckId);
      if (selectedKeysByScope[scope]) return;
      selectedKeysByScope[scope] = new Set(defaultCardsForDeck(deckId).map((card) => cardKey(card)));
    }

    function selectedKeysForDeck(deckId) {
      ensureDeckSelection(deckId);
      return selectedKeysByScope[selectionScope(deckId)] || new Set();
    }

    function setDeckSelection(deckId, checked) {
      if (!deckId) return;
      selectedKeysByScope[selectionScope(deckId)] = new Set(checked ? cardsFrom(deckId).map((card) => cardKey(card)) : []);
    }

    function resetDeckSelectionToDefault(deckId) {
      if (!deckId) return;
      selectedKeysByScope[selectionScope(deckId)] = new Set(defaultCardsForDeck(deckId).map((card) => cardKey(card)));
    }

    function setCardsSelection(deckId, cards, checked) {
      if (!deckId) return;
      const selectedKeys = selectedKeysForDeck(deckId);
      for (const card of cards) {
        if (checked) selectedKeys.add(cardKey(card));
        else selectedKeys.delete(cardKey(card));
      }
    }

    function selectedCount(deckId) {
      return selectedKeysForDeck(deckId).size;
    }

    function selectedCardsFrom(deckId) {
      const selectedKeys = selectedKeysForDeck(deckId);
      return cardsFrom(deckId).filter((card) => selectedKeys.has(cardKey(card)));
    }

    function pickFromPool(pool, count) {
      const selected = [];
      while (selected.length < count && pool.length) {
        selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      return selected;
    }

    function pickFrom(deckId, count) {
      return pickFromPool([...selectedCardsFrom(deckId)], count);
    }

    function pickFromAvailable(deckId, count, excludedKeys = new Set()) {
      return pickFromPool(
        selectedCardsFrom(deckId).filter((card) => !excludedKeys.has(cardKey(card))),
        count
      );
    }

    return Object.freeze({
      cardKey,
      cardsFrom,
      ensureDeckSelection,
      pickFrom,
      pickFromAvailable,
      pickFromPool,
      raritiesFrom,
      rarityDisplayName,
      resetDeckSelectionToDefault,
      selectedCardsFrom,
      selectedCount,
      selectedKeysForDeck,
      setCardsSelection,
      setDeckSelection
    });
  }

  window.DEBATE_DECK_CORE = Object.freeze({ create });
})();
