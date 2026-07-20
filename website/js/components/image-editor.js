(() => {
  function create(options) {
    let selectedTarget = null;

    function getSelectedTarget() {
      return selectedTarget;
    }

    function updateVisibleImages(target) {
      if (!target) return;
      const layoutStyle = options.imageStyleForTarget(target);
      document.querySelectorAll(`[data-edit-group="${target.group}"][data-edit-id="${target.id}"]`).forEach((image) => {
        image.setAttribute("style", layoutStyle);
      });
    }

    function selectTarget(target) {
      if (!target) return;
      selectedTarget = target;
      options.cardGrid.querySelectorAll(".battle-card").forEach((element) => {
        element.classList.toggle("is-edit-selected", element.dataset.cardKey === target.cardKey);
      });
      document.querySelectorAll(".scene-preview-image, .reel-scene-image").forEach((element) => {
        element.classList.toggle(
          "is-edit-selected",
          element.dataset.editGroup === target.group && element.dataset.editId === target.id
        );
      });
      updatePanel();
    }

    function selectCard(card) {
      selectTarget(options.editTargetForCard(card));
    }

    function resetSelection() {
      selectedTarget = null;
      updatePanel();
    }

    function panelMarkup() {
      return `
        <aside class="image-editor-panel" id="imageEditorPanel" aria-label="圖片微調器">
          <div class="image-editor-head">
            <div><p class="eyebrow">Edit Mode</p><h2>圖片微調器</h2></div>
            <div class="editor-head-actions">
              <button class="editor-mini-button" id="editorPickMode" type="button">選活動圖</button>
              <button class="editor-mini-button" id="editorPickFirst" type="button">選第一張</button>
            </div>
          </div>
          <p class="editor-selected" id="editorSelected">先抽卡，再點一張卡牌圖片。</p>
          <div class="editor-controls">
            <label>縮放 <span id="editScaleValue">1</span><input id="editScale" type="range" min="0.5" max="4" step="0.01" value="1" /></label>
            <label>左右 <span id="editXValue">0</span><input id="editX" type="range" min="-420" max="420" step="1" value="0" /></label>
            <label>上下 <span id="editYValue">0</span><input id="editY" type="range" min="-260" max="260" step="1" value="0" /></label>
            <label>旋轉 <span id="editRotateValue">0</span><input id="editRotate" type="range" min="-45" max="45" step="1" value="0" /></label>
            <label>蒙版 <span id="editOverlayValue">0.28</span><input id="editOverlay" type="range" min="0" max="0.9" step="0.01" value="0.28" /></label>
          </div>
          <div class="editor-nudges" aria-label="方向微調">
            <button type="button" data-nudge="up" data-step="2">上</button>
            <button type="button" data-nudge="down" data-step="2">下</button>
            <button type="button" data-nudge="left" data-step="2">左</button>
            <button type="button" data-nudge="right" data-step="2">右</button>
            <button type="button" data-nudge="up" data-step="16">大上</button>
            <button type="button" data-nudge="down" data-step="16">大下</button>
            <button type="button" data-nudge="left" data-step="16">大左</button>
            <button type="button" data-nudge="right" data-step="16">大右</button>
            <button type="button" data-scale="up">放大</button>
            <button type="button" data-scale="down">縮小</button>
          </div>
          <div class="editor-actions">
            <button id="resetImageLayout" type="button">重設這張</button>
            <button id="exportImageLayout" type="button">匯出 JSON</button>
          </div>
          <p class="editor-file-hint" id="editorFileHint">匯出後貼到 data/image-layouts/items.json</p>
          <p class="editor-status" id="editorStatus">編輯模式只會先預覽；匯出 JSON 後仍需貼回檔案。</p>
          <textarea id="editorExportText" readonly spellcheck="false" aria-label="匯出的圖片設定"></textarea>
        </aside>
      `;
    }

    function ensurePanel() {
      if (!options.isEditMode || document.querySelector("#imageEditorPanel")) return;
      document.body.classList.add("is-edit-mode");
      document.body.insertAdjacentHTML("beforeend", panelMarkup());
      document.querySelector("#editorPickMode").addEventListener("click", () => {
        selectTarget(options.editTargetForMode(options.getActiveMode()));
      });
      document.querySelector("#editorPickFirst").addEventListener("click", () => {
        const [firstCard] = options.visibleCards().filter((card) => card.imageId);
        if (firstCard) selectCard(firstCard);
        else selectTarget(options.editTargetForMode(options.getActiveMode()));
      });
      for (const id of ["editScale", "editX", "editY", "editRotate", "editOverlay"]) {
        document.querySelector(`#${id}`).addEventListener("input", applyInputs);
      }
      document.querySelector(".editor-nudges").addEventListener("click", handleNudge);
      document.querySelector("#resetImageLayout").addEventListener("click", resetLayout);
      document.querySelector("#exportImageLayout").addEventListener("click", exportLayout);
    }

    function handleNudge(event) {
      const button = event.target.closest("button");
      if (!button || !selectedTarget) return;
      const layout = options.layoutForTarget(selectedTarget);
      const step = Number(button.dataset.step) || 2;
      if (button.dataset.nudge === "up") layout.y -= step;
      if (button.dataset.nudge === "down") layout.y += step;
      if (button.dataset.nudge === "left") layout.x -= step;
      if (button.dataset.nudge === "right") layout.x += step;
      if (button.dataset.scale === "up") layout.scale = Math.min(4, Number((layout.scale + 0.04).toFixed(2)));
      if (button.dataset.scale === "down") {
        layout.scale = Math.max(options.minScaleForTarget(selectedTarget), Number((layout.scale - 0.02).toFixed(2)));
      }
      options.setLayoutForTarget(selectedTarget, layout);
      updateVisibleImages(selectedTarget);
      updatePanel();
    }

    function resetLayout() {
      if (!selectedTarget) return;
      options.setLayoutForTarget(selectedTarget, options.defaultLayout);
      updateVisibleImages(selectedTarget);
      updatePanel();
    }

    function updatePanel() {
      if (!options.isEditMode || !document.querySelector("#imageEditorPanel")) return;
      const selectedLabel = document.querySelector("#editorSelected");
      const fileHint = document.querySelector("#editorFileHint");
      const exportText = document.querySelector("#editorExportText");
      const status = document.querySelector("#editorStatus");
      if (!selectedTarget) {
        selectedLabel.textContent = "點活動大圖、抽卡機異境圖，或下方卡牌圖片。";
        fileHint.textContent = "匯出後貼到 data/image-layouts/items.json";
        status.textContent = "編輯模式只會先預覽；匯出 JSON 後仍需貼回檔案。";
        return;
      }

      const layout = options.layoutForTarget(selectedTarget);
      const scaleInput = document.querySelector("#editScale");
      const minScale = options.minScaleForTarget(selectedTarget);
      scaleInput.min = String(minScale);
      scaleInput.max = "4";
      if (Number(layout.scale) < minScale) {
        layout.scale = minScale;
        options.setLayoutForTarget(selectedTarget, layout);
        updateVisibleImages(selectedTarget);
      }
      scaleInput.value = layout.scale;
      document.querySelector("#editX").value = layout.x;
      document.querySelector("#editY").value = layout.y;
      document.querySelector("#editRotate").value = layout.rotate;
      document.querySelector("#editOverlay").value = layout.overlay;
      document.querySelector("#editScaleValue").textContent = Number(layout.scale).toFixed(2);
      document.querySelector("#editXValue").textContent = Math.round(layout.x);
      document.querySelector("#editYValue").textContent = Math.round(layout.y);
      document.querySelector("#editRotateValue").textContent = Math.round(layout.rotate);
      document.querySelector("#editOverlayValue").textContent = Number(layout.overlay).toFixed(2);
      selectedLabel.textContent = `${selectedTarget.label}：${selectedTarget.name}（${selectedTarget.id}）`;
      fileHint.textContent = `匯出後貼到 data/image-layouts/${selectedTarget.group}.json`;
      exportText.value = JSON.stringify(options.exportableLayouts(selectedTarget.group), null, 2);
    }

    function applyInputs() {
      if (!options.isEditMode || !selectedTarget) return;
      const layout = {
        scale: Number(document.querySelector("#editScale").value),
        x: Number(document.querySelector("#editX").value),
        y: Number(document.querySelector("#editY").value),
        rotate: Number(document.querySelector("#editRotate").value),
        overlay: Number(document.querySelector("#editOverlay").value)
      };
      options.setLayoutForTarget(selectedTarget, layout);
      updateVisibleImages(selectedTarget);
      updatePanel();
      document.querySelector("#editorStatus").textContent = "本頁預覽已更新；要永久保存，請按「匯出 JSON」再貼回檔案。";
    }

    function exportLayout() {
      const group = selectedTarget?.group || "items";
      const text = JSON.stringify(options.exportableLayouts(group), null, 2);
      const output = document.querySelector("#editorExportText");
      output.value = text;
      output.focus();
      output.select();
      navigator.clipboard?.writeText(text).catch(() => {});
      document.querySelector("#editorStatus").textContent = `JSON 已產生並嘗試複製；請貼到 data/image-layouts/${group}.json 後再執行網站更新。`;
    }

    return Object.freeze({
      ensurePanel,
      exportLayout,
      getSelectedTarget,
      resetSelection,
      selectCard,
      selectTarget,
      updatePanel,
      updateVisibleImages
    });
  }

  window.DebateVisionImageEditor = Object.freeze({ create });
})();
