(() => {
  const sections = [
    { key: "items", deckId: "items" },
    { key: "roles", deckId: "roles" },
    { key: "creatures", deckId: "creatures" },
    { key: "aliens", deckId: "summons", rarity: "異族" },
    { key: "powers", deckId: "summons", rarity: "超能" },
    { key: "specialists", deckId: "summons", rarity: "特職" }
  ];

  function create(options) {
    const {
      cardKey,
      pickFromPool,
      selectedCardsFrom,
      withEnvironmentHooks
    } = options;

    function poolFor(section) {
      return selectedCardsFrom(section.deckId)
        .filter((card) => !section.rarity || card.rarity === section.rarity);
    }

    function freshPick(pool, count, excludedKeys) {
      return pickFromPool(
        pool.filter((card) => !excludedKeys.has(cardKey(card))),
        count
      );
    }

    function drawGroups({ environment, groupCount, counts, excludedKeys = new Set() }) {
      const totalGroups = Math.max(1, Number(groupCount) || 1);
      const groups = Array.from({ length: totalGroups }, (_, index) => ({
        id: index + 1,
        index: index + 1,
        items: [],
        roles: [],
        creatures: [],
        aliens: [],
        powers: [],
        specialists: []
      }));
      const drawn = [];

      for (const section of sections) {
        const perGroup = Math.max(0, Number(counts[section.key]) || 0);
        const required = perGroup * totalGroups;
        const picked = freshPick(poolFor(section), required, excludedKeys);
        if (picked.length < required) {
          return { ok: false, message: `${section.rarity || section.deckId}卡池不足，無法完成編隊。` };
        }
        drawn.push(...picked);
        groups.forEach((group, index) => {
          group[section.key] = picked
            .slice(index * perGroup, (index + 1) * perGroup)
            .map((card) => withEnvironmentHooks(card, environment));
        });
      }

      return { ok: true, groups, drawn };
    }

    function exchangeSurvival({
      activeDeckIds,
      cards,
      environment,
      locks,
      noEnvironment,
      worldDeckId
    }) {
      const unlockedIndexes = cards
        .map((card, index) => locks.cards.has(cardKey(card)) ? -1 : index)
        .filter((index) => index >= 0);
      const canChangeEnvironment = !noEnvironment && !locks.environment;
      if (!unlockedIndexes.length && !canChangeEnvironment) {
        return { ok: false, message: "請先取消至少一張卡的鎖定。" };
      }

      let nextEnvironment = environment;
      const drawn = [];
      if (canChangeEnvironment) {
        const excludedWorlds = new Set(environment ? [cardKey(environment)] : []);
        const nextWorld = freshPick(selectedCardsFrom(worldDeckId), 1, excludedWorlds)[0];
        if (nextWorld) {
          nextEnvironment = nextWorld;
          drawn.push(nextWorld);
        }
      }

      const lockedKeys = new Set(cards.filter((card) => locks.cards.has(cardKey(card))).map(cardKey));
      const currentKeys = new Set(cards.map(cardKey));
      const pool = activeDeckIds.flatMap((deckId) => selectedCardsFrom(deckId));
      let replacements = freshPick(pool, unlockedIndexes.length, new Set([...lockedKeys, ...currentKeys]));
      if (replacements.length < unlockedIndexes.length) {
        replacements = freshPick(pool, unlockedIndexes.length, lockedKeys);
      }
      if (replacements.length < unlockedIndexes.length) {
        return { ok: false, message: "目前卡池不足，請先在卡片圖片中補回可抽卡。" };
      }
      drawn.push(...replacements);

      const nextCards = cards.map((card, index) => {
        const replacementIndex = unlockedIndexes.indexOf(index);
        const nextCard = replacementIndex >= 0 ? replacements[replacementIndex] : card;
        return withEnvironmentHooks(nextCard, nextEnvironment);
      });
      return { ok: true, environment: nextEnvironment, cards: nextCards, drawn };
    }

    function rerollGroup({ counts, environment, groupId, groups }) {
      const targetIndex = groups.findIndex((group) => String(group.id) === String(groupId));
      if (targetIndex < 0) return { ok: false, message: "找不到這一組，請重新開始本局。" };

      const groupCards = (group) => sections.flatMap((section) => group[section.key] || []);
      const otherKeys = new Set(groups.filter((_, index) => index !== targetIndex).flatMap(groupCards).map(cardKey));
      const currentKeys = new Set(groupCards(groups[targetIndex]).map(cardKey));
      let result = drawGroups({
        environment,
        groupCount: 1,
        counts,
        excludedKeys: new Set([...otherKeys, ...currentKeys])
      });
      if (!result.ok) {
        result = drawGroups({ environment, groupCount: 1, counts, excludedKeys: otherKeys });
      }
      if (!result.ok) return result;

      const replacement = {
        ...result.groups[0],
        id: groups[targetIndex].id,
        index: groups[targetIndex].index
      };
      const nextGroups = groups.map((group, index) => index === targetIndex ? replacement : group);
      return { ok: true, groups: nextGroups, drawn: result.drawn };
    }

    function allGroupCards(groups) {
      return groups.flatMap((group) => sections.flatMap((section) => group[section.key] || []));
    }

    return Object.freeze({ allGroupCards, drawGroups, exchangeSurvival, rerollGroup });
  }

  window.DEBATE_SURVIVAL_RESULT_SERVICE = Object.freeze({ create });
})();
