(() => {
  function create(options) {
    const {
      cardKey,
      getConfig,
      markDrawn,
      rememberDraw,
      renderBattle,
      renderSurvival,
      renderUi,
      service,
      state
    } = options;

    function resetLocks() {
      state.locks = { environment: false, cards: new Set() };
      state.notice = "";
    }

    function clear() {
      state.kind = "";
      state.environment = null;
      state.cards = [];
      state.groups = [];
      resetLocks();
    }

    function render() {
      if (state.kind === "survival") {
        renderSurvival(state.environment, state.cards, state.locks);
      }
      if (state.kind === "battle") {
        renderBattle(state.environment, state.groups, state.locks);
      }
    }

    function startSurvival(environment, cards) {
      clear();
      state.kind = "survival";
      state.environment = environment;
      state.cards = cards;
      render();
    }

    function startBattle(environment, groups) {
      clear();
      state.kind = "battle";
      state.environment = environment;
      state.groups = groups;
      render();
    }

    function toggleLock(key) {
      if (!state.kind) return;
      if (key === "environment") {
        state.locks.environment = !state.locks.environment;
      } else if (state.locks.cards.has(key)) {
        state.locks.cards.delete(key);
      } else {
        state.locks.cards.add(key);
      }
      state.notice = "";
      render();
      renderUi();
    }

    function exchange() {
      if (state.kind !== "survival") return false;
      const config = getConfig();
      const result = service.exchangeSurvival({
        activeDeckIds: config.activeDeckIds,
        cards: state.cards,
        environment: state.environment,
        locks: state.locks,
        noEnvironment: config.noEnvironment,
        worldDeckId: config.worldDeckId
      });
      if (!result.ok) {
        state.notice = result.message;
        renderUi();
        return false;
      }
      state.environment = result.environment;
      state.cards = result.cards;
      state.notice = "未鎖定的資源已完成交換。";
      markDrawn(result.drawn);
      render();
      rememberDraw([state.environment, ...state.cards].filter(Boolean));
      renderUi();
      return true;
    }

    function rerollGroup(groupId) {
      if (state.kind !== "battle") return false;
      const config = getConfig();
      const result = service.rerollGroup({
        counts: config.counts,
        environment: state.environment,
        groupId,
        groups: state.groups
      });
      if (!result.ok) {
        state.notice = result.message;
        renderUi();
        return false;
      }
      state.groups = result.groups;
      state.notice = `第 ${groupId} 組已重新編隊。`;
      markDrawn(result.drawn);
      render();
      rememberDraw([state.environment, ...service.allGroupCards(state.groups)].filter(Boolean));
      renderUi();
      return true;
    }

    function isCardLocked(card) {
      return state.locks.cards.has(cardKey(card));
    }

    return Object.freeze({
      clear,
      exchange,
      isCardLocked,
      render,
      rerollGroup,
      startBattle,
      startSurvival,
      toggleLock
    });
  }

  window.DebateVisionSurvivalResultController = Object.freeze({ create });
})();
