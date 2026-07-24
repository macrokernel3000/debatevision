(() => {
  function bind(options) {
    const {
      clearStageCard,
      ensureSalesAudienceDeck,
      getActiveMode,
      renderAll,
      renderDeckControls,
      renderEmptyState,
      root,
      setActiveDecks,
      setActivePreview,
      setSurvivalCountValue,
      states,
      survivalCountValue,
      syncMetaphorVariantDecks
    } = options;
    const { importance, metaphor, sales, summon, survival } = states;

    function handleCountInput(event) {
      const input = event.target.closest("[data-survival-count]");
      if (!input) return false;
      const key = input.dataset.survivalCount;
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 8;
      const cleanValue = String(input.value || "").replace(/[^\d]/g, "");
      if (input.value !== cleanValue) input.value = cleanValue;
      setSurvivalCountValue(key, Math.max(min, Math.min(max, Number(cleanValue) || min)));
      return true;
    }

    function handleCountStep(event) {
      const button = event.target.closest("[data-survival-step]");
      if (!button) return false;
      const key = button.dataset.survivalStep;
      const input = root.querySelector(`[data-survival-count="${key}"]`);
      if (!input) return false;
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 8;
      const step = Number(button.dataset.step) || 0;
      setSurvivalCountValue(key, Math.max(min, Math.min(max, survivalCountValue(key) + step)));
      renderAll();
      return true;
    }

    function toggleSingleRequired(selection, key) {
      if (selection.has(key)) {
        if (selection.size > 1) selection.delete(key);
      } else {
        selection.add(key);
      }
    }

    root.addEventListener("click", (event) => {
      if (handleCountStep(event)) return;

      const survivalVariant = event.target.closest("[data-survival-variant]");
      if (survivalVariant) {
        survival.variant = survivalVariant.dataset.survivalVariant;
        survival.lockEnvironment = false;
        survival.noEnvironment = false;
        clearStageCard();
        setActiveDecks("items", "items");
        renderAll();
        renderEmptyState();
        return;
      }

      const metaphorVariant = event.target.closest("[data-metaphor-variant]");
      if (metaphorVariant) {
        metaphor.variant = metaphorVariant.dataset.metaphorVariant;
        metaphor.currentCards = null;
        syncMetaphorVariantDecks();
        renderAll();
        renderEmptyState();
        return;
      }

      const prefixDeck = event.target.closest("[data-metaphor-prefix-deck]");
      const suffixDeck = event.target.closest("[data-metaphor-suffix-deck]");
      if (prefixDeck || suffixDeck) {
        const deckId = prefixDeck
          ? prefixDeck.dataset.metaphorPrefixDeck
          : suffixDeck.dataset.metaphorSuffixDeck;
        metaphor.currentCards = null;
        if (prefixDeck) {
          metaphor.prefixDeck = deckId;
          metaphor.locks.prefix = false;
        } else {
          metaphor.suffixDeck = deckId;
          metaphor.locks.suffix = false;
        }
        setActivePreview(deckId);
        renderAll();
        renderEmptyState();
        return;
      }

      const primaryDeck = event.target.closest("[data-primary-variant]");
      if (primaryDeck) {
        const deckId = primaryDeck.dataset.primaryVariant;
        const mode = getActiveMode();
        if (mode.cardMode === "importanceDuel") toggleSingleRequired(importance.selectedDecks, deckId);
        if (mode.cardMode === "itemEnvironment" && survival.variant === "survival") {
          toggleSingleRequired(survival.deckSelection, deckId);
        }
        setActiveDecks(deckId, deckId);
        renderAll();
        return;
      }

      const importanceRed = event.target.closest("[data-importance-red]");
      const importanceBlue = event.target.closest("[data-importance-blue]");
      if (importanceRed || importanceBlue) {
        const deckId = importanceRed?.dataset.importanceRed || importanceBlue.dataset.importanceBlue;
        if (importanceRed) importance.redDeck = deckId;
        else importance.blueDeck = deckId;
        importance.selectedDecks = new Set([importance.redDeck, importance.blueDeck].filter(Boolean));
        setActiveDecks(deckId, deckId);
        renderAll();
        renderEmptyState();
        return;
      }

      const salesVariant = event.target.closest("[data-sales-variant]");
      if (salesVariant) {
        sales.variant = salesVariant.dataset.salesVariant;
        if (sales.variant === "supply") setActivePreview("items");
        if (sales.variant === "story") setActivePreview(sales.noConcept ? "items" : "concepts");
        if (sales.variant === "target") {
          ensureSalesAudienceDeck();
          setActivePreview(sales.audienceDeck);
        }
        renderAll();
        renderEmptyState();
        return;
      }

      const audienceDeck = event.target.closest("[data-sales-audience]");
      if (audienceDeck) {
        sales.audienceDeck = audienceDeck.dataset.salesAudience;
        setActivePreview(sales.audienceDeck);
        renderAll();
        renderEmptyState();
        return;
      }

      const summonCategory = event.target.closest("[data-summon-category]");
      if (!summonCategory) return;
      toggleSingleRequired(summon.categorySelection, summonCategory.dataset.summonCategory);
      renderAll();
      renderEmptyState();
    });

    root.addEventListener("input", (event) => {
      if (handleCountInput(event)) renderDeckControls();
    });

    root.addEventListener("change", (event) => {
      if (handleCountInput(event)) {
        renderAll();
        return;
      }

      const legacyMetaphorDeck = event.target.closest("[data-metaphor-deck]");
      if (legacyMetaphorDeck) {
        const part = legacyMetaphorDeck.dataset.metaphorDeck;
        metaphor.currentCards = null;
        if (part === "prefix") {
          metaphor.prefixDeck = legacyMetaphorDeck.value;
          metaphor.locks.prefix = false;
        }
        if (part === "suffix") {
          metaphor.suffixDeck = legacyMetaphorDeck.value;
          metaphor.locks.suffix = false;
        }
        setActivePreview(legacyMetaphorDeck.value);
        renderAll();
        return;
      }

      const metaphorLock = event.target.closest("[data-lock-metaphor]");
      if (metaphorLock) {
        metaphor.locks[metaphorLock.dataset.lockMetaphor] = metaphorLock.checked;
        renderAll();
        return;
      }

      const noConcept = event.target.closest("[data-sales-no-concept]");
      if (noConcept) {
        sales.noConcept = noConcept.checked;
        setActivePreview(sales.noConcept ? "items" : "concepts");
        renderAll();
        renderEmptyState();
        return;
      }

      const environmentLock = event.target.closest("[data-lock-environment]");
      if (environmentLock) {
        survival.lockEnvironment = environmentLock.checked;
        renderAll();
        return;
      }

      const noEnvironment = event.target.closest("[data-no-environment]");
      if (!noEnvironment) return;
      survival.noEnvironment = noEnvironment.checked;
      if (survival.noEnvironment) {
        survival.lockEnvironment = false;
        clearStageCard();
      }
      renderAll();
    });
  }

  window.DebateVisionDeckControlEvents = Object.freeze({ bind });
})();
