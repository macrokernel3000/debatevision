const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const { iconFor } = window;

let activeMode = modes[0];
let activeLibrary = activeMode.primaryDeck;
let activeSecondaryLibrary = activeMode.secondaryDeck || "";
let activePreview = activeMode.secondaryDeck || activeMode.primaryDeck;
let isDrawing = false;
let lastSecretCard = null;
let currentStageCard = null;
let selectedCardKeysByDeck = {};

const gameNav = document.querySelector("#gameNav");
const modeGrid = document.querySelector("#modeGrid");
const deckSelect = document.querySelector("#deckSelect");
const primaryDeckField = document.querySelector("#primaryDeckField");
const secondaryDeckSelect = document.querySelector("#secondaryDeckSelect");
const secondaryDeckField = document.querySelector("#secondaryDeckField");
const primaryDeckLabel = document.querySelector("#primaryDeckLabel");
const secondaryDeckLabel = document.querySelector("#secondaryDeckLabel");
const fixedPools = document.querySelector("#fixedPools");
const drawCount = document.querySelector("#drawCount");
const drawButton = document.querySelector("#drawButton");
const reel = document.querySelector("#reel");
const cardGrid = document.querySelector("#cardGrid");
const promptList = document.querySelector("#promptList");
const roundFlow = document.querySelector("#roundFlow");
const libraryTools = document.querySelector("#libraryTools");
const tokenCloud = document.querySelector("#tokenCloud");
const selectAllCards = document.querySelector("#selectAllCards");
const clearCards = document.querySelector("#clearCards");
const resetActivePool = document.querySelector("#resetActivePool");
const scenePreview = document.querySelector("#scenePreview");
const sceneEmblem = document.querySelector("#sceneEmblem");
const sceneBadge = document.querySelector("#sceneBadge");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneDescription = document.querySelector("#sceneDescription");
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
  if (deckId === "roles") {
    return ["說明這個身份的不可替代價值。", "主動承認一個弱點並化解。", "用一句話說服觀眾留下你。"];
  }
  if (deckId === "worlds" || deckId === "locations") {
    return ["說明這個環境最關鍵的限制。", "列出學生可以追問的線索。", "思考哪些資源在這裡會變得重要。"];
  }
  return ["把特性連回當前玩法。", "回答一個尖銳質疑。", "提出最終投票標準。"];
}

function cardsFrom(deckId) {
  return (decks[deckId]?.cards || []).map((card) => normalizeCard(card, deckId));
}

function cardKey(card) {
  return `${card.deckId}::${card.name}`;
}

function ensureDeckSelection(deckId) {
  if (!deckId || selectedCardKeysByDeck[deckId]) return;
  selectedCardKeysByDeck[deckId] = new Set(cardsFrom(deckId).map((card) => cardKey(card)));
}

function setDeckSelection(deckId, checked) {
  if (!deckId) return;
  selectedCardKeysByDeck[deckId] = new Set(checked ? cardsFrom(deckId).map((card) => cardKey(card)) : []);
}

function selectedCount(deckId) {
  ensureDeckSelection(deckId);
  return selectedCardKeysByDeck[deckId]?.size || 0;
}

function selectedCardsFrom(deckId) {
  ensureDeckSelection(deckId);
  const selectedKeys = selectedCardKeysByDeck[deckId] || new Set();
  return cardsFrom(deckId).filter((card) => selectedKeys.has(cardKey(card)));
}

function resetModeSelections() {
  for (const deckId of [activeMode.secondaryDeck, activeMode.primaryDeck].filter(Boolean)) {
    setDeckSelection(deckId, true);
  }
}

function markDrawn(cards) {
  for (const card of cards) {
    ensureDeckSelection(card.deckId);
    selectedCardKeysByDeck[card.deckId].delete(cardKey(card));
  }
}

function pickFrom(deckId, count) {
  const pool = [...selectedCardsFrom(deckId)];
  const selected = [];
  while (selected.length < count && pool.length) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return selected;
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
  scenePreview.dataset.tone = activeMode.tone;
  const modeImage = activeMode.image || activeMode.backgroundImage || "";
  scenePreview.classList.toggle("has-mode-image", Boolean(modeImage));
  scenePreview.style.setProperty("--mode-image", modeImage ? `url("${modeImage}")` : "none");
  sceneEmblem.textContent = activeMode.icon;
  sceneBadge.textContent = activeMode.track;
  sceneTitle.textContent = activeMode.title;
  sceneDescription.textContent = activeMode.description;
  drawButton.textContent = activeMode.drawLabel;
  controlNote.textContent = activeMode.cardMode === "secretPlace"
    ? "此玩法會秘密抽出場景；老師往下滑後再公布答案。"
    : "牌組已依玩法固定；下方抽選池可取消本局不想抽到的卡。";
}

