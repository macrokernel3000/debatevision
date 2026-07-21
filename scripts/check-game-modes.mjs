import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { console, window: { DEBATE_MODE_CONTROLLERS: {} } };
vm.createContext(sandbox);

for (const filename of fs.readdirSync(path.join(root, "website/js/modes")).sort()) {
  if (!filename.endsWith(".js")) continue;
  const source = fs.readFileSync(path.join(root, "website/js/modes", filename), "utf8");
  vm.runInContext(source, sandbox, { filename });
}
vm.runInContext(
  fs.readFileSync(path.join(root, "website/js/services/survival-result-service.js"), "utf8"),
  sandbox,
  { filename: "survival-result-service.js" }
);

const generatedModesSource = fs.readFileSync(path.join(root, "data/generated/modes.js"), "utf8");
vm.runInContext(generatedModesSource, sandbox, { filename: "data/generated/modes.js" });

const controllers = sandbox.window.DEBATE_MODE_CONTROLLERS;
const controllerModes = new Set(sandbox.window.DEBATE_MODES.map((mode) => mode.cardMode));
controllerModes.delete("cardDictionary");
assert.deepEqual(
  [...controllerModes].sort(),
  Object.keys(controllers).sort(),
  "generated modes and mode controllers must stay in sync"
);

function card(name, deckId, rarity = "A") {
  return { name, deckId, deckLabel: deckId, rarity, lore: `${name} lore`, hooks: [] };
}

const pools = {
  worlds: [card("world-1", "worlds"), card("world-2", "worlds")],
  missions: [card("mission-1", "missions"), card("mission-2", "missions")],
  items: Array.from({ length: 12 }, (_, index) => card(`item-${index + 1}`, "items")),
  roles: Array.from({ length: 6 }, (_, index) => card(`role-${index + 1}`, "roles")),
  creatures: Array.from({ length: 6 }, (_, index) => card(`creature-${index + 1}`, "creatures")),
  celebrities: Array.from({ length: 4 }, (_, index) => card(`celebrity-${index + 1}`, "celebrities")),
  concepts: Array.from({ length: 4 }, (_, index) => card(`concept-${index + 1}`, "concepts", "概念")),
  needs: Array.from({ length: 4 }, (_, index) => card(`need-${index + 1}`, "needs", "需求")),
  relations: Array.from({ length: 4 }, (_, index) => card(`relation-${index + 1}`, "relations")),
  locations: Array.from({ length: 4 }, (_, index) => card(`location-${index + 1}`, "locations")),
  summons: [
    ...Array.from({ length: 5 }, (_, index) => card(`alien-${index + 1}`, "summons", "異族")),
    ...Array.from({ length: 5 }, (_, index) => card(`power-${index + 1}`, "summons", "超能")),
    ...Array.from({ length: 5 }, (_, index) => card(`specialist-${index + 1}`, "summons", "特職"))
  ]
};

function pickFromPool(pool, count) {
  return pool.splice(0, count);
}

function createContext(overrides = {}) {
  const calls = [];
  const ctx = {
    activeLibrary: "items",
    activeMode: { icon: "?", primaryLabel: "卡牌" },
    activeSecondaryLibrary: "worlds",
    count: 2,
    currentMetaphorCards: null,
    currentStageCard: null,
    decks: Object.fromEntries(Object.keys(pools).map((key) => [key, { label: key }])),
    drawCountValue: 2,
    lastSecretCard: null,
    lockEnvironment: false,
    metaphorLocks: { prefix: false, relation: false, suffix: false },
    metaphorPrefixDeck: "items",
    metaphorSuffixDeck: "concepts",
    metaphorVariant: "abstract",
    noEnvironment: false,
    salesNoConcept: false,
    salesVariant: "supply",
    secretAnswerIndex: "1",
    secretRevealed: false,
    survivalAlienCount: 1,
    survivalCreatureCount: 1,
    survivalGroupCount: 2,
    survivalItemCount: 1,
    survivalPowerCount: 1,
    survivalRoleCount: 1,
    survivalSpecialistCount: 1,
    survivalVariant: "survival",
    buildHooks: (name) => [`hook:${name}`],
    cardKey: (value) => `${value.deckId}::${value.rarity}::${value.name}`,
    cardWithEnvironmentHooks: (value) => ({ ...value, hooks: [`environment:${value.name}`] }),
    cardWithSalesNeedHooks: (value) => ({ ...value, hooks: [`need:${value.name}`] }),
    cardWithSalesStoryHooks: (value) => ({ ...value, hooks: [`story:${value.name}`] }),
    cardWithSalesTargetHooks: (value) => ({ ...value, hooks: [`target:${value.name}`] }),
    fixedMetaphorPrefixCard: () => card("人生", "metaphor-fixed"),
    fixedMetaphorRelationCard: () => card("就像", "metaphor-fixed"),
    importanceActiveDeckIds: () => ["items", "roles"],
    markDrawn: (cards) => calls.push(["markDrawn", cards]),
    pickFrom: (deckId, count) => pickFromPool([...(pools[deckId] || [])], count),
    pickFromAvailable: (deckId, count, excludedKeys = new Set()) => pickFromPool(
      (pools[deckId] || []).filter((value) => !excludedKeys.has(ctx.cardKey(value))),
      count
    ),
    pickFromPool,
    renderCombo: (...args) => calls.push(["renderCombo", ...args]),
    renderDuel: (...args) => calls.push(["renderDuel", ...args]),
    renderMetaphorCompass: (...args) => calls.push(["renderMetaphorCompass", ...args]),
    renderPoolWarning: () => {
      calls.push(["renderPoolWarning"]);
      return [];
    },
    renderSecretPlace: (...args) => calls.push(["renderSecretPlace", ...args]),
    startSurvivalBattle: (...args) => calls.push(["startSurvivalBattle", ...args]),
    startSurvivalResult: (...args) => calls.push(["startSurvivalResult", ...args]),
    secretCardFromIndex: () => pools.locations[0],
    selectedCardsFrom: (deckId) => [...(pools[deckId] || [])],
    selectedSalesAudienceCards: () => pools.creatures,
    selectedSummonCards: () => pools.summons,
    survivalActiveDeckIds: () => ["items"]
  };
  ctx.drawSurvivalGroups = sandbox.window.DEBATE_SURVIVAL_RESULT_SERVICE.create({
    cardKey: ctx.cardKey,
    pickFromPool,
    selectedCardsFrom: ctx.selectedCardsFrom,
    withEnvironmentHooks: ctx.cardWithEnvironmentHooks
  }).drawGroups;
  Object.assign(ctx, overrides);
  return { calls, ctx };
}

