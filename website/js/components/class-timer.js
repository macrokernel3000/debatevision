(() => {
  const timerService = window.DEBATE_TIMER_SERVICE.create();
  let interval = null;

  function formatElapsed(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(totalTenths / 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }

  function updateUi() {
    const timer = document.querySelector("#floatingTimer");
    if (!timer) return;
    const state = timerService.snapshot();
    const elapsedText = formatElapsed(state.elapsed);
    timer.classList.toggle("is-collapsed", state.collapsed);
    timer.classList.toggle("is-running", state.running);
    document.querySelector("#timerDisplay").textContent = elapsedText;
    document.querySelector("#timerLauncherText").textContent = elapsedText;
    document.querySelector("#timerToggle").textContent = state.running ? "暫停" : "開始";
    document.querySelector("#timerStatus").textContent = state.running ? "計時中" : "準備";
  }

  function refreshInterval() {
    if (interval) {
      window.clearInterval(interval);
      interval = null;
    }
    if (!timerService.snapshot().running) return;
    interval = window.setInterval(updateUi, 100);
  }

  function toggle() {
    timerService.toggle();
    refreshInterval();
    updateUi();
  }

  function reset() {
    timerService.reset();
    refreshInterval();
    updateUi();
  }

  function ringBell() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    const now = context.currentTime;
    const duration = 0.24;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(context.destination);

    [[740, "sine"], [1110, "triangle"]].forEach(([frequency, type], index) => {
      const oscillator = context.createOscillator();
      const partial = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      partial.gain.setValueAtTime(index === 0 ? 1 : 0.32, now);
      oscillator.connect(partial).connect(master);
      oscillator.start(now);
      oscillator.stop(now + duration);
      if (index === 0) oscillator.addEventListener("ended", () => context.close(), { once: true });
    });
  }

  function init() {
    if (document.querySelector("#floatingTimer")) return;
    const state = timerService.snapshot();
    document.body.insertAdjacentHTML("beforeend", `
      <aside class="floating-timer ${state.collapsed ? "is-collapsed" : ""}" id="floatingTimer" aria-label="課堂計時器">
        <button class="timer-launcher" id="timerLauncher" type="button" aria-label="打開計時器">⏱ <span id="timerLauncherText">00:00.0</span></button>
        <div class="timer-panel" id="timerPanel">
          <div class="timer-head">
            <div class="timer-brand">
              <span class="timer-brand-mark" aria-hidden="true">◷</span>
              <div>
              <p class="eyebrow">Class Timer</p>
              <h2>課堂計時</h2>
              </div>
            </div>
            <div class="timer-window-actions">
              <button id="timerCollapse" type="button" aria-label="收合計時器">收合</button>
            </div>
          </div>
          <div class="timer-display" id="timerDisplay" aria-live="polite">00:00.0</div>
          <div class="timer-status"><span></span><b id="timerStatus">準備</b></div>
          <div class="timer-actions">
            <button id="timerToggle" type="button">開始</button>
            <button id="timerReset" type="button">重設</button>
            <button id="timerBell" type="button" aria-label="播放響鈴">🔔 響鈴</button>
          </div>
        </div>
      </aside>
    `);

    document.querySelector("#timerLauncher").addEventListener("click", () => {
      timerService.setCollapsed(false);
      updateUi();
    });
    document.querySelector("#timerCollapse").addEventListener("click", () => {
      timerService.setCollapsed(true);
      updateUi();
    });
    document.querySelector("#timerToggle").addEventListener("click", toggle);
    document.querySelector("#timerReset").addEventListener("click", reset);
    document.querySelector("#timerBell").addEventListener("click", ringBell);
    updateUi();
    refreshInterval();
  }

  window.DEBATE_CLASS_TIMER = Object.freeze({ init });
})();
