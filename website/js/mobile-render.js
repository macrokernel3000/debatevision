(() => {
  function mobileText(key, fallback, vars = {}) {
    let value = window.DEBATE_UI_TEXTS?.[key] || fallback;
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, replacement);
    }
    return value;
  }

  function deckCard(deck, options) {
    const toggleAttr = options.toggleAttr;
    const toggleValue = deck.toggleValue || deck.deckId;
    const toggleEnabled = options.toggleEnabled ?? true;
    const tone = options.deckTone?.(deck.deckId) || "default";
    const amountControl = options.showAmount
      ? `
        <div class="mobile-mini-stepper" data-mobile-resource="${deck.deckId}">
          <button type="button" data-mobile-resource-step="${deck.deckId}" data-step="-1">−</button>
          <b aria-label="${deck.title}每組抽取數量">${deck.amount}</b>
          <button type="button" data-mobile-resource-step="${deck.deckId}" data-step="1">＋</button>
        </div>
      `
      : "";
    if (options.compactAmount) {
      const cover = deck.cover || {};
      return `
        <article class="mobile-deck-card is-compact-amount ${deck.amount > 0 ? "is-active" : ""}" data-mobile-deck="${deck.deckId}" data-deck-tone="${tone}">
          <button class="mobile-deck-visual" type="button" data-mobile-edit-deck="${deck.deckId}" aria-label="${mobileText("mobile.common.editPrefix", "編輯")}${deck.title}">
            <span class="mobile-deck-visual-art ${cover.isDeckCover ? "is-cover-art" : ""}">
              ${cover.image ? `<img src="${cover.image}" alt="" aria-hidden="true" />` : `<span aria-hidden="true">${cover.symbol || "□"}</span>`}
            </span>
            <strong>${deck.title}</strong>
          </button>
          ${amountControl}
        </article>
      `;
    }
    if (options.compactSelect) {
      const toggleState = toggleEnabled ? "" : "disabled aria-disabled=\"true\"";
      const cover = deck.cover || {};
      const toggleLabel = options.singleSelect
        ? `${deck.selected ? "目前選擇：" : "選擇"}${deck.title}`
        : `${deck.selected ? "取消" : "選擇"}${deck.title}`;
      return `
        <article class="mobile-deck-card is-compact-select ${deck.selected ? "is-active" : ""}" data-mobile-deck="${deck.deckId}" data-deck-tone="${tone}">
          <button class="mobile-deck-toggle" type="button" ${toggleAttr}="${toggleValue}" ${toggleState} aria-label="${toggleLabel}" aria-pressed="${deck.selected ? "true" : "false"}">
            ${deck.selected ? "✓" : ""}
          </button>
          <button class="mobile-deck-visual" type="button" data-mobile-edit-deck="${deck.deckId}" aria-label="${mobileText("mobile.common.editPrefix", "編輯")}${deck.title}">
            <span class="mobile-deck-visual-art ${cover.isDeckCover ? "is-cover-art" : ""}">
              ${cover.image ? `<img src="${cover.image}" alt="" aria-hidden="true" />` : `<span aria-hidden="true">${cover.symbol || "□"}</span>`}
            </span>
            <strong>${deck.title}</strong>
          </button>
        </article>
      `;
    }
    return `
      <article class="mobile-deck-card ${deck.selected ? "is-active" : ""}" data-mobile-deck="${deck.deckId}" data-deck-tone="${tone}">
        <button class="mobile-deck-toggle" type="button" ${toggleAttr}="${deck.deckId}" ${toggleEnabled ? "" : "aria-hidden=\"true\" tabindex=\"-1\""}>
          ${deck.selected ? "✓" : ""}
        </button>
        <div class="mobile-deck-copy">
          <strong>${deck.title}</strong>
          <span>${deck.subtitle}</span>
          <em>${deck.count} / ${deck.total} 張可抽</em>
        </div>
        ${amountControl}
        <button class="mobile-deck-edit" type="button" data-mobile-edit-deck="${deck.deckId}" aria-label="${mobileText("mobile.common.editPrefix", "編輯")}${deck.title}">✎</button>
      </article>
    `;
  }

  function metaphorDeckGroup(label, decks, state, part, extraClass = "") {
    return `
      <div class="mobile-metaphor-deck-group ${extraClass}">
        <span>${label}</span>
        <div class="mobile-deck-grid mobile-metaphor-side-decks">
          ${decks.map((deck) => deckCard(deck, {
            deckTone: state.deckTone,
            toggleAttr: `data-mobile-metaphor-${part}-deck`,
            toggleEnabled: true,
            compactSelect: true,
            singleSelect: true
          })).join("")}
        </div>
      </div>
    `;
  }

  function metaphorDeckLayout(state) {
    const groups = state.metaphorDecks;
    if (!groups) return "";
    if (groups.concrete) {
      return `
        <div class="mobile-metaphor-deck-layout is-concrete">
          <div class="mobile-metaphor-deck-group is-fixed-prefix">
            <span>固定前綴</span>
            <div class="mobile-metaphor-fixed-phrase" aria-label="固定前綴：人生就像">
              <b>人生</b>
              <strong>就像</strong>
            </div>
          </div>
          ${metaphorDeckGroup("後綴詞", groups.suffix, state, "suffix")}
        </div>
      `;
    }
    return `
      <div class="mobile-metaphor-deck-layout">
        ${metaphorDeckGroup("前綴詞", groups.prefix, state, "prefix")}
        <div class="mobile-metaphor-deck-group is-relation">
          <span>介係詞</span>
          ${deckCard(groups.relation, {
            deckTone: state.deckTone,
            toggleAttr: "data-mobile-metaphor-relation-deck",
            toggleEnabled: false,
            compactSelect: true,
            singleSelect: true
          })}
        </div>
        ${metaphorDeckGroup("後綴詞", groups.suffix, state, "suffix")}
      </div>
    `;
  }

  function variantControls(state) {
    if (state.cardMode === "salesPitch") {
      return `
        <div class="mobile-survival-mode-grid mobile-sales-mode-grid" role="group" aria-label="銷售密令模式">
          <button type="button" class="mobile-survival-mode ${state.salesVariant === "supply" ? "is-active" : ""}" data-mobile-sales-variant="supply">
            <strong>${mobileText("mobile.sales.supplyTitle", "供需版")}</strong>
            <span>${mobileText("mobile.sales.supplyDescription", "把商品賣給有特定需求的客戶")}</span>
          </button>
          <button type="button" class="mobile-survival-mode ${state.salesVariant === "story" ? "is-active" : ""}" data-mobile-sales-variant="story">
            <strong>${mobileText("mobile.sales.storyTitle", "故事版")}</strong>
            <span>${mobileText("mobile.sales.storyDescription", "用概念與故事替商品增加價值")}</span>
          </button>
          <button type="button" class="mobile-survival-mode ${state.salesVariant === "target" ? "is-active" : ""}" data-mobile-sales-variant="target">
            <strong>${mobileText("mobile.sales.targetTitle", "目標版")}</strong>
            <span>${mobileText("mobile.sales.targetDescription", "針對不同對象設計銷售方式")}</span>
          </button>
        </div>
        ${state.salesVariant === "story" ? `
          <label class="mobile-toggle-pill">
            <input type="checkbox" data-mobile-sales-no-concept ${state.salesNoConcept ? "checked" : ""} />
            <span>${mobileText("mobile.sales.noConcept", "無概念")}</span>
          </label>
        ` : ""}
        ${state.salesVariant === "target" ? `
          <div class="mobile-pill-row" role="group" aria-label="目標類型">
            ${state.salesAudienceDeckIds.map((deckId) => `
              <button type="button" class="${state.salesAudienceDeck === deckId ? "is-active" : ""}" data-mobile-sales-audience="${deckId}">
                ${deckId === "summons" ? "異族" : state.variantLabel(deckId)}
              </button>
            `).join("")}
          </div>
        ` : ""}
      `;
    }
    if (state.cardMode === "metaphorCompass") {
      return `
        <div class="mobile-survival-mode-grid mobile-sales-mode-grid" role="group" aria-label="隱喻羅盤版本">
          ${["concrete", "abstract", "free"].map((variant) => `
            <button type="button" class="mobile-survival-mode ${state.metaphorVariant === variant ? "is-active" : ""}" data-mobile-metaphor-variant="${variant}">
              <strong>${variant === "concrete"
                ? mobileText("mobile.metaphor.concrete", state.metaphorVariantLabel(variant))
                : variant === "abstract"
                  ? mobileText("mobile.metaphor.abstract", state.metaphorVariantLabel(variant))
                  : mobileText("mobile.metaphor.free", state.metaphorVariantLabel(variant))}</strong>
              <span>${mobileText(`mobile.metaphor.${variant}Description`, variant === "concrete"
                ? "用「人生就像」連結一個具體事物"
                : variant === "abstract"
                  ? "連結兩個抽象概念並說明關係"
                  : "自由選擇詞庫組合隱喻命題")}</span>
            </button>
          `).join("")}
        </div>
      `;
    }
    return "";
  }

  function genericDashboard(state) {
    const summonMode = state.cardMode === "summonMission";
    const hasModeCards = state.cardMode === "salesPitch" || state.cardMode === "metaphorCompass";
    const missionDeck = summonMode ? state.deckCards.find((deck) => deck.deckId === "missions") : null;
    const summonDecks = summonMode ? state.deckCards.filter((deck) => deck.deckId.startsWith("summons:")) : [];
    return `
      <section class="mobile-game-section ${state.standardDeckUi ? "is-standard-settings" : ""}">
        <div class="mobile-section-head">
          <h2>${summonMode
            ? mobileText("mobile.realitySummon.flowHeading", "玩法流程")
            : hasModeCards
              ? mobileText("mobile.itemSurvival.modeHeading", "選擇模式")
              : mobileText("mobile.common.activitySettings", "活動設定")}</h2>
        </div>
        ${summonMode ? `
          <div class="mobile-summon-guide" aria-label="現實召喚三步驟">
            <div><span>✦</span><b>${mobileText("mobile.realitySummon.step1Title", "召喚次數")}</b><small>${mobileText("mobile.realitySummon.step1Description", "決定角色數")}</small></div>
            <i>›</i>
            <div><span>📜</span><b>${mobileText("mobile.realitySummon.step2Title", "領取任務")}</b><small>${mobileText("mobile.realitySummon.step2Description", "現實挑戰")}</small></div>
            <i>›</i>
            <div><span>💡</span><b>${mobileText("mobile.realitySummon.step3Title", "說明方案")}</b><small>${mobileText("mobile.realitySummon.step3Description", "完成任務")}</small></div>
          </div>
        ` : `
          ${hasModeCards ? "" : `<p class="mobile-rule-line">${state.statusText}</p>`}
          ${variantControls(state)}
        `}
      </section>

      ${state.fixedCount ? "" : `
        <section class="mobile-game-section">
          <div class="mobile-section-head">
            <h2>${state.cardMode === "salesPitch"
              ? mobileText("mobile.sales.count", "商品數量")
              : state.cardMode === "summonMission"
                ? mobileText("mobile.realitySummon.count", "召喚數量")
                : mobileText("mobile.common.drawCount", "抽取數量")}</h2>
            <div class="mobile-stepper" data-mobile-count="draw">
              <button type="button" data-mobile-step="-1">−</button>
              <input type="number" min="1" max="6" value="${state.countValue}" data-mobile-count-input="draw" />
              <button type="button" data-mobile-step="1">＋</button>
            </div>
          </div>
        </section>
      `}

      <section class="mobile-game-section ${state.standardDeckUi ? "is-standard-decks" : ""}">
        <div class="mobile-section-head">
          <h2>${state.cardMode === "importanceDuel"
            ? mobileText("mobile.importance.deckHeading", "選擇卡組")
            : mobileText("mobile.common.roundDecks", "本輪卡組")}</h2>
          <span>${state.cardMode === "importanceDuel"
            ? mobileText("mobile.importance.deckNote", "可複選")
            : summonMode
              ? mobileText("mobile.realitySummon.deckNote", "任務固定・召喚複選")
              : state.cardMode === "metaphorCompass"
                ? state.metaphorVariant === "concrete"
                  ? "固定前綴 × 後綴詞"
                  : "前綴詞 × 介係詞 × 後綴詞"
                : mobileText("mobile.common.fixedCombo", "固定搭配")}</span>
        </div>
        ${summonMode ? `
          <div class="mobile-survival-deck-layout mobile-summon-deck-layout">
            <div class="mobile-pinned-deck">
              <span>${mobileText("mobile.realitySummon.fixedMission", "固定任務")}</span>
              ${deckCard(missionDeck, {
                deckTone: state.deckTone,
                toggleAttr: "data-mobile-summon-fixed",
                toggleEnabled: false,
                compactSelect: true
              })}
            </div>
            <div class="mobile-choice-decks">
              <span>${mobileText("mobile.realitySummon.summonTypes", "召喚類型")}</span>
              <div class="mobile-deck-grid">
                ${summonDecks.map((deck) => deckCard(deck, {
                  deckTone: state.deckTone,
                  toggleAttr: "data-mobile-summon-category",
                  toggleEnabled: true,
                  compactSelect: true
                })).join("")}
              </div>
            </div>
          </div>
        ` : state.cardMode === "metaphorCompass" ? `
          ${metaphorDeckLayout(state)}
        ` : `
          <div class="mobile-deck-grid">
            ${state.deckCards.map((deck) => deckCard(deck, {
              deckTone: state.deckTone,
              toggleAttr: "data-mobile-generic-deck-toggle",
              toggleEnabled: state.cardMode === "importanceDuel",
              compactSelect: true
            })).join("")}
          </div>
        `}
      </section>

      <button class="mobile-start-action" type="button" data-mobile-draw>${state.actionLabel}</button>
    `;
  }

  function survivalDashboard(state) {
    return `
      <section class="mobile-game-section">
        <div class="mobile-section-head">
          <h2>${mobileText("mobile.itemSurvival.modeHeading", "選擇模式")}</h2>
        </div>
        <div class="mobile-survival-mode-grid" role="group" aria-label="異境求生模式">
          <button type="button" class="mobile-survival-mode ${state.survivalModeActive ? "is-active" : ""}" data-mobile-survival-variant="survival">
            <strong>${mobileText("mobile.itemSurvival.survivalTitle", "生存模式")}</strong>
            <span>${mobileText("mobile.itemSurvival.survivalDescription", "抽取求生道具或職業夥伴在異境中求生")}</span>
          </button>
          <button type="button" class="mobile-survival-mode ${!state.survivalModeActive ? "is-active" : ""}" data-mobile-survival-variant="battle">
            <strong>${mobileText("mobile.itemSurvival.battleTitle", "挑戰模式")}</strong>
            <span>${mobileText("mobile.itemSurvival.battleDescription", "選出最適合前往異境的團隊完成探險")}</span>
          </button>
        </div>
      </section>

      <section class="mobile-game-section">
        <div class="mobile-section-head">
          <h2>${state.countLabel}</h2>
          <div class="mobile-stepper" data-mobile-count="${state.survivalModeActive ? "draw" : "groups"}">
            <button type="button" data-mobile-step="-1">−</button>
            <input type="number" min="${state.countMin}" max="${state.countMax}" value="${state.countValue}" data-mobile-count-input="${state.survivalModeActive ? "draw" : "groups"}" />
            <button type="button" data-mobile-step="1">＋</button>
          </div>
        </div>
      </section>

      <section class="mobile-game-section">
        <div class="mobile-section-head">
          <h2>${mobileText("mobile.common.selectDecks", "選擇卡組")}</h2>
          <span>${state.survivalModeActive
            ? mobileText("mobile.common.multiSelect", "可複選")
            : mobileText("mobile.itemSurvival.perGroup", "設定每組數量")}</span>
        </div>
        <div class="mobile-survival-deck-layout">
          <div class="mobile-pinned-deck">
            <span>${mobileText("mobile.itemSurvival.fixedWorld", "固定異境")}</span>
            ${deckCard(state.environmentDeck, {
              deckTone: state.deckTone,
              toggleAttr: "data-mobile-deck-toggle",
              toggleEnabled: false,
              compactSelect: true
            })}
          </div>
          <div class="mobile-choice-decks">
            <span>${state.survivalModeActive
              ? mobileText("mobile.itemSurvival.survivalDecks", "求生卡組")
              : mobileText("mobile.itemSurvival.teamDecks", "隊伍卡組")}</span>
            <div class="mobile-deck-grid">
              ${state.selectedDecks.map((deck) => deckCard(deck, {
                deckTone: state.deckTone,
                toggleAttr: "data-mobile-deck-toggle",
                toggleEnabled: state.survivalModeActive,
                showAmount: !state.survivalModeActive,
                compactAmount: !state.survivalModeActive,
                compactSelect: state.survivalModeActive
              })).join("")}
            </div>
          </div>
        </div>
      </section>

      <button class="mobile-start-action" type="button" data-mobile-draw>${state.actionLabel}</button>
    `;
  }

  function resultActions(state) {
    return state.active
      ? `
        ${state.survivalKind === "survival" ? `
          <button type="button" class="mobile-resource-exchange" data-mobile-resource-exchange>
            <strong>資源交換</strong>
            <span>把未鎖定的卡隨機換成新的</span>
          </button>
        ` : ""}
        ${state.notice ? `<p class="mobile-result-notice" role="status" aria-live="polite">${state.notice}</p>` : ""}
        <button type="button" class="mobile-again-action" data-mobile-again>${state.againLabel}</button>
      `
      : "";
  }

  window.DebateVisionMobileRender = {
    genericDashboard,
    survivalDashboard,
    resultActions
  };
})();
