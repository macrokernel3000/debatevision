(() => {
  function create(options) {
    const {
      editTargetForMode,
      elements,
      getActiveMode,
      imageService,
      imageStyleForTarget,
      mobileModeImages,
      lifecycleFor,
      modes,
      modeStatusText
    } = options;
    const {
      activityMenu,
      activityMenuPanel,
      activityMenuToggle,
      cardDictionaryPanel,
      controlBand,
      controlNote,
      drawButton,
      libraryBand,
      mobileModeBanner,
      mobileModeEmblem,
      mobileModeRule,
      mobileModeTitle,
      mobileModeTrack,
      modeGrid,
      playArea,
      sceneBadge,
      sceneDescription,
      sceneEmblem,
      scenePreview,
      sceneTitle
    } = elements;
    let menuOpen = false;

    function cardMeta(mode) {
      return {
        palette: mode.palette || mode.tone || "cyan",
        menuLabel: mode.menuLabel || mode.track || ""
      };
    }

    function renderMenu() {
      if (!activityMenuPanel) return;
      const activeMode = getActiveMode();
      activityMenuPanel.innerHTML = modes.map((mode) => `
        <button class="activity-menu-item ${mode.id === activeMode.id ? "is-active" : ""}" data-menu-mode="${mode.id}" data-palette="${cardMeta(mode).palette}" type="button" role="menuitem">
          <span class="activity-menu-item-icon">${mode.icon}</span>
          <span class="activity-menu-copy">
            <strong>${mode.title}</strong>
            <small>${cardMeta(mode).menuLabel}</small>
            <em>${mode.statusRules?.default || mode.controlRule || mode.description || ""}</em>
          </span>
        </button>
      `).join("");
    }

    function renderButtons() {
      const activeMode = getActiveMode();
      modeGrid.innerHTML = modes.map((mode) => `
        <button class="mode-card ${mode.id === activeMode.id ? "is-active" : ""}" data-mode="${mode.id}" data-tone="${mode.tone}" data-palette="${cardMeta(mode).palette}" type="button"${imageService.modeCardStyle(mode)}>
          <span class="mode-card-top">
            <span class="mode-icon">${mode.icon}</span>
            <span class="mode-track">${cardMeta(mode).menuLabel}</span>
          </span>
          <span class="mode-card-body">
            <strong>${mode.title}</strong>
          </span>
        </button>
      `).join("");
      renderMenu();
    }

    function setMenu(open) {
      menuOpen = Boolean(open);
      if (activityMenu) activityMenu.hidden = !menuOpen;
      activityMenuToggle?.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    }

    function toggleMenu() {
      setMenu(!menuOpen);
    }

    function isMenuOpen() {
      return menuOpen;
    }

    function renderActivity(options = {}) {
      const activeMode = getActiveMode();
      const activeMeta = cardMeta(activeMode);
      document.body.dataset.activePalette = activeMeta.palette;
      document.body.dataset.activeMode = activeMode.id;
      if (mobileModeBanner) {
        mobileModeImages?.renderBanner(activeMode);
        mobileModeBanner.dataset.palette = activeMeta.palette;
        mobileModeEmblem.textContent = activeMode.icon;
        mobileModeTrack.textContent = activeMeta.menuLabel || activeMode.track || "";
        mobileModeTitle.textContent = activeMode.title;
        mobileModeRule.textContent = modeStatusText();
      }

      if (scenePreview && !options.skipDesktopVisuals) {
        scenePreview.dataset.tone = activeMode.tone;
        const modeImage = imageService.imageForMode(activeMode);
        scenePreview.classList.toggle("has-mode-image", Boolean(modeImage));
        const currentImage = scenePreview.querySelector(".scene-preview-image");
        const modeTarget = editTargetForMode(activeMode);
        const modeStyle = imageStyleForTarget(modeTarget);
        scenePreview.setAttribute("style", modeStyle);
        scenePreview.dataset.editGroup = modeTarget.group;
        scenePreview.dataset.editId = modeTarget.id;
        scenePreview.dataset.editName = modeTarget.name;
        const modeImageAttributes = `style="${modeStyle}" data-edit-group="${modeTarget.group}" data-edit-id="${modeTarget.id}" data-edit-name="${modeTarget.name}"`;
        if (modeImage) {
          if (currentImage) {
            currentImage.hidden = false;
            currentImage.src = modeImage;
            currentImage.alt = `${activeMode.title} 玩法背景`;
            currentImage.setAttribute("style", modeStyle);
            currentImage.dataset.imageManaged = "true";
            currentImage.dataset.editGroup = modeTarget.group;
            currentImage.dataset.editId = modeTarget.id;
            currentImage.dataset.editName = modeTarget.name;
          } else {
            scenePreview.insertAdjacentHTML(
              "afterbegin",
              `<img class="scene-preview-image" src="${modeImage}" alt="${activeMode.title} 玩法背景" ${imageService.managedAttributes(modeImage)} ${modeImageAttributes} />`
            );
          }
        } else {
          currentImage?.remove();
        }
        sceneEmblem.textContent = activeMode.icon;
        sceneBadge.textContent = activeMode.track;
        sceneTitle.textContent = activeMode.title;
        sceneDescription.textContent = activeMode.description;
      }

      drawButton.textContent = activeMode.drawLabel;
      const dictionaryMode = activeMode.cardMode === "cardDictionary";
      controlBand.hidden = activeMode.cardMode === "secretPlace" || dictionaryMode;
      playArea.hidden = dictionaryMode;
      libraryBand.hidden = dictionaryMode;
      cardDictionaryPanel.hidden = !dictionaryMode;
      controlNote.textContent = activeMode.cardMode === "secretPlace"
        ? lifecycleFor().setup
        : modeStatusText();
    }

    return Object.freeze({
      isMenuOpen,
      renderActivity,
      renderButtons,
      renderMenu,
      setMenu,
      toggleMenu
    });
  }

  window.DebateVisionModeShell = Object.freeze({ create });
})();
