(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.itemEnvironment = {
    draw(ctx) {
      if (ctx.survivalVariant === "battle") return drawBattle(ctx);
      return drawSurvival(ctx);
    },
    reelPool(ctx) {
      if (ctx.survivalVariant !== "survival") return ctx.selectedCardsFrom(ctx.activeSecondaryLibrary);
      return ctx.survivalActiveDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    }
  };

  function drawBattle(ctx) {
    ctx.survivalGroupCount = Math.max(1, Math.min(8, ctx.drawCountValue || ctx.survivalGroupCount));
    const environment = ctx.pickFrom(ctx.activeSecondaryLibrary, 1)[0];
    const itemPool = ctx.selectedCardsFrom("items");
    const rolePool = ctx.selectedCardsFrom("roles");
    const creaturePool = ctx.selectedCardsFrom("creatures");
    const alienPool = ctx.selectedCardsFrom("summons").filter((card) => card.rarity === "異族");
    const powerPool = ctx.selectedCardsFrom("summons").filter((card) => card.rarity === "超能");
    const specialistPool = ctx.selectedCardsFrom("summons").filter((card) => card.rarity === "特職");
    const itemNeed = ctx.survivalGroupCount * ctx.survivalItemCount;
    const roleNeed = ctx.survivalGroupCount * ctx.survivalRoleCount;
    const creatureNeed = ctx.survivalGroupCount * ctx.survivalCreatureCount;
    const alienNeed = ctx.survivalGroupCount * ctx.survivalAlienCount;
    const powerNeed = ctx.survivalGroupCount * ctx.survivalPowerCount;
    const specialistNeed = ctx.survivalGroupCount * ctx.survivalSpecialistCount;

    if (
      !environment ||
      itemPool.length < itemNeed ||
      rolePool.length < roleNeed ||
      creaturePool.length < creatureNeed ||
      alienPool.length < alienNeed ||
      powerPool.length < powerNeed ||
      specialistPool.length < specialistNeed
    ) {
      return ctx.renderPoolWarning();
    }

    const groups = Array.from({ length: ctx.survivalGroupCount }, (_, index) => ({
      index: index + 1,
      items: ctx.pickFromPool(itemPool, ctx.survivalItemCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment)),
      roles: ctx.pickFromPool(rolePool, ctx.survivalRoleCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment)),
      creatures: ctx.pickFromPool(creaturePool, ctx.survivalCreatureCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment)),
      aliens: ctx.pickFromPool(alienPool, ctx.survivalAlienCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment)),
      powers: ctx.pickFromPool(powerPool, ctx.survivalPowerCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment)),
      specialists: ctx.pickFromPool(specialistPool, ctx.survivalSpecialistCount).map((card) => ctx.cardWithEnvironmentHooks(card, environment))
    }));

    const drawnCards = [environment, ...groups.flatMap((group) => [
      ...group.items,
      ...group.roles,
      ...group.creatures,
      ...group.aliens,
      ...group.powers,
      ...group.specialists
    ])];
    ctx.renderSurvivalBattle(environment, groups);
    ctx.markDrawn(drawnCards);
    return drawnCards;
  }

  function drawSurvival(ctx) {
    const lockedEnvironment = !ctx.noEnvironment && ctx.lockEnvironment && ctx.currentStageCard?.deckId === ctx.activeSecondaryLibrary
      ? ctx.currentStageCard
      : null;
    const environment = ctx.noEnvironment ? null : lockedEnvironment || ctx.pickFrom(ctx.activeSecondaryLibrary, 1)[0];
    const survivalPool = ctx.survivalActiveDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    const cards = ctx.pickFromPool(survivalPool, ctx.count).map((card) => ctx.cardWithEnvironmentHooks(card, environment));
    if ((!ctx.noEnvironment && !environment) || cards.length < ctx.count) return ctx.renderPoolWarning();
    ctx.renderCombo(environment, cards, "本輪異境");
    ctx.markDrawn(ctx.noEnvironment || lockedEnvironment ? cards : [environment, ...cards]);
    return ctx.noEnvironment ? cards : [environment, ...cards];
  }
})();