function sceneImageFor(card) {
  return card?.image || card?.iconAsset || "";
}

function renderReelCard(card = currentStageCard, spinningName = "") {
  const title = spinningName || card?.name || "準備抽卡";
  const subtitle = card?.lore || "抽出後，這裡會顯示本輪異境。未來可直接套用 16:9 場景圖。";
  const image = sceneImageFor(card);
  reel.classList.toggle("has-scene-image", Boolean(image));
  reel.style.setProperty("--scene-image", image ? `url("${image}")` : "none");
  reel.innerHTML = `
    <div class="reel-scene-mark">${card ? activeMode.icon : "?"}</div>
    <div class="reel-scene-copy">
      <span>${activeMode.secondaryLabel || activeMode.track || "Scene Card"}</span>
      <strong>${title}</strong>
      <small>${subtitle}</small>
    </div>
  `;
}

function renderDeckControls() {
  primaryDeckField.hidden = true;
  secondaryDeckField.hidden = true;

  primaryDeckLabel.textContent = activeMode.primaryLabel || "主要詞庫";
  secondaryDeckLabel.textContent = activeMode.secondaryLabel || "第二詞庫";

  const fixed = activeMode.fixedCount;
  drawCount.value = fixed || Math.min(Math.max(Number(drawCount.value) || 1, 1), 6);
  drawCount.disabled = Boolean(fixed);

  const primaryTotal = cardsFrom(activeLibrary).length;
  const primaryText = `${activeMode.primaryLabel || decks[activeLibrary]?.label}：${selectedCount(activeLibrary)} / ${primaryTotal} 張可抽`;
  const secondaryText = activeSecondaryLibrary
    ? `${activeMode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：固定抽 1 張，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
    : "";

  fixedPools.innerHTML = `
    <span>${primaryText}</span>
    ${secondaryText ? `<span>${secondaryText}</span>` : ""}
  `;
}

function renderPrompts() {
  promptList.innerHTML = activeMode.prompts.map(([title, body]) => `
    <div class="prompt-item"><strong>${title}</strong><span>${body}</span></div>
  `).join("");
  roundFlow.innerHTML = activeMode.flow.map((item) => `<li>${item}</li>`).join("");
}

function activeDeckIds() {
  return [activeMode.secondaryDeck, activeMode.primaryDeck].filter(Boolean);
}

function renderLibraryTools() {
  libraryTools.innerHTML = activeDeckIds().map((id) => `
    <button class="filter-chip ${id === activePreview ? "is-active" : ""}" data-preview="${id}" type="button">
      ${decks[id].label}
      <span>${selectedCount(id)}/${cardsFrom(id).length}</span>
    </button>
  `).join("");
}

function renderTokenCloud() {
  ensureDeckSelection(activePreview);
  const deck = decks[activePreview];
  tokenCloud.innerHTML = deck.cards.map((card) => {
    const normalized = normalizeCard(card, activePreview);
    const key = cardKey(normalized);
    const checked = selectedCardKeysByDeck[activePreview].has(key);
    return `
      <label class="token ${checked ? "" : "is-disabled"}">
        <input type="checkbox" data-card-key="${key}" ${checked ? "checked" : ""} />
        <span>${iconFor(normalized)} ${normalized.name}</span>
      </label>
    `;
  }).join("");
}

function cardMarkup(card, extraClass = "") {
  const imageMarkup = card.image
    ? `<img src="${card.image}" alt="${card.name} 卡圖" />`
    : card.iconAsset
      ? `<img src="${card.iconAsset}" alt="${card.name} 圖示" />`
      : `<span>${iconFor(card)}</span>`;
  const typeText = card.deckId === "items" ? card.deckLabel : `${card.deckLabel} · ${card.rarity || "C"}`;

  return `
    <article class="battle-card ${extraClass}" data-rarity="${card.rarity || "C"}">
      <div class="card-title">
        <h3>${card.name}</h3>
        <span class="card-type">${typeText}</span>
      </div>
      <div class="card-art">${imageMarkup}</div>
      <p class="card-lore">${card.lore}</p>
      <ul class="card-hooks">${card.hooks.map((hook) => `<li>${hook}</li>`).join("")}</ul>
    </article>
  `;
}

function renderEmptyState() {
  cardGrid.innerHTML = `<div class="empty-state">${activeMode.drawLabel}。<br />下方抽選池可以控制本局哪些卡會被抽到。</div>`;
}

function renderPoolWarning() {
  cardGrid.innerHTML = `<div class="empty-state">本局抽選池不夠了。<br />請在下方抽選池重新勾選卡牌，或按「重置本玩法」。</div>`;
  return [];
}

function renderCombo(environment, cards, label) {
  currentStageCard = environment;
  renderReelCard(environment);
  cardGrid.innerHTML = `
    <div class="combo-board">
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
    if (!environment || cards.length < count) return renderPoolWarning();
    renderCombo(environment, cards, "本輪異境");
    markDrawn([environment, ...cards]);
    return [environment, ...cards];
  }

  if (activeMode.cardMode === "roleEnvironment") {
    const environment = pickFrom(activeSecondaryLibrary, 1)[0];
    const cards = pickFrom(activeLibrary, count);
    if (!environment || cards.length < count) return renderPoolWarning();
    renderCombo(environment, cards, "留席戰場");
    markDrawn([environment, ...cards]);
    return [environment, ...cards];
  }

  if (activeMode.cardMode === "importanceDuel") {
    const cards = pickFrom(activeLibrary, 2);
    if (cards.length < 2) return renderPoolWarning();
    renderDuel(cards);
    markDrawn(cards);
    return cards;
  }

  if (activeMode.cardMode === "secretPlace") {
    lastSecretCard = pickFrom(activeLibrary, 1)[0];
    if (!lastSecretCard) return renderPoolWarning();
    currentStageCard = lastSecretCard;
    renderSecretPlace(lastSecretCard, false);
    markDrawn([lastSecretCard]);
    return [lastSecretCard];
  }

  const cards = pickFrom(activeLibrary, count);
  if (cards.length < count) return renderPoolWarning();
  cardGrid.innerHTML = cards.map((card) => cardMarkup(card)).join("");
  markDrawn(cards);
  return cards;
}

