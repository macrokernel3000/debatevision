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
    ctx.survivalGroupCount = Math.max(1, Math.min(8, ctx.survivalGroupCount || 1));
    const resultLocks = ctx.survivalResultLocks || { environment: false };
    const lockedEnvironment = resultLocks.environment
      && ctx.currentSurvivalEnvironment?.deckId === ctx.activeSecondaryLibrary
      ? ctx.currentSurvivalEnvironment
      : null;
    const environment = lockedEnvironment || ctx.pickFrom(ctx.activeSecondaryLibrary, 1)[0];
    if (!environment) return ctx.renderPoolWarning();
    const groupResult = ctx.drawSurvivalGroups({
      environment,
      groupCount: ctx.survivalGroupCount,
      counts: {
        items: ctx.survivalItemCount,
        roles: ctx.survivalRoleCount,
        creatures: ctx.survivalCreatureCount,
        aliens: ctx.survivalAlienCount,
        powers: ctx.survivalPowerCount,
        specialists: ctx.survivalSpecialistCount
      }
    });
    if (!groupResult.ok) return ctx.renderPoolWarning();
    const groups = groupResult.groups;

    const drawnCards = [environment, ...groups.flatMap((group) => [
      ...group.items,
      ...group.roles,
      ...group.creatures,
      ...group.aliens,
      ...group.powers,
      ...group.specialists
    ])];
    ctx.startSurvivalBattle(environment, groups, Boolean(lockedEnvironment));
    ctx.markDrawn(lockedEnvironment ? drawnCards.slice(1) : drawnCards);
    return drawnCards;
  }

  function drawSurvival(ctx) {
    const resultLocks = ctx.survivalResultLocks || { environment: false, cards: new Set() };
    const currentCards = ctx.currentSurvivalCards || [];
    const lockedEnvironment = !ctx.noEnvironment && (ctx.lockEnvironment || resultLocks.environment) && ctx.currentSurvivalEnvironment?.deckId === ctx.activeSecondaryLibrary
      ? ctx.currentSurvivalEnvironment
      : null;
    const environment = ctx.noEnvironment ? null : lockedEnvironment || ctx.pickFrom(ctx.activeSecondaryLibrary, 1)[0];
    const survivalPool = ctx.survivalActiveDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    const lockedCards = currentCards.filter((card) => resultLocks.cards.has(ctx.cardKey(card))).slice(0, ctx.count);
    const lockedKeys = new Set(lockedCards.map(ctx.cardKey));
    const freshCards = ctx.pickFromPool(survivalPool.filter((card) => !lockedKeys.has(ctx.cardKey(card))), ctx.count - lockedCards.length);
    const cards = [...lockedCards, ...freshCards].map((card) => ctx.cardWithEnvironmentHooks(card, environment));
    if ((!ctx.noEnvironment && !environment) || cards.length < ctx.count) return ctx.renderPoolWarning();
    ctx.startSurvivalResult(environment, cards, true);
    ctx.markDrawn(ctx.noEnvironment || lockedEnvironment ? cards : [environment, ...cards]);
    return ctx.noEnvironment ? cards : [environment, ...cards];
  }
})();
