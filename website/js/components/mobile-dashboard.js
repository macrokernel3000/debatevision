(() => {
  function create(options) {
    const {
      availableDeckIdsForMode,
      cardsFrom,
      dashboard,
      deckTone,
      decks,
      getActiveLibrary,
      getActiveMode,
      getActiveSecondaryLibrary,
      getDrawCount,
      getImportanceSelection,
      getMetaphorState,
      getSalesState,
      getSummonSelection,
      getSurvivalState,
      getSurvivalResultState,
      importanceAvailableDeckIds,
      modeStatusText,
      metaphorVariantLabel,
      primaryVariantDeckIds,
      resultActions,
      salesAudienceDeckIds,
      selectedCount,
      selectedCardsFrom,
      selectedSalesAudienceCards,
      sharedDeckCover,
      summonCategories,
      summonCategoryLabel,
      uiText,
      variantLabel
    } = options;

    function survivalActionLabel() {
      return getSurvivalState().variant === "battle"
        ? uiText("mobile.itemSurvival.startBattle")
        : uiText("mobile.itemSurvival.startSurvival");
    }

    function survivalAgainLabel() {
      return getSurvivalState().variant === "battle"
        ? uiText("mobile.itemSurvival.againBattle")
        : uiText("mobile.itemSurvival.againSurvival");
    }

    function actionLabel() {
      const mode = getActiveMode();
      return mode.cardMode === "itemEnvironment"
        ? survivalActionLabel()
        : mode.drawLabel || "開始抽卡";
    }

    function againLabel() {
      const mode = getActiveMode();
      return mode.cardMode === "itemEnvironment"
        ? survivalAgainLabel()
        : `再次${mode.title}`;
    }

    function survivalDeckCards() {
      const state = getSurvivalState();
      if (state.variant === "survival") {
        return primaryVariantDeckIds().map((deckId) => ({
          deckId,
          title: deckId === "items"
            ? uiText("mobile.itemSurvival.itemDeck")
            : uiText("mobile.itemSurvival.roleDeck"),
          subtitle: deckId === "items"
            ? "可以操作的資源、工具與物件"
            : "能協助求生的身份與能力",
          selected: state.deckSelection.has(deckId),
          count: selectedCount(deckId),
          total: cardsFrom(deckId).length,
          amount: null
        }));
      }

      return [
        ["items", "道具", "可使用的工具與資源", state.counts.items],
        ["roles", "職業", "團隊中的專業夥伴", state.counts.roles],
        ["creatures", "動物", "可以協助或造成變數的生物", state.counts.creatures],
        ["summons:異族", "異族", "現實召喚中的異族角色", state.counts.aliens],
        ["summons:超能", "超能", "具備特殊能力的角色", state.counts.powers],
        ["summons:特職", "特職", "特殊職能與任務角色", state.counts.specialists]
      ].map(([deckId, title, subtitle, amount]) => {
        const [baseDeck, rarity] = String(deckId).split(":");
        const total = rarity
          ? cardsFrom(baseDeck).filter((card) => card.rarity === rarity).length
          : cardsFrom(baseDeck).length;
        const selected = rarity
          ? selectedCardsFrom(baseDeck).filter((card) => card.rarity === rarity).length
          : selectedCount(baseDeck);
        return {
          amount: Number(amount),
          baseDeck,
          deckId: String(deckId),
          rarity,
          selected: Number(amount) > 0,
          count: selected,
          subtitle,
          title,
          total
        };
      });
    }

    function genericDeckCards() {
      const mode = getActiveMode();
      const sales = getSalesState();
      const metaphor = getMetaphorState();
      if (mode.cardMode === "itemEnvironment") return survivalDeckCards();
      if (mode.cardMode === "importanceDuel") {
        return importanceAvailableDeckIds(mode).map((deckId) => ({
          deckId,
          title: decks[deckId]?.label || variantLabel(deckId),
          subtitle: "可加入本輪比較池",
          selected: getImportanceSelection().has(deckId),
          count: selectedCount(deckId),
          total: cardsFrom(deckId).length
        }));
      }

      if (mode.cardMode === "salesPitch") {
        const deckCards = [{ deckId: "items", title: uiText("mobile.sales.productDeck"), subtitle: "本輪要銷售的產品", selected: true }];
        if (sales.variant === "supply") {
          deckCards.push({ deckId: "needs", title: uiText("mobile.sales.needDeck"), subtitle: "固定抽 1 張需求", selected: true });
        }
        if (sales.variant === "story" && !sales.noConcept) {
          deckCards.push({ deckId: "concepts", title: uiText("mobile.sales.conceptDeck"), subtitle: "固定抽 1 張故事概念", selected: true });
        }
        if (sales.variant === "target") {
          deckCards.push({
            deckId: sales.audienceDeck,
            title: decks[sales.audienceDeck]?.label || uiText("mobile.sales.targetDeck"),
            subtitle: "固定抽 1 張客戶目標",
            selected: true
          });
        }
        return deckCards.map((deck) => ({
          ...deck,
          count: deck.deckId === "summons" ? selectedSalesAudienceCards().length : selectedCount(deck.deckId),
          total: cardsFrom(deck.deckId).length
        }));
      }

      if (mode.cardMode === "metaphorCompass") {
        const deckCards = [];
        if (metaphor.variant !== "concrete") {
          deckCards.push({
            deckId: metaphor.prefixDeck,
            title: uiText("mobile.metaphor.prefixDeck"),
            subtitle: decks[metaphor.prefixDeck]?.label || "前綴",
            selected: true
          });
        }
        deckCards.push({
          deckId: getActiveSecondaryLibrary(),
          title: uiText("mobile.metaphor.relationDeck"),
          subtitle: metaphor.variant === "concrete" ? "就像（固定）" : "連接兩個詞",
          selected: true
        });
        deckCards.push({
          deckId: metaphor.suffixDeck,
          title: uiText("mobile.metaphor.suffixDeck"),
          subtitle: decks[metaphor.suffixDeck]?.label || "後綴",
          selected: true
        });
        return deckCards
          .filter((deck) => deck.deckId && decks[deck.deckId])
          .map((deck) => ({
            ...deck,
            count: selectedCount(deck.deckId),
            total: cardsFrom(deck.deckId).length
          }));
      }

      if (mode.cardMode === "summonMission") {
        return [
          {
            deckId: "missions",
            title: "任務卡",
            subtitle: "固定抽 1 張任務",
            selected: true,
            count: selectedCount("missions"),
            total: cardsFrom("missions").length
          },
          ...summonCategories.map((category) => ({
            deckId: `summons:${category}`,
            toggleValue: category,
            title: summonCategoryLabel(category),
            subtitle: "可加入本輪召喚池",
            selected: getSummonSelection().has(category),
            count: selectedCardsFrom("summons").filter((card) => card.rarity === category).length,
            total: cardsFrom("summons").filter((card) => card.rarity === category).length
          }))
        ];
      }

      return availableDeckIdsForMode(mode)
        .map((deckId) => ({
          deckId,
          title: decks[deckId]?.label || variantLabel(deckId),
          subtitle: "本輪使用卡池",
          selected: deckId === getActiveLibrary() || deckId === getActiveSecondaryLibrary(),
          count: selectedCount(deckId),
          total: cardsFrom(deckId).length
        }));
    }

    function renderGeneric() {
      const mode = getActiveMode();
      const sales = getSalesState();
      const metaphor = getMetaphorState();
      const deckCards = genericDeckCards().map((deck) => ({ ...deck, cover: sharedDeckCover(deck.deckId) }));
      const fixedCount = Boolean(mode.fixedCount || mode.cardMode === "metaphorCompass");
      return window.DebateVisionMobileRender.genericDashboard({
        actionLabel: actionLabel(),
        cardMode: mode.cardMode,
        countValue: mode.fixedCount || Math.max(1, Math.min(6, Number(getDrawCount()) || 1)),
        deckCards,
        deckTone,
        fixedCount,
        metaphorVariant: metaphor.variant,
        metaphorVariantLabel,
        salesAudienceDeck: sales.audienceDeck,
        salesAudienceDeckIds: salesAudienceDeckIds(),
        salesNoConcept: sales.noConcept,
        salesVariant: sales.variant,
        standardDeckUi: ["salesPitch", "summonMission", "importanceDuel"].includes(mode.cardMode),
        statusText: modeStatusText(),
        summonCategories,
        summonCategoryLabel,
        summonCategorySelection: getSummonSelection(),
        variantLabel
      });
    }

    function render() {
      if (!dashboard) return;
      const mode = getActiveMode();
      const active = mode.cardMode !== "secretPlace" && mode.cardMode !== "cardDictionary";
      dashboard.hidden = !active;
      if (!active) {
        dashboard.innerHTML = "";
        return;
      }
      if (mode.cardMode !== "itemEnvironment") {
        dashboard.innerHTML = renderGeneric();
        return;
      }

      const state = getSurvivalState();
      const survivalMode = state.variant === "survival";
      dashboard.innerHTML = window.DebateVisionMobileRender.survivalDashboard({
        actionLabel: survivalActionLabel(),
        countLabel: survivalMode ? uiText("mobile.itemSurvival.drawCount") : uiText("mobile.itemSurvival.groupCount"),
        countMax: survivalMode ? 6 : 8,
        countMin: 1,
        countValue: survivalMode
          ? Math.max(1, Math.min(6, Number(getDrawCount()) || 1))
          : state.groupCount,
        deckTone,
        environmentDeck: {
          deckId: mode.secondaryDeck || "worlds",
          title: "異境卡",
          selected: true,
          cover: sharedDeckCover(mode.secondaryDeck || "worlds")
        },
        selectedDecks: survivalDeckCards().map((deck) => ({ ...deck, cover: sharedDeckCover(deck.deckId) })),
        survivalModeActive: survivalMode
      });
    }

    function renderActions() {
      if (!resultActions) return;
      const mode = getActiveMode();
      const active = mode.cardMode !== "secretPlace" && mode.cardMode !== "cardDictionary";
      resultActions.hidden = !active;
      const result = getSurvivalResultState();
      resultActions.innerHTML = window.DebateVisionMobileRender.resultActions({
        active,
        againLabel: againLabel(),
        notice: mode.cardMode === "itemEnvironment" ? result.notice : "",
        survivalKind: mode.cardMode === "itemEnvironment" ? result.kind : ""
      });
    }

    return Object.freeze({ actionLabel, againLabel, render, renderActions });
  }

  window.DebateVisionMobileDashboard = Object.freeze({ create });
})();
