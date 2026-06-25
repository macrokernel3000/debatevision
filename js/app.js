const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const { iconFor } = window;

let activeMode = modes[0];
let activeLibrary = activeMode.primaryDeck;
let activeSecondaryLibrary = activeMode.secondaryDeck || "";
let activePreview = activeMode.primaryDeck;
let isDrawing = false;
let lastSecretCard = null;

const gameNav = document.querySelector("#gameNav");
const menuButton = document.querySelector("#menuButton");
const modeGrid = document.querySelector("#modeGrid");
const deckSelect = document.querySelector("#deckSelect");
const secondaryDeckSelect = document.querySelector("#secondaryDeckSelect");
const secondaryDeckField = document.querySelector("#secondaryDeckField");
const primaryDeckLabel = document.querySelector("#primaryDeckLabel");
const secondaryDeckLabel = document.querySelector("#secondaryDeckLabel");
const drawCount = document.querySelector("#drawCount");
const drawButton = document.querySelector("#drawButton");
const reel = document.querySelector("#reel");
const cardGrid = document.querySelector("#cardGrid");
const promptList = document.querySelector("#promptList");
const roundFlow = document.querySelector("#roundFlow");
const libraryTools = document.querySelector("#libraryTools");
const tokenCloud = document.querySelector("#tokenCloud");
const scenePreview = document.querySelector("#scenePreview");
const sceneEmblem = document.querySelector("#sceneEmblem");
const sceneBadge = document.querySelector("#sceneBadge");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneDescription = document.querySelector("#sceneDescription");
const activityTitle = document.querySelector("#activityTitle");
const activityLead = document.querySelector("#activityLead");
const controlNote = document.querySelector("#controlNote");

function normalizeCard(raw, deckId) {
  const card = typeof raw === "object" ? raw : { name: raw[0], lore: raw[1] };
  return {
    ...card,
    deckId,
    deckLabel: decks[deckId].label,
    deckIcon: decks[deckId].icon,
    hooks: buildHooks(card.name, deckId)
  };
}

function buildHooks(name, deckId) {
  if (deckId === "items") {
    return [`提出 ${name} 的一個用途。`, `說明 ${name} 的限制與補救。`, "比較它和另一件物品誰更有價值。"];
  }
  if (deckId === "jobs") {
    return ["說明這個身份的不可替代價值。", "主動承認一個弱點並化解。", "用一句話說服觀眾留下你。"];
  }
  if (deckId === "environments") {
    return ["說明這個環境最關鍵的限制。", "列出學生可以追問的線索。", "思考哪些資源在這裡會變得重要。"];
  }
  return ["把特性連回當前玩法。", "回答一個尖銳質疑。", "提出最終投票標準。"];
}

function cardsFrom(deckId) {
  return (decks[deckId]?.cards || []).map((card) => normalizeCard(card, deckId));
}

function pickFrom(deckId, count) {
  const pool = [...cardsFrom(deckId)];
  const selected = [];
  while (selected.length < count && pool.length) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return selected;
}

function deckOptions(selectedDeck) {
  return Object.entries(decks).map(([id, deck]) => `
    <option value="${id}" ${id === selectedDeck ? "selected" : ""}>${deck.label}</option>
  `).join("");
}

function renderModeButtons() {
  const markup = modes.map((mode) => `
    <button class="mode-card ${mode.id === activeMode.id ? "is-active" : ""}" data-mode="${mode.id}" data-tone="${mode.tone}" type="button">
      <span class="mode-card-top">
        <span class="mode-icon">${mode.icon}</span>
        <span class="mode-track">${mode.track}</span>
      </span>
      <span class="mode-card-body">
        <strong>${mode.title}</strong>
        <span>${mode.primaryLabel}${mode.secondaryLabel ? " + " + mode.secondaryLabel : ""}</span>
      </span>
    </button>
  `).join("");

  modeGrid.innerHTML = markup;
  gameNav.innerHTML = modes.map((mode) => `
    <button class="nav-item ${mode.id === activeMode.id ? "is-active" : ""}" data-mode="${mode.id}" type="button">
      <span>${mode.icon}</span>
      ${mode.title}
    </button>
  `).join("");
}

