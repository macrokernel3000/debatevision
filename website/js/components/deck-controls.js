(() => {
  function create(options) {
    const {
      cardsFrom,
      deckTone,
      decks,
      elements,
      ensureSalesAudienceDeck,
      getActiveLibrary,
      getActiveMode,
      getActiveSecondaryLibrary,
      getImportanceSelection,
      getMetaphorState,
      getSalesState,
      getSummonSelection,
      getSurvivalState,
      importanceActiveDeckIds,
      metaphorDeckOptions,
      metaphorVariantLabel,
      modeStatusText,
      primaryVariantDeckIds,
      salesAudienceDeckIds,
      selectedCount,
      selectedSalesAudienceCards,
      sharedDeckCover,
      summonCategories,
      summonCategoryLabel,
      survivalActiveDeckIds,
      uiText,
      variantLabel
    } = options;
    const {
      controlNote,
      drawCount,
      drawCountField,
      drawCountLabel,
      fixedPools,
      primaryDeckField,
      primaryDeckLabel,
      secondaryDeckField,
      secondaryDeckLabel
    } = elements;

    function normalizeSurvivalAllocation(state) {
      for (const key of Object.keys(state.counts)) {
        state.counts[key] = Math.max(0, Math.min(12, state.counts[key]));
      }
    }

    function survivalNumberControl(key, label, value, min, max) {
      const deckId = {
        items: "items",
        roles: "roles",
        creatures: "creatures",
        aliens: "summons:異族",
        powers: "summons:超能",
        specialists: "summons:特職"
      }[key];
      return window.DebateVisionDeckOptions.amountCard({
        key,
        label,
        value,
        min,
        max,
        deckId,
        tone: deckTone(deckId),
        cover: sharedDeckCover(deckId)
      });
    }

    function metaphorDeckSelectMarkup(part, label, value) {
      return `
        <label class="metaphor-deck-select">
          <span>${label}</span>
          <select data-metaphor-deck="${part}">
            ${metaphorDeckOptions(part).map((deckId) => `
              <option value="${deckId}" ${deckId === value ? "selected" : ""}>${decks[deckId].label}</option>
            `).join("")}
          </select>
        </label>
      `;
    }

    function metaphorLockMarkup(part, label) {
      const metaphor = getMetaphorState();
      if (metaphor.variant === "concrete" && (part === "prefix" || part === "relation")) {
        return `
          <label class="environment-lock-toggle is-disabled">
            <input type="checkbox" data-lock-metaphor="${part}" checked disabled />
            <span>${label}</span>
          </label>
        `;
      }
      const card = metaphor.currentCards?.[part];
      const expectedDeck = part === "prefix"
        ? metaphor.prefixDeck
        : part === "suffix"
          ? metaphor.suffixDeck
          : getActiveSecondaryLibrary();
      const canLock = Boolean(card) && (!expectedDeck || card.deckId === expectedDeck);
      const locked = Boolean(metaphor.locks[part] && canLock);
      return `
        <label class="environment-lock-toggle ${canLock ? "" : "is-disabled"}">
          <input type="checkbox" data-lock-metaphor="${part}" ${locked ? "checked" : ""} ${canLock ? "" : "disabled"} />
          <span>${label}</span>
        </label>
      `;
    }

    function render() {
      const mode = getActiveMode();
      const activeLibrary = getActiveLibrary();
      const activeSecondaryLibrary = getActiveSecondaryLibrary();
      const importanceSelection = getImportanceSelection();
      const metaphor = getMetaphorState();
      const sales = getSalesState();
      const summonSelection = getSummonSelection();
      const survival = getSurvivalState();

      primaryDeckField.hidden = true;
      secondaryDeckField.hidden = true;
      if (mode.cardMode === "salesPitch") ensureSalesAudienceDeck();

      primaryDeckLabel.textContent = mode.primaryLabel || "主要詞庫";
      secondaryDeckLabel.textContent = mode.secondaryLabel || "第二詞庫";

      const survivalBattleMode = mode.cardMode === "itemEnvironment" && survival.variant === "battle";
      const survivalMode = mode.cardMode === "itemEnvironment";
      const metaphorMode = mode.cardMode === "metaphorCompass";
      const salesMode = mode.cardMode === "salesPitch";
      drawCountField.hidden = metaphorMode;
      drawCountField.classList.remove("is-ghost-control");
      drawCountField.setAttribute("aria-hidden", "false");
      controlNote.hidden = false;
      controlNote.textContent = modeStatusText();
      const fixed = mode.fixedCount;
      if (survivalBattleMode) {
        drawCountLabel.textContent = "隊伍數";
        drawCount.min = "1";
        drawCount.max = "8";
        drawCount.value = survival.groupCount;
        drawCount.disabled = false;
      } else {
        drawCountLabel.textContent = uiText("label.drawCount");
        drawCount.min = "1";
        drawCount.max = "6";
        drawCount.value = fixed || Math.min(Math.max(Number(drawCount.value) || 1, 1), 6);
        drawCount.disabled = Boolean(fixed);
      }

      const primaryTotal = cardsFrom(activeLibrary).length;
      let primaryText = `${decks[activeLibrary]?.label || mode.primaryLabel}：${selectedCount(activeLibrary)} / ${primaryTotal} 張可抽`;
      let secondaryText = activeSecondaryLibrary
        ? mode.cardMode === "salesPitch"
          ? `${mode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
          : `${mode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：固定抽 1 張，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
        : "";
      if (mode.cardMode === "importanceDuel") {
        const activeDeckIds = importanceActiveDeckIds();
        const totalSelected = activeDeckIds.reduce((sum, deckId) => sum + selectedCount(deckId), 0);
        const totalCards = activeDeckIds.reduce((sum, deckId) => sum + cardsFrom(deckId).length, 0);
        primaryText = `已選 ${activeDeckIds.length} 個牌組：${totalSelected} / ${totalCards} 張可抽`;
        secondaryText = "";
      }
      if (mode.cardMode === "metaphorCompass") {
        if (metaphor.variant === "concrete") {
          primaryText = "前綴：人生（固定）";
          secondaryText = "介係：就像（固定）";
        } else {
          primaryText = `前綴：${decks[metaphor.prefixDeck]?.label || ""}，${selectedCount(metaphor.prefixDeck)} / ${cardsFrom(metaphor.prefixDeck).length} 張可抽`;
          secondaryText = `介係：${decks[activeSecondaryLibrary]?.label || ""}，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`;
        }
      }
      if (survivalBattleMode) {
        primaryText = `道具卡：${selectedCount("items")} / ${cardsFrom("items").length} 張可抽`;
      } else if (survivalMode) {
        const activeDeckIds = survivalActiveDeckIds();
        const totalSelected = activeDeckIds.reduce((sum, deckId) => sum + selectedCount(deckId), 0);
        const totalCards = activeDeckIds.reduce((sum, deckId) => sum + cardsFrom(deckId).length, 0);
        primaryText = `已選 ${activeDeckIds.map((deckId) => variantLabel(deckId)).join("、")}：${totalSelected} / ${totalCards} 張可抽`;
      }
      if (salesMode) {
        primaryText = `商品卡：${selectedCount("items")} / ${cardsFrom("items").length} 張可抽`;
        if (sales.variant === "supply") {
          secondaryText = `需求卡：固定抽 1 張，${selectedCount("needs")} / ${cardsFrom("needs").length} 張可抽`;
        } else if (sales.variant === "story") {
          secondaryText = sales.noConcept
            ? "概念卡：本輪不抽概念"
            : `概念卡：固定抽 1 張，${selectedCount("concepts")} / ${cardsFrom("concepts").length} 張可抽`;
        } else {
          const audienceCards = selectedSalesAudienceCards();
          const total = sales.audienceDeck === "summons"
            ? cardsFrom("summons").filter((card) => summonSelection.has(card.rarity || "")).length
            : cardsFrom(sales.audienceDeck).length;
          secondaryText = `${decks[sales.audienceDeck]?.label || "客戶卡"}：固定抽 1 張，${audienceCards.length} / ${total} 張可抽`;
        }
      }

      const suffixText = mode.cardMode === "metaphorCompass"
        ? `後綴：${decks[metaphor.suffixDeck]?.label || ""}，${selectedCount(metaphor.suffixDeck)} / ${cardsFrom(metaphor.suffixDeck).length} 張可抽`
        : "";
      const survivalRoleText = survivalBattleMode
        ? `職業卡：${selectedCount("roles")} / ${cardsFrom("roles").length} 張可抽`
        : "";
      const survivalCreatureText = survivalBattleMode
        ? `動物卡：${selectedCount("creatures")} / ${cardsFrom("creatures").length} 張可抽`
        : "";
      const survivalSummonText = survivalBattleMode
        ? `召喚卡：${selectedCount("summons")} / ${cardsFrom("summons").length} 張可抽`
        : "";
      const survivalVariantTools = mode.cardMode === "itemEnvironment"
        ? `
          <div class="sales-variant-tools is-survival-variant" role="group" aria-label="異境求生版本">
            <button type="button" class="${survival.variant === "survival" ? "is-active" : ""}" data-survival-variant="survival">
              <strong>求生版</strong>
              <span>${uiText("mobile.itemSurvival.survivalDescription")}</span>
            </button>
            <button type="button" class="${survival.variant === "battle" ? "is-active" : ""}" data-survival-variant="battle">
              <strong>冒險版</strong>
              <span>${uiText("mobile.itemSurvival.battleDescription")}</span>
            </button>
          </div>
        `
        : "";

      normalizeSurvivalAllocation(survival);
      const survivalBattleTools = survivalBattleMode
        ? `
          <div class="survival-battle-tools" role="group" aria-label="冒險版設定">
            <div class="survival-battle-row is-resources">
              ${survivalNumberControl("items", "道具", survival.counts.items, 0, 12)}
              ${survivalNumberControl("roles", "職業", survival.counts.roles, 0, 12)}
              ${survivalNumberControl("creatures", "動物", survival.counts.creatures, 0, 12)}
              ${survivalNumberControl("aliens", "異族", survival.counts.aliens, 0, 12)}
              ${survivalNumberControl("powers", "超能", survival.counts.powers, 0, 12)}
              ${survivalNumberControl("specialists", "特職", survival.counts.specialists, 0, 12)}
            </div>
          </div>
        `
        : "";
      const salesTools = salesMode
        ? `
          <div class="sales-variant-tools is-sales-variant" role="group" aria-label="銷售密令抽法">
            <button type="button" class="${sales.variant === "supply" ? "is-active" : ""}" data-sales-variant="supply">供需版</button>
            <button type="button" class="${sales.variant === "story" ? "is-active" : ""}" data-sales-variant="story">故事版</button>
            <button type="button" class="${sales.variant === "target" ? "is-active" : ""}" data-sales-variant="target">目標版</button>
          </div>
          ${sales.variant === "story" ? `
            <label class="environment-lock-toggle">
              <input type="checkbox" data-sales-no-concept ${sales.noConcept ? "checked" : ""} />
              <span>無概念</span>
            </label>
          ` : ""}
          ${sales.variant === "target" ? window.DebateVisionDeckOptions.selectGroup(salesAudienceDeckIds().map((deckId) => ({
            deckId,
            label: deckId === "summons" ? "異族" : variantLabel(deckId),
            selected: sales.audienceDeck === deckId,
            tone: deckTone(deckId),
            cover: sharedDeckCover(deckId)
          })), {
            attribute: "data-sales-audience",
            ariaLabel: "目標版客戶類型"
          }) : ""}
        `
        : "";
      const summonCategoryTools = mode.cardMode === "summonMission"
        ? window.DebateVisionDeckOptions.selectGroup(summonCategories.map((category) => ({
          deckId: `summons:${category}`,
          value: category,
          label: summonCategoryLabel(category),
          selected: summonSelection.has(category),
          tone: deckTone("summons"),
          cover: sharedDeckCover(`summons:${category}`)
        })), {
          attribute: "data-summon-category",
          ariaLabel: "現實召喚分類"
        })
        : "";
      const primaryVariantDecks = primaryVariantDeckIds();
      const primaryVariantTools = primaryVariantDecks.length && !survivalBattleMode
        ? window.DebateVisionDeckOptions.selectGroup(primaryVariantDecks.map((deckId) => ({
          deckId,
          label: variantLabel(deckId),
          selected: mode.cardMode === "importanceDuel"
            ? importanceSelection.has(deckId)
            : survivalMode
              ? survival.deckSelection.has(deckId)
              : activeLibrary === deckId,
          tone: deckTone(deckId),
          cover: sharedDeckCover(deckId)
        })), {
          attribute: "data-primary-variant",
          ariaLabel: `${mode.title}抽選類型`
        })
        : "";
      const environmentLockTool = survivalMode && survival.variant === "survival"
        ? `
          <label class="environment-lock-toggle">
            <input type="checkbox" data-lock-environment ${survival.lockEnvironment ? "checked" : ""} ${survival.noEnvironment ? "disabled" : ""} />
            <span>鎖定異境</span>
          </label>
          <label class="environment-lock-toggle">
            <input type="checkbox" data-no-environment ${survival.noEnvironment ? "checked" : ""} />
            <span>無異境</span>
          </label>
        `
        : "";
      const metaphorTool = metaphorMode
        ? `
          <div class="metaphor-variant-tools" role="group" aria-label="隱喻羅盤版本">
            ${["concrete", "abstract", "free"].map((variant) => `
              <button type="button" class="${metaphor.variant === variant ? "is-active" : ""}" data-metaphor-variant="${variant}">
                ${metaphorVariantLabel(variant)}
              </button>
            `).join("")}
          </div>
          <div class="metaphor-deck-tools" role="group" aria-label="隱喻羅盤詞庫選擇">
            ${metaphor.variant === "concrete"
              ? `<span class="metaphor-fixed-text">人生 就像</span>`
              : metaphorDeckSelectMarkup("prefix", "前綴", metaphor.prefixDeck)}
            ${metaphorDeckSelectMarkup("suffix", "後綴", metaphor.suffixDeck)}
          </div>
          <div class="metaphor-lock-tools" role="group" aria-label="隱喻羅盤鎖定">
            ${metaphorLockMarkup("prefix", "鎖定前綴")}
            ${metaphorLockMarkup("relation", "鎖定介係")}
            ${metaphorLockMarkup("suffix", "鎖定後綴")}
          </div>
        `
        : "";
      const poolSummary = `
        <span class="pool-summary-chip">${primaryText}</span>
        ${secondaryText ? `<span class="pool-summary-chip">${secondaryText}</span>` : ""}
        ${survivalRoleText ? `<span class="pool-summary-chip">${survivalRoleText}</span>` : ""}
        ${survivalCreatureText ? `<span class="pool-summary-chip">${survivalCreatureText}</span>` : ""}
        ${survivalSummonText ? `<span class="pool-summary-chip">${survivalSummonText}</span>` : ""}
        ${suffixText ? `<span class="pool-summary-chip">${suffixText}</span>` : ""}
      `;

      fixedPools.classList.toggle("is-survival-controls", survivalMode);
      fixedPools.innerHTML = metaphorMode
        ? `${metaphorTool}${poolSummary}`
        : survivalMode
          ? `
            <div class="survival-control-row">
              ${survivalVariantTools}
              ${survivalBattleMode ? survivalBattleTools : `${primaryVariantTools}${environmentLockTool}`}
            </div>
            <div class="survival-pool-summary">${poolSummary}</div>
          `
          : `
            ${poolSummary}
            ${survivalVariantTools}
            ${primaryVariantTools}
            ${environmentLockTool}
            ${survivalBattleTools}
            ${salesTools}
            ${summonCategoryTools}
          `;
    }

    return Object.freeze({ render });
  }

  window.DebateVisionDeckControls = Object.freeze({ create });
})();
