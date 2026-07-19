const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const savedImageLayouts = window.DEBATE_IMAGE_LAYOUTS || {};
const uiTexts = window.DEBATE_UI_TEXTS || {};
const modeLifecycle = window.DEBATE_MODE_LIFECYCLE || {};
const modeControllers = window.DEBATE_MODE_CONTROLLERS || {};
const { iconFor } = window;

if (!decks.needs && decks.concepts) {
  decks.needs = {
    label: "需求卡",
    icon: "◇",
    cards: (decks.concepts.cards || []).filter((card) => (card.rarity || "") === "需求")
  };
}

const DEFAULT_IMAGE_LAYOUT = { scale: 1, x: 0, y: 0, rotate: 0, overlay: 0.28 };
const EDIT_MODE = new URLSearchParams(window.location.search).get("edit") === "1";
const EDIT_STORAGE_KEY = "debatevision-image-layouts-draft";
const HISTORY_STORAGE_KEY = "debatevision-draw-history";
const TIMER_STORAGE_KEY = "debatevision-floating-timer";
const HISTORY_LIMIT = 10;

let activeMode = modes[0];
let activityMenuOpen = false;
let activeLibrary = activeMode.primaryDeck;
let activeSecondaryLibrary = activeMode.secondaryDeck || "";
let activePreview = activeMode.secondaryDeck || activeMode.primaryDeck;
let isDrawing = false;
let lastSecretCard = null;
let currentStageCard = null;
let secretRevealed = false;
let secretAnswerIndex = "";
let secretShowAnswerNumber = false;
let salesVariant = "supply";
let salesNoConcept = false;
let salesAudienceDeck = "creatures";
let summonCategorySelection = new Set(["異族", "超能", "特職"]);
let survivalVariant = "survival";
let survivalDeckSelection = new Set(["items"]);
let survivalGroupCount = 3;
let survivalItemCount = 4;
let survivalRoleCount = 3;
let survivalCreatureCount = 0;
let survivalAlienCount = 0;
let survivalPowerCount = 0;
let survivalSpecialistCount = 0;
let lockEnvironment = false;
let noEnvironment = false;
let selectedImportanceDecks = new Set();
let metaphorVariant = "concrete";
let metaphorPrefixDeck = "";
let metaphorSuffixDeck = "";
let metaphorLocks = { prefix: false, relation: false, suffix: false };
let currentMetaphorCards = null;
let selectedCardKeysByScope = {};
let imageLayouts = mergeImageLayouts(savedImageLayouts, readDraftLayouts());
let drawHistoryByMode = readDrawHistory();
let timerState = readTimerState();
let timerInterval = null;
let selectedEditCard = null;
let selectedEditTarget = null;

const defaultUiTexts = {
  "section.drawn.eyebrow": "Drawn Cards",
  "section.drawn.title": "本輪卡牌",
  "section.library.eyebrow": "Lexicon",
  "section.library.title": "本局抽選池",
  "button.pool.selectAll": "全選目前牌組",
  "button.pool.clear": "取消目前牌組",
  "button.pool.reset": "重置本玩法",
  "label.drawCount": "抽取數量",
  "control.note.default": "牌組已依玩法固定；下方抽選池可取消本局不想抽到的卡。",
  "reel.ready.title": "準備抽卡",
  "reel.ready.subtitle": "抽出後，這裡會顯示本輪結果。",
  "reel.ready.subtitle.environment": "抽出後，這裡會顯示本輪異境。",
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

const modeGrid = document.querySelector("#modeGrid");
const activityMenuToggle = document.querySelector("#activityMenuToggle");
const activityMenu = document.querySelector("#activityMenu");
const activityMenuPanel = activityMenu?.querySelector(".activity-menu-panel");
const mobileHomeScreen = document.querySelector("#mobileHomeScreen");
const mobileHomeGrid = document.querySelector("#mobileHomeGrid");
const playArea = document.querySelector(".play-area");
const controlBand = document.querySelector(".control-band");
const cardDictionaryPanel = document.querySelector(".card-dictionary-panel");
const libraryBand = document.querySelector(".library-band");
const mobileModeBanner = document.querySelector("#mobileModeBanner");
const mobileModeEmblem = document.querySelector("#mobileModeEmblem");
const mobileModeTrack = document.querySelector("#mobileModeTrack");
const mobileModeTitle = document.querySelector("#mobileModeTitle");
const mobileModeRule = document.querySelector("#mobileModeRule");
const mobileSurvivalDashboard = document.querySelector("#mobileSurvivalDashboard");
const mobileResultActions = document.querySelector("#mobileResultActions");
const mobileCardModal = document.querySelector("#mobileCardModal");
const mobileCardModalTitle = document.querySelector("#mobileCardModalTitle");
const mobileCardModalList = document.querySelector("#mobileCardModalList");
const mobileArtModal = document.querySelector("#mobileArtModal");
const mobileArtModalTitle = document.querySelector("#mobileArtModalTitle");
const mobileArtPreview = document.querySelector("#mobileArtPreview");
const deckSelect = document.querySelector("#deckSelect");
const primaryDeckField = document.querySelector("#primaryDeckField");
const secondaryDeckSelect = document.querySelector("#secondaryDeckSelect");
const secondaryDeckField = document.querySelector("#secondaryDeckField");
const primaryDeckLabel = document.querySelector("#primaryDeckLabel");
const secondaryDeckLabel = document.querySelector("#secondaryDeckLabel");
const fixedPools = document.querySelector("#fixedPools");
const drawCount = document.querySelector("#drawCount");
const drawCountField = drawCount.closest(".field");
const drawCountLabel = drawCountField.querySelector("[data-ui-text]");
const drawButton = document.querySelector("#drawButton");
const quickResetActivePool = document.querySelector("#quickResetActivePool");
const reel = document.querySelector("#reel");
const cardGrid = document.querySelector("#cardGrid");
const drawHistory = document.querySelector("#drawHistory");
const cardDictionary = document.querySelector("#cardDictionary");
const drawDictionaryCards = document.querySelector("#drawDictionaryCards");
const clearDictionaryDecks = document.querySelector("#clearDictionaryDecks");
const dictionaryResult = document.querySelector("#dictionaryResult");
const libraryTools = document.querySelector("#libraryTools");
const tokenCloud = document.querySelector("#tokenCloud");
const selectAllCards = document.querySelector("#selectAllCards");
const clearCards = document.querySelector("#clearCards");
const resetActivePool = document.querySelector("#resetActivePool");
let resetConfirmActive = false;
let resetConfirmTimer = null;
const scenePreview = document.querySelector("#scenePreview");
const sceneEmblem = document.querySelector("#sceneEmblem");
const sceneBadge = document.querySelector("#sceneBadge");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneDescription = document.querySelector("#sceneDescription");
const controlNote = document.querySelector("#controlNote");
const dictionaryDeckSelections = new Set();
const dictionaryCardSelections = new Set();
let dictionaryActiveDeck = "";
let mobileEditingDeck = "";
const deckDictionary = {
  worlds: "特殊的世界觀，適合發揮想像力，需要臨機應變與危機判斷。",
  creatures: "我們的好朋友或者小生命，適合比較特色、建立觀察角度與討論生命關係。",
  items: "具體可操作的道具與物件，適合練用途發想、銷售包裝與生存策略。",
  roles: "不同身份與職業，適合練自我辯護、價值比較與團隊分工。",
  locations: "各種可能所在位置，適合推理、提問、排除法與情境觀察。",
  celebrities: "不同文化、領域與時代的真實人物，適合比較影響力與建立判準。",
  needs: "人們心中的需求與動機，適合銷售、心理洞察與價值連結。",
  concepts: "抽象概念與價值詞，適合隱喻、定義、哲學思考與概念辯護。",
  relations: "連接兩個詞的關係詞，適合造句、隱喻羅盤與因果比較。",
  missions: "現實世界中的具體任務，適合練策略設計、可行性檢查與風險回應。",
  summons: "被召喚出的角色與身份，適合把特殊能力轉成現實方案並接受質疑。"
};
const dictionaryDeckOrder = ["worlds", "creatures", "items", "roles", "locations", "celebrities", "needs", "concepts", "relations", "missions", "summons"];
const derivedDeckIds = new Set(["needs"]);
const hiddenImportanceDecks = new Set([...derivedDeckIds]);
const hiddenSalesAudienceDecks = new Set(["items", "needs", "concepts", "relations", "missions"]);

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

function readTimerState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(TIMER_STORAGE_KEY) || "{}");
    const wasHidden = Boolean(stored.hidden);
    const mobileTimerDefault = window.matchMedia?.("(max-width: 560px)")?.matches;
    return {
      elapsed: 0,
      running: false,
      startedAt: 0,
      ...stored,
      collapsed: Boolean(stored.collapsed || wasHidden || mobileTimerDefault)
    };
  } catch {
    return { elapsed: 0, running: false, startedAt: 0, collapsed: true };
  }
}

function saveTimerState() {
  window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerSnapshot()));
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
    scale: Math.min(4, Math.max(minScale, Number(nextLayout.scale) || DEFAULT_IMAGE_LAYOUT.scale)),
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

