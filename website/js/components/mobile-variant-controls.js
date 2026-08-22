(() => {
  function render(state, mobileText) {
    if (state.cardMode === "salesPitch") {
      return `
        <div class="mobile-survival-mode-grid mobile-sales-mode-grid" role="group" aria-label="銷售密令模式">
          ${["supply", "story", "target"].map((variant) => `
            <button type="button" class="mobile-survival-mode ${state.salesVariant === variant ? "is-active" : ""}" data-mobile-sales-variant="${variant}">
              <strong>${mobileText(`mobile.sales.${variant}Title`, { supply: "供需版", story: "故事版", target: "目標版" }[variant])}</strong>
              <span>${mobileText(`mobile.sales.${variant}Description`, { supply: "把商品賣給有特定需求的客戶", story: "用概念與故事替商品增加價值", target: "針對不同對象設計銷售方式" }[variant])}</span>
            </button>
          `).join("")}
        </div>
        ${state.salesVariant === "story" ? `
          <label class="mobile-toggle-pill">
            <input type="checkbox" data-mobile-sales-no-concept ${state.salesNoConcept ? "checked" : ""} />
            <span>${mobileText("mobile.sales.noConcept", "無概念")}</span>
          </label>
        ` : ""}
        ${state.salesVariant === "target" ? `
          <div class="mobile-pill-row" role="group" aria-label="目標類型">
            ${state.salesAudienceDeckIds.map((deckId) => `
              <button type="button" class="${state.salesAudienceDeck === deckId ? "is-active" : ""}" data-mobile-sales-audience="${deckId}">
                ${deckId === "summons" ? "異族" : state.variantLabel(deckId)}
              </button>
            `).join("")}
          </div>
        ` : ""}
      `;
    }
    if (state.cardMode !== "metaphorCompass") return "";
    return `
      <div class="mobile-survival-mode-grid mobile-sales-mode-grid" role="group" aria-label="隱喻羅盤版本">
        ${["concrete", "abstract"].map((variant) => `
          <button type="button" class="mobile-survival-mode ${state.metaphorVariant === variant ? "is-active" : ""}" data-mobile-metaphor-variant="${variant}">
            <strong>${mobileText(`mobile.metaphor.${variant}`, state.metaphorVariantLabel(variant))}</strong>
            <span>${mobileText(`mobile.metaphor.${variant}Description`, variant === "concrete" ? "固定抽出「人生」「就像」，再連結一個具體事物" : "連結兩個抽象概念並說明關係")}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  window.DebateVisionMobileVariantControls = Object.freeze({ render });
})();
