(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.importanceDuel = {
    draw(ctx) {
      if (!ctx.isMobileView) {
        const [redDeck, blueDeck] = ctx.importanceSideDeckIds();
        const red = ctx.pickFromPool([...ctx.selectedCardsFrom(redDeck)], 1)[0];
        const bluePool = ctx.selectedCardsFrom(blueDeck).filter((card) => !red || ctx.cardKey(card) !== ctx.cardKey(red));
        const blue = ctx.pickFromPool([...bluePool], 1)[0];
        if (!red || !blue) return ctx.renderPoolWarning();
        const cards = [red, blue];
        ctx.renderDuel(cards);
        ctx.markDrawn(cards);
        return cards;
      }
      const activeDeckIds = ctx.importanceActiveDeckIds();
      const pool = activeDeckIds.flatMap((deckId) => ctx.selectedCardsFrom(deckId));
      const cards = ctx.pickFromPool(pool, 2);
      if (cards.length < 2) return ctx.renderPoolWarning();
      ctx.renderDuel(cards);
      ctx.markDrawn(cards);
      return cards;
    },
    reelPool(ctx) {
      if (!ctx.isMobileView) return ctx.importanceSideDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
      return ctx.importanceActiveDeckIds().flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    }
  };
})();
