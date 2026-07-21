(() => {
  function create({ container, historyService, cardLabel }) {
    function roundTitle(roundNumber) {
      return `第${roundNumber}場`;
    }

    function render(scope) {
      if (!container) return;
      const entries = historyService.entries(scope);
      if (!entries.length) {
        container.innerHTML = `<div class="history-empty">抽卡後會在這裡保留最近十場紀錄。</div>`;
        return;
      }

      container.innerHTML = entries.map((entry, index) => {
        const roundNumber = Number(entry.roundNumber) || entries.length - index;
        return `
          <article class="history-item" data-history-index="${index}" role="button" tabindex="0" aria-label="查看${roundTitle(roundNumber)}紀錄">
            <div class="history-item-head">
              <strong>${roundTitle(roundNumber)}</strong>
              ${entry.variant ? `<span>${entry.variant}</span>` : ""}
            </div>
            <div class="history-card-list">
              ${entry.cards.map((card) => `<span>${cardLabel(card)}</span>`).join("")}
            </div>
          </article>
        `;
      }).join("");
    }

    function activate(item) {
      if (!container || !item) return;
      container.querySelectorAll(".history-item.is-active").forEach((activeItem) => {
        activeItem.classList.remove("is-active");
      });
      item.classList.add("is-active");
    }

    return Object.freeze({ activate, render });
  }

  window.DebateVisionHistory = Object.freeze({ create });
})();
