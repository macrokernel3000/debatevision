const decks = window.DEBATE_DECKS;
const modes = window.DEBATE_MODES;
const modeLifecycle = window.DEBATE_MODE_LIFECYCLE || {};
const modeControllers = window.DEBATE_MODE_CONTROLLERS || {};
const { iconFor } = window;
const { text: uiText, renderStatic: renderStaticUiText } = window.DEBATE_UI_TEXT;

if (!decks.needs && decks.concepts) {
  decks.needs = {
    label: "需求卡",
    icon: "◇",
    cards: (decks.concepts.cards || []).filter((card) => (card.rarity || "") === "需求")
  };
}

const EDIT_MODE = new URLSearchParams(window.location.search).get("edit") === "1";
const historyService = window.DEBATE_HISTORY_SERVICE.create();
const imageService = window.DEBATE_IMAGE_SERVICE.create({
  baseLayouts: window.DEBATE_IMAGE_LAYOUTS || {},
  editMode: EDIT_MODE
});
const uiState = window.DEBATE_STATE.create({
  resetConfirmActive: false,
  resetConfirmTimer: null
});
const salesState = window.DEBATE_STATE.create({
  variant: "supply",
  noConcept: false,
  audienceDeck: "creatures"
});
const metaphorState = window.DEBATE_STATE.create({
  variant: "concrete",
  prefixDeck: "",
  suffixDeck: "",
  locks: { prefix: false, relation: false, suffix: false },
  currentCards: null
});
const survivalState = window.DEBATE_STATE.create({
  variant: "survival",
  deckSelection: new Set(["items"]),
  groupCount: 3,
  counts: {
    items: 1,
    roles: 1,
    creatures: 1,
    aliens: 1,
    powers: 1,
    specialists: 1
  },
  lockEnvironment: false,
  noEnvironment: false
});
const survivalResultState = window.DEBATE_STATE.create({
  kind: "",
  environment: null,
  cards: [],
  groups: [],
  locks: { environment: false, cards: new Set() },
  notice: ""
});
const drawState = window.DEBATE_STATE.create({
  drawing: false,
  stageCard: null
});
const summonState = window.DEBATE_STATE.create({
  categorySelection: new Set(["異族", "超能", "特職"])
});
const importanceState = window.DEBATE_STATE.create({
  selectedDecks: new Set()
});
const DEFAULT_IMAGE_LAYOUT = imageService.defaultLayout;
const {
  targetForCard: editTargetForCard,
  layoutForTarget,
  minScaleForTarget,
  setLayoutForTarget,
  imageStyleForTarget,
  exportableLayouts
} = imageService;

let activeMode = modes[0];
let activeLibrary = activeMode.primaryDeck;
let activeSecondaryLibrary = activeMode.secondaryDeck || "";
let activePreview = activeMode.secondaryDeck || activeMode.primaryDeck;

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
const scenePreview = document.querySelector("#scenePreview");
const sceneEmblem = document.querySelector("#sceneEmblem");
const sceneBadge = document.querySelector("#sceneBadge");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneDescription = document.querySelector("#sceneDescription");
const controlNote = document.querySelector("#controlNote");
const dictionaryDeckOrder = ["worlds", "creatures", "items", "roles", "locations", "celebrities", "needs", "concepts", "relations", "missions", "summons"];
const derivedDeckIds = new Set(["needs"]);
const hiddenImportanceDecks = new Set([...derivedDeckIds]);
const hiddenSalesAudienceDecks = new Set(["items", "needs", "concepts", "relations", "missions"]);

function editTargetForMode(mode = activeMode) {
  return imageService.targetForMode(mode);
}