function renderActivity() {
  activityTitle.textContent = activeMode.title;
  activityLead.textContent = activeMode.description;
  scenePreview.dataset.tone = activeMode.tone;
  sceneEmblem.textContent = activeMode.icon;
  sceneBadge.textContent = activeMode.track;
  sceneTitle.textContent = activeMode.title;
  sceneDescription.textContent = activeMode.description;
  drawButton.textContent = activeMode.drawLabel;
  controlNote.textContent = activeMode.cardMode === "secretPlace"
    ? "此玩法會秘密抽出環境；老師往下滑後再公布答案。"
    : "詞庫來自 CSV；改完後雙擊更新詞庫即可同步。";
}

function renderDeckControls() {
  primaryDeckLabel.textContent = activeMode.primaryLabel || "主要詞庫";
  deckSelect.innerHTML = deckOptions(activeLibrary);

  const hasSecondary = Boolean(activeMode.secondaryDeck);
  secondaryDeckField.hidden = !hasSecondary;
  if (hasSecondary) {
    secondaryDeckLabel.textContent = activeMode.secondaryLabel || "第二詞庫";
    secondaryDeckSelect.innerHTML = deckOptions(activeSecondaryLibrary);
  }

  const fixed = activeMode.fixedCount;
  drawCount.value = fixed || Math.min(Math.max(Number(drawCount.value) || 1, 1), 6);
  drawCount.disabled = Boolean(fixed);
}

function renderPrompts() {
  promptList.innerHTML = activeMode.prompts.map(([title, body]) => `
    <div class="prompt-item"><strong>${title}</strong><span>${body}</span></div>
  `).join("");
  roundFlow.innerHTML = activeMode.flow.map((item) => `<li>${item}</li>`).join("");
}

function renderLibraryTools() {
  libraryTools.innerHTML = Object.entries(decks).map(([id, deck]) => `
    <button class="filter-chip ${id === activePreview ? "is-active" : ""}" data-preview="${id}" type="button">${deck.label}</button>
  `).join("");
}

function renderTokenCloud() {
  const deck = decks[activePreview];
  tokenCloud.innerHTML = deck.cards.map((card) => {
    const normalized = normalizeCard(card, activePreview);
    return `<span class="token">${iconFor(normalized)} ${normalized.name}</span>`;
  }).join("");
}

function cardMarkup(card, extraClass = "") {
  const imageMarkup = card.image
    ? `<img src="${card.image}" alt="${card.name} 卡圖" />`
    : `<span>${iconFor(card)}</span>`;

  return `
    <article class="battle-card ${extraClass}" data-rarity="${card.rarity || "普通"}">
      <div class="card-title">
        <h3>${card.name}</h3>
        <span class="card-type">${card.deckLabel}</span>
      </div>
      <div class="card-art">${imageMarkup}</div>
      <p class="card-lore">${card.lore}</p>
      <ul class="card-hooks">${card.hooks.map((hook) => `<li>${hook}</li>`).join("")}</ul>
    </article>
  `;
}

function renderEmptyState() {
  cardGrid.innerHTML = `<div class="empty-state">${activeMode.drawLabel}。<br />這個平台的核心是 CSV 詞庫，詞彙越多，玩法就越多。</div>`;
}

function renderCombo(environment, cards, label) {
  cardGrid.innerHTML = `
    <div class="combo-board">
      <div class="combo-environment">
        <p class="eyebrow">${label}</p>
        ${cardMarkup(environment, "environment-card")}
      </div>
      <div class="combo-results">
        ${cards.map((card) => cardMarkup(card)).join("")}
      </div>
    </div>
  `;
}

function renderDuel(cards) {
  cardGrid.innerHTML = `
    <div class="duel-board">
      ${cardMarkup(cards[0])}
      <div class="vs-badge">VS</div>
      ${cardMarkup(cards[1])}
    </div>
  `;
}

