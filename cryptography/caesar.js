"use strict";

/* ============================================================
   Caesar Cipher Lab — Caesar Cipher tab (cipher wheel)
   ============================================================ */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function mod26(n) { return ((n % 26) + 26) % 26; }

/** Shift every A–Z / a–z letter by `key`, preserving case; everything else
 *  passes through unchanged. Decrypting is just shifting by -key. */
function caesarShift(text, key) {
  let out = "";
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) out += String.fromCharCode(65 + mod26(c - 65 + key));
    else if (c >= 97 && c <= 122) out += String.fromCharCode(97 + mod26(c - 97 + key));
    else out += ch;
  }
  return out;
}

/** Index 0–25 of a letter, or -1 if `ch` isn't an English letter. */
function letterIndex(ch) {
  const c = ch.toUpperCase().charCodeAt(0);
  return c >= 65 && c <= 90 ? c - 65 : -1;
}

/** Render text as spans so individual letters can be hover-linked to the
 *  wheel. `data-p` / `data-c` carry the plaintext / ciphertext letter index. */
function renderLinkedText(container, text, key, textIsPlain) {
  container.innerHTML = "";
  const frag = document.createDocumentFragment();
  let run = "";
  const flush = () => { if (run) { frag.appendChild(document.createTextNode(run)); run = ""; } };
  for (const ch of text) {
    const i = letterIndex(ch);
    if (i < 0) { run += ch; continue; }
    flush();
    const span = document.createElement("span");
    span.className = "lt";
    span.textContent = ch;
    span.dataset.p = textIsPlain ? i : mod26(i - key);
    span.dataset.c = textIsPlain ? mod26(i + key) : i;
    frag.appendChild(span);
  }
  flush();
  container.appendChild(frag);
}

