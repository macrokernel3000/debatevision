(() => {
  function create({ modal, content, cardMarkup }) {
    let lastTrigger = null;

    function close() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove("has-desktop-card-detail");
      lastTrigger?.focus?.();
      lastTrigger = null;
    }

    function open(card, trigger = null) {
      if (!modal || !content || !card || window.matchMedia?.("(max-width: 560px)")?.matches) return;
      const horizontal = card.deckId === "worlds";
      content.className = `desktop-card-detail-content ${horizontal ? "is-horizontal" : "is-vertical"}`;
      content.innerHTML = cardMarkup(card, "desktop-card-detail-card");
      lastTrigger = trigger;
      modal.hidden = false;
      document.body.classList.add("has-desktop-card-detail");
      modal.querySelector("[data-desktop-card-detail-close]")?.focus();
    }

    modal?.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-desktop-card-detail-close]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal?.hidden) close();
    });

    return Object.freeze({ close, open });
  }

  window.DebateVisionDesktopCardDetail = Object.freeze({ create });
})();
