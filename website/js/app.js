const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const savedImageLayouts = window.DEBATE_IMAGE_LAYOUTS || {};
const { iconFor } = window;

const DEFAULT_IMAGE_LAYOUT = { scale: 1, x: 0, y: 0, rotate: 0 };
const EDIT_MODE = new URLSearchParams(window.location.search).get("edit") === "1";
const EDIT_STORAGE_KEY = "debatevision-image-layouts-draft";

let activeMode = modes[0];
let activeLibrary = activeMode.primaryDeck;
let activeSecondaryLibrary = activeMode.secondaryDeck || "";
let activePreview = activeMode.secondaryDeck || activeMode.primaryDeck;
let isDrawing = false;
let lastSecretCard = null;
let currentStageCard = null;
let secretRevealed = false;
let secretAnswerIndex = "";
let secretShowAnswerNumber = false;
let selectedCardKeysByScope = {};
let imageLayouts = mergeImageLayouts(savedImageLayouts, readDraftLayouts());
let selectedEditCard = null;
let selectedEditTarget = null;

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

function readDraftLayouts() {
  if (!EDIT_MODE) return {};
  try {
    return JSON.parse(window.localStorage.getItem(EDIT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function mergeImageLayouts(baseLayouts, draftLayouts) {
  const merged = JSON.parse(JSON.stringify(baseLayouts || {}));
  for (const [deckId, layouts] of Object.entries(draftLayouts || {})) {
    merged[deckId] = { ...(merged[deckId] || {}), ...(layouts || {}) };
  }
  return merged;
}

function saveDraftLayouts() {
  if (!EDIT_MODE) return;
  window.localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(imageLayouts));
}

function editTargetForCard(card) {
  if (!card?.deckId || !card?.imageId) return null;
  return {
    group: card.deckId,
    id: card.imageId,
    name: card.name,
    label: card.deckLabel,
    cardKey: cardKey(card)
  };
}

function editTargetForMode(mode = activeMode) {
  return {
    group: "modes",
    id: mode.id,
    name: mode.title,
    label: "活動大圖",
    cardKey: ""
  };
}

function layoutForTarget(target) {
  if (!target?.group || !target?.id) return { ...DEFAULT_IMAGE_LAYOUT };
  return {
    ...DEFAULT_IMAGE_LAYOUT,
    ...((imageLayouts[target.group] || {})[target.id] || {})
  };
}

function minScaleForTarget(target) {
  return target?.group === "modes" || target?.group === "worlds" || target?.group === "locations" ? 1 : 0.5;
}

function setLayoutForTarget(target, nextLayout) {
  if (!target?.group || !target?.id) return;
  imageLayouts[target.group] ||= {};
  const minScale = minScaleForTarget(target);
  imageLayouts[target.group][target.id] = {
    scale: Math.max(minScale, Number(nextLayout.scale) || DEFAULT_IMAGE_LAYOUT.scale),
    x: Number(nextLayout.x) || DEFAULT_IMAGE_LAYOUT.x,
    y: Number(nextLayout.y) || DEFAULT_IMAGE_LAYOUT.y,
    rotate: Number(nextLayout.rotate) || DEFAULT_IMAGE_LAYOUT.rotate
  };
  saveDraftLayouts();
}

function layoutFor(card) {
  return layoutForTarget(editTargetForCard(card));
}

function setLayoutFor(card, nextLayout) {
  setLayoutForTarget(editTargetForCard(card), nextLayout);
}

function imageStyleForTarget(target) {
  const layout = layoutForTarget(target);
  return `--image-scale:${layout.scale}; --image-x:${layout.x}px; --image-y:${layout.y}px; --image-rotate:${layout.rotate}deg;`;
}

function imageStyleFor(card) {
  return imageStyleForTarget(editTargetForCard(card));
}

function exportableLayouts(deckId = "items") {
  return imageLayouts[deckId] || {};
}

function normalizeCard(raw, deckId) {
  const card = typeof raw === "object" ? raw : { name: raw[0], lore: raw[1] };
  return {
    ...card,
    deckId,
    deckLabel: decks[deckId].label,
    deckIcon: decks[deckId].icon,
    hooks: buildHooks(card.name, deckId, card.rarity)
  };
}

function buildHooks(name, deckId, rarity = "") {
  if (deckId === "items" && rarity === "N") {
    return [`說明 ${name} 滿足哪一種需求。`, `找出最可能購買 ${name} 的對象。`, "包裝一個讓人願意掏錢的故事。"];
  }
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

function selectionScope(deckId) {
  return `${activeMode.id}::${deckId}`;
}

function selectedKeysForDeck(deckId) {
  ensureDeckSelection(deckId);
  return selectedCardKeysByScope[selectionScope(deckId)] || new Set();
}

function defaultRaritiesFor(deckId) {
  const defaults = activeMode.defaultRarities;
  if (Array.isArray(defaults)) return defaults;
  if (defaults && Array.isArray(defaults[deckId])) return defaults[deckId];
  return null;
}

function defaultCardsForDeck(deckId) {
  const cards = cardsFrom(deckId);
  const defaultRarities = defaultRaritiesFor(deckId);
  if (!defaultRarities) return cards;
  const allowed = new Set(defaultRarities);
  return cards.filter((card) => allowed.has(card.rarity || "C"));
}

function rarityOrder(rarity) {
  const order = { A: 1, B: 2, C: 3, N: 4 };
  return order[rarity] || 99;
}

function raritiesFrom(deckId) {
  return [...new Set(cardsFrom(deckId).map((card) => card.rarity || "C"))]
    .sort((a, b) => rarityOrder(a) - rarityOrder(b) || a.localeCompare(b));
}

function rarityDisplayName(rarity) {
  return rarity === "N" ? "道具卡" : `${rarity} 卡`;
}

function ensureDeckSelection(deckId) {
  if (!deckId) return;
  const scope = selectionScope(deckId);
  if (selectedCardKeysByScope[scope]) return;
  selectedCardKeysByScope[scope] = new Set(defaultCardsForDeck(deckId).map((card) => cardKey(card)));
}

function setDeckSelection(deckId, checked) {
  if (!deckId) return;
  selectedCardKeysByScope[selectionScope(deckId)] = new Set(checked ? cardsFrom(deckId).map((card) => cardKey(card)) : []);
}

function setCardsSelection(deckId, cards, checked) {
  if (!deckId) return;
  const selectedKeys = selectedKeysForDeck(deckId);
  for (const card of cards) {
    if (checked) selectedKeys.add(cardKey(card));
    else selectedKeys.delete(cardKey(card));
  }
}

function selectedCount(deckId) {
  return selectedKeysForDeck(deckId).size;
}

function selectedCardsFrom(deckId) {
  const selectedKeys = selectedKeysForDeck(deckId);
  return cardsFrom(deckId).filter((card) => selectedKeys.has(cardKey(card)));
}

function resetModeSelections() {
  for (const deckId of [activeMode.secondaryDeck, activeMode.primaryDeck].filter(Boolean)) {
    setDeckSelection(deckId, true);
  }
}

function markDrawn(cards) {
  for (const card of cards) {
    selectedKeysForDeck(card.deckId).delete(cardKey(card));
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
  scenePreview.style.removeProperty("--mode-image");
  const currentImage = scenePreview.querySelector(".scene-preview-image");
  const modeTarget = editTargetForMode(activeMode);
  const modeImageAttributes = `style="${imageStyleForTarget(modeTarget)}" data-edit-group="${modeTarget.group}" data-edit-id="${modeTarget.id}" data-edit-name="${modeTarget.name}"`;
  if (modeImage) {
    if (currentImage) {
      currentImage.src = modeImage;
      currentImage.alt = `${activeMode.title} 玩法背景`;
      currentImage.setAttribute("style", imageStyleForTarget(modeTarget));
      currentImage.dataset.editGroup = modeTarget.group;
      currentImage.dataset.editId = modeTarget.id;
      currentImage.dataset.editName = modeTarget.name;
    } else {
      scenePreview.insertAdjacentHTML("afterbegin", `<img class="scene-preview-image" src="${modeImage}" alt="${activeMode.title} 玩法背景" ${modeImageAttributes} />`);
    }
  } else {
    currentImage?.remove();
  }
  sceneEmblem.textContent = activeMode.icon;
  sceneBadge.textContent = activeMode.track;
  sceneTitle.textContent = activeMode.title;
  sceneDescription.textContent = activeMode.description;
  drawButton.textContent = activeMode.drawLabel;
  controlNote.textContent = activeMode.cardMode === "secretPlace"
    ? "此玩法會列出目前啟用的場地編號；老師用隱藏輸入設定答案。"
    : "牌組已依玩法固定；下方抽選池可取消本局不想抽到的卡。";
}

function sceneImageFor(card) {
  return card?.image || card?.iconAsset || "";
}

function renderReelCard(card = currentStageCard, spinningName = "") {
  const title = spinningName || card?.name || "準備抽卡";
  const subtitle = card?.lore || "抽出後，這裡會顯示本輪異境。";
  const image = sceneImageFor(card);
  const target = editTargetForCard(card);
  const editAttributes = target
    ? `style="${imageStyleForTarget(target)}" data-edit-group="${target.group}" data-edit-id="${target.id}" data-edit-name="${target.name}" data-card-key="${target.cardKey}"`
    : "";
  reel.classList.toggle("has-scene-image", Boolean(image));
  reel.style.removeProperty("--scene-image");
  reel.innerHTML = `
    ${image ? `<img class="reel-scene-image" src="${image}" alt="${title} 場景圖" ${editAttributes} />` : ""}
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
  const cards = deck.cards.map((card) => normalizeCard(card, activePreview));
  const rarities = raritiesFrom(activePreview);
  const selectedKeys = selectedKeysForDeck(activePreview);

  if (rarities.length <= 1) {
    tokenCloud.innerHTML = cards.map((normalized) => tokenMarkup(normalized, selectedKeys.has(cardKey(normalized)))).join("");
    return;
  }

  tokenCloud.innerHTML = rarities.map((rarity) => {
    const groupCards = cards.filter((card) => (card.rarity || "C") === rarity);
    const selectedInGroup = groupCards.filter((card) => selectedKeys.has(cardKey(card))).length;
    const rarityLabel = rarityDisplayName(rarity);
    return `
      <section class="token-rarity-section" data-rarity="${rarity}">
        <div class="token-rarity-head">
          <h3>${rarityLabel} <span>${selectedInGroup}/${groupCards.length}</span></h3>
          <div class="token-rarity-actions">
            <button type="button" data-rarity="${rarity}" data-rarity-action="select">全選 ${rarityLabel}</button>
            <button type="button" data-rarity="${rarity}" data-rarity-action="clear">取消 ${rarityLabel}</button>
          </div>
        </div>
        <div class="token-rarity-cloud">
          ${groupCards.map((card) => tokenMarkup(card, selectedKeys.has(cardKey(card)))).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function tokenMarkup(card, checked) {
  const key = cardKey(card);
  return `
    <label class="token ${checked ? "" : "is-disabled"}">
      <input type="checkbox" data-card-key="${key}" ${checked ? "checked" : ""} />
      <span class="token-label">${tokenIconMarkup(card)}<span>${card.name}</span></span>
    </label>
  `;
}

function tokenIconMarkup(card) {
  const image = card.iconAsset || "";
  if (image) {
    return `<img class="token-thumb" src="${image}" alt="" aria-hidden="true" />`;
  }
  return `<span class="token-symbol" aria-hidden="true">${iconFor(card)}</span>`;
}

function cardMarkup(card, extraClass = "") {
  const layoutStyle = imageStyleFor(card);
  const target = editTargetForCard(card);
  const isSelected = EDIT_MODE && selectedEditTarget && selectedEditTarget.group === target?.group && selectedEditTarget.id === target?.id;
  const imageEditAttributes = target
    ? `style="${layoutStyle}" data-edit-group="${target.group}" data-edit-id="${target.id}" data-edit-name="${target.name}" data-card-key="${target.cardKey}"`
    : `style="${layoutStyle}"`;
  const imageMarkup = card.image
    ? `<img src="${card.image}" alt="${card.name} 卡圖" ${imageEditAttributes} />`
    : card.iconAsset
      ? `<img src="${card.iconAsset}" alt="${card.name} 圖示" ${imageEditAttributes} />`
      : `<span>${iconFor(card)}</span>`;
  const typeText = card.deckId === "items" ? card.deckLabel : `${card.deckLabel} · ${card.rarity || "C"}`;

  return `
    <article class="battle-card ${extraClass} ${isSelected ? "is-edit-selected" : ""}" data-rarity="${card.rarity || "C"}" data-card-key="${cardKey(card)}" data-deck-id="${card.deckId}" data-image-id="${card.imageId || ""}">
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

function findCardByKey(key) {
  for (const deckId of Object.keys(decks)) {
    const card = cardsFrom(deckId).find((candidate) => cardKey(candidate) === key);
    if (card) return card;
  }
  return null;
}

function visibleCards() {
  return [...cardGrid.querySelectorAll(".battle-card[data-card-key]")]
    .map((element) => findCardByKey(element.dataset.cardKey))
    .filter(Boolean);
}

function selectEditTarget(target) {
  if (!target) return;
  selectedEditTarget = target;
  selectedEditCard = target.cardKey ? findCardByKey(target.cardKey) : null;
  cardGrid.querySelectorAll(".battle-card").forEach((element) => {
    element.classList.toggle("is-edit-selected", element.dataset.cardKey === target.cardKey);
  });
  document.querySelectorAll(".scene-preview-image, .reel-scene-image").forEach((element) => {
    element.classList.toggle("is-edit-selected", element.dataset.editGroup === target.group && element.dataset.editId === target.id);
  });
  updateEditPanel();
}

function selectEditCard(card) {
  selectEditTarget(editTargetForCard(card));
}

function updateVisibleImages(target) {
  const layoutStyle = imageStyleForTarget(target);
  document.querySelectorAll(`[data-edit-group="${target.group}"][data-edit-id="${target.id}"]`).forEach((image) => {
    image.setAttribute("style", layoutStyle);
  });
}

function ensureEditPanel() {
  if (!EDIT_MODE) return;
  document.body.classList.add("is-edit-mode");
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="image-editor-panel" id="imageEditorPanel" aria-label="圖片微調器">
      <div class="image-editor-head">
        <div>
          <p class="eyebrow">Edit Mode</p>
          <h2>圖片微調器</h2>
        </div>
        <button class="editor-mini-button" id="editorPickFirst" type="button">選第一張</button>
      </div>
      <p class="editor-selected" id="editorSelected">先抽卡，再點一張卡牌圖片。</p>
      <div class="editor-controls">
        <label>縮放 <input id="editScale" type="range" min="0.5" max="2" step="0.01" value="1" /></label>
        <label>左右 <input id="editX" type="range" min="-120" max="120" step="1" value="0" /></label>
        <label>上下 <input id="editY" type="range" min="-120" max="120" step="1" value="0" /></label>
        <label>旋轉 <input id="editRotate" type="range" min="-30" max="30" step="1" value="0" /></label>
      </div>
      <div class="editor-nudges" aria-label="方向微調">
        <button type="button" data-nudge="up">上</button>
        <button type="button" data-nudge="down">下</button>
        <button type="button" data-nudge="left">左</button>
        <button type="button" data-nudge="right">右</button>
        <button type="button" data-scale="up">放大</button>
        <button type="button" data-scale="down">縮小</button>
      </div>
      <div class="editor-actions">
        <button id="resetImageLayout" type="button">重設這張</button>
        <button id="exportImageLayout" type="button">匯出 JSON</button>
      </div>
      <p class="editor-file-hint" id="editorFileHint">匯出後貼到 data/image-layouts/items.json</p>
      <p class="editor-status" id="editorStatus">編輯模式只會先預覽；匯出 JSON 後仍需貼回檔案。</p>
      <textarea id="editorExportText" readonly spellcheck="false" aria-label="匯出的圖片設定"></textarea>
    </aside>
  `);

  document.querySelector("#editorPickFirst").addEventListener("click", () => {
    const [firstCard] = visibleCards().filter((card) => card.imageId);
    if (firstCard) selectEditCard(firstCard);
    else selectEditTarget(editTargetForMode(activeMode));
  });

  for (const id of ["editScale", "editX", "editY", "editRotate"]) {
    document.querySelector(`#${id}`).addEventListener("input", applyEditorInputs);
  }

  document.querySelector(".editor-nudges").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !selectedEditTarget) return;
    const layout = layoutForTarget(selectedEditTarget);
    if (button.dataset.nudge === "up") layout.y -= 2;
    if (button.dataset.nudge === "down") layout.y += 2;
    if (button.dataset.nudge === "left") layout.x -= 2;
    if (button.dataset.nudge === "right") layout.x += 2;
    if (button.dataset.scale === "up") layout.scale = Math.min(2, Number((layout.scale + 0.02).toFixed(2)));
    if (button.dataset.scale === "down") layout.scale = Math.max(minScaleForTarget(selectedEditTarget), Number((layout.scale - 0.02).toFixed(2)));
    setLayoutForTarget(selectedEditTarget, layout);
    updateVisibleImages(selectedEditTarget);
    updateEditPanel();
  });

  document.querySelector("#resetImageLayout").addEventListener("click", () => {
    if (!selectedEditTarget) return;
    setLayoutForTarget(selectedEditTarget, DEFAULT_IMAGE_LAYOUT);
    updateVisibleImages(selectedEditTarget);
    updateEditPanel();
  });

  document.querySelector("#exportImageLayout").addEventListener("click", exportCurrentDeckLayout);
}

function updateEditPanel() {
  if (!EDIT_MODE) return;
  const selectedLabel = document.querySelector("#editorSelected");
  const fileHint = document.querySelector("#editorFileHint");
  const exportText = document.querySelector("#editorExportText");
  const status = document.querySelector("#editorStatus");

  if (!selectedEditTarget) {
    selectedLabel.textContent = "點活動大圖、抽卡機異境圖，或下方卡牌圖片。";
    fileHint.textContent = "匯出後貼到 data/image-layouts/items.json";
    status.textContent = "編輯模式只會先預覽；匯出 JSON 後仍需貼回檔案。";
    return;
  }

  const layout = layoutForTarget(selectedEditTarget);
  const scaleInput = document.querySelector("#editScale");
  const minScale = minScaleForTarget(selectedEditTarget);
  scaleInput.min = String(minScale);
  if (Number(layout.scale) < minScale) {
    layout.scale = minScale;
    setLayoutForTarget(selectedEditTarget, layout);
    updateVisibleImages(selectedEditTarget);
  }
  scaleInput.value = layout.scale;
  document.querySelector("#editX").value = layout.x;
  document.querySelector("#editY").value = layout.y;
  document.querySelector("#editRotate").value = layout.rotate;
  selectedLabel.textContent = `${selectedEditTarget.label}：${selectedEditTarget.name}（${selectedEditTarget.id}）`;
  fileHint.textContent = `匯出後貼到 data/image-layouts/${selectedEditTarget.group}.json`;
  exportText.value = JSON.stringify(exportableLayouts(selectedEditTarget.group), null, 2);
}

function applyEditorInputs() {
  if (!EDIT_MODE || !selectedEditTarget) return;
  const layout = {
    scale: Number(document.querySelector("#editScale").value),
    x: Number(document.querySelector("#editX").value),
    y: Number(document.querySelector("#editY").value),
    rotate: Number(document.querySelector("#editRotate").value)
  };
  setLayoutForTarget(selectedEditTarget, layout);
  updateVisibleImages(selectedEditTarget);
  updateEditPanel();
  document.querySelector("#editorStatus").textContent = "本頁預覽已更新；要永久保存，請按「匯出 JSON」再貼回檔案。";
}

function exportCurrentDeckLayout() {
  const group = selectedEditTarget?.group || "items";
  const text = JSON.stringify(exportableLayouts(group), null, 2);
  const output = document.querySelector("#editorExportText");
  output.value = text;
  output.focus();
  output.select();
  navigator.clipboard?.writeText(text).catch(() => {});
  const targetFile = `data/image-layouts/${group}.json`;
  document.querySelector("#editorStatus").textContent = `JSON 已產生並嘗試複製；請貼到 ${targetFile} 後再執行網站更新。`;
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
  secretRevealed = revealed;
  const places = selectedCardsFrom(activeLibrary);
  if (!revealed) card = secretCardFromIndex(secretAnswerIndex);
  lastSecretCard = card || null;

  if (revealed && card) {
    cardGrid.innerHTML = `
      <div class="secret-board is-revealed">
        <div class="secret-banner">
          <p class="eyebrow">答案公布</p>
          <h2>原來我們在：${card.name}</h2>
          <p>可以回頭檢查：哪些問題最早把範圍縮小？哪些問題其實不夠精準？</p>
        </div>
        <div class="secret-place-options">
          ${placeOptionsMarkup(card, true, places)}
        </div>
      </div>
    `;
    bindSecretPlaceOptions(card);
    return;
  }

  const total = places.length;
  const chosenNumber = Number(secretAnswerIndex);
  const hasValidAnswer = Number.isInteger(chosenNumber) && chosenNumber >= 1 && chosenNumber <= total;
  const statusText = hasValidAnswer
    ? "答案已設定。投影時可保持隱藏。"
    : `請老師輸入 1-${total || 0} 的秘密編號。`;

  cardGrid.innerHTML = `
    <div class="secret-board">
      <div class="secret-banner">
        <p class="eyebrow">老師秘密設定</p>
        <h2>答案先不要讓學生看到</h2>
        <p>下方會依目前啟用的場地排出 1-${total} 號。老師輸入秘密編號後，學生只會看到候選場地。</p>
        <div class="secret-teacher-panel">
          <label class="secret-answer-field">
            <span>秘密編號</span>
            <input
              id="secretAnswerIndex"
              type="${secretShowAnswerNumber ? "text" : "password"}"
              inputmode="numeric"
              pattern="[0-9]*"
              min="1"
              max="${total}"
              value="${secretAnswerIndex}"
              placeholder="1-${total || 0}"
              autocomplete="off"
            />
          </label>
          <label class="secret-show-toggle">
            <input id="secretShowAnswerNumber" type="checkbox" ${secretShowAnswerNumber ? "checked" : ""} />
            <span>顯示編號</span>
          </label>
          <p class="secret-answer-status" id="secretAnswerStatus">${statusText}</p>
        </div>
        <button class="reveal-action" data-reveal-secret type="button" ${hasValidAnswer ? "" : "disabled"}>直接公布答案</button>
      </div>
      <div class="secret-place-options">
        ${placeOptionsMarkup(card, false, places)}
      </div>
    </div>
  `;

  bindSecretPlaceOptions(card);
  bindSecretAnswerControls();
}

function placeOptionsMarkup(answerCard, revealed, places = selectedCardsFrom(activeLibrary)) {
  return places.map((place, index) => {
    const isAnswer = answerCard && cardKey(place) === cardKey(answerCard);
    const stateClass = [
      revealed && isAnswer ? "is-correct" : "",
    ].filter(Boolean).join(" ");
    const stateText = revealed && isAnswer
      ? "<span>就是這裡</span>"
      : "";
    return `
      <button class="secret-place-option ${stateClass}" data-place="${place.name}" type="button">
        <b class="secret-place-number">${index + 1}</b>
        ${tokenIconMarkup(place)}
        <strong>${place.name}</strong>
        ${stateText}
      </button>
    `;
  }).join("");
}

function secretCardFromIndex(indexValue) {
  const places = selectedCardsFrom(activeLibrary);
  const index = Number(indexValue);
  if (!Number.isInteger(index) || index < 1 || index > places.length) return null;
  return places[index - 1];
}

function updateSecretAnswerState() {
  const input = cardGrid.querySelector("#secretAnswerIndex");
  const status = cardGrid.querySelector("#secretAnswerStatus");
  const revealButton = cardGrid.querySelector("[data-reveal-secret]");
  if (!input) return;

  secretAnswerIndex = input.value.replace(/[^\d]/g, "");
  if (input.value !== secretAnswerIndex) input.value = secretAnswerIndex;
  lastSecretCard = secretCardFromIndex(secretAnswerIndex);
  secretRevealed = false;

  const total = selectedCardsFrom(activeLibrary).length;
  if (lastSecretCard) {
    status.textContent = "答案已設定。投影時可保持隱藏。";
    revealButton.disabled = false;
    return;
  }

  status.textContent = `請老師輸入 1-${total || 0} 的秘密編號。`;
  revealButton.disabled = true;
}

function bindSecretAnswerControls() {
  const input = cardGrid.querySelector("#secretAnswerIndex");
  const showToggle = cardGrid.querySelector("#secretShowAnswerNumber");
  if (!input) return;

  input.addEventListener("input", updateSecretAnswerState);
  showToggle?.addEventListener("change", () => {
    secretShowAnswerNumber = showToggle.checked;
    input.type = secretShowAnswerNumber ? "text" : "password";
    input.focus();
  });
}

function bindSecretPlaceOptions(answerCard) {
  const options = cardGrid.querySelector(".secret-place-options");
  if (!options) return;

  options.addEventListener("click", (event) => {
    const option = event.target.closest(".secret-place-option");
    if (!option || option.disabled) return;

    if (!lastSecretCard) {
      const status = cardGrid.querySelector("#secretAnswerStatus");
      if (status) status.textContent = "請老師先輸入秘密編號，再開始公布。";
      return;
    }

    if (option.dataset.place === lastSecretCard.name) {
      renderSecretPlace(lastSecretCard, true);
      return;
    }

    option.classList.add("is-wrong");
    if (!option.querySelector("span")) option.insertAdjacentHTML("beforeend", "<span>不是這裡</span>");
  });

  const revealButton = cardGrid.querySelector("[data-reveal-secret]");
  revealButton?.addEventListener("click", () => {
    updateSecretAnswerState();
    if (lastSecretCard) renderSecretPlace(lastSecretCard, true);
  });
}

function refreshSecretPlaceBoard() {
  if (activeMode.cardMode !== "secretPlace" || !lastSecretCard) return;
  renderSecretPlace(lastSecretCard, secretRevealed);
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
    const places = selectedCardsFrom(activeLibrary);
    if (!places.length) return renderPoolWarning();
    lastSecretCard = secretCardFromIndex(secretAnswerIndex);
    secretRevealed = false;
    currentStageCard = {
      name: "秘密選號已開啟",
      lore: `目前有 ${places.length} 個場地候選，請老師輸入秘密編號。`,
      icon: activeMode.icon,
      deckLabel: activeMode.primaryLabel
    };
    renderSecretPlace(lastSecretCard, false);
    return [currentStageCard];
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
    if (activeMode.cardMode === "secretPlace") {
      renderReelCard(null, "秘密選號中");
      return;
    }
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
      if (activeMode.cardMode === "secretPlace") renderReelCard(currentStageCard);
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
  secretRevealed = false;
  secretAnswerIndex = "";
  secretShowAnswerNumber = false;
  selectedEditCard = null;
  selectedEditTarget = null;
  for (const deckId of activeDeckIds()) ensureDeckSelection(deckId);
  renderAll();
  renderEmptyState();
  updateEditPanel();
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
    selectedKeysForDeck(activePreview).add(checkbox.dataset.cardKey);
  } else {
    selectedKeysForDeck(activePreview).delete(checkbox.dataset.cardKey);
  }
  renderAll();
  refreshSecretPlaceBoard();
});

tokenCloud.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rarity-action]");
  if (!button) return;
  const rarity = button.dataset.rarity;
  const checked = button.dataset.rarityAction === "select";
  const cards = cardsFrom(activePreview).filter((card) => (card.rarity || "C") === rarity);
  setCardsSelection(activePreview, cards, checked);
  renderAll();
  refreshSecretPlaceBoard();
});