(function () {
  const els = {
    wheel: document.getElementById("wheel"),
    keyValue: document.getElementById("key-value"),
    slider: document.getElementById("key-slider"),
    up: document.getElementById("key-up"),
    down: document.getElementById("key-down"),
    mapping: document.getElementById("mapping"),
    info: document.getElementById("caesar-info"),
    input: document.getElementById("caesar-input"),
    inputLabel: document.getElementById("caesar-input-label"),
    output: document.getElementById("caesar-output"),
    outputLabel: document.getElementById("caesar-output-label"),
    copy: document.getElementById("copy-output"),
    send: document.getElementById("send-to-analysis")
  };
  if (!els.wheel) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const STEP = 360 / 26;
  const C = 200;
  const R_OUTER_OUT = 194, R_OUTER_IN = 152, R_INNER_IN = 96;
  const R_PLAIN_TEXT = 173, R_CIPHER_TEXT = 128;

  let key = 3;
  let mode = "encrypt";
  let rotation = -key * STEP; // inner-ring rotation in degrees
  let innerGroup = null;
  const plainLabels = [], cipherLabels = [], plainSectors = [], cipherSectors = [];
  const mapPlain = [], mapCipher = [];

  function el(tag, attrs, parent) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function polar(r, deg) {
    const a = (deg - 90) * Math.PI / 180; // 0° = straight up
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  }

  /** Annular wedge centered on angle `deg`, one letter wide. */
  function sectorPath(rIn, rOut, deg) {
    const a0 = deg - STEP / 2, a1 = deg + STEP / 2;
    const [x0, y0] = polar(rOut, a0), [x1, y1] = polar(rOut, a1);
    const [x2, y2] = polar(rIn, a1), [x3, y3] = polar(rIn, a0);
    return `M${x0},${y0} A${rOut},${rOut} 0 0 1 ${x1},${y1} L${x2},${y2} A${rIn},${rIn} 0 0 0 ${x3},${y3} Z`;
  }

  function buildWheel() {
    const svg = els.wheel;
    svg.innerHTML = "";

    // Outer (plaintext) ring — fixed.
    el("circle", { cx: C, cy: C, r: R_OUTER_OUT, class: "ring-outer" }, svg);
    for (let i = 0; i < 26; i++) {
      const deg = i * STEP;
      plainSectors[i] = el("path", { d: sectorPath(R_OUTER_IN, R_OUTER_OUT, deg), class: "sector", "data-p": i }, svg);
      const [x, y] = polar(R_PLAIN_TEXT, deg);
      const t = el("text", { x, y, class: "wl plain", "data-p": i,
        transform: `rotate(${deg} ${x} ${y})` }, svg);
      t.textContent = ALPHABET[i].toLowerCase();
      plainLabels[i] = t;
    }

    // Inner (ciphertext) ring — rotates as one group.
    innerGroup = el("g", { class: "inner-ring" }, svg);
    el("circle", { cx: C, cy: C, r: R_OUTER_IN - 2, class: "ring-inner" }, innerGroup);
    for (let j = 0; j < 26; j++) {
      const deg = j * STEP;
      cipherSectors[j] = el("path", { d: sectorPath(R_INNER_IN, R_OUTER_IN - 2, deg), class: "sector", "data-c": j }, innerGroup);
      const [x, y] = polar(R_CIPHER_TEXT, deg);
      const t = el("text", { x, y, class: "wl cipher", "data-c": j,
        transform: `rotate(${deg} ${x} ${y})` }, innerGroup);
      t.textContent = ALPHABET[j];
      cipherLabels[j] = t;
    }
    // A notch on the inner ring under its "A" so the shift is visible at a glance.
    const [nx, ny] = polar(R_INNER_IN + 8, 0);
    el("circle", { cx: nx, cy: ny, r: 3.5, class: "notch" }, innerGroup);

    // Hub.
    el("circle", { cx: C, cy: C, r: R_INNER_IN - 4, class: "hub" }, svg);
    const k1 = el("text", { x: C, y: C - 16, class: "hub-k" }, svg);
    k1.textContent = "KEY";
    const k2 = el("text", { x: C, y: C + 22, class: "hub-v", id: "hub-value" }, svg);
    k2.textContent = String(key);
    const k3 = el("text", { x: C, y: C + 46, class: "hub-k" }, svg);
    k3.id = "hub-example";

    applyRotation(false);
  }

  function buildMapping() {
    els.mapping.innerHTML = "";
    // Two 13-letter halves, each a plaintext row directly above its ciphertext row.
    for (const start of [0, 13]) {
      const block = document.createElement("div");
      block.className = "map-block";
      block.insertAdjacentHTML("beforeend", '<span class="map-label">Plain</span>');
      for (let i = start; i < start + 13; i++) {
        const p = document.createElement("span");
        p.className = "unit map-cell";
        p.dataset.p = i;
        p.textContent = ALPHABET[i].toLowerCase();
        block.appendChild(p);
        mapPlain[i] = p;
      }
      block.insertAdjacentHTML("beforeend", '<span class="map-label">Cipher</span>');
      for (let i = start; i < start + 13; i++) {
        const c = document.createElement("span");
        c.className = "unit map-cell cipher";
        c.dataset.p = i;
        block.appendChild(c);
        mapCipher[i] = c;
      }
      els.mapping.appendChild(block);
    }
  }

  function applyRotation(animate) {
    innerGroup.classList.toggle("animate", !!animate);
    innerGroup.setAttribute("transform", `rotate(${rotation} ${C} ${C})`);
  }

  function setKey(k, animate = true) {
    k = mod26(k);
    // Rotate the short way round to the target so a 25→0 step doesn't spin a full turn.
    const target = -k * STEP;
    let delta = ((target - rotation) % 360 + 540) % 360 - 180;
    rotation += delta;
    key = k;
    applyRotation(animate);
    update();
  }

  function update() {
    els.keyValue.textContent = String(key);
    els.slider.value = String(key);
    els.wheel.setAttribute("aria-valuenow", String(key));
    els.wheel.setAttribute("aria-valuetext", `Key ${key}: a becomes ${ALPHABET[key]}`);
    const hubV = document.getElementById("hub-value");
    if (hubV) hubV.textContent = String(key);
    const hubEx = document.getElementById("hub-example");
    if (hubEx) hubEx.textContent = `a → ${ALPHABET[key]}`;
    for (let i = 0; i < 26; i++) mapCipher[i].textContent = ALPHABET[mod26(i + key)];
    renderText();
  }

  function renderText() {
    const enc = mode === "encrypt";
    const text = els.input.value;
    const out = caesarShift(text, enc ? key : -key);
    // The wheel follows the classic convention (plaintext lower case,
    // CIPHERTEXT UPPER CASE); the text output keeps the input's case.
    renderLinkedText(els.output, out, key, !enc);
    els.output.classList.toggle("plain", !enc);
    els.output.dataset.raw = out;
  }

  /* ---------- Hover highlighting (wheel ↔ mapping ↔ text) ---------- */

  function clearHighlight() {
    document.querySelectorAll("#tab-caesar .hl").forEach(n => n.classList.remove("hl"));
    els.info.classList.add("info-empty");
    els.info.innerHTML = '<span class="info-hint">Hover any letter to see its mapping.</span>';
  }

  function highlight(p) {
    clearHighlight();
    const c = mod26(p + key);
    [plainSectors[p], plainLabels[p], cipherSectors[c], cipherLabels[c], mapPlain[p], mapCipher[p]]
      .forEach(n => n.classList.add("hl"));
    document.querySelectorAll(`#tab-caesar .lt[data-p="${p}"]`).forEach(n => n.classList.add("hl"));
    els.info.classList.remove("info-empty");
    els.info.innerHTML =
      `<div class="info-item"><span class="k">Plaintext</span><span class="v glyph">${ALPHABET[p].toLowerCase()}</span></div>` +
      `<div class="info-item"><span class="k">Ciphertext</span><span class="v glyph">${ALPHABET[c]}</span></div>` +
      `<div class="info-item"><span class="k">Arithmetic</span><span class="v">(${p} + ${key}) mod 26 = ${c}</span></div>`;
  }

  function hoverTarget(e) {
    const t = e.target.closest("[data-p], [data-c]");
    if (!t) return null;
    if (t.dataset.p !== undefined) return Number(t.dataset.p);
    return mod26(Number(t.dataset.c) - key);
  }

  document.getElementById("tab-caesar").addEventListener("mouseover", e => {
    if (dragging) return;
    const p = hoverTarget(e);
    if (p === null) clearHighlight(); else highlight(p);
  });
  document.getElementById("tab-caesar").addEventListener("mouseleave", clearHighlight);

  /* ---------- Dragging the inner ring ---------- */

  let dragging = false, lastAngle = 0;

  function pointerAngle(e) {
    const r = els.wheel.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  els.wheel.addEventListener("pointerdown", e => {
    const r = els.wheel.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) * (400 / r.width);
    if (dist > R_OUTER_IN || dist < R_INNER_IN - 4) return; // only the inner ring is grabbable
    dragging = true;
    lastAngle = pointerAngle(e);
    els.wheel.setPointerCapture(e.pointerId);
    els.wheel.classList.add("dragging");
    clearHighlight();
    e.preventDefault();
  });

  els.wheel.addEventListener("pointermove", e => {
    if (!dragging) return;
    const a = pointerAngle(e);
    let d = a - lastAngle;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastAngle = a;
    rotation += d;
    applyRotation(false);
    const k = mod26(Math.round(-rotation / STEP));
    if (k !== key) { key = k; update(); }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    els.wheel.classList.remove("dragging");
    setKey(mod26(Math.round(-rotation / STEP)), true); // snap to the nearest letter
  }
  els.wheel.addEventListener("pointerup", endDrag);
  els.wheel.addEventListener("pointercancel", endDrag);

  els.wheel.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { setKey(key + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setKey(key - 1); e.preventDefault(); }
  });

  /* ---------- Controls ---------- */

  els.slider.addEventListener("input", () => setKey(Number(els.slider.value)));
  els.up.addEventListener("click", () => setKey(key + 1));
  els.down.addEventListener("click", () => setKey(key - 1));
  els.input.addEventListener("input", renderText);

  document.querySelectorAll("#tab-caesar .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === mode) return;
      // Swap: the current output becomes the new input, so students can
      // round-trip a message and see it come back unchanged.
      const carry = els.output.dataset.raw || "";
      mode = btn.dataset.mode;
      document.querySelectorAll("#tab-caesar .seg-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      const enc = mode === "encrypt";
      els.inputLabel.textContent = enc ? "Plaintext" : "Ciphertext";
      els.outputLabel.textContent = enc ? "Ciphertext" : "Plaintext";
      els.input.placeholder = enc ? "Type a message here..." : "Paste ciphertext here...";
      els.input.value = carry;
      renderText();
    });
  });

  els.copy.addEventListener("click", () => {
    navigator.clipboard?.writeText(els.output.dataset.raw || "").then(() => {
      els.copy.classList.add("copied");
      els.copy.textContent = "Copied";
      setTimeout(() => { els.copy.classList.remove("copied"); els.copy.textContent = "Copy"; }, 1200);
    }).catch(() => {});
  });

  els.send.addEventListener("click", () => {
    const ciphertext = mode === "encrypt" ? (els.output.dataset.raw || "") : els.input.value;
    document.dispatchEvent(new CustomEvent("cs160:analyze", { detail: { text: ciphertext, key } }));
    document.querySelector('.tab-btn[data-tab="analysis"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Tabs ---------- */

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-panel").forEach(p => p.setAttribute("hidden", ""));
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const panel = document.getElementById("tab-" + btn.dataset.tab);
      if (panel) panel.removeAttribute("hidden");
    });
  });

  /* ---------- Init ---------- */

  buildWheel();
  buildMapping();
  update();
})();
