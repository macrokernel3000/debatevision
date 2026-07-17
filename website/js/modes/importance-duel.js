(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.importanceDuel = {
    draw(ctx) {
      const activeDeckIds = ctx.importanceActiveDeckIds();
      const pool = activeDeckIds.flatMap((deckId) => ctx.selectedCardsFrom(deckId));
      const cards = ctx.pickFromPool(pool, 2);
      if (cards.length < 2) return ctx.renderPoolWarning();
      ctx.renderDuel(cards);
      ctx.markDrawn(cards);
      return cards;
    },
    reelPool(ctx) {
      return ctx.importanceActiveDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    }
  };
})();
