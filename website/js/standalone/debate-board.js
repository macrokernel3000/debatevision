(() => {
  const panel = document.querySelector("#debateBoardPanel");
  if (!panel) return;

  const storageKey = "debatevision:debate-board";
  const defaults = {
    topic: "本院認為，人工智慧的發展對教育利大於弊",
    proTeam: "正方隊伍",
    conTeam: "反方隊伍",
    pro1: "正方一辯",
    pro2: "正方二辯",
    pro3: "正方三辯",
    con1: "反方一辯",
    con2: "反方二辯",
    con3: "反方三辯"
  };

  function loadState() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  const state = loadState();
  const speakerFields = [
    ["pro1", "正方一辯"], ["pro2", "正方二辯"], ["pro3", "正方三辯"],
    ["con1", "反方一辯"], ["con2", "反方二辯"], ["con3", "反方三辯"]
  ];

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function speakerInput([key, label]) {
    return `<label><span>${label}</span><input type="text" data-debate-field="${key}" value="${escapeAttribute(state[key])}" maxlength="12" /></label>`;
  }

  panel.innerHTML = `
    <div class="debate-board-editor">
      <div class="debate-board-editor-head">
        <div><p class="eyebrow">Debate Blackboard</p><h2>辯論黑板</h2></div>
        <p>一辯靠近辯題，二、三辯依序向外排列。</p>
      </div>
      <label class="debate-topic-input"><span>本場辯題</span><textarea data-debate-field="topic" rows="2" maxlength="80">${escapeAttribute(state.topic)}</textarea></label>
      <div class="debate-team-inputs">
        <label><span>正方隊伍名稱</span><input type="text" data-debate-field="proTeam" value="${escapeAttribute(state.proTeam)}" maxlength="12" /></label>
        <label><span>反方隊伍名稱</span><input type="text" data-debate-field="conTeam" value="${escapeAttribute(state.conTeam)}" maxlength="12" /></label>
      </div>
      <div class="debate-name-inputs">${speakerFields.map(speakerInput).join("")}</div>
    </div>
    <div class="debate-board-scroll" tabindex="0" aria-label="辯論座位黑板預覽">
      <div class="debate-blackboard">
        <div class="debate-speaker is-pro" data-speaker="pro3"><b>三辯</b><strong></strong></div>
        <div class="debate-speaker is-pro" data-speaker="pro2"><b>二辯</b><strong></strong></div>
        <div class="debate-speaker is-pro" data-speaker="pro1"><b>一辯</b><strong></strong></div>
        <div class="debate-team is-pro"><b>隊伍</b><strong data-team="proTeam"></strong></div>
        <div class="debate-topic"><small>辯題</small><strong></strong></div>
        <div class="debate-team is-con"><b>隊伍</b><strong data-team="conTeam"></strong></div>
        <div class="debate-speaker is-con" data-speaker="con1"><b>一辯</b><strong></strong></div>
        <div class="debate-speaker is-con" data-speaker="con2"><b>二辯</b><strong></strong></div>
        <div class="debate-speaker is-con" data-speaker="con3"><b>三辯</b><strong></strong></div>
      </div>
    </div>
  `;

  function render() {
    panel.querySelector(".debate-topic strong").textContent = state.topic || "請輸入辯題";
    panel.querySelector('[data-team="proTeam"]').textContent = state.proTeam || "隊伍名稱";
    panel.querySelector('[data-team="conTeam"]').textContent = state.conTeam || "隊伍名稱";
    for (const [key, label] of speakerFields) {
      panel.querySelector(`[data-speaker="${key}"] strong`).textContent = state[key] || label;
    }
  }

  panel.addEventListener("input", (event) => {
    const input = event.target.closest("[data-debate-field]");
    if (!input) return;
    state[input.dataset.debateField] = input.value.trimStart();
    localStorage.setItem(storageKey, JSON.stringify(state));
    render();
  });

  function setActive(active) {
    panel.hidden = !active;
    if (active) render();
  }

  render();
  window.DEBATE_BOARD = Object.freeze({ setActive });
})();
