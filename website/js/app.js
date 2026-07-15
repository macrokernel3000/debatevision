const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const savedImageLayouts = window.DEBATE_IMAGE_LAYOUTS || {};
const uiTexts = window.DEBATE_UI_TEXTS || {};
const modeLifecycle = window.DEBATE_MODE_LIFECYCLE || {};
const { iconFor } = window;

const DEFAULT_IMAGE_LAYOUT = { scale: 1, x: 0, y: 0, rotate: 0, overlay: 0.28 };
const EDIT_MODE = new URLSearchParams(window.location.search).get("edit") === "1";
const EDIT_STORAGE_KEY = "debatevision-image-layouts-draft";
const HISTORY_STORAGE_KEY = "debatevision-draw-history";
const HISTORY_LIMIT = 10;

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
let salesVariant = "item";
let lockEnvironment = false;
let metaphorPrefixDeck = "";
let metaphorSuffixDeck = "";
let metaphorLocks = { prefix: false, relation: false, suffix: false };
let currentMetaphorCards = null;
let selectedCardKeysByScope = {};
let imageLayouts = mergeImageLayouts(savedImageLayouts, readDraftLayouts());
let drawHistoryByMode = readDrawHistory();
let selectedEditCard = null;
let selectedEditTarget = null;

const defaultUiTexts = {
  "section.drawn.eyebrow": "Drawn Cards",
  "section.drawn.title": "本輪卡牌",
  "section.coach.eyebrow": "Coach Kit",
  "section.coach.title": "教練提示",
  "section.flow.title": "回合流程",
  "section.library.eyebrow": "Lexicon",
  "section.library.title": "本局抽選池",
  "button.pool.selectAll": "全選目前牌組",
  "button.pool.clear": "取消目前牌組",
  "button.pool.reset": "重置本玩法",
  "label.drawCount": "抽取數量",
  "control.note.default": "牌組已依玩法固定；下方抽選池可取消本局不想抽到的卡。",
  "reel.ready.title": "準備抽卡",
  "reel.ready.subtitle": "抽出後，這裡會顯示本輪異境。",
  "empty.default": "{drawLabel}。<br />下方抽選池可以控制本局哪些卡會被抽到。",
  "warning.pool": "本局抽選池不夠了。<br />請在下方抽選池重新勾選卡牌，或按「重置本玩法」。",
  "secret.result.eyebrow": "答案公布",
  "secret.result.title": "原來答案是：{name}",
  "secret.result.body": "可以回頭檢查：哪些問題最早把範圍縮小？哪些問題其實不夠精準？",
  "secret.restart": "再來一場",
  "secret.setup.eyebrow": "秘密詞條",
  "secret.setup.title": "請選定秘密答案",
  "secret.setup.body": "下方會依目前啟用的「{deckLabel}」排出 1-{total} 號。輸入秘密編號後，即可開始活動。",
  "secret.answer.label": "秘密編號",
  "secret.showNumber": "顯示編號",
  "secret.reveal": "直接公布答案",
  "secret.correct": "就是這個",
  "secret.wrong": "不是這個",
  "secret.status.set": "答案已設定。投影時可保持隱藏。",
  "secret.status.prompt": "請輸入 1-{total} 的秘密編號。",
  "secret.status.needAnswer": "請先輸入秘密編號，再開始公布。"
};

function uiText(key, vars = {}) {
  let text = uiTexts[key] || defaultUiTexts[key] || key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }
  return text;
}

function renderStaticUiText() {
  document.querySelectorAll("[data-ui-text]").forEach((element) => {
    element.textContent = uiText(element.dataset.uiText);
  });
}

const gameNav = document.querySelector("#gameNav");
const modeGrid = document.querySelector("#modeGrid");
const controlBand = document.querySelector(".control-band");
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
const drawHistory = document.querySelector("#drawHistory");
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

function readDrawHistory() {
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDrawHistory() {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(drawHistoryByMode));
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
    rotate: Number(nextLayout.rotate) || DEFAULT_IMAGE_LAYOUT.rotate,
    overlay: Math.min(0.8, Math.max(0, Number.isFinite(Number(nextLayout.overlay)) ? Number(nextLayout.overlay) : DEFAULT_IMAGE_LAYOUT.overlay))
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
  return `--image-scale:${layout.scale}; --image-x:${layout.x}px; --image-y:${layout.y}px; --image-rotate:${layout.rotate}deg; --overlay-strength:${layout.overlay};`;
}

