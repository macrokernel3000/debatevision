(() => {
  const panel = document.querySelector("#debateBoardPanel");
  if (!panel) return;

  const storageKey = "debatevision:debate-board";
  const defaults = {
    proCount: 3,
    conCount: 3,
    hideNames: false,
    proClosing: 0,
    conClosing: 0,
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
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        ...defaults,
        ...stored,
        proCount: stored.proCount ?? stored.speakerCount ?? defaults.proCount,
        conCount: stored.conCount ?? stored.speakerCount ?? defaults.conCount
      };
    } catch {
      return { ...defaults };
    }
  }

  const state = loadState();
  state.proCount = Math.min(5, Math.max(1, Number(state.proCount) || 3));
  state.conCount = Math.min(5, Math.max(1, Number(state.conCount) || 3));
  state.hideNames = Boolean(state.hideNames);
  state.proClosing = Math.min(state.proCount, Math.max(0, Number(state.proClosing) || 0));
  state.conClosing = Math.min(state.conCount, Math.max(0, Number(state.conClosing) || 0));
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

  function speakerInput([key, label, side, number]) {
    const isClosing = Number(state[`${side}Closing`]) === number;
    return `
      <div class="debate-speaker-entry">
        <label class="debate-speaker-name"><span>${label}</span><input type="text" data-debate-field="${key}" value="${escapeAttribute(state[key])}" maxlength="12" autocomplete="off" /></label>
        <label class="debate-closing-choice"><input type="checkbox" data-closing-side="${side}" data-closing-number="${number}"${isClosing ? " checked" : ""} /><span>標記結辯</span></label>
      </div>
    `;
  }

  function activeSpeakerFields(side) {
    const count = side === "pro" ? state.proCount : state.conCount;
    return speakerFields.filter(([, , fieldSide, number]) => fieldSide === side && number <= count);
  }

  function speakerColumn(side, number) {
    const chineseNumber = ["", "一", "二", "三", "四", "五"][number];
    const closingMark = Number(state[`${side}Closing`]) === number ? '<em class="debate-closing-mark" aria-label="結辯">結</em>' : "";
    return `<div class="debate-speaker is-${side}" data-speaker="${side}${number}"><b>${chineseNumber}辯</b>${closingMark}<strong></strong></div>`;
  }

  function renderStructure() {
    const nameInputs = panel.querySelector(".debate-name-inputs");
    nameInputs.innerHTML = `
      <section><h3>正方辯士</h3><div>${activeSpeakerFields("pro").map(speakerInput).join("")}</div></section>
      <section><h3>反方辯士</h3><div>${activeSpeakerFields("con").map(speakerInput).join("")}</div></section>
    `;

    const blackboard = panel.querySelector(".debate-blackboard");
    blackboard.className = `debate-blackboard${state.hideNames ? " hide-names" : ""}`;
    blackboard.style.gridTemplateColumns = `repeat(${state.proCount + 1}, 1fr) 1.35fr repeat(${state.conCount + 1}, 1fr)`;
    blackboard.style.minWidth = `${500 + (state.proCount + state.conCount) * 55}px`;
    const proColumns = Array.from({ length: state.proCount }, (_, index) => speakerColumn("pro", state.proCount - index)).join("");
    const conColumns = Array.from({ length: state.conCount }, (_, index) => speakerColumn("con", index + 1)).join("");
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
        <p>正反方可各選一至五位辯士，也能只顯示席位、不填姓名。</p>
      </div>
      <div class="debate-format-picker" aria-label="辯論人數制度">
        <label><span>正方人數</span><select data-side-count="pro">${[1, 2, 3, 4, 5].map((count) => `<option value="${count}"${state.proCount === count ? " selected" : ""}>${count} 位</option>`).join("")}</select></label>
        <label><span>反方人數</span><select data-side-count="con">${[1, 2, 3, 4, 5].map((count) => `<option value="${count}"${state.conCount === count ? " selected" : ""}>${count} 位</option>`).join("")}</select></label>
        <label class="debate-hide-names"><input type="checkbox" data-hide-names${state.hideNames ? " checked" : ""} /><span>不顯示名稱</span></label>
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
    panel.classList.toggle("hide-debate-names", state.hideNames);
    panel.querySelector(".debate-team-inputs").hidden = state.hideNames;
    panel.querySelector('[data-team="proTeam"]').textContent = state.proTeam || "隊伍名稱";
    panel.querySelector('[data-team="conTeam"]').textContent = state.conTeam || "隊伍名稱";
    for (const [key, label, side, number] of speakerFields) {
      const sideCount = side === "pro" ? state.proCount : state.conCount;
      if (number > sideCount) continue;
      panel.querySelector(`[data-speaker="${key}"] strong`).textContent = state[key] || label;
    }
  }

  panel.addEventListener("change", (event) => {
    const sideSelect = event.target.closest("[data-side-count]");
    const hideNames = event.target.closest("[data-hide-names]");
    const closing = event.target.closest("[data-closing-side]");
    if (!sideSelect && !hideNames && !closing) return;
    if (sideSelect) {
      const side = sideSelect.dataset.sideCount;
      state[`${side}Count`] = Number(sideSelect.value);
      if (state[`${side}Closing`] > state[`${side}Count`]) state[`${side}Closing`] = 0;
    }
    if (hideNames) state.hideNames = hideNames.checked;
    if (closing) {
      const key = `${closing.dataset.closingSide}Closing`;
      state[key] = closing.checked ? Number(closing.dataset.closingNumber) : 0;
    }
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
