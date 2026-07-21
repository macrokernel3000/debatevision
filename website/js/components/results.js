(() => {
  function create({ cardKey, container, cardMarkup }) {
    function empty(message) {
      container.innerHTML = `<div class="empty-state">${message}</div>`;
    }

    function cards(cardsToRender) {
      container.innerHTML = `<div class="combo-results">${cardsToRender.map((card) => cardMarkup(card)).join("")}</div>`;
    }

    function combo(stage, cardsToRender, options = {}) {
      const showStageInResults = !options.hideStageInResults;
      const showStageInDesktopResults = showStageInResults && !options.hideStageInDesktopResults;
      const desktopStage = stage && showStageInDesktopResults
        ? cardMarkup(stage, "environment-card mobile-stage-result", options.stageCardOptions)
        : "";
      const mobileStage = stage && showStageInResults
        ? cardMarkup(stage, "environment-card mobile-stage-banner", options.stageCardOptions)
        : "";
      container.innerHTML = `
        <div class="combo-board">
          <div class="mobile-stage-lane">${mobileStage}</div>
          <div class="combo-results">
            ${desktopStage}
            ${cardsToRender.map((card) => cardMarkup(card, "", options.cardOptions?.(card))).join("")}
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
            title: "異境"
          }
        } : {},
        cardOptions: (card) => ({
          resultControl: {
            key: cardKey(card),
            locked: locks.cards.has(cardKey(card)),
            title: card.deckLabel || "資源卡"
          }
        })
      });
    }

    function duel(cardsToRender) {
      container.innerHTML = `
        <div class="duel-board">
          ${cardMarkup(cardsToRender[0])}
          <div class="vs-badge">VS</div>
          ${cardMarkup(cardsToRender[1])}
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
            ${cardMarkup(left)}
            ${cardMarkup(relation, "relation-card")}
            ${cardMarkup(right)}
          </div>
        </div>
      `;
    }

    return Object.freeze({ cards, combo, duel, empty, metaphor, survival });
  }

  window.DebateVisionResults = Object.freeze({ create });
})();
