(() => {
  function create({ container, historyService, cardLabel }) {
    function roundTitle(roundNumber) {
      return `第${roundNumber}場`;
    }

    function render(scope) {
      if (!container) return;
      const entries = historyService.entries(scope);
      const pinnedEntries = historyService.pinnedEntries(scope);
      const entryMarkup = (entry, index, { pinned = false } = {}) => {
        const roundNumber = Number(entry.roundNumber) || entries.length - index;
        return `
          <article class="history-item${pinned ? " is-pinned" : ""}" ${pinned ? `data-pinned-history-index="${index}"` : `data-history-index="${index}"`} role="button" tabindex="0" aria-label="查看${roundTitle(roundNumber)}紀錄">
            <div class="history-item-head">
              <strong>${roundTitle(roundNumber)}</strong>
              <div class="history-item-meta">
                ${entry.variant ? `<span>${entry.variant}</span>` : ""}
                ${pinned ? `<button class="history-pin is-selected" type="button" data-pinned-unpin-index="${index}" aria-label="取消釘選${roundTitle(roundNumber)}" title="取消釘選">📌</button>` : `<button class="history-pin${historyService.isPinned(scope, entry) ? " is-selected" : ""}" type="button" data-history-pin-index="${index}" aria-label="${historyService.isPinned(scope, entry) ? "取消釘選" : "釘選"}${roundTitle(roundNumber)}" title="${historyService.isPinned(scope, entry) ? "取消釘選" : "釘選"}">📌</button>`}
              </div>
            </div>
            <div class="history-card-list">
              ${entry.cards.map((card) => `<span>${cardLabel(card)}</span>`).join("")}
            </div>
          </article>
        `;
      };

      container.innerHTML = `
        <div class="history-toolbar">
          <button type="button" data-history-export>匯出目前活動紀錄</button>
        </div>
        <div class="history-column history-recent-column">
          <div class="history-column-head"><h3>最近 20 場</h3><span>${entries.length} / 20</span></div>
          <div class="history-list">
            ${entries.length ? entries.map((entry, index) => entryMarkup(entry, index)).join("") : `<div class="history-empty">抽卡後會在這裡保留最近 20 場紀錄。</div>`}
          </div>
        </div>
        <div class="history-column history-pinned-column">
          <div class="history-column-head"><h3>釘選紀錄</h3><span>${pinnedEntries.length} / ${historyService.pinnedLimit}</span></div>
          <div class="history-list">
            ${pinnedEntries.length ? pinnedEntries.map((entry, index) => entryMarkup(entry, index, { pinned: true })).join("") : `<div class="history-empty">按下左側紀錄的 📌，重要組合會固定在這裡。</div>`}
          </div>
        </div>
      `;
      container.querySelector("[data-history-export]")?.addEventListener("click", () => {
        const data = historyService.exportScope(scope);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `debatevision-${scope}-history.json`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      });
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
