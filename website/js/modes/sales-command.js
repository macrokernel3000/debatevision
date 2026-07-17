(() => {
  const controllers = window.DEBATE_MODE_CONTROLLERS ||= {};

  controllers.salesPitch = {
    draw(ctx) {
      if (ctx.salesVariant === "supply") return drawSupply(ctx);
      if (ctx.salesVariant === "story") return drawStory(ctx);
      return drawTarget(ctx);
    },
    reelPool(ctx) {
      if (ctx.salesVariant === "supply") return ctx.selectedCardsFrom("needs");
      return ctx.selectedCardsFrom("items");
    }
  };

  function drawSupply(ctx) {
    const need = ctx.pickFrom("needs", 1)[0];
    const items = ctx.pickFrom("items", ctx.count).map((card) => ctx.cardWithSalesNeedHooks(card, need));
    if (!need || items.length < ctx.count) return ctx.renderPoolWarning();
    ctx.renderCombo(need, items, "本輪需求");
    ctx.markDrawn([need, ...items]);
    return [need, ...items];
  }

  function drawStory(ctx) {
    const concept = ctx.salesNoConcept ? null : ctx.pickFrom("concepts", 1)[0];
    const items = ctx.pickFrom("items", ctx.count).map((card) => ctx.cardWithSalesStoryHooks(card, concept));
    if ((!ctx.salesNoConcept && !concept) || items.length < ctx.count) return ctx.renderPoolWarning();
    const stageCard = concept || {
      name: "無概念",
      lore: "本輪不抽概念，直接用商品本身編織一個銷售故事。",
      icon: "$",
      deckLabel: "故事版"
    };
    ctx.renderCombo(stageCard, items, "故事主題");
    if (concept) ctx.markDrawn([concept, ...items]);
    else ctx.markDrawn(items);
    return concept ? [concept, ...items] : items;
  }

  function drawTarget(ctx) {
    const audience = ctx.pickFromPool([...ctx.selectedSalesAudienceCards()], 1)[0];
    const items = ctx.pickFrom("items", ctx.count).map((card) => ctx.cardWithSalesTargetHooks(card, audience));
    if (!audience || items.length < ctx.count) return ctx.renderPoolWarning();
    ctx.renderCombo(audience, items, "本輪目標");
    ctx.markDrawn([audience, ...items]);
    return [audience, ...items];
  }
})();
