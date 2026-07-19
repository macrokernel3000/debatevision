(() => {
  function artMarkup(cover = {}) {
    const art = cover.image
      ? `<img src="${cover.image}" alt="" aria-hidden="true" />`
      : `<span aria-hidden="true">${cover.symbol || "□"}</span>`;
    return `<span class="deck-option-art ${cover.isDeckCover ? "is-cover-art" : ""}">${art}</span>`;
  }

  function selectCard(item, attribute) {
    const value = item.value ?? item.deckId;
    return `
      <button
        type="button"
        class="deck-option-card ${item.selected ? "is-active" : "is-dimmed"}"
        ${attribute}="${value}"
        data-deck-tone="${item.tone || "default"}"
        aria-pressed="${item.selected ? "true" : "false"}"
      >
        <span class="deck-option-check" aria-hidden="true">${item.selected ? "✓" : ""}</span>
        ${artMarkup(item.cover)}
        <strong>${item.label}</strong>
        ${item.meta ? `<small>${item.meta}</small>` : ""}
      </button>
    `;
  }

  function selectGroup(items, options) {
    return `
      <div class="deck-option-grid ${options.className || ""}" role="group" aria-label="${options.ariaLabel}">
        ${items.map((item) => selectCard(item, options.attribute)).join("")}
      </div>
    `;
  }

  function amountCard(item) {
    const minusDisabled = item.value <= item.min;
    const plusDisabled = item.value >= item.max;
    return `
      <article class="deck-option-card is-amount ${item.value > 0 ? "is-active" : "is-dimmed"}" data-deck-tone="${item.tone || "default"}">
        ${artMarkup(item.cover)}
        <strong>${item.label}</strong>
        <div class="deck-option-stepper">
          <button type="button" data-survival-step="${item.key}" data-step="-1" ${minusDisabled ? "disabled" : ""} aria-label="減少${item.label}">−</button>
          <input type="text" inputmode="numeric" min="${item.min}" max="${item.max}" value="${item.value}" data-survival-count="${item.key}" aria-label="${item.label}" />
          <button type="button" data-survival-step="${item.key}" data-step="1" ${plusDisabled ? "disabled" : ""} aria-label="增加${item.label}">＋</button>
        </div>
      </article>
    `;
  }

  window.DebateVisionDeckOptions = Object.freeze({
    amountCard,
    selectGroup
  });
})();