cardGrid.addEventListener("click", (event) => {
  if (!EDIT_MODE) return;
  const cardElement = event.target.closest(".battle-card[data-card-key]");
  if (!cardElement) return;
  const card = findCardByKey(cardElement.dataset.cardKey);
  if (card?.imageId) selectEditCard(card);
});

scenePreview.addEventListener("click", (event) => {
  if (!EDIT_MODE) return;
  const image = scenePreview.querySelector(".scene-preview-image[data-edit-group]");
  if (!image) return;
  selectEditTarget({
    group: image.dataset.editGroup,
    id: image.dataset.editId,
    name: image.dataset.editName,
    label: "活動大圖",
    cardKey: ""
  });
});

reel.addEventListener("click", (event) => {
  if (!EDIT_MODE) return;
  const image = reel.querySelector(".reel-scene-image[data-edit-group]");
  if (!image) return;
  const card = findCardByKey(image.dataset.cardKey);
  selectEditTarget(card ? editTargetForCard(card) : {
    group: image.dataset.editGroup,
    id: image.dataset.editId,
    name: image.dataset.editName,
    label: "抽卡機圖片",
    cardKey: ""
  });
});

selectAllCards.addEventListener("click", () => {
  setDeckSelection(activePreview, true);
  renderAll();
  refreshSecretPlaceBoard();
});

clearCards.addEventListener("click", () => {
  setDeckSelection(activePreview, false);
  renderAll();
  refreshSecretPlaceBoard();
});

resetActivePool.addEventListener("click", () => {
  resetModeSelections();
  renderAll();
  refreshSecretPlaceBoard();
});

ensureEditPanel();
setMode(activeMode.id);
