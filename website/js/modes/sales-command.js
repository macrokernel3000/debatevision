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
    ctx.renderSalesPair(items, need, { left: "我的產品", right: "客戶需求" });
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
      deckId: "concepts",
      deckLabel: "故事版",
      rarity: "",
      hooks: [
        "替商品建立一個有畫面感的使用情境。",
        "說明商品背後可能代表的情緒、回憶或身份。",
        "把平凡商品包裝成讓人願意購買的故事。"
      ]
    };
    ctx.renderSalesPair(items, stageCard, { left: "我的產品", right: "什麼特色" });
    if (concept) ctx.markDrawn([concept, ...items]);
    else ctx.markDrawn(items);
    return concept ? [concept, ...items] : items;
  }

  function drawTarget(ctx) {
    const audience = ctx.pickFromPool([...ctx.selectedSalesAudienceCards()], 1)[0];
    const items = ctx.pickFrom("items", ctx.count).map((card) => ctx.cardWithSalesTargetHooks(card, audience));
    if (!audience || items.length < ctx.count) return ctx.renderPoolWarning();
    ctx.renderSalesPair(items, audience, { left: "我的產品", right: "目標課群" });
    ctx.markDrawn([audience, ...items]);
    return [audience, ...items];
  }
})();
