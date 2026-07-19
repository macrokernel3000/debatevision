(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.summonMission = {
    draw(ctx) {
      const mission = ctx.pickFrom(ctx.activeSecondaryLibrary, 1)[0];
      const cards = ctx.pickFromPool([...ctx.selectedSummonCards()], ctx.count).map((card) => ({
        ...card,
        hooks: ctx.buildHooks(card.name, card.deckId, card.rarity, {
          mission: mission?.name || "",
          missionName: mission?.name || "",
          role: card.name,
          roleName: card.name
        })
      }));
      if (!mission || cards.length < ctx.count) return ctx.renderPoolWarning();
      ctx.renderCombo(mission, cards, "本輪任務", { hideStageInDesktopResults: true });
      ctx.markDrawn([mission, ...cards]);
      return cards;
    },
    reelPool(ctx) {
      return ctx.selectedSummonCards();
    }
  };
})();
