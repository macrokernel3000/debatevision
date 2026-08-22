(() => {
  function create(options) {
    const {
      container,
      editTargetForCard,
      getActiveMode,
      getCurrentStageCard,
      getEnvironmentLocked = () => false,
      getGenericStageLocked = () => false,
      getSurvivalResultKind = () => "",
      getSalesVariant = () => "",
      imageService,
      imageStyleForTarget,
      sharedDeckCover,
      uiText
    } = options;

    function readySubtitle() {
      return getActiveMode().cardMode === "itemEnvironment"
        ? uiText("reel.ready.subtitle.environment")
        : uiText("reel.ready.subtitle");
    }

    function render(card = getCurrentStageCard(), spinningName = "") {
      const mode = getActiveMode();
      const salesPitch = mode.cardMode === "salesPitch";
      const salesTarget = salesPitch && getSalesVariant() === "target";
      const title = spinningName || card?.name || uiText("reel.ready.title");
      const subtitle = card?.lore || readySubtitle();
      const image = imageService.imageForCard(card);
      const deckCover = card?.deckId ? sharedDeckCover(card.deckId).image : "";
      const fallbackImage = imageService.fallbackForCard(card) || deckCover;
      const markImage = deckCover || image;
      const target = editTargetForCard(card);
      const style = target ? imageStyleForTarget(target) : "";
      const editAttributes = target
        ? `style="${style}" data-edit-group="${target.group}" data-edit-id="${target.id}" data-edit-name="${target.name}" data-card-key="${target.cardKey}"`
        : "";
      const showEnvironmentLock = mode.cardMode === "itemEnvironment"
        && ["survival", "battle"].includes(getSurvivalResultKind())
        && Boolean(card);
      const environmentLocked = showEnvironmentLock && getEnvironmentLocked();
      const showMissionLock = mode.cardMode === "summonMission" && Boolean(card);
      const stageLocked = showEnvironmentLock ? environmentLocked : showMissionLock && getGenericStageLocked();
      const stageLockLabel = showEnvironmentLock ? "異境" : "任務";

      container.classList.toggle("has-scene-image", Boolean(image));
      container.classList.toggle("is-sales-pitch", salesPitch);
      container.classList.toggle("is-sales-target", salesTarget);
      container.setAttribute("style", style);
      if (target) {
        container.dataset.editGroup = target.group;
        container.dataset.editId = target.id;
        container.dataset.editName = target.name;
      } else {
        delete container.dataset.editGroup;
        delete container.dataset.editId;
        delete container.dataset.editName;
      }

      container.innerHTML = `
        ${image ? `<img class="reel-scene-image" src="${image}" alt="${title} 場景圖" ${imageService.managedAttributes(image, fallbackImage)} ${editAttributes} />` : ""}
        <div class="reel-scene-mark">
          ${markImage ? `<img class="reel-scene-mark-image" src="${markImage}" alt="" aria-hidden="true" ${imageService.managedAttributes(markImage, imageService.fallbackForCard(card))} />` : (card ? mode.icon : "?")}
        </div>
        <div class="reel-scene-copy">
          <span>${card?.deckLabel || mode.secondaryLabel || mode.track || "Scene Card"}</span>
          <strong>${title}</strong>
          <small>${subtitle}</small>
        </div>
        ${showEnvironmentLock || showMissionLock ? `
          <button
            type="button"
            class="reel-stage-lock ${stageLocked ? "is-locked" : ""}"
            ${showEnvironmentLock ? "data-reel-stage-lock" : "data-reel-mission-lock"}
            aria-pressed="${stageLocked ? "true" : "false"}"
            aria-label="${stageLocked ? `取消鎖定${stageLockLabel}` : `鎖定${stageLockLabel}`}"
          >
            <span aria-hidden="true">${stageLocked ? "🔒" : "🔓"}</span>
            <b>${stageLocked ? `${stageLockLabel}已鎖定` : `鎖定${stageLockLabel}`}</b>
          </button>
        ` : ""}
      `;
    }

    return Object.freeze({ render });
  }

  window.DebateVisionReelView = Object.freeze({ create });
})();
