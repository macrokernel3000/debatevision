(() => {
  function create(options) {
    const {
      cardKey,
      cardsFrom,
      container,
      getActiveDeck,
      getActiveMode,
      getDeckLabel,
      rememberAnswer,
      uiText,
      view
    } = options;
    const state = window.DEBATE_STATE.create({
      lastCard: null,
      revealed: false,
      answerIndex: "",
      showAnswerNumber: false
    });

    function places() {
      return cardsFrom(getActiveDeck());
    }

    function cardFromIndex(indexValue) {
      const cards = places();
      const index = Number(indexValue);
      if (!Number.isInteger(index) || index < 1 || index > cards.length) return null;
      return cards[index - 1];
    }

    function updateAnswerState() {
      const input = container.querySelector("#secretAnswerIndex");
      const status = container.querySelector("#secretAnswerStatus");
      const revealButton = container.querySelector("[data-reveal-secret]");
      if (!input) return;

      state.answerIndex = input.value.replace(/[^\d]/g, "");
      if (input.value !== state.answerIndex) input.value = state.answerIndex;
      state.lastCard = cardFromIndex(state.answerIndex);
      state.revealed = false;

      if (state.lastCard) {
        status.textContent = uiText("secret.status.set");
        revealButton.disabled = false;
        return;
      }

      status.textContent = uiText("secret.status.prompt", { total: places().length || 0 });
      revealButton.disabled = true;
    }

    function bindAnswerControls() {
      const input = container.querySelector("#secretAnswerIndex");
      const showToggle = container.querySelector("#secretShowAnswerNumber");
      if (!input) return;

      input.addEventListener("input", updateAnswerState);
      showToggle?.addEventListener("change", () => {
        state.showAnswerNumber = showToggle.checked;
        input.type = state.showAnswerNumber ? "text" : "password";
        input.focus();
      });
    }

    function bindOptions() {
      const optionList = container.querySelector(".secret-place-options");
      if (!optionList) return;

      optionList.addEventListener("click", (event) => {
        const option = event.target.closest(".secret-place-option");
        if (!option || option.disabled) return;

        if (!state.lastCard) {
          const status = container.querySelector("#secretAnswerStatus");
          if (status) status.textContent = uiText("secret.status.needAnswer");
          return;
        }

        if (option.dataset.cardKey === cardKey(state.lastCard)) {
          render(state.lastCard, true);
          return;
        }

        option.classList.add("is-wrong");
        if (!option.querySelector("span")) {
          option.insertAdjacentHTML("beforeend", `<span>${uiText("secret.wrong")}</span>`);
        }
      });

      container.querySelector("[data-reveal-secret]")?.addEventListener("click", () => {
        updateAnswerState();
        if (state.lastCard) render(state.lastCard, true);
      });
      container.querySelector("[data-restart-secret]")?.addEventListener("click", restart);
    }

    function render(card, revealed = false) {
      state.revealed = revealed;
      const availablePlaces = places();
      if (!revealed) card = cardFromIndex(state.answerIndex);
      state.lastCard = card || null;

      if (revealed && card) {
        rememberAnswer(card);
        container.innerHTML = view.revealed({ card, places: availablePlaces });
        bindOptions();
        return;
      }

      const chosenNumber = Number(state.answerIndex);
      const hasValidAnswer = Number.isInteger(chosenNumber)
        && chosenNumber >= 1
        && chosenNumber <= availablePlaces.length;
      const statusText = hasValidAnswer
        ? uiText("secret.status.set")
        : uiText("secret.status.prompt", { total: availablePlaces.length || 0 });

      container.innerHTML = view.setup({
        answerCard: card,
        deckLabel: getDeckLabel(),
        hasValidAnswer,
        places: availablePlaces,
        secretAnswerIndex: state.answerIndex,
        secretShowAnswerNumber: state.showAnswerNumber,
        statusText
      });
      bindOptions();
      bindAnswerControls();
    }

    function restart() {
      clear();
      render(null, false);
    }

    function clear() {
      state.answerIndex = "";
      state.showAnswerNumber = false;
      state.revealed = false;
      state.lastCard = null;
    }

    function reset() {
      if (getActiveMode().cardMode !== "secretPlace") return;
      clear();
    }

    function refresh() {
      if (getActiveMode().cardMode === "secretPlace") render(state.lastCard, state.revealed);
    }

    return Object.freeze({
      cardFromIndex,
      clear,
      get answerIndex() { return state.answerIndex; },
      get lastCard() { return state.lastCard; },
      set lastCard(value) { state.lastCard = value; },
      refresh,
      render,
      reset,
      get revealed() { return state.revealed; },
      set revealed(value) { state.revealed = value; },
      restart
    });
  }

  window.DebateVisionSecretPlace = Object.freeze({ create });
})();