function renderSecretPlace(card, revealed = false) {
  if (revealed) {
    cardGrid.innerHTML = `
      <div class="secret-board is-revealed">
        <div class="secret-banner">
          <p class="eyebrow">答案公布</p>
          <h2>原來我們在：${card.name}</h2>
        </div>
        ${cardMarkup(card, "environment-card")}
      </div>
    `;
    return;
  }

  cardGrid.innerHTML = `
    <div class="secret-board">
      <div class="secret-banner">
        <p class="eyebrow">已經抽出場景</p>
        <h2>答案先不要讓學生看到</h2>
        <p>學生可以問：這裡有水嗎？這裡是室內嗎？這裡危險來自人還是自然？</p>
      </div>
      <div class="question-grid">
        ${[
          "這裡有水嗎？",
          "這裡很熱或很冷嗎？",
          "這裡是室內嗎？",
          "這裡能找到食物嗎？",
          "這裡有人類建築嗎？",
          "這裡最大的危險會移動嗎？",
          "我們需要照明嗎？",
          "這裡容易迷路嗎？"
        ].map((question) => `<span>${question}</span>`).join("")}
      </div>
      <button class="reveal-action" id="revealButton" type="button">往下滑後公布答案</button>
    </div>
  `;

  document.querySelector("#revealButton").addEventListener("click", () => renderSecretPlace(card, true), { once: true });
}

function drawResult() {
  const count = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1));

  if (activeMode.cardMode === "itemEnvironment") {
    const environment = pickFrom(activeSecondaryLibrary, 1)[0];
    const cards = pickFrom(activeLibrary, count);
    renderCombo(environment, cards, "本輪環境");
    return [environment, ...cards];
  }

  if (activeMode.cardMode === "roleEnvironment") {
    const environment = pickFrom(activeSecondaryLibrary, 1)[0];
    const cards = pickFrom(activeLibrary, count);
    renderCombo(environment, cards, "留席戰場");
    return [environment, ...cards];
  }

  if (activeMode.cardMode === "importanceDuel") {
    const cards = pickFrom(activeLibrary, 2);
    renderDuel(cards);
    return cards;
  }

  if (activeMode.cardMode === "secretPlace") {
    lastSecretCard = pickFrom(activeLibrary, 1)[0];
    renderSecretPlace(lastSecretCard, false);
    return [lastSecretCard];
  }

  const cards = pickFrom(activeLibrary, count);
  cardGrid.innerHTML = cards.map((card) => cardMarkup(card)).join("");
  return cards;
}

function spinDraw() {
  if (isDrawing) return;

  isDrawing = true;
  drawButton.disabled = true;
  reel.classList.add("is-spinning");

  const reelPool = [
    ...cardsFromSafe(activeLibrary),
    ...cardsFromSafe(activeSecondaryLibrary)
  ];
  const reelText = reel.querySelector(".reel-text");
  const reelIcon = reel.querySelector(".reel-icon");

  const spinTimer = window.setInterval(() => {
    const card = reelPool[Math.floor(Math.random() * reelPool.length)];
    reelText.textContent = card.name;
    reelIcon.textContent = iconFor(card);
  }, 80);

  window.setTimeout(() => {
    window.clearInterval(spinTimer);
    const selected = drawResult();
    const first = selected[0];
    reelText.textContent = activeMode.cardMode === "secretPlace" ? "場景已抽出" : first.name;
    reelIcon.textContent = activeMode.icon;
    reel.classList.remove("is-spinning");
    isDrawing = false;
    drawButton.disabled = false;
  }, 1000);
}

function cardsFromSafe(deckId) {
  return deckId ? cardsFrom(deckId) : [];
}

function setMode(modeId) {
  activeMode = modes.find((mode) => mode.id === modeId) || activeMode;
  activeLibrary = activeMode.primaryDeck;
  activeSecondaryLibrary = activeMode.secondaryDeck || "";
  activePreview = activeMode.primaryDeck;
  lastSecretCard = null;
  renderAll();
  renderEmptyState();
}

function renderAll() {
  renderModeButtons();
  renderActivity();
  renderDeckControls();
  renderPrompts();
  renderLibraryTools();
  renderTokenCloud();
}

function handleModeClick(event) {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  setMode(button.dataset.mode);
  gameNav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
}

menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  gameNav.classList.toggle("is-open", !expanded);
});

modeGrid.addEventListener("click", handleModeClick);
gameNav.addEventListener("click", handleModeClick);

deckSelect.addEventListener("change", (event) => {
  activeLibrary = event.target.value;
  activePreview = activeLibrary;
  renderLibraryTools();
  renderTokenCloud();
});

secondaryDeckSelect.addEventListener("change", (event) => {
  activeSecondaryLibrary = event.target.value;
});

drawButton.addEventListener("click", spinDraw);

libraryTools.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-preview]");
  if (!chip) return;
  activePreview = chip.dataset.preview;
  renderLibraryTools();
  renderTokenCloud();
});

renderAll();
renderEmptyState();
