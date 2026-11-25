/*
  Live multi-agent construction layer.

  The page markup and styles stay in index.html and assets/css.
  This file only adds an overlay and temporarily restyles the existing
  DOM so six agents appear to build the bento tiles. Click or tap
  anywhere outside the controls to skip to the finished page. When the run finishes,
  skips, or the page is opened with ?sim=off, the original site is restored.

  Add ?sim=off to the URL to skip the simulation entirely.
*/
(function () {
  "use strict";

  window.__SIM_READY = true;

  // The animation plays automatically only on a visitor's first visit (or with
  // ?sim=on). After that the finished page shows right away; the Replay button
  // in the corner plays it again.
  const PLAYED_KEY = "sim-played";
  function hasPlayed() {
    try {
      return localStorage.getItem(PLAYED_KEY) === "1";
    } catch (error) {
      return false;
    }
  }
  function markPlayed() {
    try {
      localStorage.setItem(PLAYED_KEY, "1");
    } catch (error) {
      /* private mode: it just plays again next time */
    }
  }
  const forcePlay = new URLSearchParams(location.search).get("sim") === "on";

  if (new URLSearchParams(location.search).get("sim") === "off") {
    document.documentElement.classList.remove("sim-boot");
    return;
  }

  const AGENTS = [
    { id: "architect", name: "Architect", color: "#38bdf8" },
    { id: "content", name: "Content", color: "#c084fc" },
    { id: "layout", name: "Layout", color: "#2dd4bf" },
    { id: "design", name: "Design", color: "#fb7185" },
    { id: "interaction", name: "Interaction", color: "#fbbf24" },
    { id: "qa", name: "QA", color: "#4ade80" },
  ];

  // What the agents build, in order. Each section is one bento tile on the
  // home page. "self" atoms are the tile surface itself; "chips" names the
  // chip elements QA counts. Elements are matched inside the section root.
  const SCHEMA = [
    {
      id: "intro",
      name: "Intro",
      root: "#tile-intro",
      summary: "Logo, live clock, headline and links",
      atoms: [
        { self: true, name: "intro tile", kind: "card" },
        { sel: ".intro-logo", name: "logo", interact: true, kind: "link" },
        { sel: ".intro-clock", name: "clock", kind: "block" },
        { sel: ".intro-line", name: "headline line", text: true, all: true, kind: "headline" },
        { sel: ".intro-links a", name: "link", text: true, interact: true, all: true, kind: "link" },
      ],
    },
    {
      id: "monogram",
      name: "Monogram",
      root: "#tile-monogram",
      summary: "Large AH monogram and name",
      atoms: [
        { self: true, name: "monogram tile", kind: "card" },
        { sel: ".monogram-large", name: "monogram", kind: "block" },
        { sel: ".monogram-caption", name: "name caption", text: true, kind: "tagline" },
      ],
    },
    {
      id: "status",
      name: "Status",
      root: "#tile-status",
      summary: "Availability status",
      atoms: [
        { self: true, name: "status tile", kind: "card" },
        { sel: ".tile-label", name: "status label", text: true, kind: "tagline" },
        { sel: ".status-text", name: "status", text: true, kind: "heading", bug: "contrast" },
        { sel: ".arrow-button", name: "contact button", interact: true, kind: "button" },
      ],
    },
    {
      id: "theme",
      name: "Theme",
      root: "#tile-theme",
      summary: "Light and dark mode switch",
      atoms: [
        { self: true, name: "theme tile", kind: "card" },
        { sel: ".theme-tile-button", name: "theme switch", interact: true, kind: "button" },
        { sel: ".theme-text", name: "theme label", text: true, kind: "prose" },
      ],
    },
    {
      id: "projects",
      name: "Projects",
      root: "#tile-projects",
      summary: "Link to the projects page",
      atoms: [
        { self: true, name: "projects tile", kind: "card" },
        { sel: ".tile-label", name: "projects label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "projects title", text: true, kind: "heading" },
        { sel: ".arrow-button", name: "projects arrow", interact: true, kind: "button", bug: "padding" },
      ],
    },
    {
      id: "hello",
      name: "Say hello",
      root: "#tile-hello",
      summary: "Call to action for getting in touch",
      atoms: [
        { self: true, name: "hello tile", kind: "card" },
        { sel: ".tile-label", name: "hello label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "hello title", text: true, kind: "heading" },
        { sel: ".arrow-button", name: "contact arrow", interact: true, kind: "button" },
      ],
    },
    {
      id: "about",
      name: "About",
      root: "#tile-about",
      summary: "Link to the about page",
      atoms: [
        { self: true, name: "about tile", kind: "card" },
        { sel: ".tile-label", name: "about label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "about title", text: true, kind: "heading" },
        { sel: ".arrow-button", name: "about arrow", interact: true, kind: "button" },
      ],
    },
    {
      id: "featured",
      name: "Featured project",
      root: "#tile-featured",
      summary: "Tap Track screenshots and live demo link",
      atoms: [
        { self: true, name: "featured tile", kind: "card" },
        { sel: ".tile-label", name: "featured label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "featured title", text: true, kind: "heading", bug: "shift" },
        { sel: ".featured-shots img", name: "screenshot", all: true, kind: "block" },
        { sel: ".arrow-button", name: "demo link", interact: true, kind: "button" },
      ],
    },
    {
      id: "experience",
      name: "Experience",
      root: "#tile-experience",
      summary: "Experience summary and link",
      atoms: [
        { self: true, name: "experience tile", kind: "card" },
        { sel: ".tile-label", name: "experience label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "experience title", text: true, kind: "heading" },
        { sel: ".arrow-button", name: "experience arrow", interact: true, kind: "button" },
      ],
    },
    {
      id: "stack",
      name: "Stack",
      root: "#tile-stack",
      summary: "Daily tools",
      chips: ".stack-list li:not([aria-hidden])",
      atoms: [
        { self: true, name: "stack tile", kind: "card" },
        { sel: ".tile-label", name: "stack label", text: true, kind: "tagline" },
        { sel: ".tile-title", name: "stack title", text: true, kind: "heading" },
        { sel: ".stack-list li:not([aria-hidden])", name: "tool", text: true, all: true, kind: "skill" },
      ],
    },
    {
      id: "footer",
      name: "Footer",
      root: ".home-footer",
      frame: true,
      summary: "Closing credit line",
      atoms: [{ sel: "p", name: "footer credit", text: true, kind: "prose" }],
    },
  ];

  class Cancelled extends Error {
    constructor() {
      super("cancelled");
      this.name = "Cancelled";
    }
  }

  const state = {
    token: 0,
    running: false,
    paused: false,
    finished: false,
    skipped: false,
    speed: 1.5,
    autoScroll: true,
    showCursors: true,
    showActivity: true,
    menuOpen: false,
    docked: false,
    desiredY: null,
    userHold: 0,
    lastProgrammatic: 0,
    section: "Blueprint",
    completed: 0,
    total: 0,
    reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    baseTitle: document.title,
    cleaned: false,
  };

  const locks = new Map();
  const touched = new Set();
  const originalAttributes = new Map();
  const cursors = {};
  const rings = {};
  let model = null;
  let chain = Promise.resolve();
  let ui = null;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function assertToken(token) {
    if (token !== state.token) throw new Cancelled();
  }

  async function sleep(ms, token) {
    let remaining = ms;
    while (remaining > 0) {
      assertToken(token);
      if (state.paused) {
        await delay(30);
        continue;
      }
      const slice = Math.min(remaining / state.speed, 40);
      const started = performance.now();
      await delay(slice);
      remaining -= (performance.now() - started) * state.speed;
    }
  }

  function alive(el) {
    return !!(el && el.isConnected);
  }

  function watch(el) {
    if (!el || touched.has(el)) return;
    touched.add(el);
    originalAttributes.set(el, {
      style: el.getAttribute("style"),
      ariaLabel: el.getAttribute("aria-label"),
    });
  }

  function escapeNothing(text) {
    return text == null ? "" : String(text);
  }

  function describe(el) {
    if (!el) return "missing";
    let name = el.tagName.toLowerCase();
    if (el.id) name += "#" + el.id;
    else {
      const cls = [...el.classList].filter((item) => !item.startsWith("sim-") && item !== "is-active" && item !== "is-built" && item !== "is-typing");
      if (cls.length) name += "." + cls.slice(0, 2).join(".");
    }
    return name;
  }

  function shortText(el) {
    const raw = (el && (el.dataset.simText || el.textContent) || "").replace(/\s+/g, " ").trim();
    if (!raw) return "";
    return raw.length > 42 ? raw.slice(0, 40) + "…" : raw;
  }

  function buildShell() {
    const root = document.createElement("div");
    root.id = "agent-sim";
    root.innerHTML = `
      <button type="button" class="launcher" data-act="expand" aria-label="Open AI build controls" aria-controls="agent-sim-stack" aria-expanded="false">
        <span class="launcher-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span data-bind="launcherText">AI build</span>
        <span class="launcher-status" aria-hidden="true"></span>
      </button>
      <div class="stack" id="agent-sim-stack">
        <section class="activity" aria-label="Agent activity">
          <div class="head">
            <div>
              <p class="kicker" data-bind="phase">Standby</p>
              <h2>Live construction</h2>
            </div>
            <div class="stat">
              <strong data-bind="percent">0%</strong>
              <span data-bind="count">Standing by</span>
            </div>
            <button type="button" class="minimize" data-act="collapse" aria-label="Minimize simulator controls" title="Minimize controls">−</button>
          </div>
          <div class="bar" aria-hidden="true"><span data-bind="bar"></span></div>
          <p class="section-now">Section <b data-bind="section">Blueprint</b></p>
          <ul class="agents"></ul>
          <ol class="log" data-bind="log"></ol>
          <p class="hint">Click or tap anywhere on the page to skip to the finished site. Space pauses. Scroll yourself anytime, or turn auto-scroll off.</p>
        </section>
        <section class="controls" aria-label="Playback controls">
          <div class="row">
            <button type="button" class="primary" data-act="start">Start</button>
            <button type="button" data-act="pause">Pause</button>
            <button type="button" data-act="resume">Resume</button>
            <button type="button" data-act="restart">Restart</button>
            <button type="button" data-act="skip">Finished site</button>
          </div>
          <div class="row">
            <span class="lbl">Speed</span>
            <button type="button" data-speed="0.5">0.5×</button>
            <button type="button" data-speed="1" aria-pressed="false">1×</button>
            <button type="button" data-speed="1.5" aria-pressed="true">1.5×</button>
            <button type="button" data-speed="2">2×</button>
          </div>
          <div class="row">
            <button type="button" data-toggle="autoScroll" aria-pressed="true">Auto-scroll</button>
            <button type="button" data-toggle="cursors" aria-pressed="true">Cursors</button>
            <button type="button" data-toggle="panel" aria-pressed="true">Activity</button>
          </div>
        </section>
      </div>`;
    document.body.appendChild(root);

    const agentList = root.querySelector(".agents");
    const agents = {};
    AGENTS.forEach((agent) => {
      const li = document.createElement("li");
      li.className = "agent";
      li.dataset.agent = agent.id;
      li.dataset.state = "Idle";
      li.style.setProperty("--c", agent.color);
      li.innerHTML = `<span class="dot" aria-hidden="true"></span><span class="name"></span><span class="badge" data-status="Idle">Idle</span><span class="job">Standing by</span>`;
      li.querySelector(".name").textContent = agent.name;
      agentList.appendChild(li);
      agents[agent.id] = {
        row: li,
        badge: li.querySelector(".badge"),
        job: li.querySelector(".job"),
      };
    });

    AGENTS.forEach((agent) => {
      const cursor = document.createElement("div");
      cursor.className = "cursor";
      cursor.dataset.agent = agent.id;
      cursor.style.setProperty("--c", agent.color);
      cursor.setAttribute("aria-hidden", "true");
      cursor.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M5 2.2 5 19.2 9.7 14.8 13.6 22 16.5 20.7 12.5 13.5 18.6 13.2Z" fill="currentColor" stroke="#081018" stroke-width="1" stroke-linejoin="round"></path>
        </svg>
        <span class="tag"><b></b><small></small></span>`;
      cursor.querySelector("b").textContent = agent.name;
      root.appendChild(cursor);
      const caption = cursor.querySelector("small");
      cursors[agent.id] = {
        id: agent.id,
        color: agent.color,
        el: cursor,
        captionEl: caption,
        x: 80,
        y: 80,
        tx: 80,
        ty: 80,
        baseY: 80,
        phase: 0,
        hold: null,
        moveTo(x, y) {
          this.hold = null;
          this.tx = x;
          this.ty = y;
        },
        holdOn(el, ax, ay) {
          this.hold = { el, ax, ay };
          this.sync();
        },
        clearHold() {
          this.hold = null;
        },
        sync() {
          if (!this.hold || !alive(this.hold.el)) return;
          const rect = this.hold.el.getBoundingClientRect();
          this.tx = rect.left + rect.width * this.hold.ax;
          this.ty = rect.top + Math.min(rect.height * this.hold.ay, Math.max(rect.height - 4, 0));
        },
        caption(text) {
          this.captionEl.textContent = text || "";
        },
        down(on) {
          this.el.classList.toggle("is-down", !!on);
        },
        click() {
          this.el.classList.add("is-clicking");
          const node = this.el;
          setTimeout(() => node.classList.remove("is-clicking"), 150);
        },
        tick(dt) {
          if (this.hold) this.sync();
          if (!state.running && !state.finished) {
            this.ty = this.baseY + Math.sin(performance.now() / 700 + this.phase) * 4;
          }
          const frozen = state.paused && state.running;
          if (state.reduce || frozen) {
            if (!frozen || this.hold) {
              this.x = this.tx;
              this.y = this.ty;
            }
          } else {
            const rate = state.running ? 10 * state.speed : 4;
            const t = 1 - Math.exp((-rate * dt) / 1000);
            this.x += (this.tx - this.x) * t;
            this.y += (this.ty - this.y) * t;
          }
          const vx = Math.max(8, Math.min(window.innerWidth - 12, this.x));
          const vy = Math.max(8, Math.min(window.innerHeight - 12, this.y));
          this.el.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
          this.el.classList.toggle("flip", vx > window.innerWidth - 180);
        },
      };

      const ring = document.createElement("div");
      ring.className = "ring";
      ring.dataset.agent = agent.id;
      ring.style.setProperty("--c", agent.color);
      ring.hidden = true;
      ring.setAttribute("aria-hidden", "true");
      root.appendChild(ring);
      rings[agent.id] = { el: ring, target: null };
    });

    ui = {
      root,
      launcher: root.querySelector('[data-act="expand"]'),
      launcherText: root.querySelector("[data-bind=launcherText]"),
      phase: root.querySelector("[data-bind=phase]"),
      percent: root.querySelector("[data-bind=percent]"),
      count: root.querySelector("[data-bind=count]"),
      bar: root.querySelector("[data-bind=bar]"),
      section: root.querySelector("[data-bind=section]"),
      log: root.querySelector("[data-bind=log]"),
      agents,
      buttons: {
        start: root.querySelector('[data-act="start"]'),
        pause: root.querySelector('[data-act="pause"]'),
        resume: root.querySelector('[data-act="resume"]'),
        restart: root.querySelector('[data-act="restart"]'),
        skip: root.querySelector('[data-act="skip"]'),
        expand: root.querySelector('[data-act="expand"]'),
        collapse: root.querySelector('[data-act="collapse"]'),
      },
      speeds: [...root.querySelectorAll("[data-speed]")],
      toggles: {
        autoScroll: root.querySelector('[data-toggle="autoScroll"]'),
        cursors: root.querySelector('[data-toggle="cursors"]'),
        panel: root.querySelector('[data-toggle="panel"]'),
      },
    };

    ui.buttons.start.addEventListener("click", onStart);
    ui.buttons.pause.addEventListener("click", onPause);
    ui.buttons.resume.addEventListener("click", onResume);
    ui.buttons.restart.addEventListener("click", onRestart);
    ui.buttons.skip.addEventListener("click", onSkip);
    ui.buttons.expand.addEventListener("click", () => {
      // After the build is done, the corner badge reads "Replay": one click replays it.
      if (state.finished && !state.running) {
        onRestart();
        return;
      }
      state.menuOpen = true;
      applyChrome();
    });
    ui.buttons.collapse.addEventListener("click", () => {
      state.menuOpen = false;
      applyChrome();
    });
    ui.speeds.forEach((button) => {
      button.addEventListener("click", () => setSpeed(Number(button.dataset.speed)));
    });
    ui.toggles.autoScroll.addEventListener("click", () => {
      state.autoScroll = !state.autoScroll;
      applyChrome();
    });
    ui.toggles.cursors.addEventListener("click", () => {
      state.showCursors = !state.showCursors;
      state.docked = false;
      applyChrome();
    });
    ui.toggles.panel.addEventListener("click", () => {
      state.showActivity = !state.showActivity;
      applyChrome();
    });
  }

  function setStatus(agentId, status, task) {
    const row = ui.agents[agentId];
    if (!row) return;
    row.row.dataset.state = status;
    row.badge.dataset.status = status;
    row.badge.textContent = status;
    if (task != null) row.job.textContent = task;
  }

  function resetStatuses(status, task) {
    AGENTS.forEach((agent) => setStatus(agent.id, status, task));
  }

  function log(agentId, message) {
    if (!ui) return;
    const agent = AGENTS.find((item) => item.id === agentId);
    const li = document.createElement("li");
    const name = document.createElement("b");
    name.textContent = agent ? agent.name : "System";
    name.style.color = agent ? agent.color : "#cbd5e1";
    li.append(name, document.createTextNode("  " + escapeNothing(message)));
    ui.log.appendChild(li);
    while (ui.log.children.length > 48) ui.log.firstChild.remove();
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function percentValue() {
    if (state.finished) return 100;
    if (!state.total) return 0;
    return Math.max(0, Math.min(100, Math.round((state.completed / state.total) * 100)));
  }

  function updateHud() {
    if (!ui) return;
    const pct = percentValue();
    ui.percent.textContent = pct + "%";
    ui.bar.style.width = pct + "%";
    ui.section.textContent = state.section;
    ui.count.textContent = state.total ? `${state.completed} / ${state.total} tasks` : "Standing by";
    ui.phase.textContent = state.running ? (state.paused ? "Paused" : "Live") : state.finished ? "Complete" : "Standby";
    ui.launcherText.textContent = state.running
      ? `${state.speed}× · ${pct}%`
      : state.finished
        ? "Replay"
        : "AI build";
    ui.launcher.setAttribute(
      "aria-label",
      `Open AI build controls. ${state.running ? `${state.paused ? "Paused" : "Running"} at ${state.speed}×, ${pct}% complete.` : state.finished ? "Build complete. Replay available." : "Ready to start."}`
    );
    ui.buttons.start.disabled = state.running;
    ui.buttons.pause.disabled = !state.running || state.paused;
    ui.buttons.resume.disabled = !state.running || !state.paused;
    ui.buttons.skip.disabled = state.finished && !state.running;
    applyChrome();
  }

  function applyChrome() {
    document.documentElement.classList.toggle("sim-hide-cursors", !state.showCursors || state.docked);
    document.documentElement.classList.toggle("sim-hide-activity", !state.showActivity);
    document.documentElement.classList.toggle("sim-minimized", !state.menuOpen);
    document.documentElement.classList.toggle("sim-running", state.running && !state.paused);
    document.documentElement.classList.toggle("sim-paused", state.running && state.paused);
    document.documentElement.classList.toggle("sim-finished", state.finished);
    ui.launcher.setAttribute("aria-expanded", state.menuOpen ? "true" : "false");
    ui.speeds.forEach((button) => {
      button.setAttribute("aria-pressed", Number(button.dataset.speed) === state.speed ? "true" : "false");
    });
    ui.toggles.autoScroll.setAttribute("aria-pressed", state.autoScroll ? "true" : "false");
    ui.toggles.cursors.setAttribute("aria-pressed", state.showCursors && !state.docked ? "true" : "false");
    ui.toggles.panel.setAttribute("aria-pressed", state.showActivity ? "true" : "false");
  }

  // Original child nodes of typed elements, put back untouched afterwards so
  // markup (line breaks, emoji, inner spans) and event listeners survive.
  const savedChildren = new Map();

  function setupTypeHost(el) {
    if (!alive(el) || el.querySelector(":scope > .sim-typed")) return;
    const text = el.dataset.simText != null ? el.dataset.simText : el.textContent.replace(/\s+/g, " ").trim();
    if (!savedChildren.has(el)) {
      const fragment = document.createDocumentFragment();
      while (el.firstChild) fragment.appendChild(el.firstChild);
      savedChildren.set(el, fragment);
    }
    el.dataset.simText = text;
    el.classList.add("sim-type-host");
    if (["P", "H1", "H2", "H3"].includes(el.tagName)) el.classList.add("sim-type-block");
    el.setAttribute("aria-label", text.trim());
    const ghost = document.createElement("span");
    ghost.className = "sim-ghost";
    ghost.textContent = text;
    ghost.setAttribute("aria-hidden", "true");
    const typed = document.createElement("span");
    typed.className = "sim-typed";
    typed.setAttribute("aria-hidden", "true");
    el.textContent = "";
    el.append(ghost, typed);
    watch(el);
  }

  function teardownTypeHost(el) {
    if (!el || !el.classList.contains("sim-type-host")) return;
    const saved = savedChildren.get(el);
    if (saved) {
      el.textContent = "";
      el.appendChild(saved);
      savedChildren.delete(el);
    } else {
      el.textContent = el.dataset.simText != null ? el.dataset.simText : el.textContent;
    }
    delete el.dataset.simText;
    el.classList.remove("sim-type-host", "sim-type-block", "is-typing");
  }

  function restore() {
    touched.forEach((el) => {
      teardownTypeHost(el);
      const original = originalAttributes.get(el);
      if (original) {
        if (original.style == null) el.removeAttribute("style");
        else el.setAttribute("style", original.style);
        if (original.ariaLabel == null) el.removeAttribute("aria-label");
        else el.setAttribute("aria-label", original.ariaLabel);
      }
      el.classList.remove(
        "sim-unit",
        "sim-raw",
        "sim-anim",
        "sim-region",
        "sim-frame",
        "is-active",
        "is-built",
        "is-typing",
        "sim-hot",
        "sim-type-host",
        "sim-type-block"
      );
      delete el.dataset.simBug;
      delete el.dataset.simName;
    });
    touched.clear();
    originalAttributes.clear();
    document.querySelectorAll(".sim-ghost, .sim-typed").forEach((node) => {
      if (node.parentElement) teardownTypeHost(node.parentElement);
      if (node.isConnected) node.remove();
    });
    document.documentElement.classList.remove("sim-live", "sim-survey");
    Object.values(rings).forEach((ring) => {
      ring.target = null;
      ring.el.hidden = true;
    });
    Object.values(cursors).forEach((cursor) => {
      cursor.clearHold();
      cursor.down(false);
      cursor.caption("");
    });
  }

  function makeAtom(el, spec, textOverride) {
    const textEl = spec.innerText ? el.querySelector(spec.innerText) : spec.text ? el : null;
    const text = textOverride || (textEl ? textEl.textContent.trim() : "");
    let name = spec.name;
    if (spec.kind === "skill" && text) name = text;
    else if (spec.kind === "link" && text) name = text;
    else if (spec.name === "nav link" && text) name = text + " link";
    return {
      el,
      textEls: textEl && textEl.childElementCount === 0 ? [textEl] : textEl ? [textEl] : [],
      interactEls: spec.interact ? [spec.innerText ? textEl : el].filter(Boolean) : [],
      name,
      kind: spec.kind || "block",
      bug: spec.bug || null,
      quiet: spec.kind === "skill",
    };
  }

  function scan() {
    const sections = [];
    const warnings = [];
    SCHEMA.forEach((spec) => {
      const root = document.querySelector(spec.root);
      if (!root) {
        warnings.push(`Missing ${spec.root}. That region will be skipped.`);
        return;
      }
      watch(root);
      root.classList.add("sim-region");
      if (spec.frame) root.classList.add("sim-frame");
      const atoms = [];
      (spec.atoms || []).forEach((atomSpec) => {
        const nodes = atomSpec.self
          ? [root]
          : [...root.querySelectorAll(atomSpec.sel)].filter((el) => el.getClientRects().length > 0);
        if (!nodes.length) {
          warnings.push(`No ${atomSpec.sel} inside ${spec.name}.`);
          return;
        }
        nodes.forEach((el) => atoms.push(makeAtom(el, atomSpec)));
      });
      sections.push({
        id: spec.id,
        name: spec.name,
        chips: spec.chips || null,
        root,
        frame: !!spec.frame,
        summary: spec.summary,
        atoms,
      });
    });
    return { sections, warnings };
  }

  function prepareAtoms() {
    model.sections.forEach((section) => {
      section.atoms.forEach((atom) => {
        watch(atom.el);
        atom.el.classList.add("sim-unit", "sim-raw");
        atom.el.dataset.simName = atom.name;
        atom.el.style.opacity = "0";
        atom.el.style.transform = "translateY(22px)";
        atom.textEls.forEach((textEl) => {
          watch(textEl);
          textEl.classList.add("sim-unit", "sim-raw");
          setupTypeHost(textEl);
        });
        void atom.el.offsetWidth;
        atom.el.classList.add("sim-anim");
      });
    });
  }

  function prepare() {
    restore();
    document.documentElement.classList.add("sim-live");
    model = scan();
    prepareAtoms();
    state.section = "Blueprint";
    state.completed = 0;
    state.total = 0;
    state.finished = false;
    state.cleaned = false;
    state.desiredY = 0;
  }

  function showRing(agentId, el) {
    const ring = rings[agentId];
    if (!ring || !alive(el)) return;
    ring.target = el;
    ring.el.hidden = false;
  }

  function hideRing(agentId) {
    const ring = rings[agentId];
    if (!ring) return;
    ring.target = null;
    ring.el.hidden = true;
  }

  function inView(el) {
    const rect = el.getBoundingClientRect();
    if (rect.height > window.innerHeight * 0.72) {
      return rect.top >= 56 && rect.top < window.innerHeight * 0.42;
    }
    return rect.top >= 64 && rect.bottom <= window.innerHeight - 12 && rect.width > 0;
  }

  function yFor(el) {
    const rect = el.getBoundingClientRect();
    const targetTop = Math.min(150, window.innerHeight * 0.24);
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(max, Math.max(0, window.scrollY + rect.top - targetTop));
  }

  async function scrollInto(el, token, wait) {
    if (!state.autoScroll || !alive(el)) return;
    if (performance.now() < state.userHold) return;
    if (inView(el)) return;
    const y = yFor(el);
    if (state.desiredY != null && y < state.desiredY - 8 && window.scrollY > y + 40) {
      return;
    }
    state.desiredY = y;
    if (!wait) return;
    let guard = 0;
    while (guard < 50) {
      assertToken(token);
      if (!state.autoScroll || performance.now() < state.userHold) return;
      if (Math.abs(window.scrollY - y) < 10 || inView(el)) return;
      if (state.desiredY > y + 16) return;
      await sleep(32, token);
      guard += 1;
    }
  }

  async function withLock(el, token, fn) {
    while (el && locks.get(el)) await sleep(20, token);
    if (el) locks.set(el, true);
    try {
      return await fn();
    } finally {
      if (el) locks.delete(el);
    }
  }

  function caretPoint(host, typed) {
    const node = typed.firstChild;
    if (node && node.nodeType === 3 && node.length) {
      const range = document.createRange();
      range.setStart(node, node.length);
      range.collapse(true);
      const rect = range.getClientRects()[0];
      if (rect && (rect.top || rect.left || rect.height)) return { x: rect.right || rect.left, y: rect.top };
    }
    const rect = host.getBoundingClientRect();
    const align = getComputedStyle(host).textAlign;
    let x = rect.left + 6;
    if (align === "center") x = rect.left + rect.width / 2;
    if (align === "right") x = rect.right - 8;
    return { x, y: rect.top + 8 };
  }

  function ripple(x, y, color) {
    const dot = document.createElement("span");
    dot.className = "ripple";
    dot.style.left = x + "px";
    dot.style.top = y + "px";
    dot.style.color = color;
    ui.root.appendChild(dot);
    setTimeout(() => dot.remove(), 500);
  }

  function styleCaption(atom) {
    switch (atom.kind) {
      case "button":
        return "round control";
      case "card":
        return "tile surface";
      case "skill":
        return "chip radius 20px";
      case "headline":
        return "display type";
      case "tagline":
        return "muted foreground";
      case "link":
        return "link color";
      case "heading":
        return "heading scale";
      default:
        return "color and type";
    }
  }

  function hrefCaption(el) {
    const href = el.getAttribute("href") || "";
    if (href.startsWith("mailto:")) return "mailto";
    if (href.length > 32) return href.slice(0, 30) + "…";
    return href || "link";
  }

  async function place(el, token) {
    if (!alive(el)) {
      log("layout", "Skipped a missing element.");
      return;
    }
    await withLock(el, token, async () => {
      const cursor = cursors.layout;
      await scrollInto(el, token, true);
      assertToken(token);
      cursor.caption("translateY → 0");
      cursor.down(true);
      cursor.holdOn(el, 0.12, 0.28);
      showRing("layout", el);
      await sleep(state.reduce ? 40 : 160, token);
      el.style.opacity = "1";
      el.style.transform = "translateY(0px)";
      await sleep(state.reduce ? 40 : 380, token);
      el.style.transform = "";
      cursor.down(false);
      hideRing("layout");
    });
  }

  async function typeInto(el, token) {
    if (!alive(el)) {
      log("content", "Skipped a missing text target.");
      return;
    }
    await withLock(el, token, async () => {
      const typed = el.querySelector(":scope > .sim-typed");
      const text = el.dataset.simText || "";
      if (!typed) {
        log("content", "Could not attach a typing layer. Leaving the original text.");
        return;
      }
      const cursor = cursors.content;
      await scrollInto(el, token, false);
      cursor.caption("typing");
      showRing("content", el);
      el.classList.add("is-typing");
      typed.textContent = "";
      const parts = text.split(/(\s+)/).filter((part) => part.length);
      const words = parts.filter((part) => part.trim()).length;
      const step = words > 48 ? 14 : 32;
      for (const part of parts) {
        assertToken(token);
        typed.textContent += part;
        const point = caretPoint(el, typed);
        cursor.moveTo(point.x + 2, point.y + 2);
        if (part.trim()) await sleep(state.reduce ? 8 : step, token);
      }
      if (typed.textContent !== text) typed.textContent = text;
      el.classList.remove("is-typing");
      hideRing("content");
    });
  }

  async function paint(atom, token) {
    const el = atom.el;
    if (!alive(el)) {
      log("design", "Skipped styling a missing element.");
      return;
    }
    await withLock(el, token, async () => {
      const cursor = cursors.design;
      await scrollInto(el, token, false);
      cursor.holdOn(el, 0.82, 0.25);
      cursor.caption(styleCaption(atom));
      showRing("design", el);
      await sleep(state.reduce ? 30 : 160, token);
      el.classList.remove("sim-raw");
      atom.textEls.forEach((textEl) => textEl.classList.remove("sim-raw"));
      await sleep(state.reduce ? 30 : 240, token);
      if (atom.bug === "contrast") {
        el.style.color = "#d6d3d1";
        el.dataset.simBug = "contrast";
        cursor.caption("color #d6d3d1");
        await sleep(180, token);
      }
      if (atom.bug === "padding") {
        el.style.padding = "0.28rem 0.5rem";
        el.dataset.simBug = "padding";
        cursor.caption("padding 0.28rem 0.5rem");
        await sleep(180, token);
      }
      if (atom.bug === "shift") {
        el.style.transform = "translateX(28px)";
        el.dataset.simBug = "shift";
        cursor.caption("translateX(28px)");
        await sleep(200, token);
      }
      hideRing("design");
    });
  }

  async function paintFrame(section, token) {
    const el = section.root;
    if (!alive(el)) return;
    const cursor = cursors.design;
    await scrollInto(el, token, false);
    cursor.holdOn(el, 0.08, 0.35);
    cursor.caption("frame");
    showRing("design", el);
    await sleep(180, token);
    el.classList.remove("sim-frame");
    await sleep(240, token);
    hideRing("design");
  }

  async function wire(el, token) {
    if (!alive(el)) {
      log("interaction", "Skipped a missing control.");
      return;
    }
    await withLock(el, token, async () => {
      const cursor = cursors.interaction;
      await scrollInto(el, token, false);
      cursor.caption(hrefCaption(el));
      cursor.holdOn(el, 0.45, 0.55);
      showRing("interaction", el);
      await sleep(140, token);
      cursor.click();
      const rect = el.getBoundingClientRect();
      ripple(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, cursor.color);
      el.classList.add("sim-hot");
      await sleep(240, token);
      el.classList.remove("sim-hot");
      hideRing("interaction");
    });
  }

  async function surveyRun(token) {
    document.documentElement.classList.add("sim-survey");
    for (const section of model.sections) {
      assertToken(token);
      state.section = section.name;
      updateHud();
      section.root.classList.add("is-active");
      await scrollInto(section.root, token, true);
      const cursor = cursors.architect;
      showRing("architect", section.root);
      cursor.caption(section.name.toLowerCase());
      cursor.holdOn(section.root, 0.18, 0.22);
      await sleep(state.reduce ? 60 : 260, token);
      section.root.classList.remove("is-active");
    }
    hideRing("architect");
    log("architect", "Plan locked: " + model.sections.map((section) => section.name).join(" → "));
    state.section = model.sections.length ? model.sections[0].name : "Blueprint";
    updateHud();
    state.desiredY = 0;
    if (state.autoScroll) {
      let guard = 0;
      while (window.scrollY > 8 && guard < 50) {
        assertToken(token);
        if (!state.autoScroll) break;
        await sleep(32, token);
        guard += 1;
      }
    }
    document.documentElement.classList.remove("sim-survey");
  }

  async function analyzeRun(section, token) {
    state.section = section.name;
    updateHud();
    section.root.classList.add("is-active");
    await scrollInto(section.root, token, true);
    const cursor = cursors.architect;
    showRing("architect", section.root);
    cursor.caption("structure");
    const start = section.root.getBoundingClientRect();
    cursor.moveTo(start.left + 24, start.top + 20);
    await sleep(150, token);
    const end = section.root.getBoundingClientRect();
    cursor.moveTo(Math.max(end.left + 20, end.right - 28), Math.min(end.bottom - 12, end.top + 72));
    await sleep(150, token);
    const skills = section.atoms.filter((atom) => atom.kind === "skill").length;
    const detail = skills ? ` ${skills} skill chips.` : "";
    log("architect", `${section.name}: ${section.summary}.${detail} ${section.atoms.length} build targets, rooted at ${describe(section.root)}.`);
    hideRing("architect");
  }

  async function review(section, token) {
    const el = section.root;
    if (!alive(el)) {
      log("qa", `Skipped review of ${section.name}. The region is missing.`);
      return;
    }
    const cursor = cursors.qa;
    cursor.caption("measure");
    await scrollInto(el, token, true);
    showRing("qa", el);
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      assertToken(token);
      const box = el.getBoundingClientRect();
      cursor.moveTo(box.left + 18, box.top + (box.height * i) / steps);
      await sleep(state.reduce ? 30 : 80, token);
    }
    const box = el.getBoundingClientRect();
    log("qa", `${section.name} measures ${Math.round(box.width)}×${Math.round(box.height)}px.`);
    section.atoms.forEach((atom) => {
      if (!alive(atom.el)) return;
      const rect = atom.el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        log("qa", `Collapsed box on ${atom.name}. Clearing stuck inline layout.`);
        atom.el.style.transform = "";
        atom.el.style.opacity = "";
        atom.el.style.padding = "";
      }
    });
    if (section.chips) {
      const chips = [...el.querySelectorAll(section.chips)];
      if (chips.length > 1) {
        const rows = new Set(chips.map((chip) => chip.offsetTop)).size;
        log("qa", rows > 1 ? `Chips wrap across ${rows} rows at this width.` : "Chips fit on a single row.");
      }
    }
    const bugs = [...el.querySelectorAll("[data-sim-bug]")];
    if (!bugs.length) {
      log("qa", `${section.name} alignment and contrast look consistent.`);
    }
    bugs.forEach((node) => {
      const kind = node.dataset.simBug;
      const name = node.dataset.simName || describe(node);
      if (kind === "shift") log("qa", `${name} sits 28px off the grid. Sending it back to Layout.`);
      if (kind === "padding") log("qa", `${name} padding is tighter than the spacing scale. Sending it back to Layout.`);
      if (kind === "contrast") log("qa", `${name} contrast is too low against its background. Sending it back to Design.`);
    });
    if (section.id === "footer") {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      if (overflow > 2) {
        log("qa", `Page overflows horizontally by ${Math.round(overflow)}px. Clearing stray transforms.`);
        document.querySelectorAll(".sim-unit").forEach((node) => {
          if (node.style.transform) node.style.transform = "";
        });
      } else {
        log("qa", `No horizontal overflow at ${window.innerWidth}px.`);
      }
    }
    hideRing("qa");
  }

  async function fixLayout(section, token) {
    const nodes = [...section.root.querySelectorAll('[data-sim-bug="padding"], [data-sim-bug="shift"]')];
    if (!nodes.length) return;
    const cursor = cursors.layout;
    for (const el of nodes) {
      assertToken(token);
      await scrollInto(el, token, true);
      cursor.holdOn(el, 0.2, 0.4);
      cursor.down(true);
      showRing("layout", el);
      if (el.dataset.simBug === "padding") {
        cursor.caption("padding → scale");
        el.style.padding = "";
        log("layout", `Restored padding on ${el.dataset.simName || "the control"}.`);
      } else {
        cursor.caption("translateX → 0");
        el.style.transform = "translateX(0px)";
        log("layout", `Nudged ${el.dataset.simName || "the card"} back onto the grid.`);
      }
      await sleep(state.reduce ? 40 : 420, token);
      el.style.transform = el.dataset.simBug === "shift" ? "" : el.style.transform;
      if (el.dataset.simBug === "shift") el.style.transform = "";
      delete el.dataset.simBug;
      cursor.down(false);
    }
    hideRing("layout");
  }

  async function fixContrast(section, token) {
    const nodes = [...section.root.querySelectorAll('[data-sim-bug="contrast"]')];
    if (!nodes.length) return;
    const cursor = cursors.design;
    for (const el of nodes) {
      assertToken(token);
      await scrollInto(el, token, true);
      cursor.holdOn(el, 0.7, 0.3);
      cursor.caption("color → muted");
      showRing("design", el);
      el.style.color = "";
      delete el.dataset.simBug;
      log("design", `Restored the muted tagline color on ${el.dataset.simName || "the text"}.`);
      await sleep(state.reduce ? 40 : 360, token);
    }
    hideRing("design");
  }

  function signOff(section) {
    section.root.classList.add("is-built");
    section.root.classList.remove("is-active");
    hideRing("qa");
  }

  function writingLabel(atom, textEl) {
    if (atom.kind === "skill") return `Writing “${atom.name}”`;
    if (atom.kind === "prose") return `Writing ${atom.name}`;
    if (textEl !== atom.el) {
      const snippet = shortText(textEl);
      if (textEl.tagName === "A") return `Writing “${snippet || atom.name}”`;
      if (snippet && snippet.length < 48) return `Writing “${snippet}”`;
    }
    return `Writing ${atom.name}`;
  }

  function buildTasks() {
    const tasks = [];
    const add = (agent, label, deps, run, extra) => {
      const task = {
        agent,
        label,
        deps,
        run,
        done: false,
        started: false,
        quiet: false,
        mode: "Working",
        ...(extra || {}),
      };
      tasks.push(task);
      return task;
    };

    const survey = add("architect", "Mapping the page from top to bottom", [], (token) => surveyRun(token), {
      mode: "Analyzing",
    });
    let previous = survey;

    model.sections.forEach((section) => {
      const analyze = add("architect", `Analyzing ${section.name}`, [previous], (token) => analyzeRun(section, token), {
        mode: "Analyzing",
      });
      let prevLayout = analyze;
      let prevContent = analyze;
      const designTasks = [];
      const interactTasks = [];

      section.atoms.forEach((atom) => {
        const layoutTask = add("layout", `Placing ${atom.name}`, [prevLayout], (token) => place(atom.el, token), {
          quiet: atom.quiet,
        });
        prevLayout = layoutTask;
        let prevText = layoutTask;
        const textTasks = [];
        atom.textEls.forEach((textEl) => {
          const contentTask = add(
            "content",
            writingLabel(atom, textEl),
            [prevText, prevContent],
            (token) => typeInto(textEl, token),
            { quiet: atom.quiet }
          );
          prevText = contentTask;
          prevContent = contentTask;
          textTasks.push(contentTask);
        });
        const designTask = add(
          "design",
          `Styling ${atom.name}`,
          [textTasks.length ? textTasks[textTasks.length - 1] : layoutTask],
          (token) => paint(atom, token),
          { quiet: atom.quiet }
        );
        designTasks.push(designTask);
        atom.interactEls.forEach((link) => {
          const label = shortText(link) || atom.name;
          interactTasks.push(
            add("interaction", `Wiring ${label}`, [designTask], (token) => wire(link, token))
          );
        });
      });

      let beforeQa = [...designTasks, ...interactTasks];
      if (section.frame) {
        const chrome = add("design", `Finishing the ${section.name} frame`, designTasks.length ? designTasks : [analyze], (token) =>
          paintFrame(section, token)
        );
        beforeQa.push(chrome);
      }
      if (!beforeQa.length) beforeQa = [analyze];

      const inspect = add("qa", `Reviewing ${section.name}`, beforeQa, (token) => review(section, token), {
        mode: "Reviewing",
      });
      const fixes = [inspect];
      const bugs = new Set(section.atoms.map((atom) => atom.bug).filter(Boolean));
      if (bugs.has("padding") || bugs.has("shift")) {
        fixes.push(add("layout", `Correcting ${section.name} alignment`, [inspect], (token) => fixLayout(section, token)));
      }
      if (bugs.has("contrast")) {
        fixes.push(add("design", `Correcting ${section.name} contrast`, [inspect], (token) => fixContrast(section, token)));
      }
      previous = add("qa", `Signing off ${section.name}`, fixes, async (token) => {
        assertToken(token);
        const cursor = cursors.qa;
        cursor.caption("pass");
        cursor.holdOn(section.root, 0.5, 0.12);
        await sleep(160, token);
        signOff(section);
      }, { mode: "Reviewing" });
    });

    return tasks;
  }

  async function agentLoop(agentId, tasks, token) {
    const mine = tasks.filter((task) => task.agent === agentId);
    while (true) {
      assertToken(token);
      if (state.paused) {
        await sleep(50, token);
        continue;
      }
      const next = mine.find((task) => !task.started && !task.done && task.deps.every((dep) => dep.done));
      if (!next) {
        if (mine.every((task) => task.done)) break;
        const waiting = mine.some((task) => !task.done);
        if (waiting) setStatus(agentId, "Idle", "Waiting for the previous step");
        await sleep(40, token);
        continue;
      }
      next.started = true;
      setStatus(agentId, next.mode, next.label);
      cursors[agentId].caption(next.label);
      if (!next.quiet) log(agentId, next.label);
      try {
        await next.run(token);
      } catch (error) {
        if (error instanceof Cancelled) throw error;
        console.warn(error);
        log(agentId, `Recovered and continued after “${next.label}”.`);
      }
      assertToken(token);
      next.done = true;
      state.completed += 1;
      updateHud();
    }
    setStatus(agentId, "Completed", "Finished");
    cursors[agentId].caption("");
    cursors[agentId].clearHold();
    hideRing(agentId);
    const index = AGENTS.findIndex((agent) => agent.id === agentId);
    cursors[agentId].moveTo(window.innerWidth - 24, 70 + index * 36);
  }

  async function runSimulation(token) {
    const tasks = buildTasks();
    state.total = tasks.length;
    state.completed = 0;
    updateHud();
    await Promise.all(AGENTS.map((agent) => agentLoop(agent.id, tasks, token)));
  }

  function finishClean() {
    if (state.cleaned) return;
    state.cleaned = true;
    markPlayed();
    restore();
    state.running = false;
    state.paused = false;
    state.finished = true;
    state.docked = true;
    state.desiredY = null;
    state.section = "Complete";
    if (state.total) state.completed = state.total;
    document.title = state.baseTitle;
    resetStatuses("Completed", "Finished");
    updateHud();
    log("qa", state.skipped
      ? "Skipped ahead. The finished portfolio is live and interactive."
      : "Build complete. The portfolio is live and interactive.");
  }

  function launch() {
    const token = ++state.token;
    state.skipped = false;
    chain = chain
      .catch(() => {})
      .then(async () => {
        if (token !== state.token) return;
        state.cleaned = false;
        state.finished = false;
        state.docked = false;
        state.paused = false;
        state.running = true;
        state.showCursors = true;
        document.title = "Building — " + state.baseTitle;
        ui.log.replaceChildren();
        prepare();
        window.scrollTo(0, 0);
        state.desiredY = 0;
        resetStatuses("Idle", "Waiting to start");
        setStatus("architect", "Analyzing", "Opening the blueprint");
        updateHud();
        log("architect", "Crew is on the page. Building from the existing DOM, top to bottom.");
        try {
          await runSimulation(token);
          if (token === state.token) finishClean();
        } catch (error) {
          if (error instanceof Cancelled) return;
          console.error(error);
          log("qa", "The build hit an unexpected error. Restoring the finished site.");
          if (token === state.token) finishClean();
        } finally {
          if (token === state.token) state.running = false;
          updateHud();
        }
      });
  }

  function onStart() {
    if (state.running) return;
    launch();
  }

  function onPause() {
    if (!state.running || state.paused) return;
    state.paused = true;
    updateHud();
    log("qa", "Playback paused.");
  }

  function onResume() {
    if (!state.running || !state.paused) return;
    state.paused = false;
    updateHud();
    log("qa", "Playback resumed.");
  }

  function onRestart() {
    launch();
  }

  function onSkip() {
    if (state.finished && !state.running) return;
    state.skipped = true;
    const token = ++state.token;
    chain = chain.catch(() => {}).then(() => {
      if (token !== state.token) return;
      finishClean();
    });
  }

  function setSpeed(value) {
    const allowed = [0.5, 1, 1.5, 2];
    if (!allowed.includes(value)) return;
    state.speed = value;
    applyChrome();
  }

  function park(snap) {
    const hero = document.querySelector("#tile-intro");
    const rect = hero ? hero.getBoundingClientRect() : { left: 80, top: 140, width: Math.min(640, window.innerWidth - 120), height: 220 };
    AGENTS.forEach((agent, index) => {
      const cursor = cursors[agent.id];
      const col = index % 3;
      const row = Math.floor(index / 3);
      cursor.clearHold();
      cursor.phase = index * 0.9;
      cursor.tx = rect.left + Math.max(80, rect.width) * (0.22 + col * 0.22);
      cursor.baseY = rect.top + rect.height * 0.38 + row * 58;
      cursor.ty = cursor.baseY;
      cursor.caption("");
      if (snap) {
        cursor.x = cursor.tx;
        cursor.y = cursor.ty;
      }
    });
  }

  function tickScroll() {
    if (!state.autoScroll || state.desiredY == null) return;
    if (state.paused || performance.now() < state.userHold) return;
    const current = window.scrollY;
    const delta = state.desiredY - current;
    if (Math.abs(delta) < 1) return;
    const rate = state.reduce ? 1 : Math.min(0.45, 0.14 * state.speed);
    state.lastProgrammatic = performance.now();
    window.scrollTo(0, current + delta * rate);
  }

  function tickRings() {
    Object.values(rings).forEach((ring) => {
      if (ring.el.hidden || !alive(ring.target)) return;
      const rect = ring.target.getBoundingClientRect();
      const pad = 5;
      ring.el.style.transform = `translate3d(${rect.left - pad}px, ${rect.top - pad}px, 0)`;
      ring.el.style.width = Math.max(0, rect.width + pad * 2) + "px";
      ring.el.style.height = Math.max(0, rect.height + pad * 2) + "px";
    });
  }

  function bindGlobal() {
    const holdScroll = () => {
      state.userHold = performance.now() + 1400;
    };
    window.addEventListener("wheel", holdScroll, { passive: true });
    window.addEventListener("touchmove", holdScroll, { passive: true });
    window.addEventListener("scroll", () => {
      if (performance.now() - state.lastProgrammatic > 80) holdScroll();
    }, { passive: true });
    // A click or tap anywhere on the page (outside the build controls)
    // skips the animation and shows the finished portfolio right away.
    window.addEventListener("pointerdown", (event) => {
      if (!state.running) return;
      const target = event.target;
      if (target && target.closest && target.closest("#agent-sim")) return;
      onSkip();
    }, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Space") return;
      const target = event.target;
      if (target && target.closest && target.closest("button, a, input, textarea")) return;
      if (!state.running) return;
      event.preventDefault();
      if (state.paused) onResume();
      else onPause();
    });
    window.addEventListener("resize", () => {
      if (!state.running) park(false);
    });
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(48, now - last);
      last = now;
      Object.values(cursors).forEach((cursor) => cursor.tick(dt));
      tickRings();
      tickScroll();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function init() {
    buildShell();
    bindGlobal();
    if (hasPlayed() && !forcePlay) {
      // Already seen: show the finished page, keep Replay available.
      document.documentElement.classList.remove("sim-boot");
      state.cleaned = true;
      state.finished = true;
      state.docked = true;
      state.section = "Complete";
      resetStatuses("Completed", "Finished");
      updateHud();
      log("architect", "Welcome back. Press Replay to watch the crew build the page again.");
      exposeApi();
      return;
    }
    prepare();
    document.documentElement.classList.remove("sim-boot");
    park(true);
    resetStatuses("Idle", "Standing by");
    updateHud();
    model.warnings.forEach((warning) => log("qa", warning));
    log("architect", "Blueprint ready. Start the crew to construct this page from top to bottom.");
    exposeApi();
    onStart();
  }

  function exposeApi() {
    window.__SIM = {
      start: onStart,
      pause: onPause,
      resume: onResume,
      restart: onRestart,
      skip: onSkip,
      setSpeed,
      get snapshot() {
        return {
          running: state.running,
          paused: state.paused,
          finished: state.finished,
          speed: state.speed,
          autoScroll: state.autoScroll,
          section: state.section,
          completed: state.completed,
          total: state.total,
          percent: percentValue(),
        };
      },
    };
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  } catch (error) {
    console.error(error);
    document.documentElement.classList.remove("sim-boot", "sim-live");
  }
})();