function assertCall(calls, name) {
  assert.ok(calls.some(([callName]) => callName === name), `expected ${name} to be called`);
  assert.ok(!calls.some(([callName]) => callName === "renderPoolWarning"), "unexpected pool warning");
}

function assertUnique(cards, label) {
  const keys = cards.map((value) => `${value.deckId}::${value.rarity}::${value.name}`);
  assert.equal(new Set(keys).size, keys.length, `${label} must not draw duplicate cards`);
}

{
  const { calls, ctx } = createContext();
  const result = controllers.itemEnvironment.draw(ctx);
  assert.equal(result.length, 3);
  assertCall(calls, "startSurvivalResult");
  assertCall(calls, "markDrawn");
}

{
  const { calls, ctx } = createContext({ survivalVariant: "battle" });
  const result = controllers.itemEnvironment.draw(ctx);
  assert.equal(result.length, 13);
  assertUnique(result, "survival battle");
  const renderCall = calls.find(([name]) => name === "startSurvivalBattle");
  assert.equal(renderCall[2].length, 2);
  assert.ok(renderCall[2].every((group) => (
    group.items.length === 1
    && group.roles.length === 1
    && group.creatures.length === 1
    && group.aliens.length === 1
    && group.powers.length === 1
    && group.specialists.length === 1
  )));
  assertCall(calls, "markDrawn");
}

{
  const { calls, ctx } = createContext();
  const result = controllers.importanceDuel.draw(ctx);
  assert.equal(result.length, 2);
  assertUnique(result, "importance duel");
  assertCall(calls, "renderDuel");
}

{
  const { calls, ctx } = createContext({ activeSecondaryLibrary: "missions" });
  const result = controllers.summonMission.draw(ctx);
  assert.equal(result.length, 2);
  assertCall(calls, "renderCombo");
  assert.equal(calls.find(([name]) => name === "markDrawn")[1].length, 3);
}

for (const [salesVariant, salesNoConcept, expectedLength] of [
  ["supply", false, 3],
  ["story", false, 3],
  ["story", true, 2],
  ["target", false, 3]
]) {
  const { calls, ctx } = createContext({ salesVariant, salesNoConcept });
  const result = controllers.salesPitch.draw(ctx);
  assert.equal(result.length, expectedLength, `sales ${salesVariant}`);
  assertCall(calls, "renderCombo");
  assertCall(calls, "markDrawn");
  if (salesVariant === "story" && salesNoConcept) {
    const stageCard = calls.find(([name]) => name === "renderCombo")[1];
    assert.equal(stageCard.deckId, "concepts");
    assert.ok(Array.isArray(stageCard.hooks) && stageCard.hooks.length > 0);
  }
}

for (const metaphorVariant of ["concrete", "abstract", "free"]) {
  const { calls, ctx } = createContext({
    activeSecondaryLibrary: "relations",
    metaphorVariant
  });
  const result = controllers.metaphorCompass.draw(ctx);
  assert.equal(result.length, 3, `metaphor ${metaphorVariant}`);
  assertCall(calls, "renderMetaphorCompass");
  assertCall(calls, "markDrawn");
}

{
  const { calls, ctx } = createContext({ activeLibrary: "locations" });
  const result = controllers.secretPlace.draw(ctx);
  assert.equal(result.length, 1);
  assert.equal(ctx.currentStageCard.name, "秘密選號已開啟");
  assertCall(calls, "renderSecretPlace");
}

for (const [name, controller] of Object.entries(controllers)) {
  if (!controller.reelPool) continue;
  const { ctx } = createContext({
    activeSecondaryLibrary: name === "summonMission" ? "missions" : "worlds"
  });
  assert.ok(controller.reelPool(ctx).length > 0, `${name} reel pool must not be empty`);
}

console.log("玩法煙霧檢查通過。");
console.log(`- ${Object.keys(controllers).length} 個玩法 controller`);
console.log("- 異境求生：求生版、冒險版");
console.log("- 銷售密令：供需版、故事版（含無概念）、目標版");
console.log("- 隱喻羅盤：具象版、抽象版、自由版");
console.log("- 現實召喚、誰更重要、推理解密");
