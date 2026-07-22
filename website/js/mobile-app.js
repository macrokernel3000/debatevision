(() => {
  const api = window.DebateVisionMobileApi;
  if (!api) return;

  const {
    dashboard,
    resultActions,
    cardModal,
    cardModalList,
    drawHistory,
    bottomNav
  } = api.elements;

  function leaveMobileResult() {
    document.body.classList.remove("has-mobile-draw-result");
    api.setMobileHistoryVisible(false);
  }

  function resetMobileActivityView() {
    leaveMobileResult();
    api.renderAll();
    api.renderEmptyState();
  }

  dashboard?.addEventListener("click", (event) => {
    const variantButton = event.target.closest("[data-mobile-survival-variant]");
    if (variantButton) {
      api.clearSurvivalResult();
      api.survivalVariant = variantButton.dataset.mobileSurvivalVariant;
      api.activeLibrary = "items";
      api.activePreview = "items";
      api.lockEnvironment = false;
      api.noEnvironment = false;
      api.currentStageCard = null;
      resetMobileActivityView();
      return;
    }

    const salesVariantButton = event.target.closest("[data-mobile-sales-variant]");
    if (salesVariantButton) {
      api.salesVariant = salesVariantButton.dataset.mobileSalesVariant;
      if (api.salesVariant === "supply") api.activePreview = "items";
      if (api.salesVariant === "story") api.activePreview = api.salesNoConcept ? "items" : "concepts";
      if (api.salesVariant === "target") {
        api.ensureSalesAudienceDeck();
        api.activePreview = api.salesAudienceDeck;
      }
      resetMobileActivityView();
      return;
    }

    const salesAudienceButton = event.target.closest("[data-mobile-sales-audience]");
    if (salesAudienceButton) {
      api.salesAudienceDeck = salesAudienceButton.dataset.mobileSalesAudience;
      api.activePreview = api.salesAudienceDeck;
      resetMobileActivityView();
      return;
    }

    const metaphorVariantButton = event.target.closest("[data-mobile-metaphor-variant]");
    if (metaphorVariantButton) {
      api.metaphorVariant = metaphorVariantButton.dataset.mobileMetaphorVariant;
      api.currentMetaphorCards = null;
      api.syncMetaphorVariantDecks();
      resetMobileActivityView();
      return;
    }

    const metaphorPrefixDeckButton = event.target.closest("[data-mobile-metaphor-prefix-deck]");
    const metaphorSuffixDeckButton = event.target.closest("[data-mobile-metaphor-suffix-deck]");
    if (metaphorPrefixDeckButton || metaphorSuffixDeckButton) {
      const deckId = metaphorPrefixDeckButton
        ? metaphorPrefixDeckButton.dataset.mobileMetaphorPrefixDeck
        : metaphorSuffixDeckButton.dataset.mobileMetaphorSuffixDeck;
      if (metaphorPrefixDeckButton) api.metaphorPrefixDeck = deckId;
      if (metaphorSuffixDeckButton) api.metaphorSuffixDeck = deckId;
      api.currentMetaphorCards = null;
      api.activeLibrary = deckId;
      api.activePreview = deckId;
      resetMobileActivityView();
      return;
    }

    const summonCategoryButton = event.target.closest("[data-mobile-summon-category]");
    if (summonCategoryButton) {
      const category = summonCategoryButton.dataset.mobileSummonCategory;
      const selection = api.summonCategorySelection;
      if (selection.has(category) && selection.size > 1) selection.delete(category);
      else selection.add(category);
      api.renderAll();
      return;
    }

    const deckToggle = event.target.closest("[data-mobile-deck-toggle]");
    if (deckToggle && api.survivalVariant === "survival") {
      const deckId = deckToggle.dataset.mobileDeckToggle;
      const selection = api.survivalDeckSelection;
      if (selection.has(deckId) && selection.size > 1) selection.delete(deckId);
      else selection.add(deckId);
      api.activeLibrary = deckId;
      api.activePreview = deckId;
      api.renderAll();
      return;
    }

    const genericDeckToggle = event.target.closest("[data-mobile-generic-deck-toggle]");
    if (genericDeckToggle) {
      const deckId = genericDeckToggle.dataset.mobileGenericDeckToggle;
      if (api.activeMode.cardMode === "importanceDuel") {
        const selection = api.selectedImportanceDecks;
        if (selection.has(deckId) && selection.size > 1) selection.delete(deckId);
        else selection.add(deckId);
      }
      api.activeLibrary = deckId;
      api.activePreview = deckId;
      api.renderAll();
      return;
    }

    const editButton = event.target.closest("[data-mobile-edit-deck]");
    if (editButton) {
      api.openMobileCardModal(editButton.dataset.mobileEditDeck);
      return;
    }

    const resourceButton = event.target.closest("[data-mobile-resource-step]");
    if (resourceButton) {
      const key = api.mobileResourceKey(resourceButton.dataset.mobileResourceStep);
      const step = Number(resourceButton.dataset.step) || 0;
      const nextValue = Math.max(0, Math.min(6, api.survivalCountValue(key) + step));
      api.setSurvivalCountValue(key, nextValue);
      const card = resourceButton.closest(".mobile-deck-card");
      const amount = card?.querySelector(".mobile-mini-stepper b");
      if (amount) amount.textContent = String(nextValue);
      card?.classList.toggle("is-active", nextValue > 0);
      return;
    }

    const stepperButton = event.target.closest("[data-mobile-step]");
    if (stepperButton) {
      const container = stepperButton.closest("[data-mobile-count]");
      const target = container?.dataset.mobileCount;
      const step = Number(stepperButton.dataset.mobileStep) || 0;
      if (target === "draw") {
        api.drawCount.value = Math.max(1, Math.min(6, (Number(api.drawCount.value) || 1) + step));
      } else if (target === "groups") {
        api.survivalGroupCount = Math.max(1, Math.min(8, api.survivalGroupCount + step));
        api.drawCount.value = api.survivalGroupCount;
      }
      api.renderAll();
      return;
    }

    if (event.target.closest("[data-mobile-draw]")) api.spinDraw();
  });

  dashboard?.addEventListener("input", (event) => {
    const input = event.target.closest("[data-mobile-count-input]");
    if (!input) return;
    const target = input.dataset.mobileCountInput;
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 6;
    const value = Math.max(min, Math.min(max, Number(input.value) || min));
    if (target === "draw") api.drawCount.value = value;
    if (target === "groups") {
      api.survivalGroupCount = value;
      api.drawCount.value = value;
    }
    api.renderAll();
  });

  document.querySelector("#mobileHomeGrid")?.addEventListener("click", (event) => {
    const activity = event.target.closest("[data-mobile-home-mode]");
    if (!activity) return;
    api.setMode(activity.dataset.mobileHomeMode);
    window.scrollTo({ top: 0 });
  });

  dashboard?.addEventListener("change", (event) => {
    const salesNoConceptInput = event.target.closest("[data-mobile-sales-no-concept]");
    if (!salesNoConceptInput) return;
    api.salesNoConcept = salesNoConceptInput.checked;
    api.activePreview = api.salesNoConcept ? "items" : "concepts";
    api.renderAll();
    api.renderEmptyState();
  });

  resultActions?.addEventListener("click", (event) => {
    if (event.target.closest("[data-mobile-resource-exchange]")) {
      api.exchangeSurvivalResources();
      return;
    }
    if (event.target.closest("[data-mobile-again]")) api.showMobileSetup();
  });

  api.cardGrid?.addEventListener("click", (event) => {
    const lockButton = event.target.closest("[data-mobile-result-lock]");
    if (lockButton) {
      event.preventDefault();
      event.stopPropagation();
      api.toggleSurvivalResultLock(lockButton.dataset.mobileResultLock);
      return;
    }

    const groupButton = event.target.closest("[data-mobile-reroll-group]");
    if (groupButton) {
      event.preventDefault();
      event.stopPropagation();
      api.rerollSurvivalGroup(groupButton.dataset.mobileRerollGroup);
    }
  });

  cardModal?.addEventListener("click", (event) => {
    if (event.target === cardModal || event.target.closest("[data-mobile-card-modal-close]")) {
      api.closeMobileCardModal();
      return;
    }

    const actionButton = event.target.closest("[data-mobile-deck-action]");
    if (actionButton && api.mobileEditingDeck) {
      const { baseDeck, rarity } = api.mobileDeckTarget(api.mobileEditingDeck);
      const selectedKeys = api.selectedKeysForDeck(baseDeck);
      const cards = api.mobileDeckCards(api.mobileEditingDeck);
      if (actionButton.dataset.mobileDeckAction === "select") {
        for (const card of cards) selectedKeys.add(api.cardKey(card));
      }
      if (actionButton.dataset.mobileDeckAction === "clear") {
        for (const card of cards) selectedKeys.delete(api.cardKey(card));
      }
      if (actionButton.dataset.mobileDeckAction === "reset") {
        if (rarity) {
          for (const card of cards) selectedKeys.add(api.cardKey(card));
        } else {
          api.resetDeckSelectionToDefault(baseDeck);
        }
      }
      api.renderMobileCardModal();
      api.renderAll();
    }
  });

  cardModalList?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-mobile-card-key]");
    if (!checkbox || !api.mobileEditingDeck) return;
    const { baseDeck } = api.mobileDeckTarget(api.mobileEditingDeck);
    const selectedKeys = api.selectedKeysForDeck(baseDeck);
    if (checkbox.checked) selectedKeys.add(checkbox.dataset.mobileCardKey);
    else selectedKeys.delete(checkbox.dataset.mobileCardKey);
    api.renderMobileCardModal();
    api.renderAll();
  });

  drawHistory?.addEventListener("click", (event) => {
    const item = event.target.closest("[data-history-index]");
    if (!item || !api.isMobileAppView()) return;
    if (!api.restoreHistoryEntry(item.dataset.historyIndex, { mobileResult: true })) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  bottomNav?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-nav]");
    if (!button) return;
    const target = button.dataset.mobileNav;
    if (target === "home") {
      leaveMobileResult();
      api.showMobileHome();
    }
    if (target === "menu") api.setActivityMenu(true);
    if (target === "history") {
      document.body.classList.remove("has-mobile-home");
      document.body.classList.add("has-mobile-draw-result");
      api.setMobileHistoryVisible(true);
      document.querySelector(".history-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();
