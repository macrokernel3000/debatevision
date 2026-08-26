(() => {
  function create({ modal, content, cardMarkup }) {
    let lastTrigger = null;

    function escapeHtml(value) {
      return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function challengeMarkup(challenges) {
      if (!challenges.length) return "";
      return `
        <section class="desktop-card-challenges" aria-label="異境挑戰">
          <h4>異境挑戰</h4>
          <ol>
            ${challenges.map((challenge) => {
              const [title, ...details] = challenge.split("：");
              return `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(details.join("："))}</span></li>`;
            }).join("")}
          </ol>
        </section>
      `;
    }

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
      const challenges = Array.isArray(card.challenges) ? card.challenges : [];
      const challengeClass = challenges.length ? " has-challenges" : "";
      content.className = `desktop-card-detail-content ${horizontal ? "is-horizontal" : "is-vertical"}${challengeClass}`;
      const baseMarkup = cardMarkup(card, `desktop-card-detail-card${challengeClass}`);
      const labeledMarkup = challenges.length
        ? baseMarkup
          .replace('<p class="card-lore">', '<section class="desktop-card-intro" aria-label="卡片介紹"><h4>卡片介紹</h4><p class="card-lore">')
          .replace("</p>", "</p></section>")
        : baseMarkup;
      content.innerHTML = challenges.length
        ? labeledMarkup.replace("</article>", `${challengeMarkup(challenges)}</article>`)
        : baseMarkup;
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