function imageStyleFor(card) {
  return imageStyleForTarget(editTargetForCard(card));
}

function lifecycleFor(mode = activeMode) {
  return {
    ...(modeLifecycle.default || {}),
    ...(modeLifecycle[mode?.id] || {})
  };
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
  if (activeMode.cardMode === "metaphorCompass") {
    if (deckId === "relations") {
      return [`說明「${name}」讓兩個概念形成什麼關係。`, `找出這個關係最容易被質疑的地方。`, `嘗試把這個關係換成生活中的例子。`];
    }
    return [`定義「${name}」在這句命題中的意思。`, `替「${name}」找一個具體例子。`, `回應一個針對「${name}」的反例。`];
  }

  if (activeMode.cardMode === "salesPitch" && deckId === "needs") {
    return [`說明「${name}」常出現在哪些生活情境。`, `找出能滿足「${name}」的商品或服務。`, `包裝一個讓人願意為「${name}」付錢的故事。`];
  }

  if (Array.isArray(activeMode.cardHooks) && activeMode.cardHooks.length) {
    return activeMode.cardHooks.map((hook) => fillCardHookTemplate(hook, name));
  }

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

function fillCardHookTemplate(template, name) {
  return String(template || "")
    .replaceAll("{name}", name)
    .replaceAll("{{name}}", name)
    .replaceAll("卡牌名稱", name);
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

function availableDeckIdsForMode(mode = activeMode) {
  if (Array.isArray(mode.availableDecks) && mode.availableDecks.length) {
    return mode.availableDecks.filter((deckId) => decks[deckId]);
  }
  if (mode.cardMode === "metaphorCompass") {
    return [mode.secondaryDeck, ...(mode.metaphorDecks || [mode.primaryDeck])].filter((deckId) => deckId && decks[deckId]);
  }
  if (Array.isArray(mode.variantDecks) && mode.variantDecks.length) {
    return [mode.secondaryDeck, ...mode.variantDecks].filter((deckId) => deckId && decks[deckId]);
  }
  if (mode.cardMode === "salesPitch") {
    return [mode.primaryDeck, mode.secondaryDeck].filter(Boolean);
  }
  if (mode.cardMode === "secretPlace") return Object.keys(decks);
  return [mode.secondaryDeck, mode.primaryDeck].filter(Boolean);
}

function shouldSwitchPrimaryDeckWithPreview(mode = activeMode) {
  return Array.isArray(mode.availableDecks) && mode.availableDecks.length && !mode.secondaryDeck;
}

function primaryVariantDeckIds(mode = activeMode) {
  if (Array.isArray(mode.variantDecks) && mode.variantDecks.length) {
    return mode.variantDecks.filter((deckId) => decks[deckId]);
  }
  if (mode.cardMode === "importanceDuel" && Array.isArray(mode.availableDecks)) {
    return mode.availableDecks.filter((deckId) => decks[deckId]);
  }
  return [];
}

function variantLabel(deckId) {
  return activeMode.variantLabels?.[deckId] || (decks[deckId]?.label || deckId).replace(/卡$/, "");
}

function resetModeSelections() {
  for (const deckId of availableDeckIdsForMode()) {
    setDeckSelection(deckId, true);
  }
}

function markDrawn(cards) {
  for (const card of cards) {
    selectedKeysForDeck(card.deckId).delete(cardKey(card));
  }
}

function historyScope() {
  return activeMode.id;
}

function historyVariantLabel() {
  if (activeMode.cardMode === "salesPitch") {
    return { item: "商品", need: "需求", combo: "商品 + 需求" }[salesVariant] || "";
  }
  if (activeMode.cardMode === "metaphorCompass") {
    const prefixLabel = decks[metaphorPrefixDeck]?.label || "";
    const suffixLabel = decks[metaphorSuffixDeck]?.label || "";
    return prefixLabel && suffixLabel ? `${prefixLabel} → ${suffixLabel}` : "";
  }
  if (activeMode.cardMode === "secretPlace") return decks[activeLibrary]?.label || "";
  const variantDecks = primaryVariantDeckIds();
  if (variantDecks.length) return variantLabel(activeLibrary);
  if (activeMode.cardMode === "importanceDuel") return decks[activeLibrary]?.label || "";
  return "";
}

function cardHistoryLabel(card) {
  const deckLabel = card.deckLabel || decks[card.deckId]?.label || "卡牌";
  return `${deckLabel}：${card.name}`;
}

function rememberDraw(cards, options = {}) {
  if (!Array.isArray(cards) || !cards.length) return;
  if (activeMode.cardMode === "secretPlace" && !options.includeSecret) return;
  const scope = historyScope();
  const entry = {
    modeId: activeMode.id,
    modeTitle: activeMode.title,
    variant: historyVariantLabel(),
    time: new Date().toISOString(),
    cards: cards.map((card) => ({
      name: card.name,
      deckId: card.deckId,
      deckLabel: card.deckLabel || decks[card.deckId]?.label || "",
      rarity: card.rarity || ""
    }))
  };
  drawHistoryByMode[scope] = [entry, ...(drawHistoryByMode[scope] || [])].slice(0, HISTORY_LIMIT);
  saveDrawHistory();
  renderDrawHistory();
}

function rememberSecretAnswer(card) {
  if (!card) return;
  rememberDraw([card], { includeSecret: true });
}

function historyTitle(index) {
  const numerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return `第${numerals[index] || index + 1}場`;
}

function renderDrawHistory() {
  if (!drawHistory) return;
  const entries = [...(drawHistoryByMode[historyScope()] || []).slice(0, HISTORY_LIMIT)].reverse();
  if (!entries.length) {
    drawHistory.innerHTML = `<div class="history-empty">抽卡後會在這裡保留最近十場紀錄。</div>`;
    return;
  }

  drawHistory.innerHTML = entries.map((entry, index) => `
    <article class="history-item">
      <div class="history-item-head">
        <strong>${historyTitle(index)}</strong>
        ${entry.variant ? `<span>${entry.variant}</span>` : ""}
      </div>
      <div class="history-card-list">
        ${entry.cards.map((card) => `<span>${cardHistoryLabel(card)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function pickFrom(deckId, count) {
  const pool = [...selectedCardsFrom(deckId)];
  return pickFromPool(pool, count);
}

function pickFromAvailable(deckId, count, excludedKeys = new Set()) {
  const pool = selectedCardsFrom(deckId).filter((card) => !excludedKeys.has(cardKey(card)));
  return pickFromPool(pool, count);
}

function pickFromPool(pool, count) {
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
  const currentImage = scenePreview.querySelector(".scene-preview-image");
  const modeTarget = editTargetForMode(activeMode);
  const modeStyle = imageStyleForTarget(modeTarget);
  scenePreview.setAttribute("style", modeStyle);
  scenePreview.dataset.editGroup = modeTarget.group;
  scenePreview.dataset.editId = modeTarget.id;
  scenePreview.dataset.editName = modeTarget.name;
  const modeImageAttributes = `style="${modeStyle}" data-edit-group="${modeTarget.group}" data-edit-id="${modeTarget.id}" data-edit-name="${modeTarget.name}"`;
  if (modeImage) {
    if (currentImage) {
      currentImage.src = modeImage;
      currentImage.alt = `${activeMode.title} 玩法背景`;
      currentImage.setAttribute("style", modeStyle);
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
  controlBand.hidden = activeMode.cardMode === "secretPlace";
  controlNote.textContent = activeMode.cardMode === "secretPlace"
    ? lifecycleFor().setup
    : uiText("control.note.default");
}

function sceneImageFor(card) {
  return card?.image || card?.iconAsset || "";
}

function renderReelCard(card = currentStageCard, spinningName = "") {
  const title = spinningName || card?.name || uiText("reel.ready.title");
  const subtitle = card?.lore || uiText("reel.ready.subtitle");
  const image = sceneImageFor(card);
  const target = editTargetForCard(card);
  const reelStyle = target ? imageStyleForTarget(target) : "";
  const editAttributes = target
    ? `style="${reelStyle}" data-edit-group="${target.group}" data-edit-id="${target.id}" data-edit-name="${target.name}" data-card-key="${target.cardKey}"`
    : "";
  reel.classList.toggle("has-scene-image", Boolean(image));
  reel.setAttribute("style", reelStyle);
  if (target) {
    reel.dataset.editGroup = target.group;
    reel.dataset.editId = target.id;
    reel.dataset.editName = target.name;
  } else {
    delete reel.dataset.editGroup;
    delete reel.dataset.editId;
    delete reel.dataset.editName;
  }
  reel.innerHTML = `
    ${image ? `<img class="reel-scene-image" src="${image}" alt="${title} 場景圖" ${editAttributes} />` : ""}
    <div class="reel-scene-mark">${card ? activeMode.icon : "?"}</div>
    <div class="reel-scene-copy">
      <span>${card?.deckLabel || activeMode.secondaryLabel || activeMode.track || "Scene Card"}</span>
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
  let primaryText = `${decks[activeLibrary]?.label || activeMode.primaryLabel}：${selectedCount(activeLibrary)} / ${primaryTotal} 張可抽`;
  let secondaryText = activeSecondaryLibrary
    ? activeMode.cardMode === "salesPitch"
      ? `${activeMode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
      : `${activeMode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：固定抽 1 張，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
    : "";
  if (activeMode.cardMode === "metaphorCompass") {
    primaryText = `前綴：${decks[metaphorPrefixDeck]?.label || ""}，${selectedCount(metaphorPrefixDeck)} / ${cardsFrom(metaphorPrefixDeck).length} 張可抽`;
    secondaryText = `介係：${decks[activeSecondaryLibrary]?.label || ""}，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`;
  }
  const suffixText = activeMode.cardMode === "metaphorCompass"
    ? `後綴：${decks[metaphorSuffixDeck]?.label || ""}，${selectedCount(metaphorSuffixDeck)} / ${cardsFrom(metaphorSuffixDeck).length} 張可抽`
    : "";
  const salesTools = activeMode.cardMode === "salesPitch"
    ? `
      <div class="sales-variant-tools" role="group" aria-label="銷售密令抽法">
        <button type="button" class="${salesVariant === "item" ? "is-active" : ""}" data-sales-variant="item">商品</button>
        <button type="button" class="${salesVariant === "need" ? "is-active" : ""}" data-sales-variant="need">需求</button>
        <button type="button" class="${salesVariant === "combo" ? "is-active" : ""}" data-sales-variant="combo">商品 + 需求</button>
      </div>
    `
    : "";
  const primaryVariantDecks = primaryVariantDeckIds();
  const primaryVariantTools = primaryVariantDecks.length
    ? `
      <div class="sales-variant-tools" role="group" aria-label="${activeMode.title}抽選類型">
        ${primaryVariantDecks.map((deckId) => `
          <button type="button" class="${activeLibrary === deckId ? "is-active" : ""}" data-primary-variant="${deckId}">
            ${variantLabel(deckId)}
          </button>
        `).join("")}
      </div>
    `
    : "";
  const environmentLockTool = activeMode.cardMode === "itemEnvironment"
    ? `
      <label class="environment-lock-toggle">
        <input type="checkbox" data-lock-environment ${lockEnvironment ? "checked" : ""} />
        <span>鎖定異境</span>
      </label>
    `
    : "";
  const metaphorLockTool = activeMode.cardMode === "metaphorCompass"
    ? `
      <div class="metaphor-deck-tools" role="group" aria-label="隱喻羅盤詞庫選擇">
        ${metaphorDeckSelectMarkup("prefix", "前綴", metaphorPrefixDeck)}
        ${metaphorDeckSelectMarkup("suffix", "後綴", metaphorSuffixDeck)}
      </div>
      <div class="metaphor-lock-tools" role="group" aria-label="隱喻羅盤鎖定">
        ${metaphorLockMarkup("prefix", "鎖定前綴")}
        ${metaphorLockMarkup("relation", "鎖定介係")}
        ${metaphorLockMarkup("suffix", "鎖定後綴")}
      </div>
    `
    : "";

  fixedPools.innerHTML = `
    <span>${primaryText}</span>
    ${secondaryText ? `<span>${secondaryText}</span>` : ""}
    ${suffixText ? `<span>${suffixText}</span>` : ""}
    ${primaryVariantTools}
    ${environmentLockTool}
    ${metaphorLockTool}
    ${salesTools}
  `;
}

function metaphorDeckOptions() {
  return (activeMode.metaphorDecks || [activeMode.primaryDeck]).filter((deckId) => decks[deckId]);
}

function metaphorDeckSelectMarkup(part, label, value) {
  return `
    <label class="metaphor-deck-select">
      <span>${label}</span>
      <select data-metaphor-deck="${part}">
        ${metaphorDeckOptions().map((deckId) => `
          <option value="${deckId}" ${deckId === value ? "selected" : ""}>${decks[deckId].label}</option>
        `).join("")}
      </select>
    </label>
  `;
}

function metaphorLockMarkup(part, label) {
  const card = currentMetaphorCards?.[part];
  const expectedDeck = part === "prefix" ? metaphorPrefixDeck : part === "suffix" ? metaphorSuffixDeck : activeSecondaryLibrary;
  const canLock = Boolean(card) && (!expectedDeck || card.deckId === expectedDeck);
  const locked = Boolean(metaphorLocks[part] && canLock);
  return `
    <label class="environment-lock-toggle ${canLock ? "" : "is-disabled"}">
      <input type="checkbox" data-lock-metaphor="${part}" ${locked ? "checked" : ""} ${canLock ? "" : "disabled"} />
      <span>${label}</span>
    </label>
  `;
}

function renderPrompts() {
  promptList.innerHTML = activeMode.prompts.map(([title, body]) => `
    <div class="prompt-item"><strong>${title}</strong><span>${body}</span></div>
  `).join("");
  roundFlow.innerHTML = activeMode.flow.map((item) => `<li>${item}</li>`).join("");
}

function activeDeckIds() {
  return availableDeckIdsForMode();
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
  if (card.tokenIcon) {
    return `<span class="token-symbol" aria-hidden="true">${card.tokenIcon}</span>`;
  }
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
        <label>蒙版 <input id="editOverlay" type="range" min="0" max="0.8" step="0.01" value="0.28" /></label>
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

  for (const id of ["editScale", "editX", "editY", "editRotate", "editOverlay"]) {
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
  document.querySelector("#editOverlay").value = layout.overlay;
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
    rotate: Number(document.querySelector("#editRotate").value),
    overlay: Number(document.querySelector("#editOverlay").value)
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
  cardGrid.innerHTML = `<div class="empty-state">${uiText("empty.default", { drawLabel: activeMode.drawLabel })}</div>`;
}

function renderPoolWarning() {
  cardGrid.innerHTML = `<div class="empty-state">${uiText("warning.pool")}</div>`;
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

function renderSalesPitch(items = [], needs = []) {
  if (items.length && needs.length) {
    const pairCount = Math.max(items.length, needs.length);
    cardGrid.innerHTML = Array.from({ length: pairCount }, (_, index) => `
      <section class="sales-pair">
        <div class="sales-pair-head">銷售組合 ${index + 1}</div>
        <div class="sales-pair-cards">
          ${items[index] ? cardMarkup(items[index], "sales-card") : ""}
          ${needs[index] ? cardMarkup(needs[index], "sales-card") : ""}
        </div>
      </section>
    `).join("");
    return;
  }

  const cards = [...items, ...needs];
  cardGrid.innerHTML = cards.map((card) => cardMarkup(card)).join("");
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

function renderMetaphorCompass(concepts, relation) {
  const [left, right] = concepts;
  currentMetaphorCards = { prefix: left, relation, suffix: right };
  cardGrid.innerHTML = `
    <div class="metaphor-board">
      <article class="metaphor-sentence">
        <span>${left.name}</span>
        <strong>${relation.name}</strong>
        <span>${right.name}</span>
      </article>
      <div class="metaphor-guide">
        <p>請解釋：為什麼「${left.name}${relation.name}${right.name}」可以成立？</p>
        <p>可以先重新定義兩個概念，再提出一個具體例子，最後回應可能的反例。</p>
      </div>
      <div class="metaphor-cards">
        ${cardMarkup(left)}
        ${cardMarkup(relation, "relation-card")}
        ${cardMarkup(right)}
      </div>
    </div>
  `;
}

function renderSecretPlace(card, revealed = false) {
  secretRevealed = revealed;
  const places = selectedCardsFrom(activeLibrary);
  const deckLabel = decks[activeLibrary]?.label || activeMode.primaryLabel || "詞庫";
  if (!revealed) card = secretCardFromIndex(secretAnswerIndex);
  lastSecretCard = card || null;

  if (revealed && card) {
    rememberSecretAnswer(card);
    cardGrid.innerHTML = `
      <div class="secret-board is-revealed">
        <div class="secret-banner">
          <p class="eyebrow">${uiText("secret.result.eyebrow")}</p>
          <h2>${uiText("secret.result.title", { name: card.name })}</h2>
          <p>${uiText("secret.result.body")}</p>
          <button class="reveal-action restart-action" data-restart-secret type="button">${uiText("secret.restart")}</button>
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
    ? uiText("secret.status.set")
    : uiText("secret.status.prompt", { total: total || 0 });

  cardGrid.innerHTML = `
    <div class="secret-board">
      <div class="secret-banner">
        <p class="eyebrow">${uiText("secret.setup.eyebrow")}</p>
        <h2>${uiText("secret.setup.title")}</h2>
        <p>${uiText("secret.setup.body", { total, deckLabel })}</p>
        <div class="secret-teacher-panel">
          <label class="secret-answer-field">
            <span>${uiText("secret.answer.label")}</span>
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
            <span>${uiText("secret.showNumber")}</span>
          </label>
          <p class="secret-answer-status" id="secretAnswerStatus">${statusText}</p>
        </div>
        <button class="reveal-action" data-reveal-secret type="button" ${hasValidAnswer ? "" : "disabled"}>${uiText("secret.reveal")}</button>
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
      ? `<span>${uiText("secret.correct")}</span>`
      : "";
    return `
      <button class="secret-place-option ${stateClass}" data-card-key="${cardKey(place)}" type="button">
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
    status.textContent = uiText("secret.status.set");
    revealButton.disabled = false;
    return;
  }

  status.textContent = uiText("secret.status.prompt", { total: total || 0 });
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
      if (status) status.textContent = uiText("secret.status.needAnswer");
      return;
    }

    if (option.dataset.cardKey === cardKey(lastSecretCard)) {
      renderSecretPlace(lastSecretCard, true);
      return;
    }

    option.classList.add("is-wrong");
    if (!option.querySelector("span")) option.insertAdjacentHTML("beforeend", `<span>${uiText("secret.wrong")}</span>`);
  });

  const revealButton = cardGrid.querySelector("[data-reveal-secret]");
  revealButton?.addEventListener("click", () => {
    updateSecretAnswerState();
    if (lastSecretCard) renderSecretPlace(lastSecretCard, true);
  });

  const restartButton = cardGrid.querySelector("[data-restart-secret]");
  restartButton?.addEventListener("click", restartSecretPlaceRound);
}

function restartSecretPlaceRound() {
  secretAnswerIndex = "";
  secretShowAnswerNumber = false;
  secretRevealed = false;
  lastSecretCard = null;
  renderSecretPlace(null, false);
}

function resetSecretPlaceState() {
  if (activeMode.cardMode !== "secretPlace") return;
  secretAnswerIndex = "";
  secretRevealed = false;
  lastSecretCard = null;
}

function refreshSecretPlaceBoard() {
  if (activeMode.cardMode !== "secretPlace") return;
  renderSecretPlace(lastSecretCard, secretRevealed);
}

function drawResult() {
  const count = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1));

  if (activeMode.cardMode === "itemEnvironment") {
    const lockedEnvironment = lockEnvironment && currentStageCard?.deckId === activeSecondaryLibrary
      ? currentStageCard
      : null;
    const environment = lockedEnvironment || pickFrom(activeSecondaryLibrary, 1)[0];
    const cards = pickFrom(activeLibrary, count);
    if (!environment || cards.length < count) return renderPoolWarning();
    renderCombo(environment, cards, "本輪異境");
    markDrawn(lockedEnvironment ? cards : [environment, ...cards]);
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

  if (activeMode.cardMode === "metaphorCompass") {
    const lockedPrefix = metaphorLocks.prefix ? currentMetaphorCards?.prefix : null;
    const lockedRelation = metaphorLocks.relation ? currentMetaphorCards?.relation : null;
    const lockedSuffix = metaphorLocks.suffix ? currentMetaphorCards?.suffix : null;
    const prefix = lockedPrefix || pickFromAvailable(metaphorPrefixDeck, 1)[0];
    const suffixExcludedKeys = new Set(prefix?.deckId === metaphorSuffixDeck ? [cardKey(prefix)] : []);
    const suffix = lockedSuffix || pickFromAvailable(metaphorSuffixDeck, 1, suffixExcludedKeys)[0];
    const newRelation = lockedRelation ? [] : pickFrom(activeSecondaryLibrary, 1);
    if (!prefix || !suffix || (!lockedRelation && !newRelation.length)) return renderPoolWarning();

    const relation = lockedRelation || newRelation[0];
    const drawnCards = [prefix, relation, suffix];
    renderMetaphorCompass([prefix, suffix], relation);
    markDrawn(drawnCards.filter((card) => card !== lockedPrefix && card !== lockedRelation && card !== lockedSuffix));
    return drawnCards;
  }

  if (activeMode.cardMode === "secretPlace") {
    const places = selectedCardsFrom(activeLibrary);
    if (!places.length) return renderPoolWarning();
    lastSecretCard = secretCardFromIndex(secretAnswerIndex);
    secretRevealed = false;
    currentStageCard = {
      name: "秘密選號已開啟",
      lore: `目前有 ${places.length} 個「${decks[activeLibrary]?.label || "詞庫"}」候選，請輸入秘密編號。`,
      icon: activeMode.icon,
      deckLabel: decks[activeLibrary]?.label || activeMode.primaryLabel
    };
    renderSecretPlace(lastSecretCard, false);
    return [currentStageCard];
  }

  if (activeMode.cardMode === "salesPitch") {
    const items = salesVariant === "need" ? [] : pickFrom(activeLibrary, count);
    const needs = salesVariant === "item" ? [] : pickFrom(activeSecondaryLibrary, count);
    if ((salesVariant !== "need" && items.length < count) || (salesVariant !== "item" && needs.length < count)) return renderPoolWarning();
    renderSalesPitch(items, needs);
    markDrawn([...items, ...needs]);
    return [...items, ...needs];
  }

  const cards = pickFrom(activeLibrary, count);
  if (cards.length < count) return renderPoolWarning();
  cardGrid.innerHTML = cards.map((card) => cardMarkup(card)).join("");
  markDrawn(cards);
  return cards;
}

function reelPoolForActiveMode() {
  if (activeMode.cardMode === "salesPitch") {
    if (salesVariant === "need") return selectedCardsFrom(activeSecondaryLibrary);
    if (salesVariant === "combo") return [...selectedCardsFrom(activeLibrary), ...selectedCardsFrom(activeSecondaryLibrary)];
    return selectedCardsFrom(activeLibrary);
  }
  if (activeMode.cardMode === "metaphorCompass") {
    return [...selectedCardsFrom(activeLibrary), ...selectedCardsFrom(activeSecondaryLibrary)];
  }
  return activeSecondaryLibrary ? selectedCardsFrom(activeSecondaryLibrary) : selectedCardsFrom(activeLibrary);
}

function shouldSkipReelAnimation() {
  return activeMode.cardMode === "itemEnvironment"
    && lockEnvironment
    && currentStageCard?.deckId === activeSecondaryLibrary;
}

function finishDraw(selected) {
  if (!selected.length) {
    renderReelCard(null, "抽選池不足");
  } else {
    rememberDraw(selected);
    const first = selected[0];
    if (activeMode.cardMode === "secretPlace") renderReelCard(currentStageCard);
    else if (activeMode.cardMode === "salesPitch") renderReelCard(first);
    else if (activeMode.cardMode === "metaphorCompass") renderReelCard(first);
    else if (shouldSkipReelAnimation()) renderReelCard(currentStageCard);
    else if (!activeSecondaryLibrary) renderReelCard(first);
  }
  reel.classList.remove("is-spinning");
  isDrawing = false;
  drawButton.disabled = false;
  renderAll();
}

function spinDraw() {
  if (isDrawing) return;

  isDrawing = true;
  drawButton.disabled = true;

  if (shouldSkipReelAnimation()) {
    finishDraw(drawResult());
    return;
  }

  reel.classList.add("is-spinning");

  const reelPool = reelPoolForActiveMode();

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
    finishDraw(drawResult());
  }, 1000);
}

function setMode(modeId) {
  activeMode = modes.find((mode) => mode.id === modeId) || activeMode;
  activeLibrary = activeMode.primaryDeck;
  activeSecondaryLibrary = activeMode.secondaryDeck || "";
  activePreview = activeMode.cardMode === "salesPitch" ? activeMode.primaryDeck : activeMode.secondaryDeck || activeMode.primaryDeck;
  lastSecretCard = null;
  currentStageCard = null;
  secretRevealed = false;
  secretAnswerIndex = "";
  secretShowAnswerNumber = false;
  salesVariant = "item";
  lockEnvironment = false;
  metaphorPrefixDeck = activeMode.metaphorDecks?.[0] || activeMode.primaryDeck;
  metaphorSuffixDeck = activeMode.metaphorDecks?.[0] || activeMode.primaryDeck;
  metaphorLocks = { prefix: false, relation: false, suffix: false };
  currentMetaphorCards = null;
  selectedEditCard = null;
  selectedEditTarget = null;
  for (const deckId of activeDeckIds()) ensureDeckSelection(deckId);
  renderAll();
  if (activeMode.cardMode === "secretPlace") renderSecretPlace(null, false);
  else renderEmptyState();
  updateEditPanel();
}

function renderAll() {
  renderModeButtons();
  renderActivity();
  renderDeckControls();
  renderPrompts();
  renderLibraryTools();
  renderTokenCloud();
  renderDrawHistory();
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
  if (shouldSwitchPrimaryDeckWithPreview()) {
    activeLibrary = activePreview;
    resetSecretPlaceState();
  }
  renderAll();
  refreshSecretPlaceBoard();
});

