(() => {
  function create(options) {
    const {
      artModal,
      artPreview,
      artTitle,
      cardKey,
      cardList,
      cardModal,
      cardTitle,
      cardsForDeck,
      deckTarget,
      decks,
      imageService,
      raritiesFrom,
      rarityDisplayName,
      selectedKeysForDeck,
      tokenIconMarkup
    } = options;
    let editingDeck = "";

    function renderCardModal() {
      if (!cardModal || !editingDeck) return;
      const { baseDeck, rarity } = deckTarget(editingDeck);
      const deck = decks[baseDeck];
      if (!deck) return;
      const cards = cardsForDeck(editingDeck);
      const selectedKeys = selectedKeysForDeck(baseDeck);
      const groups = (rarity ? [rarity] : raritiesFrom(baseDeck))
        .map((rarityName) => ({
          rarity: rarityName,
          cards: cards.filter((card) => (card.rarity || "C") === rarityName)
        }))
        .filter((group) => group.cards.length);

      cardTitle.textContent = `編輯${rarity || deck.label}`;
      cardList.innerHTML = groups.map((group) => {
        const selectedCount = group.cards.filter((card) => selectedKeys.has(cardKey(card))).length;
        return `
          <section class="mobile-rarity-group" data-rarity="${group.rarity}">
            <div class="mobile-rarity-head">
              <strong>${rarityDisplayName(group.rarity)}</strong>
              <span>${selectedCount} / ${group.cards.length} 張</span>
            </div>
            <div class="mobile-rarity-cards">
              ${group.cards.map((card) => `
                <label class="mobile-card-choice">
                  <input type="checkbox" data-mobile-card-key="${cardKey(card)}" ${selectedKeys.has(cardKey(card)) ? "checked" : ""} />
                  ${tokenIconMarkup(card)}
                  <span>${card.name}</span>
                </label>
              `).join("")}
            </div>
          </section>
        `;
      }).join("");
    }

    function openCardModal(deckId) {
      editingDeck = deckId;
      renderCardModal();
      if (cardModal) cardModal.hidden = false;
    }

    function closeCardModal() {
      editingDeck = "";
      if (cardModal) cardModal.hidden = true;
    }

    function openArt(card) {
      if (!artModal || !artPreview || !card) return;
      const image = imageService.imageForCard(card);
      if (!image) return;
      artTitle.textContent = card.name;
      artPreview.innerHTML = `<img src="${image}" alt="${card.name} 全圖" ${imageService.managedAttributes(image, imageService.fallbackForCard(card))} />`;
      artModal.hidden = false;
    }

    function closeArt() {
      if (!artModal) return;
      artModal.hidden = true;
      if (artPreview) artPreview.innerHTML = "";
    }

    artModal?.addEventListener("click", (event) => {
      if (event.target === artModal || event.target.closest("[data-mobile-art-close]")) closeArt();
    });

    return Object.freeze({
      closeArt,
      closeCardModal,
      get editingDeck() { return editingDeck; },
      openArt,
      openCardModal,
      renderCardModal
    });
  }

  window.DebateVisionMobileModals = Object.freeze({ create });
})();
