(() => {
  const coverAssets = {
    items: "../assets/ui/deck-covers/items.jpg",
    "sales:items": "../assets/ui/deck-covers/sales-items.jpg",
    worlds: "../assets/ui/deck-covers/worlds.jpg",
    needs: "../assets/ui/deck-covers/needs.jpg",
    concepts: "../assets/ui/deck-covers/concepts.jpg",
    creatures: "../assets/ui/deck-covers/creatures.jpg",
    roles: "../assets/ui/deck-covers/roles.jpg",
    celebrities: "../assets/ui/deck-covers/celebrities.jpg",
    locations: "../assets/ui/deck-covers/locations.jpg",
    relations: "../assets/ui/deck-covers/relations.jpg",
    missions: "../assets/ui/deck-covers/missions.jpg",
    summons: "../assets/ui/deck-covers/summons.jpg",
    "summons:異族": "../assets/ui/deck-covers/summons-alien.jpg",
    "summons:超能": "../assets/ui/deck-covers/summons-power.jpg",
    "summons:特職": "../assets/ui/deck-covers/summons-specialist.jpg"
  };

  function create({ cardKey, cardsFrom, getActiveMode, iconFor, isMobileView, normalizeCard, selectedKeysForDeck }) {
    function target(deckId) {
      const [baseDeck, rarity] = String(deckId).split(":");
      return { baseDeck, rarity };
    }

    function cards(deckId) {
      const { baseDeck, rarity } = target(deckId);
      return cardsFrom(baseDeck).map((card) => normalizeCard(card, baseDeck)).filter((card) => !rarity || card.rarity === rarity);
    }

    function cover(deckId) {
      const coverKey = getActiveMode().cardMode === "salesPitch" && String(deckId) === "items" ? "sales:items" : String(deckId);
      const explicitCover = coverAssets[coverKey];
      if (explicitCover) {
        const image = isMobileView() ? explicitCover.replace("../assets/ui/deck-covers/", "../assets/ui/deck-covers/mobile/").replace(/\.jpg$/i, ".webp") : explicitCover;
        return { image, name: "", symbol: "", isDeckCover: true };
      }
      const { baseDeck } = target(deckId);
      const candidates = cards(deckId);
      const selectedKeys = selectedKeysForDeck(baseDeck);
      const card = candidates.find((candidate) => selectedKeys.has(cardKey(candidate))) || candidates[0];
      return card ? { image: card.iconAsset || card.image || "", name: card.name, symbol: card.tokenIcon || iconFor(card) } : { image: "", name: "", symbol: "□", isDeckCover: false };
    }

    return Object.freeze({ cards, cover, target });
  }

  window.DebateVisionDeckCovers = Object.freeze({ create });
})();
