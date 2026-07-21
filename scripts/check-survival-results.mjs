import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(root, "website/js/services/survival-result-service.js"), "utf8"),
  sandbox,
  { filename: "survival-result-service.js" }
);

function card(name, deckId, rarity = "A") {
  return { name, deckId, rarity, hooks: [] };
}

function buildPools() {
  return {
    worlds: [
      card("world-1", "worlds"),
      card("world-2", "worlds"),
      card("world-3", "worlds")
    ],
    items: Array.from({ length: 8 }, (_, index) => card(`item-${index + 1}`, "items")),
    roles: Array.from({ length: 8 }, (_, index) => card(`role-${index + 1}`, "roles")),
    creatures: Array.from({ length: 8 }, (_, index) => card(`creature-${index + 1}`, "creatures")),
    summons: [
      ...Array.from({ length: 8 }, (_, index) => card(`alien-${index + 1}`, "summons", "異族")),
      ...Array.from({ length: 8 }, (_, index) => card(`power-${index + 1}`, "summons", "超能")),
      ...Array.from({ length: 8 }, (_, index) => card(`specialist-${index + 1}`, "summons", "特職"))
    ]
  };
}

const pools = buildPools();
const cardKey = (value) => `${value.deckId}::${value.rarity}::${value.name}`;
const selectedCardsFrom = (deckId) => [...(pools[deckId] || [])];
const pickFromPool = (pool, count) => pool.slice(0, count);
const withEnvironmentHooks = (value, environment) => ({
  ...value,
  hooks: environment ? [`environment:${environment.name}`] : []
});
const service = sandbox.window.DEBATE_SURVIVAL_RESULT_SERVICE.create({
  cardKey,
  pickFromPool,
  selectedCardsFrom,
  withEnvironmentHooks
});

function groupCards(group) {
  return [
    ...group.items,
    ...group.roles,
    ...group.creatures,
    ...group.aliens,
    ...group.powers,
    ...group.specialists
  ];
}

function assertUnique(cards, message) {
  assert.equal(new Set(cards.map(cardKey)).size, cards.length, message);
}

{
  const environment = pools.worlds[0];
  const originalCards = [pools.items[0], pools.items[1]];
  const lockedKey = cardKey(originalCards[0]);
  const result = service.exchangeSurvival({
    activeDeckIds: ["items"],
    cards: originalCards,
    environment,
    locks: { environment: false, cards: new Set([lockedKey]) },
    noEnvironment: false,
    worldDeckId: "worlds"
  });

  assert.equal(result.ok, true);
  assert.equal(result.environment.name, "world-2", "未鎖定異境應更換");
  assert.equal(result.cards[0].name, "item-1", "鎖定資源必須保留");
  assert.equal(result.cards[1].name, "item-3", "未鎖定資源應避開本輪卡片");
  assertUnique(result.cards, "交換後不得出現重複資源");
}

{
  const originalCards = [pools.items[0], pools.items[1]];
  const result = service.exchangeSurvival({
    activeDeckIds: ["items"],
    cards: originalCards,
    environment: pools.worlds[0],
    locks: {
      environment: true,
      cards: new Set(originalCards.map(cardKey))
    },
    noEnvironment: false,
    worldDeckId: "worlds"
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "請先取消至少一張卡的鎖定。");
}

{
  const counts = {
    items: 1,
    roles: 1,
    creatures: 1,
    aliens: 1,
    powers: 1,
    specialists: 1
  };
  const environment = pools.worlds[0];
  const initial = service.drawGroups({
    environment,
    groupCount: 3,
    counts
  });

  assert.equal(initial.ok, true);
  assert.equal(initial.groups.length, 3);
  assertUnique(service.allGroupCards(initial.groups), "初次編隊必須跨組避免重複");

  const untouchedFirst = initial.groups[0];
  const originalTargetKeys = groupCards(initial.groups[1]).map(cardKey);
  const untouchedThird = initial.groups[2];
  const rerolled = service.rerollGroup({
    counts,
    environment,
    groupId: 2,
    groups: initial.groups
  });

  assert.equal(rerolled.ok, true);
  assert.equal(rerolled.groups[0], untouchedFirst, "第 1 組不應被替換");
  assert.equal(rerolled.groups[2], untouchedThird, "第 3 組不應被替換");
  assert.equal(rerolled.groups[1].id, 2, "重抽後必須保留組別 id");
  assert.notDeepEqual(
    groupCards(rerolled.groups[1]).map(cardKey),
    originalTargetKeys,
    "指定隊伍應取得新卡"
  );
  assertUnique(service.allGroupCards(rerolled.groups), "重新編隊後仍須跨組避免重複");
}

console.log("異境求生局部重抽檢查通過。");
