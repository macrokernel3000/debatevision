(() => {
  function create(options) {
    const {
      cardMarkup,
      cardsFrom,
      clearButton,
      container,
      decks,
      dictionaryHooks,
      drawButton,
      normalizeCard,
      orderedDeckIds,
      resultContainer,
      tokenIconMarkup,
      uiText
    } = options;

    const selectedDecks = new Set();
    const selectedCards = new Set();
    let activeDeck = "";

    function description(deckId) {
      const descriptions = {
        worlds: "特殊的世界觀，適合發揮想像力，需要臨機應變與危機判斷。",
        creatures: "我們的好朋友或者小生命，適合比較特色、建立觀察角度與討論生命關係。",
        items: "具體可操作的道具與物件，適合練用途發想、銷售包裝與生存策略。",
        roles: "不同身份與職業，適合練自我辯護、價值比較與團隊分工。",
        locations: "各種可能所在位置，適合推理、提問、排除法與情境觀察。",
        celebrities: "不同文化、領域與時代的真實人物，適合比較影響力與建立判準。",
        needs: "人們心中的需求與動機，適合銷售、心理洞察與價值連結。",
        concepts: "抽象概念與價值詞，適合隱喻、定義、哲學思考與概念辯護。",
        relations: "連接兩個詞的關係詞，適合造句、隱喻羅盤與因果比較。",
        missions: "現實世界中的具體任務，適合練策略設計、可行性檢查與風險回應。",
        summons: "被召喚出的角色與身份，適合把特殊能力轉成現實方案並接受質疑。"
      };
      return descriptions[deckId] || `${decks[deckId]?.label || deckId} 詞庫，可用來自行組合臨時活動。`;
    }

    function cardKey(deckId, cardName) {
      return `${deckId}::${cardName}`;
    }

    function normalize(raw, deckId) {
      return {
        ...normalizeCard(raw, deckId),
        hooks: dictionaryHooks({ name: raw.name })
      };
    }

    function cardFromKey(key) {
      const [deckId, ...nameParts] = String(key).split("::");
      const name = nameParts.join("::");
      const rawCard = cardsFrom(deckId).find((card) => card.name === name);
      return rawCard ? normalize(rawCard, deckId) : null;
    }

    function selectedCardList() {
      return [...selectedCards].map(cardFromKey).filter(Boolean);
    }

    function ensureActiveDeck() {
      const available = [...selectedDecks].filter((deckId) => decks[deckId]);
      if (!available.includes(activeDeck)) activeDeck = available[0] || "";
      return available;
    }

    function deckMarkup(deckId) {
      const deck = decks[deckId];
      const checked = selectedDecks.has(deckId);
      const selectedInDeck = [...selectedCards].filter((key) => key.startsWith(`${deckId}::`)).length;
      return `
        <label class="dictionary-card ${checked ? "is-selected" : ""}">
          <input type="checkbox" data-dictionary-deck="${deckId}" ${checked ? "checked" : ""} />
          <span class="dictionary-icon">${deck.icon || "□"}</span>
          <span class="dictionary-copy">
            <strong>${deck.label}</strong>
            <span>${selectedInDeck ? `已選 ${selectedInDeck} 張 / ` : ""}${deck.cards.length} 張卡</span>
            <small>${description(deckId)}</small>
          </span>
        </label>
      `;
    }

    function tokenMarkup(card) {
      const key = cardKey(card.deckId, card.name);
      const checked = selectedCards.has(key);
      return `
        <label class="token dictionary-token ${checked ? "" : "is-disabled"}">
          <input type="checkbox" data-dictionary-card-key="${key}" ${checked ? "checked" : ""} />
          <span class="token-label">${tokenIconMarkup(card)}<span>${card.name}</span></span>
        </label>
      `;
    }

    function render() {
      if (!container) return;
      const available = ensureActiveDeck();
      const chosenCards = selectedCardList();
      const activeCards = activeDeck
        ? cardsFrom(activeDeck).map((card) => normalize(card, activeDeck))
        : [];

      container.innerHTML = `
        <div class="dictionary-layout">
          <div class="dictionary-decks" aria-label="卡片類型">
            ${orderedDeckIds().map(deckMarkup).join("")}
          </div>
          <div class="dictionary-workbench">
            <div class="dictionary-tabs" aria-label="已啟用卡池">
              ${available.length
                ? available.map((deckId) => `
                  <button type="button" class="${deckId === activeDeck ? "is-active" : ""}" data-dictionary-preview="${deckId}">
                    ${decks[deckId].label}
                  </button>
                `).join("")
                : `<span>${uiText("mobile.dictionary.deckHeading")}</span>`}
            </div>
            <div class="dictionary-card-picker">
              ${activeDeck
                ? activeCards.map(tokenMarkup).join("")
                : `<div class="dictionary-empty compact">${uiText("mobile.dictionary.emptyPicker")}</div>`}
            </div>
            <div class="dictionary-tray">
              <div class="dictionary-tray-head">
                <strong>${uiText("mobile.dictionary.selectedHeading")}</strong>
                <span>${chosenCards.length} 張</span>
              </div>
              <div class="dictionary-selected-list">
                ${chosenCards.length
                  ? chosenCards.map((card) => `
                    <button type="button" data-remove-dictionary-card="${cardKey(card.deckId, card.name)}">
                      ${tokenIconMarkup(card)}<span>${card.deckLabel}：${card.name}</span><strong>×</strong>
                    </button>
                  `).join("")
                  : `<span class="dictionary-selected-empty">${uiText("mobile.dictionary.selectedEmpty")}</span>`}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function renderResult(cards = [], saved = false) {
      if (!resultContainer) return;
      if (!cards.length) {
        resultContainer.innerHTML = `<div class="dictionary-empty">請先在上方勾選卡片類型，並選出本場要使用的卡。</div>`;
        return;
      }
      resultContainer.innerHTML = `
        <div class="dictionary-result-head">
          <strong>${saved ? "已儲存本場" : "本場組合"}</strong>
          <span>${cards.map((card) => card.deckLabel).join(" × ")}</span>
        </div>
        <div class="dictionary-result-grid">
          ${cards.map((card) => cardMarkup(card, "dictionary-drawn-card")).join("")}
        </div>
      `;
    }

    container?.addEventListener("change", (event) => {
      const deckCheckbox = event.target.closest("[data-dictionary-deck]");
      if (deckCheckbox) {
        const deckId = deckCheckbox.dataset.dictionaryDeck;
        if (deckCheckbox.checked) {
          selectedDecks.add(deckId);
          activeDeck = deckId;
        } else {
          selectedDecks.delete(deckId);
          for (const key of [...selectedCards]) {
            if (key.startsWith(`${deckId}::`)) selectedCards.delete(key);
          }
        }
        render();
        return;
      }

      const cardCheckbox = event.target.closest("[data-dictionary-card-key]");
      if (!cardCheckbox) return;
      if (cardCheckbox.checked) selectedCards.add(cardCheckbox.dataset.dictionaryCardKey);
      else selectedCards.delete(cardCheckbox.dataset.dictionaryCardKey);
      render();
    });

    container?.addEventListener("click", (event) => {
      const preview = event.target.closest("[data-dictionary-preview]");
      if (preview) {
        activeDeck = preview.dataset.dictionaryPreview;
        render();
        return;
      }
      const remove = event.target.closest("[data-remove-dictionary-card]");
      if (!remove) return;
      selectedCards.delete(remove.dataset.removeDictionaryCard);
      render();
    });

    drawButton?.addEventListener("click", () => renderResult(selectedCardList(), true));
    clearButton?.addEventListener("click", () => {
      selectedDecks.clear();
      selectedCards.clear();
      activeDeck = "";
      render();
      renderResult([]);
    });

    return Object.freeze({ render, renderResult, selectedCards: selectedCardList });
  }

  window.DebateVisionCardDictionary = Object.freeze({ create });
})();
