import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { console, window: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(root, "website/js/services/history-replay.js"), "utf8"),
  sandbox,
  { filename: "history-replay.js" }
);

function card(name, deckId, rarity = "A", hooks = []) {
  return { name, deckId, deckLabel: deckId, rarity, lore: `${name} lore`, hooks };
}

const environment = card("無人島", "worlds");
const members = [
  card("道具1", "items"),
  card("職業1", "roles"),
  card("動物1", "creatures"),
  card("異族1", "summons", "異族"),
  card("超能1", "summons", "超能"),
  card("特職1", "summons", "特職"),
  card("道具2", "items"),
  card("職業2", "roles"),
  card("動物2", "creatures"),
  card("異族2", "summons", "異族"),
  card("超能2", "summons", "超能"),
  card("特職2", "summons", "特職")
];
const pools = {
  worlds: [environment],
  items: members.filter((value) => value.deckId === "items"),
  roles: members.filter((value) => value.deckId === "roles"),
  creatures: members.filter((value) => value.deckId === "creatures"),
  summons: members.filter((value) => value.deckId === "summons")
};
const cardKey = (value) => `${value.deckId}::${value.rarity}::${value.name}`;
const replay = sandbox.window.DEBATE_HISTORY_REPLAY.create({
  cardKey,
  cardsFrom: (deckId) => pools[deckId] || [],
  normalizeCard: (value, deckId) => ({ ...value, deckId, hooks: value.hooks || [] }),
  withEnvironmentHooks: (value, stage) => ({
    ...value,
    hooks: [`${value.name} @ ${stage?.name || "無異境"}`]
  })
});

const oldEntry = {
  variant: "冒險版：2 組",
  cards: [environment, ...members].map(({ name, deckId, deckLabel, rarity }) => ({
    name,
    deckId,
    deckLabel,
    rarity
  }))
};
const oldCards = replay.cardsForEntry(oldEntry);
const oldBattle = replay.itemEnvironment(oldEntry, oldCards, "worlds");
assert.equal(oldBattle.kind, "battle");
assert.equal(oldBattle.groups.length, 2);
assert.ok(oldBattle.groups.every((group) => (
  group.items.length === 1
  && group.roles.length === 1
  && group.creatures.length === 1
  && group.aliens.length === 1
  && group.powers.length === 1
  && group.specialists.length === 1
)));
assert.equal(oldBattle.groups[0].items[0].hooks[0], "道具1 @ 無人島");

const newEntry = {
  ...oldEntry,
  meta: {
    survivalVariant: "battle",
    groupCount: 2,
    counts: { items: 1, roles: 1, creatures: 1, aliens: 1, powers: 1, specialists: 1 }
  }
};
assert.equal(replay.itemEnvironment(newEntry, replay.cardsForEntry(newEntry), "worlds").groups.length, 2);

const normalEntry = {
  variant: "求生版：道具",
  cards: [
    oldEntry.cards[0],
    { ...oldEntry.cards[1], hooks: ["saved hook"] }
  ]
};
const normalCards = replay.cardsForEntry(normalEntry);
assert.equal(JSON.stringify(normalCards[1].hooks), JSON.stringify(["saved hook"]));
const normalReplay = replay.itemEnvironment(normalEntry, normalCards, "worlds");
assert.equal(normalReplay.kind, "combo");
assert.equal(normalReplay.cards[0].hooks[0], "道具1 @ 無人島");

console.log("歷史回放檢查通過。");
console.log("- 舊冒險紀錄可推回分組");
console.log("- 新紀錄保存分組設定");
console.log("- 回放卡片重新套用異境提問");