fixedPools.addEventListener("click", (event) => {
  const primaryButton = event.target.closest("[data-primary-variant]");
  if (primaryButton) {
    activeLibrary = primaryButton.dataset.primaryVariant;
    activePreview = activeLibrary;
    renderAll();
    return;
  }

  const button = event.target.closest("[data-sales-variant]");
  if (!button) return;
  salesVariant = button.dataset.salesVariant;
  renderAll();
});

fixedPools.addEventListener("change", (event) => {
  const metaphorDeckSelect = event.target.closest("[data-metaphor-deck]");
  if (metaphorDeckSelect) {
    const part = metaphorDeckSelect.dataset.metaphorDeck;
    if (part === "prefix") {
      metaphorPrefixDeck = metaphorDeckSelect.value;
      metaphorLocks.prefix = false;
    }
    if (part === "suffix") {
      metaphorSuffixDeck = metaphorDeckSelect.value;
      metaphorLocks.suffix = false;
    }
    activePreview = metaphorDeckSelect.value;
    renderAll();
    return;
  }

  const metaphorCheckbox = event.target.closest("[data-lock-metaphor]");
  if (metaphorCheckbox) {
    metaphorLocks[metaphorCheckbox.dataset.lockMetaphor] = metaphorCheckbox.checked;
    renderAll();
    return;
  }

  const checkbox = event.target.closest("[data-lock-environment]");
  if (!checkbox) return;
  lockEnvironment = checkbox.checked;
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
  resetSecretPlaceState();
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
  resetSecretPlaceState();
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
  resetSecretPlaceState();
  renderAll();
  refreshSecretPlaceBoard();
});

clearCards.addEventListener("click", () => {
  setDeckSelection(activePreview, false);
  resetSecretPlaceState();
  renderAll();
  refreshSecretPlaceBoard();
});

resetActivePool.addEventListener("click", () => {
  resetModeSelections();
  resetSecretPlaceState();
  renderAll();
  refreshSecretPlaceBoard();
});

ensureEditPanel();
renderStaticUiText();
setMode(activeMode.id);
