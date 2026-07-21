(() => {
  function create({ cardKey, tokenIconMarkup, uiText }) {
    function placeOptions({ answerCard, places, revealed }) {
      return places.map((place, index) => {
        const isAnswer = answerCard && cardKey(place) === cardKey(answerCard);
        const stateClass = revealed && isAnswer ? "is-correct" : "";
        const stateText = revealed && isAnswer ? `<span>${uiText("secret.correct")}</span>` : "";
        return `
          <button class="secret-place-option ${stateClass}" data-card-key="${cardKey(place)}" type="button">
            <b class="secret-place-number">${index + 1}</b>
            ${tokenIconMarkup(place)}
            <strong>${place.name}</strong>
            ${stateText}
          </button>
        `;
      }).join("");
    }

    function revealed({ card, places }) {
      return `
        <div class="secret-board is-revealed">
          <div class="secret-banner">
            <p class="eyebrow">${uiText("secret.result.eyebrow")}</p>
            <h2>${uiText("secret.result.title", { name: card.name })}</h2>
            <p>${uiText("secret.result.body")}</p>
            <button class="reveal-action restart-action" data-restart-secret type="button">${uiText("secret.restart")}</button>
          </div>
          <div class="secret-place-options">
            ${placeOptions({ answerCard: card, places, revealed: true })}
          </div>
        </div>
      `;
    }

    function setup({
      answerCard,
      deckLabel,
      hasValidAnswer,
      places,
      secretAnswerIndex,
      secretShowAnswerNumber,
      statusText
    }) {
      const total = places.length;
      return `
        <div class="secret-board">
          <div class="secret-banner">
            <p class="eyebrow">${uiText("secret.setup.eyebrow")}</p>
            <h2>${uiText("secret.setup.title")}</h2>
            <p>${uiText("secret.setup.body", { total, deckLabel })}</p>
            <div class="secret-teacher-panel">
              <label class="secret-answer-field">
                <span>${uiText("secret.answer.label")}</span>
                <input
                  id="secretAnswerIndex"
                  type="${secretShowAnswerNumber ? "text" : "password"}"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  max="${total}"
                  value="${secretAnswerIndex}"
                  placeholder="1-${total || 0}"
                  autocomplete="off"
                />
              </label>
              <label class="secret-show-toggle">
                <input id="secretShowAnswerNumber" type="checkbox" ${secretShowAnswerNumber ? "checked" : ""} />
                <span>${uiText("secret.showNumber")}</span>
              </label>
              <p class="secret-answer-status" id="secretAnswerStatus">${statusText}</p>
            </div>
            <button class="reveal-action" data-reveal-secret type="button" ${hasValidAnswer ? "" : "disabled"}>${uiText("secret.reveal")}</button>
          </div>
          <div class="secret-place-options">
            ${placeOptions({ answerCard, places, revealed: false })}
          </div>
        </div>
      `;
    }

    return Object.freeze({ revealed, setup });
  }

  window.DebateVisionSecretPlaceView = Object.freeze({ create });
})();
