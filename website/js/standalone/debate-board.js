(() => {
  const panel = document.querySelector("#debateBoardPanel");
  if (!panel) return;

  const storageKey = "debatevision:debate-board";
  const defaults = {
    speakerCount: 3,
    topic: "本院認為，人工智慧的發展對教育利大於弊",
    proTeam: "正方隊伍",
    conTeam: "反方隊伍",
    pro1: "正方一辯",
    pro2: "正方二辯",
    pro3: "正方三辯",
    pro4: "正方四辯",
    pro5: "正方五辯",
    con1: "反方一辯",
    con2: "反方二辯",
    con3: "反方三辯",
    con4: "反方四辯",
    con5: "反方五辯"
  };

  function loadState() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  const state = loadState();
  state.speakerCount = Math.min(5, Math.max(3, Number(state.speakerCount) || 3));
  const speakerFields = [
    ["pro1", "正方一辯", "pro", 1], ["pro2", "正方二辯", "pro", 2], ["pro3", "正方三辯", "pro", 3],
    ["pro4", "正方四辯", "pro", 4], ["pro5", "正方五辯", "pro", 5],
    ["con1", "反方一辯", "con", 1], ["con2", "反方二辯", "con", 2], ["con3", "反方三辯", "con", 3],
    ["con4", "反方四辯", "con", 4], ["con5", "反方五辯", "con", 5]
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

  function activeSpeakerFields(side) {
    return speakerFields.filter(([, , fieldSide, number]) => fieldSide === side && number <= state.speakerCount);
  }

  function speakerColumn(side, number) {
    const chineseNumber = ["", "一", "二", "三", "四", "五"][number];
    return `<div class="debate-speaker is-${side}" data-speaker="${side}${number}"><b>${chineseNumber}辯</b><strong></strong></div>`;
  }

  function renderStructure() {
    const nameInputs = panel.querySelector(".debate-name-inputs");
    nameInputs.style.setProperty("--speaker-count", state.speakerCount);
    nameInputs.innerHTML = `
      ${activeSpeakerFields("pro").map(speakerInput).join("")}
      <i class="debate-name-divider" aria-hidden="true"></i>
      ${activeSpeakerFields("con").map(speakerInput).join("")}
    `;

    const blackboard = panel.querySelector(".debate-blackboard");
    blackboard.className = `debate-blackboard has-${state.speakerCount}-speakers`;
    const proColumns = Array.from({ length: state.speakerCount }, (_, index) => speakerColumn("pro", state.speakerCount - index)).join("");
    const conColumns = Array.from({ length: state.speakerCount }, (_, index) => speakerColumn("con", index + 1)).join("");
    blackboard.innerHTML = `
      ${proColumns}
      <div class="debate-team is-pro"><b>隊伍</b><strong data-team="proTeam"></strong></div>
      <div class="debate-topic"><small>辯題</small><strong class="debate-topic-copy"></strong></div>
      <div class="debate-team is-con"><b>隊伍</b><strong data-team="conTeam"></strong></div>
      ${conColumns}
    `;
  }

  function renderTopic() {
    const topic = state.topic || "請輸入辯題";
    const characters = Array.from(topic.replaceAll("\n", ""));
    const chunks = [];
    while (characters.length) chunks.push(characters.splice(0, 9).join(""));
    const topicCopy = panel.querySelector(".debate-topic-copy");
    topicCopy.replaceChildren(...chunks.map((chunk, index) => {
      const column = document.createElement("span");
      column.className = index === 0 ? "is-first" : "is-following";
      column.textContent = chunk;
      return column;
    }));
  }

  panel.innerHTML = `
    <div class="debate-board-editor">
      <div class="debate-board-editor-head">
        <div><p class="eyebrow">Debate Blackboard</p><h2>辯論黑板</h2></div>
        <p>可切換三至五人制，隊伍靠近辯題，辯士依序向外排列。</p>
      </div>
      <div class="debate-format-picker" role="group" aria-label="辯論人數制度">
        <span>辯論制度</span>
        ${[3, 4, 5].map((count) => `<button type="button" data-speaker-count="${count}" aria-pressed="${state.speakerCount === count}">${count} 人制</button>`).join("")}
      </div>
      <label class="debate-topic-input"><span>本場辯題</span><textarea data-debate-field="topic" rows="2" maxlength="80">${escapeAttribute(state.topic)}</textarea></label>
      <div class="debate-team-inputs">
        <label><span>正方隊伍名稱</span><input type="text" data-debate-field="proTeam" value="${escapeAttribute(state.proTeam)}" maxlength="12" /></label>
        <label><span>反方隊伍名稱</span><input type="text" data-debate-field="conTeam" value="${escapeAttribute(state.conTeam)}" maxlength="12" /></label>
      </div>
      <div class="debate-name-inputs"></div>
    </div>
    <div class="debate-board-scroll" tabindex="0" aria-label="辯論座位黑板預覽">
      <div class="debate-blackboard"></div>
    </div>
  `;

  function render() {
    renderTopic();
    panel.querySelector('[data-team="proTeam"]').textContent = state.proTeam || "隊伍名稱";
    panel.querySelector('[data-team="conTeam"]').textContent = state.conTeam || "隊伍名稱";
    for (const [key, label, , number] of speakerFields) {
      if (number > state.speakerCount) continue;
      panel.querySelector(`[data-speaker="${key}"] strong`).textContent = state[key] || label;
    }
  }

  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speaker-count]");
    if (!button) return;
    state.speakerCount = Number(button.dataset.speakerCount);
    panel.querySelectorAll("[data-speaker-count]").forEach((option) => {
      option.setAttribute("aria-pressed", String(Number(option.dataset.speakerCount) === state.speakerCount));
    });
    localStorage.setItem(storageKey, JSON.stringify(state));
    renderStructure();
    render();
  });

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

  renderStructure();
  render();
  window.DEBATE_BOARD = Object.freeze({ setActive });
})();
