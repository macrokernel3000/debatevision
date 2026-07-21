(() => {
  const groupSections = [
    ["items", "道具"],
    ["roles", "職業"],
    ["creatures", "動物"],
    ["aliens", "異族"],
    ["powers", "超能"],
    ["specialists", "特職"]
  ];

  function groupMarkup(group, cardMarkup, showControls) {
    const activeSections = groupSections.filter(([key]) => group[key].length);
    const members = activeSections.flatMap(([key]) => group[key]);
    const summary = activeSections.map(([key, label]) => `${label} ${group[key].length}`).join(" · ");
    return `
      <section class="survival-group-card" aria-label="第 ${group.index} 組，共 ${members.length} 張隊伍卡">
        <div class="survival-group-head">
          <div class="survival-group-title">
            <span class="survival-group-index">${group.index}</span>
            <div>
              <strong>第 ${group.index} 組</strong>
              <small>${members.length} 張隊伍卡</small>
            </div>
          </div>
          <div class="survival-group-actions">
            <span>${summary || "尚未配置隊伍卡"}</span>
            ${showControls ? `
              <button type="button" data-mobile-reroll-group="${group.id}" aria-label="重新抽取第 ${group.index} 組">
                <b>更改編隊</b>
                <small>重新抽取這一隊</small>
              </button>
            ` : ""}
          </div>
        </div>
        ${members.length ? `
          <div class="survival-mini-list">
            ${members.map((card) => cardMarkup(card, "survival-member-card")).join("")}
          </div>
        ` : `<div class="survival-group-empty">請先為這一組設定隊伍卡。</div>`}
      </section>
    `;
  }

  function render({ environment, groups, cardMarkup, locks, showControls = false }) {
    return `
      <div class="survival-battle-board">
        <div class="mobile-stage-lane">
          ${cardMarkup(environment, "environment-card mobile-stage-banner", showControls ? {
            resultControl: {
              key: "environment",
              locked: locks?.environment || false,
              title: "異境"
            }
          } : {})}
        </div>
        <div class="survival-group-grid">
          ${groups.map((group) => groupMarkup(group, cardMarkup, showControls)).join("")}
        </div>
      </div>
    `;
  }

  window.DebateVisionSurvivalBattleView = Object.freeze({ render });
})();
