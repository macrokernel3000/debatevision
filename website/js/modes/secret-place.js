(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.secretPlace = {
    draw(ctx) {
      const places = ctx.selectedCardsFrom(ctx.activeLibrary);
      if (!places.length) return ctx.renderPoolWarning();
      ctx.lastSecretCard = ctx.secretCardFromIndex(ctx.secretAnswerIndex);
      ctx.secretRevealed = false;
      ctx.currentStageCard = {
        name: "秘密選號已開啟",
        lore: `目前有 ${places.length} 個「${ctx.decks[ctx.activeLibrary]?.label || "詞庫"}」候選，請輸入秘密編號。`,
        icon: ctx.activeMode.icon,
        deckLabel: ctx.decks[ctx.activeLibrary]?.label || ctx.activeMode.primaryLabel
      };
      ctx.renderSecretPlace(ctx.lastSecretCard, false);
      return [ctx.currentStageCard];
    }
  };
})();