function spinDraw() {
  if (isDrawing) return;

  isDrawing = true;
  drawButton.disabled = true;
  reel.classList.add("is-spinning");

  const reelPool = activeSecondaryLibrary ? selectedCardsFrom(activeSecondaryLibrary) : selectedCardsFrom(activeLibrary);

  const spinTimer = window.setInterval(() => {
    const card = reelPool[Math.floor(Math.random() * reelPool.length)];
    if (!card) return;
    renderReelCard(null, card.name);
  }, 80);

  window.setTimeout(() => {
    window.clearInterval(spinTimer);
    const selected = drawResult();
    if (!selected.length) {
      renderReelCard(null, "抽選池不足");
    } else {
      const first = selected[0];
      if (activeMode.cardMode === "secretPlace") renderReelCard(first, "場景已抽出");
      else if (!activeSecondaryLibrary) renderReelCard(first);
    }
    reel.classList.remove("is-spinning");
    isDrawing = false;
    drawButton.disabled = false;
    renderAll();
  }, 1000);
}

function setMode(modeId) {
  activeMode = modes.find((mode) => mode.id === modeId) || activeMode;
  activeLibrary = activeMode.primaryDeck;
  activeSecondaryLibrary = activeMode.secondaryDeck || "";
  activePreview = activeMode.secondaryDeck || activeMode.primaryDeck;
  lastSecretCard = null;
  currentStageCard = null;
  for (const deckId of activeDeckIds()) ensureDeckSelection(deckId);
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
  if (!isDrawing) renderReelCard();
}

function handleModeClick(event) {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  setMode(button.dataset.mode);
}

modeGrid.addEventListener("click", handleModeClick);
gameNav.addEventListener("click", handleModeClick);
drawButton.addEventListener("click", spinDraw);

libraryTools.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-preview]");
  if (!chip) return;
  activePreview = chip.dataset.preview;
  renderAll();
});

tokenCloud.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[data-card-key]");
  if (!checkbox) return;
  ensureDeckSelection(activePreview);
  if (checkbox.checked) {
    selectedCardKeysByDeck[activePreview].add(checkbox.dataset.cardKey);
  } else {
    selectedCardKeysByDeck[activePreview].delete(checkbox.dataset.cardKey);
  }
  renderAll();
});

selectAllCards.addEventListener("click", () => {
  setDeckSelection(activePreview, true);
  renderAll();
});

clearCards.addEventListener("click", () => {
  setDeckSelection(activePreview, false);
  renderAll();
});

resetActivePool.addEventListener("click", () => {
  resetModeSelections();
  renderAll();
});

setMode(activeMode.id);
