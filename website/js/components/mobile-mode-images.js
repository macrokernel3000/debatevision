(() => {
  function create(options) {
    const {
      banner,
      homeGrid,
      homeScreen,
      imageService,
      isMobileView,
      modes,
      uiText
    } = options;

    const loaded = new Set();

    function imageMarkup(mode, variant, { eager = false } = {}) {
      const primary = imageService.resolveUrl(imageService.mobileImageForMode(mode, variant));
      const fallback = imageService.resolveUrl(imageService.imageForMode(mode));
      return `
        <span class="mobile-mode-image-frame" data-mobile-mode-image-state="loading">
          <span class="mobile-mode-image-skeleton" aria-hidden="true"></span>
          <img
            class="mobile-mode-image"
            src="${primary}"
            data-mobile-mode-fallback="${fallback}"
            alt=""
            aria-hidden="true"
            loading="${eager ? "eager" : "lazy"}"
            fetchpriority="${eager ? "high" : "low"}"
            decoding="async"
          />
        </span>
      `;
    }

    function settleImage(image, state) {
      const frame = image.closest("[data-mobile-mode-image-state]");
      if (!frame) return;
      frame.dataset.mobileModeImageState = state;
      if (state === "loaded") loaded.add(image.currentSrc || image.src);
    }

    function handleLoad(event) {
      const image = event.target.closest?.(".mobile-mode-image");
      if (image) settleImage(image, "loaded");
    }

    function handleError(event) {
      const image = event.target.closest?.(".mobile-mode-image");
      if (!image) return;
      const fallback = image.dataset.mobileModeFallback;
      if (fallback && image.dataset.mobileModeFallbackTried !== "true") {
        image.dataset.mobileModeFallbackTried = "true";
        image.src = fallback;
        return;
      }
      settleImage(image, "error");
    }

    function hydrate(root) {
      root?.querySelectorAll(".mobile-mode-image").forEach((image) => {
        if (image.complete && image.naturalWidth > 0) settleImage(image, "loaded");
        else if (image.complete && image.dataset.mobileModeFallbackTried === "true") settleImage(image, "error");
      });
    }

    function renderHome() {
      if (!homeGrid) return;
      homeGrid.innerHTML = modes.map((mode, index) => `
        <button
          class="mobile-home-card"
          type="button"
          data-mobile-home-mode="${mode.id}"
        >
          ${imageMarkup(mode, "thumb", { eager: index === 0 })}
          <span class="mobile-home-card-shade" aria-hidden="true"></span>
          <span class="mobile-home-card-icon">${mode.icon}</span>
          <span class="mobile-home-card-copy">
            <strong>${mode.title}</strong>
            <small>${mode.menuLabel || mode.track}</small>
          </span>
          <b aria-hidden="true">›</b>
        </button>
      `).join("");
      const eyebrow = homeScreen?.querySelector("[data-mobile-home-eyebrow]");
      const title = homeScreen?.querySelector("[data-mobile-home-title]");
      const subtitle = homeScreen?.querySelector("[data-mobile-home-subtitle]");
      if (eyebrow) eyebrow.textContent = uiText("mobile.home.eyebrow");
      if (title) title.textContent = uiText("mobile.home.title");
      if (subtitle) subtitle.textContent = uiText("mobile.home.subtitle");
      hydrate(homeGrid);
    }

    function renderBanner(mode) {
      if (!banner || !isMobileView()) return;
      const image = banner.querySelector(".mobile-mode-image");
      const nextSrc = imageService.resolveUrl(imageService.mobileImageForMode(mode, "banner"));
      if (image?.dataset.modeId === mode.id && image.src === nextSrc) return;
      const media = banner.querySelector(".mobile-mode-banner-media");
      if (!media) return;
      media.innerHTML = imageMarkup(mode, "banner", { eager: mode.id === "item-survival" });
      const nextImage = media.querySelector(".mobile-mode-image");
      if (nextImage) nextImage.dataset.modeId = mode.id;
      hydrate(media);
    }

    document.addEventListener("load", handleLoad, true);
    document.addEventListener("error", handleError, true);

    return Object.freeze({ renderBanner, renderHome });
  }

  window.DebateVisionMobileModeImages = Object.freeze({ create });
})();
