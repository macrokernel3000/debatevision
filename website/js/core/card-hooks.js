(() => {
  function create({ getActiveMode, getMetaphorVariant }) {
    function fillTemplate(template, name, context = {}) {
      const values = {
        name,
        card: name,
        role: context.role || context.roleName || name,
        roleName: context.roleName || context.role || name,
        mission: context.mission || context.missionName || "",
        missionName: context.missionName || context.mission || "",
        environment: context.environment || context.environmentName || "",
        environmentName: context.environmentName || context.environment || "",
        item: context.item || context.itemName || (context.deckId === "items" ? name : ""),
        itemName: context.itemName || context.item || (context.deckId === "items" ? name : ""),
        profession: context.profession || context.professionName || (context.deckId === "roles" ? name : ""),
        professionName: context.professionName || context.profession || (context.deckId === "roles" ? name : ""),
        "卡牌名稱": name,
        "角色": context.role || context.roleName || name,
        "任務": context.mission || context.missionName || "",
        "異境": context.environment || context.environmentName || "",
        "環境": context.environment || context.environmentName || "",
        "道具": context.item || context.itemName || (context.deckId === "items" ? name : ""),
        "物品": context.item || context.itemName || (context.deckId === "items" ? name : ""),
        "職業": context.profession || context.professionName || (context.deckId === "roles" ? name : "")
      };
      let text = String(template || "");
      for (const [key, value] of Object.entries(values)) {
        text = text
          .replaceAll(`{${key}}`, value)
          .replaceAll(`{{${key}}}`, value);
      }
      return text;
    }

    function build(name, deckId, rarity = "", context = {}) {
      const activeMode = getActiveMode();
      if (activeMode.cardMode === "metaphorCompass") {
        if (getMetaphorVariant() === "concrete") {
          if (deckId === "relations") {
            return [`說明「${name}」要求的是相似、象徵還是聯想。`, "找出比喻最容易被質疑的地方。", "嘗試換一個更精準的比喻關係。"];
          }
          return [`找出「人生」和「${name}」的一個相似點。`, `替「人生就像${name}」找一個生活例子。`, `說明這個比喻的限制或例外。`];
        }
        if (deckId === "relations") {
          return [`說明「${name}」讓兩個概念形成什麼關係。`, `找出這個關係最容易被質疑的地方。`, `嘗試把這個關係換成生活中的例子。`];
        }
        return [`定義「${name}」在這句命題中的意思。`, `替「${name}」找一個具體例子。`, `回應一個針對「${name}」的反例。`];
      }

      if (activeMode.cardMode === "salesPitch" && deckId === "needs") {
        return [`說明「${name}」常出現在哪些生活情境。`, `找出能滿足「${name}」的商品或服務。`, `包裝一個讓人願意為「${name}」付錢的故事。`];
      }

      if (Array.isArray(activeMode.cardHooks) && activeMode.cardHooks.length) {
        return activeMode.cardHooks.map((hook) => fillTemplate(hook, name, { ...context, deckId, rarity }));
      }

      if (deckId === "items" && rarity === "N") {
        return [`說明 ${name} 滿足哪一種需求。`, `找出最可能購買 ${name} 的對象。`, "包裝一個讓人願意掏錢的故事。"];
      }
      if (deckId === "items") {
        return [`提出 ${name} 的一個用途。`, `說明 ${name} 的限制與補救。`, "比較它和另一件物品誰更有價值。"];
      }
      if (deckId === "roles") {
        return ["說明這個身份的不可替代價值。", "主動承認一個弱點並化解。", "用一句話說服觀眾留下你。"];
      }
      if (deckId === "worlds" || deckId === "locations") {
        return ["說明這個環境最關鍵的限制。", "列出學生可以追問的線索。", "思考哪些資源在這裡會變得重要。"];
      }
      return ["把特性連回當前玩法。", "回答一個尖銳質疑。", "提出最終投票標準。"];
    }

    function withEnvironment(card, environment) {
      const environmentName = environment?.name || "無異境";
      return {
        ...card,
        hooks: build(card.name, card.deckId, card.rarity, {
          environment: environmentName,
          environmentName,
          item: card.deckId === "items" ? card.name : "",
          itemName: card.deckId === "items" ? card.name : "",
          profession: card.deckId === "roles" ? card.name : "",
          professionName: card.deckId === "roles" ? card.name : ""
        })
      };
    }

    function withSalesNeed(card, need) {
      return {
        ...card,
        hooks: [
          `說明「${card.name}」如何滿足「${need?.name || "本輪需求"}」。`,
          `找出最可能因為「${need?.name || "本輪需求"}」而購買「${card.name}」的對象。`,
          `包裝一個讓人願意為「${card.name}」付錢的理由。`
        ]
      };
    }

    function withSalesStory(card, concept) {
      return {
        ...card,
        hooks: concept
          ? [
            `說一個「${concept.name}的${card.name}」故事。`,
            `說明「${concept.name}」讓「${card.name}」變得更有價值的原因。`,
            `替「${card.name}」設計一句能被記住的銷售故事。`
          ]
          : [
            `替「${card.name}」說一個有畫面感的故事。`,
            `說明「${card.name}」背後可能代表的情緒、回憶或身份。`,
            `把「${card.name}」包裝成讓人願意購買的選擇。`
          ]
      };
    }

    function withSalesTarget(card, audience) {
      const audienceName = audience?.name || "本輪目標";
      return {
        ...card,
        hooks: [
          `說明「${card.name}」為什麼適合賣給「${audienceName}」。`,
          `找出「${audienceName}」可能在意的價格、功能或情緒價值。`,
          `設計一句能打動「${audienceName}」的銷售主張。`
        ]
      };
    }

    function dictionary(card) {
      return [
        `把「${card.name}」和其他抽出的卡建立一個活動題目。`,
        `說明「${card.name}」最值得討論的一個特色。`,
        "請學生提出一個例子、用途、比較標準或反例。"
      ];
    }

    return Object.freeze({
      build,
      dictionary,
      fillTemplate,
      withEnvironment,
      withSalesNeed,
      withSalesStory,
      withSalesTarget
    });
  }

  window.DEBATE_CARD_HOOKS = Object.freeze({ create });
})();