function layoutFor(card) {
  return layoutForTarget(editTargetForCard(card));
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

const cardHooks = window.DEBATE_CARD_HOOKS.create({
  getActiveMode: () => activeMode,
  getMetaphorVariant: () => metaphorState.variant
});
const {
  build: buildHooks,
  dictionary: dictionaryHooks,
  withEnvironment: cardWithEnvironmentHooks,
  withSalesNeed: cardWithSalesNeedHooks,
  withSalesStory: cardWithSalesStoryHooks,
  withSalesTarget: cardWithSalesTargetHooks
} = cardHooks;

const summonCategories = ["異族", "超能", "特職"];
const deckCore = window.DEBATE_DECK_CORE.create({
  decks,
  getActiveMode: () => activeMode,
  normalizeCard,
  summonCategories
});
const {
  cardKey,
  cardsFrom,
  ensureDeckSelection,
  pickFrom,
  pickFromAvailable,
  pickFromPool,
  raritiesFrom,
  rarityDisplayName,
  resetDeckSelectionToDefault,
  selectedCardsFrom,
  selectedCount,
  selectedKeysForDeck,
  setCardsSelection,
  setDeckSelection
} = deckCore;
const historyReplay = window.DEBATE_HISTORY_REPLAY.create({
  cardKey,
  cardsFrom,
  normalizeCard,
  withEnvironmentHooks: cardWithEnvironmentHooks
});
const survivalResultService = window.DEBATE_SURVIVAL_RESULT_SERVICE.create({
  cardKey,
  pickFromPool,
  selectedCardsFrom,
  withEnvironmentHooks: cardWithEnvironmentHooks
});

function summonCategoryLabel(category) {
  return `${category}卡`;
}

function selectedSummonCards() {
  return selectedCardsFrom("summons").filter((card) => summonState.categorySelection.has(card.rarity || ""));
}

function defaultSummonCategorySelection(mode = activeMode) {
  return mode.cardMode === "salesPitch"
    ? new Set(["異族"])
    : new Set(["異族", "超能", "特職"]);
}

function selectedSalesAudienceCards() {
  ensureSalesAudienceDeck();
  if (salesState.audienceDeck === "summons") return selectedSummonCards();
  return selectedCardsFrom(salesState.audienceDeck);
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
  if (audienceDecks.includes(salesState.audienceDeck)) return;
  salesState.audienceDeck = defaultSalesAudienceDeck();
}

function salesVariantLabel(variant = salesState.variant) {
  return {
    supply: "供需版",
    story: "故事版",
    target: "目標版"
  }[variant] || "供需版";
}

function salesVariantRule(variant = salesState.variant) {
  return {
    supply: "供需版：你的產品如何滿足客戶們的專屬需求？",
    story: "故事版：先抽概念，再抽商品，替商品鋪陳一個有記憶點的故事。",
    target: "目標版：先抽目標，再抽商品，判斷產品該怎麼賣給不同客戶。"
  }[variant] || activeMode.controlRule || uiText("control.note.default");
}

function modeStatusKey(mode = activeMode) {
  if (mode.cardMode === "itemEnvironment") {
    if (survivalState.variant === "battle") return "battle";
    if (survivalState.noEnvironment) return "survival_no_environment";
    return "survival";
  }

  if (mode.cardMode === "salesPitch") {
    if (salesState.variant === "story" && salesState.noConcept) return "story_no_concept";
    if (salesState.variant === "target") return `target_${salesState.audienceDeck}`;
    return salesState.variant;
  }

  if (mode.cardMode === "metaphorCompass") return metaphorState.variant;
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
    return survivalState.variant === "battle"
      ? `冒險版：${survivalState.groupCount} 組`
      : `求生版：${survivalActiveDeckIds().map((deckId) => variantLabel(deckId)).join(" + ")}`;
  }
  if (activeMode.cardMode === "salesPitch") {
    return salesVariantLabel();
  }
  if (activeMode.cardMode === "metaphorCompass") {
    const variantLabel = metaphorVariantLabel();
    const prefixLabel = decks[metaphorState.prefixDeck]?.label || "";
    const suffixLabel = decks[metaphorState.suffixDeck]?.label || "";
    if (metaphorState.variant === "concrete") return `${variantLabel}：人生 → ${suffixLabel}`;
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
  importanceState.selectedDecks = new Set(defaultDeck ? [defaultDeck] : []);
}

function importanceAvailableDeckIds(mode = activeMode) {
  const explicitDecks = Array.isArray(mode.availableDecks) && mode.availableDecks.length
    ? mode.availableDecks
    : orderedDeckIds({ includeDerived: true });
  return explicitDecks.filter((deckId) => decks[deckId] && !hiddenImportanceDecks.has(deckId));
}

function survivalActiveDeckIds(mode = activeMode) {
  if (mode.cardMode !== "itemEnvironment" || survivalState.variant !== "survival") return [];
  const available = primaryVariantDeckIds(mode);
  const selected = available.filter((deckId) => survivalState.deckSelection.has(deckId));
  if (selected.length) return selected;
  const fallback = mode.primaryDeck && available.includes(mode.primaryDeck) ? mode.primaryDeck : available[0];
  return fallback ? [fallback] : [];
}

function isMobileAppView() {
  return Boolean(window.matchMedia?.("(max-width: 560px)")?.matches);
}

function importanceActiveDeckIds(mode = activeMode) {
  if (mode.cardMode !== "importanceDuel") return [];
  const available = primaryVariantDeckIds(mode);
  const selected = available.filter((deckId) => importanceState.selectedDecks.has(deckId));
  if (selected.length) return selected;
  const fallback = mode.primaryDeck && available.includes(mode.primaryDeck) ? mode.primaryDeck : available[0];
  return fallback ? [fallback] : [];
}

function cardHistoryLabel(card) {
  const deckLabel = card.deckLabel || decks[card.deckId]?.label || "卡牌";
  return `${deckLabel}：${card.name}`;
}

const historyView = window.DebateVisionHistory.create({
  container: drawHistory,
  historyService,
  cardLabel: cardHistoryLabel
});

function renderDrawHistory() {
  historyView.render(historyScope());
}

function rememberDraw(cards, options = {}) {
  if (!Array.isArray(cards) || !cards.length) return;
  if (activeMode.cardMode === "secretPlace" && !options.includeSecret) return;
  const scope = historyScope();
  const entry = {
    modeId: activeMode.id,
    modeTitle: activeMode.title,
    variant: historyVariantLabel(),
    roundNumber: historyService.nextRound(scope),
    time: new Date().toISOString(),
    meta: historyReplay.entryMeta(activeMode, survivalState),
    cards: cards.map((card) => ({
      name: card.name,
      deckId: card.deckId,
      deckLabel: card.deckLabel || decks[card.deckId]?.label || "",
      rarity: card.rarity || "",
      hooks: Array.isArray(card.hooks) ? [...card.hooks] : []
    }))
  };
  historyService.remember(scope, entry);
  renderDrawHistory();
}

function rememberSecretAnswer(card) {
  if (!card) return;
  rememberDraw([card], { includeSecret: true });
}

function cardsFromHistoryEntry(entry) {
  return historyReplay.cardsForEntry(entry);
}

function restoreHistoryEntry(index, options = {}) {
  const entry = historyService.entry(historyScope(), index);
  const cards = cardsFromHistoryEntry(entry);
  if (!cards.length) return false;

  const stageCard = cards.find((card) => card.deckId === activeSecondaryLibrary) || cards[0];
  if (activeMode.cardMode === "itemEnvironment") {
    const replay = historyReplay.itemEnvironment(entry, cards, activeSecondaryLibrary);
    if (replay?.kind === "battle") {
      renderSurvivalBattle(replay.environment, replay.groups);
    } else if (replay?.kind === "combo") {
      renderCombo(replay.environment, replay.cards, "本輪異境", {
        hideStageInDesktopResults: replay.hideStageInDesktopResults
      });
    } else {
      resultsView.cards(replay?.cards || cards);
      renderReelCard(stageCard);
    }
  } else {
    resultsView.cards(cards);
    renderReelCard(stageCard);
  }

  if (isMobileAppView() || options.mobileResult) {
    document.body.classList.add("has-mobile-draw-result");
    setMobileHistoryVisible(false);
  }

  return true;
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

function sharedDeckCover(deckId) {
  const coverAssets = {
    items: "../assets/ui/deck-covers/items.jpg",
    "sales:items": "../assets/ui/deck-covers/sales-items.jpg",
    worlds: "../assets/ui/deck-covers/worlds.jpg",
    needs: "../assets/ui/deck-covers/needs.jpg",
    concepts: "../assets/ui/deck-covers/concepts.jpg",
    creatures: "../assets/ui/deck-covers/creatures.jpg",
    roles: "../assets/ui/deck-covers/roles.jpg",
    celebrities: "../assets/ui/deck-covers/celebrities.jpg",
    locations: "../assets/ui/deck-covers/locations.jpg",
    relations: "../assets/ui/deck-covers/relations.jpg",
    missions: "../assets/ui/deck-covers/missions.jpg",
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
    const image = isMobileAppView()
      ? explicitCover
        .replace("../assets/ui/deck-covers/", "../assets/ui/deck-covers/mobile/")
        .replace(/\.jpg$/i, ".webp")
      : explicitCover;
    return {
      image,
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

function setMobileHistoryVisible(visible) {
  document.body.classList.toggle("show-mobile-history", Boolean(visible));
}

function showMobileSetup() {
  document.body.classList.remove("has-mobile-draw-result");
  setMobileHistoryVisible(false);
  survivalResults.clear();
  renderEmptyState();
  renderAll();
}

function metaphorVariantLabel(value = metaphorState.variant) {
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
  if (metaphorState.variant === "concrete") {
    return part === "suffix" ? metaphorConcreteDeckOptions() : [];
  }
  if (metaphorState.variant === "free") return metaphorFreeDeckOptions();
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
  if (metaphorState.variant === "concrete") {
    metaphorState.prefixDeck = "";
    metaphorState.suffixDeck = metaphorConcreteDeckOptions().includes(metaphorState.suffixDeck)
      ? metaphorState.suffixDeck
      : metaphorConcreteDeckOptions()[0] || "";
    metaphorState.locks = { prefix: true, relation: true, suffix: false };
    activePreview = metaphorState.suffixDeck || activeSecondaryLibrary;
    return;
  }

  const options = metaphorDeckOptions("prefix");
  metaphorState.prefixDeck = options.includes(metaphorState.prefixDeck) ? metaphorState.prefixDeck : options[0] || "";
  metaphorState.suffixDeck = options.includes(metaphorState.suffixDeck) ? metaphorState.suffixDeck : options[0] || "";
  metaphorState.locks = {
    prefix: Boolean(metaphorState.locks.prefix),
    relation: Boolean(metaphorState.locks.relation),
    suffix: Boolean(metaphorState.locks.suffix)
  };
  activePreview = metaphorState.prefixDeck || activeSecondaryLibrary;
}

function survivalCountValue(key) {
  return key === "groups" ? survivalState.groupCount : survivalState.counts[key] || 0;
}

function setSurvivalCountValue(key, value) {
  if (key === "groups") survivalState.groupCount = value;
  if (Object.hasOwn(survivalState.counts, key)) survivalState.counts[key] = value;
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

const imageEditor = window.DebateVisionImageEditor.create({
  cardGrid,
  defaultLayout: DEFAULT_IMAGE_LAYOUT,
  editTargetForCard,
  editTargetForMode,
  exportableLayouts,
  getActiveMode: () => activeMode,
  imageStyleForTarget,
  isEditMode: EDIT_MODE,
  layoutForTarget,
  minScaleForTarget,
  setLayoutForTarget,
  visibleCards
});
const {
  ensurePanel: ensureEditPanel,
  getSelectedTarget,
  resetSelection: resetEditSelection,
  selectCard: selectEditCard,
  selectTarget: selectEditTarget,
  updatePanel: updateEditPanel
} = imageEditor;

const cardView = window.DebateVisionCards.create({
  cardKey,
  editTargetForCard,
  getSelectedEditTarget: getSelectedTarget,
  iconFor,
  imageService,
  imageStyleFor,
  isEditMode: EDIT_MODE
});
const { cardMarkup, tokenIconMarkup, tokenMarkup } = cardView;
const mobileModals = window.DebateVisionMobileModals.create({
  artModal: mobileArtModal,
  artPreview: mobileArtPreview,
  artTitle: mobileArtModalTitle,
  cardKey,
  cardList: mobileCardModalList,
  cardModal: mobileCardModal,
  cardTitle: mobileCardModalTitle,
  cardsForDeck: mobileDeckCards,
  deckTarget: mobileDeckTarget,
  decks,
  imageService,
  raritiesFrom,
  rarityDisplayName,
  selectedKeysForDeck,
  tokenIconMarkup
});
const {
  closeCardModal: closeMobileCardModal,
  openArt: openMobileArtPreview,
  openCardModal: openMobileCardModal,
  renderCardModal: renderMobileCardModal
} = mobileModals;
const mobileDashboard = window.DebateVisionMobileDashboard.create({
  availableDeckIdsForMode,
  cardsFrom,
  dashboard: mobileSurvivalDashboard,
  deckTone,
  decks,
  getActiveLibrary: () => activeLibrary,
  getActiveMode: () => activeMode,
  getActiveSecondaryLibrary: () => activeSecondaryLibrary,
  getDrawCount: () => Number(drawCount.value) || 1,
  getImportanceSelection: () => importanceState.selectedDecks,
  getMetaphorState: () => metaphorState,
  getSalesState: () => salesState,
  getSummonSelection: () => summonState.categorySelection,
  getSurvivalState: () => survivalState,
  getSurvivalResultState: () => survivalResultState,
  importanceAvailableDeckIds,
  metaphorVariantLabel,
  modeStatusText,
  primaryVariantDeckIds,
  resultActions: mobileResultActions,
  salesAudienceDeckIds,
  selectedCardsFrom,
  selectedCount,
  selectedSalesAudienceCards,
  sharedDeckCover,
  summonCategories,
  summonCategoryLabel,
  uiText,
  variantLabel
});
const {
  render: renderMobileSurvivalDashboard,
  renderActions: renderMobileResultActions
} = mobileDashboard;
const mobileModeImages = window.DebateVisionMobileModeImages.create({
  banner: mobileModeBanner,
  homeGrid: mobileHomeGrid,
  homeScreen: mobileHomeScreen,
  imageService,
  isMobileView: isMobileAppView,
  modes,
  uiText
});
const { renderHome: renderMobileHome } = mobileModeImages;
const modeShell = window.DebateVisionModeShell.create({
  editTargetForMode,
  elements: {
    activityMenu,
    activityMenuPanel,
    activityMenuToggle,
    cardDictionaryPanel,
    controlBand,
    controlNote,
    drawButton,
    libraryBand,
    mobileModeBanner,
    mobileModeEmblem,
    mobileModeRule,
    mobileModeTitle,
    mobileModeTrack,
    modeGrid,
    playArea,
    sceneBadge,
    sceneDescription,
    sceneEmblem,
    scenePreview,
    sceneTitle
  },
  getActiveMode: () => activeMode,
  imageService,
  imageStyleForTarget,
  lifecycleFor,
  mobileModeImages,
  modes,
  modeStatusText
});
const {
  renderActivity,
  renderButtons: renderModeButtons,
  setMenu: setActivityMenu
} = modeShell;
const deckControls = window.DebateVisionDeckControls.create({
  cardsFrom,
  deckTone,
  decks,
  elements: {
    controlNote,
    drawCount,
    drawCountField,
    drawCountLabel,
    fixedPools,
    primaryDeckField,
    primaryDeckLabel,
    secondaryDeckField,
    secondaryDeckLabel
  },
  ensureSalesAudienceDeck,
  getActiveLibrary: () => activeLibrary,
  getActiveMode: () => activeMode,
  getActiveSecondaryLibrary: () => activeSecondaryLibrary,
  getImportanceSelection: () => importanceState.selectedDecks,
  getMetaphorState: () => metaphorState,
  getSalesState: () => salesState,
  getSummonSelection: () => summonState.categorySelection,
  getSurvivalState: () => survivalState,
  importanceActiveDeckIds,
  metaphorDeckOptions,
  metaphorVariantLabel,
  modeStatusText,
  primaryVariantDeckIds,
  salesAudienceDeckIds,
  selectedCount,
  selectedSalesAudienceCards,
  sharedDeckCover,
  summonCategories,
  summonCategoryLabel,
  survivalActiveDeckIds,
  uiText,
  variantLabel
});
const { render: renderDeckControlsView } = deckControls;
const dictionaryView = window.DebateVisionCardDictionary.create({
  cardMarkup,
  cardsFrom,
  clearButton: clearDictionaryDecks,
  container: cardDictionary,
  decks,
  dictionaryHooks,
  drawButton: drawDictionaryCards,
  normalizeCard,
  orderedDeckIds,
  resultContainer: dictionaryResult,
  tokenIconMarkup,
  uiText
});
const reelView = window.DebateVisionReelView.create({
  container: reel,
  editTargetForCard,
  getActiveMode: () => activeMode,
  getCurrentStageCard: () => drawState.stageCard,
  imageService,
  imageStyleForTarget,
  sharedDeckCover,
  uiText
});
const { render: renderReelCard } = reelView;
const resultsView = window.DebateVisionResults.create({
  cardKey,
  container: cardGrid,
  cardMarkup
});
const survivalResults = window.DebateVisionSurvivalResultController.create({
  cardKey,
  getConfig: () => ({
    activeDeckIds: survivalActiveDeckIds(),
    counts: { ...survivalState.counts },
    noEnvironment: survivalState.noEnvironment,
    worldDeckId: activeSecondaryLibrary
  }),
  markDrawn,
  rememberDraw,
  renderBattle: (environment, groups, locks) => renderSurvivalBattle(environment, groups, {
    locks,
    mobileControls: true
  }),
  renderSurvival: (environment, cards, locks) => {
    drawState.stageCard = environment;
    renderReelCard(environment);
    resultsView.survival(environment, cards, locks);
  },
  renderUi: renderMobileResultActions,
  service: survivalResultService,
  state: survivalResultState
});
const secretPlaceView = window.DebateVisionSecretPlaceView.create({
  cardKey,
  tokenIconMarkup,
  uiText
});
const secretPlace = window.DebateVisionSecretPlace.create({
  cardKey,
  cardsFrom: selectedCardsFrom,
  container: cardGrid,
  getActiveDeck: () => activeLibrary,
  getActiveMode: () => activeMode,
  getDeckLabel: () => decks[activeLibrary]?.label || activeMode.primaryLabel || "詞庫",
  rememberAnswer: rememberSecretAnswer,
  uiText,
  view: secretPlaceView
});
const {
  cardFromIndex: secretCardFromIndex,
  refresh: refreshSecretPlaceBoard,
  render: renderSecretPlace,
  reset: resetSecretPlaceState
} = secretPlace;

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

function renderEmptyState() {
  resultsView.empty(uiText("empty.default", { drawLabel: activeMode.drawLabel }));
}

function renderPoolWarning() {
  resultsView.empty(uiText("warning.pool"));
  return [];
}

function renderCombo(environment, cards, label, options = {}) {
  drawState.stageCard = environment;
  renderReelCard(environment || {
    name: "無異境",
    lore: "本輪刻意不抽異境，直接用抽到的卡牌思考可行方案。",
    icon: activeMode.icon,
    deckLabel: "本輪設定"
  });
  resultsView.combo(environment, cards, options);
}

function renderSurvivalBattle(environment, groups, options = {}) {
  drawState.stageCard = environment;
  renderReelCard(environment);
  const environmentCard = {
    ...environment,
    hooks: [
      `指出「${environment.name}」最關鍵的生存限制。`,
      `比較各組隊伍面對「${environment.name}」時的優勢與風險。`
    ]
  };
  cardGrid.innerHTML = window.DebateVisionSurvivalBattleView.render({
    environment: environmentCard,
    groups,
    cardMarkup,
    locks: options.locks,
    showControls: Boolean(options.mobileControls)
  });
}

function renderDuel(cards) {
  resultsView.duel(cards);
}

function renderMetaphorCompass(concepts, relation) {
  const [left, right] = concepts;
  metaphorState.currentCards = { prefix: left, relation, suffix: right };
  const guideTitle = metaphorState.variant === "concrete"
    ? `請解釋：人生為什麼「${relation.name}${right.name}」？`
    : `請解釋：為什麼「${left.name}${relation.name}${right.name}」可以成立？`;
  const guideBody = metaphorState.variant === "concrete"
    ? "可以先找相似點，再提出一個生活例子，最後補充這個比喻有哪些限制。"
    : "可以先重新定義兩個概念，再提出一個具體例子，最後回應可能的反例。";
  resultsView.metaphor({ left, relation, right, guideTitle, guideBody });
}

function createModeContext(count = activeMode.fixedCount || Math.max(1, Math.min(6, Number(drawCount.value) || 1))) {
  return {
    count,
    get activeMode() { return activeMode; },
    get activeLibrary() { return activeLibrary; },
    get activeSecondaryLibrary() { return activeSecondaryLibrary; },
    decks,
    get drawCountValue() { return Number(drawCount.value) || 1; },
    get currentStageCard() { return drawState.stageCard; },
    set currentStageCard(value) { drawState.stageCard = value; },
    get lastSecretCard() { return secretPlace.lastCard; },
    set lastSecretCard(value) { secretPlace.lastCard = value; },
    get secretAnswerIndex() { return secretPlace.answerIndex; },
    get secretRevealed() { return secretPlace.revealed; },
    set secretRevealed(value) { secretPlace.revealed = value; },
    get salesVariant() { return salesState.variant; },
    get salesNoConcept() { return salesState.noConcept; },
    get survivalVariant() { return survivalState.variant; },
    get survivalGroupCount() { return survivalState.groupCount; },
    set survivalGroupCount(value) { survivalState.groupCount = value; },
    get survivalItemCount() { return survivalState.counts.items; },
    get survivalRoleCount() { return survivalState.counts.roles; },
    get survivalCreatureCount() { return survivalState.counts.creatures; },
    get survivalAlienCount() { return survivalState.counts.aliens; },
    get survivalPowerCount() { return survivalState.counts.powers; },
    get survivalSpecialistCount() { return survivalState.counts.specialists; },
    get lockEnvironment() { return survivalState.lockEnvironment; },
    get noEnvironment() { return survivalState.noEnvironment; },
    get metaphorVariant() { return metaphorState.variant; },
    get metaphorPrefixDeck() { return metaphorState.prefixDeck; },
    get metaphorSuffixDeck() { return metaphorState.suffixDeck; },
    get metaphorLocks() { return metaphorState.locks; },
    get currentMetaphorCards() { return metaphorState.currentCards; },
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
    drawSurvivalGroups: survivalResultService.drawGroups,
    pickFrom,
    pickFromAvailable,
    pickFromPool,
    renderCombo,
    renderDuel,
    renderMetaphorCompass,
    renderPoolWarning,
    renderSecretPlace,
    startSurvivalBattle: survivalResults.startBattle,
    startSurvivalResult: survivalResults.startSurvival,
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
    && survivalState.lockEnvironment
    && drawState.stageCard?.deckId === activeSecondaryLibrary;
}

function finishDraw(selected) {
  if (!selected.length) {
    renderReelCard(null, "抽選池不足");
  } else {
    rememberDraw(selected);
    const first = selected[0];
    if (activeMode.cardMode === "secretPlace") renderReelCard(drawState.stageCard);
    else if (activeMode.cardMode === "salesPitch") renderReelCard(first);
    else if (activeMode.cardMode === "metaphorCompass") renderReelCard(first);
    else if (shouldSkipReelAnimation()) renderReelCard(drawState.stageCard);
    else if (!activeSecondaryLibrary) renderReelCard(first);
  }
  reel.classList.remove("is-spinning");
  drawState.drawing = false;
  drawButton.disabled = false;
  if (selected.length && activeMode.cardMode !== "secretPlace" && activeMode.cardMode !== "cardDictionary" && isMobileAppView()) {
    document.body.classList.add("has-mobile-draw-result");
    setMobileHistoryVisible(false);
  }
  renderAll();
}

function spinDraw() {
  if (drawState.drawing) return;

  drawState.drawing = true;
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

function setMode(modeId, options = {}) {
  if (!options.preserveMobileHome) document.body.classList.remove("has-mobile-home");
  document.body.classList.remove("has-mobile-draw-result");
  setMobileHistoryVisible(false);
  closeMobileCardModal();
  activeMode = modes.find((mode) => mode.id === modeId) || activeMode;
  activeLibrary = activeMode.primaryDeck;
  activeSecondaryLibrary = activeMode.secondaryDeck || "";
  activePreview = activeMode.cardMode === "salesPitch" ? activeMode.primaryDeck : activeMode.secondaryDeck || activeMode.primaryDeck;
  secretPlace.clear();
  drawState.stageCard = null;
  survivalResults.clear();
  salesState.variant = "supply";
  salesState.noConcept = false;
  salesState.audienceDeck = defaultSalesAudienceDeck();
  summonState.categorySelection = defaultSummonCategorySelection(activeMode);
  survivalState.variant = "survival";
  survivalState.deckSelection = new Set(["items"]);
  survivalState.groupCount = 3;
  survivalState.counts = {
    items: 1,
    roles: 1,
    creatures: 1,
    aliens: 1,
    powers: 1,
    specialists: 1
  };
  survivalState.lockEnvironment = false;
  survivalState.noEnvironment = false;
  resetImportanceDeckSelection(activeMode);
  metaphorState.variant = "concrete";
  metaphorState.prefixDeck = "";
  metaphorState.suffixDeck = activeMode.metaphorConcreteDecks?.[0] || "items";
  metaphorState.locks = { prefix: true, relation: true, suffix: false };
  if (activeMode.cardMode === "metaphorCompass") syncMetaphorVariantDecks();
  metaphorState.currentCards = null;
  resetEditSelection();
  for (const deckId of activeDeckIds()) ensureDeckSelection(deckId);
  if (!options.deferRender) {
    renderAll();
    if (activeMode.cardMode === "secretPlace") renderSecretPlace(null, false);
    else if (activeMode.cardMode === "cardDictionary") dictionaryView.renderResult([]);
    else renderEmptyState();
    updateEditPanel();
  }
  setActivityMenu(false);
}

function showMobileHome() {
  if (!isMobileAppView()) return;
  document.body.classList.remove("has-mobile-draw-result");
  document.body.classList.add("has-mobile-home");
  setMobileHistoryVisible(false);
  closeMobileCardModal();
  setActivityMenu(false);
  modeGrid.replaceChildren();
  fixedPools.replaceChildren();
  mobileSurvivalDashboard.replaceChildren();
  scenePreview?.querySelector(".scene-preview-image")?.remove();
  window.scrollTo({ top: 0 });
}

function renderAll() {
  const mobileView = isMobileAppView();
  if (mobileView) {
    modeShell.renderMenu();
    renderActivity({ skipDesktopVisuals: true });
  } else {
    renderModeButtons();
    renderActivity();
    renderDeckControlsView();
  }
  renderMobileSurvivalDashboard();
  renderMobileResultActions();
  if (!mobileView) {
    renderLibraryTools();
    renderTokenCloud();
  }
  renderDrawHistory();
  dictionaryView.render();
  if (!drawState.drawing) renderReelCard();
}

function handleModeClick(event) {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  setMode(button.dataset.mode);
}

modeGrid.addEventListener("click", handleModeClick);
activityMenuToggle?.addEventListener("click", () => {
  modeShell.toggleMenu();
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
  if (event.key === "Escape" && modeShell.isMenuOpen()) setActivityMenu(false);
});

drawButton.addEventListener("click", spinDraw);
drawCount.addEventListener("input", () => {
  if (activeMode.cardMode !== "itemEnvironment" || survivalState.variant !== "battle") return;
  survivalState.groupCount = Math.max(1, Math.min(8, Number(drawCount.value) || 1));
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
  get currentStageCard() { return drawState.stageCard; },
  set currentStageCard(value) { drawState.stageCard = value; },
  get drawCount() { return drawCount; },
  get lockEnvironment() { return survivalState.lockEnvironment; },
  set lockEnvironment(value) { survivalState.lockEnvironment = value; },
  get metaphorVariant() { return metaphorState.variant; },
  set metaphorVariant(value) { metaphorState.variant = value; },
  set currentMetaphorCards(value) { metaphorState.currentCards = value; },
  get mobileEditingDeck() { return mobileModals.editingDeck; },
  get noEnvironment() { return survivalState.noEnvironment; },
  set noEnvironment(value) { survivalState.noEnvironment = value; },
  get salesAudienceDeck() { return salesState.audienceDeck; },
  set salesAudienceDeck(value) { salesState.audienceDeck = value; },
  get salesNoConcept() { return salesState.noConcept; },
  set salesNoConcept(value) { salesState.noConcept = value; },
  get salesVariant() { return salesState.variant; },
  set salesVariant(value) { salesState.variant = value; },
  get selectedImportanceDecks() { return importanceState.selectedDecks; },
  get summonCategorySelection() { return summonState.categorySelection; },
  get survivalDeckSelection() { return survivalState.deckSelection; },
  get survivalGroupCount() { return survivalState.groupCount; },
  set survivalGroupCount(value) { survivalState.groupCount = value; },
  get survivalVariant() { return survivalState.variant; },
  set survivalVariant(value) { survivalState.variant = value; },
  cardKey,
  cardMarkup,
  cardsFromHistoryEntry,
  closeMobileCardModal,
  clearSurvivalResult: survivalResults.clear,
  exchangeSurvivalResources: survivalResults.exchange,
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
  rerollSurvivalGroup: survivalResults.rerollGroup,
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
  syncMetaphorVariantDecks,
  toggleSurvivalResultLock: survivalResults.toggleLock
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
  historyView.activate(item);
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
    survivalState.variant = survivalVariantButton.dataset.survivalVariant;
    activeLibrary = "items";
    activePreview = "items";
    survivalState.lockEnvironment = false;
    survivalState.noEnvironment = false;
    drawState.stageCard = null;
    renderAll();
    renderEmptyState();
    return;
  }

  const metaphorVariantButton = event.target.closest("[data-metaphor-variant]");
  if (metaphorVariantButton) {
    metaphorState.variant = metaphorVariantButton.dataset.metaphorVariant;
    metaphorState.currentCards = null;
    syncMetaphorVariantDecks();
    renderAll();
    renderEmptyState();
    return;
  }

  const primaryButton = event.target.closest("[data-primary-variant]");
  if (primaryButton) {
    const deckId = primaryButton.dataset.primaryVariant;
    if (activeMode.cardMode === "importanceDuel") {
      if (importanceState.selectedDecks.has(deckId) && importanceState.selectedDecks.size > 1) {
        importanceState.selectedDecks.delete(deckId);
      } else {
        importanceState.selectedDecks.add(deckId);
      }
      activeLibrary = deckId;
      activePreview = deckId;
      renderAll();
      return;
    }
    if (activeMode.cardMode === "itemEnvironment" && survivalState.variant === "survival") {
      if (survivalState.deckSelection.has(deckId) && survivalState.deckSelection.size > 1) {
        survivalState.deckSelection.delete(deckId);
      } else {
        survivalState.deckSelection.add(deckId);
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
    salesState.variant = button.dataset.salesVariant;
    if (salesState.variant === "supply") activePreview = "items";
    if (salesState.variant === "story") activePreview = salesState.noConcept ? "items" : "concepts";
    if (salesState.variant === "target") {
      ensureSalesAudienceDeck();
      activePreview = salesState.audienceDeck;
    }
    renderAll();
    renderEmptyState();
    return;
  }

  const audienceButton = event.target.closest("[data-sales-audience]");
  if (audienceButton) {
    salesState.audienceDeck = audienceButton.dataset.salesAudience;
    activePreview = salesState.audienceDeck;
    renderAll();
    renderEmptyState();
    return;
  }

  const summonCategoryButton = event.target.closest("[data-summon-category]");
  if (!summonCategoryButton) return;
  const category = summonCategoryButton.dataset.summonCategory;
  if (summonState.categorySelection.has(category)) {
    if (summonState.categorySelection.size > 1) summonState.categorySelection.delete(category);
  } else {
    summonState.categorySelection.add(category);
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
  renderDeckControlsView();
});

fixedPools.addEventListener("change", (event) => {
  if (handleSurvivalCountInput(event)) {
    renderAll();
    return;
  }

  const metaphorDeckSelect = event.target.closest("[data-metaphor-deck]");
  if (metaphorDeckSelect) {
    const part = metaphorDeckSelect.dataset.metaphorDeck;
    metaphorState.currentCards = null;
    if (part === "prefix") {
      metaphorState.prefixDeck = metaphorDeckSelect.value;
      metaphorState.locks.prefix = false;
    }
    if (part === "suffix") {
      metaphorState.suffixDeck = metaphorDeckSelect.value;
      metaphorState.locks.suffix = false;
    }
    activePreview = metaphorDeckSelect.value;
    renderAll();
    return;
  }

  const metaphorCheckbox = event.target.closest("[data-lock-metaphor]");
  if (metaphorCheckbox) {
    metaphorState.locks[metaphorCheckbox.dataset.lockMetaphor] = metaphorCheckbox.checked;
    renderAll();
    return;
  }

  const salesNoConceptCheckbox = event.target.closest("[data-sales-no-concept]");
  if (salesNoConceptCheckbox) {
    salesState.noConcept = salesNoConceptCheckbox.checked;
    activePreview = salesState.noConcept ? "items" : "concepts";
    renderAll();
    renderEmptyState();
    return;
  }

  const checkbox = event.target.closest("[data-lock-environment]");
  if (checkbox) {
    survivalState.lockEnvironment = checkbox.checked;
    renderAll();
    return;
  }

  const noEnvironmentCheckbox = event.target.closest("[data-no-environment]");
  if (!noEnvironmentCheckbox) return;
  survivalState.noEnvironment = noEnvironmentCheckbox.checked;
  if (survivalState.noEnvironment) {
    survivalState.lockEnvironment = false;
    drawState.stageCard = null;
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

cardGrid.addEventListener("click", (event) => {
  const cardElement = event.target.closest(".battle-card[data-card-key]");
  if (!cardElement) return;
  const card = findCardByKey(cardElement.dataset.cardKey);
  if (EDIT_MODE) {
    if (card?.imageId) selectEditCard(card);
    return;
  }
  if (isMobileAppView() && event.target.closest(".card-art")) {
    if (activeMode.cardMode === "itemEnvironment" && survivalResultState.kind) {
      const deckId = card.deckId === "summons" && card.rarity
        ? `summons:${card.rarity}`
        : card.deckId;
      openMobileCardModal(deckId);
      return;
    }
    openMobileArtPreview(card);
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
  uiState.resetConfirmActive = active;
  for (const button of [resetActivePool, quickResetActivePool]) {
    if (!button) continue;
    button.classList.toggle("is-confirming", active);
    button.textContent = active ? "再按一次確認" : (button === quickResetActivePool ? "重置卡片" : uiText("button.pool.reset"));
  }
  if (uiState.resetConfirmTimer) window.clearTimeout(uiState.resetConfirmTimer);
  if (active) {
    uiState.resetConfirmTimer = window.setTimeout(() => setResetConfirmState(false), 2600);
  }
}

function resetActiveModeCards() {
  resetModeSelections();
  survivalResults.clear();
  resetSecretPlaceState();
  setResetConfirmState(false);
  renderAll();
  refreshSecretPlaceBoard();
}

function handleResetAction() {
  if (!uiState.resetConfirmActive) {
    setResetConfirmState(true);
    return;
  }
  resetActiveModeCards();
}

resetActivePool.addEventListener("click", handleResetAction);
quickResetActivePool?.addEventListener("click", handleResetAction);

ensureEditPanel();
imageService.installFallbackHandler();
window.DEBATE_CLASS_TIMER?.init();
renderStaticUiText();
renderMobileHome();
if (isMobileAppView()) {
  setMode(activeMode.id, { deferRender: true, preserveMobileHome: true });
  mobileModeImages.renderBanner(activeMode);
  showMobileHome();
} else {
  setMode(activeMode.id);
}
