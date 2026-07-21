(() => {
  function create(options) {
    function tokenIconMarkup(card) {
      if (card.tokenIcon) {
        return `<span class="token-symbol" aria-hidden="true">${card.tokenIcon}</span>`;
      }
      const image = card.iconAsset || "";
      if (image) {
        return `<img class="token-thumb" src="${image}" alt="" aria-hidden="true" />`;
      }
      return `<span class="token-symbol" aria-hidden="true">${options.iconFor(card)}</span>`;
    }

    function tokenMarkup(card, checked) {
      const key = options.cardKey(card);
      return `
        <label class="token ${checked ? "" : "is-disabled"}">
          <input type="checkbox" data-card-key="${key}" ${checked ? "checked" : ""} />
          <span class="token-label">${tokenIconMarkup(card)}<span>${card.name}</span></span>
        </label>
      `;
    }

    function cardMarkup(card, extraClass = "", cardOptions = {}) {
      const layoutStyle = options.imageStyleFor(card);
      const target = options.editTargetForCard(card);
      const selectedTarget = options.getSelectedEditTarget();
      const isSelected = options.isEditMode && selectedTarget
        && selectedTarget.group === target?.group
        && selectedTarget.id === target?.id;
      const imageEditAttributes = target
        ? `style="${layoutStyle}" data-edit-group="${target.group}" data-edit-id="${target.id}" data-edit-name="${target.name}" data-card-key="${target.cardKey}"`
        : `style="${layoutStyle}"`;
      const image = options.imageService.imageForCard(card);
      const imageMarkup = image
        ? `<img src="${image}" alt="${card.name} 卡圖" ${options.imageService.managedAttributes(image, options.imageService.fallbackForCard(card))} ${imageEditAttributes} />`
        : `<span>${options.iconFor(card)}</span>`;
      const typeText = card.deckId === "items" ? card.deckLabel : `${card.deckLabel} · ${card.rarity || "C"}`;
      const resultControl = cardOptions.resultControl;
      const resultControlMarkup = resultControl
        ? `
          <div class="mobile-result-card-control">
            <span>${resultControl.title}</span>
            <button
              type="button"
              class="mobile-result-lock ${resultControl.locked ? "is-locked" : ""}"
              data-mobile-result-lock="${resultControl.key}"
              aria-pressed="${resultControl.locked ? "true" : "false"}"
              aria-label="${resultControl.locked ? `取消鎖定${resultControl.title}` : `鎖定${resultControl.title}`}"
            >
              <span aria-hidden="true">${resultControl.locked ? "🔒" : "○"}</span>
              <b>${resultControl.locked ? "已鎖定" : "鎖定"}</b>
            </button>
          </div>
        `
        : "";

      return `
        <article class="battle-card ${extraClass} ${resultControl?.locked ? "is-mobile-result-locked" : ""} ${isSelected ? "is-edit-selected" : ""}" data-rarity="${card.rarity || "C"}" data-card-key="${options.cardKey(card)}" data-deck-id="${card.deckId}" data-image-id="${card.imageId || ""}">
          ${resultControlMarkup}
          <div class="card-title">
            <h3>${card.name}</h3>
            <span class="card-type">${typeText}</span>
          </div>
          <div class="card-art">${imageMarkup}</div>
          <p class="card-lore">${card.lore}</p>
          <ul class="card-hooks">${card.hooks.map((hook) => `<li>${hook}</li>`).join("")}</ul>
        </article>
      `;
    }

    return Object.freeze({ cardMarkup, tokenIconMarkup, tokenMarkup });
  }

  window.DebateVisionCards = Object.freeze({ create });
})();
