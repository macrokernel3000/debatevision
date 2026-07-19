(() => {
  const DEFAULT_LAYOUT = Object.freeze({
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    overlay: 0.28
  });

  function createImageService({
    baseLayouts = {},
    editMode = false,
    storageKey = "debatevision-image-layouts-draft"
  } = {}) {
    const layouts = mergeLayouts(baseLayouts, readDraftLayouts());

    function readDraftLayouts() {
      if (!editMode) return {};
      try {
        return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      } catch {
        return {};
      }
    }

    function mergeLayouts(base, draft) {
      const merged = JSON.parse(JSON.stringify(base || {}));
      for (const [group, groupLayouts] of Object.entries(draft || {})) {
        merged[group] = { ...(merged[group] || {}), ...(groupLayouts || {}) };
      }
      return merged;
    }

    function saveDraftLayouts() {
      if (!editMode) return;
      window.localStorage.setItem(storageKey, JSON.stringify(layouts));
    }

    function targetForCard(card) {
      if (!card?.deckId || !card?.imageId) return null;
      return {
        group: card.deckId,
        id: card.imageId,
        name: card.name,
        label: card.deckLabel,
        cardKey: `${card.deckId}::${card.rarity || "C"}::${card.name}`
      };
    }

    function targetForMode(mode) {
      if (!mode?.id) return null;
      return {
        group: "modes",
        id: mode.id,
        name: mode.title,
        label: "活動大圖",
        cardKey: ""
      };
    }

    function minScaleForTarget(target) {
      return ["modes", "worlds", "locations"].includes(target?.group) ? 1 : 0.5;
    }

    function layoutForTarget(target) {
      if (!target?.group || !target?.id) return { ...DEFAULT_LAYOUT };
      return {
        ...DEFAULT_LAYOUT,
        ...((layouts[target.group] || {})[target.id] || {})
      };
    }

    function setLayoutForTarget(target, nextLayout) {
      if (!target?.group || !target?.id) return;
      layouts[target.group] ||= {};
      const minScale = minScaleForTarget(target);
      layouts[target.group][target.id] = {
        scale: Math.min(4, Math.max(minScale, Number(nextLayout.scale) || DEFAULT_LAYOUT.scale)),
        x: Number(nextLayout.x) || DEFAULT_LAYOUT.x,
        y: Number(nextLayout.y) || DEFAULT_LAYOUT.y,
        rotate: Number(nextLayout.rotate) || DEFAULT_LAYOUT.rotate,
        overlay: Math.min(
          0.8,
          Math.max(0, Number.isFinite(Number(nextLayout.overlay)) ? Number(nextLayout.overlay) : DEFAULT_LAYOUT.overlay)
        )
      };
      saveDraftLayouts();
    }

    function imageStyleForTarget(target) {
      const layout = layoutForTarget(target);
      return `--image-scale:${layout.scale}; --image-x:${layout.x}px; --image-y:${layout.y}px; --image-rotate:${layout.rotate}deg; --overlay-strength:${layout.overlay};`;
    }

    function imageForCard(card) {
      return card?.image || card?.iconAsset || "";
    }

    function fallbackForCard(card) {
      return card?.image && card?.iconAsset && card.image !== card.iconAsset ? card.iconAsset : "";
    }

    function imageForMode(mode) {
      return mode?.image || mode?.backgroundImage || "";
    }

    function resolveUrl(image) {
      if (!image) return "";
      try {
        return new URL(image, document.baseURI).href;
      } catch {
        return image;
      }
    }

    function cssUrl(image) {
      const resolved = resolveUrl(image);
      if (!resolved) return "";
      return `url("${resolved.replace(/"/g, "%22")}")`;
    }

    function modeCardStyle(mode) {
      const resolved = resolveUrl(imageForMode(mode));
      if (!resolved) return "";
      const safeImage = resolved.replace(/"/g, "%22").replace(/\)/g, "%29");
      return ` style="--mode-card-image: url(&quot;${safeImage}&quot;)"`;
    }

    function managedAttributes(primary, fallback = "") {
      if (!primary) return "";
      const safeFallback = String(fallback).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
      return `data-image-managed="true"${safeFallback ? ` data-fallback-src="${safeFallback}"` : ""}`;
    }

    function installFallbackHandler(root = document) {
      root.addEventListener("error", (event) => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || image.dataset.imageManaged !== "true") return;
        if (image.dataset.fallbackSrc && image.dataset.fallbackTried !== "true") {
          image.dataset.fallbackTried = "true";
          image.src = image.dataset.fallbackSrc;
          return;
        }
        image.hidden = true;
      }, true);
    }

    function exportableLayouts(group = "items") {
      return layouts[group] || {};
    }

    return Object.freeze({
      defaultLayout: DEFAULT_LAYOUT,
      targetForCard,
      targetForMode,
      minScaleForTarget,
      layoutForTarget,
      setLayoutForTarget,
      imageStyleForTarget,
      imageForCard,
      fallbackForCard,
      imageForMode,
      cssUrl,
      modeCardStyle,
      managedAttributes,
      installFallbackHandler,
      exportableLayouts
    });
  }

  window.DEBATE_IMAGE_SERVICE = Object.freeze({ create: createImageService });
})();