function buildHooks(name, deckId, rarity = "", context = {}) {
  if (activeMode.cardMode === "metaphorCompass") {
    if (metaphorVariant === "concrete") {
      if (deckId === "relations") {
        return [`說明「${name}」要求的是相似、象徵還是聯想。`, "找出比喻最容易被質疑的地方。", "嘗試換一個更精準的比喻關係。"];
      }
      return [`找出「人生」和「${name}」的一個相似點。`, `替「人生就像${name}」找一個生活例子。`, `說明這個比喻的限制或例外。`];
    }
    if (deckId === "relations") {
      return [`說明「${name}」讓兩個概念形成什麼關係。`, `找出這個關係最容易被質疑的地方。`, `嘗試把這個關係換成生活中的例子。`];
    }
    return [`定義「${name}」在這句命題中的意思。`, `替「${name}」找一個具體例子。`, `回應一個針對「${name}」的反例。`];
  }

  if (activeMode.cardMode === "salesPitch" && deckId === "needs") {
    return [`說明「${name}」常出現在哪些生活情境。`, `找出能滿足「${name}」的商品或服務。`, `包裝一個讓人願意為「${name}」付錢的故事。`];
  }

  if (Array.isArray(activeMode.cardHooks) && activeMode.cardHooks.length) {
    return activeMode.cardHooks.map((hook) => fillCardHookTemplate(hook, name, { ...context, deckId, rarity }));
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

function fillCardHookTemplate(template, name, context = {}) {
  const values = {
    name,
    card: name,
    role: context.role || context.roleName || name,
    roleName: context.roleName || context.role || name,
    mission: context.mission || context.missionName || "",
    missionName: context.missionName || context.mission || "",
    environment: context.environment || context.environmentName || "",
    environmentName: context.environmentName || context.environment || "",
    item: context.item || context.itemName || (context.deckId === "items" ? name : ""),
    itemName: context.itemName || context.item || (context.deckId === "items" ? name : ""),
    profession: context.profession || context.professionName || (context.deckId === "roles" ? name : ""),
    professionName: context.professionName || context.profession || (context.deckId === "roles" ? name : ""),
    "卡牌名稱": name,
    "角色": context.role || context.roleName || name,
    "任務": context.mission || context.missionName || "",
    "異境": context.environment || context.environmentName || "",
    "環境": context.environment || context.environmentName || "",
    "道具": context.item || context.itemName || (context.deckId === "items" ? name : ""),
    "物品": context.item || context.itemName || (context.deckId === "items" ? name : ""),
    "職業": context.profession || context.professionName || (context.deckId === "roles" ? name : "")
  };
  let text = String(template || "");
  for (const [key, value] of Object.entries(values)) {
    text = text
      .replaceAll(`{${key}}`, value)
      .replaceAll(`{{${key}}}`, value);
  }
  return text;
}

function cardsFrom(deckId) {
  return (decks[deckId]?.cards || []).map((card) => normalizeCard(card, deckId));
}

function cardKey(card) {
  return `${card.deckId}::${card.rarity || "C"}::${card.name}`;
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
  const order = { A: 1, B: 2, C: 3, N: 4, 概念: 5, 需求: 6 };
  return order[rarity] || 99;
}

function raritiesFrom(deckId) {
  return [...new Set(cardsFrom(deckId).map((card) => card.rarity || "C"))]
    .sort((a, b) => rarityOrder(a) - rarityOrder(b) || a.localeCompare(b));
}

function rarityDisplayName(rarity) {
  if (rarity === "概念") return "概念卡";
  if (rarity === "需求") return "需求卡";
  if (summonCategories.includes(rarity)) return `${rarity}卡`;
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

function resetDeckSelectionToDefault(deckId) {
  if (!deckId) return;
  selectedCardKeysByScope[selectionScope(deckId)] = new Set(defaultCardsForDeck(deckId).map((card) => cardKey(card)));
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

const summonCategories = ["異族", "超能", "特職"];

function summonCategoryLabel(category) {
  return `${category}卡`;
}

function selectedSummonCards() {
  return selectedCardsFrom("summons").filter((card) => summonCategorySelection.has(card.rarity || ""));
}

function defaultSummonCategorySelection(mode = activeMode) {
  return mode.cardMode === "salesPitch"
    ? new Set(["異族"])
    : new Set(["異族", "超能", "特職"]);
}

function selectedSalesAudienceCards() {
  ensureSalesAudienceDeck();
  if (salesAudienceDeck === "summons") return selectedSummonCards();
  return selectedCardsFrom(salesAudienceDeck);
}

function orderedDeckIds(options = {}) {
  const includeDerived = Boolean(options.includeDerived);
  const preferred = [
    ...dictionaryDeckOrder.filter((deckId) => decks[deckId]),
    ...Object.keys(decks).filter((deckId) => !dictionaryDeckOrder.includes(deckId))
  ];
  return preferred.filter((deckId, index, list) => (
    list.indexOf(deckId) === index &&
    decks[deckId] &&
    (includeDerived || !derivedDeckIds.has(deckId))
  ));
}

function salesAudienceDeckIds() {
  return orderedDeckIds().filter((deckId) => !hiddenSalesAudienceDecks.has(deckId));
}

function defaultSalesAudienceDeck() {
  const audienceDecks = salesAudienceDeckIds();
  if (audienceDecks.includes("summons")) return "summons";
  return audienceDecks[0] || "";
}

function ensureSalesAudienceDeck() {
  const audienceDecks = salesAudienceDeckIds();
  if (audienceDecks.includes(salesAudienceDeck)) return;
  salesAudienceDeck = defaultSalesAudienceDeck();
}

function salesVariantLabel(variant = salesVariant) {
  return {
    supply: "供需版",
    story: "故事版",
    target: "目標版"
  }[variant] || "供需版";
}

function salesVariantRule(variant = salesVariant) {
  return {
    supply: "供需版：你的產品如何滿足客戶們的專屬需求？",
    story: "故事版：先抽概念，再抽商品，替商品鋪陳一個有記憶點的故事。",
    target: "目標版：先抽目標，再抽商品，判斷產品該怎麼賣給不同客戶。"
  }[variant] || activeMode.controlRule || uiText("control.note.default");
}

function modeStatusKey(mode = activeMode) {
  if (mode.cardMode === "itemEnvironment") {
    if (survivalVariant === "battle") return "battle";
    if (noEnvironment) return "survival_no_environment";
    return "survival";
  }

  if (mode.cardMode === "salesPitch") {
    if (salesVariant === "story" && salesNoConcept) return "story_no_concept";
    if (salesVariant === "target") return `target_${salesAudienceDeck}`;
    return salesVariant;
  }

  if (mode.cardMode === "metaphorCompass") return metaphorVariant;
  if (mode.cardMode === "importanceDuel") return "duel";
  if (mode.cardMode === "secretPlace") return activeLibrary ? `deck_${activeLibrary}` : "default";
  if (mode.cardMode === "summonMission") return "summon";
  if (mode.cardMode === "cardDictionary") return "dictionary";
  return "default";
}

function modeStatusText(mode = activeMode) {
  const rules = mode.statusRules || {};
  const key = modeStatusKey(mode);
  const fallbackKey = key.startsWith("target_")
    ? "target"
    : key.startsWith("deck_")
      ? "default"
      : "";
  return rules[key]
    || (fallbackKey ? rules[fallbackKey] : "")
    || rules.default
    || mode.controlRule
    || (mode.cardMode === "salesPitch" ? salesVariantRule() : "")
    || uiText("control.note.default");
}

function availableDeckIdsForMode(mode = activeMode) {
  if (mode.cardMode === "importanceDuel") return importanceAvailableDeckIds(mode);
  if (mode.cardMode === "secretPlace" || mode.cardMode === "cardDictionary") return orderedDeckIds();
  if (Array.isArray(mode.availableDecks) && mode.availableDecks.length) {
    return mode.availableDecks.filter((deckId) => decks[deckId]);
  }
  if (mode.cardMode === "metaphorCompass") {
    return [mode.secondaryDeck, ...metaphorAllDeckOptions(mode)].filter((deckId) => deckId && decks[deckId]);
  }
  if (Array.isArray(mode.variantDecks) && mode.variantDecks.length) {
    const survivalExtraDecks = mode.cardMode === "itemEnvironment" ? ["creatures", "summons"] : [];
    return [mode.secondaryDeck, ...mode.variantDecks, ...survivalExtraDecks]
      .filter((deckId, index, list) => deckId && decks[deckId] && list.indexOf(deckId) === index);
  }
  if (mode.cardMode === "salesPitch") {
    return ["items", "needs", "concepts", ...salesAudienceDeckIds()]
      .filter((deckId, index, list) => decks[deckId] && list.indexOf(deckId) === index);
  }
  return [mode.secondaryDeck, mode.primaryDeck].filter(Boolean);
}

function shouldSwitchPrimaryDeckWithPreview(mode = activeMode) {
  return Array.isArray(mode.availableDecks) && mode.availableDecks.length && !mode.secondaryDeck;
}

function primaryVariantDeckIds(mode = activeMode) {
  if (Array.isArray(mode.variantDecks) && mode.variantDecks.length) {
    return mode.variantDecks.filter((deckId) => decks[deckId]);
  }
  if (mode.cardMode === "importanceDuel") {
    return importanceAvailableDeckIds(mode);
  }
  return [];
}

function variantLabel(deckId) {
  return activeMode.variantLabels?.[deckId] || (decks[deckId]?.label || deckId).replace(/卡$/, "");
}

function deckTone(deckId) {
  const baseDeck = String(deckId || "").split(":")[0];
  const tones = {
    worlds: "worlds",
    items: "items",
    roles: "roles",
    creatures: "creatures",
    locations: "locations",
    concepts: "concepts",
    relations: "relations",
    celebrities: "celebrities",
    summons: "summons",
    missions: "missions",
    needs: "needs"
  };
  return tones[baseDeck] || "default";
}

function resetModeSelections() {
  for (const deckId of availableDeckIdsForMode()) {
    resetDeckSelectionToDefault(deckId);
  }
  resetImportanceDeckSelection();
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
  if (activeMode.cardMode === "itemEnvironment") {
    return survivalVariant === "battle"
      ? `冒險版：${survivalGroupCount} 組`
      : `求生版：${survivalActiveDeckIds().map((deckId) => variantLabel(deckId)).join(" + ")}`;
  }
  if (activeMode.cardMode === "salesPitch") {
    return salesVariantLabel();
  }
  if (activeMode.cardMode === "metaphorCompass") {
    const variantLabel = metaphorVariantLabel();
    const prefixLabel = decks[metaphorPrefixDeck]?.label || "";
    const suffixLabel = decks[metaphorSuffixDeck]?.label || "";
    if (metaphorVariant === "concrete") return `${variantLabel}：人生 → ${suffixLabel}`;
    return prefixLabel && suffixLabel ? `${variantLabel}：${prefixLabel} → ${suffixLabel}` : variantLabel;
  }
  if (activeMode.cardMode === "secretPlace") return decks[activeLibrary]?.label || "";
  if (activeMode.cardMode === "importanceDuel") {
    return importanceActiveDeckIds().map((deckId) => variantLabel(deckId)).join(" + ");
  }
  const variantDecks = primaryVariantDeckIds();
  if (variantDecks.length) return variantLabel(activeLibrary);
  return "";
}

function resetImportanceDeckSelection(mode = activeMode) {
  if (mode.cardMode !== "importanceDuel") return;
  const available = importanceAvailableDeckIds(mode);
  const defaultDeck = mode.primaryDeck && available.includes(mode.primaryDeck) ? mode.primaryDeck : available[0];
  selectedImportanceDecks = new Set(defaultDeck ? [defaultDeck] : []);
}

function importanceAvailableDeckIds(mode = activeMode) {
  const explicitDecks = Array.isArray(mode.availableDecks) && mode.availableDecks.length
    ? mode.availableDecks
    : orderedDeckIds({ includeDerived: true });
  return explicitDecks.filter((deckId) => decks[deckId] && !hiddenImportanceDecks.has(deckId));
}

function survivalActiveDeckIds(mode = activeMode) {
  if (mode.cardMode !== "itemEnvironment" || survivalVariant !== "survival") return [];
  const available = primaryVariantDeckIds(mode);
  const selected = available.filter((deckId) => survivalDeckSelection.has(deckId));
  if (selected.length) return selected;
  const fallback = mode.primaryDeck && available.includes(mode.primaryDeck) ? mode.primaryDeck : available[0];
  return fallback ? [fallback] : [];
}

function isMobileAppView() {
  return Boolean(window.matchMedia?.("(max-width: 560px)")?.matches);
}

function survivalModeLabel() {
  return survivalVariant === "battle" ? "挑戰模式" : "生存模式";
}

function survivalActionLabel() {
  return survivalVariant === "battle"
    ? uiText("mobile.itemSurvival.startBattle")
    : uiText("mobile.itemSurvival.startSurvival");
}

function survivalAgainLabel() {
  return survivalVariant === "battle"
    ? uiText("mobile.itemSurvival.againBattle")
    : uiText("mobile.itemSurvival.againSurvival");
}

function mobileActionLabel() {
  if (activeMode.cardMode === "itemEnvironment") return survivalActionLabel();
  return activeMode.drawLabel || "開始抽卡";
}

function mobileAgainLabel() {
  if (activeMode.cardMode === "itemEnvironment") return survivalAgainLabel();
  return `再次${activeMode.title}`;
}

function survivalDeckCards() {
  if (survivalVariant === "survival") {
    return primaryVariantDeckIds().map((deckId) => ({
      deckId,
      title: deckId === "items"
        ? uiText("mobile.itemSurvival.itemDeck")
        : uiText("mobile.itemSurvival.roleDeck"),
      subtitle: deckId === "items"
        ? "可以操作的資源、工具與物件"
        : "能協助求生的身份與能力",
      selected: survivalDeckSelection.has(deckId),
      count: selectedCount(deckId),
      total: cardsFrom(deckId).length,
      amount: null
    }));
  }

  return [
    ["items", "道具", "可使用的工具與資源", survivalItemCount],
    ["roles", "職業", "團隊中的專業夥伴", survivalRoleCount],
    ["creatures", "動物", "可以協助或造成變數的生物", survivalCreatureCount],
    ["summons:異族", "異族", "現實召喚中的異族角色", survivalAlienCount],
    ["summons:超能", "超能", "具備特殊能力的角色", survivalPowerCount],
    ["summons:特職", "特職", "特殊職能與任務角色", survivalSpecialistCount]
  ].map(([deckId, title, subtitle, amount]) => {
    const [baseDeck, rarity] = String(deckId).split(":");
    const totalCards = rarity
      ? cardsFrom(baseDeck).filter((card) => card.rarity === rarity).length
      : cardsFrom(baseDeck).length;
    const selectedCards = rarity
      ? selectedCardsFrom(baseDeck).filter((card) => card.rarity === rarity).length
      : selectedCount(baseDeck);
    return {
      deckId: String(deckId),
      baseDeck,
      rarity,
      title,
      subtitle,
      selected: Number(amount) > 0,
      count: selectedCards,
      total: totalCards,
      amount: Number(amount)
    };
  });
}

function mobileGenericDeckCards() {
  if (activeMode.cardMode === "itemEnvironment") return survivalDeckCards();
  if (activeMode.cardMode === "importanceDuel") {
    return importanceAvailableDeckIds(activeMode).map((deckId) => ({
      deckId,
      title: decks[deckId]?.label || variantLabel(deckId),
      subtitle: "可加入本輪比較池",
      selected: selectedImportanceDecks.has(deckId),
      count: selectedCount(deckId),
      total: cardsFrom(deckId).length
    }));
  }
  if (activeMode.cardMode === "salesPitch") {
    const deckCards = [
      { deckId: "items", title: uiText("mobile.sales.productDeck"), subtitle: "本輪要銷售的產品", selected: true }
    ];
    if (salesVariant === "supply") {
      deckCards.push({ deckId: "needs", title: uiText("mobile.sales.needDeck"), subtitle: "固定抽 1 張需求", selected: true });
    }
    if (salesVariant === "story" && !salesNoConcept) {
      deckCards.push({ deckId: "concepts", title: uiText("mobile.sales.conceptDeck"), subtitle: "固定抽 1 張故事概念", selected: true });
    }
    if (salesVariant === "target") {
      deckCards.push({
        deckId: salesAudienceDeck,
        title: decks[salesAudienceDeck]?.label || uiText("mobile.sales.targetDeck"),
        subtitle: "固定抽 1 張客戶目標",
        selected: true
      });
    }
    return deckCards.map((deck) => ({
      ...deck,
      count: deck.deckId === "summons" ? selectedSalesAudienceCards().length : selectedCount(deck.deckId),
      total: cardsFrom(deck.deckId).length
    }));
  }
  if (activeMode.cardMode === "metaphorCompass") {
    const deckCards = [];
    if (metaphorVariant !== "concrete") {
      deckCards.push({ deckId: metaphorPrefixDeck, title: uiText("mobile.metaphor.prefixDeck"), subtitle: decks[metaphorPrefixDeck]?.label || "前綴", selected: true });
    }
    deckCards.push({ deckId: activeSecondaryLibrary, title: uiText("mobile.metaphor.relationDeck"), subtitle: metaphorVariant === "concrete" ? "就像（固定）" : "連接兩個詞", selected: true });
    deckCards.push({ deckId: metaphorSuffixDeck, title: uiText("mobile.metaphor.suffixDeck"), subtitle: decks[metaphorSuffixDeck]?.label || "後綴", selected: true });
    return deckCards
      .filter((deck) => deck.deckId && decks[deck.deckId])
      .map((deck) => ({
        ...deck,
        count: selectedCount(deck.deckId),
        total: cardsFrom(deck.deckId).length
      }));
  }
  if (activeMode.cardMode === "summonMission") {
    return [
      { deckId: "missions", title: "任務卡", subtitle: "固定抽 1 張任務", selected: true, count: selectedCount("missions"), total: cardsFrom("missions").length },
      ...summonCategories.map((category) => ({
        deckId: `summons:${category}`,
        toggleValue: category,
        title: summonCategoryLabel(category),
        subtitle: "可加入本輪召喚池",
        selected: summonCategorySelection.has(category),
        count: selectedCardsFrom("summons").filter((card) => card.rarity === category).length,
        total: cardsFrom("summons").filter((card) => card.rarity === category).length
      }))
    ];
  }
  return availableDeckIdsForMode(activeMode).map((deckId) => ({
    deckId,
    title: decks[deckId]?.label || variantLabel(deckId),
    subtitle: "本輪使用卡池",
    selected: deckId === activeLibrary || deckId === activeSecondaryLibrary,
    count: selectedCount(deckId),
    total: cardsFrom(deckId).length
  }));
}

function renderMobileGenericDashboard() {
  const deckCards = mobileGenericDeckCards().map((deck) => ({
    ...deck,
    cover: mobileDeckCover(deck.deckId)
  }));
  const fixedCount = Boolean(activeMode.fixedCount || activeMode.cardMode === "metaphorCompass");
  const standardDeckUi = ["salesPitch", "summonMission", "importanceDuel"].includes(activeMode.cardMode);
  const countValue = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1));
  return window.DebateVisionMobileRender.genericDashboard({
    cardMode: activeMode.cardMode,
    actionLabel: mobileActionLabel(),
    countValue,
    deckCards,
    deckTone,
    fixedCount,
    metaphorVariant,
    metaphorVariantLabel,
    salesAudienceDeck,
    salesAudienceDeckIds: salesAudienceDeckIds(),
    salesNoConcept,
    salesVariant,
    statusText: modeStatusText(),
    standardDeckUi,
    summonCategories,
    summonCategoryLabel,
    summonCategorySelection,
    variantLabel
  });
}

function importanceActiveDeckIds(mode = activeMode) {
  if (mode.cardMode !== "importanceDuel") return [];
  const available = primaryVariantDeckIds(mode);
  const selected = available.filter((deckId) => selectedImportanceDecks.has(deckId));
  if (selected.length) return selected;
  const fallback = mode.primaryDeck && available.includes(mode.primaryDeck) ? mode.primaryDeck : available[0];
  return fallback ? [fallback] : [];
}

function cardHistoryLabel(card) {
  const deckLabel = card.deckLabel || decks[card.deckId]?.label || "卡牌";
  return `${deckLabel}：${card.name}`;
}

function rememberDraw(cards, options = {}) {
  if (!Array.isArray(cards) || !cards.length) return;
  if (activeMode.cardMode === "secretPlace" && !options.includeSecret) return;
  const scope = historyScope();
  const previousEntries = drawHistoryByMode[scope] || [];
  const latestRound = Math.max(0, ...previousEntries.map((entry) => Number(entry.roundNumber) || 0));
  const entry = {
    modeId: activeMode.id,
    modeTitle: activeMode.title,
    variant: historyVariantLabel(),
    roundNumber: latestRound + 1,
    time: new Date().toISOString(),
    cards: cards.map((card) => ({
      name: card.name,
      deckId: card.deckId,
      deckLabel: card.deckLabel || decks[card.deckId]?.label || "",
      rarity: card.rarity || ""
    }))
  };
  drawHistoryByMode[scope] = [entry, ...previousEntries].slice(0, HISTORY_LIMIT);
  saveDrawHistory();
  renderDrawHistory();
}

function rememberSecretAnswer(card) {
  if (!card) return;
  rememberDraw([card], { includeSecret: true });
}

function historyTitle(index) {
  return `第${index + 1}場`;
}

function renderDrawHistory() {
  if (!drawHistory) return;
  const entries = [...(drawHistoryByMode[historyScope()] || []).slice(0, HISTORY_LIMIT)];
  if (!entries.length) {
    drawHistory.innerHTML = `<div class="history-empty">抽卡後會在這裡保留最近十場紀錄。</div>`;
    return;
  }

  drawHistory.innerHTML = entries.map((entry, index) => `
    <article class="history-item" data-history-index="${index}" role="button" tabindex="0" aria-label="查看${historyTitle((Number(entry.roundNumber) || entries.length - index) - 1)}紀錄">
      <div class="history-item-head">
        <strong>${historyTitle((Number(entry.roundNumber) || entries.length - index) - 1)}</strong>
        ${entry.variant ? `<span>${entry.variant}</span>` : ""}
      </div>
      <div class="history-card-list">
        ${entry.cards.map((card) => `<span>${cardHistoryLabel(card)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function cardsFromHistoryEntry(entry) {
  return (entry?.cards || []).map((card) => {
    const found = cardsFrom(card.deckId).find((candidate) => candidate.name === card.name);
    return found || normalizeCard({ ...card, lore: "", hooks: [] }, card.deckId);
  });
}

function restoreHistoryEntry(index, options = {}) {
  const entries = drawHistoryByMode[historyScope()] || [];
  const entry = entries[Number(index)];
  const cards = cardsFromHistoryEntry(entry);
  if (!cards.length) return false;

  const stageCard = cards.find((card) => card.deckId === activeSecondaryLibrary) || cards[0];
  if (activeMode.cardMode === "itemEnvironment" && stageCard?.deckId === activeSecondaryLibrary) {
    renderCombo(stageCard, cards.filter((card) => cardKey(card) !== cardKey(stageCard)), "本輪異境", {
      hideStageInDesktopResults: survivalVariant === "survival"
    });
  } else {
    cardGrid.innerHTML = `<div class="combo-results">${cards.map((card) => cardMarkup(card)).join("")}</div>`;
    renderReelCard(stageCard);
  }

  if (isMobileAppView() || options.mobileResult) {
    document.body.classList.add("has-mobile-draw-result");
    setMobileHistoryVisible(false);
  }

  return true;
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

function modeCardMeta(mode) {
  return {
    palette: mode.palette || mode.tone || "cyan",
    menuLabel: mode.menuLabel || mode.track || ""
  };
}

function modeCardStyle(mode) {
  const image = mode.image || mode.backgroundImage || "";
  if (!image) return "";
  const resolvedImage = (() => {
    try {
      return new URL(image, document.baseURI).href;
    } catch {
      return image;
    }
  })();
  const safeImage = resolvedImage.replace(/"/g, "%22").replace(/\)/g, "%29");
  return ` style="--mode-card-image: url(&quot;${safeImage}&quot;)"`;
}

function modeImageCssValue(mode) {
  const image = mode.image || mode.backgroundImage || "";
  if (!image) return "";
  try {
    return `url("${new URL(image, document.baseURI).href.replace(/"/g, "%22")}")`;
  } catch {
    return `url("${image.replace(/"/g, "%22")}")`;
  }
}

function renderModeButtons() {
  const markup = modes.map((mode) => `
    <button class="mode-card ${mode.id === activeMode.id ? "is-active" : ""}" data-mode="${mode.id}" data-tone="${mode.tone}" data-palette="${modeCardMeta(mode).palette}" type="button"${modeCardStyle(mode)}>
      <span class="mode-card-top">
        <span class="mode-icon">${mode.icon}</span>
        <span class="mode-track">${modeCardMeta(mode).menuLabel}</span>
      </span>
      <span class="mode-card-body">
        <strong>${mode.title}</strong>
      </span>
    </button>
  `).join("");

  modeGrid.innerHTML = markup;
  renderActivityMenu();
}

function renderActivityMenu() {
  if (!activityMenuPanel) return;
  activityMenuPanel.innerHTML = modes.map((mode) => `
    <button class="activity-menu-item ${mode.id === activeMode.id ? "is-active" : ""}" data-menu-mode="${mode.id}" data-palette="${modeCardMeta(mode).palette}" type="button" role="menuitem">
      <span class="activity-menu-item-icon">${mode.icon}</span>
      <span class="activity-menu-copy">
        <strong>${mode.title}</strong>
        <small>${modeCardMeta(mode).menuLabel}</small>
        <em>${mode.statusRules?.default || mode.controlRule || mode.description || ""}</em>
      </span>
    </button>
  `).join("");
}

function setActivityMenu(open) {
  activityMenuOpen = Boolean(open);
  if (activityMenu) activityMenu.hidden = !activityMenuOpen;
  activityMenuToggle?.setAttribute("aria-expanded", activityMenuOpen ? "true" : "false");
}

function renderActivity() {
  const activeMeta = modeCardMeta(activeMode);
  document.body.dataset.activePalette = activeMeta.palette;
  document.body.dataset.activeMode = activeMode.id;
  const activeModeImage = modeImageCssValue(activeMode);
  if (activeModeImage) document.body.style.setProperty("--active-mode-image", activeModeImage);
  else document.body.style.removeProperty("--active-mode-image");
  if (mobileModeBanner) {
    mobileModeBanner.dataset.palette = activeMeta.palette;
    mobileModeEmblem.textContent = activeMode.icon;
    mobileModeTrack.textContent = activeMeta.menuLabel || activeMode.track || "";
    mobileModeTitle.textContent = activeMode.title;
    mobileModeRule.textContent = modeStatusText();
  }
  if (scenePreview) {
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
  }
  drawButton.textContent = activeMode.drawLabel;
  const dictionaryMode = activeMode.cardMode === "cardDictionary";
  controlBand.hidden = activeMode.cardMode === "secretPlace" || dictionaryMode;
  playArea.hidden = dictionaryMode;
  libraryBand.hidden = dictionaryMode;
  cardDictionaryPanel.hidden = !dictionaryMode;
  controlNote.textContent = activeMode.cardMode === "secretPlace"
    ? lifecycleFor().setup
    : modeStatusText();
}

function renderMobileSurvivalDashboard() {
  if (!mobileSurvivalDashboard) return;
  const active = activeMode.cardMode !== "secretPlace" && activeMode.cardMode !== "cardDictionary";
  mobileSurvivalDashboard.hidden = !active;
  if (!active) {
    mobileSurvivalDashboard.innerHTML = "";
    return;
  }

  if (activeMode.cardMode !== "itemEnvironment") {
    mobileSurvivalDashboard.innerHTML = renderMobileGenericDashboard();
    return;
  }

  const selectedDecks = survivalDeckCards().map((deck) => ({
    ...deck,
    cover: mobileDeckCover(deck.deckId)
  }));
  const environmentDeck = {
    deckId: activeMode.secondaryDeck || "worlds",
    title: "異境卡",
    selected: true,
    cover: mobileDeckCover(activeMode.secondaryDeck || "worlds")
  };
  const survivalModeActive = survivalVariant === "survival";
  const countLabel = survivalModeActive
    ? uiText("mobile.itemSurvival.drawCount")
    : uiText("mobile.itemSurvival.groupCount");
  const countValue = survivalModeActive ? Math.max(1, Math.min(6, Number(drawCount.value) || 1)) : survivalGroupCount;
  const countMin = 1;
  const countMax = survivalModeActive ? 6 : 8;

  mobileSurvivalDashboard.innerHTML = window.DebateVisionMobileRender.survivalDashboard({
    actionLabel: survivalActionLabel(),
    countLabel,
    countMax,
    countMin,
    countValue,
    deckTone,
    environmentDeck,
    selectedDecks,
    survivalModeActive
  });
}

function renderMobileResultActions() {
  if (!mobileResultActions) return;
  const active = activeMode.cardMode !== "secretPlace" && activeMode.cardMode !== "cardDictionary";
  mobileResultActions.hidden = !active;
  mobileResultActions.innerHTML = window.DebateVisionMobileRender.resultActions({
    active,
    againLabel: mobileAgainLabel()
  });
}

function mobileDeckTarget(deckId) {
  const [baseDeck, rarity] = String(deckId).split(":");
  return { baseDeck, rarity };
}

function mobileDeckCards(deckId) {
  const { baseDeck, rarity } = mobileDeckTarget(deckId);
  return cardsFrom(baseDeck)
    .map((card) => normalizeCard(card, baseDeck))
    .filter((card) => !rarity || card.rarity === rarity);
}

function mobileDeckCover(deckId) {
  const coverAssets = {
    items: "../assets/ui/deck-covers/items.jpg",
    "sales:items": "../assets/ui/deck-covers/sales-items.jpg",
    worlds: "../assets/ui/deck-covers/worlds.jpg",
    needs: "../assets/ui/deck-covers/needs.jpg",
    concepts: "../assets/ui/deck-covers/concepts.jpg",
    creatures: "../assets/ui/deck-covers/creatures.jpg",
    roles: "../assets/ui/deck-covers/roles.jpg",
    summons: "../assets/ui/deck-covers/summons.jpg",
    "summons:異族": "../assets/ui/deck-covers/summons-alien.jpg",
    "summons:超能": "../assets/ui/deck-covers/summons-power.jpg",
    "summons:特職": "../assets/ui/deck-covers/summons-specialist.jpg"
  };
  const coverKey = activeMode.cardMode === "salesPitch" && String(deckId) === "items"
    ? "sales:items"
    : String(deckId);
  const explicitCover = coverAssets[coverKey];
  if (explicitCover) {
    return {
      image: explicitCover,
      name: "",
      symbol: "",
      isDeckCover: true
    };
  }

  const { baseDeck } = mobileDeckTarget(deckId);
  const cards = mobileDeckCards(deckId);
  const selectedKeys = selectedKeysForDeck(baseDeck);
  const card = cards.find((candidate) => selectedKeys.has(cardKey(candidate))) || cards[0];
  return card ? {
    image: card.iconAsset || card.image || "",
    name: card.name,
    symbol: card.tokenIcon || iconFor(card)
  } : { image: "", name: "", symbol: "□", isDeckCover: false };
}

function mobileResourceKey(deckId) {
  return {
    items: "items",
    roles: "roles",
    creatures: "creatures",
    "summons:異族": "aliens",
    "summons:超能": "powers",
    "summons:特職": "specialists"
  }[deckId] || deckId;
}

function renderMobileCardModal() {
  if (!mobileCardModal || !mobileEditingDeck) return;
  const { baseDeck, rarity } = mobileDeckTarget(mobileEditingDeck);
  const deck = decks[baseDeck];
  if (!deck) return;
  const cards = mobileDeckCards(mobileEditingDeck);
  const selectedKeys = selectedKeysForDeck(baseDeck);
  const label = rarity || deck.label;
  const rarityGroups = (rarity ? [rarity] : raritiesFrom(baseDeck))
    .map((rarityName) => ({
      rarity: rarityName,
      cards: cards.filter((card) => (card.rarity || "C") === rarityName)
    }))
    .filter((group) => group.cards.length);
  mobileCardModalTitle.textContent = `編輯${label}`;
  mobileCardModalList.innerHTML = rarityGroups.map((group) => {
    const selectedCount = group.cards.filter((card) => selectedKeys.has(cardKey(card))).length;
    return `
      <section class="mobile-rarity-group" data-rarity="${group.rarity}">
        <div class="mobile-rarity-head">
          <strong>${rarityDisplayName(group.rarity)}</strong>
          <span>${selectedCount} / ${group.cards.length} 張</span>
        </div>
        <div class="mobile-rarity-cards">
          ${group.cards.map((card) => `
            <label class="mobile-card-choice">
              <input type="checkbox" data-mobile-card-key="${cardKey(card)}" ${selectedKeys.has(cardKey(card)) ? "checked" : ""} />
              ${tokenIconMarkup(card)}
              <span>${card.name}</span>
            </label>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function openMobileCardModal(deckId) {
  mobileEditingDeck = deckId;
  renderMobileCardModal();
  mobileCardModal.hidden = false;
}

function closeMobileCardModal() {
  mobileEditingDeck = "";
  if (mobileCardModal) mobileCardModal.hidden = true;
}

function setMobileHistoryVisible(visible) {
  document.body.classList.toggle("show-mobile-history", Boolean(visible));
}

function showMobileSetup() {
  document.body.classList.remove("has-mobile-draw-result");
  setMobileHistoryVisible(false);
  renderEmptyState();
  renderAll();
}

function sceneImageFor(card) {
  return card?.image || card?.iconAsset || "";
}

function readyReelSubtitle() {
  if (activeMode.cardMode === "itemEnvironment") return uiText("reel.ready.subtitle.environment");
  return uiText("reel.ready.subtitle");
}

function renderReelCard(card = currentStageCard, spinningName = "") {
  const title = spinningName || card?.name || uiText("reel.ready.title");
  const subtitle = card?.lore || readyReelSubtitle();
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

function metaphorVariantLabel(value = metaphorVariant) {
  return {
    concrete: "具體版",
    abstract: "抽象版",
    free: "自由版"
  }[value] || "隱喻";
}

function metaphorAllDeckOptions(mode = activeMode) {
  const base = [
    ...(mode.metaphorConcreteDecks || []),
    ...(mode.metaphorDecks || []),
    ...(mode.metaphorFreeDecks || [])
  ];
  if (!base.length) return [mode.primaryDeck];
  return [...new Set(base)].filter((deckId) => deckId && decks[deckId]);
}

function metaphorDeckOptions(part = "prefix") {
  if (metaphorVariant === "concrete") {
    return part === "suffix" ? metaphorConcreteDeckOptions() : [];
  }
  if (metaphorVariant === "free") return metaphorFreeDeckOptions();
  return metaphorAbstractDeckOptions();
}

function metaphorConcreteDeckOptions() {
  return (activeMode.metaphorConcreteDecks || ["items", "creatures"]).filter((deckId) => decks[deckId]);
}

function metaphorAbstractDeckOptions() {
  return (activeMode.metaphorDecks || [activeMode.primaryDeck]).filter((deckId) => decks[deckId]);
}

function metaphorFreeDeckOptions() {
  return (activeMode.metaphorFreeDecks || Object.keys(decks).filter((deckId) => deckId !== activeMode.secondaryDeck))
    .filter((deckId) => decks[deckId] && deckId !== activeMode.secondaryDeck);
}

function fixedMetaphorPrefixCard() {
  return {
    name: "人生",
    lore: "作為比喻句的固定前綴，讓學生先練習從日常物件或生物中找相似點。",
    icon: "人",
    tokenIcon: "人",
    rarity: "C",
    deckId: "metaphor-fixed",
    deckLabel: "固定詞",
    deckIcon: "人",
    hooks: ["說明人生和後綴詞哪裡相似。", "找出一個具體生活例子。", "補充這個比喻可能不成立的地方。"]
  };
}

function fixedMetaphorRelationCard() {
  const relation = cardsFrom(activeSecondaryLibrary).find((card) => card.name === "就像");
  return relation || {
    name: "就像",
    lore: "A 與 C 在某些特質上十分相似。",
    icon: "≈",
    tokenIcon: "≈",
    rarity: "B",
    deckId: activeSecondaryLibrary || "relations",
    deckLabel: decks[activeSecondaryLibrary]?.label || "關係卡",
    deckIcon: "→",
    hooks: ["說明兩者相似的角度。", "找一個能讓比喻成立的例子。", "指出這個比喻最容易被質疑的地方。"]
  };
}

function syncMetaphorVariantDecks() {
  if (metaphorVariant === "concrete") {
    metaphorPrefixDeck = "";
    metaphorSuffixDeck = metaphorConcreteDeckOptions().includes(metaphorSuffixDeck)
      ? metaphorSuffixDeck
      : metaphorConcreteDeckOptions()[0] || "";
    metaphorLocks = { prefix: true, relation: true, suffix: false };
    activePreview = metaphorSuffixDeck || activeSecondaryLibrary;
    return;
  }

  const options = metaphorDeckOptions("prefix");
  metaphorPrefixDeck = options.includes(metaphorPrefixDeck) ? metaphorPrefixDeck : options[0] || "";
  metaphorSuffixDeck = options.includes(metaphorSuffixDeck) ? metaphorSuffixDeck : options[0] || "";
  metaphorLocks = {
    prefix: Boolean(metaphorLocks.prefix),
    relation: Boolean(metaphorLocks.relation),
    suffix: Boolean(metaphorLocks.suffix)
  };
  activePreview = metaphorPrefixDeck || activeSecondaryLibrary;
}

function renderDeckControls() {
  primaryDeckField.hidden = true;
  secondaryDeckField.hidden = true;
  if (activeMode.cardMode === "salesPitch") ensureSalesAudienceDeck();

  primaryDeckLabel.textContent = activeMode.primaryLabel || "主要詞庫";
  secondaryDeckLabel.textContent = activeMode.secondaryLabel || "第二詞庫";

  const survivalBattleMode = activeMode.cardMode === "itemEnvironment" && survivalVariant === "battle";
  const survivalMode = activeMode.cardMode === "itemEnvironment";
  const metaphorMode = activeMode.cardMode === "metaphorCompass";
  const salesMode = activeMode.cardMode === "salesPitch";
  drawCountField.hidden = metaphorMode;
  drawCountField.classList.remove("is-ghost-control");
  drawCountField.setAttribute("aria-hidden", "false");
  controlNote.hidden = false;
  controlNote.textContent = modeStatusText();
  const fixed = activeMode.fixedCount;
  if (survivalBattleMode) {
    drawCountLabel.textContent = "隊伍數";
    drawCount.min = "1";
    drawCount.max = "8";
    drawCount.value = survivalGroupCount;
    drawCount.disabled = false;
  } else {
    drawCountLabel.textContent = uiText("label.drawCount");
    drawCount.min = "1";
    drawCount.max = "6";
    drawCount.value = fixed || Math.min(Math.max(Number(drawCount.value) || 1, 1), 6);
    drawCount.disabled = Boolean(fixed);
  }

  const primaryTotal = cardsFrom(activeLibrary).length;
  let primaryText = `${decks[activeLibrary]?.label || activeMode.primaryLabel}：${selectedCount(activeLibrary)} / ${primaryTotal} 張可抽`;
  let secondaryText = activeSecondaryLibrary
    ? activeMode.cardMode === "salesPitch"
      ? `${activeMode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
      : `${activeMode.secondaryLabel || decks[activeSecondaryLibrary]?.label}：固定抽 1 張，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`
    : "";
  if (activeMode.cardMode === "importanceDuel") {
    const activeDeckIds = importanceActiveDeckIds();
    const totalSelected = activeDeckIds.reduce((sum, deckId) => sum + selectedCount(deckId), 0);
    const totalCards = activeDeckIds.reduce((sum, deckId) => sum + cardsFrom(deckId).length, 0);
    primaryText = `已選 ${activeDeckIds.length} 個牌組：${totalSelected} / ${totalCards} 張可抽`;
    secondaryText = "";
  }
  if (activeMode.cardMode === "metaphorCompass") {
    if (metaphorVariant === "concrete") {
      primaryText = "前綴：人生（固定）";
      secondaryText = "介係：就像（固定）";
    } else {
      primaryText = `前綴：${decks[metaphorPrefixDeck]?.label || ""}，${selectedCount(metaphorPrefixDeck)} / ${cardsFrom(metaphorPrefixDeck).length} 張可抽`;
      secondaryText = `介係：${decks[activeSecondaryLibrary]?.label || ""}，${selectedCount(activeSecondaryLibrary)} / ${cardsFrom(activeSecondaryLibrary).length} 張可抽`;
    }
  }
  if (survivalBattleMode) {
    primaryText = `道具卡：${selectedCount("items")} / ${cardsFrom("items").length} 張可抽`;
  } else if (survivalMode) {
    const activeDeckIds = survivalActiveDeckIds();
    const totalSelected = activeDeckIds.reduce((sum, deckId) => sum + selectedCount(deckId), 0);
    const totalCards = activeDeckIds.reduce((sum, deckId) => sum + cardsFrom(deckId).length, 0);
    primaryText = `已選 ${activeDeckIds.map((deckId) => variantLabel(deckId)).join("、")}：${totalSelected} / ${totalCards} 張可抽`;
  }
  if (salesMode) {
    primaryText = `商品卡：${selectedCount("items")} / ${cardsFrom("items").length} 張可抽`;
    if (salesVariant === "supply") {
      secondaryText = `需求卡：固定抽 1 張，${selectedCount("needs")} / ${cardsFrom("needs").length} 張可抽`;
    } else if (salesVariant === "story") {
      secondaryText = salesNoConcept
        ? "概念卡：本輪不抽概念"
        : `概念卡：固定抽 1 張，${selectedCount("concepts")} / ${cardsFrom("concepts").length} 張可抽`;
    } else {
      const audienceCards = selectedSalesAudienceCards();
      const total = salesAudienceDeck === "summons"
        ? cardsFrom("summons").filter((card) => summonCategorySelection.has(card.rarity || "")).length
        : cardsFrom(salesAudienceDeck).length;
      secondaryText = `${decks[salesAudienceDeck]?.label || "客戶卡"}：固定抽 1 張，${audienceCards.length} / ${total} 張可抽`;
    }
  }
  const suffixText = activeMode.cardMode === "metaphorCompass"
    ? `後綴：${decks[metaphorSuffixDeck]?.label || ""}，${selectedCount(metaphorSuffixDeck)} / ${cardsFrom(metaphorSuffixDeck).length} 張可抽`
    : "";
  const survivalRoleText = survivalBattleMode
    ? `職業卡：${selectedCount("roles")} / ${cardsFrom("roles").length} 張可抽`
    : "";
  const survivalCreatureText = survivalBattleMode
    ? `動物卡：${selectedCount("creatures")} / ${cardsFrom("creatures").length} 張可抽`
    : "";
  const survivalSummonText = survivalBattleMode
    ? `召喚卡：${selectedCount("summons")} / ${cardsFrom("summons").length} 張可抽`
    : "";
  const survivalVariantTools = activeMode.cardMode === "itemEnvironment"
    ? `
      <div class="sales-variant-tools is-survival-variant" role="group" aria-label="異境求生版本">
        <button type="button" class="${survivalVariant === "survival" ? "is-active" : ""}" data-survival-variant="survival">求生版</button>
        <button type="button" class="${survivalVariant === "battle" ? "is-active" : ""}" data-survival-variant="battle">冒險版</button>
      </div>
    `
    : "";
  normalizeSurvivalAllocation();
  const survivalBattleTools = survivalBattleMode
    ? `
      <div class="survival-battle-tools" role="group" aria-label="冒險版設定">
        <div class="survival-battle-row is-resources">
          ${survivalNumberControl("items", "道具", survivalItemCount, 0, 12)}
          ${survivalNumberControl("roles", "職業", survivalRoleCount, 0, 12)}
          ${survivalNumberControl("creatures", "動物", survivalCreatureCount, 0, 12)}
          ${survivalNumberControl("aliens", "異族", survivalAlienCount, 0, 12)}
          ${survivalNumberControl("powers", "超能", survivalPowerCount, 0, 12)}
          ${survivalNumberControl("specialists", "特職", survivalSpecialistCount, 0, 12)}
        </div>
      </div>
    `
    : "";
  const salesTools = activeMode.cardMode === "salesPitch"
    ? `
      <div class="sales-variant-tools is-sales-variant" role="group" aria-label="銷售密令抽法">
        <button type="button" class="${salesVariant === "supply" ? "is-active" : ""}" data-sales-variant="supply">供需版</button>
        <button type="button" class="${salesVariant === "story" ? "is-active" : ""}" data-sales-variant="story">故事版</button>
        <button type="button" class="${salesVariant === "target" ? "is-active" : ""}" data-sales-variant="target">目標版</button>
      </div>
      ${salesVariant === "story" ? `
        <label class="environment-lock-toggle">
          <input type="checkbox" data-sales-no-concept ${salesNoConcept ? "checked" : ""} />
          <span>無概念</span>
        </label>
      ` : ""}
      ${salesVariant === "target" ? `
        <div class="sales-variant-tools is-sales-variant" role="group" aria-label="目標版客戶類型">
          ${salesAudienceDeckIds().map((deckId) => `
            <button type="button" class="${salesAudienceDeck === deckId ? "is-active" : ""}" data-sales-audience="${deckId}">
              ${deckId === "summons" ? "異族" : variantLabel(deckId)}
            </button>
          `).join("")}
        </div>
      ` : ""}
    `
    : "";
  const summonCategoryTools = activeMode.cardMode === "summonMission"
    ? `
      <div class="sales-variant-tools is-summon-variant" role="group" aria-label="現實召喚分類">
        ${summonCategories.map((category) => `
          <button type="button" class="${summonCategorySelection.has(category) ? "is-active" : ""}" data-summon-category="${category}">
            ${summonCategoryLabel(category)}
          </button>
        `).join("")}
      </div>
    `
    : "";
  const primaryVariantDecks = primaryVariantDeckIds();
  const primaryVariantTools = primaryVariantDecks.length && !survivalBattleMode
    ? `
      <div class="sales-variant-tools ${activeMode.cardMode === "importanceDuel" ? "is-multi-select is-importance-variant" : ""} ${survivalMode ? "is-multi-select is-survival-variant" : ""}" role="group" aria-label="${activeMode.title}抽選類型">
        ${primaryVariantDecks.map((deckId) => `
          <button type="button" class="${activeMode.cardMode === "importanceDuel" ? (selectedImportanceDecks.has(deckId) ? "is-active" : "is-dimmed") : survivalMode ? (survivalDeckSelection.has(deckId) ? "is-active" : "is-dimmed") : (activeLibrary === deckId ? "is-active" : "")}" data-primary-variant="${deckId}">
            ${variantLabel(deckId)}
          </button>
        `).join("")}
      </div>
    `
    : "";
  const environmentLockTool = activeMode.cardMode === "itemEnvironment" && survivalVariant === "survival"
    ? `
      <label class="environment-lock-toggle">
        <input type="checkbox" data-lock-environment ${lockEnvironment ? "checked" : ""} ${noEnvironment ? "disabled" : ""} />
        <span>鎖定異境</span>
      </label>
      <label class="environment-lock-toggle">
        <input type="checkbox" data-no-environment ${noEnvironment ? "checked" : ""} />
        <span>無異境</span>
      </label>
    `
    : "";
  const metaphorTool = metaphorMode
    ? `
      <div class="metaphor-variant-tools" role="group" aria-label="隱喻羅盤版本">
        ${["concrete", "abstract", "free"].map((variant) => `
          <button type="button" class="${metaphorVariant === variant ? "is-active" : ""}" data-metaphor-variant="${variant}">
            ${metaphorVariantLabel(variant)}
          </button>
        `).join("")}
      </div>
      <div class="metaphor-deck-tools" role="group" aria-label="隱喻羅盤詞庫選擇">
        ${metaphorVariant === "concrete" ? `<span class="metaphor-fixed-text">人生 就像</span>` : metaphorDeckSelectMarkup("prefix", "前綴", metaphorPrefixDeck)}
        ${metaphorDeckSelectMarkup("suffix", "後綴", metaphorSuffixDeck)}
      </div>
      <div class="metaphor-lock-tools" role="group" aria-label="隱喻羅盤鎖定">
        ${metaphorLockMarkup("prefix", "鎖定前綴")}
        ${metaphorLockMarkup("relation", "鎖定介係")}
        ${metaphorLockMarkup("suffix", "鎖定後綴")}
      </div>
    `
    : "";

  const poolSummary = `
    <span>${primaryText}</span>
    ${secondaryText ? `<span>${secondaryText}</span>` : ""}
    ${survivalRoleText ? `<span>${survivalRoleText}</span>` : ""}
    ${survivalCreatureText ? `<span>${survivalCreatureText}</span>` : ""}
    ${survivalSummonText ? `<span>${survivalSummonText}</span>` : ""}
    ${suffixText ? `<span>${suffixText}</span>` : ""}
  `;

  fixedPools.classList.toggle("is-survival-controls", survivalMode);
  fixedPools.innerHTML = metaphorMode
    ? `
      ${metaphorTool}
      ${poolSummary}
    `
    : survivalMode
      ? `
        <div class="survival-control-row">
          ${survivalVariantTools}
          ${survivalBattleMode ? survivalBattleTools : `${primaryVariantTools}${environmentLockTool}`}
        </div>
        <div class="survival-pool-summary">
          ${poolSummary}
        </div>
      `
    : `
      ${poolSummary}
      ${survivalVariantTools}
      ${primaryVariantTools}
      ${environmentLockTool}
      ${survivalBattleTools}
      ${salesTools}
      ${summonCategoryTools}
    `;
}

function normalizeSurvivalAllocation() {
  survivalItemCount = Math.max(0, Math.min(12, survivalItemCount));
  survivalRoleCount = Math.max(0, Math.min(12, survivalRoleCount));
  survivalCreatureCount = Math.max(0, Math.min(12, survivalCreatureCount));
  survivalAlienCount = Math.max(0, Math.min(12, survivalAlienCount));
  survivalPowerCount = Math.max(0, Math.min(12, survivalPowerCount));
  survivalSpecialistCount = Math.max(0, Math.min(12, survivalSpecialistCount));
}

function survivalCountValue(key) {
  return {
    groups: survivalGroupCount,
    items: survivalItemCount,
    roles: survivalRoleCount,
    creatures: survivalCreatureCount,
    aliens: survivalAlienCount,
    powers: survivalPowerCount,
    specialists: survivalSpecialistCount
  }[key] || 0;
}

function setSurvivalCountValue(key, value) {
  if (key === "groups") survivalGroupCount = value;
  if (["items", "roles", "creatures", "aliens", "powers", "specialists"].includes(key)) {
    if (key === "items") survivalItemCount = value;
    if (key === "roles") survivalRoleCount = value;
    if (key === "creatures") survivalCreatureCount = value;
    if (key === "aliens") survivalAlienCount = value;
    if (key === "powers") survivalPowerCount = value;
    if (key === "specialists") survivalSpecialistCount = value;
  }
}

function survivalNumberControl(key, label, value, min, max) {
  const disableMinus = value <= min;
  const disablePlus = value >= max;
  return `
    <label class="survival-number-control">
      <span>${label}</span>
      <div class="survival-stepper">
        <button type="button" data-survival-step="${key}" data-step="-1" ${disableMinus ? "disabled" : ""}>−</button>
        <input type="text" inputmode="numeric" min="${min}" max="${max}" value="${value}" data-survival-count="${key}" aria-label="${label}" />
        <button type="button" data-survival-step="${key}" data-step="1" ${disablePlus ? "disabled" : ""}>+</button>
      </div>
    </label>
  `;
}

function metaphorDeckSelectMarkup(part, label, value) {
  return `
    <label class="metaphor-deck-select">
      <span>${label}</span>
      <select data-metaphor-deck="${part}">
        ${metaphorDeckOptions(part).map((deckId) => `
          <option value="${deckId}" ${deckId === value ? "selected" : ""}>${decks[deckId].label}</option>
        `).join("")}
      </select>
    </label>
  `;
}

function metaphorLockMarkup(part, label) {
  if (metaphorVariant === "concrete" && (part === "prefix" || part === "relation")) {
    return `
      <label class="environment-lock-toggle is-disabled">
        <input type="checkbox" data-lock-metaphor="${part}" checked disabled />
        <span>${label}</span>
      </label>
    `;
  }
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

function activeDeckIds() {
  if (activeMode.cardMode === "metaphorCompass") {
    return [activeSecondaryLibrary, ...metaphorDeckOptions("prefix"), ...metaphorDeckOptions("suffix")]
      .filter((deckId, index, list) => deckId && decks[deckId] && list.indexOf(deckId) === index);
  }
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

function dictionaryDeckIds() {
  return orderedDeckIds();
}

function dictionaryDescription(deckId) {
  return deckDictionary[deckId] || `${decks[deckId]?.label || deckId} 詞庫，可用來自行組合臨時活動。`;
}

function dictionaryCardKey(deckId, cardName) {
  return `${deckId}::${cardName}`;
}

function dictionaryCardFromKey(key) {
  const [deckId, ...nameParts] = String(key).split("::");
  const name = nameParts.join("::");
  const rawCard = cardsFrom(deckId).find((card) => card.name === name);
  return rawCard ? dictionaryNormalizeCard(rawCard, deckId) : null;
}

function selectedDictionaryCards() {
  return [...dictionaryCardSelections].map((key) => dictionaryCardFromKey(key)).filter(Boolean);
}

function ensureDictionaryActiveDeck() {
  const selectedDecks = [...dictionaryDeckSelections].filter((deckId) => decks[deckId]);
  if (selectedDecks.includes(dictionaryActiveDeck)) return;
  dictionaryActiveDeck = selectedDecks[0] || "";
}

function renderCardDictionary() {
  if (!cardDictionary) return;
  ensureDictionaryActiveDeck();
  const selectedDecks = [...dictionaryDeckSelections].filter((deckId) => decks[deckId]);
  const selectedCards = selectedDictionaryCards();
  const activeCards = dictionaryActiveDeck
    ? cardsFrom(dictionaryActiveDeck).map((card) => dictionaryNormalizeCard(card, dictionaryActiveDeck))
    : [];

  cardDictionary.innerHTML = `
    <div class="dictionary-layout">
      <div class="dictionary-decks" aria-label="卡片類型">
        ${dictionaryDeckIds().map((deckId) => dictionaryDeckCardMarkup(deckId)).join("")}
      </div>
      <div class="dictionary-workbench">
        <div class="dictionary-tabs" aria-label="已啟用卡池">
          ${selectedDecks.length
            ? selectedDecks.map((deckId) => `
              <button type="button" class="${deckId === dictionaryActiveDeck ? "is-active" : ""}" data-dictionary-preview="${deckId}">
                ${decks[deckId].label}
              </button>
            `).join("")
            : `<span>${uiText("mobile.dictionary.deckHeading")}</span>`}
        </div>
        <div class="dictionary-card-picker">
          ${dictionaryActiveDeck
            ? activeCards.map((card) => dictionaryTokenMarkup(card)).join("")
            : `<div class="dictionary-empty compact">${uiText("mobile.dictionary.emptyPicker")}</div>`}
        </div>
        <div class="dictionary-tray">
          <div class="dictionary-tray-head">
            <strong>${uiText("mobile.dictionary.selectedHeading")}</strong>
            <span>${selectedCards.length} 張</span>
          </div>
          <div class="dictionary-selected-list">
            ${selectedCards.length
              ? selectedCards.map((card) => `
                <button type="button" data-remove-dictionary-card="${dictionaryCardKey(card.deckId, card.name)}">
                  ${tokenIconMarkup(card)}<span>${card.deckLabel}：${card.name}</span><strong>×</strong>
                </button>
              `).join("")
              : `<span class="dictionary-selected-empty">${uiText("mobile.dictionary.selectedEmpty")}</span>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

function dictionaryDeckCardMarkup(deckId) {
  const deck = decks[deckId];
  const checked = dictionaryDeckSelections.has(deckId);
  const selectedInDeck = [...dictionaryCardSelections].filter((key) => key.startsWith(`${deckId}::`)).length;
  return `
    <label class="dictionary-card ${checked ? "is-selected" : ""}">
      <input type="checkbox" data-dictionary-deck="${deckId}" ${checked ? "checked" : ""} />
      <span class="dictionary-icon">${deck.icon || "□"}</span>
      <span class="dictionary-copy">
        <strong>${deck.label}</strong>
        <span>${selectedInDeck ? `已選 ${selectedInDeck} 張 / ` : ""}${deck.cards.length} 張卡</span>
        <small>${dictionaryDescription(deckId)}</small>
      </span>
    </label>
  `;
}

function dictionaryTokenMarkup(card) {
  const key = dictionaryCardKey(card.deckId, card.name);
  const checked = dictionaryCardSelections.has(key);
  return `
    <label class="token dictionary-token ${checked ? "" : "is-disabled"}">
      <input type="checkbox" data-dictionary-card-key="${key}" ${checked ? "checked" : ""} />
      <span class="token-label">${tokenIconMarkup(card)}<span>${card.name}</span></span>
    </label>
  `;
}

function dictionaryHooks(card) {
  return [
    `把「${card.name}」和其他抽出的卡建立一個活動題目。`,
    `說明「${card.name}」最值得討論的一個特色。`,
    "請學生提出一個例子、用途、比較標準或反例。"
  ];
}

function dictionaryNormalizeCard(raw, deckId) {
  return {
    ...normalizeCard(raw, deckId),
    hooks: dictionaryHooks({ name: raw.name })
  };
}

function renderDictionaryResult(cards = [], saved = false) {
  if (!dictionaryResult) return;
  if (!cards.length) {
    dictionaryResult.innerHTML = `<div class="dictionary-empty">請先在上方勾選卡片類型，並選出本場要使用的卡。</div>`;
    return;
  }

  dictionaryResult.innerHTML = `
    <div class="dictionary-result-head">
      <strong>${saved ? "已儲存本場" : "本場組合"}</strong>
      <span>${cards.map((card) => card.deckLabel).join(" × ")}</span>
    </div>
    <div class="dictionary-result-grid">
      ${cards.map((card) => cardMarkup(card, "dictionary-drawn-card")).join("")}
    </div>
  `;
}

function saveDictionaryRound() {
  renderDictionaryResult(selectedDictionaryCards(), true);
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

function openMobileArtPreview(card) {
  if (!mobileArtModal || !mobileArtPreview || !card) return;
  const image = card.image || card.iconAsset || "";
  if (!image) return;
  mobileArtModalTitle.textContent = card.name;
  mobileArtPreview.innerHTML = `<img src="${image}" alt="${card.name} 全圖" />`;
  mobileArtModal.hidden = false;
}

function closeMobileArtPreview() {
  if (!mobileArtModal) return;
  mobileArtModal.hidden = true;
  if (mobileArtPreview) mobileArtPreview.innerHTML = "";
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
        <div class="editor-head-actions">
          <button class="editor-mini-button" id="editorPickMode" type="button">選活動圖</button>
          <button class="editor-mini-button" id="editorPickFirst" type="button">選第一張</button>
        </div>
      </div>
      <p class="editor-selected" id="editorSelected">先抽卡，再點一張卡牌圖片。</p>
      <div class="editor-controls">
        <label>縮放 <span id="editScaleValue">1</span><input id="editScale" type="range" min="0.5" max="4" step="0.01" value="1" /></label>
        <label>左右 <span id="editXValue">0</span><input id="editX" type="range" min="-420" max="420" step="1" value="0" /></label>
        <label>上下 <span id="editYValue">0</span><input id="editY" type="range" min="-260" max="260" step="1" value="0" /></label>
        <label>旋轉 <span id="editRotateValue">0</span><input id="editRotate" type="range" min="-45" max="45" step="1" value="0" /></label>
        <label>蒙版 <span id="editOverlayValue">0.28</span><input id="editOverlay" type="range" min="0" max="0.9" step="0.01" value="0.28" /></label>
      </div>
      <div class="editor-nudges" aria-label="方向微調">
        <button type="button" data-nudge="up" data-step="2">上</button>
        <button type="button" data-nudge="down" data-step="2">下</button>
        <button type="button" data-nudge="left" data-step="2">左</button>
        <button type="button" data-nudge="right" data-step="2">右</button>
        <button type="button" data-nudge="up" data-step="16">大上</button>
        <button type="button" data-nudge="down" data-step="16">大下</button>
        <button type="button" data-nudge="left" data-step="16">大左</button>
        <button type="button" data-nudge="right" data-step="16">大右</button>
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

  document.querySelector("#editorPickMode").addEventListener("click", () => {
    selectEditTarget(editTargetForMode(activeMode));
  });

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
    const step = Number(button.dataset.step) || 2;
    if (button.dataset.nudge === "up") layout.y -= step;
    if (button.dataset.nudge === "down") layout.y += step;
    if (button.dataset.nudge === "left") layout.x -= step;
    if (button.dataset.nudge === "right") layout.x += step;
    if (button.dataset.scale === "up") layout.scale = Math.min(4, Number((layout.scale + 0.04).toFixed(2)));
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
  scaleInput.max = "4";
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
  document.querySelector("#editScaleValue").textContent = Number(layout.scale).toFixed(2);
  document.querySelector("#editXValue").textContent = Math.round(layout.x);
  document.querySelector("#editYValue").textContent = Math.round(layout.y);
  document.querySelector("#editRotateValue").textContent = Math.round(layout.rotate);
  document.querySelector("#editOverlayValue").textContent = Number(layout.overlay).toFixed(2);
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

function timerSnapshot() {
  const elapsed = timerState.running
    ? timerState.elapsed + Math.max(0, Date.now() - timerState.startedAt)
    : timerState.elapsed;
  return {
    elapsed,
    running: timerState.running,
    startedAt: timerState.running ? timerState.startedAt : 0,
    collapsed: timerState.collapsed
  };
}

function formatTimer(ms) {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function ensureFloatingTimer() {
  if (document.querySelector("#floatingTimer")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="floating-timer ${timerState.collapsed ? "is-collapsed" : ""}" id="floatingTimer" aria-label="課堂計時器">
      <button class="timer-launcher" id="timerLauncher" type="button" aria-label="打開計時器">⏱ <span id="timerLauncherText">00:00.0</span></button>
      <div class="timer-panel" id="timerPanel">
        <div class="timer-head">
          <div>
            <p class="eyebrow">Class Timer</p>
            <h2>課堂計時</h2>
          </div>
          <div class="timer-window-actions">
            <button id="timerCollapse" type="button" aria-label="收合計時器">收合</button>
          </div>
        </div>
        <div class="timer-display" id="timerDisplay" aria-live="polite">00:00.0</div>
        <div class="timer-actions">
          <button id="timerToggle" type="button">開始</button>
          <button id="timerReset" type="button">重設</button>
        </div>
      </div>
    </aside>
  `);

  document.querySelector("#timerLauncher").addEventListener("click", () => {
    timerState.collapsed = false;
    saveTimerState();
    updateTimerUi();
  });

  document.querySelector("#timerCollapse").addEventListener("click", () => {
    timerState.collapsed = true;
    saveTimerState();
    updateTimerUi();
  });

  document.querySelector("#timerToggle").addEventListener("click", toggleTimer);
  document.querySelector("#timerReset").addEventListener("click", resetTimer);
  updateTimerUi();
  refreshTimerInterval();
}

function toggleTimer() {
  if (timerState.running) {
    timerState.elapsed = timerSnapshot().elapsed;
    timerState.running = false;
    timerState.startedAt = 0;
  } else {
    timerState.running = true;
    timerState.startedAt = Date.now();
  }
  saveTimerState();
  refreshTimerInterval();
  updateTimerUi();
}

function resetTimer() {
  timerState.elapsed = 0;
  timerState.running = false;
  timerState.startedAt = 0;
  saveTimerState();
  refreshTimerInterval();
  updateTimerUi();
}

function refreshTimerInterval() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
  if (!timerState.running) return;
  timerInterval = window.setInterval(updateTimerUi, 100);
}

function updateTimerUi() {
  const timer = document.querySelector("#floatingTimer");
  if (!timer) return;
  const elapsedText = formatTimer(timerSnapshot().elapsed);
  timer.classList.toggle("is-collapsed", timerState.collapsed);
  timer.classList.toggle("is-running", timerState.running);
  document.querySelector("#timerDisplay").textContent = elapsedText;
  document.querySelector("#timerLauncherText").textContent = elapsedText;
  document.querySelector("#timerToggle").textContent = timerState.running ? "暫停" : "開始";
}

function renderEmptyState() {
  cardGrid.innerHTML = `<div class="empty-state">${uiText("empty.default", { drawLabel: activeMode.drawLabel })}</div>`;
}

function renderPoolWarning() {
  cardGrid.innerHTML = `<div class="empty-state">${uiText("warning.pool")}</div>`;
  return [];
}

function cardWithEnvironmentHooks(card, environment) {
  const environmentName = environment?.name || "無異境";
  return {
    ...card,
    hooks: buildHooks(card.name, card.deckId, card.rarity, {
      environment: environmentName,
      environmentName,
      item: card.deckId === "items" ? card.name : "",
      itemName: card.deckId === "items" ? card.name : "",
      profession: card.deckId === "roles" ? card.name : "",
      professionName: card.deckId === "roles" ? card.name : ""
    })
  };
}

function cardWithSalesNeedHooks(card, need) {
  const productName = card.name;
  const needName = need?.name || "本輪需求";
  return {
    ...card,
    hooks: [
      `說明「${productName}」如何滿足「${needName}」。`,
      `找出最可能因為「${needName}」而購買「${productName}」的對象。`,
      `包裝一個讓人願意為「${productName}」付錢的理由。`
    ]
  };
}

function cardWithSalesStoryHooks(card, concept) {
  const productName = card.name;
  const conceptName = concept?.name || "";
  return {
    ...card,
    hooks: concept
      ? [
        `說一個「${conceptName}的${productName}」故事。`,
        `說明「${conceptName}」讓「${productName}」變得更有價值的原因。`,
        `替「${productName}」設計一句能被記住的銷售故事。`
      ]
      : [
        `替「${productName}」說一個有畫面感的故事。`,
        `說明「${productName}」背後可能代表的情緒、回憶或身份。`,
        `把「${productName}」包裝成讓人願意購買的選擇。`
      ]
  };
}

function cardWithSalesTargetHooks(card, audience) {
  const productName = card.name;
  const audienceName = audience?.name || "本輪目標";
  return {
    ...card,
    hooks: [
      `說明「${productName}」為什麼適合賣給「${audienceName}」。`,
      `找出「${audienceName}」可能在意的價格、功能或情緒價值。`,
      `設計一句能打動「${audienceName}」的銷售主張。`
    ]
  };
}

function renderCombo(environment, cards, label, options = {}) {
  currentStageCard = environment;
  renderReelCard(environment || {
    name: "無異境",
    lore: "本輪刻意不抽異境，直接用抽到的卡牌思考可行方案。",
    icon: activeMode.icon,
    deckLabel: "本輪設定"
  });
  const showStageInResults = !options.hideStageInResults;
  const showStageInDesktopResults = showStageInResults && !options.hideStageInDesktopResults;
  const stageMarkup = environment && showStageInDesktopResults ? cardMarkup(environment, "environment-card mobile-stage-result") : "";
  const mobileStageMarkup = environment && showStageInResults ? cardMarkup(environment, "environment-card mobile-stage-banner") : "";
  cardGrid.innerHTML = `
    <div class="combo-board">
      <div class="mobile-stage-lane">${mobileStageMarkup}</div>
      <div class="combo-results">
        ${stageMarkup}
        ${cards.map((card) => cardMarkup(card)).join("")}
      </div>
    </div>
  `;
}

function renderSurvivalBattle(environment, groups) {
  currentStageCard = environment;
  renderReelCard(environment);
  const groupSections = [
    ["items", "道具", "道具"],
    ["roles", "職業", "職業"],
    ["creatures", "動物", "動物"],
    ["aliens", "異族", "異族"],
    ["powers", "超能", "超能"],
    ["specialists", "特職", "特職"]
  ];
  cardGrid.innerHTML = `
    <div class="survival-battle-board">
      <div class="mobile-stage-lane">
        ${cardMarkup(environment, "environment-card mobile-stage-banner")}
      </div>
      <div class="survival-group-grid">
        ${groups.map((group) => {
          const activeSections = groupSections.filter(([key]) => group[key].length);
          const totalCards = activeSections.reduce((total, [key]) => total + group[key].length, 0);
          const summary = activeSections.map(([key, label]) => `${group[key].length} ${label}`).join(" · ");
          return `
          <section class="survival-group-card" aria-label="第 ${group.index} 組，共 ${totalCards} 張隊伍卡">
            <div class="survival-group-head">
              <div class="survival-group-title">
                <span class="survival-group-index">${group.index}</span>
                <div>
                  <strong>第 ${group.index} 組</strong>
                  <small>${totalCards} 張隊伍卡</small>
                </div>
              </div>
              <span>${summary || "尚未配置隊伍卡"}</span>
            </div>
            ${activeSections.map(([key, label, type]) => `
              <div class="survival-group-section" data-resource-type="${type}">
                <h3><span>${label}</span><b>${group[key].length}</b></h3>
                <div class="survival-mini-list">
                  ${group[key].map((card) => cardMarkup(card, "survival-member-card")).join("")}
                </div>
              </div>
            `).join("") || `<div class="survival-group-empty">請先為這一組設定隊伍卡。</div>`}
          </section>
        `}).join("")}
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

function renderMetaphorCompass(concepts, relation) {
  const [left, right] = concepts;
  currentMetaphorCards = { prefix: left, relation, suffix: right };
  const guideTitle = metaphorVariant === "concrete"
    ? `請解釋：人生為什麼「${relation.name}${right.name}」？`
    : `請解釋：為什麼「${left.name}${relation.name}${right.name}」可以成立？`;
  const guideBody = metaphorVariant === "concrete"
    ? "可以先找相似點，再提出一個生活例子，最後補充這個比喻有哪些限制。"
    : "可以先重新定義兩個概念，再提出一個具體例子，最後回應可能的反例。";
  cardGrid.innerHTML = `
    <div class="metaphor-board">
      <article class="metaphor-sentence">
        <span>${left.name}</span>
        <strong>${relation.name}</strong>
        <span>${right.name}</span>
      </article>
      <div class="metaphor-guide">
        <p>${guideTitle}</p>
        <p>${guideBody}</p>
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

function createModeContext(count = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1))) {
  return {
    count,
    get activeMode() { return activeMode; },
    get activeLibrary() { return activeLibrary; },
    get activeSecondaryLibrary() { return activeSecondaryLibrary; },
    decks,
    get drawCountValue() { return Number(drawCount.value) || 1; },
    get currentStageCard() { return currentStageCard; },
    set currentStageCard(value) { currentStageCard = value; },
    get lastSecretCard() { return lastSecretCard; },
    set lastSecretCard(value) { lastSecretCard = value; },
    get secretAnswerIndex() { return secretAnswerIndex; },
    get secretRevealed() { return secretRevealed; },
    set secretRevealed(value) { secretRevealed = value; },
    get salesVariant() { return salesVariant; },
    get salesNoConcept() { return salesNoConcept; },
    get survivalVariant() { return survivalVariant; },
    get survivalGroupCount() { return survivalGroupCount; },
    set survivalGroupCount(value) { survivalGroupCount = value; },
    get survivalItemCount() { return survivalItemCount; },
    get survivalRoleCount() { return survivalRoleCount; },
    get survivalCreatureCount() { return survivalCreatureCount; },
    get survivalAlienCount() { return survivalAlienCount; },
    get survivalPowerCount() { return survivalPowerCount; },
    get survivalSpecialistCount() { return survivalSpecialistCount; },
    get lockEnvironment() { return lockEnvironment; },
    get noEnvironment() { return noEnvironment; },
    get metaphorVariant() { return metaphorVariant; },
    get metaphorPrefixDeck() { return metaphorPrefixDeck; },
    get metaphorSuffixDeck() { return metaphorSuffixDeck; },
    get metaphorLocks() { return metaphorLocks; },
    get currentMetaphorCards() { return currentMetaphorCards; },
    cardGrid,
    buildHooks,
    cardKey,
    cardMarkup,
    cardWithEnvironmentHooks,
    cardWithSalesNeedHooks,
    cardWithSalesStoryHooks,
    cardWithSalesTargetHooks,
    fixedMetaphorPrefixCard,
    fixedMetaphorRelationCard,
    importanceActiveDeckIds,
    markDrawn,
    pickFrom,
    pickFromAvailable,
    pickFromPool,
    renderCombo,
    renderDuel,
    renderMetaphorCompass,
    renderPoolWarning,
    renderSecretPlace,
    renderSurvivalBattle,
    secretCardFromIndex,
    selectedCardsFrom,
    selectedSalesAudienceCards,
    selectedSummonCards,
    survivalActiveDeckIds
  };
}

function drawResult() {
  const count = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1));
  const controller = modeControllers[activeMode.cardMode];
  if (controller?.draw) return controller.draw(createModeContext(count));

  const cards = pickFrom(activeLibrary, count);
  if (cards.length < count) return renderPoolWarning();
  cardGrid.innerHTML = cards.map((card) => cardMarkup(card)).join("");
  markDrawn(cards);
  return cards;
}

function reelPoolForActiveMode() {
  const controller = modeControllers[activeMode.cardMode];
  if (controller?.reelPool) return controller.reelPool(createModeContext());
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
  if (selected.length && activeMode.cardMode !== "secretPlace" && activeMode.cardMode !== "cardDictionary" && isMobileAppView()) {
    document.body.classList.add("has-mobile-draw-result");
    setMobileHistoryVisible(false);
  }
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
  document.body.classList.remove("has-mobile-home");
  document.body.classList.remove("has-mobile-draw-result");
  setMobileHistoryVisible(false);
  closeMobileCardModal();
  activeMode = modes.find((mode) => mode.id === modeId) || activeMode;
  activeLibrary = activeMode.primaryDeck;
  activeSecondaryLibrary = activeMode.secondaryDeck || "";
  activePreview = activeMode.cardMode === "salesPitch" ? activeMode.primaryDeck : activeMode.secondaryDeck || activeMode.primaryDeck;
  lastSecretCard = null;
  currentStageCard = null;
  secretRevealed = false;
  secretAnswerIndex = "";
  secretShowAnswerNumber = false;
  salesVariant = "supply";
  salesNoConcept = false;
  salesAudienceDeck = defaultSalesAudienceDeck();
  summonCategorySelection = defaultSummonCategorySelection(activeMode);
  survivalVariant = "survival";
  survivalDeckSelection = new Set(["items"]);
  survivalGroupCount = 3;
  survivalItemCount = 4;
  survivalRoleCount = 3;
  survivalCreatureCount = 0;
  survivalAlienCount = 0;
  survivalPowerCount = 0;
  survivalSpecialistCount = 0;
  lockEnvironment = false;
  noEnvironment = false;
  resetImportanceDeckSelection(activeMode);
  metaphorVariant = "concrete";
  metaphorPrefixDeck = "";
  metaphorSuffixDeck = activeMode.metaphorConcreteDecks?.[0] || "items";
  metaphorLocks = { prefix: true, relation: true, suffix: false };
  if (activeMode.cardMode === "metaphorCompass") syncMetaphorVariantDecks();
  currentMetaphorCards = null;
  selectedEditCard = null;
  selectedEditTarget = null;
  for (const deckId of activeDeckIds()) ensureDeckSelection(deckId);
  renderAll();
  if (activeMode.cardMode === "secretPlace") renderSecretPlace(null, false);
  else if (activeMode.cardMode === "cardDictionary") renderDictionaryResult([]);
  else renderEmptyState();
  updateEditPanel();
  setActivityMenu(false);
}

function renderMobileHome() {
  if (!mobileHomeGrid) return;
  mobileHomeGrid.innerHTML = modes.map((mode) => `
    <button
      class="mobile-home-card"
      type="button"
      data-mobile-home-mode="${mode.id}"
      style="--home-card-image: url('${(mode.image || "").replace("../", "/")}');"
    >
      <span class="mobile-home-card-icon">${mode.icon}</span>
      <span class="mobile-home-card-copy">
        <strong>${mode.title}</strong>
        <small>${mode.menuLabel || mode.track}</small>
      </span>
      <b aria-hidden="true">›</b>
    </button>
  `).join("");
  const eyebrow = mobileHomeScreen?.querySelector("[data-mobile-home-eyebrow]");
  const title = mobileHomeScreen?.querySelector("[data-mobile-home-title]");
  const subtitle = mobileHomeScreen?.querySelector("[data-mobile-home-subtitle]");
  if (eyebrow) eyebrow.textContent = uiText("mobile.home.eyebrow");
  if (title) title.textContent = uiText("mobile.home.title");
  if (subtitle) subtitle.textContent = uiText("mobile.home.subtitle");
}

function showMobileHome() {
  if (!isMobileAppView()) return;
  document.body.classList.remove("has-mobile-draw-result");
  document.body.classList.add("has-mobile-home");
  setMobileHistoryVisible(false);
  closeMobileCardModal();
  setActivityMenu(false);
  window.scrollTo({ top: 0 });
}

function renderAll() {
  renderModeButtons();
  renderActivity();
  renderDeckControls();
  renderMobileSurvivalDashboard();
  renderMobileResultActions();
  renderLibraryTools();
  renderTokenCloud();
  renderDrawHistory();
  renderCardDictionary();
  if (!isDrawing) renderReelCard();
}

function handleModeClick(event) {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  setMode(button.dataset.mode);
}

modeGrid.addEventListener("click", handleModeClick);
activityMenuToggle?.addEventListener("click", () => {
  setActivityMenu(!activityMenuOpen);
});

activityMenu?.addEventListener("click", (event) => {
  if (event.target === activityMenu) {
    setActivityMenu(false);
    return;
  }
  const button = event.target.closest("[data-menu-mode]");
  if (!button) return;
  setMode(button.dataset.menuMode);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activityMenuOpen) setActivityMenu(false);
});

drawButton.addEventListener("click", spinDraw);
drawCount.addEventListener("input", () => {
  if (activeMode.cardMode !== "itemEnvironment" || survivalVariant !== "battle") return;
  survivalGroupCount = Math.max(1, Math.min(8, Number(drawCount.value) || 1));
});

window.DebateVisionMobileApi = {
  elements: {
    dashboard: mobileSurvivalDashboard,
    resultActions: mobileResultActions,
    cardModal: mobileCardModal,
    cardModalList: mobileCardModalList,
    drawHistory,
    bottomNav: document.querySelector(".mobile-bottom-nav"),
    mobileHomeScreen,
    mobileHomeGrid
  },
  get activeMode() { return activeMode; },
  get activeSecondaryLibrary() { return activeSecondaryLibrary; },
  get activeLibrary() { return activeLibrary; },
  set activeLibrary(value) { activeLibrary = value; },
  get activePreview() { return activePreview; },
  set activePreview(value) { activePreview = value; },
  get cardGrid() { return cardGrid; },
  get currentStageCard() { return currentStageCard; },
  set currentStageCard(value) { currentStageCard = value; },
  get drawCount() { return drawCount; },
  get drawHistoryByMode() { return drawHistoryByMode; },
  get lockEnvironment() { return lockEnvironment; },
  set lockEnvironment(value) { lockEnvironment = value; },
  get metaphorVariant() { return metaphorVariant; },
  set metaphorVariant(value) { metaphorVariant = value; },
  set currentMetaphorCards(value) { currentMetaphorCards = value; },
  get mobileEditingDeck() { return mobileEditingDeck; },
  get noEnvironment() { return noEnvironment; },
  set noEnvironment(value) { noEnvironment = value; },
  get salesAudienceDeck() { return salesAudienceDeck; },
  set salesAudienceDeck(value) { salesAudienceDeck = value; },
  get salesNoConcept() { return salesNoConcept; },
  set salesNoConcept(value) { salesNoConcept = value; },
  get salesVariant() { return salesVariant; },
  set salesVariant(value) { salesVariant = value; },
  get selectedImportanceDecks() { return selectedImportanceDecks; },
  get summonCategorySelection() { return summonCategorySelection; },
  get survivalDeckSelection() { return survivalDeckSelection; },
  get survivalGroupCount() { return survivalGroupCount; },
  set survivalGroupCount(value) { survivalGroupCount = value; },
  get survivalVariant() { return survivalVariant; },
  set survivalVariant(value) { survivalVariant = value; },
  cardKey,
  cardMarkup,
  cardsFromHistoryEntry,
  closeMobileCardModal,
  ensureSalesAudienceDeck,
  historyScope,
  isMobileAppView,
  mobileDeckCards,
  mobileDeckTarget,
  mobileResourceKey,
  openMobileCardModal,
  renderAll,
  renderMobileHome,
  renderCombo,
  renderEmptyState,
  renderMobileCardModal,
  renderReelCard,
  restoreHistoryEntry,
  resetDeckSelectionToDefault,
  selectedKeysForDeck,
  setActivityMenu,
  setMode,
  showMobileHome,
  setMobileHistoryVisible,
  setSurvivalCountValue,
  showMobileSetup,
  spinDraw,
  survivalCountValue,
  syncMetaphorVariantDecks
};

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

function handleHistoryItemOpen(item, options = {}) {
  if (!item) return;
  const restored = restoreHistoryEntry(item.dataset.historyIndex, options);
  if (!restored) return;
  drawHistory.querySelectorAll(".history-item.is-active").forEach((activeItem) => {
    activeItem.classList.remove("is-active");
  });
  item.classList.add("is-active");
  if (!options.skipScroll) {
    playArea?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

drawHistory?.addEventListener("click", (event) => {
  if (isMobileAppView()) return;
  handleHistoryItemOpen(event.target.closest("[data-history-index]"));
});

drawHistory?.addEventListener("keydown", (event) => {
  if (isMobileAppView() || (event.key !== "Enter" && event.key !== " ")) return;
  const item = event.target.closest("[data-history-index]");
  if (!item) return;
  event.preventDefault();
  handleHistoryItemOpen(item);
});

fixedPools.addEventListener("click", (event) => {
  if (handleSurvivalStep(event)) return;

  const survivalVariantButton = event.target.closest("[data-survival-variant]");
  if (survivalVariantButton) {
    survivalVariant = survivalVariantButton.dataset.survivalVariant;
    activeLibrary = "items";
    activePreview = "items";
    lockEnvironment = false;
    noEnvironment = false;
    currentStageCard = null;
    renderAll();
    renderEmptyState();
    return;
  }

  const metaphorVariantButton = event.target.closest("[data-metaphor-variant]");
  if (metaphorVariantButton) {
    metaphorVariant = metaphorVariantButton.dataset.metaphorVariant;
    currentMetaphorCards = null;
    syncMetaphorVariantDecks();
    renderAll();
    renderEmptyState();
    return;
  }

  const primaryButton = event.target.closest("[data-primary-variant]");
  if (primaryButton) {
    const deckId = primaryButton.dataset.primaryVariant;
    if (activeMode.cardMode === "importanceDuel") {
      if (selectedImportanceDecks.has(deckId) && selectedImportanceDecks.size > 1) {
        selectedImportanceDecks.delete(deckId);
      } else {
        selectedImportanceDecks.add(deckId);
      }
      activeLibrary = deckId;
      activePreview = deckId;
      renderAll();
      return;
    }
    if (activeMode.cardMode === "itemEnvironment" && survivalVariant === "survival") {
      if (survivalDeckSelection.has(deckId) && survivalDeckSelection.size > 1) {
        survivalDeckSelection.delete(deckId);
      } else {
        survivalDeckSelection.add(deckId);
      }
      activeLibrary = deckId;
      activePreview = deckId;
      renderAll();
      return;
    }
    activeLibrary = deckId;
    activePreview = activeLibrary;
    renderAll();
    return;
  }

  const button = event.target.closest("[data-sales-variant]");
  if (button) {
    salesVariant = button.dataset.salesVariant;
    if (salesVariant === "supply") activePreview = "items";
    if (salesVariant === "story") activePreview = salesNoConcept ? "items" : "concepts";
    if (salesVariant === "target") {
      ensureSalesAudienceDeck();
      activePreview = salesAudienceDeck;
    }
    renderAll();
    renderEmptyState();
    return;
  }

  const audienceButton = event.target.closest("[data-sales-audience]");
  if (audienceButton) {
    salesAudienceDeck = audienceButton.dataset.salesAudience;
    activePreview = salesAudienceDeck;
    renderAll();
    renderEmptyState();
    return;
  }

  const summonCategoryButton = event.target.closest("[data-summon-category]");
  if (!summonCategoryButton) return;
  const category = summonCategoryButton.dataset.summonCategory;
  if (summonCategorySelection.has(category)) {
    if (summonCategorySelection.size > 1) summonCategorySelection.delete(category);
  } else {
    summonCategorySelection.add(category);
  }
  renderAll();
  renderEmptyState();
});

function handleSurvivalCountInput(event) {
  const survivalCountInput = event.target.closest("[data-survival-count]");
  if (!survivalCountInput) return false;
  const key = survivalCountInput.dataset.survivalCount;
  const min = Number(survivalCountInput.min) || 0;
  const max = Number(survivalCountInput.max) || 8;
  const cleanValue = String(survivalCountInput.value || "").replace(/[^\d]/g, "");
  if (survivalCountInput.value !== cleanValue) survivalCountInput.value = cleanValue;
  const value = Math.max(min, Math.min(max, Number(cleanValue) || min));
  setSurvivalCountValue(key, value);
  return true;
}

function handleSurvivalStep(event) {
  const button = event.target.closest("[data-survival-step]");
  if (!button) return false;
  const key = button.dataset.survivalStep;
  const step = Number(button.dataset.step) || 0;
  const input = fixedPools.querySelector(`[data-survival-count="${key}"]`);
  if (!input) return false;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 8;
  const nextValue = Math.max(min, Math.min(max, survivalCountValue(key) + step));
  setSurvivalCountValue(key, nextValue);
  renderAll();
  return true;
}

fixedPools.addEventListener("input", (event) => {
  if (!handleSurvivalCountInput(event)) return;
  renderDeckControls();
});

fixedPools.addEventListener("change", (event) => {
  if (handleSurvivalCountInput(event)) {
    renderAll();
    return;
  }

  const metaphorDeckSelect = event.target.closest("[data-metaphor-deck]");
  if (metaphorDeckSelect) {
    const part = metaphorDeckSelect.dataset.metaphorDeck;
    currentMetaphorCards = null;
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

  const salesNoConceptCheckbox = event.target.closest("[data-sales-no-concept]");
  if (salesNoConceptCheckbox) {
    salesNoConcept = salesNoConceptCheckbox.checked;
    activePreview = salesNoConcept ? "items" : "concepts";
    renderAll();
    renderEmptyState();
    return;
  }

  const checkbox = event.target.closest("[data-lock-environment]");
  if (checkbox) {
    lockEnvironment = checkbox.checked;
    renderAll();
    return;
  }

  const noEnvironmentCheckbox = event.target.closest("[data-no-environment]");
  if (!noEnvironmentCheckbox) return;
  noEnvironment = noEnvironmentCheckbox.checked;
  if (noEnvironment) {
    lockEnvironment = false;
    currentStageCard = null;
  }
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

cardDictionary?.addEventListener("change", (event) => {
  const deckCheckbox = event.target.closest("[data-dictionary-deck]");
  if (deckCheckbox) {
    const deckId = deckCheckbox.dataset.dictionaryDeck;
    if (deckCheckbox.checked) {
      dictionaryDeckSelections.add(deckId);
      dictionaryActiveDeck = deckId;
    } else {
      dictionaryDeckSelections.delete(deckId);
      for (const key of [...dictionaryCardSelections]) {
        if (key.startsWith(`${deckId}::`)) dictionaryCardSelections.delete(key);
      }
    }
    renderCardDictionary();
    return;
  }

  const cardCheckbox = event.target.closest("[data-dictionary-card-key]");
  if (!cardCheckbox) return;
  if (cardCheckbox.checked) dictionaryCardSelections.add(cardCheckbox.dataset.dictionaryCardKey);
  else dictionaryCardSelections.delete(cardCheckbox.dataset.dictionaryCardKey);
  renderCardDictionary();
});

cardDictionary?.addEventListener("click", (event) => {
  const previewButton = event.target.closest("[data-dictionary-preview]");
  if (previewButton) {
    dictionaryActiveDeck = previewButton.dataset.dictionaryPreview;
    renderCardDictionary();
    return;
  }

  const removeButton = event.target.closest("[data-remove-dictionary-card]");
  if (!removeButton) return;
  dictionaryCardSelections.delete(removeButton.dataset.removeDictionaryCard);
  renderCardDictionary();
});

drawDictionaryCards?.addEventListener("click", saveDictionaryRound);

clearDictionaryDecks?.addEventListener("click", () => {
  dictionaryDeckSelections.clear();
  dictionaryCardSelections.clear();
  dictionaryActiveDeck = "";
  renderCardDictionary();
  renderDictionaryResult([]);
});

cardGrid.addEventListener("click", (event) => {
  const cardElement = event.target.closest(".battle-card[data-card-key]");
  if (!cardElement) return;
  const card = findCardByKey(cardElement.dataset.cardKey);
  if (EDIT_MODE) {
    if (card?.imageId) selectEditCard(card);
    return;
  }
  if (isMobileAppView() && event.target.closest(".card-art")) {
    openMobileArtPreview(card);
  }
});

mobileArtModal?.addEventListener("click", (event) => {
  if (event.target === mobileArtModal || event.target.closest("[data-mobile-art-close]")) {
    closeMobileArtPreview();
  }
});

if (scenePreview) {
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
}

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

function setResetConfirmState(active) {
  resetConfirmActive = active;
  for (const button of [resetActivePool, quickResetActivePool]) {
    if (!button) continue;
    button.classList.toggle("is-confirming", active);
    button.textContent = active ? "再按一次確認" : (button === quickResetActivePool ? "重置卡片" : uiText("button.pool.reset"));
  }
  if (resetConfirmTimer) window.clearTimeout(resetConfirmTimer);
  if (active) {
    resetConfirmTimer = window.setTimeout(() => setResetConfirmState(false), 2600);
  }
}

function resetActiveModeCards() {
  resetModeSelections();
  resetSecretPlaceState();
  setResetConfirmState(false);
  renderAll();
  refreshSecretPlaceBoard();
}

function handleResetAction() {
  if (!resetConfirmActive) {
    setResetConfirmState(true);
    return;
  }
  resetActiveModeCards();
}

resetActivePool.addEventListener("click", handleResetAction);
quickResetActivePool?.addEventListener("click", handleResetAction);

ensureEditPanel();
ensureFloatingTimer();
renderStaticUiText();
renderMobileHome();
setMode(activeMode.id);
showMobileHome();
