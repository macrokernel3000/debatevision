(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.metaphorCompass = {
    draw(ctx) {
      const fixedPrefix = ctx.metaphorVariant === "concrete" ? ctx.fixedMetaphorPrefixCard() : null;
      const fixedRelation = ctx.metaphorVariant === "concrete" ? ctx.fixedMetaphorRelationCard() : null;
      const lockedPrefix = fixedPrefix || (ctx.metaphorLocks.prefix ? ctx.currentMetaphorCards?.prefix : null);
      const lockedRelation = fixedRelation || (ctx.metaphorLocks.relation ? ctx.currentMetaphorCards?.relation : null);
      const lockedSuffix = ctx.metaphorLocks.suffix ? ctx.currentMetaphorCards?.suffix : null;
      const prefix = lockedPrefix || ctx.pickFromAvailable(ctx.metaphorPrefixDeck, 1)[0];
      const suffixExcludedKeys = new Set(prefix?.deckId === ctx.metaphorSuffixDeck ? [ctx.cardKey(prefix)] : []);
      const suffix = lockedSuffix || ctx.pickFromAvailable(ctx.metaphorSuffixDeck, 1, suffixExcludedKeys)[0];
      const newRelation = lockedRelation ? [] : ctx.pickFrom(ctx.activeSecondaryLibrary, 1);
      if (!prefix || !suffix || (!lockedRelation && !newRelation.length)) return ctx.renderPoolWarning();

      const relation = lockedRelation || newRelation[0];
      const drawnCards = [prefix, relation, suffix];
      ctx.renderMetaphorCompass([prefix, suffix], relation);
      ctx.markDrawn(drawnCards.filter((card) => (
        card !== lockedPrefix &&
        card !== lockedRelation &&
        card !== lockedSuffix
      )));
      return drawnCards;
    },
    reelPool(ctx) {
      if (ctx.metaphorVariant === "concrete") return ctx.selectedCardsFrom(ctx.metaphorSuffixDeck);
      const pools = [ctx.activeSecondaryLibrary, ctx.metaphorPrefixDeck, ctx.metaphorSuffixDeck]
        .filter((deckId, index, list) => deckId && list.indexOf(deckId) === index);
      return pools.flatMap((deckId) => ctx.selectedCardsFrom(deckId));
    }
  };
})();
