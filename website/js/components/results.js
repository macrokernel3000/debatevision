(() => {
  function create({ cardKey, container, cardMarkup, resultControlFor }) {
    const control = (card, slot, title = "卡牌") => ({
      resultControl: resultControlFor?.(card, slot, title)
    });
    function empty(message) {
      container.innerHTML = `<div class="empty-state">${message}</div>`;
    }

    function cards(cardsToRender) {
      container.innerHTML = `<div class="combo-results">${cardsToRender.map((card, index) => cardMarkup(card, "", control(card, `card-${index}`, card.deckLabel))).join("")}</div>`;
    }

    function combo(stage, cardsToRender, options = {}) {
      const showStageInResults = !options.hideStageInResults;
      const showStageInDesktopResults = showStageInResults && !options.hideStageInDesktopResults;
      const desktopStage = stage && showStageInDesktopResults
        ? cardMarkup(stage, "environment-card mobile-stage-result", options.stageCardOptions || control(stage, "stage", stage.deckLabel))
        : "";
      const mobileStage = stage && showStageInResults
        ? cardMarkup(stage, "environment-card mobile-stage-banner", options.stageCardOptions || control(stage, "stage", stage.deckLabel))
        : "";
      container.innerHTML = `
        <div class="combo-board">
          <div class="mobile-stage-lane">${mobileStage}</div>
          <div class="combo-results">
            ${desktopStage}
            ${cardsToRender.map((card, index) => cardMarkup(card, "", options.cardOptions?.(card) || control(card, `card-${index}`, card.deckLabel))).join("")}
          </div>
        </div>
      `;
    }

    function survival(stage, cardsToRender, locks) {
      combo(stage, cardsToRender, {
        hideStageInDesktopResults: true,
        stageCardOptions: stage ? {
          resultControl: {
            key: "environment",
            locked: locks.environment,
            title: "異境",
            desktopCompact: true
          }
        } : {},
        cardOptions: (card) => ({
          resultControl: {
            key: cardKey(card),
            locked: locks.cards.has(cardKey(card)),
            title: card.deckLabel || "資源卡",
            desktopCompact: true
          }
        })
      });
    }

    function duel(cardsToRender) {
      container.innerHTML = `
        <div class="duel-board">
          ${cardMarkup(cardsToRender[0], "", control(cardsToRender[0], "red", "紅角"))}
          <div class="vs-badge">VS</div>
          ${cardMarkup(cardsToRender[1], "", control(cardsToRender[1], "blue", "藍角"))}
        </div>
      `;
    }

    function metaphor({ left, relation, right, guideTitle, guideBody }) {
      container.innerHTML = `
        <div class="metaphor-board">
          <article class="metaphor-sentence">
            <span>${left.name}</span>
            <strong>${relation.name}</strong>
            <span>${right.name}</span>
          </article>
          <div class="metaphor-guide">
            <p>${guideTitle}</p>
            <p>${guideBody}</p>
          </div>
          <div class="metaphor-cards">
            ${cardMarkup(left, "", control(left, "prefix", "前綴"))}
            ${cardMarkup(relation, "relation-card", control(relation, "relation", "介係"))}
            ${cardMarkup(right, "", control(right, "suffix", "後綴"))}
          </div>
        </div>
      `;
    }

    function salesPair({ leftLabel, leftCards, rightLabel, rightCard, variant }) {
      container.innerHTML = `
        <div class="sales-result-board" data-sales-variant="${variant}">
          <section class="sales-result-slot is-product">
            <p class="sales-result-label">${leftLabel}</p>
            <div class="sales-result-cards">
              ${leftCards.map((card, index) => cardMarkup(card, "", control(card, `product-${index}`, "我的產品"))).join("")}
            </div>
          </section>
          <div class="sales-result-link" aria-hidden="true">→</div>
          <section class="sales-result-slot is-challenge">
            <p class="sales-result-label">${rightLabel}</p>
            <div class="sales-result-cards">
              ${cardMarkup(rightCard, "", control(rightCard, "challenge", rightLabel))}
            </div>
          </section>
        </div>
      `;
    }

    return Object.freeze({ cards, combo, duel, empty, metaphor, salesPair, survival });
  }

  window.DebateVisionResults = Object.freeze({ create });
})();
