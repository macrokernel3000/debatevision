(() => {
  function create(panel) {
    const root = document.createElement("aside");
    root.className = "debate-dual-stopwatch";
    root.setAttribute("aria-label", "正反方雙碼錶");
    root.innerHTML = `
      <div class="debate-stopwatch-head">
        <strong>雙方碼錶</strong>
        <div class="debate-stopwatch-summary" aria-hidden="true">
          <span>正 <b data-stopwatch-summary="pro">00:00.0</b></span>
          <span>反 <b data-stopwatch-summary="con">00:00.0</b></span>
        </div>
        <div class="debate-stopwatch-head-actions">
          <div class="debate-stopwatch-modes" role="group" aria-label="計時模式">
            <button type="button" class="is-active" data-stopwatch-mode="independent">獨立</button>
            <button type="button" data-stopwatch-mode="debate">對辯</button>
          </div>
          <button type="button" class="debate-stopwatch-collapse" data-stopwatch-collapse aria-expanded="true">收合</button>
        </div>
      </div>
      <div class="debate-stopwatch-body">
        <section class="debate-stopwatch-side is-pro" data-stopwatch-side="pro">
          <span>正方</span>
          <output data-stopwatch-display="pro">00:00.0</output>
          <div>
            <button type="button" data-stopwatch-toggle="pro">開始</button>
            <button type="button" data-stopwatch-reset="pro">歸零</button>
          </div>
        </section>
        <div class="debate-stopwatch-center-actions">
          <button type="button" class="debate-stopwatch-swap" data-stopwatch-swap disabled aria-label="交換正反方計時">⇄<span>交換</span></button>
          <button type="button" class="debate-stopwatch-bell" data-stopwatch-bell aria-label="播放提示鈴聲">🔔<span>鈴聲</span></button>
        </div>
        <section class="debate-stopwatch-side is-con" data-stopwatch-side="con">
          <span>反方</span>
          <output data-stopwatch-display="con">00:00.0</output>
          <div>
            <button type="button" data-stopwatch-toggle="con">開始</button>
            <button type="button" data-stopwatch-reset="con">歸零</button>
          </div>
        </section>
      </div>
    `;
    panel.append(root);

    const state = {
      mode: "independent",
      active: false,
      collapsed: true,
      lastSide: "con",
      pro: { elapsed: 0, running: false, startedAt: 0 },
      con: { elapsed: 0, running: false, startedAt: 0 }
    };
    let frame = 0;

    function elapsed(side, now = performance.now()) {
      const timer = state[side];
      return timer.elapsed + (timer.running ? now - timer.startedAt : 0);
    }

    function format(milliseconds) {
      const totalTenths = Math.floor(milliseconds / 100);
      const tenths = totalTenths % 10;
      const totalSeconds = Math.floor(totalTenths / 10);
      const seconds = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const minutes = totalMinutes % 60;
      const hours = Math.floor(totalMinutes / 60);
      const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
      return hours ? `${String(hours).padStart(2, "0")}:${clock}` : clock;
    }

    function pause(side, now = performance.now()) {
      const timer = state[side];
      if (!timer.running) return;
      timer.elapsed += now - timer.startedAt;
      timer.running = false;
    }

    function start(side, now = performance.now()) {
      if (state.mode === "debate") pause(side === "pro" ? "con" : "pro", now);
      const timer = state[side];
      if (timer.running) return;
      timer.startedAt = now;
      timer.running = true;
      state.lastSide = side;
      schedule();
    }

    function toggle(side) {
      if (state[side].running) pause(side);
      else start(side);
      render();
    }

    function reset(side) {
      pause(side);
      state[side].elapsed = 0;
      render();
    }

    function swap() {
      if (state.mode !== "debate") return;
      const runningSide = state.pro.running ? "pro" : state.con.running ? "con" : "";
      const nextSide = runningSide
        ? (runningSide === "pro" ? "con" : "pro")
        : (state.lastSide === "pro" ? "con" : "pro");
      const now = performance.now();
      pause("pro", now);
      pause("con", now);
      start(nextSide, now);
      render();
    }

    function setMode(mode) {
      state.mode = mode;
      if (mode === "debate" && state.pro.running && state.con.running) {
        pause(state.lastSide === "pro" ? "con" : "pro");
      }
      render();
    }

    function ringBell() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const master = context.createGain();
      const now = context.currentTime;
      master.gain.setValueAtTime(0.2, now);
      master.connect(context.destination);

      // 短促、明亮的單次金屬泛音，作為交換或時間到的「叮」聲。
      [
        [1046.5, 1, 0.62],
        [2093, 0.28, 0.38],
        [3139.5, 0.11, 0.22]
      ].forEach(([frequency, volume, decay]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        oscillator.connect(gain).connect(master);
        oscillator.start(now);
        oscillator.stop(now + decay + 0.02);
      });

      const bell = root.querySelector("[data-stopwatch-bell]");
      bell.classList.add("is-ringing");
      bell.innerHTML = "🔔<span>鈴聲！</span>";
      window.setTimeout(() => {
        bell.classList.remove("is-ringing");
        bell.innerHTML = "🔔<span>鈴聲</span>";
        context.close();
      }, 700);
    }

    function render() {
      const now = performance.now();
      ["pro", "con"].forEach((side) => {
        const text = format(elapsed(side, now));
        root.querySelector(`[data-stopwatch-display="${side}"]`).textContent = text;
        root.querySelector(`[data-stopwatch-summary="${side}"]`).textContent = text;
        root.querySelector(`[data-stopwatch-toggle="${side}"]`).textContent = state[side].running ? "暫停" : "開始";
        root.querySelector(`[data-stopwatch-side="${side}"]`).classList.toggle("is-running", state[side].running);
      });
      root.querySelectorAll("[data-stopwatch-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.stopwatchMode === state.mode);
        button.setAttribute("aria-pressed", String(button.dataset.stopwatchMode === state.mode));
      });
      root.querySelector("[data-stopwatch-swap]").disabled = state.mode !== "debate";
      root.classList.toggle("is-collapsed", state.collapsed);
      const collapseButton = root.querySelector("[data-stopwatch-collapse]");
      collapseButton.textContent = state.collapsed ? "展開" : "收合";
      collapseButton.setAttribute("aria-expanded", String(!state.collapsed));
    }

    function tick() {
      frame = 0;
      if (!state.active || (!state.pro.running && !state.con.running)) return;
      render();
      schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    root.addEventListener("click", (event) => {
      const mode = event.target.closest("[data-stopwatch-mode]");
      const toggleButton = event.target.closest("[data-stopwatch-toggle]");
      const resetButton = event.target.closest("[data-stopwatch-reset]");
      if (mode) setMode(mode.dataset.stopwatchMode);
      else if (toggleButton) toggle(toggleButton.dataset.stopwatchToggle);
      else if (resetButton) reset(resetButton.dataset.stopwatchReset);
      else if (event.target.closest("[data-stopwatch-swap]")) swap();
      else if (event.target.closest("[data-stopwatch-bell]")) ringBell();
      else if (event.target.closest("[data-stopwatch-collapse]")) {
        state.collapsed = !state.collapsed;
        render();
      }
    });

    function setActive(active) {
      state.active = Boolean(active);
      root.hidden = !state.active;
      if (!state.active) {
        pause("pro");
        pause("con");
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }
      render();
    }

    setActive(false);
    return Object.freeze({ setActive });
  }

  window.DEBATE_DUAL_STOPWATCH = Object.freeze({ create });
})();
